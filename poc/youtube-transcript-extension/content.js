const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function getVideoId() {
  return new URL(location.href).searchParams.get("v") || location.pathname.split("/").filter(Boolean).at(-1) || "";
}

function parseTimestamp(value) {
  const parts = value.trim().split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function findShowTranscriptButton() {
  return [...document.querySelectorAll("button, tp-yt-paper-button, yt-button-shape")]
    .find(element => /show transcript|transcript/i.test(element.textContent || ""));
}

function readSegments() {
  const rows = [...document.querySelectorAll("ytd-transcript-segment-renderer")];
  return rows.map((row, index) => {
    const timestamp = parseTimestamp(row.querySelector(".segment-timestamp")?.textContent || "");
    const text = row.querySelector(".segment-text, yt-formatted-string")?.textContent?.replace(/\s+/g, " ").trim() || "";
    return { start: timestamp ?? index, duration: 0, text };
  }).filter(segment => segment.text);
}

async function captureTranscript() {
  const videoId = getVideoId();
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) throw new Error("Open a normal YouTube video page first.");

  let segments = readSegments();
  if (!segments.length) {
    const button = findShowTranscriptButton();
    if (!button) throw new Error("YouTube did not expose a Show transcript button for this video.");
    button.click();
    for (let attempt = 0; attempt < 20 && !segments.length; attempt += 1) {
      await sleep(250);
      segments = readSegments();
    }
  }
  if (!segments.length) throw new Error("The YouTube transcript panel opened, but no caption lines were readable.");

  return {
    videoId,
    sourceUrl: location.href,
    title: document.title.replace(/\s*-\s*YouTube\s*$/i, "").trim() || "YouTube video",
    channel: document.querySelector("ytd-channel-name a, #owner-name a")?.textContent?.trim() || "YouTube",
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    segments: segments.map((segment, index) => ({
      ...segment,
      duration: index + 1 < segments.length ? Math.max(0, segments[index + 1].start - segment.start) : 1,
    })),
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "CAPTURE_TRANSCRIPT") return undefined;
  captureTranscript().then(result => sendResponse({ ok: true, result })).catch(error => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Capture failed." }));
  return true;
});
