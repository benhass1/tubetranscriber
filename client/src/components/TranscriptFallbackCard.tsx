import {
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  ChevronLeft,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  Subtitles,
  Chrome,
} from "lucide-react";

interface TranscriptFallbackCardProps {
  error?: string;
  onRetry?: () => void;
  onClear?: () => void;
  extensionUrl?: string;
}

const EXTENSION_STORE_URL =
  "https://chromewebstore.google.com/detail/tubetranscriber/placeholder";

const features = [
  {
    title: "100% Free Forever",
    description: "Transcripts, subtitles, and downloads cost zero dollars.",
  },
  {
    title: "Never Blocked",
    description: "Runs directly inside your active browser session, completely bypassing server IP bans.",
  },
  {
    title: "Age-Restricted & Private Access",
    description: "Easily extract captions from 18+, member-only, private, or unlisted videos.",
  },
  {
    title: "Chrome Built-in AI Summaries",
    description:
      "Generates local bullet points and action items using Chrome's native window.ai (Gemini Nano).",
  },
  {
    title: "Automatic Filler Word Stripper",
    description: 'Removes "um", "uh", "you know", and duplicate words in a single click.',
  },
  {
    title: "Multi-Format Export & App Triggers",
    description:
      "Download as TXT, SRT, VTT, Markdown, or export directly into Notion & Obsidian.",
  },
  {
    title: "In-Page Search & Sync",
    description: "Search keywords and auto-scroll transcript live as the video plays.",
  },
];

export default function TranscriptFallbackCard({
  error,
  onRetry,
  onClear,
  extensionUrl = EXTENSION_STORE_URL,
}: TranscriptFallbackCardProps) {
  return (
    <div className="w-full max-w-3xl mx-auto my-6 sm:my-10 px-4">
      {/* Elevated Card Container styled to match TubeTranscriber's brand theme */}
      <div className="rounded-2xl border border-[#dce6f5] dark:border-[#2b3b56] bg-white dark:bg-[#172033] shadow-[0_12px_35px_rgba(37,99,235,0.08)] dark:shadow-none p-6 sm:p-9 text-[#14213d] dark:text-[#f8fbff]">
        
        {/* Error Notice Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-amber-200/90 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="truncate">
                <span className="font-bold mr-1.5">Remote Web Extraction Blocked:</span>
                <span className="text-amber-800 dark:text-amber-300">{error}</span>
              </div>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="shrink-0 inline-flex items-center gap-1 font-bold px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white/80 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 hover:bg-white dark:hover:bg-amber-900/60 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retry
              </button>
            )}
          </div>
        )}

        {/* Header matching TubeTranscriber Landing Page typography */}
        <div className="text-center mb-6">
          <p className="eyebrow justify-center mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#2563eb] dark:text-[#60a5fa]" /> Zero-API Browser Extension
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#14213d] dark:text-white mb-3">
            Want a Solution That{" "}
            <span className="text-[#2563eb] dark:text-[#60a5fa]">Never Fails?</span>
          </h2>
          <p className="text-sm sm:text-base text-[#5e6b85] dark:text-[#b5c1d6] max-w-xl mx-auto leading-relaxed">
            Our Chrome Extension works natively inside your browser. Because YouTube sees you as a real viewer, it cannot block your transcript requests. Ever.
          </p>
        </div>

        {/* Extension Interactive Preview Area matching InteractiveDemo container */}
        <div className="rounded-xl border border-[#dce6f5] dark:border-[#2b3b56] mb-8 bg-[#f8fbff] dark:bg-[#0f1a2e] p-3 sm:p-4 shadow-sm">
          {/* Mockup Window */}
          <div className="rounded-lg bg-white dark:bg-[#172033] border border-[#dce6f5] dark:border-[#2b3b56] shadow-sm overflow-hidden text-xs">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#dce6f5] dark:border-[#2b3b56] bg-slate-50/80 dark:bg-[#16243b]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                <span className="ml-2 font-mono text-[11px] text-[#5e6b85] dark:text-[#94a3b8]">
                  youtube.com/watch?v=...
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2563eb] dark:text-[#60a5fa] bg-[#eff6ff] dark:bg-[#1e293b] px-2.5 py-0.5 rounded-full border border-[#bfdbfe] dark:border-[#3b82f6]/40">
                <Zap className="w-3 h-3 text-[#2563eb] dark:text-[#60a5fa]" /> Native In-Browser Session
              </span>
            </div>
            
            <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
              {/* Video player simulation */}
              <div className="sm:col-span-3 rounded-lg bg-slate-100/90 dark:bg-[#1e293b] p-3 flex flex-col justify-between border border-slate-200/60 dark:border-slate-800">
                <div>
                  <div className="h-3 w-2/3 bg-slate-300 dark:bg-slate-700 rounded mb-2.5" />
                  <div className="space-y-1.5">
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700/60 rounded" />
                    <div className="h-2 w-4/5 bg-slate-200 dark:bg-slate-700/60 rounded" />
                    <div className="h-2 w-3/5 bg-slate-200 dark:bg-slate-700/60 rounded" />
                  </div>
                </div>
                <div className="mt-4 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-[#5e6b85] dark:text-[#94a3b8]">
                  <span className="font-medium">Active Video Tab</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Bypasses Server IP Bans
                  </span>
                </div>
              </div>

              {/* Extension sidebar simulation */}
              <div className="sm:col-span-2 rounded-lg border border-[#bfdbfe] dark:border-[#2563eb]/40 bg-[#eff6ff]/70 dark:bg-[#1e293b] p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-[#2563eb] dark:text-[#60a5fa] mb-1 text-xs">
                    <Subtitles className="w-3.5 h-3.5" /> TubeTranscriber Sidebar
                  </div>
                  <p className="text-[11px] text-[#5e6b85] dark:text-[#cbd5e1] leading-relaxed">
                    Reads verified YouTube caption DOM directly in your browser. 1-click SRT, TXT, MD exports.
                  </p>
                </div>
                <div className="mt-3 text-[10px] font-bold text-[#2563eb] dark:text-[#60a5fa] flex items-center gap-1 bg-white/90 dark:bg-[#172033] px-2 py-1 rounded border border-[#bfdbfe] dark:border-[#2563eb]/30">
                  <Sparkles className="w-3 h-3" /> Built-in Gemini Nano Summaries
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Checklist styled with TubeTranscriber soft blue accents */}
        <div className="space-y-3.5 mb-8">
          {features.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-[#eff6ff] dark:bg-[#2563eb]/15 text-[#2563eb] dark:text-[#60a5fa] flex items-center justify-center shrink-0 mt-0.5 border border-[#dbeafe] dark:border-[#2563eb]/30">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <div className="text-sm leading-relaxed">
                <span className="font-bold text-[#14213d] dark:text-[#f8fbff] mr-1.5">
                  {item.title}
                </span>
                <span className="text-[#5e6b85] dark:text-[#b5c1d6]">
                  — {item.description}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Buttons styled exactly like TubeTranscriber primary button and secondary controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 mb-6">
          <a
            href={extensionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-extrabold text-sm sm:text-base shadow-[0_8px_20px_rgba(37,99,235,0.28)] hover:shadow-[0_10px_25px_rgba(37,99,235,0.38)] active:scale-[0.98] transition-all"
          >
            <Chrome className="w-4 h-4" />
            <span>Add to Chrome — It&apos;s Free</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </a>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-[#dce6f5] dark:border-[#2b3b56] bg-white dark:bg-[#172033] text-[#14213d] dark:text-[#f8fbff] font-bold text-sm hover:bg-[#f8fbff] dark:hover:bg-[#1e293b] active:scale-[0.98] transition-all"
            >
              <RotateCcw className="w-4 h-4 text-[#2563eb] dark:text-[#60a5fa]" />
              <span>Try Web Lookup Again</span>
            </button>
          )}

          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl text-[#5e6b85] dark:text-[#b5c1d6] hover:text-[#14213d] dark:hover:text-white text-sm font-semibold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          )}
        </div>

        {/* Lower Card Section: Why does this happen? */}
        <div className="border-t border-[#dce6f5] dark:border-[#2b3b56] pt-6 mt-6">
          <h3 className="text-sm sm:text-base font-bold text-[#14213d] dark:text-white flex items-center gap-2 mb-3">
            <span>ℹ️</span> Why does this happen?
          </h3>
          <div className="space-y-3 text-xs sm:text-sm text-[#5e6b85] dark:text-[#b5c1d6] leading-relaxed">
            <p>
              YouTube actively rate-limits and blocks external website servers from requesting transcripts remotely.
              This happens unpredictably—sometimes web lookups succeed immediately, and other times YouTube's anti-bot system drops them.
            </p>
            <p>
              When using any web-based tool, YouTube detects the request coming from a cloud server datacenter and restricts it, even when public captions are present on the video.
            </p>
            <div className="p-3 rounded-lg border-l-4 border-[#2563eb] bg-[#eff6ff]/70 dark:bg-[#1e293b] text-[#14213d] dark:text-[#f8fbff] font-medium">
              The Chrome Extension solves this completely. It operates locally inside your browser on YouTube.
              Because the request originates directly from your real viewing session, YouTube sees you as a normal viewer and cannot block it.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
