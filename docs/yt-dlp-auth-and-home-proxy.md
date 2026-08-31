# Optional yt-dlp authentication and home-network proxy

TubeTranscriber keeps its normal extraction order and treats these settings as optional enhancements to the server-side yt-dlp fallback. They are not required for Contabo, the browser fallback, or Render.

## Important OAuth limitation

The current official yt-dlp Extractors wiki says that YouTube OAuth login no longer works because of new restrictions. Therefore the historical command below is **not** installed or used by TubeTranscriber:

```bash
yt-dlp --username oauth2 --password '' --write-auto-sub --skip-download URL
```

Do not place a personal OAuth token, password, browser profile or private key in the repository or in Render variables. A dedicated YouTube cookie file is the supported optional mechanism when an authenticated YouTube session is genuinely required.

## Optional dedicated cookie file

On a trusted machine, create a fresh dedicated browser profile for YouTube and export only the required YouTube cookies in Netscape format. Copy the file to Contabo with owner-only permissions, for example:

```bash
install -o root -g root -m 600 youtube-cookies.txt /root/tubetranscriber/youtube-cookies.txt
```

Set the root-only environment value:

```text
YTDLP_COOKIES_FILE=/root/tubetranscriber/youtube-cookies.txt
```

The application passes this file only to the optional yt-dlp fallback. It does not expose the file to the browser or send it to Render. Use a dedicated account/profile, refresh the file when it expires, and remove it if the account is no longer intended for this use.

## Optional home-network proxy

A tunnel alone is not an HTTP proxy. The VPS must have a real HTTP or SOCKS proxy endpoint that forwards through the home PC. Configure that endpoint only on the VPS:

```text
YTDLP_PROXY_URL=http://127.0.0.1:8080
```

or, for a SOCKS endpoint supported by the installed dependencies:

```text
YTDLP_PROXY_URL=socks5h://127.0.0.1:1080
```

The optional yt-dlp fallback uses this proxy when set; it otherwise uses the existing WARP proxy. To route the existing Python HTTP extraction methods through the same endpoint as well, set `YOUTUBE_PROXY_URL` to the same value. Both variables are empty by default, so the current Contabo, browser and Render paths are not routed through the home PC.

For a reverse connection, the home PC must initiate an SSH session to the VPS and forward a local HTTP/SOCKS proxy port. Use a dedicated restricted SSH key, `ExitOnForwardFailure=yes`, keepalives, and a VPS-side firewall rule that allows the forwarded listener only on loopback. Do not expose the proxy port publicly. The PC must remain online, and the tunnel is not suitable as the only production path.

Example shape (the local proxy must already be running on the PC and the SSH account must be restricted to forwarding):

```powershell
ssh -N -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3 `
  -R 127.0.0.1:8080:127.0.0.1:8080 user@contabo-host
```

After the tunnel is established, validate only from the VPS with a harmless endpoint and configure `YTDLP_PROXY_URL` to the loopback listener. Never print proxy credentials, cookies or private keys in logs.

## Reliability policy

These options are deliberately disabled unless their environment variables are present and the referenced files or endpoints exist. yt-dlp remains a bounded, low-priority fallback. Contabo's existing Worker/WARP/PO-token stack, the browser-side fallback and Render remain available.
