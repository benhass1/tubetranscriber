# TubeTranscriber — Google AI Studio Python Build Prompt

## How to use this prompt

Paste the **Copy-ready build prompt** below into Google AI Studio **Build mode**. Google AI Studio’s default web-app runtime is Node.js, so the prompt explicitly asks it to create a Python/FastAPI codebase that can be synchronized to GitHub and deployed as a Docker container on Cloud Run, rather than pretending its default preview runtime is Python. AI Studio supports GitHub export and Cloud Run deployment for generated applications.[1]

> The product uses YouTube URLs and must treat YouTube’s bot checks as a normal upstream limitation. In testing, both Manus-hosted and Vercel-hosted cloud containers received YouTube’s `Sign in to confirm you’re not a bot` response for a captioned video. The application must **not** try to bypass this with users’ browser cookies. Instead, it must use a server-side managed transcript provider only when direct retrieval is restricted or has no captions.

## Copy-ready build prompt

```text
Build a production-oriented, public web application named **TubeTranscriber**. It turns a public YouTube video URL into a readable transcript. Use a **Python-first architecture** that I can export to GitHub and deploy to Google Cloud Run with Docker.

IMPORTANT PLATFORM INSTRUCTION:
- Google AI Studio may preview web apps using a Node.js environment. Still generate the complete Python application described below, including all Python source files, `requirements.txt`, tests, `.env.example`, Dockerfile, and Cloud Run deployment instructions.
- The final source of truth must be a Python FastAPI project, not a Node/Express backend. If you need a small amount of JavaScript, use it only in the browser UI or as a runtime dependency required by yt-dlp; do not implement the server in Node.
- Do not expose any API key in browser code, static files, HTML, Git history, logs, or error responses. Use server-side environment variables only.

PRODUCT GOAL:
Create TubeTranscriber, a simple YouTube transcript generator for ordinary visitors. A visitor pastes a YouTube URL, the app retrieves the transcript when permitted, displays a clean continuous plain-text reading view without visible timestamps, and allows download as TXT, JSON, or SRT. No sign-in is required. Transcript history must stay in the visitor’s browser using localStorage; do not create user accounts or server-side user history.

DESIGN REQUIREMENTS:
- Brand: `TubeTranscriber` everywhere.
- Use a calm white-and-blue visual system, not gradients or neon. Include a persistent light/dark mode toggle backed by localStorage.
- Typography should be clean, readable, and professional.
- Create a responsive public interface suitable for desktop and mobile.
- Home page: top navigation, hero, a prominent YouTube URL input, CTA button, concise feature section, FAQ preview, and legal-footer links.
- Transcript reader page: a top “New transcript” inline URL form, video title/channel/thumbnail when available, a plain-text transcript reader, in-text search/highlight, a reliable Copy all text button, and clearly left-aligned export rows labelled exactly `Plain text`, `JSON data`, and `SRT subtitles`.
- Provide good loading, empty, error, and retry states. Do not say “no captions” when the actual failure is a provider outage, quota limit, bot check, or temporary upstream restriction.
- Legal routes: `/privacy`, `/terms`, `/copyright`, and `/contact`.

CORE FUNCTIONAL REQUIREMENTS:
1. Accept only valid public YouTube watch, youtu.be, Shorts, embed, and live URLs. Normalize them to the canonical video ID and canonical watch URL.
2. Retrieve basic public metadata safely using YouTube oEmbed when available: title, author/channel, and thumbnail. Metadata failure must not prevent a transcript lookup.
3. Use a three-stage transcript strategy described below. Always return one normalized data shape:

   TranscriptSegment:
   - text: string
   - start_ms: integer
   - duration_ms: integer | null
   - language: string | null

   TranscriptResult:
   - video_id: string
   - canonical_url: string
   - title: string | null
   - channel: string | null
   - thumbnail_url: string | null
   - language: string | null
   - source: `youtube_captions` | `yt_dlp` | `supadata`
   - segments: list[TranscriptSegment]
   - plain_text: string
   - fetched_at: ISO-8601 UTC timestamp

4. Render plain text by joining cleaned segment text with sensible spaces and paragraphs. Do not show timecodes in the primary reading view.
5. Generate exports client-side or server-side from the normalized segments:
   - TXT: readable continuous plain text.
   - JSON: metadata and normalized segments.
   - SRT: valid sequential subtitle numbers with `HH:MM:SS,mmm --> HH:MM:SS,mmm` time ranges. If duration is missing, infer a short duration without overlapping the next segment.
6. Store the last 20 successful transcript entries in localStorage only. Each history item should contain title, thumbnail URL, canonical URL, source, and created time. Include reopen, delete one item, and clear history controls.

PYTHON ARCHITECTURE:
- Python 3.12, FastAPI, Uvicorn/Gunicorn, Pydantic v2, httpx, Jinja2 templates, and a small amount of progressive-enhancement JavaScript or Alpine.js. Keep the UI server-rendered first where practical for SEO.
- Organize code clearly:
  - `app/main.py` — FastAPI app and routes
  - `app/config.py` — validated environment settings
  - `app/models.py` — Pydantic models
  - `app/services/youtube_urls.py` — URL parsing/normalization
  - `app/services/metadata.py` — oEmbed metadata
  - `app/services/transcripts.py` — orchestrator
  - `app/services/direct_captions.py` — direct caption attempt
  - `app/services/ytdlp_adapter.py` — safe yt-dlp subprocess adapter
  - `app/services/supadata_adapter.py` — managed fallback adapter
  - `app/services/exporters.py` — TXT/JSON/SRT generation
  - `app/templates/` and `app/static/`
  - `tests/` with pytest tests
- Use typed domain exceptions such as `NoCaptionsError`, `UpstreamRestrictedError`, `UpstreamRateLimitError`, `FallbackQuotaError`, and `InvalidYoutubeUrlError`.
- Use structured logging. Log error class and provider/source, but never log secret values or complete visitor IP addresses.

THREE-STAGE TRANSCRIPT STRATEGY:

Stage A — direct public captions:
- First attempt a reliable public caption retrieval method appropriate for Python.
- If it returns valid captions, normalize and return them with `source = youtube_captions`.

Stage B — yt-dlp fallback:
- When the first method does not return usable captions, run `yt-dlp` as a bounded subprocess. Include a timeout, temporary per-request directory, no shell interpolation, `--no-playlist`, no media download, and cleanup in a `finally` block.
- Install yt-dlp with the optional curl-cffi capability in the container. Include a compatible JavaScript runtime if yt-dlp requires it for YouTube challenge support.
- Attempt manual and automatic subtitle tracks. Convert VTT/JSON subtitle data to `TranscriptSegment` records.
- Correctly classify the following messages as `UpstreamRestrictedError`, not as “no captions”: `Sign in to confirm you’re not a bot`, HTTP 403, HTTP 429, or known cloud/IP block messages.
- Do not use `--cookies-from-browser`, imported browser cookies, residential proxy workarounds, CAPTCHA bypassing, or any attempt to evade YouTube access controls.

Stage C — managed transcript fallback:
- Only invoke this server-side fallback when Stage A/B return `NoCaptionsError`, `UpstreamRestrictedError`, or `UpstreamRateLimitError`.
- Read the key only from `SUPADATA_API_KEY`.
- Request `GET https://api.supadata.ai/v1/transcript?url=<canonical-youtube-url>` with an `x-api-key` header. Use `httpx` with strict connect/read timeouts and retry only idempotent temporary failures with exponential backoff and jitter.
- Parse the documented result shape: a `content` list whose records include `text`, `offset` in milliseconds, `duration` in milliseconds, and optional `lang`. Normalize it into `TranscriptSegment` records and return `source = supadata`.
- Handle HTTP 401, 402, 429, and 5xx separately. A missing/invalid key, paid-plan requirement, fallback quota limit, or provider outage must produce a clear, non-technical user message. Never silently downgrade it to “No captions available.”
- If all three stages fail, return an honest message explaining whether captions are unavailable, YouTube temporarily restricted automated retrieval, or the fallback provider is unavailable.
- Cache successful normalized results in memory for 10 minutes by video ID and requested language. Do not cache error results. Make caching optional and safe for multiple Cloud Run instances.

HTTP API:
- `GET /` — SEO-rendered landing page.
- `GET /transcript?url=...` — transcript reader page.
- `POST /api/transcripts` — accepts `{ "url": string, "language": string | null }` and returns `TranscriptResult` JSON.
- `GET /api/transcripts/export` — accepts an already validated transcript payload or a short-lived server-side cache key and `format=txt|json|srt`; set safe content types and Content-Disposition file names.
- `GET /healthz` — lightweight health check with no upstream calls.
- Do not expose arbitrary file fetch or arbitrary URL fetching endpoints.

SECURITY AND RELIABILITY:
- Validate and normalize URLs before any request. Only allow canonical YouTube hostnames. Block localhost, private IPs, raw IP addresses, non-HTTP(S) schemes, and redirect chains to non-YouTube hosts to prevent SSRF.
- Use request-size limits, basic per-IP rate limiting, security headers, CSP, secure error handling, and CORS restricted to the production site origin.
- Read configuration from environment variables. Include `.env.example` with keys but never values:
  - `SUPADATA_API_KEY=`
  - `APP_BASE_URL=`
  - `ALLOWED_ORIGINS=`
  - `RATE_LIMIT_PER_MINUTE=`
  - `TRANSCRIPT_TIMEOUT_SECONDS=`
- Keep all third-party credentials server-side. Do not require a Gemini API key for transcript extraction.
- Include copyright/DMCA wording. State that the service is not affiliated with YouTube or Google, transcript availability depends on the source video/provider, and users must respect third-party rights and platform terms.

SEO REQUIREMENTS:
- Server-render meaningful HTML, not a client-only empty shell.
- Use the requested phrases naturally in title tags, metadata, headings, FAQ, and page copy:
  - `youtube to transcript`
  - `youtube transcript generator`
  - `youtube video to transcript`
  - `youtube video transcript generator`
- Home page needs one H1: `YouTube video to transcript made easy`.
- Add meaningful H2/H3 content, canonical URLs, Open Graph and Twitter metadata, JSON-LD WebApplication and FAQPage schema, `robots.txt`, `sitemap.xml`, and `llms.txt`.
- Do not index user transcript-result URLs or browser-local history pages. Do index public product/legal pages.

DOCKER AND CLOUD RUN REQUIREMENTS:
- Generate a secure, production-ready Dockerfile for Cloud Run. The image must include Python, the yt-dlp runtime dependencies, and any required JavaScript runtime only for yt-dlp compatibility.
- Use a non-root user where practical, set `PYTHONDONTWRITEBYTECODE=1`, and listen on `$PORT` at `0.0.0.0`.
- Provide `docker compose` only if it adds value; do not require a database.
- Provide exact Cloud Run deployment documentation that uses server-side environment variables/secrets, including `SUPADATA_API_KEY`.
- Include a `README.md` with local setup, tests, Docker build/run, GitHub workflow, Cloud Run deployment, and a note that cloud IPs can encounter YouTube bot checks so the managed fallback is intentional.

TESTS AND ACCEPTANCE CRITERIA:
- Create pytest coverage for YouTube URL parsing, SSRF rejection, direct success, yt-dlp restricted/bot-check classification, fallback success, fallback quota/error handling, plain-text normalization, TXT/JSON/SRT exports, and the no-login/localStorage history contract.
- Mock all external providers in tests. Do not ship test keys.
- Include a manual smoke-test checklist using a known captioned YouTube video and a mocked bot-check condition.
- Verify that a direct success does not call Supadata.
- Verify that a simulated `Sign in to confirm you’re not a bot` yt-dlp output does call Supadata.
- Verify a Supadata 429 results in an “fallback temporarily unavailable or quota reached” state, not a false “no captions” state.
- Do not invent testimonials, user ratings, or reviews.

DELIVERABLES:
1. Generate the full Python repository and explain the directory structure.
2. Generate all code, templates, CSS, minimal client JavaScript, Dockerfile, requirements, `.env.example`, tests, README, robots/sitemap/llms files, and legal pages.
3. Run available tests/build checks and fix errors before calling the project complete.
4. Show a concise setup screen listing the one required later secret: `SUPADATA_API_KEY`.
5. Provide a short deployment checklist for exporting/syncing to GitHub and deploying the Dockerized Python app to Cloud Run.

Do not substitute this specification with a simplified mockup. Start by creating the repository structure and the fully functional FastAPI implementation.
```

## Implementation note

The prompt intentionally separates **the AI Studio generation environment** from **the deployment runtime**. AI Studio currently creates web apps with a Node.js server-side runtime, but it can export or synchronize code to GitHub and deploy applications to Cloud Run.[1] Therefore, the most reliable instruction is to have AI Studio generate the Python/Docker project and then run that project in Cloud Run, where the custom Python plus `yt-dlp` stack is controlled by the Dockerfile.

The managed fallback is specified as an adapter rather than as hardcoded frontend logic. Supadata documents the transcript request as `GET /v1/transcript?url=...` with an `x-api-key` header and returns text segments with millisecond offsets and durations, which maps directly to plain text and SRT exports.[2] [3]

## References

[1]: https://ai.google.dev/gemini-api/docs/aistudio-build-mode "Build apps in Google AI Studio"

[2]: https://docs.supadata.ai/api-reference/introduction "Supadata API Reference"

[3]: https://supadata.ai/youtube-transcript-api "Supadata YouTube Transcript API"
