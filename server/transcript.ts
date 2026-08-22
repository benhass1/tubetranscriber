import { TRPCError } from "@trpc/server";
import type { TranscriptSegment } from "@shared/transcript";
import { extractWithYtDlp, YouTubeRateLimitError, YouTubeUpstreamAccessError } from "./ytdlp";
import {
  extractWithPythonTranscript,
  YouTubeCaptionAccessError,
  YouTubeCaptionsUnavailableError,
  YouTubeVideoUnavailableError,
} from "./python-transcript";

export type VideoMetadata = {
  videoId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  durationSeconds: number | null;
};

export type ExtractedTranscript = { metadata: VideoMetadata; segments: TranscriptSegment[] };
const SUCCESS_CACHE_TTL_MS = 5 * 60 * 1000;
const successfulTranscriptCache = new Map<string, { expiresAt: number; result: ExtractedTranscript }>();

export function parseYoutubeId(value: string) {
  const candidate = value.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate;

  try {
    const url = new URL(candidate);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    let id = "";
    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      if (url.pathname === "/watch") id = url.searchParams.get("v") ?? "";
      else if (["/shorts", "/embed", "/live"].some(prefix => url.pathname.startsWith(prefix))) id = url.pathname.split("/").filter(Boolean)[1] ?? "";
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const fallback: VideoMetadata = {
    videoId,
    title: "YouTube video",
    channel: "YouTube",
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    durationSeconds: null,
  };

  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
    if (!response.ok) return fallback;
    const payload = await response.json() as { title?: string; author_name?: string; thumbnail_url?: string };
    return {
      ...fallback,
      title: payload.title?.trim() || fallback.title,
      channel: payload.author_name?.trim() || fallback.channel,
      thumbnailUrl: payload.thumbnail_url || fallback.thumbnailUrl,
    };
  } catch {
    return fallback;
  }
}

async function fetchVideoDuration(videoId: string) {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const markup = await response.text();
    const match = markup.match(/"lengthSeconds":"(\d+)"/);
    return match?.[1] ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

export function normalizeTranscript(raw: Array<{ text: string; offset: number; duration: number }>): TranscriptSegment[] {
  // The source serves its modern srv3 tracks in milliseconds and legacy tracks
  // in seconds. Track duration reliably identifies the millisecond format.
  const isMilliseconds = raw.some(item => Number(item.duration) > 120);
  const divisor = isMilliseconds ? 1000 : 1;
  return raw
    .map(item => ({ start: (Number(item.offset) || 0) / divisor, duration: (Number(item.duration) || 0) / divisor, text: item.text.replace(/\s+/g, " ").trim() }))
    .filter(item => item.text.length > 0);
}

export async function extractTranscript(url: string) {
  const videoId = parseYoutubeId(url);
  if (!videoId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Paste a valid YouTube video link, Short, embed link, or 11-character video ID." });
  }

  const cached = successfulTranscriptCache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) return cached.result;
  if (cached) successfulTranscriptCache.delete(videoId);

  const [oembedMetadata, pageDuration] = await Promise.all([fetchVideoMetadata(videoId), fetchVideoDuration(videoId)]);
  const metadata = { ...oembedMetadata, durationSeconds: pageDuration };
  let segments: TranscriptSegment[] = [];
  let pythonError: unknown;
  let ytDlpError: unknown;

  try {
    // Primary path: the maintained Python adapter reads the same publicly
    // available caption tracks exposed to the YouTube web client without a key.
    segments = await extractWithPythonTranscript(videoId);
  } catch (error) {
    pythonError = error;
    console.warn("[Transcript] Python caption adapter failed; trying yt-dlp fallback", error);
  }

  if (segments.length === 0) {
    try {
      segments = await extractWithYtDlp(videoId);
    } catch (error) {
      ytDlpError = error;
      console.warn("[Transcript] yt-dlp subtitle fallback failed", error);
    }
  }

  if (segments.length > 0) {
    const last = segments.at(-1);
    const result: ExtractedTranscript = { metadata: { ...metadata, durationSeconds: last ? last.start + last.duration : null }, segments };
    successfulTranscriptCache.set(videoId, { expiresAt: Date.now() + SUCCESS_CACHE_TTL_MS, result });
    return result;
  }

  if (pythonError instanceof YouTubeVideoUnavailableError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "This video is unavailable, private, or cannot be accessed." });
  }
  if (
    pythonError instanceof YouTubeCaptionAccessError ||
    ytDlpError instanceof YouTubeRateLimitError ||
    ytDlpError instanceof YouTubeUpstreamAccessError
  ) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "YouTube temporarily restricted automated caption retrieval from this service. Please try another video or try again later." });
  }
  if (pythonError instanceof YouTubeCaptionsUnavailableError || !ytDlpError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "No public captions are available for this video." });
  }

  console.error("[Transcript] Extraction did not complete", { pythonError, ytDlpError });
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Transcript retrieval did not complete. Please check the link and try again." });
}
