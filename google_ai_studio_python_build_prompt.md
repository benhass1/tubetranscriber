# TubeTranscriber — Google AI Studio Prompt for a Python-Only Build

## Use this version

Paste the complete prompt below into Google AI Studio **Build mode**. It requests a Python/FastAPI project that uses only the Python-native `youtube-transcript-api` package and the Python `yt-dlp` package. It explicitly excludes Supadata, proxies, user cookies, and every other paid or managed transcript fallback.

> Google AI Studio web builds use a Node.js server-side runtime by default, so this prompt asks AI Studio to generate an exportable Python repository and Docker configuration for Cloud Run. AI Studio supports GitHub synchronization and Cloud Run deployment for generated apps.[1]

## Copy-ready build prompt

```text
Create a polished, production-oriented public web application named **TubeTranscriber**. It accepts a public YouTube URL and returns a readable transcript when public YouTube captions are accessible. Build this as an exportable **Python 3.12 + FastAPI** repository suitable for Docker and Google Cloud Run.

PLATFORM AND ARCHITECTURE:

Google AI Studio may preview web apps with a Node.js runtime. Nevertheless, generate the full source of a Python application, including Python files, FastAPI routes, Jinja templates, static CSS/JavaScript, `requirements.txt`, Dockerfile, `.env.example`, pytest tests, and README. The deployed backend must be Python/FastAPI rather than Node/Express. I should be able to sync the generated project to GitHub and deploy it to Cloud Run as a Docker container.

Use this source layout:

app/
  main.py                 # FastAPI app, routes, middleware
  config.py               # Pydantic settings and environment validation
  models.py               # Typed request/response models
  services/
    youtube_urls.py       # strict URL validation and video-ID extraction
    metadata.py           # YouTube oEmbed metadata client
    transcript_service.py # two-stage retrieval orchestrator
    ytt_api_adapter.py    # youtube-transcript-api adapter
    ytdlp_adapter.py      # yt-dlp Python API adapter
    exporters.py          # TXT, JSON, and SRT serializers
  templates/
  static/
tests/
requirements.txt
Dockerfile
.env.example
README.md

PRODUCT REQUIREMENTS:

The product is a simple YouTube transcript generator with no account creation, no login, and no server-side user history. A visitor pastes a supported public YouTube URL, reads a clean continuous plain-text transcript, searches it, copies all text, or downloads TXT, JSON, and SRT. Keep the last 20 successful items in the visitor’s own browser using localStorage only. Provide reopen, delete, and clear-history actions.

The brand name must be **TubeTranscriber** everywhere. Use a restrained white-and-blue design without neon or visual clutter. Add an accessible light/dark theme toggle persisted through localStorage. Design responsively for mobile and desktop.

The home page must have a top navigation bar, hero, a prominent URL field, feature explanations, FAQ preview, and footer navigation. Use this H1 exactly: **YouTube video to transcript made easy**. The reader page must include an inline **New transcript** URL form above results, video metadata where available, in-transcript search, Copy all text, and three distinct left-aligned export rows labeled **Plain text**, **JSON data**, and **SRT subtitles**.

Create public legal pages at `/privacy`, `/terms`, `/copyright`, and `/contact`. Include a notice that TubeTranscriber is not affiliated with YouTube or Google, that transcript availability depends on YouTube/public captions, and that visitors must respect applicable rights and platform terms.

STRICT RETRIEVAL POLICY — NO MANAGED FALLBACK:

Use only these two direct Python retrieval methods:

1. First, use `youtube-transcript-api` as the primary caption retrieval adapter. Call it with the **YouTube video ID**, not an arbitrary URL. Prefer human-created captions in the requested language when available, then generated captions, with a sensible language priority such as `[requested_language, "en"]`.

2. If the first adapter returns no usable transcript, use the Python `yt-dlp` library as a fallback. Use `yt_dlp.YoutubeDL` through Python code, not shell command construction. Configure it safely for caption extraction only: no playlist, no media download, no arbitrary post-processing, bounded timeout, a temporary output location, and cleanup in `finally`. Retrieve manual and automatic subtitle tracks and normalize VTT/JSON subtitle data into one shared segment structure.

Do **not** add Supadata, any other commercial/managed transcript API, residential or rotating proxies, imported browser cookies, `--cookies-from-browser`, CAPTCHA workarounds, user authentication cookies, or any mechanism intended to evade YouTube’s access controls. Do not ask visitors to upload browser cookies.

Cloud-hosted applications can be blocked by YouTube even for a video that has captions. Treat `RequestBlocked`, `IpBlocked`, `Sign in to confirm you’re not a bot`, HTTP 403, HTTP 429, bot-check errors, and rate-limit errors as truthful upstream-access restrictions. Do not misrepresent them as “No captions available.” When both direct methods are blocked, show this exact type of message:

“YouTube temporarily restricted automated caption retrieval from this service. Please try another video or try again later.”

When captions are genuinely missing, show a different message:

“No public captions are available for this video.”

Never pretend the service can guarantee a transcript for every YouTube video.

NORMALIZED DATA MODEL:

Create Pydantic v2 models:

TranscriptSegment:
- `text: str`
- `start_ms: int`
- `duration_ms: int | None`
- `language: str | None`

TranscriptResult:
- `video_id: str`
- `canonical_url: str`
- `title: str | None`
- `channel: str | None`
- `thumbnail_url: str | None`
- `language: str | None`
- `source: Literal["youtube_transcript_api", "yt_dlp"]`
- `segments: list[TranscriptSegment]`
- `plain_text: str`
- `fetched_at: datetime`

Normalize every provider result into these models. Clean caption artifacts without altering meaning. Build `plain_text` by joining captions with intelligent spacing and paragraph breaks. Do not show timestamps in the main reader, but retain them internally for SRT export.

API AND PAGES:

- `GET /` renders a crawler-readable landing page.
- `GET /transcript?url=...` renders the reader shell and validates input.
- `POST /api/transcripts` accepts `{ "url": string, "language": string | null }` and returns `TranscriptResult` JSON or a well-typed application error.
- `POST /api/exports` accepts only a short-lived, validated cache token and `format=txt|json|srt`; it returns a file response with safe headers. Never accept arbitrary paths or arbitrary remote URLs.
- `GET /healthz` returns a small JSON health response with no YouTube call.

For performance, use an in-memory 10-minute cache for **successful** normalized transcript results keyed by video ID and language. Never cache errors. Keep the design safe for Cloud Run’s stateless multi-instance behavior; persistent caching is not required.

SECURITY, VALIDATION, AND ERROR HANDLING:

Accept only public YouTube watch URLs, short `youtu.be` URLs, Shorts, live, and embed URLs. Extract and normalize only valid YouTube video IDs. Reject raw IPs, localhost, private networks, unknown hostnames, non-HTTP(S) schemes, malformed IDs, redirect URLs, and any URL that could lead to SSRF.

Add basic IP rate limiting, request size limits, security headers, CSP, safe CORS restricted to the production origin, structured logs, and user-safe errors. Do not log raw private payloads or secrets. There are no API keys required for transcript retrieval in this version, so `.env.example` should contain only non-secret deployment settings such as:

APP_BASE_URL=
ALLOWED_ORIGINS=
RATE_LIMIT_PER_MINUTE=20
TRANSCRIPT_TIMEOUT_SECONDS=25

METADATA:

Use YouTube oEmbed for public title, channel/author, and thumbnail information if it is available. Metadata failure must never block a transcript attempt.

EXPORTS:

Generate exports from the normalized segment list.

- TXT is continuous readable plain text.
- JSON includes metadata, source, and segments.
- SRT uses proper sequential numbering and `HH:MM:SS,mmm --> HH:MM:SS,mmm` time ranges. When duration is missing, infer a short end time that does not overlap the next segment.

SEO:

Server-render meaningful HTML. Naturally use these target phrases in crawlable content, headings, FAQ text, and metadata:

- youtube to transcript
- youtube transcript generator
- youtube video to transcript
- youtube video transcript generator

Add canonical URLs, title/description metadata, Open Graph and Twitter tags, JSON-LD for WebApplication and FAQPage, `robots.txt`, `sitemap.xml`, and `llms.txt`. Do not index reader results or browser-local history pages, but do index the public landing and legal pages.

DOCKER AND CLOUD RUN:

Create a production Dockerfile based on a slim Python image. Install Python dependencies including `youtube-transcript-api`, `yt-dlp[default,curl-cffi]`, `fastapi`, `uvicorn`, `gunicorn`, `httpx`, and `pydantic-settings`. Add a compatible JavaScript runtime only if yt-dlp needs it for YouTube challenge parsing; it is a yt-dlp runtime dependency, not the application backend. Run as a non-root user where feasible, set `PYTHONDONTWRITEBYTECODE=1`, and serve FastAPI on `0.0.0.0:$PORT`.

The README must include local development, pytest, Docker build/run, GitHub synchronization from AI Studio, and Cloud Run deployment instructions. It must state clearly that YouTube can block cloud IPs and that this direct-only version returns an honest restriction message rather than attempting a bypass.

TEST REQUIREMENTS:

Use pytest and mocked provider responses. Write tests for URL normalization; SSRF rejection; primary `youtube-transcript-api` success; generated-caption language selection; yt-dlp fallback success; no-captions classification; bot-check/HTTP 403/HTTP 429 restriction classification; plain-text cleanup; TXT/JSON/SRT export correctness; and the browser-local history contract.

Verify that a primary success does not invoke yt-dlp. Verify that a missing primary transcript invokes yt-dlp. Verify that both methods returning an upstream restriction produces the correct temporary-restriction message. Do not create fake reviews, ratings, testimonials, or mock customer data.

DELIVERABLES:

Generate the entire working Python repository rather than a visual mockup. Show the file tree, write the code, run available tests and static checks, fix any errors, and provide a short deployment checklist at the end. Start by generating the FastAPI project structure and the retrieval adapters.
```

## Why this prompt uses two direct Python adapters

The official `youtube-transcript-api` package accepts a video ID and returns caption snippets with text, start time, and duration. It can retrieve manual or generated captions and supports language preference.[2] The prompt uses `yt-dlp` only as a secondary direct adapter; its current documentation recommends the `yt-dlp-ejs` dependency and a compatible JavaScript engine for robust YouTube support, while the application itself remains Python/FastAPI.[3]

The specification deliberately requests clear upstream-restriction handling because `youtube-transcript-api` documents that cloud-provider IPs may be blocked by YouTube.[2] No alternative provider or bypass mechanism is included.

## References

[1]: https://ai.google.dev/gemini-api/docs/aistudio-build-mode "Build apps in Google AI Studio"

[2]: https://github.com/jdepoix/youtube-transcript-api "youtube-transcript-api documentation"

[3]: https://github.com/yt-dlp/yt-dlp "yt-dlp documentation"
