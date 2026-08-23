import { describe, expect, it } from "vitest";
import { formatWorkerProxy } from "./youtubeTranscriptApi";

describe("youtube-transcript-api adapter", () => {
  it("leaves an empty proxy unset", () => {
    expect(formatWorkerProxy("")).toBeNull();
  });

  it("formats a Cloudflare Worker proxy with its url query prefix", () => {
    expect(formatWorkerProxy("https://worker.example/proxy")).toBe("https://worker.example/proxy?url=");
    expect(formatWorkerProxy("https://worker.example/proxy?url=")).toBe("https://worker.example/proxy?url=");
  });
});
