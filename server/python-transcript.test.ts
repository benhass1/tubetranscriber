import { describe, expect, it } from "vitest";
import {
  errorFromPythonPayload,
  normalizePythonSegments,
  YouTubeCaptionAccessError,
  YouTubeCaptionsUnavailableError,
  YouTubeVideoUnavailableError,
} from "./python-transcript";

describe("Python transcript adapter payload handling", () => {
  it("normalizes direct Python caption segments into the shared transcript contract", () => {
    expect(normalizePythonSegments([
      { text: "  Hello\nworld  ", start: 1.25, duration: 2.5 },
      { text: "", start: 3.75, duration: 1 },
    ])).toEqual([{ text: "Hello world", start: 1.25, duration: 2.5 }]);
  });

  it("keeps no-caption, restricted, and unavailable outcomes distinct", () => {
    expect(errorFromPythonPayload({ ok: false, kind: "no_captions" })).toBeInstanceOf(YouTubeCaptionsUnavailableError);
    expect(errorFromPythonPayload({ ok: false, kind: "restricted" })).toBeInstanceOf(YouTubeCaptionAccessError);
    expect(errorFromPythonPayload({ ok: false, kind: "video_unavailable" })).toBeInstanceOf(YouTubeVideoUnavailableError);
  });
});
