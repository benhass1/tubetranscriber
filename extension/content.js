const BUTTON_ID = "tubetranscriber-extract-button";
const BUTTON_LABEL = "Extract transcript";

function getActionHost() {
  return document.querySelector("#top-level-buttons-computed")
    || document.querySelector("ytd-watch-metadata #actions-inner")
    || document.querySelector("#actions-inner");
}

function getYouTubeVideoUrl() {
  return window.location.href;
}

function requestTranscript() {
  const button = document.getElementById(BUTTON_ID);
  if (!button) return;
  button.disabled = true;
  button.textContent = "Opening TubeTranscriber…";
  chrome.runtime.sendMessage({ type: "open-transcript", url: getYouTubeVideoUrl() }, response => {
    if (chrome.runtime.lastError || !response?.ok) {
      button.disabled = false;
      button.textContent = BUTTON_LABEL;
    }
  });
}

function addTranscriptButton() {
  if (!location.pathname.startsWith("/watch") || document.getElementById(BUTTON_ID)) return;
  const host = getActionHost();
  if (!host) return;

  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.type = "button";
  button.className = "tubetranscriber-button";
  button.setAttribute("aria-label", "Extract this YouTube video transcript with TubeTranscriber");
  button.title = "Extract this video transcript with TubeTranscriber";
  button.textContent = BUTTON_LABEL;
  button.addEventListener("click", requestTranscript);

  const wrapper = document.createElement("div");
  wrapper.className = "tubetranscriber-button-wrap";
  wrapper.appendChild(button);
  host.insertAdjacentElement("afterend", wrapper);
}

function scheduleButton() {
  window.setTimeout(addTranscriptButton, 250);
  window.setTimeout(addTranscriptButton, 1000);
  window.setTimeout(addTranscriptButton, 2500);
}

scheduleButton();
new MutationObserver(scheduleButton).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("yt-navigate-finish", scheduleButton);
window.addEventListener("popstate", scheduleButton);
