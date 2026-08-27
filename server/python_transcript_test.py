import json
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import python_transcript as bridge


class FakeResponse:
    def __init__(self, text="", status_code=200, payload=None, headers=None):
        self.text = text
        self.status_code = status_code
        self.headers = headers or {}
        self._payload = payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise bridge.requests.HTTPError(f"status {self.status_code}")

    def json(self):
        if self._payload is not None:
            return self._payload
        return json.loads(self.text)


class FakeSession:
    def request(self, *_args, **_kwargs):
        return FakeResponse()

    def close(self):
        pass


class TranscriptBridgeTests(unittest.TestCase):
    def test_429_uses_bounded_exponential_backoff(self):
        session = FakeSession()
        responses = [
            FakeResponse(status_code=429),
            FakeResponse(status_code=429),
            FakeResponse(status_code=200),
        ]
        with patch.dict(os.environ, {"YOUTUBE_429_RETRIES": "2"}, clear=False), patch.object(
            session, "request", side_effect=responses
        ) as request, patch.object(bridge.time, "sleep") as sleep, patch.object(bridge.random, "uniform", return_value=0):
            response = bridge._youtube_request(session, "GET", "https://www.youtube.com/watch?v=abc")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(request.call_count, 3)
        self.assertEqual([call.args[0] for call in sleep.call_args_list], [0.75, 1.5])

    def test_worker_target_and_auth_header(self):
        with patch.dict(
            os.environ,
            {
                "CF_WORKER_PROXY": "https://worker.example/proxy",
                "CF_WORKER_AUTH_TOKEN": "test-token",
            },
            clear=False,
        ):
            self.assertIn("url=https%3A%2F%2Fwww.youtube.com%2Fwatch", bridge._worker_target_url("https://www.youtube.com/watch?v=abc"))
            session = FakeSession()
            with patch.object(session, "request", return_value=FakeResponse()) as request:
                bridge._youtube_request(session, "GET", "https://www.youtube.com/watch?v=abc")
            self.assertEqual(request.call_args.kwargs["headers"]["x-proxy-auth"], "test-token")

    def test_track_selection_prefers_manual_english_then_english_asr_then_first(self):
        tracks = [
            {"languageCode": "fr", "baseUrl": "https://example/fr"},
            {"languageCode": "en", "kind": "asr", "baseUrl": "https://example/en-asr"},
            {"languageCode": "en", "baseUrl": "https://example/en"},
        ]
        self.assertEqual(bridge._select_caption_track(tracks)["baseUrl"], "https://example/en")
        self.assertEqual(bridge._select_caption_track([tracks[0]])["baseUrl"], "https://example/fr")
        with self.assertRaises(bridge.NoCaptionsError):
            bridge._select_caption_track([])

    def test_original_audio_language_is_prioritized_over_english(self):
        tracks = [
            {"languageCode": "en", "name": "English", "baseUrl": "https://example/en"},
            {"languageCode": "ar", "name": "Arabic", "kind": "asr", "baseUrl": "https://example/ar"},
        ]
        prioritized = bridge._prioritize_original_track(tracks, "ar")
        original = bridge._select_original_caption_track(prioritized)
        self.assertEqual(prioritized[0]["languageCode"], "ar")
        self.assertEqual(original["languageCode"], "ar")

    def test_original_language_metadata_uses_known_language_name(self):
        result = bridge._result(
            [{"text": "مرحبا", "start": 0, "duration": 1}],
            [],
            {"languageCode": "ar", "kind": "asr"},
            {"languageCode": "ar", "kind": "asr"},
            [],
        )
        self.assertEqual(result["originalLanguage"]["code"], "ar")
        self.assertEqual(result["originalLanguage"]["name"], "Arabic")
        self.assertTrue(result["originalLanguage"]["isOriginal"])

    def test_json3_payload_is_parsed(self):
        payload = json.dumps({"events": [{"tStartMs": 1250, "dDurationMs": 2000, "segs": [{"utf8": "Hello"}]}]})
        self.assertEqual(bridge._parse_caption_payload(payload), [{"text": "Hello", "start": 1.25, "duration": 2.0}])

    def test_empty_json3_falls_back_to_xml_and_forces_json3_first(self):
        calls = []
        session = FakeSession()
        track = {"languageCode": "en", "baseUrl": "https://www.youtube.com/api/timedtext?v=abc&lang=en"}

        def request(_session, _method, url, **_kwargs):
            calls.append(url)
            if "fmt=json3" in url:
                return FakeResponse("{\"events\":[]}")
            return FakeResponse('<transcript><text start="1.5" dur="2">Hello &amp; world</text></transcript>')

        with patch.object(bridge, "_youtube_request", side_effect=request):
            result = bridge._fetch_caption_track(session, track, None)
        self.assertEqual(result[0]["text"], "Hello & world")
        self.assertIn("fmt=json3", calls[0])
        self.assertNotIn("fmt=", calls[1])

    def test_dynamic_api_key_android_fallback_preserves_original_language(self):
        player = {
            "playabilityStatus": {"status": "OK"},
            "videoDetails": {"defaultAudioLanguage": "ar"},
            "captions": {
                "playerCaptionsTracklistRenderer": {
                    "captionTracks": [
                        {"languageCode": "en", "baseUrl": "https://example/en"},
                        {"languageCode": "ar", "kind": "asr", "baseUrl": "https://example/ar"},
                    ]
                }
            },
        }
        caption = {"events": [{"tStartMs": 0, "dDurationMs": 1500, "segs": [{"utf8": "مرحبا"}]}]}
        responses = [
            FakeResponse('<script>var cfg = {"INNERTUBE_API_KEY": "dynamic-key"};</script>'),
            FakeResponse(payload=player),
            FakeResponse(text=json.dumps(caption)),
        ]
        session = FakeSession()
        calls = []

        def request(_session, method, url, **kwargs):
            calls.append((method, url, kwargs))
            return responses.pop(0)

        with patch.object(bridge, "_youtube_session", return_value=session), patch.object(
            bridge, "_youtube_request", side_effect=request
        ), patch.object(bridge, "_po_token_details", return_value=None):
            result = bridge._fetch_innertube_api_key_result("dQw4w9WgXcQ")

        self.assertEqual(result["originalLanguage"]["code"], "ar")
        self.assertEqual(result["segments"][0]["text"], "مرحبا")
        self.assertIn("key=dynamic-key", calls[1][1])
        self.assertEqual(calls[1][2]["json"]["context"]["client"]["clientName"], "ANDROID")
        self.assertIn("Android 11", calls[1][2]["headers"]["User-Agent"])
        self.assertIn("fmt=json3", calls[2][1])

    def test_result_chain_reaches_dynamic_key_fallback_before_library_fallback(self):
        expected = {
            "segments": [{"text": "fallback", "start": 0, "duration": 1}],
            "originalLanguage": {"code": "en", "name": "English", "isOriginal": True, "isAutoGenerated": False},
        }
        with patch.object(bridge, "_fetch_transcript_in_language", side_effect=RuntimeError("catalog failed")), patch.object(
            bridge, "_youtube_transcript_api_fetch_result", side_effect=RuntimeError("library should not run")
        ) as library, patch.object(bridge, "_fetch_innertube_api_key_result", return_value=expected) as fallback:
            result = bridge._fetch_transcript_result("dQw4w9WgXcQ")

        self.assertEqual(result, expected)
        fallback.assert_called_once_with("dQw4w9WgXcQ")
        library.assert_not_called()

    def test_innertube_missing_tracks_is_typed(self):
        session = FakeSession()
        player = {"playabilityStatus": {"status": "OK"}, "captions": {}}
        with patch.object(bridge, "_youtube_session", return_value=session), patch.object(
            bridge, "_youtube_request", return_value=FakeResponse(payload=player)
        ), patch.object(bridge, "_po_token_details", return_value=None):
            with self.assertRaises(bridge.NoCaptionsError):
                bridge._fetch_innertube_transcript("dQw4w9WgXcQ")

    def test_vtt_payload_is_parsed(self):
        payload = "WEBVTT\n\n00:00:01.000 --> 00:00:03.500\nHello <i>world</i>\n"
        self.assertEqual(bridge._parse_caption_payload(payload), [{"text": "Hello world", "start": 1.0, "duration": 2.5}])

    def test_timedtext_track_list_parses_language_and_asr(self):
        tracks = bridge._parse_timedtext_track_list(
            '<transcript_list><track id="1" name="English" lang_code="en" kind="asr" /></transcript_list>'
        )
        self.assertEqual(tracks[0]["languageCode"], "en")
        self.assertEqual(tracks[0]["kind"], "asr")
        self.assertEqual(tracks[0]["name"], "English")

    def test_direct_timedtext_fetch_forces_json3_after_language_discovery(self):
        calls = []
        responses = [
            FakeResponse('<transcript_list><track name="English" lang_code="en" kind="asr" /></transcript_list>'),
            FakeResponse(json.dumps({"events": [{"tStartMs": 1000, "dDurationMs": 1500, "segs": [{"utf8": "Hello" }]}]})),
        ]
        session = FakeSession()

        def request(_session, _method, url, **_kwargs):
            calls.append(url)
            return responses.pop(0)

        with patch.object(bridge, "_youtube_session", return_value=session), patch.object(
            bridge, "_youtube_request", side_effect=request
        ), patch.object(bridge, "_po_token_details", return_value=None):
            result = bridge._fetch_timedtext_direct("dQw4w9WgXcQ")
        self.assertEqual(result[0]["text"], "Hello")
        self.assertIn("type=list", calls[0])
        self.assertIn("fmt=json3", calls[1])
        self.assertIn("kind=asr", calls[1])


if __name__ == "__main__":
    unittest.main()
