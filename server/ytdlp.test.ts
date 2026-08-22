import { describe, expect, it } from "vitest";
import { isYtDlpRateLimited, parseJson3Transcript } from "./ytdlp";

describe("parseJson3Transcript", () => {
  it("converts yt-dlp JSON3 caption events into normalized transcript segments", () => {
    expect(parseJson3Transcript({ events: [
      { tStartMs: 1250, dDurationMs: 2100, segs: [{ utf8: "Hello" }, { utf8: " world" }] },
      { tStartMs: 4000, dDurationMs: 900, segs: [{ utf8: "\n" }] },
    ] })).toEqual([{ start: 1.25, duration: 2.1, text: "Hello world" }]);
  });

  it("recognizes YouTube cloud rate-limit failures so they are not misreported as missing captions", () => {
    expect(isYtDlpRateLimited("HTTP Error 429: Too Many Requests")).toBe(true);
    expect(isYtDlpRateLimited("ERROR: This video has no subtitles")).toBe(false);
  });
});
