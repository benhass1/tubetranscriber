import SiteShell from "@/components/SiteShell";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  CheckCircle2,
  Clock3,
  Gauge,
  Lightbulb,
  LoaderCircle,
  MonitorUp,
  Network,
  Play,
  RadioTower,
  TimerReset,
  Wifi,
} from "lucide-react";
import { useMemo, useState } from "react";

type TestState = "idle" | "measuring" | "complete" | "error";

type NetworkResult = {
  uploadMbps: number;
  downloadMbps: number;
  latencyMs: number;
};

type VideoPreset = {
  id: string;
  label: string;
  size: number;
  unit: "MB" | "GB";
};

const TEST_DOWNLOAD_BYTES = 3_000_000;
const TEST_UPLOAD_BYTES = 1_000_000;
const TEST_TIMEOUT_MS = 15_000;

const VIDEO_PRESETS: VideoPreset[] = [
  { id: "short", label: "1080p Short · 60 seconds", size: 150, unit: "MB" },
  { id: "1080p", label: "1080p video · 10 minutes", size: 1.5, unit: "GB" },
  { id: "4k", label: "4K video · 15 minutes", size: 5, unit: "GB" },
  { id: "custom", label: "Custom file size", size: 1.5, unit: "GB" },
];

function withCacheBust(path: string) {
  return `https://speed.cloudflare.com${path}${path.includes("?") ? "&" : "?"}cb=${Date.now()}-${Math.random()}`;
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), TEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function measureNetwork(onStep: (step: string) => void): Promise<NetworkResult> {
  onStep("Checking latency");
  const latencyStart = performance.now();
  const latencyResponse = await fetchWithTimeout(withCacheBust("/__down?bytes=0"));
  if (!latencyResponse.ok) throw new Error("Latency check failed");
  const latencyMs = Math.max(1, performance.now() - latencyStart);

  onStep("Measuring download speed");
  const downloadStart = performance.now();
  const downloadResponse = await fetchWithTimeout(withCacheBust(`/__down?bytes=${TEST_DOWNLOAD_BYTES}`));
  if (!downloadResponse.ok) throw new Error("Download check failed");
  await downloadResponse.arrayBuffer();
  const downloadSeconds = Math.max((performance.now() - downloadStart) / 1000, 0.001);
  const downloadMbps = (TEST_DOWNLOAD_BYTES * 8) / 1_000_000 / downloadSeconds;

  onStep("Measuring upload speed");
  const uploadPayload = new Uint8Array(TEST_UPLOAD_BYTES);
  const uploadStart = performance.now();
  const uploadResponse = await fetchWithTimeout(withCacheBust("/__up"), {
    method: "POST",
    body: uploadPayload,
  });
  if (!uploadResponse.ok) throw new Error("Upload check failed");
  await uploadResponse.arrayBuffer().catch(() => undefined);
  const uploadSeconds = Math.max((performance.now() - uploadStart) / 1000, 0.001);
  const uploadMbps = (TEST_UPLOAD_BYTES * 8) / 1_000_000 / uploadSeconds;

  return { uploadMbps, downloadMbps, latencyMs };
}

function formatMbps(value: number) {
  return value >= 100 ? Math.round(value).toString() : value.toFixed(1);
}

function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "—";
  const rounded = Math.ceil(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function sizeInMegabytes(value: number, unit: "MB" | "GB") {
  return unit === "GB" ? value * 1024 : value;
}

function getRecommendation(uploadMbps: number | null) {
  if (uploadMbps === null) {
    return {
      tone: "neutral",
      label: "Run the test first",
      title: "Measure your upload runway",
      body: "Start the speed test to see which YouTube upload workflow fits your connection.",
      icon: Activity,
    } as const;
  }
  if (uploadMbps >= 25) {
    return {
      tone: "high",
      label: "High Performance",
      title: "Your connection is ready for ambitious uploads.",
      body: "Ready for 4K 60fps & long-form video uploads without delay.",
      icon: CheckCircle2,
    } as const;
  }
  if (uploadMbps >= 10) {
    return {
      tone: "good",
      label: "Good Performance",
      title: "A solid setup for a consistent creator workflow.",
      body: "Ideal for 1080p HD uploads and YouTube Shorts.",
      icon: Gauge,
    } as const;
  }
  return {
    tone: "low",
    label: "Low Upload Speed",
    title: "Plan extra time for larger video files.",
    body: "Slow upload speeds detected. Expect delays on large 4K files.",
    icon: TimerReset,
  } as const;
}

export default function SpeedTest() {
  const [testState, setTestState] = useState<TestState>("idle");
  const [testStep, setTestStep] = useState("Ready when you are");
  const [result, setResult] = useState<NetworkResult | null>(null);
  const [error, setError] = useState("");
  const [presetId, setPresetId] = useState("1080p");
  const [customSize, setCustomSize] = useState("1.5");
  const [customUnit, setCustomUnit] = useState<"MB" | "GB">("GB");

  const selectedPreset = VIDEO_PRESETS.find(preset => preset.id === presetId) ?? VIDEO_PRESETS[1]!;
  const fileSize = presetId === "custom" ? Number(customSize) : selectedPreset.size;
  const fileUnit = presetId === "custom" ? customUnit : selectedPreset.unit;
  const fileSizeMb = Number.isFinite(fileSize) && fileSize > 0 ? sizeInMegabytes(fileSize, fileUnit) : 0;
  const uploadSeconds = result && fileSizeMb > 0 ? (fileSizeMb * 8) / result.uploadMbps : 0;
  const recommendation = useMemo(() => getRecommendation(result?.uploadMbps ?? null), [result?.uploadMbps]);
  const RecommendationIcon = recommendation.icon;

  async function handleStartTest() {
    setTestState("measuring");
    setTestStep("Starting browser-based network test");
    setError("");
    try {
      const nextResult = await measureNetwork(setTestStep);
      setResult(nextResult);
      setTestState("complete");
      setTestStep("Test complete");
    } catch (testError) {
      console.error(testError);
      setResult(null);
      setTestState("error");
      setTestStep("Test could not finish");
      setError("The test endpoint could not be reached. Check your connection and try again.");
    }
  }

  return (
    <SiteShell>
      <div className="speed-test-page">
        <section className="speed-test-hero">
          <div className="content-container speed-test-hero-inner">
            <a href="/" className="back-link"><ArrowLeft size={15} /> Back to TubeTranscriber</a>
            <div className="speed-test-hero-grid">
              <div>
                <p className="eyebrow"><MonitorUp size={14} /> Creator network toolkit</p>
                <h1>YouTube Upload Speed Test <span>&amp; Time Estimator</span></h1>
                <p className="speed-test-lede">Measure the connection you rely on to publish, then turn your upload speed into a realistic YouTube delivery timeline.</p>
                <div className="speed-test-actions">
                  <button type="button" className="primary-button speed-test-start" onClick={handleStartTest} disabled={testState === "measuring"}>
                    {testState === "measuring" ? <LoaderCircle size={17} className="speed-test-spin" /> : <Play size={17} fill="currentColor" />}
                    {testState === "measuring" ? "Testing connection…" : "Start Speed Test"}
                  </button>
                  <span className="speed-test-private"><Wifi size={15} /> Runs in your browser. Only a small test payload is sent.</span>
                </div>
                <p className="speed-test-status" aria-live="polite">{testStep}</p>
                {error && <p className="speed-test-error" role="alert">{error}</p>}
              </div>
              <div className="speed-test-hero-card" aria-label="YouTube creator upload benchmark">
                <div className="speed-test-hero-card-top"><span>CREATOR MODE</span><RadioTower size={17} /></div>
                <strong>Upload speed first.</strong>
                <p>Because the time to publish depends on the connection sending your finished video to YouTube.</p>
                <div className="speed-test-hero-rule" />
                <span className="speed-test-formula">File size × 8 ÷ Mbps = upload seconds</span>
              </div>
            </div>
          </div>
        </section>

        <section className="speed-test-results content-container" aria-labelledby="results-heading">
          <div className="section-heading speed-test-section-heading">
            <div>
              <p className="eyebrow"><Activity size={14} /> Network snapshot</p>
              <h2 id="results-heading">Know your publishing pace.</h2>
            </div>
            <p className="section-answer">Your upload result is the primary signal for creator workflows. Download speed and latency complete the picture for uploading assets, managing a channel, and working in cloud tools.</p>
          </div>
          <div className="speed-metrics-grid" aria-live="polite">
            <article className="speed-metric-card speed-metric-primary">
              <div className="speed-metric-icon"><ArrowUpFromLine size={20} /></div>
              <span className="speed-metric-label">Upload Speed</span>
              <strong>{result ? formatMbps(result.uploadMbps) : "—"}<small> Mbps</small></strong>
              <p>{result ? "Primary creator metric" : "Start the test to measure"}</p>
            </article>
            <article className="speed-metric-card">
              <div className="speed-metric-icon"><ArrowDownToLine size={20} /></div>
              <span className="speed-metric-label">Download Speed</span>
              <strong>{result ? formatMbps(result.downloadMbps) : "—"}<small> Mbps</small></strong>
              <p>{result ? "Useful for source footage and assets" : "Waiting for a measurement"}</p>
            </article>
            <article className="speed-metric-card">
              <div className="speed-metric-icon"><Network size={20} /></div>
              <span className="speed-metric-label">Latency / Ping</span>
              <strong>{result ? Math.round(result.latencyMs) : "—"}<small> ms</small></strong>
              <p>{result ? "Lower is better for live workflows" : "Waiting for a measurement"}</p>
            </article>
          </div>
          <div className={`creator-recommendation creator-recommendation-${recommendation.tone}`}>
            <div className="creator-recommendation-icon"><RecommendationIcon size={21} /></div>
            <div><span className="recommendation-badge">{recommendation.label}</span><h3>{recommendation.title}</h3><p>{recommendation.body}</p></div>
          </div>
        </section>

        <section className="upload-estimator-section" aria-labelledby="estimator-heading">
          <div className="content-container upload-estimator-layout">
            <div className="upload-estimator-copy">
              <p className="eyebrow"><Clock3 size={14} /> YouTube upload planner</p>
              <h2 id="estimator-heading">How long will your video take to upload?</h2>
              <p>Choose a common creator format or enter the approximate size of your exported file. The estimate uses your measured upload speed and treats 1 GB as 1,024 MB.</p>
              <div className="upload-estimator-note"><Gauge size={17} /><span><strong>Estimate, not a promise.</strong> Wi-Fi congestion, YouTube processing, and ISP traffic can add time after the transfer begins.</span></div>
            </div>
            <div className="upload-calculator">
              <div className="upload-calculator-heading"><div><span className="panel-label">Video file</span><h3>Pick a format</h3></div><span className="calculator-value">{fileSizeMb > 0 ? `${fileSizeMb.toLocaleString()} MB` : "Enter a size"}</span></div>
              <label className="speed-field-label" htmlFor="video-preset">Typical video format</label>
              <select id="video-preset" value={presetId} onChange={event => setPresetId(event.target.value)}>
                {VIDEO_PRESETS.map(preset => <option key={preset.id} value={preset.id}>{preset.label}{preset.id !== "custom" ? ` · ${preset.size} ${preset.unit}` : ""}</option>)}
              </select>
              {presetId === "custom" && <div className="custom-size-fields"><label className="speed-field-label" htmlFor="custom-size">File size</label><div className="custom-size-row"><input id="custom-size" type="number" min="0.01" step="0.01" value={customSize} onChange={event => setCustomSize(event.target.value)} aria-label="Custom video file size" /><select value={customUnit} onChange={event => setCustomUnit(event.target.value as "MB" | "GB")} aria-label="Custom file size unit"><option value="GB">GB</option><option value="MB">MB</option></select></div></div>}
              <div className="calculator-result"><span><TimerReset size={17} /> Estimated upload time</span><strong>{result && fileSizeMb > 0 ? formatDuration(uploadSeconds) : "Run the test to estimate"}</strong><small>{result && fileSizeMb > 0 ? `At ${formatMbps(result.uploadMbps)} Mbps upload speed` : "Your result will appear here"}</small></div>
            </div>
          </div>
        </section>

        <section className="creator-tips-section content-container" aria-labelledby="tips-heading">
          <div className="section-heading"><p className="eyebrow"><Lightbulb size={14} /> Creator playbook</p><h2 id="tips-heading">Make slow uploads less painful.</h2><p className="section-answer">A few export and network choices can make your next YouTube upload more predictable, especially when you are working with long-form or high-resolution footage.</p></div>
          <div className="creator-tips-grid">
            <article className="creator-tip-card"><span>01</span><h3>Export for the platform</h3><p>Use H.264 or HEVC codecs with recommended YouTube bitrates before exporting.</p></article>
            <article className="creator-tip-card"><span>02</span><h3>Prefer a wired connection</h3><p>Connect via Ethernet instead of Wi-Fi to eliminate upload packet loss.</p></article>
            <article className="creator-tip-card"><span>03</span><h3>Choose a calmer window</h3><p>Upload during off-peak network hours to avoid ISP throttling.</p></article>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
