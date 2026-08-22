"""TubeTranscriber Local Companion.

Runs only on 127.0.0.1 and retrieves publicly available YouTube subtitle
tracks through yt-dlp from the computer where the user launches it.
"""

from __future__ import annotations

import json
import re
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable
from urllib.parse import parse_qs, urlparse

from flask import Flask, jsonify, render_template_string, request


LOCAL_HOST = "127.0.0.1"
LOCAL_PORT = 8765
VIDEO_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{11}$")


@dataclass
class TranscriptLookupError(Exception):
    kind: str
    message: str


def extract_video_id(value: str) -> str:
    candidate = value.strip()
    if VIDEO_ID_PATTERN.fullmatch(candidate):
        return candidate

    parsed = urlparse(candidate)
    if parsed.netloc in {"youtu.be", "www.youtu.be"}:
        candidate = parsed.path.strip("/").split("/")[0]
    elif "youtube.com" in parsed.netloc:
        if parsed.path == "/watch":
            candidate = parse_qs(parsed.query).get("v", [""])[0]
        elif parsed.path.startswith(("/embed/", "/shorts/", "/live/")):
            candidate = parsed.path.split("/")[2] if len(parsed.path.split("/")) > 2 else ""

    if not VIDEO_ID_PATTERN.fullmatch(candidate):
        raise TranscriptLookupError("invalid_url", "Paste a valid YouTube video URL or 11-character video ID.")
    return candidate


def normalize_language_codes(value: str | None) -> tuple[str, ...]:
    codes = tuple(code.strip().lower() for code in (value or "en").split(",") if code.strip())
    return codes or ("en",)


def parse_json3_transcript(payload: dict[str, Any]) -> list[dict[str, Any]]:
    segments: list[dict[str, Any]] = []
    for event in payload.get("events", []) or []:
        text = "".join(str(part.get("utf8", "")) for part in event.get("segs", []) or [])
        text = re.sub(r"\s+", " ", text).strip()
        if not text:
            continue
        segments.append(
            {
                "text": text,
                "start": max(0, float(event.get("tStartMs", 0) or 0) / 1000),
                "duration": max(0.5, float(event.get("dDurationMs", 0) or 0) / 1000),
            }
        )
    return segments


def classify_ytdlp_failure(detail: str) -> str:
    value = detail.lower()
    if any(marker in value for marker in ("http error 429", "too many requests", "sign in to confirm", "rate limit", "ip has been blocked")):
        return "restricted"
    if any(marker in value for marker in ("private video", "video unavailable", "this video is unavailable", "has been removed", "not available in your country")):
        return "video_unavailable"
    return "upstream_error"


def fetch_public_transcript(video_id: str, language_codes: tuple[str, ...]) -> dict[str, Any]:
    with tempfile.TemporaryDirectory(prefix="tubetranscriber-") as workdir:
        output_template = str(Path(workdir) / "captions.%(ext)s")
        try:
            result = subprocess.run(
                [
                    "yt-dlp",
                    "--js-runtimes",
                    "node",
                    "--impersonate",
                    "chrome",
                    "--no-playlist",
                    "--skip-download",
                    "--write-subs",
                    "--write-auto-subs",
                    "--sub-langs",
                    ",".join(language_codes),
                    "--sub-format",
                    "json3",
                    "--output",
                    output_template,
                    f"https://www.youtube.com/watch?v={video_id}",
                ],
                capture_output=True,
                text=True,
                timeout=75,
                check=False,
            )
        except FileNotFoundError as error:
            raise TranscriptLookupError("upstream_error", "yt-dlp is not installed on this computer. Reinstall TubeTranscriber Local.") from error
        except subprocess.TimeoutExpired as error:
            raise TranscriptLookupError("restricted", "YouTube did not return captions before the local lookup timed out. Try again later.") from error

        subtitle_files = sorted(Path(workdir).glob("*.json3"))
        if subtitle_files:
            try:
                segments = parse_json3_transcript(json.loads(subtitle_files[0].read_text(encoding="utf-8")))
            except (OSError, json.JSONDecodeError) as error:
                raise TranscriptLookupError("upstream_error", "yt-dlp returned an unreadable subtitle file.") from error
            if segments:
                language = subtitle_files[0].stem.rsplit(".", 1)[-1]
                return {
                    "videoId": video_id,
                    "language": language,
                    "segments": segments,
                    "plainText": "\n\n".join(segment["text"] for segment in segments),
                }

        if result.returncode == 0:
            raise TranscriptLookupError("no_captions", "No public captions are available for this video.")
        kind = classify_ytdlp_failure(result.stderr[-1600:])
        messages = {
            "video_unavailable": "This video is unavailable, private, or cannot be accessed.",
            "restricted": "YouTube temporarily restricted yt-dlp caption retrieval from this computer. Try again later.",
            "upstream_error": "yt-dlp could not retrieve captions from YouTube. Please try again later.",
        }
        raise TranscriptLookupError(kind, messages[kind])


PAGE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TubeTranscriber Local</title>
<style>
  :root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#102041;background:#f7faff}
  body{margin:0;min-height:100vh;background:linear-gradient(135deg,#f8fbff 0%,#e9f2ff 100%)}
  main{max-width:920px;margin:0 auto;padding:48px 20px 72px}.mark{font-size:14px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#2563eb}
  h1{font-size:clamp(2rem,5vw,3.5rem);margin:.35rem 0 1rem;line-height:1.02}p{line-height:1.6;color:#51627d}
  .card{margin-top:28px;background:#fff;border:1px solid #dbe7fb;border-radius:20px;padding:24px;box-shadow:0 18px 50px #1d4ed812}
  label{display:block;font-size:.86rem;font-weight:750;margin:18px 0 7px}input{width:100%;box-sizing:border-box;border:1px solid #bdd1f2;border-radius:10px;padding:13px;font:inherit}
  button{border:0;border-radius:10px;padding:12px 16px;background:#2563eb;color:#fff;font:inherit;font-weight:750;cursor:pointer;margin:16px 8px 0 0}button.alt{background:#eaf1ff;color:#173f8d}
  #status{min-height:26px;margin-top:14px;font-weight:650}#status.error{color:#b42318}#actions{display:none}.result{display:none;margin-top:24px}.result.visible{display:block}
  pre{white-space:pre-wrap;background:#f8fbff;border:1px solid #dbe7fb;border-radius:12px;padding:18px;max-height:48vh;overflow:auto;line-height:1.65}
  footer{margin-top:30px;font-size:.88rem;color:#60708a}.privacy{font-weight:700;color:#173f8d}
</style></head><body><main>
<div class="mark">Local-only companion</div><h1>Read YouTube captions on your computer.</h1>
<p>This app listens only on <strong>127.0.0.1</strong>. yt-dlp caption requests leave from the computer running it; nothing is sent to TubeTranscriber’s public server.</p>
<section class="card"><form id="lookup"><label for="url">YouTube video URL</label><input id="url" required placeholder="https://www.youtube.com/watch?v=..." autocomplete="url">
<label for="languages">Preferred subtitle languages</label><input id="languages" value="en" placeholder="en, es, fr"><button type="submit">Get transcript</button></form>
<div id="status" role="status"></div><div class="result" id="result"><p id="meta"></p><div id="actions"><button class="alt" data-export="txt">Download TXT</button><button class="alt" data-export="json">Download JSON</button><button class="alt" data-export="srt">Download SRT</button><button class="alt" id="copy">Copy text</button></div><pre id="text"></pre></div></section>
<footer><span class="privacy">Privacy:</span> this local app does not accept remote connections, proxy settings, account cookies, or API keys. Availability still depends on YouTube and its public subtitle tracks.</footer>
</main><script>
let current=null; const $=id=>document.getElementById(id);
function srtTime(seconds){const ms=Math.max(0,Math.round(seconds*1000));const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000),r=ms%1000;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(r).padStart(3,'0')}`}
function download(name,content,type){const blob=new Blob([content],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href)}
$('lookup').addEventListener('submit',async e=>{e.preventDefault();$('status').className='';$('status').textContent='Retrieving public captions with yt-dlp…';$('result').classList.remove('visible');const response=await fetch('/api/transcript',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:$('url').value,languages:$('languages').value})});const payload=await response.json();if(!response.ok){$('status').className='error';$('status').textContent=payload.error||'The lookup failed.';return}current=payload;$('status').textContent='Transcript ready.';$('meta').textContent=`Subtitle track: ${payload.language}`;$('text').textContent=payload.plainText;$('actions').style.display='block';$('result').classList.add('visible')});
document.querySelectorAll('[data-export]').forEach(button=>button.addEventListener('click',()=>{if(!current)return;const type=button.dataset.export;const base=`transcript-${current.videoId}`;if(type==='txt')download(`${base}.txt`,current.plainText,'text/plain');if(type==='json')download(`${base}.json`,JSON.stringify(current.segments,null,2),'application/json');if(type==='srt')download(`${base}.srt`,current.segments.map((x,i)=>`${i+1}\n${srtTime(x.start)} --> ${srtTime(x.start+x.duration)}\n${x.text}\n`).join('\n'),'text/plain')}));
$('copy').addEventListener('click',async()=>{if(current){await navigator.clipboard.writeText(current.plainText);$('copy').textContent='Copied';setTimeout(()=>{$('copy').textContent='Copy text'},1200)}});
</script></body></html>"""


def create_app(extractor: Callable[[str, tuple[str, ...]], dict[str, Any]] = fetch_public_transcript) -> Flask:
    app = Flask(__name__)

    @app.get("/")
    def home() -> str:
        return render_template_string(PAGE)

    @app.post("/api/transcript")
    def transcript():
        payload = request.get_json(silent=True) or {}
        try:
            video_id = extract_video_id(str(payload.get("url", "")))
            result = extractor(video_id, normalize_language_codes(payload.get("languages")))
            return jsonify(result)
        except TranscriptLookupError as error:
            status = 400 if error.kind == "invalid_url" else 422 if error.kind == "no_captions" else 429 if error.kind == "restricted" else 502
            return jsonify({"error": error.message, "kind": error.kind}), status

    return app


if __name__ == "__main__":
    create_app().run(host=LOCAL_HOST, port=LOCAL_PORT, debug=False)
