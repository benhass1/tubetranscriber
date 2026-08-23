#!/usr/bin/env bash
set -Eeuo pipefail

WARP_ENABLED="${WARP_ENABLED:-true}"
WARP_REQUIRED="${WARP_REQUIRED:-true}"
WARP_HTTP_PORT="${WARP_HTTP_PORT:-9091}"
WARP_DIR="${WARP_DIR:-/tmp/warp}"
WARP_TRACE_URL="${WARP_TRACE_URL:-https://www.cloudflare.com/cdn-cgi/trace}"

cleanup() {
  if [[ -n "${PO_TOKEN_PID:-}" ]] && kill -0 "$PO_TOKEN_PID" 2>/dev/null; then
    kill "$PO_TOKEN_PID" 2>/dev/null || true
    wait "$PO_TOKEN_PID" 2>/dev/null || true
  fi
  if [[ -n "${WIREPROXY_PID:-}" ]] && kill -0 "$WIREPROXY_PID" 2>/dev/null; then
    kill "$WIREPROXY_PID" 2>/dev/null || true
    wait "$WIREPROXY_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

start_po_token_sidecar() {
  if [[ "${PO_TOKEN_ENABLED:-false}" != "true" ]]; then
    return 0
  fi

  local sidecar_port="${PO_TOKEN_PORT:-4416}"
  local sidecar_log="${WARP_DIR:-/tmp}/po-token-sidecar.log"
  node scripts/po-token-sidecar.mjs >"$sidecar_log" 2>&1 &
  PO_TOKEN_PID=$!

  for attempt in $(seq 1 20); do
    if ! kill -0 "$PO_TOKEN_PID" 2>/dev/null; then
      echo "PO-token sidecar exited during startup; continuing without PO-token enhancement." >&2
      tail -n 30 "$sidecar_log" >&2 || true
      return 0
    fi
    if curl --silent --show-error --max-time 2 "http://127.0.0.1:${sidecar_port}/health" >/dev/null 2>&1; then
      echo "PO-token sidecar is listening on 127.0.0.1:${sidecar_port}."
      return 0
    fi
    sleep 0.25
  done

  echo "PO-token sidecar did not become reachable; continuing with the standard extractor." >&2
}

start_application() {
  start_po_token_sidecar
  exec node dist/index.js
}

if [[ "$WARP_ENABLED" != "true" ]]; then
  echo "WARP is disabled; starting the application without a local proxy."
  start_application
fi

mkdir -p "$WARP_DIR"
ACCOUNT_FILE="$WARP_DIR/wgcf-account.toml"
PROFILE_FILE="$WARP_DIR/wgcf-profile.conf"
PROXY_CONFIG="$WARP_DIR/wireproxy.conf"
WIREPROXY_LOG="$WARP_DIR/wireproxy.log"

if [[ ! -s "$ACCOUNT_FILE" ]]; then
  echo "Registering an ephemeral Cloudflare WARP account."
  wgcf register --accept-tos --config "$ACCOUNT_FILE"
fi

if [[ ! -s "$PROFILE_FILE" ]]; then
  echo "Generating the WARP WireGuard profile."
  wgcf generate --config "$ACCOUNT_FILE" --profile "$PROFILE_FILE"
fi

if [[ ! -s "$PROXY_CONFIG" ]]; then
  cp "$PROFILE_FILE" "$PROXY_CONFIG"
  cat >> "$PROXY_CONFIG" <<EOF

[Socks5]
BindAddress = 127.0.0.1:1080

[http]
BindAddress = 127.0.0.1:${WARP_HTTP_PORT}
EOF
fi

rm -f "$WIREPROXY_LOG"
wireproxy -c "$PROXY_CONFIG" >"$WIREPROXY_LOG" 2>&1 &
WIREPROXY_PID=$!

ready=false
for attempt in $(seq 1 30); do
  if ! kill -0 "$WIREPROXY_PID" 2>/dev/null; then
    echo "wireproxy exited before becoming ready:" >&2
    cat "$WIREPROXY_LOG" >&2 || true
    exit 1
  fi
  if curl --fail --silent --show-error --max-time 8 \
      --proxy "http://127.0.0.1:${WARP_HTTP_PORT}" \
      "$WARP_TRACE_URL" | grep -Eq '^warp=(on|plus)$'; then
    ready=true
    break
  fi
  sleep 2
done

if [[ "$ready" != "true" ]]; then
  echo "WARP proxy did not become ready on 127.0.0.1:${WARP_HTTP_PORT}." >&2
  cat "$WIREPROXY_LOG" >&2 || true
  if [[ "$WARP_REQUIRED" == "true" ]]; then
    exit 1
  fi
  echo "WARP_REQUIRED=false; starting the application without proxy variables."
  start_application
fi

export HTTP_PROXY="http://127.0.0.1:${WARP_HTTP_PORT}"
export HTTPS_PROXY="http://127.0.0.1:${WARP_HTTP_PORT}"
export ALL_PROXY="http://127.0.0.1:${WARP_HTTP_PORT}"
export http_proxy="$HTTP_PROXY"
export https_proxy="$HTTPS_PROXY"
export all_proxy="$ALL_PROXY"

echo "WARP proxy is ready on 127.0.0.1:${WARP_HTTP_PORT}; starting the application."
start_application
