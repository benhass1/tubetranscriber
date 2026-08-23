import { useEffect } from "react";
import { useLocation } from "wouter";
import { findBlogPost } from "@/pages/blogData";

const SITE_URL = "https://tubetranscriber.com";
const MODIFIED_DATE = "2026-08-23";
const AUTHOR_NAME = "TubeTranscriber Team";
const TEAM_NAME = "TubeTranscriber Engineering Team";
const LOGO_URL = `${SITE_URL}/favicon.svg`;
const SAME_AS = [
  "https://github.com/benhass1/tubetranscriber",
  "https://x.com/tubetranscriber",
  "https://www.linkedin.com/company/tubetranscriber",
  "https://www.youtube.com/@TubeTranscriber",
];

const organization = {
  "@type": "Organization",
  name: "TubeTranscriber",
  url: SITE_URL,
  logo: LOGO_URL,
  sameAs: SAME_AS,
};

const publisher = {
  "@type": "Organization",
  name: "TubeTranscriber",
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: LOGO_URL },
};

const pageCopy: Record<string, { title: string; description: string }> = {
  "/": {
    title: "YouTube to Transcript Generator",
    description: "Extract available YouTube captions, search the transcript, and download TXT, JSON, or SRT files with TubeTranscriber.",
  },
  "/history": {
    title: "Local Transcript History",
    description: "Re-open recent TubeTranscriber lookups stored privately in your browser.",
  },
  "/about": {
    title: "About, FAQ, and Caption Guide",
    description: "Learn how TubeTranscriber turns available YouTube captions into readable, searchable transcript files.",
  },
  "/blog": {
    title: "TubeTranscriber Blog",
    description: "Guides, workflow tips, and updates on video transcript extraction, caption formats, and content creation.",
  },
  "/transcript": {
    title: "YouTube Transcript Reader",
    description: "Read, search, copy, and download the available captions for a public YouTube video.",
  },
  "/privacy": { title: "Privacy Policy", description: "How TubeTranscriber handles browser-local transcript history and public video requests." },
  "/terms": { title: "Terms of Service", description: "Terms for using TubeTranscriber to read and work with publicly available captions." },
  "/copyright": { title: "Copyright and DMCA", description: "Copyright guidance for transcripts and captions handled through TubeTranscriber." },
  "/contact": { title: "Contact", description: "Contact information for TubeTranscriber questions and copyright concerns." },
};

function upsertMeta(name: string, content: string, attribute: "name" | "property" = "name") {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.content = content;
}

function upsertCanonical(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = url;
}

function buildSchema(path: string, canonical: string) {
  const post = path.startsWith("/blog/") ? findBlogPost(path.slice("/blog/".length)) : undefined;
  const copy = pageCopy[path] ?? (post ? { title: post.title, description: post.excerpt } : pageCopy["/"]);
  const website = {
    "@type": "WebSite",
    name: "TubeTranscriber",
    url: SITE_URL,
    description: pageCopy["/"]!.description,
    author: { "@type": "Organization", name: AUTHOR_NAME, url: SITE_URL },
    publisher,
    datePublished: "2026-08-12",
    dateModified: MODIFIED_DATE,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?url={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const page = post
    ? {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        url: canonical,
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
        articleSection: post.category,
        author: { "@type": "Organization", name: AUTHOR_NAME, url: SITE_URL },
        publisher,
        datePublished: new Date(post.date).toISOString().slice(0, 10),
        dateModified: MODIFIED_DATE,
        image: LOGO_URL,
      }
    : {
        "@type": path === "/blog" ? "CollectionPage" : "WebPage",
        name: copy.title,
        description: copy.description,
        url: canonical,
        isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website` },
        author: { "@type": "Organization", name: AUTHOR_NAME, url: SITE_URL },
        publisher,
        datePublished: path === "/blog" ? "2026-08-12" : "2026-08-23",
        dateModified: MODIFIED_DATE,
      };

  return {
    "@context": "https://schema.org",
    "@graph": [
      { ...organization, "@id": `${SITE_URL}/#organization` },
      { ...website, "@id": `${SITE_URL}/#website` },
      page,
    ],
  };
}

export default function SiteSeo() {
  const [location] = useLocation();
  const path = location.split("?")[0] || "/";
  const canonical = `${SITE_URL}${path === "/" ? "/" : path}`;
  const post = path.startsWith("/blog/") ? findBlogPost(path.slice("/blog/".length)) : undefined;
  const copy = pageCopy[path] ?? (post ? { title: post.title, description: post.excerpt } : pageCopy["/"]);

  useEffect(() => {
    document.title = `${copy.title} | TubeTranscriber`;
    upsertMeta("description", copy.description);
    upsertMeta("revised", MODIFIED_DATE);
    upsertMeta("og:title", copy.title, "property");
    upsertMeta("og:description", copy.description, "property");
    upsertMeta("og:url", canonical, "property");
    upsertMeta("og:type", post ? "article" : "website", "property");
    upsertMeta("twitter:card", "summary", "name");
    upsertMeta("twitter:title", copy.title, "name");
    upsertMeta("twitter:description", copy.description, "name");
    upsertCanonical(canonical);

    let script = document.head.querySelector<HTMLScriptElement>('#tube-transcriber-jsonld');
    if (!script) {
      script = document.createElement("script");
      script.id = "tube-transcriber-jsonld";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(buildSchema(path, canonical));
  }, [canonical, copy.description, copy.title, path, post]);

  return null;
}
