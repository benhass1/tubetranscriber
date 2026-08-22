# Assessment: `jdepoix/youtube-transcript-api`

## Result

This is the official upstream project already used by TubeTranscriber’s server adapter and visitor-local companion. It is an MIT-licensed, source-available Python package with an active codebase, tests, release history, and a latest release of `v1.2.4` as of 22 August 2026. [1]

The installed sandbox package is also version `1.2.4`. TubeTranscriber’s dependency range, `youtube-transcript-api>=1.2,<2.0`, already accepts that release. Its `server/python_transcript.py` adapter uses the current supported `YouTubeTranscriptApi().list(video_id)` and `Transcript.fetch()` interfaces, preferring manual English captions before generated or other available public tracks.

## Deployment implication

No dependency replacement is appropriate. The upstream documentation expressly warns that YouTube blocks many cloud-provider IPs, which matches the published TubeTranscriber restriction response. Updating to this official library does not change the public cloud server’s network identity. It is the right library for the visitor-local companion, where the request is made through the visitor’s own computer connection.

## References

[1]: https://github.com/jdepoix/youtube-transcript-api "jdepoix/youtube-transcript-api"
