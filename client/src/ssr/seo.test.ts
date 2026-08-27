import { describe, expect, it } from "vitest";
import { getHeadMeta } from "./seo";

const pseoPaths = [
  "/transcribe-youtube-podcast-to-srt",
  "/youtube-shorts-transcript-downloader",
  "/extract-lecture-captions-to-text",
  "/youtube-video-to-json-data",
];

describe("pSEO SSR metadata", () => {
  it("registers every requested landing page with indexable metadata", () => {
    for (const path of pseoPaths) {
      const head = getHeadMeta(path);
      const graph = (head.jsonLd as { "@graph"?: Array<Record<string, unknown>> })?.["@graph"] ?? [];
      const types = graph.map((item) => item["@type"]);
      expect(head.canonicalPath).toBe(path);
      expect(head.description.length).toBeGreaterThan(100);
      expect(head.notFound).not.toBe(true);
      expect(types).toContain("SoftwareApplication");
      expect(types).toContain("HowTo");
      expect(types).toContain("FAQPage");
      expect(types).toContain("BreadcrumbList");
    }
  });

  it("keeps transcript pages noindex", () => {
    const head = getHeadMeta("/transcript");
    expect(head.noindex).toBe(true);
    expect(head.canonicalPath).toBeUndefined();
  });
});
