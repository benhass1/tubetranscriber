# TubeTranscriber Browser Capture — proof of concept

This Manifest V3 extension is the reliable browser-side fallback for videos that the server cannot retrieve. It runs on an actual `youtube.com` tab, opens YouTube’s **Show transcript** panel, reads the caption rows exposed in that page, normalizes them into timed segments, and posts them to TubeTranscriber’s public `transcript.ingestBrowser` procedure. The server validates the video ID and writes the result to Upstash, so later requests become cache hits.

## Install locally

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose this directory: `poc/youtube-transcript-extension`.
5. Open a public YouTube video that visibly has **Show transcript**.
6. Click the extension icon and choose **Capture transcript**.
7. Return to TubeTranscriber and submit the same video URL. Once the upload succeeds, the transcript should be served from Upstash.

No YouTube password, cookie, API key, or Worker secret is placed in the extension. The extension only reads the transcript DOM on a matching YouTube page and sends normalized caption text to the TubeTranscriber endpoint over HTTPS.

## What it does and does not solve

This POC avoids the website’s CORS limitation because the content script executes in the first-party YouTube page. It also avoids making the original caption request from Render. It does not guarantee captions for videos where YouTube does not expose **Show transcript**, where the transcript is not rendered in the DOM, or where the extension is blocked by browser policy.

The extension is intentionally a fallback, not the primary path. The recommended free chain is:

| Priority | Path | Role |
| --- | --- | --- |
| 1 | Upstash Redis | Return previously captured transcripts immediately. |
| 2 | Render + authenticated Cloudflare Worker + WARP/library | Fetch uncached videos server-side. |
| 3 | Chrome Browser Capture | Capture a transcript from a real YouTube tab when the server receives a temporary block. |
| 4 | Self-hosted bgutil PO-token provider with yt-dlp | Optional experiment; may improve PO-token-related failures but cannot solve IP reputation blocks. |
| 5 | Public Invidious/Piped instances | Opportunistic, health-checked fallback only; not suitable as a primary dependency. |

## Operational notes

The extension must be reloaded after source changes from `chrome://extensions`. The content selectors are deliberately conservative and may need adjustment if YouTube changes its transcript DOM. The server ingestion endpoint limits segment count, text length, metadata length, and requires the submitted video ID to match the URL.

This POC is based on Chrome’s documented content-script model, where scripts can read and modify the matching page DOM and communicate with the extension runtime. YouTube’s own help documentation confirms that transcripts are exposed through the **Show transcript** control for videos with captions.

## References

1. [Chrome Developers — Content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
2. [YouTube Help — View video transcripts](https://support.google.com/youtube/answer/15930243?hl=en)
3. [yt-dlp — PO Token Guide](https://github.com/yt-dlp/yt-dlp/wiki/PO-Token-Guide)
4. [bgutil-ytdlp-pot-provider](https://github.com/Brainicism/bgutil-ytdlp-pot-provider)
