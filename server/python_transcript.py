#!/usr/bin/env python3
"""Fetch publicly available YouTube captions with youtube-transcript-api.

This script is deliberately a narrow JSON-line boundary for the Node server.
It does not accept URLs, cookies, proxy settings, or arbitrary arguments.
"""

from __future__ import annotations

import json
import sys
from typing import Any

from youtube_transcript_api import YouTubeTranscriptApi


def emit(payload: dict[str, Any], status: int) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)
    raise SystemExit(status)


def classify_error(error: Exception) -> str:
    name = type(error).__name__
    if name in {"VideoUnavailable", "VideoUnplayable", "InvalidVideoId"}:
        return "video_unavailable"
    if name in {"NoTranscriptFound", "TranscriptsDisabled", "NoTranscriptAvailable"}:
        return "no_captions"
    if name in {"RequestBlocked", "IpBlocked", "TooManyRequests", "YouTubeRequestFailed"}:
        return "restricted"
    return "upstream_error"


def choose_transcript(video_id: str):
    api = YouTubeTranscriptApi()
    transcript_list = api.list(video_id)
    transcripts = list(transcript_list)
    if not transcripts:
        raise LookupError("No public transcript tracks were returned")

    # Match the product's default language behavior while preferring human-created
    # captions over auto-generated captions at every selection stage.
    preferred_codes = ("en",)
    for language_code in preferred_codes:
        for transcript in transcripts:
            if transcript.language_code == language_code and not transcript.is_generated:
                return transcript
        for transcript in transcripts:
            if transcript.language_code == language_code:
                return transcript
    for transcript in transcripts:
        if not transcript.is_generated:
            return transcript
    return transcripts[0]


def main() -> None:
    if len(sys.argv) != 2 or len(sys.argv[1]) != 11:
        emit({"ok": False, "kind": "invalid_video_id", "message": "Expected one 11-character YouTube video ID."}, 2)

    video_id = sys.argv[1]
    try:
        selected = choose_transcript(video_id)
        fetched = selected.fetch()
        segments = [
            {
                "text": item.get("text", ""),
                "start": item.get("start", 0),
                "duration": item.get("duration", 0),
            }
            for item in fetched.to_raw_data()
            if str(item.get("text", "")).strip()
        ]
        if not segments:
            emit({"ok": False, "kind": "no_captions", "message": "No public caption segments were returned."}, 2)
        emit(
            {
                "ok": True,
                "language": selected.language_code,
                "is_generated": selected.is_generated,
                "segments": segments,
            },
            0,
        )
    except Exception as error:  # The library has several versioned error classes.
        emit({"ok": False, "kind": classify_error(error), "message": str(error)[:1200]}, 2)


if __name__ == "__main__":
    main()
