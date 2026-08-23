const TUBETRANSCRIBER_ORIGIN = "https://tubetranscriber.com";

function isYouTubeVideoUrl(value) {
  try {
    const url = new URL(value);
    return ["www.youtube.com", "m.youtube.com", "youtu.be"].includes(url.hostname) && (url.pathname === "/watch" || url.hostname === "youtu.be");
  } catch {
    return false;
  }
}

function openTranscript(sourceUrl) {
  const target = isYouTubeVideoUrl(sourceUrl)
    ? `${TUBETRANSCRIBER_ORIGIN}/transcript?url=${encodeURIComponent(sourceUrl)}`
    : `${TUBETRANSCRIBER_ORIGIN}/`;
  return chrome.tabs.create({ url: target });
}

chrome.action.onClicked.addListener(tab => {
  if (tab.url) openTranscript(tab.url);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "open-transcript" || typeof message.url !== "string") return;
  openTranscript(message.url)
    .then(() => sendResponse({ ok: true }))
    .catch(error => sendResponse({ ok: false, error: String(error) }));
  return true;
});
