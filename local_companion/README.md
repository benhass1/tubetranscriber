# TubeTranscriber Local Companion

This is a **localhost-only** Python app. It runs on the visitor’s computer and requests public YouTube transcripts from that computer’s network connection through `youtube-transcript-api`.

> It does not make YouTube access guaranteed. A video may have no captions, or YouTube may temporarily restrict requests from a particular connection.

## What it includes

| Capability | Included behavior |
|---|---|
| Local network use | The app binds only to `127.0.0.1:8765`; transcript requests originate from the computer that runs it. |
| Caption method | `youtube-transcript-api` retrieves available public transcript tracks. |
| Language selection | The requested language list is passed to `youtube-transcript-api`, for example `en,es,fr`. |
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

## Windows-worker preparation

The app deliberately remains localhost-only. Before it is connected to `tubetranscriber.com`, do **not** expose port `8765` through a router or firewall rule. The future worker connection should use an authenticated tunnel and a separate server-to-server endpoint, so public visitors cannot call this local service directly.

## Important limitation

The public `tubetranscriber.com` website cannot redirect a visitor’s server-side caption request through this program automatically. Each visitor who wants to use their own connection must run this local app, or install the planned browser-extension bridge. The local web interface deliberately accepts requests only from the same computer.
