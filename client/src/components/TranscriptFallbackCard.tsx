import { CheckCircle2, RotateCcw, ArrowRight, ExternalLink, ChevronLeft, AlertCircle } from "lucide-react";
import { type ReactNode } from "react";

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
    description: "Transcripts and downloads cost zero dollars.",
  },
  {
    title: "Never Blocked",
    description: "Runs directly inside your browser session, bypassing server IP bans.",
  },
  {
    title: "Age-Restricted & Private Access",
    description: "Easily extract captions from 18+, private, or unlisted videos.",
  },
  {
    title: "Chrome Built-in AI Summaries",
    description:
      "Generates local bullet points and action items using Chrome's native window.ai (Gemini Nano).",
  },
  {
    title: "Automatic Filler Word Stripper",
    description: 'Removes "um", "uh", "you know", and duplicate words in 1 click.',
  },
  {
    title: "Multi-Format Export & App Triggers",
    description:
      "Download as .txt, .srt, .vtt, .md, or export directly to Obsidian & Notion (obsidian://).",
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
    <div className="w-full max-w-2xl mx-auto my-6 sm:my-10 px-4">
      {/* Elevated Card Container */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-6 sm:p-8 text-neutral-900 dark:text-neutral-100">
        
        {/* Error Notice Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Remote Web Extraction Blocked</span>
              <p className="text-amber-800/90 dark:text-amber-300/90">{error}</p>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-200/80 dark:bg-amber-800/60 hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retry
              </button>
            )}
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center justify-center gap-2 mb-2">
            <span>💪</span> Want a Solution That Never Fails?
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-lg mx-auto">
            Our Chrome Extension works natively inside YouTube. YouTube cannot block it. Ever.
          </p>
        </div>

        {/* Extension Animated Preview Area */}
        <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 mb-6 bg-neutral-950/[0.03] dark:bg-neutral-950/50">
          <div className="relative p-4 sm:p-5 flex flex-col items-center justify-center">
            {/* Browser / Extension Window Mockup */}
            <div className="w-full rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden text-xs">
              <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-2 font-mono text-[11px] text-neutral-500">youtube.com/watch</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                  ⚡ Native In-Browser Session
                </span>
              </div>
              <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="sm:col-span-3 rounded bg-neutral-100 dark:bg-neutral-800/80 p-2.5 flex flex-col justify-between">
                  <div>
                    <div className="h-3 w-3/4 bg-neutral-300 dark:bg-neutral-700 rounded mb-2" />
                    <div className="space-y-1.5">
                      <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-700/60 rounded" />
                      <div className="h-2 w-5/6 bg-neutral-200 dark:bg-neutral-700/60 rounded" />
                      <div className="h-2 w-4/6 bg-neutral-200 dark:bg-neutral-700/60 rounded" />
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between text-[10px] text-neutral-500">
                    <span>Active Video Tab</span>
                    <span className="text-emerald-600 font-medium">Bypasses Server Bans</span>
                  </div>
                </div>
                <div className="sm:col-span-2 rounded border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 flex flex-col justify-between">
                  <div>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                      TubeTranscriber Sidebar
                    </span>
                    <p className="text-[10px] text-neutral-600 dark:text-neutral-400 leading-tight">
                      Reads verified caption DOM directly from your browser session. 1-click SRT / TXT / MD.
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span>✨ Gemini Nano Summaries Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Checklist */}
        <div className="space-y-3 mb-8">
          {features.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-sm leading-relaxed">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 mr-1.5">
                  {item.title}
                </span>
                <span className="text-neutral-600 dark:text-neutral-400">
                  — {item.description}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Primary CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <a
            href={extensionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#FF5A36] text-white font-semibold text-base shadow-md hover:opacity-90 active:scale-[0.99] transition-all"
          >
            <span>🧩</span> Add to Chrome — It's Free
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </a>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700/60 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Try Web Lookup Again
            </button>
          )}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-full text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 text-sm font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Home
            </button>
          )}
        </div>

        {/* Lower Card Section: Technical Explanation & Transparency */}
        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-6 mt-6">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2 mb-3">
            <span>ℹ️</span> Why does this happen?
          </h3>
          <div className="space-y-3 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <p>
              YouTube actively blocks external website tools from requesting transcripts remotely.
              This happens unpredictably—sometimes web requests succeed, sometimes YouTube's anti-bot system drops them.
            </p>
            <p>
              When you use a web-based tool, YouTube detects and restricts the request originating from
              our cloud servers, even when captions are present on the video.
            </p>
            <p className="font-semibold text-neutral-900 dark:text-neutral-200">
              The Chrome Extension is fundamentally different. It operates locally inside your web
              browser on YouTube. Because the request originates from your live viewing session,
              YouTube sees you as a regular viewer and cannot block it.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
