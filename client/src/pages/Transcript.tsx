import SiteShell from "@/components/SiteShell";
import TurnstileWidget, { getTurnstileToken, onTurnstileToken, resetTurnstileWidget, startWhenTurnstileTokenAvailable } from "@/components/TurnstileWidget";
import YouTubeTranscriptPlayer from "@/components/YouTubeTranscriptPlayer";
import { trpc } from "@/lib/trpc";
import { saveLocalHistoryEntry } from "@/lib/localHistory";
import { groupTranscript, plainTranscript, timestamp, toMarkdown, toSrt, toTxt, toVtt, type TranscriptGroup } from "@shared/transcript";
import { AlertCircle, ArrowRight, Check, ChevronDown, ChevronLeft, Clipboard, Download, ExternalLink, FileJson, FileText, Link2, Loader2, RotateCcw, Search, Subtitles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";

function download(filename: string, contents: string, type: string) {
  const link = document.createElement("a");
  const objectUrl = URL.createObjectURL(new Blob([contents], { type }));
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

async function copyTranscript(contents: string) {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(contents); return; }
  } catch {
    // Browsers that deny Clipboard API access fall through to the compatible path.
  }
  const textarea = document.createElement("textarea");
  textarea.value = contents;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Copy command was not accepted by this browser.");
}

function highlight(text: string, term: string) {
  if (!term.trim()) return text;
  const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return <>{parts.map((part, index) => part.toLowerCase() === term.toLowerCase() ? <mark key={index}>{part}</mark> : part)}</>;
}

function TranscriptLoading({ browserFallbackPending = false }: { browserFallbackPending?: boolean }) {
  return <section className="loading-page content-container" aria-live="polite" aria-busy="true">
    <div className="loading-spinner" aria-hidden="true"><Loader2 size={34} /></div>
    <p className="eyebrow">{browserFallbackPending ? "Browser caption check" : "Transcript in progress"}</p>
    <h1>Loading transcript...</h1>
    <p>Getting YouTube captions ready...</p>
    <div className="loading-progress" role="progressbar" aria-label="Transcript retrieval in progress"><span /></div>
    <p className="loading-moment">This may take a moment<span className="loading-dots" aria-hidden="true"><i /><i /><i /></span></p>
    <div className="loading-steps" aria-hidden="true"><span className={!browserFallbackPending ? "is-active" : "is-complete"}>Connect</span><span className={!browserFallbackPending ? "is-active" : "is-complete"}>Read captions</span><span className={browserFallbackPending ? "is-active" : ""}>Format transcript</span></div>
    <div className="transcript-loading-turnstile"><TurnstileWidget /></div>
  </section>;
}

function friendlyTranscriptError(error: string) {
  const normalized = error.toLowerCase();
  if (normalized.includes("security") || normalized.includes("turnstile") || normalized.includes("verification") || normalized.includes("forbidden")) {
    return "Please complete the security check, then try again with the same link.";
  }
  if (normalized.includes("no public captions") || normalized.includes("no captions") || normalized.includes("caption") && normalized.includes("available")) {
    return "This video does not appear to provide public captions. Try a public video with captions enabled.";
  }
  if (normalized.includes("private") || normalized.includes("unavailable") || normalized.includes("age restricted") || normalized.includes("unplayable")) {
    return "This video may be private, restricted, or unavailable. Check the YouTube link and visibility settings.";
  }
  if (normalized.includes("too many") || normalized.includes("rate limit")) {
    return "Too many requests arrived in a short time. Please wait a moment and try again.";
  }
  if (normalized.includes("timed out") || normalized.includes("timeout")) {
    return "The connection took too long to respond. Your link is saved, so please try again.";
  }
  return "The transcript service could not complete this request. Your link is saved, so please try again.";
}

export default function Transcript() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const sourceUrl = useMemo(() => new URLSearchParams(search).get("url") ?? "", [search]);
  const lookup = trpc.transcript.lookup.useMutation();
  const [renderFallbackError, setRenderFallbackError] = useState("");
  const [query, setQuery] = useState("");
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [formatsOpen, setFormatsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nextUrl, setNextUrl] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [hasHydrated, setHasHydrated] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const previousSourceUrl = useRef("");
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const transcriptResultRef = useRef<HTMLDivElement>(null);
  const scrolledVideoIdRef = useRef("");
  useEffect(() => { setHasHydrated(true); }, []);
  useEffect(() => {
    if (!sourceUrl) return;
    if (previousSourceUrl.current !== sourceUrl) {
      previousSourceUrl.current = sourceUrl;
      scrolledVideoIdRef.current = "";
    }
    let cancelled = false;
    lookup.reset();
    setRenderFallbackError("");

    const runAttempt = async () => {
      try {
        await lookup.mutateAsync({ url: sourceUrl });
      } catch (error) {
        if (!cancelled) setRenderFallbackError(error instanceof Error ? error.message : "The transcript service could not retrieve this video.");
      } finally {
        resetTurnstileWidget();
      }
    };

    const stopWaiting = startWhenTurnstileTokenAvailable(
      getTurnstileToken,
      onTurnstileToken,
      () => { void runAttempt(); },
    );
    return () => { cancelled = true; stopWaiting(); };
  }, [sourceUrl, retryNonce]);
  const retrySameVideo = () => {
    scrolledVideoIdRef.current = "";
    setActionNotice("");
    setRenderFallbackError("");
    setRetryNonce(value => value + 1);
  };
  const data = lookup.data;
  useEffect(() => {
    const videoId = data?.metadata.videoId;
    if (!videoId || scrolledVideoIdRef.current === videoId) return;
    scrolledVideoIdRef.current = videoId;
    const frame = window.requestAnimationFrame(() => {
      const target = window.matchMedia("(max-width: 760px)").matches ? transcriptResultRef.current : videoSectionRef.current;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [data]);
  const effectiveError = data ? "" : (renderFallbackError || lookup.error?.message || "");
  const friendlyError = friendlyTranscriptError(effectiveError);
  const transcriptText = data ? plainTranscript(data.segments) : "";
  const originalLanguage = data?.originalLanguage;
  const hasSearchMatch = !query.trim() || transcriptText.toLowerCase().includes(query.toLowerCase());
  const filename = (data?.metadata.title || "tubetranscript").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "transcript";
  const announce = (message: string) => { setActionNotice(message); window.setTimeout(() => setActionNotice(""), 2600); };
  const copy = async () => { if (!data) return; try { await copyTranscript(plainTranscript(data.segments)); setCopied(true); announce("Transcript copied to your clipboard."); window.setTimeout(() => setCopied(false), 1800); } catch { announce("Copy is not supported here. Please select the transcript text and copy it manually."); } };
  const startAnother = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const value = nextUrl.trim(); if (!value) { announce("Paste a YouTube link to generate another transcript."); return; } navigate(`/transcript?url=${encodeURIComponent(value)}`); };
  const exportTranscript = (format: "Plain text" | "JSON" | "SRT" | "VTT" | "Markdown", extension: "txt" | "json" | "srt" | "vtt" | "md", contents: string, mimeType: string) => { download(`${filename}.${extension}`, contents, mimeType); announce(`${format} download started.`); };
  useEffect(() => {
    if (!data) return;
    saveLocalHistoryEntry({ videoId: data.metadata.videoId, title: data.metadata.title, channel: data.metadata.channel, thumbnailUrl: data.metadata.thumbnailUrl });
  }, [data]);

  if (!hasHydrated) return <SiteShell><TranscriptLoading /></SiteShell>;
  if (!sourceUrl) return <SiteShell><section className="page-empty content-container"><Subtitles size={36} /><h1>No video link yet.</h1><p>Return home and paste a YouTube link to begin.</p><Link href="/" className="primary-button">Go to home</Link></section></SiteShell>;
  if (lookup.isPending || (!data && !effectiveError)) return <SiteShell><TranscriptLoading /></SiteShell>;
  if (effectiveError || !data) return <SiteShell><section className="transcript-error-page content-container" aria-live="polite"><div className="error-illustration" aria-hidden="true"><AlertCircle size={34} /></div><p className="eyebrow">Captions unavailable</p><h1>Couldn't load captions</h1><p className="error-lead">{friendlyError}</p><div className="transcript-error-turnstile"><TurnstileWidget /></div>{actionNotice && <p className="reader-action-notice" role="status">{actionNotice}</p>}<div className="error-actions"><button className="primary-button" onClick={retrySameVideo}><RotateCcw size={17} /> Try again</button><button className="secondary-button" onClick={() => navigate("/")}>Clear video</button></div><p className="error-tip">Tip: Make sure the video is public, captions are enabled, and the URL is correct.</p></section></SiteShell>;
  return <SiteShell><section className="transcript-page content-container"><Link href="/" className="back-link"><ChevronLeft size={16} /> New extraction</Link><form className="inline-extract-form" onSubmit={startAnother}><label><Link2 size={17} /><input value={nextUrl} onChange={event => setNextUrl(event.target.value)} placeholder="Paste another YouTube link to generate a new transcript" aria-label="YouTube link for another transcript" /></label><button type="submit">Generate transcript <ArrowRight size={16} /></button></form><div className="transcript-turnstile"><TurnstileWidget /></div><p className="reader-action-notice" role="status" aria-live="polite">{actionNotice}</p><div className="video-summary"><img src={data.metadata.thumbnailUrl} alt={`YouTube video thumbnail for ${data.metadata.title}`} /><div><p className="eyebrow">{data.metadata.channel}</p><h1>{data.metadata.title}</h1><div className="video-meta"><span>{originalLanguage?.name || "Original language"} transcript</span><a href={`https://www.youtube.com/watch?v=${data.metadata.videoId}`} target="_blank" rel="noreferrer">Open in YouTube <ExternalLink size={13} /></a></div></div></div><div ref={videoSectionRef} className="synced-video-section"><div className="synced-video-copy"><p className="panel-label">Read along with the video</p><p>Follow the transcript as the video plays, or select any line to jump to that moment.</p></div><YouTubeTranscriptPlayer videoId={data.metadata.videoId} /></div><div ref={transcriptResultRef} className="transcript-layout"><aside className="export-panel"><p className="panel-label">Transcript tools</p><button type="button" className="copy-button" onClick={copy} aria-pressed={copied}><span className="action-icon">{copied ? <Check size={17} /> : <Clipboard size={17} />}</span><span className="export-label">{copied ? "Copied to clipboard" : "Copy all text"}</span></button><div className="export-divider" /><div className="format-download-section"><button type="button" className="format-toggle" aria-expanded={formatsOpen} onClick={() => setFormatsOpen(value => !value)}><span><Download size={16} /> Download format</span><ChevronDown size={16} aria-hidden="true" /></button><div className={`format-download-list${formatsOpen ? " is-open" : ""}`}><p className="panel-label">Download format</p><label className="timestamp-toggle"><input type="checkbox" checked={includeTimestamps} onChange={event => setIncludeTimestamps(event.target.checked)} /> Include timestamps in TXT</label><button type="button" onClick={() => exportTranscript("Plain text", "txt", includeTimestamps ? toTxt(data.segments) : transcriptText, "text/plain;charset=utf-8")}><FileText size={16} /><span className="export-label">Plain text</span><Download size={15} /></button><button type="button" onClick={() => exportTranscript("JSON", "json", JSON.stringify({ video: data.metadata, transcript: data.segments }, null, 2), "application/json")}><FileJson size={16} /><span className="export-label">JSON data</span><Download size={15} /></button><button type="button" onClick={() => exportTranscript("SRT", "srt", toSrt(data.segments), "text/plain;charset=utf-8")}><Subtitles size={16} /><span className="export-label">SRT subtitles</span><Download size={15} /></button><button type="button" onClick={() => exportTranscript("VTT", "vtt", toVtt(data.segments), "text/vtt;charset=utf-8")}><Subtitles size={16} /><span className="export-label">VTT captions</span><Download size={15} /></button><button type="button" onClick={() => exportTranscript("Markdown", "md", includeTimestamps ? toMarkdown(data.metadata, data.segments) : `# ${data.metadata.title}\n\n_Source: ${data.metadata.channel}_\n\n${transcriptText}\n`, "text/markdown;charset=utf-8")}><FileText size={16} /><span className="export-label">Markdown</span><Download size={15} /></button></div></div><p className="copyright-note">Only download material you have the right to use. Respect the original creator and copyright.</p></aside><article className="reader-card"><div className="reader-header"><div><p className="panel-label">Full transcript</p><h2>Read the complete text</h2></div><label className="search-field"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search transcript" aria-label="Search transcript" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}</label></div><div className="reader-content">{hasSearchMatch ? <p className="plain-transcript">{highlight(transcriptText, query)}</p> : <div className="no-matches"><Search size={24} /><h3>No matching words</h3><p>Try a different phrase or clear the search.</p></div>}</div></article></div></section></SiteShell>;
}
