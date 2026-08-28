import SiteShell from "@/components/SiteShell";
import TurnstileWidget from "@/components/TurnstileWidget";
import InteractiveDemo from "@/components/InteractiveDemo";
import DeepDive from "@/components/DeepDive";
import { getEngineFreshnessText } from "@/lib/freshness";
import { ArrowRight, CheckCircle2, FileDown, Quote, Search, ShieldCheck, Sparkles, Subtitles } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

const features = [
  { icon: Subtitles, title: "Can I read captions as clean text?", text: "Yes. TubeTranscriber turns public YouTube captions into a continuous, searchable transcript." },
  { icon: FileDown, title: "What formats can I download?", text: "Choose plain TXT for reading, JSON for structured data, or SRT for a timed subtitle workflow." },
  { icon: ShieldCheck, title: "Is my transcript history private?", text: "Yes. Recent lookups stay in the browser you are using, with 0 registration required." },
];

export default function Home() {
  const [, navigate] = useLocation();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!url.trim()) { setError("Paste a YouTube URL to continue."); return; }
    setError("");
    navigate(`/transcript?url=${encodeURIComponent(url.trim())}`);
  };

  return (
    <SiteShell>
      <section className="hero-section">
        <div className="hero-grid" aria-hidden="true" /><div className="hero-orb orb-one" aria-hidden="true" /><div className="hero-orb orb-two" aria-hidden="true" />
        <div className="content-container hero-content">
          <p className="eyebrow"><Sparkles size={14} /> YouTube transcript generator</p>
          <h1>Free YouTube <span>Transcript Generator</span></h1>
          <p className="hero-lede">Convert YouTube videos to searchable transcripts in seconds. Download TXT, SRT, or JSON — completely free, with no registration required.</p>
          <form className="url-form" onSubmit={submit} noValidate aria-label="YouTube caption extraction form">
            <div className="url-form-main">
              <div className="url-field"><Search size={19} /><input value={url} onChange={event => setUrl(event.target.value)} aria-label="YouTube video URL" placeholder="Paste a YouTube URL" autoComplete="url" /></div>
            </div>
            <button type="submit" className="primary-button" aria-label="Extract available YouTube captions">Extract transcript <ArrowRight size={18} aria-hidden="true" /></button>
          </form>
          <div className="turnstile-section">
            <TurnstileWidget />
          </div>
          {error && <p className="input-error" role="alert">{error}</p>}
          <div className="trust-row"><CheckCircle2 size={16} /><span>Supports videos, Shorts, and embed links</span><span className="trust-dot" /><span>TXT, JSON, and SRT exports</span></div>
          <InteractiveDemo />
        </div>
      </section>

      <section className="sr-only" aria-label="YouTube caption extraction topics">
        <h2>YouTube caption extraction and accessible video text</h2>
        <p>TubeTranscriber helps visitors extract available YouTube captions, generate SRT subtitles, read video text, and move caption content into TXT or JSON workflows.</p>
        <nav aria-label="Caption workflow guides"><Link href="/transcribe-youtube-podcast-to-srt">Transcribe a YouTube podcast to SRT</Link><Link href="/youtube-shorts-transcript-downloader">Download a YouTube Shorts transcript</Link><Link href="/extract-lecture-captions-to-text">Extract lecture captions to text</Link><Link href="/youtube-video-to-json-data">Export YouTube captions to JSON</Link></nav>
      </section>

      <section className="stats-strip" aria-label="TubeTranscriber at a glance">
        <div className="content-container stats-grid">
          <div><strong>100%</strong><span>free to use</span></div>
          <div><strong>0</strong><span>registration required</span></div>
          <div><strong>100+</strong><span>languages when captions are provided</span></div>
        </div>
      </section>

      <section className="feature-section content-container" aria-labelledby="features-heading">
        <div className="section-heading"><p className="eyebrow">A creator workflow</p><h2 id="features-heading">How do I extract a transcript from a YouTube video?</h2><p className="section-answer">Paste a public YouTube link, let TubeTranscriber retrieve the caption track provided by YouTube, and choose the format that fits your next step.</p></div>
        <div className="feature-grid">{features.map(({ icon: Icon, title, text }, index) => <article className="feature-card" key={title}><span className={`feature-icon feature-icon-${index}`}><Icon size={21} /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <section className="seo-explainer content-container" aria-labelledby="generator-heading">
        <p className="eyebrow">YouTube video transcript generator</p>
        <h2 id="generator-heading">What formats can I download YouTube captions in?</h2>
        <p className="answer-first">TubeTranscriber exports YouTube captions as plain TXT, structured JSON, or timed SRT subtitles, so the same transcript can move from research to editing without reformatting.</p>
        <ul className="feature-list"><li><strong>TXT:</strong> a clean, readable document for notes, search, and quotations.</li><li><strong>JSON:</strong> structured segments that preserve timing data for technical workflows.</li><li><strong>SRT:</strong> numbered, timestamped cues ready for subtitle review and video editing.</li></ul>
      </section>

      <section className="quote-section content-container" aria-labelledby="quote-heading">
        <div className="quote-card"><Quote size={23} /><div><p className="eyebrow">Caption standard</p><h2 id="quote-heading">Why do timed captions matter?</h2><blockquote>“WebVTT files provide captions or subtitles for video content.” <cite>— <a href="https://www.w3.org/TR/webvtt1/" target="_blank" rel="noreferrer">W3C WebVTT specification</a></cite></blockquote><p>Timed text keeps spoken content connected to the moment it appears, which is why SRT export is useful for review and editing workflows.</p></div></div>
      </section>

      <section className="comparison-section content-container" aria-labelledby="comparison-heading">
        <div className="section-heading"><p className="eyebrow">At a glance</p><h2 id="comparison-heading">How TubeTranscriber Compares to Standard Tools</h2><p className="section-answer">TubeTranscriber organizes YouTube captions into a focused workspace with search, local history, and practical export formats.</p></div>
        <div className="comparison-groups">
          <section className="comparison-group" aria-labelledby="general-comparison-heading"><h3 id="general-comparison-heading">How TubeTranscriber Compares to Standard Tools</h3><div className="comparison-table-wrap"><table className="comparison-table comparison-table-desktop" aria-label="General feature comparison between TubeTranscriber, standard YouTube captions, and other public tools"><thead><tr><th scope="col">Capability</th><th scope="col">TubeTranscriber</th><th scope="col">Standard YouTube Captions</th><th scope="col">Other Public Tools</th></tr></thead><tbody><tr><th scope="row">Formats</th><td>TXT, JSON, and SRT downloads</td><td>Player display and platform controls</td><td>Varies by product and plan</td></tr><tr><th scope="row">Reading</th><td>Continuous text with browser search</td><td>Caption view inside the video player</td><td>Often includes extra AI or editor features</td></tr><tr><th scope="row">Privacy</th><td>Browser-local history; no account required</td><td>History is not a TubeTranscriber feature</td><td>Review each service&apos;s data policy</td></tr><tr><th scope="row">Cost</th><td>Free workflow with no registration requirement</td><td>Included in the YouTube experience</td><td>Free tiers may include usage limits</td></tr></tbody></table><div className="comparison-cards" aria-label="Responsive general feature comparison"><article className="comparison-card"><h3>Formats</h3><div><span className="comparison-label">TubeTranscriber</span><p>TXT, JSON, and SRT downloads</p></div><div><span className="comparison-label">Standard YouTube Captions</span><p>Player display and platform controls</p></div><div><span className="comparison-label">Other Public Tools</span><p>Varies by product and plan</p></div></article><article className="comparison-card"><h3>Reading</h3><div><span className="comparison-label">TubeTranscriber</span><p>Continuous text with browser search</p></div><div><span className="comparison-label">Standard YouTube Captions</span><p>Caption view inside the video player</p></div><div><span className="comparison-label">Other Public Tools</span><p>Often includes extra AI or editor features</p></div></article><article className="comparison-card"><h3>Privacy</h3><div><span className="comparison-label">TubeTranscriber</span><p>Browser-local history; no account required</p></div><div><span className="comparison-label">Standard YouTube Captions</span><p>History is not a TubeTranscriber feature</p></div><div><span className="comparison-label">Other Public Tools</span><p>Review each service&apos;s data policy</p></div></article><article className="comparison-card"><h3>Cost</h3><div><span className="comparison-label">TubeTranscriber</span><p>Free workflow with no registration requirement</p></div><div><span className="comparison-label">Standard YouTube Captions</span><p>Included in the YouTube experience</p></div><div><span className="comparison-label">Other Public Tools</span><p>Free tiers may include usage limits</p></div></article></div></div></section>
          <section className="comparison-group" aria-labelledby="direct-comparison-heading"><h3 id="direct-comparison-heading">Why Creators Choose TubeTranscriber Over Specific Tools</h3><div className="comparison-table-wrap"><table className="comparison-table comparison-table-desktop" aria-label="Direct competitor breakdown comparing public transcript tools with TubeTranscriber"><thead><tr><th scope="col">Competitor Tool</th><th scope="col">Their Key Limitation</th><th scope="col">TubeTranscriber Advantage</th></tr></thead><tbody><tr><th scope="row"><a className="comparison-link" href="/" aria-label="YouTubeToTranscript alternative comparison">YouTubeToTranscript</a></th><td>Ad-heavy interface; cloud-based processing</td><td>Focused exports with no forced extension; browser-local history and no account required</td></tr><tr><th scope="row"><a className="comparison-link" href="/" aria-label="Tactiq alternative comparison">Tactiq</a></th><td>Requires Chrome extension; freemium usage limits</td><td>Paste a public link; no meeting extension required; completely free</td></tr><tr><th scope="row"><a className="comparison-link" href="/" aria-label="YTTranscript.ai alternative comparison">YTTranscript.ai</a></th><td>Pushes AI summarization upsells; paid tiers for plain exports</td><td>Plain exports without AI upsell steps; all core features free</td></tr></tbody></table><div className="comparison-cards" aria-label="Responsive direct competitor breakdown"><article className="comparison-card"><h3><a className="comparison-link" href="/">YouTubeToTranscript</a></h3><div><span className="comparison-label">Their Key Limitation</span><p>Ad-heavy interface; cloud-based processing</p></div><div><span className="comparison-label">TubeTranscriber Advantage</span><p>Focused exports with no forced extension; browser-local history and no account required</p></div></article><article className="comparison-card"><h3><a className="comparison-link" href="/">Tactiq</a></h3><div><span className="comparison-label">Their Key Limitation</span><p>Requires Chrome extension; freemium usage limits</p></div><div><span className="comparison-label">TubeTranscriber Advantage</span><p>Paste a public link; no meeting extension required; completely free</p></div></article><article className="comparison-card"><h3><a className="comparison-link" href="/">YTTranscript.ai</a></h3><div><span className="comparison-label">Their Key Limitation</span><p>Pushes AI summarization upsells; paid tiers for plain exports</p></div><div><span className="comparison-label">TubeTranscriber Advantage</span><p>Plain exports without AI upsell steps; all core features free</p></div></article></div></div></section>
        </div>
        <p className="comparison-disclaimer">Competitor descriptions summarize publicly visible product pages and can change as products evolve. TubeTranscriber is independent and not affiliated with these services.</p>
      </section>

      <section className="landing-faq" aria-labelledby="faq-preview-heading"><div className="content-container landing-faq-inner"><div><p className="eyebrow">A few quick answers</p><h2 id="faq-preview-heading">Questions creators ask first.</h2></div><div className="faq-preview"><p><strong>Which public videos can I transcribe?</strong><span>Public videos, Shorts, and embed links with captions exposed by YouTube can be processed.</span></p><p><strong>Is TubeTranscriber free to use?</strong><span>Yes. TubeTranscriber is 100% free and requires 0 registration; caption access still depends on the source video.</span></p><Link href="/about">Read the full FAQ <ArrowRight size={15} /></Link></div></div></section>
      <p className="engine-freshness content-container">{getEngineFreshnessText()}</p>

      <section className="how-section" aria-labelledby="how-heading"><div className="content-container how-layout"><div><p className="eyebrow">Simple by design</p><h2 id="how-heading">From link to insight<br />in three calm steps.</h2></div><ol className="steps-list"><li><span>01</span><div><h3>Paste a link</h3><p>Share any public YouTube video URL, including Shorts and embeds.</p></div></li><li><span>02</span><div><h3>Read the transcript</h3><p>Search the complete text, then copy or export it when you are ready.</p></div></li><li><span>03</span><div><h3>Keep recent work nearby</h3><p>Re-open your browser-local history whenever you need it.</p></div></li></ol></div></section>
      <section className="blog-callout content-container"><div><p className="eyebrow">From the journal</p><h2>Build a better workflow around video text.</h2><p>Read practical guides for transcript extraction, SRT editing, and content creation.</p></div><Link href="/blog" className="primary-button">Explore the blog <ArrowRight size={17} /></Link></section>
      <DeepDive />
    </SiteShell>
  );
}
