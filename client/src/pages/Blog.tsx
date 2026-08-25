import SiteShell from "@/components/SiteShell";
import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { blogPosts, featuredPost } from "./blogData";

const categoryFilters = ["All", "How-to", "Creator workflows", "Writing & scripts", "Research", "Subtitles & exports", "Tools"];

function belongsToCategory(category: string, filter: string) {
  if (filter === "All") return true;
  if (filter === "How-to") return ["How-to", "Getting started", "Tool guide", "Caption basics"].includes(category);
  if (filter === "Creator workflows") return ["Content strategy", "Workflow guide", "Repurposing", "Written content", "Editing workflow", "Retention"].includes(category);
  if (filter === "Writing & scripts") return ["Scriptwriting", "Script audits", "Localization", "Global channels"].includes(category);
  if (filter === "Research") return ["Video research", "Research systems"].includes(category);
  if (filter === "Subtitles & exports") return ["Subtitles", "Exports"].includes(category);
  if (filter === "Tools") return category === "Tool choices";
  return false;
}

export default function Blog() {
  const [activeFilter, setActiveFilter] = useState("All");
  const supportingPosts = blogPosts.filter((post) => post.slug !== featuredPost.slug);
  const filteredPosts = useMemo(() => supportingPosts.filter((post) => belongsToCategory(post.category, activeFilter)), [activeFilter]);
  const showFeatured = activeFilter === "All" || belongsToCategory(featuredPost.category, activeFilter);

  return (
    <SiteShell>
      <div className="blog-page-clean">
        <section className="blog-hero blog-hero-clean blog-hero-reference">
          <div className="content-container blog-hero-inner">
            <p className="eyebrow"><BookOpen size={14} /> The journal</p>
            <h1>YouTube Transcript <span>Blog</span></h1>
            <p className="blog-hero-description">Tips, tutorials, and practical guides on extracting YouTube transcripts, repurposing video content, and building clearer creator workflows.</p>
            <div className="blog-filter-list" aria-label="Filter articles by topic">
              {categoryFilters.map((filter) => (
                <button type="button" key={filter} className={`blog-filter ${activeFilter === filter ? "active" : ""}`} aria-pressed={activeFilter === filter} onClick={() => setActiveFilter(filter)}>{filter}</button>
              ))}
            </div>
          </div>
        </section>

        <main>
          {showFeatured && (
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
          )}

          <section className="blog-section blog-grid-section content-container" aria-labelledby="latest-heading">
            <div className="blog-section-heading blog-section-heading-clean compact">
              <div>
                <p className="eyebrow">From the journal</p>
                <h2 id="latest-heading">{activeFilter === "All" ? "Small workflows, useful momentum." : `${activeFilter} guides.`}</h2>
              </div>
              <p>Short, focused guides for research, scripting, subtitles, and content repurposing.</p>
            </div>
            {filteredPosts.length > 0 ? <div className="blog-grid">
              {filteredPosts.map((post, index) => (
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
            </div> : <p className="blog-filter-empty">No articles are available in this topic yet. Try another filter.</p>}
          </section>
        </main>
      </div>
    </SiteShell>
  );
}
