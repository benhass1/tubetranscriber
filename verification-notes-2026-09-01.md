# Verification notes — 2026-09-01

- Cloudflare Worker `/healthz` returned `ok: true`, `runtime: cloudflare-worker`, `transcriptCacheConfigured: true`, and `turnstileConfigured: true`.
- GitHub `main` is at commit `527111d` after the explicit-rendering Turnstile fix.
- Render service `srv-da4fgcrtqb8s73fom52g` detected commit `527111d` and started an auto-deploy; the latest dashboard observation showed it still in progress, while `b6a8106` remained the last successfully deployed commit.
- The live page before the fix had a Turnstile container and hidden response field but no token; the configured Turnstile widget is Invisible, so no visible checkbox is expected.
- The frontend fix loads Turnstile with `?render=explicit`, waits for `turnstile.ready()`, renders with `execution: "render"`, emits the token to the transcript gate, and resets the widget after the one-shot request.
- No WARP, Contabo, PC, yt-dlp, browser extraction, or third-party transcript route was added to the active path.

- The user’s screenshot showed a Turnstile client runtime exception originating from `api.js?render=explicit` while the transcript UI was loading.
- The first explicit-render fix still used an HTMLElement target. The follow-up commit `00dcd3d` now passes the documented container ID string to `turnstile.render()`.
- Render detected `00dcd3d`; at the latest dashboard check the deployment was still building, with `527111d` remaining the last successful live commit. No Worker code or secret was changed.

## Official Cloudflare references

Cloudflare’s client-rendering documentation confirms that explicit rendering uses `api.js?render=explicit`, that `turnstile.ready()` should be used before rendering, that the widget can be rendered with a container selector, and that `turnstile.reset(widgetId)` manages lifecycle state. It also states that tokens are single-use and expire after five minutes. Sources: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/ and https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/.

The user’s runtime screenshot then identified two concrete integration errors in sequence: first, `async/defer` was incompatible with the readiness call in this browser context; second, the container target needed the CSS selector form. The final selector fix is commit `c26fe29`.
