const button = document.getElementById("capture");
const status = document.getElementById("status");

button.addEventListener("click", () => {
  button.disabled = true;
  status.className = "";
  status.textContent = "Opening the transcript panel and reading visible caption lines…";
  chrome.runtime.sendMessage({ type: "START_CAPTURE" }, response => {
    button.disabled = false;
    if (chrome.runtime.lastError) {
      status.className = "error";
      status.textContent = chrome.runtime.lastError.message;
      return;
    }
    if (!response?.ok) {
      status.className = "error";
      status.textContent = response?.error || "Capture failed.";
      return;
    }
    status.className = "ok";
    status.textContent = `Captured ${response.count} caption segments. The transcript is now cached in TubeTranscriber.`;
  });
});
