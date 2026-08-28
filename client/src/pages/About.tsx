import SiteShell from "@/components/SiteShell";
import { ArrowRight, CircleHelp, FileCheck2, FileText, FolderOpen, LockKeyhole, Mail, PlaySquare, ShieldCheck, TriangleAlert, Youtube } from "lucide-react";
import { Link } from "wouter";

const faqs = [
  ["Which links work?", "TubeTranscriber accepts standard YouTube watch links, youtu.be links, Shorts, embed URLs, and an 11-character YouTube video ID."],
  ["Why does a video sometimes have no transcript?", "Transcripts depend on captions being exposed by YouTube. Private videos, videos with captions disabled, and some restricted videos cannot provide transcript text."],
  ["What does TubeTranscriber save?", "TubeTranscriber saves recent video details only in the local storage of your current browser so you can re-open lookups. You can remove one entry or clear the local history whenever you choose."],
  ["Can I use the downloaded file anywhere?", "Exports are offered for lawful use. Please respect copyright, the original creator, and the terms governing the source material."],
];

const workflow = [
  { icon: PlaySquare, number: "01", title: "Paste a public YouTube link", text: "Use a standard video, Short, embed URL, or raw 11-character video ID. No account or installation is required." },
  { icon: FileCheck2, number: "02", title: "Read a clean transcript", text: "TubeTranscriber retrieves the caption track exposed by YouTube and presents it as continuous, searchable text." },
  { icon: FolderOpen, number: "03", title: "Export the format you need", text: "Copy the transcript or download TXT for reading, JSON for structured data, or SRT for timed subtitle workflows." },
];

export default function About() {
  return (
    <SiteShell>
      <div className="about-page">
        <section className="about-hero about-hero-expanded">
          <div className="content-container">
            <p className="eyebrow"><CircleHelp size={14} /> About the tool</p>
            <h1>About <span>TubeTranscriber</span></h1>
            <p className="about-hero-lede">A focused web tool for turning public YouTube captions into clear, searchable working text.</p>
            <p className="about-hero-supporting">TubeTranscriber helps creators, researchers, students, and teams move from a video link to useful words without unnecessary formatting or a registration step.</p>
          </div>
        </section>

        <main>
          <section className="about-intro-section content-container" aria-labelledby="what-heading">
            <div className="about-intro-copy">
              <p className="eyebrow">A practical starting point</p>
              <h2 id="what-heading">Make video knowledge easier to work with.</h2>
              <p>TubeTranscriber is an independent YouTube transcript generator designed for the moment after you find a useful video and need to work with what was said. It turns available captions into a practical document you can read, search, copy, download, and revisit.</p>
              <p>The tool is built and maintained by the <strong>TubeTranscriber Engineering Team</strong>. TubeTranscriber is independent and is not affiliated with, endorsed by, or sponsored by YouTube or Google.</p>
            </div>
            <aside className="about-callout">
              <ShieldCheck size={22} />
              <p className="eyebrow">The simple promise</p>
              <h3>Useful text, fewer steps.</h3>
              <p>Paste a public link, review the captions that are available, and keep the result in a format that fits your workflow.</p>
            </aside>
          </section>

          <section className="about-workflow-section" aria-labelledby="workflow-heading">
            <div className="content-container">
              <div className="section-heading about-section-heading">
                <p className="eyebrow">How it works</p>
                <h2 id="workflow-heading">From YouTube link to working document.</h2>
                <p className="section-answer">The experience is intentionally short: identify the video, read the available caption track, and choose what to do with the text.</p>
              </div>
              <div className="about-workflow-grid">
                {workflow.map(({ icon: Icon, number, title, text }) => (
                  <article className="about-workflow-card" key={number}>
                    <div className="about-workflow-card-top"><span>{number}</span><Icon size={21} /></div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="about-mission-section content-container" aria-labelledby="mission-heading">
            <div className="about-mission-copy">
              <p className="eyebrow">Our mission</p>
              <h2 id="mission-heading">Make spoken knowledge easier to revisit.</h2>
              <p>Creators, researchers, educators, and teams often discover useful ideas inside a video but need a calmer way to review them. TubeTranscriber is built around that moment: a creator-first workflow that turns public captions into readable working text without adding an account, a browser extension, or a distracting layer of software.</p>
              <p>Our goal is practical rather than speculative. We want the path from a public YouTube link to a searchable document to feel clear, respectful, and easy to verify against the original video. The tool does not claim to repair missing captions or produce a perfect record of speech; it helps people work responsibly with the caption track that YouTube exposes.</p>
            </div>
            <aside className="about-mission-callout"><p className="eyebrow">A creator-first principle</p><strong>Useful text should stay easy to inspect, export, and revisit.</strong><p>That principle shapes the reader, the format choices, the browser-local history, and the visible limitations throughout the product.</p></aside>
          </section>

          <section className="about-technical-section" aria-labelledby="technical-heading">
            <div className="content-container">
              <div className="section-heading about-section-heading">
                <p className="eyebrow">Technical Architecture</p>
                <h2 id="technical-heading">A focused pipeline for public caption data.</h2>
                <p className="section-answer">TubeTranscriber separates retrieval, normalization, presentation, and export so each stage has a clear responsibility and a clear limitation.</p>
              </div>
              <div className="about-technical-grid">
                <article className="about-technical-card"><span className="about-technical-number">01</span><h3>Seamless caption track extraction</h3><p>The retrieval layer identifies a supported YouTube URL, requests the public caption track through the configured extraction paths, and preserves the original language when YouTube exposes it. When no track is available, the interface reports that limitation instead of inventing text.</p></article>
                <article className="about-technical-card"><span className="about-technical-number">02</span><h3>Structured parsing for useful exports</h3><p>Caption events are normalized into timed segments that the reader can search and that the export layer can represent as TXT, JSON, SRT, VTT, or Markdown. The structured result can support downstream advanced NLP parsing, search, retrieval, or editorial review, while the source timing remains available for checking.</p></article>
                <article className="about-technical-card"><span className="about-technical-number">03</span><h3>Privacy-aware creator workflows</h3><p>Recent lookup details are kept in the current browser, and the service does not require an account to begin. The workflow is intentionally small: retrieve available captions, show the provenance clearly, and let the visitor decide how to use or remove the working document.</p></article>
              </div>
            </div>
          </section>

          <section className="about-standards-section content-container" aria-labelledby="standards-heading">
            <div className="section-heading about-section-heading"><p className="eyebrow">Accessibility and transcription standards</p><h2 id="standards-heading">Context matters as much as conversion.</h2></div>
            <div className="about-standards-copy">
              <p>Captions are an important accessibility layer because they give people another way to follow spoken information. They can support viewers who are deaf or hard of hearing, people watching without sound, people working in a second language, and anyone who needs to search a long recording instead of replaying it from the beginning. A transcript reader should therefore treat caption data as meaningful source material, not as decorative text.</p>
              <p>TubeTranscriber preserves the available words and timing as a working representation. It does not silently present automatic captions as a certified human transcript, and it does not promise that names, numbers, accents, technical terms, speaker changes, or overlapping speech are perfectly recognized. Automatic caption tracks can contain errors. For publishing, legal, educational, or accessibility-critical use, review the exported text against the original video and follow the standards of the destination platform or institution.</p>
              <p>Good transcription practice also includes context and attribution. Keep the source link with the working document, identify when captions are automatic if that distinction is available, and respect the creator’s copyright and terms. Use TXT when a clean reading copy is the priority, JSON when an application or advanced NLP parsing workflow needs structured segments, and SRT or VTT when timing matters for editing or playback. The format should serve the task, not conceal uncertainty.</p>
              <p>These principles explain why the product combines seamless caption track extraction with a simple reader, browser-local history, searchable text, and explicit limitations. TubeTranscriber is an independent utility; it is not affiliated with YouTube or Google, and it cannot create captions that the source does not expose.</p>
            </div>
          </section>

          <section className="about-details-section content-container" aria-labelledby="details-heading">
            <div className="section-heading about-section-heading">
              <p className="eyebrow">Know before you start</p>
              <h2 id="details-heading">The details that matter.</h2>
            </div>
            <div className="about-details-grid">
              <article className="about-detail-card">
                <Youtube size={22} />
                <h3>Supported videos</h3>
                <p>TubeTranscriber works with public YouTube videos, Shorts, embedded videos, and standard watch links when YouTube exposes a usable caption track.</p>
              </article>
              <article className="about-detail-card">
                <FileText size={22} />
                <h3>Supported formats</h3>
                <p>Download plain TXT for reading, JSON for structured applications, or SRT when you need timestamps for a subtitle or editing workflow.</p>
              </article>
              <article className="about-detail-card">
                <LockKeyhole size={22} />
                <h3>Privacy approach</h3>
                <p>Recent lookup details are kept in the browser you are using. There is no required account, and you can remove local history whenever you want.</p>
              </article>
              <article className="about-detail-card about-detail-card-warning">
                <TriangleAlert size={22} />
                <h3>Important limitations</h3>
                <p>TubeTranscriber cannot create captions that YouTube does not expose. Private, restricted, unavailable, or caption-disabled videos may not produce a transcript.</p>
              </article>
            </div>
          </section>

          <section className="about-links-section content-container" aria-labelledby="resources-heading">
            <div className="about-links-panel">
              <div>
                <p className="eyebrow">Resources and policies</p>
                <h2 id="resources-heading">Clear answers for using the tool responsibly.</h2>
                <p>Review the service terms, privacy approach, copyright guidance, or contact the team with a product or legal question.</p>
              </div>
              <div className="about-policy-links">
                <Link href="/privacy">Privacy Policy <ArrowRight size={15} /></Link>
                <Link href="/terms">Terms of Service <ArrowRight size={15} /></Link>
                <Link href="/copyright">Copyright Policy <ArrowRight size={15} /></Link>
                <Link href="/contact"><Mail size={15} /> Contact TubeTranscriber <ArrowRight size={15} /></Link>
              </div>
            </div>
          </section>

          <section className="faq-section content-container about-faq-section" aria-labelledby="faq-heading">
            <div className="section-heading"><p className="eyebrow">Questions, answered</p><h2 id="faq-heading">Frequently asked questions</h2></div>
            <div className="faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div>
          </section>
        </main>
      </div>
    </SiteShell>
  );
}
