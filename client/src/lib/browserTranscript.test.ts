import { describe, expect, it } from "vitest";
import { buildBrowserCaptionUrl, parseBrowserJson3 } from "./browserTranscript";

describe("browser transcript fallback", () => {
  it("parses usable JSON3 events and joins caption segments", () => {
    const payload = JSON.stringify({ events: [
      { tStartMs: 1200, dDurationMs: 1800, segs: [{ utf8: "Hello " }, { utf8: "world" }] },
      { tStartMs: 4000, dDurationMs: 900, segs: [{ utf8: "Next line" }] },
    ] });
    expect(parseBrowserJson3(payload)).toEqual([
      { start: 1.2, duration: 1.8, text: "Hello world" },
      { start: 4, duration: 0.9, text: "Next line" },
    ]);
  });

  it("returns no segments for empty or malformed JSON3", () => {
    expect(parseBrowserJson3("")).toEqual([]);
    expect(parseBrowserJson3("not-json")).toEqual([]);
    expect(parseBrowserJson3(JSON.stringify({ events: [{ segs: [] }] }))).toEqual([]);
  });

  it("always requests JSON3 while preserving track parameters", () => {
    const url = new URL(buildBrowserCaptionUrl("dQw4w9WgXcQ", { langCode: "en", kind: "asr", name: "English" }));
    expect(url.pathname).toBe("/api/timedtext");
    expect(url.searchParams.get("v")).toBe("dQw4w9WgXcQ");
    expect(url.searchParams.get("lang")).toBe("en");
    expect(url.searchParams.get("kind")).toBe("asr");
    expect(url.searchParams.get("name")).toBe("English");
    expect(url.searchParams.get("fmt")).toBe("json3");
  });
});
