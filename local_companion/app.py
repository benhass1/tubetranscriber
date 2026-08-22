"""TubeTranscriber Local Companion.

Runs only on 127.0.0.1 and retrieves publicly available captions from the
computer where the user launches it. No proxy, account cookie, or cloud
transcript provider is used.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Callable
from urllib.parse import parse_qs, urlparse

from flask import Flask, jsonify, render_template_string, request
from youtube_transcript_api import YouTubeTranscriptApi


LOCAL_HOST = "127.0.0.1"
LOCAL_PORT = 8765
VIDEO_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{11}$")


@dataclass
class TranscriptLookupError(Exception):
    kind: str
    message: str


def classify_error(error: Exception) -> str:
    name = type(error).__name__
    if name in {"VideoUnavailable", "VideoUnplayable", "InvalidVideoId"}:
        return "video_unavailable"
    if name in {"NoTranscriptFound", "TranscriptsDisabled", "NoTranscriptAvailable"}:
        return "no_captions"
    if name in {"RequestBlocked", "IpBlocked", "TooManyRequests", "YouTubeRequestFailed"}:
        return "restricted"
    return "upstream_error"


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
        raise TranscriptLookupError(
            "invalid_url",
            "Paste a valid YouTube video URL or 11-character video ID.",
        )
    return candidate


def normalize_language_codes(value: str | None) -> tuple[str, ...]:
    codes = tuple(
        code.strip().lower()
        for code in (value or "en").split(",")
        if code.strip()
    )
    return codes or ("en",)


def choose_track(transcripts: list[Any], language_codes: tuple[str, ...]) -> Any:
    for language_code in language_codes:
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


def fetch_public_transcript(video_id: str, language_codes: tuple[str, ...]) -> dict[str, Any]:
    try:
        api = YouTubeTranscriptApi()
        available_tracks = list(api.list(video_id))
        if not available_tracks:
            raise TranscriptLookupError("no_captions", "No public caption tracks are available for this video.")

        selected = choose_track(available_tracks, language_codes)
        fetched = selected.fetch()
        segments = [
            {
                "text": str(item.get("text", "")).strip(),
                "start": float(item.get("start", 0)),
                "duration": float(item.get("duration", 0)),
            }
            for item in fetched.to_raw_data()
            if str(item.get("text", "")).strip()
        ]
        if not segments:
            raise TranscriptLookupError("no_captions", "No public caption segments were returned.")
        return {
            "videoId": video_id,
            "language": selected.language_code,
            "isGenerated": selected.is_generated,
            "segments": segments,
            "plainText": "\n\n".join(segment["text"] for segment in segments),
        }
    except TranscriptLookupError:
        raise
    except Exception as error:  # Versioned library exception classes vary.
        kind = classify_error(error)
        messages = {
            "video_unavailable": "This video is unavailable.",
            "no_captions": "No public captions are available for this video.",
            "restricted": "YouTube temporarily restricted caption retrieval from this computer. Try again later.",
            "upstream_error": "The caption service could not be reached. Please try again later.",
        }
        raise TranscriptLookupError(kind, messages[kind]) from error


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
<p>This app listens only on <strong>127.0.0.1</strong>. Caption requests leave from the computer running it; nothing is sent to TubeTranscriber’s public server.</p>
<section class="card"><form id="lookup"><label for="url">YouTube video URL</label><input id="url" required placeholder="https://www.youtube.com/watch?v=..." autocomplete="url">
<label for="languages">Preferred languages</label><input id="languages" value="en" placeholder="en, es, fr"><button type="submit">Get transcript</button></form>
<div id="status" role="status"></div><div class="result" id="result"><p id="meta"></p><div id="actions"><button class="alt" data-export="txt">Download TXT</button><button class="alt" data-export="json">Download JSON</button><button class="alt" data-export="srt">Download SRT</button><button class="alt" id="copy">Copy text</button></div><pre id="text"></pre></div></section>
<footer><span class="privacy">Privacy:</span> this local app does not accept remote connections, proxy settings, account cookies, or API keys. Availability still depends on YouTube and the public captions on each video.</footer>
</main><script>
let current=null; const $=id=>document.getElementById(id);
function srtTime(seconds){const ms=Math.max(0,Math.round(seconds*1000));const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000),r=ms%1000;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(r).padStart(3,'0')}`}
function download(name,content,type){const blob=new Blob([content],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href)}
$('lookup').addEventListener('submit',async e=>{e.preventDefault();$('status').className='';$('status').textContent='Retrieving public captions…';$('result').classList.remove('visible');const response=await fetch('/api/transcript',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:$('url').value,languages:$('languages').value})});const payload=await response.json();if(!response.ok){$('status').className='error';$('status').textContent=payload.error||'The lookup failed.';return}current=payload;$('status').textContent='Transcript ready.';$('meta').textContent=`Language: ${payload.language}${payload.isGenerated?' · auto-generated captions':''}`;$('text').textContent=payload.plainText;$('actions').style.display='block';$('result').classList.add('visible')});
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
