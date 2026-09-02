# TubeTranscriber Cloudflare transcript Worker

The Cloudflare Worker is the only component that makes YouTube-bound transcript requests. It validates the canonical YouTube URL, reads the signed caption track returned by YouTube, parses the transcript, prefers the original-language track, and stores successful results in Cloudflare KV for seven days.

The public application no longer embeds an in-app Turnstile widget. Cloudflare’s edge Managed Challenge protects the transcript HTML page before the application starts the transcript request. The application does not receive or forward a Turnstile token.

## Worker bindings

Configure these values in the Cloudflare Worker dashboard. Do not commit secrets or namespace IDs to this repository.

| Binding | Type | Purpose |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | Encrypted secret | Legacy compatibility only; the public application uses the edge Managed Challenge and does not send an in-app token |
| `YOUTUBE_PLAYER_API_KEY` | Variable or encrypted secret | Public InnerTube Player request fallback |
| `TRANSCRIPT_CACHE` | KV namespace | Seven-day successful transcript cache |

The Worker health endpoint is:

```text
https://<worker-hostname>/healthz
```

It must return non-secret readiness fields including `ok`, `runtime`, `transcriptCacheConfigured`, and `playerConfigured`. It must never return secret values.

## Cloudflare WAF configuration

Create this rule in the Cloudflare dashboard for the `tubetranscriber.com` zone under **Security → WAF → Custom rules**. Choose **Managed Challenge** as the action. Do not use Block, JavaScript Challenge, Interactive Challenge, or an in-page Turnstile widget.

If the previous API Managed Challenge rule exists, pause or remove it. The API mutation should not be directly challenged because a clearance cookie may not be available consistently across rapid XHR requests.

### Rule — protect the transcript page

Use this expression:

```text
(http.request.uri.path eq "/transcript" or starts_with(http.request.uri.path, "/transcript/"))
```

Set:

```text
Action: Managed Challenge
Rule name: TubeTranscriber transcript page managed challenge
```

Do not challenge `/`, `/blog`, `/about`, `/assets/`, `/api/`, or other static files with this page rule. Do not enable Under Attack Mode site-wide.

Cloudflare’s challenge is edge-level protection. It may show a verification interstitial or run silently for a trusted browser, and it establishes Cloudflare clearance before the protected page loads. The browser then submits the normal transcript POST without a second API challenge. A successful edge challenge is separate from the Worker’s YouTube retrieval result; YouTube can still refuse an uncached upstream request.

## Application request flow

The browser submits the normal form immediately and calls `transcript.lookup` without waiting for an in-app widget. Cloudflare challenges the `/transcript` HTML page at the edge when required; the API POST is not directly challenged. Render serves the existing UI and tRPC adapter, but it does not fetch YouTube. The adapter calls this Worker, and the Worker performs the YouTube retrieval and KV cache write.

```text
Browser
  → Cloudflare edge Managed Challenge on GET /transcript
  → Render UI/tRPC adapter
  → Cloudflare transcript Worker
  → YouTube caption/player endpoints
  → Cloudflare KV on successful transcript
  → existing transcript UI
```

The adapter timeout remains bounded. If YouTube returns a bot-check, `LOGIN_REQUIRED`, upstream `429`, empty timedtext, or another transient upstream refusal, the application should present a temporary caption-service error rather than incorrectly claiming that the video is private.

## Safe verification

First check the Worker health route. Then open the application and submit a public YouTube URL. In browser Network tools, the transcript request should be a `POST` to:

```text
/api/trpc/transcript.lookup?batch=1
```

Do not open that mutation URL directly in the address bar: a direct `GET` returns the expected tRPC `405 Unsupported GET-request` response. Verify that the browser receives the Cloudflare challenge when required, then that the POST proceeds to the application. Never share request headers, cookies, clearance values, API keys, or challenge tokens in diagnostics.

## Deployment notes

The Worker source is deployed separately from the GitHub/Render application. When `worker.js` changes, paste the validated file into **Workers & Pages → tubetranscriber-transcript-proxy → Edit code**, preserve the existing bindings, and click **Deploy**. Frontend and adapter changes are deployed through the connected GitHub `main` branch and Render.

The active transcript architecture intentionally does not use Contabo, a home-PC tunnel, WARP, browser-side CORS extraction, `yt-dlp`, audio transcription, Whisper, or a third-party transcript API.

## Rollback

To roll back the edge gate, pause or remove only the transcript-page custom WAF rule after confirming the application is no longer intended to use Managed Challenge. Do not delete the Worker, KV namespace, or existing encrypted bindings as part of a WAF rollback.

Keep any legacy infrastructure inactive unless a separate architecture decision explicitly approves a new egress path.

## References

- [Cloudflare WAF custom rules](https://developers.cloudflare.com/waf/custom-rules/)
- [Cloudflare Managed Challenge](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/)
- [Cloudflare Workers KV routing example](https://developers.cloudflare.com/kv/examples/routing-with-workers-kv/)
- [Cloudflare Workers KV consistency](https://developers.cloudflare.com/kv/concepts/how-kv-works/)
