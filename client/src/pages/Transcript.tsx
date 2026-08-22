import SiteShell from "@/components/SiteShell";
import { trpc } from "@/lib/trpc";
import { saveLocalHistoryEntry } from "@/lib/localHistory";
import { groupTranscript, plainTranscript, timestamp, toSrt, toTxt, type TranscriptGroup } from "@shared/transcript";
import { ArrowRight, Check, ChevronLeft, Clipboard, Download, ExternalLink, FileJson, FileText, Link2, Loader2, Search, Subtitles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

export default function Transcript() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const sourceUrl = useMemo(() => new URLSearchParams(search).get("url") ?? "", [search]);
  const lookup = trpc.transcript.lookup.useMutation();
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [nextUrl, setNextUrl] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  useEffect(() => {
    if (!sourceUrl) return;
    lookup.reset();
    lookup.mutate({ url: sourceUrl });
  }, [sourceUrl]);
  const data = lookup.data;
  const transcriptText = data ? plainTranscript(data.segments) : "";
  const hasSearchMatch = !query.trim() || transcriptText.toLowerCase().includes(query.toLowerCase());
  const filename = (data?.metadata.title || "tubetranscript").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "transcript";
  const announce = (message: string) => { setActionNotice(message); window.setTimeout(() => setActionNotice(""), 2600); };
  const copy = async () => { if (!data) return; try { await copyTranscript(plainTranscript(data.segments)); setCopied(true); announce("Transcript copied to your clipboard."); window.setTimeout(() => setCopied(false), 1800); } catch { announce("Copy was unavailable. Please select the transcript text and copy it manually."); } };
  const startAnother = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const value = nextUrl.trim(); if (!value) { announce("Paste a YouTube link to generate another transcript."); return; } navigate(`/transcript?url=${encodeURIComponent(value)}`); };
  const exportTranscript = (format: "Plain text" | "JSON" | "SRT", extension: "txt" | "json" | "srt", contents: string, mimeType: string) => { download(`${filename}.${extension}`, contents, mimeType); announce(`${format} download started.`); };
  useEffect(() => {
    if (!data) return;
    saveLocalHistoryEntry({ videoId: data.metadata.videoId, title: data.metadata.title, channel: data.metadata.channel, thumbnailUrl: data.metadata.thumbnailUrl });
  }, [data]);

  if (!sourceUrl) return <SiteShell><section className="page-empty content-container"><Subtitles size={36} /><h1>No video link yet.</h1><p>Return home and paste a YouTube link to begin.</p><Link href="/" className="primary-button">Go to home</Link></section></SiteShell>;
  if (lookup.isPending || (!data && !lookup.error)) return <SiteShell><section className="loading-page content-container"><div className="loading-orbit"><Loader2 size={28} /></div><p className="eyebrow">Reading available captions</p><h1>Preparing your transcript.</h1><p>We are retrieving the video details and organizing its captions into a clean reading experience.</p></section></SiteShell>;
  if (lookup.error || !data) return <SiteShell><section className="page-empty content-container"><span className="error-mark"><X size={27} /></span><p className="eyebrow">Transcript unavailable</p><h1>We could not retrieve captions.</h1><p>{lookup.error?.message || "Please confirm the URL is public and try again."}</p><button className="primary-button" onClick={() => navigate("/")}>Try another link</button></section></SiteShell>;
  return <SiteShell><section className="transcript-page content-container"><Link href="/" className="back-link"><ChevronLeft size={16} /> New extraction</Link><form className="inline-extract-form" onSubmit={startAnother}><label><Link2 size={17} /><input value={nextUrl} onChange={event => setNextUrl(event.target.value)} placeholder="Paste another YouTube link to generate a new transcript" aria-label="YouTube link for another transcript" /></label><button type="submit">Generate transcript <ArrowRight size={16} /></button></form><p className="reader-action-notice" role="status" aria-live="polite">{actionNotice}</p><div className="video-summary"><img src={data.metadata.thumbnailUrl} alt={`YouTube video thumbnail for ${data.metadata.title}`} /><div><p className="eyebrow">{data.metadata.channel}</p><h1>{data.metadata.title}</h1><div className="video-meta"><span>Plain-text transcript</span><a href={`https://www.youtube.com/watch?v=${data.metadata.videoId}`} target="_blank" rel="noreferrer">Open in YouTube <ExternalLink size={13} /></a></div></div></div><div className="transcript-layout"><aside className="export-panel"><p className="panel-label">Transcript tools</p><button type="button" className="copy-button" onClick={copy} aria-pressed={copied}><span className="action-icon">{copied ? <Check size={17} /> : <Clipboard size={17} />}</span><span className="export-label">{copied ? "Copied to clipboard" : "Copy all text"}</span></button><div className="export-divider" /><p className="panel-label">Download format</p><button type="button" onClick={() => exportTranscript("Plain text", "txt", toTxt(data.segments), "text/plain;charset=utf-8")}><FileText size={16} /><span className="export-label">Plain text</span><Download size={15} /></button><button type="button" onClick={() => exportTranscript("JSON", "json", JSON.stringify({ video: data.metadata, transcript: data.segments }, null, 2), "application/json")}><FileJson size={16} /><span className="export-label">JSON data</span><Download size={15} /></button><button type="button" onClick={() => exportTranscript("SRT", "srt", toSrt(data.segments), "text/plain;charset=utf-8")}><Subtitles size={16} /><span className="export-label">SRT subtitles</span><Download size={15} /></button><p className="copyright-note">Only download material you have the right to use. Respect the original creator and copyright.</p></aside><article className="reader-card"><div className="reader-header"><div><p className="panel-label">Full transcript</p><h2>Read the complete text</h2></div><label className="search-field"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search transcript" aria-label="Search transcript" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}</label></div><div className="reader-content">{hasSearchMatch ? <p className="plain-transcript">{highlight(transcriptText, query)}</p> : <div className="no-matches"><Search size={24} /><h3>No matching words</h3><p>Try a different phrase or clear the search.</p></div>}</div></article></div></section></SiteShell>;
}
