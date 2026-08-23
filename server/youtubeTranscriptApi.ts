import { spawn } from "node:child_process";
import { resolve } from "node:path";
import type { TranscriptSegment } from "@shared/transcript";

export class YouTubeTranscriptApiError extends Error {
  constructor(public readonly kind: string, message: string) {
    super(message);
    this.name = "YouTubeTranscriptApiError";
  }
}

type PythonResponse = {
  segments?: TranscriptSegment[];
  plainText?: string;
  kind?: string;
  message?: string;
};

// Docker preserves the source directory at /app/server while the bundled JS is
// emitted to /app/dist, so resolve from the process working directory.
const bridgePath = resolve(process.cwd(), "server", "python_transcript.py");

export function formatWorkerProxy(value = process.env.CF_WORKER_PROXY ?? "") {
  const proxy = value.trim();
  return proxy ? (proxy.endsWith("?url=") ? proxy : `${proxy}?url=`) : null;
}

export async function extractWithYouTubeTranscriptApi(videoId: string): Promise<TranscriptSegment[]> {
  return new Promise((resolve, reject) => {
    const child = spawn("python3", [bridgePath], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => child.kill("SIGKILL"), 30_000);

    child.stdout.on("data", chunk => { stdout += chunk.toString(); });
    child.stderr.on("data", chunk => { stderr += chunk.toString(); });
    child.once("error", error => { clearTimeout(timeout); reject(error); });
    child.once("close", code => {
      clearTimeout(timeout);
      let payload: PythonResponse | undefined;
      try { payload = JSON.parse(stdout) as PythonResponse; } catch { /* handled below */ }
      if (code === 0 && payload?.segments) {
        resolve(payload.segments);
        return;
      }
      if (payload?.message) {
        reject(new YouTubeTranscriptApiError(payload.kind ?? "upstream_error", payload.message));
        return;
      }
      reject(new YouTubeTranscriptApiError("upstream_error", stderr.trim() || "Transcript extraction failed."));
    });
    child.stdin.end(videoId);
  });
}
