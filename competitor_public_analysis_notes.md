# Public Workflow Notes: YouTubeToTranscript.com

## Scope

These notes record only public, visitor-visible behavior observed on 22 August 2026. They do not infer, inspect, reproduce, or use private server code, credentials, hidden endpoints, or access-control workarounds.

## Landing page observations

The home page presents a YouTube URL input and a “Get Free Transcript” action. It publicly advertises one-click copy, multiple languages, translation, a Chrome extension, and a separate commercial API. Its supporting content describes trimming unwanted sections, an AI prompt library, and a side-by-side video/transcript experience.

## Public example transcript observations

The site publicly links to a transcript reader for video ID `1WEAJ-DFkHE`. The reader visibly provides an embedded YouTube player, transcript text, copy control, a timestamp toggle, translation control, language selector, search, and AI-oriented content actions such as summary, key insights, clean transcript, and notes. The response content shows caption segments, but the visible interface does not disclose the underlying transcript-provider implementation.

The already-loaded public network resources include static reader assets and non-transcript content endpoints. No client-side transcript-fetch request was observed after loading the example route, which is consistent with the transcript being delivered as part of the server-rendered reader response. That observation does not identify the server’s provider, API key, or retrieval implementation.

## Preliminary implementation implication

The reusable concepts are product-level features: an embedded player paired with transcript text; selectable transcript display modes; language selection; copy; optional timestamp navigation; and explicit, separately scoped AI actions. The public pages provide no safe basis to copy the site’s backend retrieval approach. TubeTranscriber should retain its independently implemented Python-only adapters and honest restriction handling.

## Sources

- https://youtubetotranscript.com/
- https://youtubetotranscript.com/transcript?v=1WEAJ-DFkHE
