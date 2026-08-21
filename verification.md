# Local Verification Notes

The local preview was checked on the landing page, About/FAQ page, authenticated-history empty state, and transcript route. The responsive dark interface renders successfully across the public routes, including navigation, the persistent theme control, history actions, and footer links.

A public YouTube lookup returned metadata and a caption viewer during initial verification. Caption availability is controlled by YouTube and can vary per request or video; the viewer displays a specific unavailable-captions state when the source does not expose a transcript. Timestamp normalization now converts srv3 millisecond tracks to seconds before display and export.

After normalization, the public-video viewer showed an approximate duration of 00:03:31 and grouped caption blocks beginning at 00:00:01. The light-mode control changed the rendered page to the complete light palette and retained the chosen preference in the active browser session through local storage.

The transcript route now exposes the document title `Transcript Viewer | TubeTranscriber`. On a subsequent source request that did not return captions, the route preserved its route-specific title and displayed the intended caption-unavailable recovery state.
