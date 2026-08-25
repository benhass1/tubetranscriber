import SiteShell from "@/components/SiteShell";
import { ArrowLeft, ArrowRight, Check, Clock3 } from "lucide-react";
import { Link, useRoute } from "wouter";
import { blogPosts, findBlogPost } from "./blogData";

const FAQ_ITEMS = [
  { question: "Can every YouTube video provide captions for this workflow?", answer: "No. The video must expose a public caption track. A video can be watchable while captions are disabled or unavailable in a requested language." },
  { question: "Which transcript format should a creator choose?", answer: "Choose TXT for reading and writing, JSON for structured analysis, and SRT when timing needs to move into a subtitle or editing workflow." },
  { question: "How can I use the transcript without losing context?", answer: "Keep the source URL, verify important passages against the video, and add original analysis or attribution before publishing any derived work." },
  { question: "When should I check my upload connection?", answer: "Run the YouTube upload speed test before a large upload, a live workflow, or a deadline-sensitive publishing session so you can plan realistic delivery time." },
] as const;

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const post = params?.slug ? findBlogPost(params.slug) : undefined;

  if (!post) {
    return (
      <SiteShell>
        <section className="page-empty content-container blog-not-found">
          <p className="eyebrow">Journal</p>
          <h1>That article is not here.</h1>
          <p>Return to the journal to browse the latest workflow guides and updates.</p>
          <Link href="/blog" className="primary-button">Back to the blog <ArrowRight size={17} /></Link>
        </section>
      </SiteShell>
    );
  }

  const relatedPosts = blogPosts.filter((candidate) => candidate.slug !== post.slug).slice(0, 3);

  return (
    <SiteShell>
      <article className="blog-post-page">
        <header className="blog-post-header content-container">
          <Link href="/blog" className="back-link"><ArrowLeft size={15} /> Back to the blog</Link>
          <div className="blog-post-kicker"><span>{post.category}</span><span className="meta-dot" /><span>{post.date}</span><span className="meta-dot" /><span><Clock3 size={13} /> {post.readTime}</span></div>
          <h1>{post.title}</h1>
          <p className="blog-post-excerpt">{post.excerpt}</p>
          <p className="author-signal">Maintained by the TubeTranscriber Engineering Team</p>
        </header>

        <div className="blog-post-feature content-container">
          <img src={post.imageUrl} alt={post.imageAlt} loading="eager" />
        </div>

        <div className="blog-post-rule" aria-hidden="true"><span /></div>

        <div className="blog-post-content">
          <aside className="blog-takeaways" aria-labelledby="takeaways-heading">
            <p className="eyebrow" id="takeaways-heading">In this guide</p>
            <ul>{post.takeaways.map((takeaway) => <li key={takeaway}><Check size={16} /> <span>{takeaway}</span></li>)}</ul>
          </aside>
          <Link href="/" className="blog-post-primary-cta">Try Free Transcript Generator <ArrowRight size={16} /></Link>

          <p className="blog-post-intro">{post.intro}</p>
          <p className="blog-inline-links">Start with the <Link href="/">free transcript generator</Link> to turn available captions into a working document, then use the <Link href="/speed-test">YouTube upload speed test</Link> when your publishing workflow depends on a reliable connection.</p>

          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}

          <section className="blog-faq" aria-labelledby="faq-heading">
            <p className="eyebrow">Common questions</p>
            <h2 id="faq-heading">FAQ for creators</h2>
            {FAQ_ITEMS.map((item, index) => <details key={item.question} open={index === 0}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
          </section>

          <Link href="/blog" className="blog-post-end-link"><ArrowLeft size={15} /> Explore more from the journal</Link>
        </div>

        <section className="blog-related content-container" aria-labelledby="related-heading">
          <div className="blog-section-heading compact"><div><p className="eyebrow">Keep reading</p><h2 id="related-heading">More creator workflows.</h2></div></div>
          <div className="blog-related-grid">
            {relatedPosts.map((related) => (
              <article className="blog-related-card" key={related.slug}>
                <span className="post-category">{related.category}</span>
                <h3><Link href={`/blog/${related.slug}`}>{related.title}</Link></h3>
                <p>{related.excerpt}</p>
                <Link href={`/blog/${related.slug}`} className="read-link">Read more <ArrowRight size={15} /></Link>
              </article>
            ))}
          </div>
        </section>

        <section className="blog-callout content-container">
          <div><p className="eyebrow">Build with less friction</p><h2>Boost your YouTube content strategy.</h2><p>Extract a clean working transcript, search the ideas that matter, and plan your next upload with more confidence.</p></div>
          <Link href="/" className="primary-button">Try TubeTranscriber <ArrowRight size={17} /></Link>
        </section>
      </article>
    </SiteShell>
  );
}
