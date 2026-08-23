"""Bridge the Node server to youtube-transcript-api."""

from __future__ import annotations

import json
import os
import re
import sys
from typing import Any

from youtube_transcript_api import (
    NoTranscriptFound,
    TranscriptsDisabled,
    VideoUnavailable,
    YouTubeTranscriptApi,
)
from youtube_transcript_api.formatters import TextFormatter


VIDEO_ID_PATTERN = r"[0-9A-Za-z_-]{11}"


def extract_video_id(url_or_id: str) -> str:
    """Extract an 11-character YouTube video ID from a URL or raw ID."""
    value = url_or_id.strip()
    pattern = r'(?:v=|/([0-9A-Za-z_-]{11}).*|youtu[.]be/|embed/|shorts/)([0-9A-Za-z_-]{11})'
    match = re.search(pattern, value)
    if match:
        return match.group(1) or match.group(2)
    if len(value) == 11 and re.match(r'^[0-9A-Za-z_-]{11}$', value):
        return value
    raise ValueError("Invalid YouTube URL or Video ID")


def _proxy_mapping() -> dict[str, str] | None:
    cf_proxy = os.getenv("CF_WORKER_PROXY", "").strip()
    if not cf_proxy:
        return None
    proxy_url = cf_proxy if cf_proxy.endswith("?url=") else f"{cf_proxy}?url="
    return {"http": proxy_url, "https": proxy_url}


def _fetch_transcript(video_id: str) -> list[dict[str, Any]]:
    """Fetch the raw transcript through the optional Cloudflare proxy."""
    proxies = _proxy_mapping()
    try:
        if proxies:
            transcript = YouTubeTranscriptApi.get_transcript(video_id, proxies=proxies)
        else:
            transcript = YouTubeTranscriptApi.get_transcript(video_id)
        return transcript
    except TranscriptsDisabled as error:
        raise RuntimeError("Subtitles/Transcripts are disabled for this video.") from error
    except NoTranscriptFound as error:
        raise RuntimeError("No transcript found in the requested language.") from error
    except VideoUnavailable as error:
        raise RuntimeError("The requested video is unavailable or private.") from error
    except Exception as error:
        raise RuntimeError(f"Transcript extraction failed: {str(error)}") from error


def get_transcript(url_or_id: str) -> str:
    """Extract and format a transcript as plain text."""
    video_id = extract_video_id(url_or_id)
    transcript = _fetch_transcript(video_id)
    formatter = TextFormatter()
    return formatter.format_transcript(transcript)


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
