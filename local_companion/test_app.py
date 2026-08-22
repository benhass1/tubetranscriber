import unittest

from app import (
    TranscriptLookupError,
    classify_ytdlp_failure,
    create_app,
    extract_video_id,
    normalize_language_codes,
    parse_json3_transcript,
)


class LocalCompanionTests(unittest.TestCase):
    def test_extracts_supported_youtube_ids(self):
        self.assertEqual(extract_video_id("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ")
        self.assertEqual(extract_video_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ")
        self.assertEqual(extract_video_id("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ")

    def test_rejects_invalid_url(self):
        with self.assertRaises(TranscriptLookupError) as raised:
            extract_video_id("https://example.com/not-youtube")
        self.assertEqual(raised.exception.kind, "invalid_url")

    def test_normalizes_language_preference(self):
        self.assertEqual(normalize_language_codes(" en, ES ,"), ("en", "es"))

    def test_parses_ytdlp_json3_segments(self):
        self.assertEqual(
            parse_json3_transcript({"events": [{"tStartMs": 1000, "dDurationMs": 2500, "segs": [{"utf8": "Hello"}, {"utf8": " world"}]}]}),
            [{"text": "Hello world", "start": 1.0, "duration": 2.5}],
        )

    def test_classifies_ytdlp_restrictions(self):
        self.assertEqual(classify_ytdlp_failure("ERROR: Sign in to confirm you're not a bot"), "restricted")
        self.assertEqual(classify_ytdlp_failure("ERROR: Private video"), "video_unavailable")

    def test_local_api_returns_normalized_transcript(self):
        def fake_extractor(video_id, languages):
            self.assertEqual(video_id, "dQw4w9WgXcQ")
            self.assertEqual(languages, ("en", "fr"))
            return {"videoId": video_id, "language": "en", "segments": [], "plainText": "Hello"}

        client = create_app(fake_extractor).test_client()
        response = client.post("/api/transcript", json={"url": "https://youtu.be/dQw4w9WgXcQ", "languages": "en,fr"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["plainText"], "Hello")

    def test_local_api_keeps_lookup_errors_typed(self):
        def fake_extractor(video_id, languages):
            raise TranscriptLookupError("restricted", "YouTube temporarily restricted yt-dlp caption retrieval from this computer.")

        client = create_app(fake_extractor).test_client()
        response = client.post("/api/transcript", json={"url": "dQw4w9WgXcQ"})
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.get_json()["kind"], "restricted")


if __name__ == "__main__":
    unittest.main()
