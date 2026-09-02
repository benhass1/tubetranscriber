const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtubei.googleapis.com",
]);
const MAX_POST_BYTES = 2 * 1024 * 1024;
const TRANSCRIPT_CACHE_TTL = 7 * 24 * 60 * 60;
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;
const RATE_LIMIT_MAX_MISSES = 10;
const missBuckets = new Map();
const DESKTOP_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function isAllowedHost(hostname) {
  return ALLOWED_HOSTS.has(hostname) || hostname.endsWith(".googlevideo.com");
}

function corsHeaders(request) {
  const origin = request.headers.get("origin") || "";
  const allowed = new Set(["https://tubetranscriber.com", "https://www.tubetranscriber.com"]);
  return {
    "Access-Control-Allow-Origin": allowed.has(origin) ? origin : "*",
    "Access-Control-Allow-Headers": "content-type, x-turnstile-token, x-proxy-auth",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonResponse(request, payload, status = 200, extra = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders(request), "content-type": "application/json; charset=utf-8", ...extra },
  });
}

function stageError(request, error, status, stage) {
  return jsonResponse(request, { error }, status, { "x-transcript-stage": stage });
}

function textResponse(request, text, status) {
  return new Response(text, { status, headers: corsHeaders(request) });
}

function extractVideoId(value) {
  const candidate = String(value || "").trim();
  if (/^[0-9A-Za-z_-]{11}$/.test(candidate)) return candidate;
  const match = candidate.match(/(?:v=|\/\/(?:www\.|m\.)?youtube(?:-nocookie)?\.com\/(?:embed|shorts|live)\/|youtu\.be\/)([0-9A-Za-z_-]{11})/i);
  return match ? match[1] : null;
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function textValue(value) {
  if (typeof value === "string") return value;
  if (value && typeof value.simpleText === "string") return value.simpleText;
  if (value && Array.isArray(value.runs)) return value.runs.map(run => run.text || "").join("");
  return "";
}

function extractAssignedJson(markup, variable) {
  const marker = markup.indexOf(variable);
  if (marker < 0) return null;
  const start = markup.indexOf("{", marker);
  if (start < 0) return null;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (let index = start; index < markup.length; index += 1) {
    const character = markup[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) {
      try { return JSON.parse(markup.slice(start, index + 1)); } catch { return null; }
    }
  }
  return null;
}

function extractConfigValue(markup, name) {
  const pattern = new RegExp(`[\\\"']${name}[\\\"']\\s*:\\s*[\\\"']([^\\\"']+)`);
  return markup.match(pattern)?.[1] || "";
}

async function fetchAndroidPlayer(videoId, markup, env) {
  const key = extractConfigValue(markup, "INNERTUBE_API_KEY") || String(env.YOUTUBE_PLAYER_API_KEY || "").trim();
  if (!key) return null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip",
          "accept-language": "en-US,en;q=0.9",
        },
        body: JSON.stringify({
          context: { client: { clientName: "ANDROID", clientVersion: "20.10.38", androidSdkVersion: 30, hl: "en", gl: "US" } },
          videoId,
        }),
      });
      if (!response.ok) continue;
      const payload = await response.json().catch(() => null);
      if (payload) return payload;
    } catch {
      // Retry once for a transient Cloudflare-to-YouTube connection failure.
    }
  }
  return null;
}

function captionTracks(player) {
  return player?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
}

function languageName(track) {
  return textValue(track?.name) || track?.languageCode || "Unknown";
}

function originalLanguageCode(player, tracks) {
  const details = player?.videoDetails || {};
  const audioTracks = Array.isArray(details.audioTracks) ? details.audioTracks : [];
  const candidates = [
    details.defaultAudioTrack?.languageCode,
    audioTracks.find(track => track?.isDefault)?.languageCode,
    audioTracks[0]?.languageCode,
    tracks.find(track => track?.isDefault)?.languageCode,
    tracks.find(track => track?.kind !== "asr")?.languageCode,
    tracks[0]?.languageCode,
  ];
  return candidates.find(value => String(value || "").trim()) || "";
}

function chooseTrack(tracks, requestedLanguage, originalCode = "") {
  const requested = String(requestedLanguage || "").trim().toLowerCase();
  const manual = track => track?.kind !== "asr";
  const code = track => String(track?.languageCode || "").toLowerCase();
  const exact = track => requested && code(track) === requested;
  const prefix = track => requested && code(track).split("-")[0] === requested.split("-")[0];
  const original = String(originalCode || "").trim().toLowerCase();
  const pick = predicate => tracks.find(predicate);
  if (requested) return pick(track => exact(track) && manual(track)) || pick(track => exact(track)) || pick(track => prefix(track) && manual(track)) || pick(track => prefix(track));
  return pick(track => manual(track) && code(track) === original) || pick(track => code(track) === original) || pick(track => manual(track) && track?.isDefault) || pick(manual) || tracks[0];
}

function decodeXml(value) {
  return decodeHtml(value).replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "");
}

function parseJson3(payload) {
  const cues = [];
  for (const event of Array.isArray(payload?.events) ? payload.events : []) {
    if (!Array.isArray(event.segs)) continue;
    const text = event.segs.map(segment => segment.utf8 || "").join("").replace(/\s+/g, " ").trim();
    if (!text) continue;
    cues.push({ text, offset: Number(event.tStartMs || 0), duration: Number(event.dDurationMs || 0) });
  }
  return cues.filter(cue => Number.isFinite(cue.offset) && cue.text);
}

function parseXml(xml) {
  const cues = [];
  const pattern = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let match;
  while ((match = pattern.exec(xml))) {
    const start = Number((match[1].match(/\bstart="([^"]+)"/) || [])[1]);
    const duration = Number((match[1].match(/\bdur="([^"]+)"/) || [])[1] || 0);
    const text = decodeXml(match[2]).replace(/\s+/g, " ").trim();
    if (text && Number.isFinite(start)) cues.push({ text, offset: Math.round(start * 1000), duration: Math.round(duration * 1000) });
  }
  return cues;
}

function humanViews(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  if (number >= 1e9) return `${(number / 1e9).toFixed(1).replace(/\.0$/, "")}B views`;
  if (number >= 1e6) return `${(number / 1e6).toFixed(1).replace(/\.0$/, "")}M views`;
  if (number >= 1e3) return `${(number / 1e3).toFixed(1).replace(/\.0$/, "")}K views`;
  return `${number} views`;
}

function metadata(player, initialData, videoId, tracks, selectedTrack) {
  const details = player?.videoDetails || {};
  const micro = player?.microformat?.playerMicroformatRenderer || {};
  const thumbnail = details.thumbnail?.thumbnails?.at(-1)?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const language = selectedTrack || tracks.find(track => track?.kind !== "asr") || tracks[0];
  return {
    videoId,
    title: details.title || "YouTube video",
    author: details.author || micro.ownerChannelName || "YouTube",
    authorUrl: micro.ownerProfileUrl || (details.channelId ? `https://www.youtube.com/channel/${details.channelId}` : ""),
    views: humanViews(details.viewCount || micro.viewCount),
    date: micro.publishDate || "",
    avatar: thumbnail,
    subs: "",
    language: { code: language?.languageCode || "", name: languageName(language), isAutoGenerated: language?.kind === "asr" },
    languages: tracks.map(track => ({ code: track.languageCode || "", name: languageName(track), isAutoGenerated: track.kind === "asr" })),
  };
}

function cacheKey(videoId, lang) {
  return `t:v2:${videoId}:${lang || "auto"}`;
}

function healthResponse(request, env) {
  const turnstileConfigured = Boolean(String(env.TURNSTILE_SECRET_KEY || env.CF_TURNSTILE_SECRET_KEY || "").trim());
  const playerConfigured = Boolean(String(env.YOUTUBE_PLAYER_API_KEY || "").trim());
  return jsonResponse(request, {
    ok: true,
    service: "tubetranscriber-transcript-proxy",
    version: String(env.APP_VERSION || "dev"),
    runtime: "cloudflare-worker",
    transcriptCacheConfigured: Boolean(env.TRANSCRIPT_CACHE),
    turnstileConfigured,
    playerConfigured,
  });
}

async function getCached(env, key) {
  try { return env.TRANSCRIPT_CACHE ? await env.TRANSCRIPT_CACHE.get(key, "json") : null; } catch { return null; }
}

async function putCached(env, key, value) {
  try {
    if (!env.TRANSCRIPT_CACHE) return false;
    await env.TRANSCRIPT_CACHE.put(key, JSON.stringify(value), { expirationTtl: TRANSCRIPT_CACHE_TTL });
    return true;
  } catch {
    // Cache failure must not fail extraction.
    return false;
  }
}

function normalizeCookie(setCookie) {
  return String(setCookie || "")
    .split(/,\s*(?=[^;,\s]+=)/)
    .map(cookie => cookie.split(";", 1)[0].trim())
    .filter(Boolean)
    .join("; ");
}

function youtubeHeaders(cookie = "", userAgent = DESKTOP_USER_AGENT) {
  const headers = {
    "user-agent": userAgent,
    "accept-language": "en-US,en;q=0.9",
    accept: "text/html,application/xhtml+xml",
  };
  if (cookie) headers.cookie = normalizeCookie(cookie);
  return headers;
}

async function fetchWatchMarkup(videoId) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}&hl=en&bpctr=9999999999&has_verified=1`;
  let first;
  try {
    first = await fetch(watchUrl, { redirect: "manual", headers: youtubeHeaders() });
    const cookie = normalizeCookie(first.headers.get("set-cookie"));
    const location = first.headers.get("location");
    const nextUrl = location ? new URL(location, watchUrl).toString() : watchUrl;
    const response = first.status >= 300 && first.status < 400
      ? await fetch(nextUrl, { redirect: "follow", headers: youtubeHeaders(cookie) })
      : first;
    let markup = await response.text();
    if (cookie && /consent|consent.youtube.com|before you continue/i.test(markup)) {
      const retry = await fetch(watchUrl, { redirect: "follow", headers: youtubeHeaders(cookie) });
      markup = await retry.text();
      return { response: retry, markup, cookie };
    }
    return { response, markup, cookie };
  } catch {
    return { response: null, markup: "", cookie: "" };
  }
}

async function fetchTrackCues(track, videoId, cookie) {
  if (!track?.baseUrl) return [];
  try {
    const baseUrl = new URL(track.baseUrl);
    baseUrl.searchParams.set("fmt", "json3");
    const response = await fetch(baseUrl, {
      headers: { ...youtubeHeaders(cookie), referer: `https://www.youtube.com/watch?v=${videoId}`, accept: "application/json,text/plain,*/*" },
      redirect: "follow",
    });
    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();
    if (!body || contentType.includes("html")) return [];
    try { return parseJson3(JSON.parse(body)); } catch { return parseXml(body); }
  } catch {
    return [];
  }
}

function allowMiss(ip) {
  const now = Date.now();
  const existing = missBuckets.get(ip);
  if (!existing || now - existing.startedAt >= RATE_LIMIT_WINDOW) {
    missBuckets.set(ip, { startedAt: now, count: 1 });
    return true;
  }
  if (existing.count >= RATE_LIMIT_MAX_MISSES) return false;
  existing.count += 1;
  return true;
}

async function verifyTurnstile(request, env) {
  const token = (request.headers.get("x-turnstile-token") || "").trim();
  if (!token) return { ok: false, response: jsonResponse(request, { error: "Missing turnstile token. Please refresh and try again." }, 403) };
  const secret = String(env.TURNSTILE_SECRET_KEY || env.CF_TURNSTILE_SECRET_KEY || "").trim();
  if (!secret) return { ok: false, response: jsonResponse(request, { error: "Turnstile is not configured." }, 503) };
  const form = new URLSearchParams({ secret, response: token });
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) form.set("remoteip", remoteIp);
  try {
    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form });
    const payload = await result.json();
    return payload.success ? { ok: true } : { ok: false, response: jsonResponse(request, { error: "Turnstile verification failed. Please try again." }, 403) };
  } catch {
    return { ok: false, response: jsonResponse(request, { error: "Turnstile verification failed. Please try again." }, 403) };
  }
}

async function transcriptRoute(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method === "POST") return jsonResponse(request, { error: "Method not allowed" }, 405);
  if (request.method !== "GET" && request.method !== "HEAD") return textResponse(request, "Method not allowed", 405);
  if (request.method === "HEAD") return new Response(null, { status: 200, headers: corsHeaders(request) });

  const url = new URL(request.url);
  const rawUrl = url.searchParams.get("url");
  if (!rawUrl) return jsonResponse(request, { error: "Missing url parameter" }, 400);
  const videoId = extractVideoId(rawUrl);
  if (!videoId) return jsonResponse(request, { error: "invalid youtube link format" }, 400);
  const lang = url.searchParams.get("lang") || "";
  const verification = await verifyTurnstile(request, env);
  if (!verification.ok) return verification.response;
  const key = cacheKey(videoId, lang);
  const cached = await getCached(env, key);
  if (cached) return jsonResponse(request, cached, 200, { "cache-control": "public, max-age=3600", "x-transcript-cache": "HIT" });
  const ip = request.headers.get("CF-Connecting-IP") || "anonymous";
  if (!allowMiss(ip)) return jsonResponse(request, { error: "Too many requests. Try again in a minute." }, 429, { "retry-after": "60" });

  const watch = await fetchWatchMarkup(videoId);
  const markup = watch.markup || "";

  let player = extractAssignedJson(markup, "ytInitialPlayerResponse");
  let initialData = extractAssignedJson(markup, "ytInitialData");
  let playability = player?.playabilityStatus?.status;
  let tracks = captionTracks(player);
  if (!tracks.length || ["LOGIN_REQUIRED", "UNPLAYABLE", "ERROR"].includes(playability)) {
    const androidPlayer = await fetchAndroidPlayer(videoId, markup, env);
    if (androidPlayer) {
      player = androidPlayer;
      tracks = captionTracks(player);
      playability = player?.playabilityStatus?.status;
    }
  }
  if (!watch.response || !watch.response.ok || !watch.markup) {
    if (!tracks.length) {
      const playerConfigured = Boolean(extractConfigValue(markup, "INNERTUBE_API_KEY") || String(env.YOUTUBE_PLAYER_API_KEY || "").trim());
      return stageError(request, "transcript unavailable", 502, playerConfigured ? "player-fetch" : "player-config");
    }
  }
  if (["LOGIN_REQUIRED", "UNPLAYABLE", "ERROR"].includes(playability)) return stageError(request, "Private, age-restricted, or unplayable video.", 422, "player-playability");
  if (!tracks.length) return stageError(request, "No captions available for this video.", 404, "caption-tracks");
  let track = chooseTrack(tracks, lang, originalLanguageCode(player, tracks));
  if (!track?.baseUrl) return stageError(request, "No captions available for this video.", 404, "caption-track-url");

  let cues = await fetchTrackCues(track, videoId, watch.cookie);
  if (!cues.length) {
    const androidPlayer = await fetchAndroidPlayer(videoId, markup, env);
      const androidTracks = captionTracks(androidPlayer);
      const androidTrack = chooseTrack(androidTracks, lang, originalLanguageCode(androidPlayer, androidTracks));
    const androidCues = await fetchTrackCues(androidTrack, videoId, watch.cookie);
    if (androidCues.length) {
      player = androidPlayer;
      tracks = androidTracks;
      track = androidTrack;
      cues = androidCues;
    }
  }
  if (!cues.length) return stageError(request, "transcript unavailable", 502, "timedtext-empty");

  const info = metadata(player, initialData, videoId, tracks, track);
  const result = { ...info, language: { code: track.languageCode || "", name: languageName(track), isAutoGenerated: track.kind === "asr" }, transcript: cues };
  const cacheStored = await putCached(env, key, result);
  return jsonResponse(request, { ...result, workerCacheStatus: cacheStored ? "STORED" : "WRITE_FAILED" }, 200, { "cache-control": "public, max-age=3600", "x-transcript-cache": "MISS", "x-transcript-cache-store": cacheStored ? "STORED" : "WRITE_FAILED" });
}

function upstreamUserAgent(request) {
  const incoming = request.headers.get("user-agent") || "";
  return incoming.startsWith("com.google.android.youtube/") ? incoming : DESKTOP_USER_AGENT;
}

function proxyResponseHeaders(upstream, request) {
  const headers = new Headers(corsHeaders(request));
  for (const name of ["content-type", "content-language", "retry-after"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("cache-control", "no-store");
  return headers;
}

async function legacyProxy(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "GET" && request.method !== "POST") return textResponse(request, "Method not allowed", 405);
  if (!env.WORKER_AUTH_TOKEN) return textResponse(request, "Proxy is not configured", 503);
  if (request.headers.get("x-proxy-auth") !== env.WORKER_AUTH_TOKEN) return textResponse(request, "Unauthorized", 401);
  const incomingUrl = new URL(request.url);
  const targetValue = incomingUrl.searchParams.get("url");
  if (!targetValue) return textResponse(request, "Missing url parameter", 400);
  let targetUrl;
  try { targetUrl = new URL(targetValue); } catch { return textResponse(request, "Invalid target URL", 400); }
  if (targetUrl.protocol !== "https:" || !isAllowedHost(targetUrl.hostname)) return textResponse(request, "Target host is not allowed", 403);
  let body;
  if (request.method === "POST") {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_POST_BYTES) return textResponse(request, "Request body is too large", 413);
    body = await request.arrayBuffer();
  }
  const headers = new Headers();
  for (const name of ["accept", "accept-language", "content-type", "cookie"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("user-agent", upstreamUserAgent(request));
  headers.set("referer", "https://www.youtube.com/");
  headers.set("origin", "https://www.youtube.com");
  headers.set("accept-encoding", "identity");
  try {
    const upstream = await fetch(targetUrl, { method: request.method, headers, body, redirect: "follow" });
    return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: proxyResponseHeaders(upstream, request) });
  } catch (error) {
    return textResponse(request, `Upstream request failed: ${error instanceof Error ? error.message : "unknown error"}`, 502);
  }
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === "/healthz") return healthResponse(request, env);
    if (path === "/api/transcript") return transcriptRoute(request, env);
    return legacyProxy(request, env);
  },
};
