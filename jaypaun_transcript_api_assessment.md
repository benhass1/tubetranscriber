# Assessment: `jaypaun007/youtube-transcript-api`

## Public review

The public GitHub tree contains only `README.md` and `LICENSE`; it does not include FastAPI application code, dependency declarations, tests, release artifacts, or versioned source that TubeTranscriber could independently review, maintain, or integrate. The repository’s license file is Apache 2.0, but the readme also describes the project as provided “as-is for educational and personal use.” [1]

The readme documents a hosted Vercel endpoint, limits it to five requests per minute per IP, and claims a `video_url` request field. In a live smoke test on 22 August 2026, that documented field returned HTTP 422 because the service required a different `url` field. With the live service’s actual field, the known captioned test video returned HTTP 200 but contained a 55-character serialized internal-looking value rather than a usable spoken-language transcript. This result is not compatible with TubeTranscriber’s text-reader and export contract.

## Decision

TubeTranscriber will **not** integrate this hosted endpoint. It would introduce an unauditable managed service, conflict with the user’s no-managed-fallback requirement, and would not fix cloud-origin YouTube availability. The existing local companion remains the dependable Python-only path: it has visible source, tests, a loopback-only interface, and retrieves public captions from the visitor’s own computer.

## References

[1]: https://github.com/jaypaun007/youtube-transcript-api/ "jaypaun007/youtube-transcript-api repository"
