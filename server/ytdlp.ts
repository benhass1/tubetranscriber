import { spawn } from "child_process";
import { mkdtemp, readFile, readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import type { TranscriptSegment } from "@shared/transcript";

type Json3Event = { tStartMs?: number; dDurationMs?: number; segs?: Array<{ utf8?: string }> };
type Json3Payload = { events?: Json3Event[] };

export class YouTubeRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouTubeRateLimitError";
  }
}

export function isYtDlpRateLimited(stderr: string) {
  return /\b(?:http\s+error\s+)?429\b|too many requests|rate limit/i.test(stderr);
}

export function parseJson3Transcript(payload: Json3Payload): TranscriptSegment[] {
  return (payload.events ?? []).flatMap(event => {
    const text = (event.segs ?? []).map(segment => segment.utf8 ?? "").join("").replace(/\s+/g, " ").trim();
    if (!text) return [];
    return [{
      start: Math.max(0, Number(event.tStartMs) || 0) / 1000,
      duration: Math.max(0.5, Number(event.dDurationMs) || 0) / 1000,
      text,
    }];
  });
}

function runYtDlp(args: string[]) {
  return new Promise<{ code: number | null; stderr: string }>((resolve, reject) => {
    const child = spawn("yt-dlp", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    const timeout = setTimeout(() => child.kill("SIGKILL"), 75000);
    child.stderr?.on("data", chunk => { stderr += chunk.toString(); });
    child.once("error", error => { clearTimeout(timeout); reject(error); });
    child.once("close", code => {
      clearTimeout(timeout);
      resolve({ code, stderr });
    });
  });
}

export async function extractWithYtDlp(videoId: string): Promise<TranscriptSegment[]> {
  const workdir = await mkdtemp(join(tmpdir(), "tubetranscriber-"));
  try {
    const result = await runYtDlp([
      // YouTube now requires its JavaScript challenge solver for reliable cloud
      // extraction. Node 22 is present in the production image, and the Docker
      // image installs the matching EJS and curl-cffi dependencies for yt-dlp.
      "--js-runtimes", "node", "--impersonate", "chrome",
      "--no-playlist", "--skip-download", "--write-subs", "--write-auto-subs",
      "--sub-langs", "en", "--sub-format", "json3",
      "--output", join(workdir, "captions.%(ext)s"),
      `https://www.youtube.com/watch?v=${videoId}`,
    ]);
    const files = await readdir(workdir);
    const subtitleFile = files.find(file => file.endsWith(".json3"));
    if (!subtitleFile) {
      if (result.code !== 0) {
        const detail = result.stderr.slice(-800) || "yt-dlp did not return a subtitle track";
        if (isYtDlpRateLimited(detail)) throw new YouTubeRateLimitError(detail);
        throw new Error(detail);
      }
      return [];
    }
    const payload = JSON.parse(await readFile(join(workdir, subtitleFile), "utf8")) as Json3Payload;
    return parseJson3Transcript(payload);
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}
