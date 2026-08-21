import SiteShell from "@/components/SiteShell";
import { useLocalHistory } from "@/lib/localHistory";
import { Clock3, ExternalLink, History as HistoryIcon, Trash2 } from "lucide-react";
import { Link } from "wouter";

export default function History() {
  const { entries, remove, clear } = useLocalHistory();
  return <SiteShell><section className="history-page content-container"><div className="page-title-row"><div><p className="eyebrow">This browser only</p><h1>Transcript history</h1><p>Recently opened videos are stored privately in this browser, with no account required.</p></div>{entries.length > 0 && <button className="quiet-danger" onClick={clear}>Clear history</button>}</div>{entries.length ? <div className="history-list">{entries.map(entry => <article className="history-item" key={entry.videoId}><img src={entry.thumbnailUrl} alt="" /><div className="history-details"><p className="eyebrow">{entry.channel}</p><h2>{entry.title}</h2><p><Clock3 size={14} /> Last opened {new Date(entry.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p></div><div className="history-actions"><Link href={`/transcript?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${entry.videoId}`)}`}><ExternalLink size={15} /> Re-open</Link><button onClick={() => remove(entry.videoId)} aria-label={`Remove ${entry.title}`}><Trash2 size={16} /></button></div></article>)}</div> : <div className="history-empty"><HistoryIcon size={32} /><h2>Your local history is ready.</h2><p>Extract a transcript and it will appear here. Entries stay in this browser until you remove them.</p><Link href="/" className="primary-button">Extract a transcript</Link></div>}</section></SiteShell>;
}
