var ALLOWED_HOSTS = {
  "youtube.com": true,
  "www.youtube.com": true,
  "m.youtube.com": true,
  "music.youtube.com": true,
  "youtu.be": true,
  "www.youtu.be": true
};

var YOUTUBE_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
var YOUTUBE_CONSENT_COOKIE = "SOCS=CAESEwgDEgk2MTExNDM3NDIaAmVuIAEaBgiA_L2yBg;";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Expose-Headers": "*"
  };
}

function errorResponse(message, status) {
  var headers = corsHeaders();
  headers["Content-Type"] = "application/json; charset=utf-8";
  return new Response(JSON.stringify({ error: message }), {
    status: status,
    headers: headers
  });
}

function isAllowedHost(hostname) {
  return ALLOWED_HOSTS[String(hostname).toLowerCase()] === true;
}

addEventListener("fetch", function(event) {
  event.respondWith(handle(event.request));
});

async function handle(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return errorResponse("Only GET and HEAD requests are supported.", 405);
  }

  var incoming = new URL(request.url);
  var rawTarget = incoming.searchParams.get("url");
  if (!rawTarget) {
    return errorResponse("Missing required url query parameter.", 400);
  }

  var target;
  try {
    target = new URL(rawTarget);
  } catch (error) {
    return errorResponse("The url query parameter is not a valid URL.", 400);
  }

  if (target.protocol !== "https:") {
    return errorResponse("Only HTTPS targets are allowed.", 403);
  }

  if (!isAllowedHost(target.hostname)) {
    return errorResponse("Target host is not allowed.", 403);
  }

  var headers = new Headers();
  request.headers.forEach(function(value, name) {
    var lowerName = name.toLowerCase();
    if (lowerName !== "host" && lowerName !== "content-length" && lowerName !== "cookie") {
      headers.set(name, value);
    }
  });
  headers.set("User-Agent", YOUTUBE_USER_AGENT);
  headers.set("Accept-Language", "en-US,en;q=0.9");
  headers.set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
  headers.set("Cookie", YOUTUBE_CONSENT_COOKIE);

  try {
    var upstream = await fetch(target.toString(), {
      method: request.method,
      headers: headers,
      redirect: "follow"
    });

    // Reading text makes the Worker return a decompressed body. Remove the
    // upstream framing/encoding headers before sending that new body.
    var body = request.method === "HEAD" ? null : await upstream.text();
    var responseHeaders = new Headers(upstream.headers);
    var cors = corsHeaders();
    Object.keys(cors).forEach(function(name) {
      responseHeaders.set(name, cors[name]);
    });
    responseHeaders.delete("Content-Length");
    responseHeaders.delete("Content-Encoding");
    responseHeaders.delete("Set-Cookie");

    return new Response(body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    return errorResponse("Upstream request failed: " + (error && error.message ? error.message : String(error)), 502);
  }
}
