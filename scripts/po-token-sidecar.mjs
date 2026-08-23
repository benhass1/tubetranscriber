import http from "node:http";
import { JSDOM, VirtualConsole } from "jsdom";
import { BotGuardClient } from "bgutils-js/botguard";
import { WebPoMinter } from "bgutils-js/webpo";
import { parseLooseJSON, buildURL, getHeaders, USER_AGENT } from "bgutils-js/utils";
import { ProxyAgent } from "undici";

const HOST = process.env.PO_TOKEN_HOST || "127.0.0.1";
const PORT = Number(process.env.PO_TOKEN_PORT || 4416);
const YOUTUBE_HOME = "https://www.youtube.com/";
const REQUEST_KEY = process.env.PO_TOKEN_REQUEST_KEY || "O43z0dpjhgX20SCx4KAo";
const TOKEN_TTL_MS = Math.max(60_000, Number(process.env.PO_TOKEN_TTL_SECONDS || 21_600) * 1000);
const FETCH_TIMEOUT_MS = Math.max(5_000, Number(process.env.PO_TOKEN_FETCH_TIMEOUT_MS || 30_000));
const VIDEO_ID_PATTERN = /^[0-9A-Za-z_-]{11}$/;

const tokenCache = new Map();
const inFlight = new Map();
let initializationPromise;
let provider;
let lastInitializationError = null;
let cachedDispatcher;

function proxyDispatcher() {
  if (cachedDispatcher !== undefined) return cachedDispatcher;
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
  cachedDispatcher = proxy ? new ProxyAgent(proxy) : null;
  return cachedDispatcher;
}

async function fetchWithTimeout(input, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const dispatcher = init.dispatcher || proxyDispatcher();
    return await fetch(input, {
      ...init,
      signal: init.signal || controller.signal,
      ...(dispatcher ? { dispatcher } : {}),
    });
  } finally {
    clearTimeout(timer);
  }
}

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function initializeProvider() {
  if (provider) return provider;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("jsdomError", () => {});
    const dom = new JSDOM("<!DOCTYPE html><html lang=\"en\"><head><title></title></head><body></body></html>", {
      url: YOUTUBE_HOME,
      referrer: YOUTUBE_HOME,
      userAgent: USER_AGENT,
      pretendToBeVisual: true,
      virtualConsole,
    });

    const pageResponse = await fetchWithTimeout(YOUTUBE_HOME, {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.7",
        "user-agent": USER_AGENT,
      },
    });
    if (!pageResponse.ok) {
      throw new Error(`YouTube home page returned HTTP ${pageResponse.status}`);
    }
    const pageHtml = await pageResponse.text();

    const ytConfigCandidates = [...pageHtml.matchAll(/ytcfg\.set\(\s*(\{[\s\S]*?\})\s*\);/g)];
    const ytConfigMatch = ytConfigCandidates
      .map((match) => match[1])
      .map((value) => {
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      })
      .find((value) => value && (value.INNERTUBE_CONTEXT || value.VISITOR_DATA));
    if (!ytConfigMatch) throw new Error("Could not find YouTube runtime configuration");

    const initialAttestationData = pageHtml.match(/window\.ytAtN\(\s*({[\s\S]*?})\s*\)/);
    if (!initialAttestationData) throw new Error("Could not find YouTube BotGuard challenge");

    const challengeEnvelope = parseLooseJSON(initialAttestationData[1]);
    const challenge = challengeEnvelope.R;
    if (!challenge?.bgChallenge) throw new Error("YouTube returned no BotGuard challenge");

    dom.window.yt = { config_: ytConfigMatch };
    Object.assign(globalThis, {
      yt: dom.window.yt,
      window: dom.window,
      document: dom.window.document,
      location: dom.window.location,
      origin: dom.window.origin,
    });
    if (!("navigator" in globalThis)) {
      Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator });
    }

    const interpreterUrl = challenge.bgChallenge.interpreterUrl?.privateDoNotAccessOrElseTrustedResourceUrlWrappedValue;
    if (!interpreterUrl) throw new Error("BotGuard challenge has no interpreter URL");
    const interpreterResponse = await fetchWithTimeout(`https:${interpreterUrl}`, {
      headers: { "user-agent": USER_AGENT },
    });
    if (!interpreterResponse.ok) {
      throw new Error(`BotGuard interpreter returned HTTP ${interpreterResponse.status}`);
    }
    const interpreterJavascript = await interpreterResponse.text();
    if (!interpreterJavascript) throw new Error("BotGuard interpreter was empty");
    new Function(interpreterJavascript)();

    const botGuardClient = await BotGuardClient.create({
      program: challenge.bgChallenge.program,
      globalName: challenge.bgChallenge.globalName,
      globalObject: globalThis,
    });

    const webPoSignalOutput = [];
    const botguardResponse = await botGuardClient.snapshot({ webPoSignalOutput });
    const integrityResponse = await fetchWithTimeout(buildURL("GenerateIT", true), {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify([REQUEST_KEY, botguardResponse]),
    });
    if (!integrityResponse.ok) {
      throw new Error(`BotGuard integrity endpoint returned HTTP ${integrityResponse.status}`);
    }
    const integrityJson = await integrityResponse.json();
    if (!Array.isArray(integrityJson)) throw new Error("Invalid BotGuard integrity response");
    const [integrityToken, estimatedTtlSecs, mintRefreshThreshold, websafeFallbackToken] = integrityJson;
    const webPoMinter = await WebPoMinter.create(
      { integrityToken, estimatedTtlSecs, mintRefreshThreshold, websafeFallbackToken },
      webPoSignalOutput,
    );

    const visitorData = dom.window.yt?.config_?.VISITOR_DATA || dom.window.yt?.config_?.INNERTUBE_CONTEXT?.client?.visitorData;
    if (!visitorData) throw new Error("Could not find YouTube visitorData");

    provider = { webPoMinter, visitorData, dom, botGuardClient };
    lastInitializationError = null;
    return provider;
  })().catch((error) => {
    lastInitializationError = error instanceof Error ? error.message : String(error);
    initializationPromise = undefined;
    throw error;
  });

  return initializationPromise;
}

async function tokenForVideo(videoId) {
  const cached = tokenCache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) return cached;
  if (inFlight.has(videoId)) return inFlight.get(videoId);

  const task = (async () => {
    const current = await initializeProvider();
    const poToken = await current.webPoMinter.mintAsWebsafeString(videoId);
    if (!poToken || poToken.length < 100) throw new Error("BotGuard returned an invalid PO-token");
    const value = {
      visitorData: current.visitorData,
      poToken,
      expiresAt: Date.now() + TOKEN_TTL_MS,
    };
    tokenCache.set(videoId, value);
    return value;
  })().finally(() => inFlight.delete(videoId));

  inFlight.set(videoId, task);
  return task;
}

function healthPayload() {
  return {
    status: provider ? "ok" : initializationPromise ? "initializing" : "not_ready",
    cachedTokens: tokenCache.size,
    error: lastInitializationError,
  };
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || `${HOST}:${PORT}`}`);
    if (request.method !== "GET") {
      response.writeHead(405, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "method_not_allowed" }));
      return;
    }
    if (url.pathname === "/health") {
      const payload = healthPayload();
      response.writeHead(payload.status === "ok" ? 200 : 503, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(payload));
      return;
    }
    if (url.pathname !== "/token") {
      response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "not_found" }));
      return;
    }

    const videoId = url.searchParams.get("videoId") || "";
    if (!VIDEO_ID_PATTERN.test(videoId)) {
      response.writeHead(400, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "invalid_video_id" }));
      return;
    }

    const token = await tokenForVideo(videoId);
    response.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    response.end(JSON.stringify({ videoId, ...token }));
  } catch (error) {
    console.error("PO-token request failed:", error);
    response.writeHead(503, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    response.end(JSON.stringify({ error: "po_token_unavailable", message: error instanceof Error ? error.message : String(error) }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`PO-token sidecar listening on http://${HOST}:${PORT}`);
  initializeProvider().catch((error) => {
    console.error("PO-token provider initialization deferred until the first token request:", error);
  });
});

function shutdown() {
  for (const value of tokenCache.values()) value.poToken = "";
  tokenCache.clear();
  provider?.botGuardClient?.shutdown?.().catch?.(() => {});
  provider?.dom?.window?.close?.();
  server.close(() => process.exit(0));
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
