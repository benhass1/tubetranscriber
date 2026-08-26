const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function getVideoId() {
  const url = new URL(location.href);
  if (url.hostname === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || "";
  return url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).at(-1) || "";
}

function parseTimestamp(value) {
  const parts = value.trim().split(":").map(Number);
  if (!parts.length || parts.some(Number.isNaN)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function textOf(element) {
  return element?.textContent?.replace(/\s+/g, " ").trim() || "";
}

function findShowTranscriptButton() {
  const candidates = [...document.querySelectorAll("button, tp-yt-paper-button, yt-button-shape, [role=button]")];
  return candidates.find(element => {
    const label = `${textOf(element)} ${element.getAttribute("aria-label") || ""} ${element.getAttribute("title") || ""}`;
    return /show transcript|open transcript|transcript/i.test(label);
  });
}

function readSegments() {
  const rows = [...document.querySelectorAll([
    "ytd-transcript-segment-renderer",
    "yt-transcript-segment-renderer",
    "[data-testid=transcript-segment]",
    "[class*=transcript-segment]",
  ].join(","))];
  const seen = new Set();
  return rows.map((row, index) => {
    const timestampElement = row.querySelector(".segment-timestamp, [class*=timestamp], timestamp");
    const textElement = row.querySelector(".segment-text, [class*=segment-text], yt-formatted-string, [class*=caption-text]");
    const text = textOf(textElement) || textOf(row).replace(textOf(timestampElement), "").trim();
    const start = parseTimestamp(textOf(timestampElement));
    return { start: start ?? index, duration: 0, text };
  }).filter(segment => {
    const key = `${segment.start}:${segment.text}`;
    if (!segment.text || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function captureTranscript() {
  const videoId = getVideoId();
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) throw new Error("Open the target video directly on YouTube first.");

  let segments = readSegments();
  if (!segments.length) {
    const button = findShowTranscriptButton();
    if (!button) throw new Error("YouTube did not expose a Show transcript control for this video.");
    button.click();
    for (let attempt = 0; attempt < 30 && !segments.length; attempt += 1) {
      await sleep(300);
      segments = readSegments();
    }
  }
  if (!segments.length) throw new Error("The transcript panel opened, but no readable caption lines were found.");

  return {
    videoId,
    sourceUrl: location.href,
    title: document.title.replace(/\s*-\s*YouTube\s*$/i, "").trim() || "YouTube video",
    channel: textOf(document.querySelector("ytd-channel-name a, #owner-name a")) || "YouTube",
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
