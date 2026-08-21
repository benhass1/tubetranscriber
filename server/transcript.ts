import { YoutubeTranscript, YoutubeTranscriptDisabledError, YoutubeTranscriptNotAvailableError, YoutubeTranscriptTooManyRequestError, YoutubeTranscriptVideoUnavailableError } from "youtube-transcript";
import { TRPCError } from "@trpc/server";
import type { TranscriptSegment } from "@shared/transcript";
import { extractWithYtDlp } from "./ytdlp";

export type VideoMetadata = {
  videoId: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  durationSeconds: number | null;
};

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

  const [oembedMetadata, pageDuration] = await Promise.all([fetchVideoMetadata(videoId), fetchVideoDuration(videoId)]);
  const metadata = { ...oembedMetadata, durationSeconds: pageDuration };
  try {
    // Cloud deployment IPs are commonly rejected by the lightweight web-caption
    // client used during local development. The production image includes yt-dlp,
    // which uses YouTube's supported player profiles and subtitle files first.
    let segments: TranscriptSegment[] = [];
    if (process.env.NODE_ENV === "production") {
      try { segments = await extractWithYtDlp(videoId); }
      catch (error) { console.warn("[Transcript] yt-dlp fallback failed; trying direct captions", error); }
    }
    if (segments.length === 0) {
      const raw = await YoutubeTranscript.fetchTranscript(videoId);
      segments = normalizeTranscript(raw);
    }
    if (segments.length === 0) throw new YoutubeTranscriptNotAvailableError(videoId);
    const last = segments.at(-1);
    return { metadata: { ...metadata, durationSeconds: last ? last.start + last.duration : null }, segments };
  } catch (error) {
    if (error instanceof YoutubeTranscriptVideoUnavailableError) {
      throw new TRPCError({ code: "NOT_FOUND", message: "This video is unavailable, private, or cannot be accessed." });
    }
    if (error instanceof YoutubeTranscriptDisabledError || error instanceof YoutubeTranscriptNotAvailableError) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No captions are available for this video. Try another video or check whether subtitles are enabled." });
    }
    if (error instanceof YoutubeTranscriptTooManyRequestError) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "YouTube is temporarily limiting transcript requests. Please wait a moment and try again." });
    }
    console.error("[Transcript] Extraction failed", error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Transcript retrieval did not complete. Please check the link and try again." });
  }
}
