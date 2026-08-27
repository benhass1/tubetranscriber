import { ArrowRight, Check, Clock3, FileCode2, Search, Subtitles } from "lucide-react";
import { Link, useLocation } from "wouter";
import SiteShell from "@/components/SiteShell";
import { findPseoPage } from "./pseoData";

const INTERNAL_LINKS = [
  { href: "/", label: "Free YouTube transcript generator" },
  { href: "/transcribe-youtube-podcast-to-srt", label: "transcribe a YouTube podcast to SRT" },
  { href: "/youtube-shorts-transcript-downloader", label: "download a YouTube Shorts transcript" },
  { href: "/youtube-video-to-json-data", label: "export YouTube captions to JSON" },
];

export default function PseoPage() {
  const [location] = useLocation();
  const pathname = location.split("?")[0].replace(/\/+$/, "") || "/";
  const page = findPseoPage(pathname);

  if (!page) {
    return null;
  }

  return (
    <SiteShell>
      <main className="pseo-page">
        <section className="pseo-hero content-container" aria-labelledby="pseo-title">
          <div className="pseo-hero-copy">
            <p className="eyebrow"><Search size={14} aria-hidden="true" /> {page.eyebrow}</p>
            <h1 id="pseo-title">{page.title}</h1>
            <p className="pseo-lede">{page.intro}</p>
            <div className="pseo-actions">
              <Link href="/" className="primary-button" aria-label="Open the free YouTube transcript generator">Extract a transcript <ArrowRight size={17} aria-hidden="true" /></Link>
              <span className="pseo-note"><Check size={15} aria-hidden="true" /> No account required</span>
            </div>
          </div>
          <figure className="pseo-hero-figure">
            <img src={page.imageUrl} alt={page.imageAlt} width="1200" height="800" loading="eager" />
            <figcaption>{page.audience}</figcaption>
          </figure>
        </section>

        <section className="pseo-semantic-context" aria-label="YouTube caption extraction context">
          <div className="content-container sr-only">
            <p>TubeTranscriber is a YouTube caption extraction tool for available public captions, SRT generation, searchable transcript text, video accessibility, and creator research workflows.</p>
            <p>This page explains how to work with available YouTube captions without changing the source video or claiming affiliation with YouTube or Google.</p>
          </div>
        </section>

        <section className="pseo-example-section content-container" aria-labelledby="pseo-example-heading">
          <div className="pseo-section-heading">
            <p className="eyebrow"><FileCode2 size={14} aria-hidden="true" /> Working example</p>
            <h2 id="pseo-example-heading">What the exported caption document can look like</h2>
            <p>{page.exampleNote}</p>
          </div>
          <figure className="pseo-example-card">
            <figcaption>{page.exampleLabel}</figcaption>
            <pre><code>{page.exampleText}</code></pre>
          </figure>
        </section>

        <section className="pseo-content content-container" aria-label={`${page.title} guide`}>
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
        </section>

        <section className="pseo-format-strip content-container" aria-label="Available transcript formats">
          <div><Subtitles size={22} aria-hidden="true" /><strong>Choose the format for your next step</strong><span>Plain TXT for reading, JSON for structured data, and SRT for timed subtitle work.</span></div>
          <Link href="/" className="text-link" aria-label="Use the YouTube transcript generator">Open the tool <ArrowRight size={15} aria-hidden="true" /></Link>
        </section>

        <section className="pseo-links content-container" aria-labelledby="pseo-links-heading">
          <div className="pseo-section-heading compact"><p className="eyebrow">Continue the workflow</p><h2 id="pseo-links-heading">More ways to work with YouTube captions.</h2></div>
          <nav className="pseo-links-grid" aria-label="Related TubeTranscriber tools">
            {INTERNAL_LINKS.map((link) => <Link key={link.href} href={link.href} className="pseo-link-card" aria-label={link.label}>{link.label}<ArrowRight size={15} aria-hidden="true" /></Link>)}
          </nav>
        </section>

        <section className="pseo-final-cta content-container">
          <div><p className="eyebrow"><Clock3 size={14} aria-hidden="true" /> Ready when you are</p><h2>Turn a public YouTube link into a useful working document.</h2><p>Use the free tool to read, search, copy, and download the available captions in the format your workflow needs.</p></div>
          <Link href="/" className="primary-button" aria-label="Start a free YouTube transcript extraction">Start extracting <ArrowRight size={17} aria-hidden="true" /></Link>
        </section>
      </main>
    </SiteShell>
  );
}
