# TubeTranscriber Chrome Extension

This Manifest V3 extension adds an **Extract transcript** button to YouTube watch pages. Clicking the button opens the current video in TubeTranscriber, which reuses the existing website transcript extraction workflow, including its caption selection, formatting, export, WARP, InnerTube, and PO-token logic.

The extension does not collect YouTube credentials, does not read page content beyond the current tab URL, and does not call a separate transcript API. It only passes the current YouTube URL to `https://tubetranscriber.com/transcript?url=...`.

## Install in Chrome

1. Download `tubetranscriber-chrome-extension.zip` from the TubeTranscriber website, or use the ZIP included in the project release.
2. Extract the ZIP into a folder on your computer. Keep the extracted folder in place; Chrome loads the extension from that folder.
3. Open `chrome://extensions` in Chrome.
4. Turn on **Developer mode** in the top-right corner.
5. Click **Load unpacked**.
6. Select the extracted folder containing `manifest.json`.
7. Confirm that **TubeTranscriber — YouTube Transcript Reader** appears in the extensions list.
8. Open any YouTube watch page and reload it. The **Extract transcript** button appears below the video action controls.
9. Click the button. TubeTranscriber opens in a new tab with the video URL already prepared.

## Optional toolbar use

You can pin the extension from Chrome’s Extensions menu. Clicking the extension icon while a YouTube watch page is active opens that video in TubeTranscriber. On other pages it opens the TubeTranscriber home page.

## Updating the extension

After downloading a newer ZIP, extract it to a new or replaced folder. In `chrome://extensions`, click **Reload** on the TubeTranscriber extension card. Chrome will then use the updated files.

## Permissions

The extension requests `tabs` so the toolbar action can read the active tab URL. Its host permissions are limited to YouTube domains used by watch pages. The extension does not require access to cookies, browsing history, microphone, camera, storage, or account credentials.
