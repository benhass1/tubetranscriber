import { describe, expect, it } from "vitest";
import { normalizeTranscript, parseYoutubeId } from "./transcript";

describe("parseYoutubeId", () => {
  it("accepts standard YouTube URL forms", () => {
    expect(parseYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYoutubeId("https://youtu.be/dQw4w9WgXcQ?t=10")).toBe("dQw4w9WgXcQ");
    expect(parseYoutubeId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYoutubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("accepts a raw canonical video ID but rejects unsupported URLs", () => {
    expect(parseYoutubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYoutubeId("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYoutubeId("not-a-video-link")).toBeNull();
  });
});

describe("normalizeTranscript", () => {
  it("converts srv3 millisecond timing into seconds", () => {
    expect(normalizeTranscript([{ text: "Caption", offset: 1360, duration: 1840 }])).toEqual([
      { text: "Caption", start: 1.36, duration: 1.84 },
    ]);
  });

  it("keeps classic caption track timing expressed in seconds", () => {
    expect(normalizeTranscript([{ text: "Caption", offset: 61.4, duration: 2.4 }])).toEqual([
      { text: "Caption", start: 61.4, duration: 2.4 },
    ]);
  });
});
