import { TRPCError } from "@trpc/server";
import type { TranscriptSegment } from "@shared/transcript";
import {
  extractWithYouTubeTranscriptApi,
  YouTubeTranscriptApiError,
} from "./youtubeTranscriptApi";

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

  try {
    const segments = await extractWithYouTubeTranscriptApi(videoId);
    if (segments.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No public captions are available for this video." });
    }
    const last = segments.at(-1);
    const result: ExtractedTranscript = { metadata: { ...metadata, durationSeconds: last ? last.start + last.duration : null }, segments };
    successfulTranscriptCache.set(videoId, { expiresAt: Date.now() + SUCCESS_CACHE_TTL_MS, result });
    return result;
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    if (error instanceof YouTubeTranscriptApiError) {
      if (error.kind === "video_unavailable") {
        throw new TRPCError({ code: "NOT_FOUND", message: error.message });
      }
      if (error.kind === "transcripts_disabled" || error.kind === "no_transcript" || error.kind === "no_captions") {
        throw new TRPCError({ code: "NOT_FOUND", message: "No public captions are available for this video." });
      }
      if (error.kind === "rate_limited") {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "YouTube is temporarily limiting transcript requests. Please wait a moment and try again." });
      }
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    }
    console.error("[Transcript] youtube-transcript-api extraction did not complete", error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Transcript retrieval did not complete. Please check the link and try again." });
  }
}
