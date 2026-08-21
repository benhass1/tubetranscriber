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
