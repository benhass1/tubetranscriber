# Local Verification Notes

The local preview was checked on the landing page, About/FAQ page, authenticated-history empty state, and transcript route. The responsive dark interface renders successfully across the public routes, including navigation, the persistent theme control, history actions, and footer links.

A public YouTube lookup returned metadata and a caption viewer during initial verification. Caption availability is controlled by YouTube and can vary per request or video; the viewer displays a specific unavailable-captions state when the source does not expose a transcript. Timestamp normalization now converts srv3 millisecond tracks to seconds before display and export.

After normalization, the public-video viewer showed an approximate duration of 00:03:31 and grouped caption blocks beginning at 00:00:01. The light-mode control changed the rendered page to the complete light palette and retained the chosen preference in the active browser session through local storage.

The transcript route now exposes the document title `Transcript Viewer | TubeTranscriber`. On a subsequent source request that did not return captions, the route preserved its route-specific title and displayed the intended caption-unavailable recovery state.

After the simplified-color revision, both light and dark modes were checked in-browser. The local preference was restored as light on navigation, and the toggle switched to the revised dark palette with the reciprocal light-mode control label.

The anonymous transcript route was verified with a public captioned video. It rendered continuous plain transcript text without visible timestamp markers, retained the search/copy/export controls, and showed no sign-in requirement.

The completed lookup appeared in the browser-local History page with re-open and removal controls. Selecting re-open returned to the associated transcript route without requiring an account.

The individual history removal action was verified in-browser: removing the saved lookup immediately returned the history page to its anonymous empty state.

Two local-only verification entries were then displayed together in the browser History page, confirming the clear-history control operates on multiple stored entries.

The clear-history action was exercised in-browser and removed all local entries, returning the page to its intended empty state.

The reader page now renders a top-level New transcript shortcut alongside the global navigation. The copy and all three download actions remain available in the reader after the interaction-control update.

The Copy all text control was exercised with a public transcript and immediately changed to its visible “Copied to clipboard” confirmation state.

The Plain text and JSON transcript export controls were each exercised in the browser and triggered their respective download actions without navigation or UI errors.

The SRT export control was also exercised. The browser download directory contained the expected TXT, JSON, and SRT files for the requested transcript, completing export verification.

The revised reader route showed the global New transcript action and all legal footer links. When the public caption provider did not return captions, the reader preserved its clear unavailable-caption recovery state.

The public homepage now exposes the requested single H1, multiple topic-level H2 headings, and meaningful H3 headings in the crawlable document structure. A fresh theme preference was cleared in the verification browser to confirm the white-and-blue default on the next navigation.

With no saved theme preference, the homepage rendered in the requested white-and-blue light system with the revised “YouTube video to transcript made easy” headline. The Privacy Policy route also rendered its three public, semantic legal sections and the complete legal footer navigation.

The final production build exposed all four legal routes, a 142-character homepage meta description, canonical metadata, meaningful H3 content, legal sitemap URLs, and explicit public rules for major search and AI crawler user agents. The inline reader lookup was updated to reset the prior mutation before requesting a newly submitted link.

The live provider returned its intended unavailable-caption state for the final public-video check. The completed-reader interaction verification will therefore use the same deterministic transcript data shape already covered by the unit and export tests, while retaining this live recovery-state confirmation.

The captioned accessibility test video completed successfully in the latest white-and-blue reader. The visible inline YouTube-link form appeared above the thumbnail, and the latest Copy, TXT, JSON, and SRT controls were all present in the completed action panel.

On the current reader, Copy all text produced its clipboard confirmation and Plain text produced its visible download-started confirmation while retaining the completed transcript view.

The final JSON and SRT export actions also produced their corresponding visible download-started confirmations on the same completed transcript.

Submitting the shortened version of the completed video URL through the inline form switched the reader into its loading state and then reloaded the completed transcript on the same route, confirming the prior lookup is reset correctly.

The final completed white-and-blue transcript panel shows Copy all text with an aligned leading icon and all three export labels—Plain text, JSON data, and SRT subtitles—left-aligned beside their respective icons, with download affordances retained on the far right.

The refined Copy all text control was exercised on the completed transcript, presented its visible copied confirmation, and then returned to its normal actionable state without affecting the aligned export labels.

The completed reader was checked again after the final alignment styles: desktop shows text labels aligned to the left of the panel with download icons at the far right, while the mobile layout uses the same row-based control structure rather than stacked label/icon controls.

The final aligned Plain text and JSON controls were exercised on the completed transcript and each produced its visible download-started confirmation.

The final aligned SRT action also produced its download-started confirmation. The browser download directory contains the generated TXT, JSON, and SRT files for the completed accessibility-caption transcript.

The final desktop reader visibly confirmed the requested ordering and alignment. The responsive mobile rule preserves the same full-width row structure with a leading icon, left-aligned label, and trailing download icon; automated build, type, and test checks passed after the styling change.

The final mobile rule was inspected with the completed-panel structure: it preserves the leading icon, flexible left-aligned label span, and terminal download icon for each export row rather than switching the elements to a stacked control.

A true 390×844 browser screenshot of the completed captioned transcript confirms the final mobile action panel: Plain text, JSON data, and SRT subtitles each appear left-aligned after their leading icons, and their download icons are positioned at the far right of the row.

After warming the successful server-side lookup cache, the managed mobile preview rendered the completed captioned reader at 390×844 with the final action panel. The screenshot confirms the exact requested row layout for every export control.

The reported transcript URL, including `from_webdev=1`, was reproduced in the local preview. It rendered the completed transcript reader and the browser console contained no current hydration error output.

After the hydration-safe reader initialization update, the same reported URL again transitioned to the completed transcript and the browser console remained free of hydration mismatch output.

The production SSR route was also checked directly: it emits the deterministic “Preparing your transcript” loading tree, rather than a completed transcript result, matching the client’s first hydrated render before client-side lookup begins.

Theme initialization now uses one explicit hydration-safe light default for the server and the client’s first React render; any saved browser theme is still applied only after hydration. A standalone browser run against the rebuilt production SSR server loaded the reported route without any hydration mismatch output.

## External Render and Cloudflare verification

TubeTranscriber was deployed as a free Docker web service on Render from the connected GitHub repository. The latest external-runtime deployment started cleanly without the prior missing `OAUTH_SERVER_URL` error, and Render reported the service live on its configured port. The live platform URL `https://tubetranscriber.onrender.com/` and primary custom URL `https://tubetranscriber.com/` each returned HTTP 200 during verification. HTTP requests to the apex redirected to HTTPS, and server-rendered canonical and Open Graph URL metadata use `https://tubetranscriber.com/`.

Cloudflare contains DNS-only CNAME records for both `tubetranscriber.com` and `www.tubetranscriber.com`, each targeting `tubetranscriber.onrender.com`. The apex domain is verified and live. At the latest check, Render had not completed the separate www certificate verification despite the correct record; visitors should use the verified primary address `https://tubetranscriber.com/` until Render finishes issuing the www certificate.

The user-reported production lookup for `https://www.youtube.com/watch?v=5M-CF9NGF_M` was independently checked with yt-dlp. YouTube reports that this video has no subtitle tracks, confirming that the application’s “Transcript unavailable” screen is the expected source-data outcome and not a domain, deployment, or extraction regression.
