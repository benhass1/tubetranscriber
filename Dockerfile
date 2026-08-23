FROM ghcr.io/kingcc/warproxy:latest AS warproxy

FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash ca-certificates curl grep python3 python3-pip procps \
    && rm -rf /var/lib/apt/lists/*

COPY --from=warproxy /usr/local/bin/wgcf /usr/local/bin/wgcf
COPY --from=warproxy /usr/local/bin/wireproxy /usr/local/bin/wireproxy
COPY --from=warproxy /usr/local/bin/healthcheck /usr/local/bin/warproxy-healthcheck
RUN chmod +x /usr/local/bin/wgcf /usr/local/bin/wireproxy /usr/local/bin/warproxy-healthcheck \
    && python3 -m pip install --no-cache-dir --break-system-packages "youtube-transcript-api>=0.6,<1.0"

WORKDIR /app
COPY . .
COPY scripts/start-with-warp.sh /usr/local/bin/start-with-warp
RUN chmod +x /usr/local/bin/start-with-warp \
    && npm install -g corepack@latest \
    && corepack pnpm install \
    && corepack pnpm run build

ENV NODE_ENV=production \
    WARP_ENABLED=true \
    WARP_REQUIRED=true \
    WARP_HTTP_PORT=9091

CMD ["/usr/local/bin/start-with-warp"]
