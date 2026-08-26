const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtubei.googleapis.com",
]);

const MAX_POST_BYTES = 2 * 1024 * 1024;
const DESKTOP_USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
];
const MOBILE_USER_AGENTS = [
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1",
];

function isAllowedHost(hostname) {
  return ALLOWED_HOSTS.has(hostname) || hostname.endsWith(".googlevideo.com");
}

function upstreamUserAgent(request) {
  const incoming = request.headers.get("user-agent") || "";
  if (incoming.startsWith("com.google.android.youtube/")) return incoming;
  const pool = Math.random() < 0.25 ? MOBILE_USER_AGENTS : DESKTOP_USER_AGENTS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type, x-proxy-auth",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

function responseHeaders(upstream) {
  const headers = new Headers(corsHeaders());
  for (const name of ["content-type", "content-language", "retry-after"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("cache-control", "no-store");
  return headers;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== "GET" && request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders() });
    }

    if (!env.WORKER_AUTH_TOKEN) {
      return new Response("Proxy is not configured", { status: 503, headers: corsHeaders() });
    }

    const suppliedToken = request.headers.get("x-proxy-auth");
    if (!suppliedToken || suppliedToken !== env.WORKER_AUTH_TOKEN) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders() });
    }

    const incomingUrl = new URL(request.url);
    const targetValue = incomingUrl.searchParams.get("url");
    if (!targetValue) {
      return new Response("Missing url parameter", { status: 400, headers: corsHeaders() });
    }

    let targetUrl;
    try {
      targetUrl = new URL(targetValue);
    } catch {
      return new Response("Invalid target URL", { status: 400, headers: corsHeaders() });
    }

    if (targetUrl.protocol !== "https:" || !isAllowedHost(targetUrl.hostname)) {
      return new Response("Target host is not allowed", { status: 403, headers: corsHeaders() });
    }

    let body;
    if (request.method === "POST") {
      const contentLength = Number(request.headers.get("content-length") || 0);
      if (contentLength > MAX_POST_BYTES) {
        return new Response("Request body is too large", { status: 413, headers: corsHeaders() });
      }
      body = await request.arrayBuffer();
      if (body.byteLength > MAX_POST_BYTES) {
        return new Response("Request body is too large", { status: 413, headers: corsHeaders() });
      }
    }

    const upstreamHeaders = new Headers();
    for (const name of ["accept", "accept-language", "content-type", "cookie"]) {
      const value = request.headers.get(name);
      if (value) upstreamHeaders.set(name, value);
    }
    upstreamHeaders.set("user-agent", upstreamUserAgent(request));
    upstreamHeaders.set("referer", "https://www.youtube.com/");
    upstreamHeaders.set("origin", "https://www.youtube.com");
    upstreamHeaders.set("accept-encoding", "identity");

    try {
      const upstream = await fetch(targetUrl, {
        method: request.method,
        headers: upstreamHeaders,
        body,
        redirect: "follow",
      });

      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders(upstream),
      });
    } catch (error) {
      return new Response(`Upstream request failed: ${error instanceof Error ? error.message : "unknown error"}`, {
        status: 502,
        headers: corsHeaders(),
      });
    }
  },
};
