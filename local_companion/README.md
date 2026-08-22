# TubeTranscriber Local Companion

This is a small **localhost-only** Python app. It runs on the visitor’s computer and sends public-caption requests from that computer’s own network connection. It has no cloud transcript provider, no API key, no proxy configuration, and no account-cookie import.

> It does not make YouTube access guaranteed. A video may have no captions, or YouTube may temporarily restrict requests from a particular connection.

## What it includes

| Capability | Included behavior |
|---|---|
| Local network use | The app binds only to `127.0.0.1:8765`; caption requests originate from the computer that runs it. |
| Caption method | `youtube-transcript-api`, which retrieves public caption tracks directly. |
| Track choice | Prefers human-created captions in the requested language, then auto-generated captions, then another available public track. |
| Output | Plain-text reader, copy button, and browser-generated TXT, JSON, and SRT downloads. |
| Privacy boundary | No remote listener, API key, cookies, proxy, or public TubeTranscriber-server request. |

## Run it

Install Python 3.10 or newer. In a terminal, open the `local_companion` folder and run the following commands.

### macOS or Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python app.py
```

### Windows PowerShell

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

Then open [http://127.0.0.1:8765](http://127.0.0.1:8765) in the same computer’s browser. Stop the app with `Ctrl+C` when finished.

## Test it

With the virtual environment active, run:

```bash
python -m unittest -v test_app.py
```

## Important limitation

The public `tubetranscriber.com` website cannot redirect a visitor’s server-side caption request through this program automatically. Each visitor who wants to use their own connection must download the source and run this local app themselves. The local web interface deliberately accepts requests only from the same computer.
