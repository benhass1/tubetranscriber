var ALLOWED_HOSTS = {
  "youtube.com": true,
  "www.youtube.com": true,
  "m.youtube.com": true,
  "music.youtube.com": true,
  "youtu.be": true,
  "www.youtu.be": true
};

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

  var headers = new Headers(request.headers);
  headers.delete("Host");
  headers.delete("Content-Length");
  if (!headers.get("User-Agent")) {
    headers.set("User-Agent", "Mozilla/5.0");
  }

  try {
    var upstream = await fetch(target.toString(), {
      method: request.method,
      headers: headers,
      redirect: "follow"
    });

    var responseHeaders = new Headers(upstream.headers);
    var cors = corsHeaders();
    Object.keys(cors).forEach(function(name) {
      responseHeaders.set(name, cors[name]);
    });
    responseHeaders.delete("Content-Length");
    responseHeaders.delete("Content-Encoding");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    return errorResponse("Upstream request failed: " + error.message, 502);
  }
}
