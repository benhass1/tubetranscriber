import { describe, expect, it } from "vitest";
import { groupTranscript, plainTranscript, toSrt, toTxt, type TranscriptSegment } from "./transcript";

const segments: TranscriptSegment[] = [
  { start: 0, duration: 1.2, text: "Welcome to TubeTranscriber." },
  { start: 61.4, duration: 2.4, text: "This is the second caption." },
];

describe("transcript exports", () => {
  it("creates a readable plain transcript and timestamped text", () => {
    expect(plainTranscript(segments)).toBe("Welcome to TubeTranscriber. This is the second caption.");
    expect(toTxt(segments)).toContain("[00:00:00] Welcome to TubeTranscriber.");
    expect(toTxt(segments)).toContain("[00:01:01] This is the second caption.");
  });

  it("creates an SRT file with numbered blocks and rounded time ranges", () => {
    const output = toSrt(segments);
    expect(output).toContain("1\n00:00:00,000 --> 00:00:01,200\nWelcome to TubeTranscriber.");
    expect(output).toContain("2\n00:01:01,400 --> 00:01:03,800\nThis is the second caption.");
  });

  it("groups adjacent caption moments into readable timestamped paragraphs", () => {
    expect(groupTranscript(segments)).toEqual([{ start: 0, end: 1.2, text: "Welcome to TubeTranscriber." }, { start: 61.4, end: 63.8, text: "This is the second caption." }]);
    expect(groupTranscript([{ start: 0, duration: 1, text: "First" }, { start: 1.2, duration: 1, text: "second" }])).toEqual([{ start: 0, end: 2.2, text: "First second" }]);
  });
});
