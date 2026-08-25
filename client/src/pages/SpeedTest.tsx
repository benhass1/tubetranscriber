import SiteShell from "@/components/SiteShell";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpFromLine,
  CheckCircle2,
  CircleGauge,
  Clock3,
  CloudDownload,
  Film,
  Gamepad2,
  Globe2,
  Lightbulb,
  LoaderCircle,
  MapPin,
  MonitorUp,
  Network,
  Play,
  RadioTower,
  Server,
  Signal,
  TimerReset,
  UploadCloud,
  Wifi,
  Zap,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

type TestState = "idle" | "ping" | "download" | "upload" | "complete" | "error";
type NetworkResult = { uploadMbps: number; downloadMbps: number; latencyMs: number; jitterMs: number };
type VideoPreset = { id: string; label: string; size: number; unit: "MB" | "GB" };
type NetworkDetails = { ip: string; isp: string; city: string; server: string };

type HealthTone = "ready" | "good" | "watch" | "waiting";

type HealthItem = { label: string; tone: HealthTone; detail: string };

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

function networkValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return networkValue(record.name ?? record.code ?? record.colo ?? record.id ?? "");
  }
  return "";
}

function sleep(ms: number) {
  return new Promise<void>(resolve => window.setTimeout(resolve, ms));
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

async function fetchSpeedSample(kind: "download" | "upload", bytes: number) {
  const startedAt = performance.now();
  const response = kind === "download"
    ? await fetchWithTimeout(withCacheBust(`/__down?bytes=${bytes}`))
    : await fetchWithTimeout(withCacheBust("/__up"), { method: "POST", body: new Uint8Array(bytes) });
  if (!response.ok) throw new Error(`${kind} sample failed`);
  if (kind === "download") await response.arrayBuffer();
  else await response.arrayBuffer().catch(() => undefined);
  const seconds = Math.max((performance.now() - startedAt) / 1000, 0.001);
  return (bytes * 8) / 1_000_000 / seconds;
}

async function detectNetworkDetails(): Promise<NetworkDetails> {
  const fallback: NetworkDetails = { ip: "Detected locally", isp: "Network provider unavailable", city: "Nearest edge", server: "Cloudflare edge" };
  const [cloudflare, ipapi] = await Promise.allSettled([
    fetch("https://speed.cloudflare.com/meta", { cache: "no-store" }).then(async response => {
      const body = await response.json().catch(() => ({})) as Record<string, unknown>;
      return {
        ip: networkValue(body.ip ?? response.headers.get("cf-meta-ip") ?? ""),
        city: networkValue(body.city ?? response.headers.get("cf-meta-city") ?? ""),
        server: networkValue(body.colo ?? response.headers.get("cf-meta-colo") ?? ""),
        asn: networkValue(body.asn ?? response.headers.get("cf-meta-asn") ?? ""),
      };
    }),
    fetch("https://ipapi.co/json/", { cache: "no-store" }).then(response => response.json() as Promise<Record<string, unknown>>),
  ]);
  const cf = cloudflare.status === "fulfilled" ? cloudflare.value : undefined;
  const api = ipapi.status === "fulfilled" ? ipapi.value : undefined;
  const ip = networkValue(api?.ip ?? cf?.ip ?? "");
  const isp = networkValue(api?.org ?? api?.asn ?? (cf?.asn ? `AS${cf.asn}` : ""));
  const city = networkValue(api?.city ?? cf?.city ?? "");
  const server = networkValue(cf?.server ?? "");
  return {
    ip: ip || fallback.ip,
    isp: isp || fallback.isp,
    city: city || fallback.city,
    server: server || fallback.server,
  };
}

function formatMbps(value: number) {
  return value >= 100 ? Math.round(value).toString() : value.toFixed(2);
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
  if (uploadMbps === null) return { tone: "neutral", label: "Run the test first", title: "Measure your upload runway", body: "Start the speed test to see which YouTube upload workflow fits your connection.", icon: Activity } as const;
  if (uploadMbps >= 25) return { tone: "high", label: "High Performance", title: "Your connection is ready for ambitious uploads.", body: "Ready for 4K 60fps & long-form video uploads without delay.", icon: CheckCircle2 } as const;
  if (uploadMbps >= 10) return { tone: "good", label: "Good Performance", title: "A solid setup for a consistent creator workflow.", body: "Ideal for 1080p HD uploads and YouTube Shorts.", icon: CircleGauge } as const;
  return { tone: "low", label: "Low Upload Speed", title: "Plan extra time for larger video files.", body: "Slow upload speeds detected. Expect delays on large 4K files.", icon: TimerReset } as const;
}

function healthTone(value: number | null, good: number, ready: number, inverse = false): HealthTone {
  if (value === null) return "waiting";
  if (inverse) return value <= ready ? "ready" : value <= good ? "good" : "watch";
  return value >= ready ? "ready" : value >= good ? "good" : "watch";
}

function healthCopy(tone: HealthTone) {
  if (tone === "ready") return "Ready";
  if (tone === "good") return "Good";
  if (tone === "watch") return "Watch";
  return "—";
}

function getHealthItems(result: NetworkResult | null, state: TestState): HealthItem[] {
  const isFinished = state === "complete" || state === "error";
  const browsing = healthTone(result?.latencyMs ?? null, 150, 60, true);
  const gaming = healthTone(result?.latencyMs ?? null, 80, 30, true);
  const streaming = healthTone(result?.downloadMbps ?? null, 10, 25);
  const uploads = healthTone(result?.uploadMbps ?? null, 10, 25);
  return [
    { label: "Browsing", tone: browsing, detail: result ? healthCopy(browsing) : isFinished ? "Retry" : "Waiting" },
    { label: "Gaming", tone: gaming, detail: result ? healthCopy(gaming) : isFinished ? "Retry" : "Waiting" },
    { label: "Video Streaming", tone: streaming, detail: result ? healthCopy(streaming) : isFinished ? "Retry" : "Waiting" },
    { label: "Video Uploads", tone: uploads, detail: result ? healthCopy(uploads) : isFinished ? "Retry" : "Waiting" },
  ];
}

function gaugeAngle(value: number) {
  // The SVG needle starts horizontal-left at 0 Mbps and sweeps to horizontal-right at 1000 Mbps.
  return -90 + Math.min(Math.max(value, 0), 1000) / 1000 * 180;
}

export default function SpeedTest() {
  const [testState, setTestState] = useState<TestState>("idle");
  const [testStep, setTestStep] = useState("Ready when you are");
  const [progress, setProgress] = useState(0);
  const [gaugeReading, setGaugeReading] = useState(0);
  const [gaugeLabel, setGaugeLabel] = useState("Mbps");
  const [livePing, setLivePing] = useState<number | null>(null);
  const [liveDownload, setLiveDownload] = useState<number | null>(null);
  const [liveUpload, setLiveUpload] = useState<number | null>(null);
  const [result, setResult] = useState<NetworkResult | null>(null);
  const [networkDetails, setNetworkDetails] = useState<NetworkDetails | null>(null);
  const [error, setError] = useState("");
  const [presetId, setPresetId] = useState("1080p");
  const [customSize, setCustomSize] = useState("1.5");
  const [customUnit, setCustomUnit] = useState<"MB" | "GB">("GB");
  const isMounted = useRef(true);

  const selectedPreset = VIDEO_PRESETS.find(preset => preset.id === presetId) ?? VIDEO_PRESETS[1]!;
  const fileSize = presetId === "custom" ? Number(customSize) : selectedPreset.size;
  const fileUnit = presetId === "custom" ? customUnit : selectedPreset.unit;
  const fileSizeMb = Number.isFinite(fileSize) && fileSize > 0 ? sizeInMegabytes(fileSize, fileUnit) : 0;
  const uploadSeconds = result && fileSizeMb > 0 ? (fileSizeMb * 8) / result.uploadMbps : 0;
  const recommendation = useMemo(() => getRecommendation(result?.uploadMbps ?? null), [result?.uploadMbps]);
  const RecommendationIcon = recommendation.icon;
  const healthItems = getHealthItems(result, testState);
  const gaugeProgress = Math.min(Math.max(gaugeReading, 0), 1000) / 1000;
  const gaugeOffset = 408 * (1 - gaugeProgress);
  const gaugeNeedleAngle = gaugeAngle(gaugeReading);

  async function handleStartTest() {
    if (testState === "ping" || testState === "download" || testState === "upload") return;
    setTestState("ping");
    setTestStep("Phase 1/3 · Ping & jitter test");
    setProgress(4);
    setGaugeReading(0);
    setGaugeLabel("ms");
    setLivePing(null);
    setLiveDownload(null);
    setLiveUpload(null);
    setResult(null);
    setNetworkDetails(null);
    setError("");
    try {
      const pingSamples: number[] = [];
      for (let index = 0; index < 3; index += 1) {
        const startedAt = performance.now();
        const response = await fetchWithTimeout(withCacheBust("/__down?bytes=0"));
        if (!response.ok) throw new Error("Ping sample failed");
        const ping = Math.max(1, performance.now() - startedAt);
        pingSamples.push(ping);
        const average = pingSamples.reduce((sum, sample) => sum + sample, 0) / pingSamples.length;
        if (isMounted.current) {
          setLivePing(average);
          setGaugeReading(Math.min(average, 1000));
          setGaugeLabel("ms");
          setProgress(8 + index * 7);
        }
        await sleep(820);
      }
      const latencyMs = pingSamples.reduce((sum, sample) => sum + sample, 0) / pingSamples.length;
      const jitterMs = Math.max(...pingSamples) - Math.min(...pingSamples);

      if (isMounted.current) {
        setTestState("download");
        setTestStep("Phase 2/3 · Sampling download speed");
        setGaugeReading(0);
        setGaugeLabel("Mbps");
        setProgress(27);
      }
      const downloadSamples: number[] = [];
      for (let index = 0; index < 3; index += 1) {
        const sample = await fetchSpeedSample("download", 1_000_000 + index * 500_000);
        downloadSamples.push(sample);
        const average = downloadSamples.reduce((sum, value) => sum + value, 0) / downloadSamples.length;
        if (isMounted.current) {
          setLiveDownload(average);
          setGaugeReading(average);
          setGaugeLabel("Mbps");
          setProgress(34 + index * 14);
        }
        await sleep(1_450);
      }
      const downloadMbps = downloadSamples.reduce((sum, sample) => sum + sample, 0) / downloadSamples.length;

      if (isMounted.current) {
        setTestState("upload");
        setTestStep("Phase 3/3 · Testing YouTube upload readiness");
        setGaugeReading(0);
        setGaugeLabel("Mbps");
        setProgress(72);
      }
      const uploadSamples: number[] = [];
      for (let index = 0; index < 3; index += 1) {
        const sample = await fetchSpeedSample("upload", 700_000 + index * 150_000);
        uploadSamples.push(sample);
        const average = uploadSamples.reduce((sum, value) => sum + value, 0) / uploadSamples.length;
        if (isMounted.current) {
          setLiveUpload(average);
          setGaugeReading(average);
          setGaugeLabel("Mbps");
          setProgress(78 + index * 7);
        }
        await sleep(1_650);
      }
      const uploadMbps = uploadSamples.reduce((sum, sample) => sum + sample, 0) / uploadSamples.length;
      const nextResult = { uploadMbps, downloadMbps, latencyMs, jitterMs };
      if (isMounted.current) {
        setResult(nextResult);
        setTestState("complete");
        setTestStep("Test complete · Ready for your next upload");
        setProgress(100);
        setGaugeReading(uploadMbps);
        setGaugeLabel("Mbps");
        detectNetworkDetails().then(details => { if (isMounted.current) setNetworkDetails(details); }).catch(() => undefined);
      }
    } catch (testError) {
      console.error(testError);
      if (isMounted.current) {
        setTestState("error");
        setTestStep("Test could not finish");
        setError("The test endpoint could not be reached. Check your connection and try again.");
      }
    }
  }

  const isMeasuring = testState === "ping" || testState === "download" || testState === "upload";
  const buttonLabel = isMeasuring ? "Testing connection…" : testState === "complete" ? "Run Test Again" : "Start Speed Test";

  return (
    <SiteShell>
      <div className="speed-test-page">
        <section className="speed-test-live-section">
          <div className="content-container speed-test-live-container">
            <a href="/" className="speed-test-back-link"><ArrowLeft size={15} /> Back to TubeTranscriber</a>
            <div className="speed-test-live-topline"><div><p className="speed-test-live-kicker"><MonitorUp size={14} /> Creator network toolkit</p><h1>YouTube Upload Speed Test <span>&amp; Time Estimator</span></h1></div><span className="speed-test-live-badge"><RadioTower size={14} /> Live browser test</span></div>
            <div className="speed-results-summary" aria-live="polite">
              <article className="speed-summary-metric speed-summary-ping"><Zap size={18} /><div><span>Ping / Latency</span><strong>{livePing === null ? "—" : Math.round(livePing)}<small> ms</small></strong></div></article>
              <article className="speed-summary-metric"><ArrowDownToLine size={18} /><div><span>Download Speed</span><strong>{liveDownload === null ? "0.00" : formatMbps(liveDownload)}<small> Mbps</small></strong></div></article>
              <article className="speed-summary-metric speed-summary-upload"><ArrowUpFromLine size={18} /><div><span>Upload Speed</span><strong>{liveUpload === null ? "0.00" : formatMbps(liveUpload)}<small> Mbps</small></strong></div></article>
            </div>
            <div className="speed-health-row" aria-label="Connection health indicators">{healthItems.map(item => <div key={item.label} className={`speed-health-item speed-health-${item.tone}`}><span className="speed-health-dot" /><span>{item.label}</span><strong>{item.detail}</strong></div>)}</div>

            <div className="speed-gauge-layout">
              <div className="speed-gauge-copy"><p className="speed-test-live-kicker"><Signal size={14} /> {testStep}</p><p>Measure the connection you rely on to publish, then turn your upload speed into a realistic YouTube delivery timeline.</p><button type="button" className="speed-gauge-button" onClick={handleStartTest} disabled={isMeasuring}>{isMeasuring ? <LoaderCircle size={17} className="speed-test-spin" /> : <Play size={17} fill="currentColor" />}{buttonLabel}</button><div className="speed-progress-line"><span style={{ width: `${progress}%` }} /></div><small>{isMeasuring ? "Sampling your connection progressively across three phases." : "Only a small technical test payload is sent; your video file is never uploaded."}</small>{error && <p className="speed-test-error" role="alert">{error}</p>}</div>
              <div className="speed-gauge-wrap" aria-label={`${gaugeLabel} live speed gauge`}>
                <svg className="speed-gauge-svg" viewBox="0 0 360 270" role="img" aria-label="Speedometer from 0 to 1000 Mbps">
                  <defs><linearGradient id="speed-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#22d3ee" /><stop offset="52%" stopColor="#34d399" /><stop offset="100%" stopColor="#a3e635" /></linearGradient></defs>
                  <path className="speed-gauge-track" d="M 50 205 A 130 130 0 0 1 310 205" pathLength="408" />
                  <path className="speed-gauge-progress" d="M 50 205 A 130 130 0 0 1 310 205" pathLength="408" strokeDasharray="408" strokeDashoffset={gaugeOffset} />
                  <g className="speed-gauge-needle" style={{ transform: `rotate(${gaugeNeedleAngle}deg)`, transformOrigin: "180px 205px", transition: "transform 150ms ease-out" }}><line x1="180" y1="205" x2="180" y2="90" /><circle cx="180" cy="205" r="8" /></g>
                  {["0", "5", "10", "50", "100", "250", "500", "750", "1000"].map((label, index) => <text key={label} x={index < 4 ? 48 + index * 29 : index > 4 ? 312 - (8 - index) * 29 : 180} y={index === 0 || index === 8 ? 224 : index < 4 ? 178 - index * 22 : index > 4 ? 178 - (8 - index) * 22 : 66} className="speed-gauge-scale">{label}</text>)}
                </svg>
                <div className="speed-gauge-reading"><strong>{gaugeReading === 0 ? "0.00" : formatMbps(gaugeReading)}</strong><span>{gaugeLabel}</span></div>
              </div>
            </div>
            <div className="speed-network-footer"><div><Globe2 size={16} /><span>Public IP<strong>{networkDetails?.ip ?? "Detecting after test"}</strong></span></div><div><Server size={16} /><span>ISP / network<strong>{networkDetails?.isp ?? "Detecting after test"}</strong></span></div><div><MapPin size={16} /><span>Estimated location<strong>{networkDetails?.city ?? "Nearest edge"}</strong></span></div><div><RadioTower size={16} /><span>Test server<strong>{networkDetails?.server ?? "Cloudflare edge"}</strong></span></div></div>
          </div>
        </section>

        <section className="speed-test-results content-container" aria-labelledby="results-heading">
          <div className="section-heading speed-test-section-heading"><div><p className="eyebrow"><Activity size={14} /> Network snapshot</p><h2 id="results-heading">Know your publishing pace.</h2></div><p className="section-answer">Your upload result is the primary signal for creator workflows. Download speed and latency complete the picture for uploading assets, managing a channel, and working in cloud tools.</p></div>
          <div className="speed-metrics-grid" aria-live="polite"><article className="speed-metric-card speed-metric-primary"><div className="speed-metric-icon"><ArrowUpFromLine size={20} /></div><span className="speed-metric-label">Upload Speed</span><strong>{result ? formatMbps(result.uploadMbps) : "—"}<small> Mbps</small></strong><p>{result ? `Jitter ${Math.round(result.jitterMs)} ms · Primary creator metric` : "Start the test to measure"}</p></article><article className="speed-metric-card"><div className="speed-metric-icon"><ArrowDownToLine size={20} /></div><span className="speed-metric-label">Download Speed</span><strong>{result ? formatMbps(result.downloadMbps) : "—"}<small> Mbps</small></strong><p>{result ? "Useful for source footage and assets" : "Waiting for a measurement"}</p></article><article className="speed-metric-card"><div className="speed-metric-icon"><Network size={20} /></div><span className="speed-metric-label">Latency / Ping</span><strong>{result ? Math.round(result.latencyMs) : "—"}<small> ms</small></strong><p>{result ? "Lower is better for live workflows" : "Waiting for a measurement"}</p></article></div>
          <div className={`creator-recommendation creator-recommendation-${recommendation.tone}`}><div className="creator-recommendation-icon"><RecommendationIcon size={21} /></div><div><span className="recommendation-badge">{recommendation.label}</span><h3>{recommendation.title}</h3><p>{recommendation.body}</p></div></div>
        </section>

        <section className="upload-estimator-section" aria-labelledby="estimator-heading"><div className="content-container upload-estimator-layout"><div className="upload-estimator-copy"><p className="eyebrow"><Clock3 size={14} /> YouTube upload planner</p><h2 id="estimator-heading">How long will your video take to upload?</h2><p>Choose a common creator format or enter the approximate size of your exported file. The estimate uses your measured upload speed and treats 1 GB as 1,024 MB.</p><div className="upload-estimator-note"><CircleGauge size={17} /><span><strong>Estimate, not a promise.</strong> Wi-Fi congestion, YouTube processing, and ISP traffic can add time after the transfer begins.</span></div></div><div className="upload-calculator"><div className="upload-calculator-heading"><div><span className="panel-label">Video file</span><h3>Pick a format</h3></div><span className="calculator-value">{fileSizeMb > 0 ? `${fileSizeMb.toLocaleString()} MB` : "Enter a size"}</span></div><label className="speed-field-label" htmlFor="video-preset">Typical video format</label><select id="video-preset" value={presetId} onChange={event => setPresetId(event.target.value)}>{VIDEO_PRESETS.map(preset => <option key={preset.id} value={preset.id}>{preset.label}{preset.id !== "custom" ? ` · ${preset.size} ${preset.unit}` : ""}</option>)}</select>{presetId === "custom" && <div className="custom-size-fields"><label className="speed-field-label" htmlFor="custom-size">File size</label><div className="custom-size-row"><input id="custom-size" type="number" min="0.01" step="0.01" value={customSize} onChange={event => setCustomSize(event.target.value)} aria-label="Custom video file size" /><select value={customUnit} onChange={event => setCustomUnit(event.target.value as "MB" | "GB")} aria-label="Custom file size unit"><option value="GB">GB</option><option value="MB">MB</option></select></div></div>}<div className="calculator-result"><span><TimerReset size={17} /> Estimated upload time</span><strong>{result && fileSizeMb > 0 ? formatDuration(uploadSeconds) : "Run the test to estimate"}</strong><small>{result && fileSizeMb > 0 ? `At ${formatMbps(result.uploadMbps)} Mbps upload speed` : "Your result will appear here"}</small></div></div></div></section>

        <section className="creator-tips-section content-container" aria-labelledby="tips-heading"><div className="section-heading"><p className="eyebrow"><Lightbulb size={14} /> Creator playbook</p><h2 id="tips-heading">Make slow uploads less painful.</h2><p className="section-answer">A few export and network choices can make your next YouTube upload more predictable, especially when you are working with long-form or high-resolution footage.</p></div><div className="creator-tips-grid"><article className="creator-tip-card"><span>01</span><h3>Export for the platform</h3><p>Use H.264 or HEVC codecs with recommended YouTube bitrates before exporting.</p></article><article className="creator-tip-card"><span>02</span><h3>Prefer a wired connection</h3><p>Connect via Ethernet instead of Wi-Fi to eliminate upload packet loss.</p></article><article className="creator-tip-card"><span>03</span><h3>Choose a calmer window</h3><p>Upload during off-peak network hours to avoid ISP throttling.</p></article></div></section>
      </div>
    </SiteShell>
  );
}
