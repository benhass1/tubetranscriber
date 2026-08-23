import SiteShell from "@/components/SiteShell";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import { Link, useRoute } from "wouter";
import { findBlogPost } from "./blogData";

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
        <div className="blog-post-rule" aria-hidden="true"><span /></div>
        <div className="blog-post-content">
          <p className="blog-post-intro">{post.intro}</p>
          {post.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
          <Link href="/blog" className="blog-post-end-link"><ArrowLeft size={15} /> Explore more from the journal</Link>
        </div>
      </article>
    </SiteShell>
  );
}
