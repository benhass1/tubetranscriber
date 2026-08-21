import SiteShell from "@/components/SiteShell";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Clock3, ExternalLink, History as HistoryIcon, Loader2, Trash2 } from "lucide-react";
import { Link } from "wouter";

export default function History() {
  const { isAuthenticated, loading } = useAuth();
  const entries = trpc.history.list.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const remove = trpc.history.remove.useMutation({ onSuccess: () => utils.history.list.invalidate() });
  const clear = trpc.history.clear.useMutation({ onSuccess: () => utils.history.list.invalidate() });
  if (loading) return <SiteShell><section className="loading-page content-container"><div className="loading-orbit"><Loader2 size={28} /></div><p>Checking your library…</p></section></SiteShell>;
  if (!isAuthenticated) return <SiteShell><section className="page-empty content-container"><HistoryIcon size={36} /><p className="eyebrow">Your personal library</p><h1>Sign in to keep your transcripts close.</h1><p>Every completed lookup is saved to your account, so you can return to it without starting from scratch.</p><button className="primary-button" onClick={() => startLogin()}>Sign in with Manus</button></section></SiteShell>;
  return <SiteShell><section className="history-page content-container"><div className="page-title-row"><div><p className="eyebrow">Personal library</p><h1>Transcript history</h1><p>Recent videos you have extracted, available only to your account.</p></div>{entries.data && entries.data.length > 0 && <button className="quiet-danger" onClick={() => clear.mutate()}>Clear history</button>}</div>{entries.isLoading ? <div className="history-loading"><Loader2 size={23} /> Loading your history</div> : entries.data?.length ? <div className="history-list">{entries.data.map(entry => <article className="history-item" key={entry.id}><img src={entry.thumbnailUrl} alt="" /><div className="history-details"><p className="eyebrow">{entry.channel}</p><h2>{entry.title}</h2><p><Clock3 size={14} /> Last opened {new Date(entry.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p></div><div className="history-actions"><Link href={`/transcript?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${entry.videoId}`)}`}><ExternalLink size={15} /> Re-open</Link><button onClick={() => remove.mutate({ id: entry.id })} aria-label={`Remove ${entry.title}`}><Trash2 size={16} /></button></div></article>)}</div> : <div className="history-empty"><HistoryIcon size={32} /><h2>Your history is ready when you are.</h2><p>Extract a transcript and it will appear here for easy re-opening.</p><Link href="/" className="primary-button">Extract a transcript</Link></div>}</section></SiteShell>;
}
