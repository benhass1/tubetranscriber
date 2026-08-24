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
    description: "Extract, search, and download public YouTube video transcripts instantly in TXT, JSON, or SRT format. Free, fast, and no account required.",
  },
  "/history": {
    title: "Local Transcript History",
    description: "Re-open recent TubeTranscriber lookups stored privately in your browser and return to public YouTube transcript work without an account today.",
  },
  "/about": {
    title: "About, FAQ, and Caption Guide",
    description: "Learn how TubeTranscriber turns YouTube captions into searchable transcript text and practical TXT, JSON, or SRT files for creators and teams.",
  },
  "/blog": {
    title: "TubeTranscriber Blog",
    description: "Explore practical guides, tutorials, and tips on converting YouTube video captions into clean text, JSON, and SRT files for creators and teams.",
  },
  "/transcript": {
    title: "YouTube Transcript Reader",
    description: "Read, search, copy, and download captions for a public YouTube video as a clean transcript in TXT, JSON, or SRT format for creators and teams.",
  },
  "/privacy": { title: "Privacy Policy", description: "Read how TubeTranscriber handles browser-local transcript history, public YouTube links, caption data, analytics, and privacy-conscious changes.", },
  "/terms": { title: "Terms of Service", description: "Review the terms for using TubeTranscriber to read and work with public YouTube captions and exported transcript files responsibly and with care.", },
  "/copyright": { title: "Copyright and DMCA", description: "Understand copyright guidance for transcripts and captions handled through TubeTranscriber, including creator rights and good-faith concerns.", },
  "/contact": { title: "Contact", description: "Contact TubeTranscriber with questions about the service, transcript workflows, public caption access, or copyright concerns and requests when needed.", },
};

const postMetaDescriptions: Record<string, string> = {
  "extract-download-youtube-transcripts": "Learn how to extract public YouTube transcripts quickly, search captions, and download clean TXT, JSON, or SRT files for research and content workflows.",
  "convert-youtube-videos-to-srt": "Convert YouTube captions into SRT subtitles with timing intact, then move the file into your video editing workflow with less manual cleanup.",
  "youtube-transcripts-content-creation": "Discover five practical ways to use YouTube transcripts for research, repurposing, theme comparison, content outlines, and faster team review workflows.",
};

function getPageCopy(path: string) {
  const post = path.startsWith("/blog/") ? findBlogPost(path.slice("/blog/".length)) : undefined;
  const copy = pageCopy[path] ?? (post ? { title: post.title, description: postMetaDescriptions[post.slug] ?? post.excerpt } : pageCopy["/"]!);
  return { post, copy };
}

function upsertMeta(name: string, content: string, attribute: "name" | "property" = "name") {
  const selector = `meta[${attribute}="${name}"]`;
  const elements = Array.from(document.head.querySelectorAll<HTMLMetaElement>(selector));
  const element = elements.shift() ?? document.createElement("meta");
  elements.forEach(item => item.remove());
  if (!element.parentElement) {
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.content = content;
}

function upsertCanonical(url: string) {
  const elements = Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'));
  const element = elements.shift() ?? document.createElement("link");
  elements.forEach(item => item.remove());
  if (!element.parentElement) {
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = url;
}

function buildSchema(path: string, canonical: string) {
  const { post, copy } = getPageCopy(path);
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
        description: copy.description,
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
  const { post, copy } = getPageCopy(path);

  useEffect(() => {
    document.title = `${copy.title} | TubeTranscriber`;
    upsertMeta("description", copy.description);
    upsertMeta("revised", MODIFIED_DATE);
    const ogTitle = path === "/" ? "YouTube to Transcript Generator | TubeTranscriber" : copy.title;
    const ogDescription = path === "/" ? "Extract, search, and download public YouTube video transcripts instantly in TXT, JSON, or SRT format. Free and instant." : copy.description;
    upsertMeta("og:title", ogTitle, "property");
    upsertMeta("og:description", ogDescription, "property");
    upsertMeta("og:url", canonical, "property");
    upsertMeta("og:type", post ? "article" : "website", "property");
    upsertMeta("twitter:card", "summary_large_image", "name");
    upsertMeta("twitter:title", ogTitle, "name");
    upsertMeta("twitter:description", ogDescription, "name");
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
