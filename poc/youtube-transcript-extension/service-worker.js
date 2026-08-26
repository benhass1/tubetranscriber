async function captureFromTab(tab) {
  try {
    return await chrome.tabs.sendMessage(tab.id, { type: "CAPTURE_TRANSCRIPT" });
  } catch {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    return chrome.tabs.sendMessage(tab.id, { type: "CAPTURE_TRANSCRIPT" });
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "START_CAPTURE") return undefined;
  chrome.tabs.query({ active: true, currentWindow: true }).then(async tabs => {
    const tab = tabs[0];
    const hostname = tab?.url ? new URL(tab.url).hostname : "";
    if (!tab?.id || !(hostname === "youtube.com" || hostname.endsWith(".youtube.com"))) {
      sendResponse({ ok: false, error: "Open the target video on youtube.com before starting capture." });
      return;
    }
    try {
      const response = await captureFromTab(tab);
      if (!response?.ok) {
        sendResponse({ ok: false, error: response?.error || "The YouTube page did not return a transcript." });
        return;
      }
      const payload = response.result;
      const last = payload.segments.at(-1);
      const ingestResponse = await fetch("https://tubetranscriber.com/api/trpc/transcript.ingestBrowser?batch=1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          "0": {
            json: {
              url: payload.sourceUrl,
              metadata: {
                videoId: payload.videoId,
                title: payload.title,
                channel: payload.channel,
                thumbnailUrl: payload.thumbnailUrl,
                durationSeconds: last ? last.start + last.duration : null,
              },
              segments: payload.segments,
            },
          },
        }),
      });
      if (!ingestResponse.ok) throw new Error(`TubeTranscriber cache request failed (${ingestResponse.status}).`);
      sendResponse({ ok: true, videoId: payload.videoId, count: payload.segments.length });
    } catch (error) {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : "Upload to TubeTranscriber failed." });
    }
  }).catch(error => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Could not access the active tab." }));
  return true;
});
