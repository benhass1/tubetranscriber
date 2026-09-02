import { describe, expect, it } from "vitest";
import { MIN_TRANSCRIPT_REVEAL_MS, transcriptRevealDelayMs } from "./Transcript";

describe("transcriptRevealDelayMs", () => {
  it("waits only for the remaining time when extraction finishes early", () => {
    expect(transcriptRevealDelayMs(1_000, 3_000)).toBe(MIN_TRANSCRIPT_REVEAL_MS - 2_000);
  });

  it("does not add delay when extraction already took ten seconds", () => {
    expect(transcriptRevealDelayMs(1_000, 11_000)).toBe(0);
  });
});

