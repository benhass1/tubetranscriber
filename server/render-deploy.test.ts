import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Render deployment configuration", () => {
  it("uses the Docker runtime, a free web service, and a portable canonical origin", async () => {
    const blueprint = await readFile(new URL("../render.yaml", import.meta.url), "utf8");

    expect(blueprint).toContain("type: web");
    expect(blueprint).toContain("runtime: docker");
    expect(blueprint).toContain("plan: free");
    expect(blueprint).toContain("healthCheckPath: /");
    expect(blueprint).toContain("key: CANONICAL_ORIGIN");
    expect(blueprint).toContain("sync: false");
  });
});
