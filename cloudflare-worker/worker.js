const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtubei.googleapis.com",
]);

const MAX_POST_BYTES = 2 * 1024 * 1024;

function isAllowedHost(hostname) {
  return ALLOWED_HOSTS.has(hostname) || hostname.endsWith(".googlevideo.com");
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
  for (const name of ["content-type", "content-encoding", "content-language", "retry-after"]) {
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
    for (const name of ["accept", "accept-language", "content-type", "user-agent", "cookie"]) {
      const value = request.headers.get(name);
      if (value) upstreamHeaders.set(name, value);
    }
    upstreamHeaders.set("referer", "https://www.youtube.com/");
    upstreamHeaders.set("origin", "https://www.youtube.com");

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
