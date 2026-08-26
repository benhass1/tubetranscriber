"""Bridge the Node server to YouTube transcript extraction."""

from __future__ import annotations

import html as html_lib
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from http.cookiejar import MozillaCookieJar
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import requests
from youtube_transcript_api import (
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
    YouTubeTranscriptApi,
)
from youtube_transcript_api.formatters import TextFormatter


VIDEO_ID_PATTERN = r"[0-9A-Za-z_-]{11}"
YOUTUBE_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)
YOUTUBE_CONSENT_COOKIE = "SOCS=CAESEwgDEgk2MTExNDM3NDIaAmVuIAEaBgiA_L2yBg;"


def extract_video_id(url_or_id: str) -> str:
    """Extract an 11-character YouTube video ID from a URL or raw ID."""
    value = url_or_id.strip()
    pattern = r"(?:v=|/([0-9A-Za-z_-]{11}).*|youtu[.]be/|embed/|shorts/)([0-9A-Za-z_-]{11})"
    match = re.search(pattern, value)
    if match:
        return match.group(1) or match.group(2)
    if len(value) == 11 and re.match(r"^[0-9A-Za-z_-]{11}$", value):
        return value
    raise ValueError("Invalid YouTube URL or Video ID")


def _proxy_mapping() -> dict[str, str] | None:
    """Return the local WARP HTTP proxy for both HTTP and HTTPS requests."""
    warp_proxy = os.getenv("WARP_HTTP_PROXY", "").strip()
    if os.getenv("WARP_ENABLED", "").strip().lower() == "true" and not warp_proxy:
        warp_proxy = "http://127.0.0.1:9091"
    if warp_proxy:
        return {"http": warp_proxy, "https": warp_proxy}

    # Cloudflare Worker requests are wrapped explicitly by _youtube_request;
    # they are not HTTP CONNECT proxies and must not be passed to requests'
    # session.proxies mapping.
    return None


def _youtube_cookie_file() -> str | None:
    """Return an optional Netscape-format YouTube cookie file."""
    cookie_file = os.getenv("YOUTUBE_COOKIES_FILE", "").strip()
    return cookie_file if cookie_file and os.path.isfile(cookie_file) else None


def _po_token_details(video_id: str) -> dict[str, str] | None:
    """Ask the local sidecar for a content-bound PO-token when enabled."""
    if os.getenv("PO_TOKEN_ENABLED", "").strip().lower() != "true":
        return None
    sidecar_url = os.getenv("PO_TOKEN_SIDECAR_URL", "http://127.0.0.1:4416").strip().rstrip("/")
    try:
        with requests.Session() as session:
            session.trust_env = False
            response = session.get(
                f"{sidecar_url}/token",
                params={"videoId": video_id},
                timeout=float(os.getenv("PO_TOKEN_REQUEST_TIMEOUT_SECONDS", "12")),
            )
            response.raise_for_status()
            data = response.json()
        visitor_data = str(data.get("visitorData", "")).strip()
        po_token = str(data.get("poToken", "")).strip()
        if not visitor_data or len(po_token) < 100:
            return None
        return {"visitorData": visitor_data, "poToken": po_token}
    except (requests.RequestException, ValueError, TypeError):
        # PO tokens are an optional enhancement. Keep the WARP and library
        # extraction paths available when YouTube or the sidecar changes.
        return None


def _caption_url_with_po_token(caption_url: str, token_details: dict[str, str] | None) -> str:
    """Add the parameters used by YouTube's browser subtitle requests."""
    if not token_details:
        return caption_url
    parts = urlsplit(caption_url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query.update(
        {
            "potc": "1",
            "pot": token_details["poToken"],
            "c": "WEB",
            "cver": "2.20240301.00.00",
        }
    )
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def _youtube_session() -> requests.Session:
    """Build a YouTube HTTP session with browser headers and optional cookies."""
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": YOUTUBE_USER_AGENT,
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Cookie": YOUTUBE_CONSENT_COOKIE,
        }
    )
    proxies = _proxy_mapping()
    if proxies:
        session.proxies.update(proxies)
    cookie_file = _youtube_cookie_file()
    if cookie_file:
        try:
            jar = MozillaCookieJar(cookie_file)
            jar.load(ignore_discard=True, ignore_expires=True)
            session.cookies.update(jar)
        except Exception:
            # A malformed optional cookie file must not prevent public-track
            # extraction from being attempted.
            pass
    return session


def _worker_target_url(target_url: str) -> str:
    """Wrap a YouTube URL in the configured Cloudflare Worker endpoint."""
    worker_url = os.getenv("CF_WORKER_PROXY", "").strip()
    if not worker_url:
        return target_url
    if worker_url.endswith("?url="):
        worker_url = worker_url[:-5]
    elif worker_url.endswith("&url="):
        worker_url = worker_url[:-5]
    parts = urlsplit(worker_url)
    query = dict(parse_qsl(parts.query, keep_blank_values=True))
    query["url"] = target_url
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def _youtube_request(session: requests.Session, method: str, target_url: str, **kwargs: Any) -> requests.Response:
    """Send a YouTube request directly or through the configured Worker."""
    worker_url = os.getenv("CF_WORKER_PROXY", "").strip()
    if worker_url:
        headers = dict(kwargs.pop("headers", {}) or {})
        auth_token = os.getenv("CF_WORKER_AUTH_TOKEN", "").strip()
        if auth_token:
            headers["x-proxy-auth"] = auth_token
        kwargs["headers"] = headers
        return session.request(method, _worker_target_url(target_url), **kwargs)
    return session.request(method, target_url, **kwargs)


def _parse_player_response(page: str) -> dict[str, Any]:
    """Decode the embedded ytInitialPlayerResponse JSON object."""
    decoder = json.JSONDecoder()
    markers = (
        "ytInitialPlayerResponse = ",
        "var ytInitialPlayerResponse = ",
    )
    for marker in markers:
        start = page.find(marker)
        if start < 0:
            continue
        payload = page[start + len(marker) :]
        try:
            parsed, _ = decoder.raw_decode(payload)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            return parsed
    raise RuntimeError("Unable to parse video player data from YouTube.")


def _caption_tracks(player_data: dict[str, Any]) -> list[dict[str, Any]]:
    captions = player_data.get("captions", {})
    renderer = captions.get("playerCaptionsTracklistRenderer", {}) if isinstance(captions, dict) else {}
    tracks = renderer.get("captionTracks", []) if isinstance(renderer, dict) else []
    return [track for track in tracks if isinstance(track, dict)]


def _select_caption_track(tracks: list[dict[str, Any]]) -> dict[str, Any]:
    for track in tracks:
        language = str(track.get("languageCode", "")).lower()
        if language in {"en", "en-us", "en-gb"}:
            return track
    return tracks[0]


def _parse_caption_payload(payload: str) -> list[dict[str, Any]]:
    """Parse timedtext XML or json3 into the common segment shape."""
    text = payload.strip()
    if not text:
        raise RuntimeError("YouTube returned an empty caption payload.")

    try:
        root = ET.fromstring(text)
        segments: list[dict[str, Any]] = []
        for node in root.iter("text"):
            value = html_lib.unescape(node.text or "").replace("\n", " ").strip()
            if not value:
                continue
            segments.append(
                {
                    "text": value,
                    "start": max(0, float(node.attrib.get("start", 0) or 0)),
                    "duration": max(0, float(node.attrib.get("dur", 0) or 0)),
                }
            )
        if segments:
            return segments
    except (ET.ParseError, ValueError):
        pass

    try:
        data = json.loads(text)
        segments = []
        for event in data.get("events", []):
            start = max(0, float(event.get("tStartMs", 0) or 0) / 1000)
            duration = max(0, float(event.get("dDurationMs", 0) or 0) / 1000)
            value = "".join(str(part.get("utf8", "")) for part in event.get("segs", []))
            value = html_lib.unescape(value).replace("\n", " ").strip()
            if value:
                segments.append({"text": value, "start": start, "duration": duration})
        if segments:
            return segments
    except (json.JSONDecodeError, TypeError, ValueError):
        pass

    raise RuntimeError("YouTube returned an empty or corrupted transcript response.")


def _fetch_innertube_transcript(video_id: str) -> list[dict[str, Any]]:
    """Fetch captionTracks from youtubei/v1/player and download JSON3."""
    innertube_url = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false"
    token_details = _po_token_details(video_id)
    client = {
        "hl": "en",
        "gl": "US",
        "clientName": "WEB",
        "clientVersion": "2.20240301.00.00",
    }
    if token_details:
        client.update(
            {
                "visitorData": token_details["visitorData"],
                "poToken": token_details["poToken"],
            }
        )
    payload = {
        "context": {"client": client},
        "videoId": video_id,
    }
    session = _youtube_session()
    try:
        response = _youtube_request(session, "POST", innertube_url, json=payload, timeout=20)
        response.raise_for_status()
        player_data = response.json()
    except (requests.RequestException, ValueError) as error:
        session.close()
        raise RuntimeError(f"InnerTube request failed: {error}") from error

    playability = player_data.get("playabilityStatus", {}).get("status")
    if playability in {"UNPLAYABLE", "LOGIN_REQUIRED"}:
        session.close()
        raise RuntimeError("The requested video is unavailable or private.")

    tracks = _caption_tracks(player_data)
    if not tracks:
        session.close()
        raise RuntimeError("No caption tracks found via InnerTube API.")

    caption_url = _select_caption_track(tracks).get("baseUrl")
    if not caption_url:
        session.close()
        raise RuntimeError("Caption track found but lacks a valid download URL.")
    if "fmt=" not in caption_url:
        caption_url += "&fmt=json3" if "?" in caption_url else "?fmt=json3"
    caption_url = _caption_url_with_po_token(caption_url, token_details)

    try:
        caption_response = _youtube_request(session, "GET", caption_url, timeout=20)
        caption_response.raise_for_status()
        return _parse_caption_payload(caption_response.text)
    except requests.RequestException as error:
        raise RuntimeError(f"Failed to fetch the JSON3 caption track: {error}") from error
    finally:
        session.close()


def _fetch_direct_transcript(video_id: str) -> list[dict[str, Any]]:
    """Fetch a signed caption track URL from YouTube's player response."""
    watch_url = f"https://www.youtube.com/watch?v={video_id}"
    with _youtube_session() as session:
        try:
            response = _youtube_request(session, "GET", watch_url, timeout=20)
            response.raise_for_status()
        except requests.RequestException as error:
            raise RuntimeError(f"Failed to reach YouTube page: {error}") from error

        player_data = _parse_player_response(response.text)
        playability = player_data.get("playabilityStatus", {}).get("status")
        if playability in {"UNPLAYABLE", "LOGIN_REQUIRED"}:
            raise RuntimeError("The requested video is unavailable or private.")

        tracks = _caption_tracks(player_data)
        if not tracks:
            raise RuntimeError("Subtitles/Transcripts are disabled or unavailable for this video.")
        token_details = _po_token_details(video_id)
        caption_url = _select_caption_track(tracks).get("baseUrl")
        if not caption_url:
            raise RuntimeError("Caption track found but lacks a valid download URL.")

        caption_url = _caption_url_with_po_token(caption_url, token_details)
        try:
            caption_response = _youtube_request(session, "GET", caption_url, timeout=20)
            caption_response.raise_for_status()
        except requests.RequestException as error:
            raise RuntimeError(f"Failed to fetch the signed caption track: {error}") from error
        return _parse_caption_payload(caption_response.text)


def _youtube_transcript_api_fetch(video_id: str) -> list[dict[str, Any]]:
    """Fetch tracks through youtube-transcript-api as a compatibility fallback."""
    kwargs: dict[str, Any] = {}
    proxies = _proxy_mapping()
    if proxies:
        kwargs["proxies"] = proxies
    cookie_file = _youtube_cookie_file()
    if cookie_file:
        kwargs["cookies"] = cookie_file

    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id, **kwargs)
    tracks = list(transcript_list)
    if not tracks:
        raise RuntimeError("No transcript found in any language for this video.")
    try:
        transcript = transcript_list.find_transcript(["en", "en-US", "en-GB"])
    except NoTranscriptFound:
        transcript = tracks[0]
    fetched = transcript.fetch()
    if not fetched:
        raise RuntimeError("YouTube returned an empty transcript response.")
    normalized: list[dict[str, Any]] = []
    for item in fetched:
        if isinstance(item, dict):
            text = item.get("text", "")
            start = item.get("start", 0)
            duration = item.get("duration", 0)
        else:
            text = getattr(item, "text", "")
            start = getattr(item, "start", 0)
            duration = getattr(item, "duration", 0)
        normalized.append({
            "text": str(text).strip(),
            "start": float(start or 0),
            "duration": float(duration or 0),
        })
    return normalized


def _fetch_transcript(video_id: str) -> list[dict[str, Any]]:
    """Prefer InnerTube JSON3, then signed page extraction, then the library."""
    prior_errors: list[RuntimeError] = []
    for fetcher in (_fetch_innertube_transcript, _fetch_direct_transcript):
        try:
            return fetcher(video_id)
        except RuntimeError as error:
            prior_errors.append(error)

    try:
        return _youtube_transcript_api_fetch(video_id)
    except TranscriptsDisabled as error:
        raise RuntimeError("Subtitles/Transcripts are disabled for this video.") from error
    except NoTranscriptFound as error:
        raise RuntimeError("No transcript found in any language for this video.") from error
    except VideoUnavailable as error:
        raise RuntimeError("The requested video is unavailable or private.") from error
    except RuntimeError as error:
        message = str(error)
        lowered = message.lower()
        prior_messages = " ".join(str(item).lower() for item in prior_errors)
        if "unavailable or private" in prior_messages or "unavailable or private" in lowered:
            raise RuntimeError("The requested video is unavailable or private.") from error
        if "no caption tracks" in prior_messages or "disabled or unavailable" in prior_messages:
            raise RuntimeError("Subtitles/Transcripts are disabled for this video.") from error
        if "no element found" in lowered or "empty" in lowered or "xml" in lowered:
            raise RuntimeError(
                "YouTube returned an empty or corrupted transcript response. Please retry in a few moments."
            ) from error
        raise
    except Exception as error:
        error_message = str(error)
        lowered = error_message.lower()
        if "no element found" in lowered or "empty" in lowered or "xml" in lowered:
            raise RuntimeError(
                "YouTube returned an empty or corrupted transcript response. Please retry in a few moments."
            ) from error
        raise RuntimeError(f"Transcript extraction failed: {error_message}") from error


def get_transcript(url_or_id: str) -> str:
    """Extract and format a transcript as plain text."""
    video_id = extract_video_id(url_or_id)
    transcript = _fetch_transcript(video_id)
    return TextFormatter().format_transcript(transcript)


def get_transcript_payload(url_or_id: str) -> dict[str, Any]:
    """Extract a transcript and return both plain text and normalized segments."""
    video_id = extract_video_id(url_or_id)
    transcript = _fetch_transcript(video_id)
    plain_text = re.sub(r"\s+", " ", TextFormatter().format_transcript(transcript)).strip()
    segments = [
        {
            "text": re.sub(r"\s+", " ", str(item.get("text", ""))).strip(),
            "start": max(0, float(item.get("start", 0) or 0)),
            "duration": max(0, float(item.get("duration", 0) or 0)),
        }
        for item in transcript
    ]
    return {
        "segments": [item for item in segments if item["text"]],
        "plainText": plain_text,
    }


def main() -> None:
    url_or_id = sys.stdin.read().strip()
    try:
        print(json.dumps(get_transcript_payload(url_or_id)))
    except ValueError as error:
        print(json.dumps({"kind": "invalid_url", "message": str(error)}))
        raise SystemExit(2)
    except RuntimeError as error:
        message = str(error)
        if message.startswith("Subtitles/Transcripts"):
            kind = "transcripts_disabled"
        elif message.startswith("No transcript"):
            kind = "no_transcript"
        elif message.startswith("The requested video"):
            kind = "video_unavailable"
        else:
            kind = "upstream_error"
        print(json.dumps({"kind": kind, "message": message}))
        raise SystemExit(2)


if __name__ == "__main__":
    main()
