import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { pathToFileURL } from "url";
import { createServer as createViteServer } from "vite";
import superjson from "superjson";
import viteConfig from "../../vite.config";
import type { HeadMeta } from "../../client/src/ssr/seo";

const canonicalOrigin = (process.env.CANONICAL_ORIGIN ?? "https://tubetransc-5mr8an8j.manus.space").replace(/\/$/, "");
const siteName = "TubeTranscriber";
const defaultDescription = "Extract, search, and download public YouTube video transcripts instantly in TXT, JSON, or SRT format. Free, fast, and no account required.";

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const safeText = (value: string, max: number) => value.replace(/\s+/g, " ").trim().slice(0, max);

function headTags(head: HeadMeta) {
  const title = escapeHtml(safeText(head.title || siteName, 70));
  const description = escapeHtml(safeText(head.description || defaultDescription, 200));
  const ogTitle = escapeHtml(safeText(head.ogTitle || head.title || siteName, 70));
  const ogDescription = escapeHtml(safeText(head.ogDescription || head.description || defaultDescription, 200));
  const canonical = head.canonicalPath && canonicalOrigin ? `${canonicalOrigin}${head.canonicalPath}` : "";
  const tags = [
    `<title>${title}</title>`, `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="${head.noindex || head.notFound ? "noindex, follow" : "index, follow, max-image-preview:large"}" />`,
    `<meta property="og:type" content="${escapeHtml(head.ogType || "website")}" />`, `<meta property="og:title" content="${ogTitle}" />`, `<meta property="og:description" content="${ogDescription}" />`,
    `<meta property="og:site_name" content="${siteName}" />`, `<meta name="twitter:card" content="${escapeHtml(head.twitterCard || "summary_large_image")}" />`,
    `<meta name="twitter:title" content="${ogTitle}" />`, `<meta name="twitter:description" content="${ogDescription}" />`,
  ];
  if (canonical) tags.push(`<link rel="canonical" href="${escapeHtml(canonical)}" />`, `<meta property="og:url" content="${escapeHtml(canonical)}" />`);
  if (head.jsonLd) tags.push(`<script type="application/ld+json">${JSON.stringify(head.jsonLd).replace(/</g, "\\u003c")}</script>`);
  return tags.join("\n");
}

function composeHtml(template: string, appHtml: string, head: HeadMeta, dehydratedState: unknown) {
  const serialized = JSON.stringify(superjson.serialize(dehydratedState)).replace(/</g, "\\u003c");
  return template.replace("<!--app-head-->", () => headTags(head)).replace("<!--app-html-->", () => appHtml).replace("</body>", () => `<script>window.__RQ_STATE__=${serialized}</script></body>`);
}

function crawlerFiles(app: Express) {
  app.get("/robots.txt", (_req, res) => {
    const sitemap = canonicalOrigin ? `\nSitemap: ${canonicalOrigin}/sitemap.xml` : "";
    const namedCrawlers = ["OAI-SearchBot", "ChatGPT-User", "GPTBot", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Googlebot", "Bingbot", "DuckAssistBot", "Applebot", "Google-Extended", "meta-externalagent", "MistralAI-User"];
    const rules = namedCrawlers.map(agent => `User-agent: ${agent}\nAllow: /\nDisallow: /history\nDisallow: /transcript`).join("\n\n");
    res.type("text/plain").send(`${rules}\n\nUser-agent: *\nAllow: /\nDisallow: /history\nDisallow: /transcript${sitemap}\n`);
  });
  app.get("/llms.txt", (_req, res) => res.type("text/plain").send(`# TubeTranscriber\n\nTubeTranscriber is a public YouTube to transcript tool and YouTube transcript generator. It can convert an available YouTube video to transcript text, making it a practical YouTube video transcript generator for reading, search, copy, and export workflows. Visitors paste a public YouTube URL and can export TXT, JSON, or SRT files. No account is required. Recent lookups are stored only in the visitor's browser.\n\n## Public pages\n\n- / — YouTube transcript generator and usage overview\n- /about — usage guide and FAQ\n- /privacy — browser-local data and privacy policy\n- /terms — responsible-use terms\n- /copyright — copyright and DMCA guidance\n- /contact — support and legal contact information\n\n## Limitations\n\nA transcript is available only when YouTube exposes captions for the requested public video. TubeTranscriber is not affiliated with YouTube or Google.\n`));
  app.get("/sitemap.xml", (_req, res) => {
    if (!canonicalOrigin) return res.status(404).type("text/plain").send("Configure CANONICAL_ORIGIN to enable the sitemap.");
    const urls = ["/", "/about", "/privacy", "/terms", "/copyright", "/contact"].map(route => `<url><loc>${canonicalOrigin}${route}</loc></url>`).join("");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  });
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({ ...viteConfig, configFile: false, server: { middlewareMode: true, hmr: { server }, allowedHosts: true as const }, appType: "custom" });
  app.use(vite.middlewares);
  crawlerFiles(app);
  app.use("*", async (req, res, next) => {
    try {
      const templatePath = path.resolve(import.meta.dirname, "../..", "client", "index.html");
      let template = await fs.promises.readFile(templatePath, "utf-8");
      template = template.replace(`src="/src/entry-client.tsx"`, `src="/src/entry-client.tsx?v=${nanoid()}"`);
      template = await vite.transformIndexHtml(req.originalUrl, template);
      template = template.replace("</head>", `<link rel="stylesheet" href="/src/index.css?direct" data-ssr-dev-css></head>`);
      const { render } = await vite.ssrLoadModule("/src/entry-server.tsx");
      const result = await render(req.originalUrl);
      res.status(result.head.notFound ? 404 : 200).set("Cache-Control", "no-cache").type("html").end(composeHtml(template, result.html, result.head, result.dehydratedState));
    } catch (error) { vite.ssrFixStacktrace(error as Error); next(error); }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  crawlerFiles(app);
  app.use((req, res, next) => {
    if (req.path === "/index.html") return res.redirect(301, "/");
    if (req.path !== "/" && /\/+$/ .test(req.path)) return res.redirect(301, req.path.replace(/\/+$/ , "") + req.originalUrl.slice(req.path.length));
    next();
  });
  app.use(express.static(distPath, { index: false, redirect: false, maxAge: "1y", etag: true }));
  app.use("*", async (req, res) => {
    const template = await fs.promises.readFile(path.resolve(distPath, "index.html"), "utf-8");
    try {
      const entry = path.resolve(import.meta.dirname, "server-ssr", "entry-server.js");
      const { render } = await import(pathToFileURL(entry).href);
      const result = await render(req.originalUrl);
      res.status(result.head.notFound ? 404 : 200).set("Cache-Control", "no-cache").type("html").end(composeHtml(template, result.html, result.head, result.dehydratedState));
    } catch (error) {
      console.error("[SSR] render failed, serving shell:", error);
      res.status(200).set("Cache-Control", "no-cache").type("html").end(composeHtml(template, "", { title: siteName, description: defaultDescription }, {}));
    }
  });
}
