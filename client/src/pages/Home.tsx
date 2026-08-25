import SiteShell from "@/components/SiteShell";
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
          <form className="url-form" onSubmit={submit} noValidate>
            <div className="url-field"><Search size={19} /><input value={url} onChange={event => setUrl(event.target.value)} aria-label="YouTube video URL" placeholder="Paste a YouTube URL" autoComplete="url" /></div>
            <button type="submit" className="primary-button">Extract transcript <ArrowRight size={18} /></button>
          </form>
          {error && <p className="input-error" role="alert">{error}</p>}
          <div className="trust-row"><CheckCircle2 size={16} /><span>Supports videos, Shorts, and embed links</span><span className="trust-dot" /><span>TXT, JSON, and SRT exports</span></div>
        </div>
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
        <div className="section-heading"><p className="eyebrow">At a glance</p><h2 id="comparison-heading">How is TubeTranscriber different from standard YouTube captions?</h2><p className="section-answer">TubeTranscriber organizes YouTube captions into a focused workspace with search, local history, and practical export formats.</p></div>
        <div className="comparison-table-wrap">
          <table className="comparison-table comparison-table-desktop"><thead><tr><th scope="col">Capability</th><th scope="col">TubeTranscriber</th><th scope="col">Standard YouTube captions</th></tr></thead><tbody><tr><th scope="row">Formats</th><td>TXT, JSON, and SRT downloads</td><td>Player display and platform controls</td></tr><tr><th scope="row">Reading</th><td>Continuous text with browser search</td><td>Caption view inside the video player</td></tr><tr><th scope="row">Privacy</th><td>Recent history stays in your browser</td><td>History is not a TubeTranscriber feature</td></tr><tr><th scope="row">Cost</th><td>100% free, 0 registration required</td><td>Depends on the YouTube experience</td></tr></tbody></table>
          <div className="comparison-cards" aria-label="TubeTranscriber and standard YouTube captions comparison">
            <article className="comparison-card"><h3>Formats</h3><div><span className="comparison-label">TubeTranscriber</span><p>TXT, JSON, and SRT downloads</p></div><div><span className="comparison-label">Standard YouTube captions</span><p>Player display and platform controls</p></div></article>
            <article className="comparison-card"><h3>Reading</h3><div><span className="comparison-label">TubeTranscriber</span><p>Continuous text with browser search</p></div><div><span className="comparison-label">Standard YouTube captions</span><p>Caption view inside the video player</p></div></article>
            <article className="comparison-card"><h3>Privacy</h3><div><span className="comparison-label">TubeTranscriber</span><p>Recent history stays in your browser</p></div><div><span className="comparison-label">Standard YouTube captions</span><p>History is not a TubeTranscriber feature</p></div></article>
            <article className="comparison-card"><h3>Cost</h3><div><span className="comparison-label">TubeTranscriber</span><p>100% free, 0 registration required</p></div><div><span className="comparison-label">Standard YouTube captions</span><p>Depends on the YouTube experience</p></div></article>
          </div>
        </div>
      </section>

      <section className="landing-faq" aria-labelledby="faq-preview-heading"><div className="content-container landing-faq-inner"><div><p className="eyebrow">A few quick answers</p><h2 id="faq-preview-heading">Questions creators ask first.</h2></div><div className="faq-preview"><p><strong>Which public videos can I transcribe?</strong><span>Public videos, Shorts, and embed links with captions exposed by YouTube can be processed.</span></p><p><strong>Is TubeTranscriber free to use?</strong><span>Yes. TubeTranscriber is 100% free and requires 0 registration; caption access still depends on the source video.</span></p><Link href="/about">Read the full FAQ <ArrowRight size={15} /></Link></div></div></section>

      <section className="how-section" aria-labelledby="how-heading"><div className="content-container how-layout"><div><p className="eyebrow">Simple by design</p><h2 id="how-heading">From link to insight<br />in three calm steps.</h2></div><ol className="steps-list"><li><span>01</span><div><h3>Paste a link</h3><p>Share any public YouTube video URL, including Shorts and embeds.</p></div></li><li><span>02</span><div><h3>Read the transcript</h3><p>Search the complete text, then copy or export it when you are ready.</p></div></li><li><span>03</span><div><h3>Keep recent work nearby</h3><p>Re-open your browser-local history whenever you need it.</p></div></li></ol></div></section>
      <section className="blog-callout content-container"><div><p className="eyebrow">From the journal</p><h2>Build a better workflow around video text.</h2><p>Read practical guides for transcript extraction, SRT editing, and content creation.</p></div><Link href="/blog" className="primary-button">Explore the blog <ArrowRight size={17} /></Link></section>
    </SiteShell>
  );
}
