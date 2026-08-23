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
    expect(blueprint).toContain("key: WARP_ENABLED");
    expect(blueprint).toContain("key: WARP_REQUIRED");
    expect(blueprint).toContain("key: WARP_HTTP_PROXY");
    expect(blueprint).toContain("value: http://127.0.0.1:9091");
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

  it("provides a Vercel container entrypoint with the same production extraction runtime", async () => {
    const dockerfile = await readFile(new URL("../Dockerfile.vercel", import.meta.url), "utf8");

    expect(dockerfile).toContain("FROM node:22-slim");
    expect(dockerfile).toContain('"youtube-transcript-api>=0.6,<1.0"');
    expect(dockerfile).toContain("ENV PORT=80");
    expect(dockerfile).toContain('CMD ["node", "dist/index.js"]');
  });
});
