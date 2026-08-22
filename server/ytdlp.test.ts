import { describe, expect, it } from "vitest";
import {
  isYtDlpRateLimited,
  isYtDlpVideoUnavailable,
  parseJson3Transcript,
  YouTubeUpstreamAccessError,
  YouTubeVideoUnavailableError,
} from "./ytdlp";

describe("yt-dlp transcript adapter", () => {
  it("converts yt-dlp JSON3 caption events into normalized transcript segments", () => {
    expect(parseJson3Transcript({ events: [
      { tStartMs: 1250, dDurationMs: 2100, segs: [{ utf8: "Hello" }, { utf8: " world" }] },
      { tStartMs: 4000, dDurationMs: 900, segs: [{ utf8: "\n" }] },
    ] })).toEqual([{ start: 1.25, duration: 2.1, text: "Hello world" }]);
  });

  it("recognizes temporary cloud restrictions distinctly from missing subtitles", () => {
    expect(isYtDlpRateLimited("HTTP Error 429: Too Many Requests")).toBe(true);
    expect(isYtDlpRateLimited("ERROR: This video has no subtitles")).toBe(false);
  });

  it("recognizes unavailable videos distinctly from upstream access failures", () => {
    expect(isYtDlpVideoUnavailable("ERROR: Private video. Sign in if you have been granted access")).toBe(true);
    expect(new YouTubeVideoUnavailableError("Private video").name).toBe("YouTubeVideoUnavailableError");
    expect(new YouTubeUpstreamAccessError("Unexpected upstream response").name).toBe("YouTubeUpstreamAccessError");
  });
});
