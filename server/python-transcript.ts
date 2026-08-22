import { spawn } from "child_process";
import { resolve } from "path";
import type { TranscriptSegment } from "@shared/transcript";

type PythonTranscriptPayload = {
  ok: boolean;
  kind?: "video_unavailable" | "no_captions" | "restricted" | "upstream_error" | "invalid_video_id";
  message?: string;
  segments?: Array<{ text?: unknown; start?: unknown; duration?: unknown }>;
};

export class YouTubeCaptionsUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouTubeCaptionsUnavailableError";
  }
}

export class YouTubeCaptionAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouTubeCaptionAccessError";
  }
}

export class YouTubeVideoUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouTubeVideoUnavailableError";
  }
}

export function normalizePythonSegments(raw: NonNullable<PythonTranscriptPayload["segments"]>): TranscriptSegment[] {
  return raw.flatMap(item => {
    const text = String(item.text ?? "").replace(/\s+/g, " ").trim();
    if (!text) return [];
    return [{
      text,
      start: Math.max(0, Number(item.start) || 0),
      duration: Math.max(0.5, Number(item.duration) || 0),
    }];
  });
}

export function errorFromPythonPayload(payload: PythonTranscriptPayload): Error {
  const message = payload.message?.trim() || "The YouTube caption service did not return a transcript.";
  if (payload.kind === "video_unavailable") return new YouTubeVideoUnavailableError(message);
  if (payload.kind === "no_captions") return new YouTubeCaptionsUnavailableError(message);
  return new YouTubeCaptionAccessError(message);
}

function runPythonTranscript(videoId: string) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolveResult, reject) => {
    const scriptPath = resolve(process.cwd(), "server", "python_transcript.py");
    const child = spawn("python3", [scriptPath, videoId], {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => child.kill("SIGKILL"), 25_000);
    child.stdout?.on("data", chunk => { stdout += chunk.toString(); });
    child.stderr?.on("data", chunk => { stderr += chunk.toString(); });
    child.once("error", error => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", code => {
      clearTimeout(timeout);
      resolveResult({ code, stdout, stderr });
    });
  });
}

export async function extractWithPythonTranscript(videoId: string): Promise<TranscriptSegment[]> {
  let result: Awaited<ReturnType<typeof runPythonTranscript>>;
  try {
    result = await runPythonTranscript(videoId);
  } catch (error) {
    throw new YouTubeCaptionAccessError(error instanceof Error ? error.message : "Python caption adapter could not start.");
  }

  let payload: PythonTranscriptPayload;
  try {
    payload = JSON.parse(result.stdout) as PythonTranscriptPayload;
  } catch {
    const detail = (result.stderr || result.stdout).trim().slice(-1200);
    throw new YouTubeCaptionAccessError(detail || "Python caption adapter returned an unreadable response.");
  }

  if (!payload.ok || result.code !== 0) throw errorFromPythonPayload(payload);
  const segments = normalizePythonSegments(payload.segments ?? []);
  if (segments.length === 0) throw new YouTubeCaptionsUnavailableError("No public caption segments were returned.");
  return segments;
}
