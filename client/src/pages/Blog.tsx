import SiteShell from "@/components/SiteShell";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { Link } from "wouter";
import { blogPosts, featuredPost } from "./blogData";

export default function Blog() {
  const supportingPosts = blogPosts.filter((post) => post.slug !== featuredPost.slug);

  return (
    <SiteShell>
      <div className="blog-page-clean">
        <section className="blog-hero blog-hero-clean">
          <div className="content-container blog-hero-inner">
            <p className="eyebrow"><BookOpen size={14} /> The journal</p>
            <h1>The Transcript <span>Journal</span></h1>
            <p className="blog-hero-description">Practical guides, workflow tips, and articles on video caption extraction and content strategy.</p>
            <div className="blog-hero-meta"><span>20 creator-focused guides</span><span className="meta-dot" /><span>Built for clearer video workflows</span></div>
          </div>
        </section>

        <main>
          <section className="blog-section blog-feature-section content-container" aria-labelledby="featured-heading">
            <div className="blog-section-heading blog-section-heading-clean">
              <div>
                <p className="eyebrow">Start here</p>
                <h2 id="featured-heading">A clearer way to work with video text.</h2>
              </div>
              <p>Practical ideas for moving from a YouTube link to useful, reusable words.</p>
            </div>

            <Link href={`/blog/${featuredPost.slug}`} className="featured-post-card featured-post-card-clean">
              <div className="featured-post-art">
                <img src={featuredPost.imageUrl} alt={featuredPost.imageAlt} loading="eager" />
                <span>01</span>
              </div>
              <div className="featured-post-copy">
                <div className="post-meta"><span>{featuredPost.category}</span><span className="meta-dot" /><span>{featuredPost.date}</span><span className="meta-dot" /><span><Clock3 size={13} /> {featuredPost.readTime}</span></div>
                <h3>{featuredPost.title}</h3>
                <p>{featuredPost.excerpt}</p>
                <span className="read-link">Read the guide <ArrowRight size={16} /></span>
              </div>
            </Link>
          </section>

          <section className="blog-section blog-grid-section content-container" aria-labelledby="latest-heading">
            <div className="blog-section-heading blog-section-heading-clean compact">
              <div>
                <p className="eyebrow">From the journal</p>
                <h2 id="latest-heading">Small workflows, useful momentum.</h2>
              </div>
              <p>Short, focused guides for research, scripting, subtitles, and content repurposing.</p>
            </div>
            <div className="blog-grid">
              {supportingPosts.map((post, index) => (
                <article className={`blog-card blog-card-${post.accent}`} key={post.slug}>
                  <Link href={`/blog/${post.slug}`} className="blog-card-art" aria-label={`Open ${post.title}`}>
                    <img src={post.imageUrl} alt={post.imageAlt} loading="lazy" />
                    <span className="blog-card-number">{String(index + 2).padStart(2, "0")}</span>
                  </Link>
                  <div className="blog-card-top"><span className="post-category">{post.category}</span></div>
                  <div className="blog-card-body">
                    <h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3>
                    <p>{post.excerpt}</p>
                  </div>
                  <div className="blog-card-footer"><span>{post.date}</span><span className="read-time"><Clock3 size={13} /> {post.readTime}</span><Link href={`/blog/${post.slug}`} aria-label={`Read ${post.title}`}>Read more <ArrowRight size={14} /></Link></div>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </SiteShell>
  );
}
