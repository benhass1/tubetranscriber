import { describe, expect, it } from "vitest";
import { startWhenTurnstileTokenAvailable } from "./TurnstileWidget";
import { MIN_TRANSCRIPT_REVEAL_MS, transcriptRevealDelayMs } from "../pages/Transcript";

describe("startWhenTurnstileTokenAvailable", () => {
  it("waits for a token and starts exactly once", () => {
    let listener: ((token: string) => void) | undefined;
    let attempts = 0;
    const stop = startWhenTurnstileTokenAvailable(
      () => "",
      callback => {
        listener = callback;
        return () => { listener = undefined; };
      },
      () => { attempts += 1; },
    );

    expect(attempts).toBe(0);
    listener?.("fresh-token");
    listener?.("another-token");
    expect(attempts).toBe(1);

    stop();
    listener?.("after-unsubscribe");
    expect(attempts).toBe(1);
  });

  it("uses an existing token without creating a second attempt", () => {
    let subscribed = false;
    let attempts = 0;
    startWhenTurnstileTokenAvailable(
      () => "existing-token",
      callback => {
        subscribed = true;
        callback("callback-token");
        return () => undefined;
      },
      () => { attempts += 1; },
    );

    expect(subscribed).toBe(true);
    expect(attempts).toBe(1);
  });
});


describe("transcriptRevealDelayMs", () => {
  it("waits only for the remaining time when extraction finishes early", () => {
    expect(transcriptRevealDelayMs(1_000, 3_000)).toBe(MIN_TRANSCRIPT_REVEAL_MS - 2_000);
  });

  it("does not add delay when extraction already took ten seconds", () => {
    expect(transcriptRevealDelayMs(1_000, 11_000)).toBe(0);
  });
});
