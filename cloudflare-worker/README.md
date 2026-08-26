# TubeTranscriber transcript proxy

This Cloudflare Worker forwards only HTTPS requests needed by the transcript fetcher to YouTube caption and player endpoints. It requires an encrypted `WORKER_AUTH_TOKEN`, rejects non-YouTube targets, limits POST bodies, and returns upstream status codes such as `429` without hiding them from the application.

## Deploy the Worker

From this directory, authenticate Wrangler with the Cloudflare account that owns `tubetranscriber.com`:

```bash
npx wrangler login
npx wrangler deploy
npx wrangler secret put WORKER_AUTH_TOKEN
```

Use a long random value for `WORKER_AUTH_TOKEN`. The value must be the same secret configured in Render as `CF_WORKER_AUTH_TOKEN`; never commit it or place it in a URL.

After deployment, copy the Worker URL, for example `https://tubetranscriber-transcript-proxy.<account>.workers.dev`, and set the following Render environment variables:

```text
CF_WORKER_PROXY=https://tubetranscriber-transcript-proxy.<account>.workers.dev
CF_WORKER_AUTH_TOKEN=<the same encrypted value used by Wrangler>
```

Keep `WARP_ENABLED` and `WARP_HTTP_PROXY` unchanged if the existing WARP path is still required. When `CF_WORKER_PROXY` is set, the Python fetcher wraps its YouTube player-page, InnerTube, and caption-track requests in the Worker URL. When it is absent, those requests continue to use the existing direct/WARP behavior.

## Verify safely

A request without the auth header should return `401`. A request with an invalid target host should return `403`. The Worker does not accept arbitrary destinations and does not expose the secret in its public URL. Test a real transcript only after setting both Render variables and redeploying the application.
