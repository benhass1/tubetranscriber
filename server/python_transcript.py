"""Bridge the Node server to youtube-transcript-api.

The program accepts a canonical YouTube video ID on stdin and writes a JSON
payload containing normalized transcript segments on stdout.
"""

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


def _proxies() -> dict[str, str] | None:
    cf_proxy = os.getenv("CF_WORKER_PROXY", "").strip()
    if not cf_proxy:
        return None
    proxy_url = cf_proxy if cf_proxy.endswith("?url=") else f"{cf_proxy}?url="
    return {"http": proxy_url, "https": proxy_url}


def get_transcript(video_id: str) -> dict[str, Any]:
    """Fetch and format a transcript, optionally through the configured proxy."""
    proxies = _proxies()
    if proxies:
        transcript = YouTubeTranscriptApi.get_transcript(video_id, proxies=proxies)
    else:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)

    formatter = TextFormatter()
    plain_text = re.sub(r"\s+", " ", formatter.format_transcript(transcript)).strip()
    segments = [
        {
            "text": re.sub(r"\s+", " ", str(item.get("text", ""))).strip(),
            "start": max(0, float(item.get("start", 0) or 0)),
            "duration": max(0, float(item.get("duration", 0) or 0)),
        }
        for item in transcript
    ]
    return {"segments": [item for item in segments if item["text"]], "plainText": plain_text}


def main() -> None:
    video_id = sys.stdin.read().strip()
    if not re.fullmatch(r"[0-9A-Za-z_-]{11}", video_id):
        print(json.dumps({"kind": "invalid_url", "message": "Invalid YouTube URL or Video ID."}))
        raise SystemExit(2)
    try:
        print(json.dumps(get_transcript(video_id)))
    except TranscriptsDisabled:
        print(json.dumps({"kind": "transcripts_disabled", "message": "Subtitles/Transcripts are disabled for this video."}))
        raise SystemExit(2)
    except NoTranscriptFound:
        print(json.dumps({"kind": "no_transcript", "message": "No transcript found in the requested language."}))
        raise SystemExit(2)
    except VideoUnavailable:
        print(json.dumps({"kind": "video_unavailable", "message": "The requested video is unavailable or private."}))
        raise SystemExit(2)
    except Exception as error:
        print(json.dumps({"kind": "upstream_error", "message": f"Transcript extraction failed: {error}"}))
        raise SystemExit(2)


if __name__ == "__main__":
    main()
