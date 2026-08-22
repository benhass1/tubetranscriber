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

  it("does not initialize Manus-only OAuth or unresolved analytics placeholders on external hosts", async () => {
    const [server, context, html] = await Promise.all([
      readFile(new URL("./_core/index.ts", import.meta.url), "utf8"),
      readFile(new URL("./_core/context.ts", import.meta.url), "utf8"),
      readFile(new URL("../client/index.html", import.meta.url), "utf8"),
    ]);

    expect(server).toContain('if (process.env.OAUTH_SERVER_URL)');
    expect(server).toContain('await import("./oauth")');
    expect(context).toContain('if (process.env.OAUTH_SERVER_URL)');
    expect(context).toContain('await import("./sdk")');
    expect(html).not.toContain("%VITE_ANALYTICS_ENDPOINT%");
    expect(html).not.toContain("%VITE_ANALYTICS_WEBSITE_ID%");
  });
});
