import { findBlogPost } from "../pages/blogData";
import { findPseoPage, type PseoPage } from "../pages/pseoData";

export type HeadMeta = {
  title: string;
  description: string;
  canonicalPath?: string;
  noindex?: boolean;
  notFound?: boolean;
  jsonLd?: Record<string, unknown>;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  twitterCard?: string;
};

const SITE = "TubeTranscriber";
const SITE_URL = "https://tubetranscriber.com";
const DEFAULT_DESCRIPTION = "Free YouTube transcript generator to download SRT, JSON, and TXT files from public video captions. Search, copy, and export with no registration required.";

const softwareApplication = {
  "@type": "SoftwareApplication",
  name: SITE,
  url: SITE_URL,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
  description: "A free YouTube caption extraction tool for searchable transcript text, TXT, JSON, and SRT workflows.",
};

const howTo = {
  "@type": "HowTo",
  name: "How to extract a YouTube transcript",
  description: "Use available public YouTube captions as a searchable working document in three simple steps.",
  totalTime: "PT1M",
  step: [
    { "@type": "HowToStep", name: "Paste a public YouTube link", text: "Paste a standard YouTube URL, Shorts link, embed link, or eleven-character video ID." },
    { "@type": "HowToStep", name: "Read the available captions", text: "TubeTranscriber organizes the public caption track into continuous, searchable transcript text." },
    { "@type": "HowToStep", name: "Download the working document", text: "Copy the text or download TXT, JSON, or SRT based on the next step in your workflow." },
  ],
};

const faq = {
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Is YouTube transcript extraction free?", acceptedAnswer: { "@type": "Answer", text: "Yes. TubeTranscriber is free to use and does not require an account, but the source video must expose public captions." } },
    { "@type": "Question", name: "Can I extract captions from every YouTube video?", acceptedAnswer: { "@type": "Answer", text: "No. A public video can still have captions disabled or unavailable. TubeTranscriber can work only with caption tracks that YouTube exposes." } },
    { "@type": "Question", name: "Which transcript formats are available?", acceptedAnswer: { "@type": "Answer", text: "You can read and copy the transcript, or download it as plain TXT, structured JSON, or timed SRT captions." } },
  ],
};

function breadcrumb(path: string, label: string) {
  const parts = path.split("/").filter(Boolean);
  const items = [{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` }];
  items.push({ "@type": "ListItem", position: 2, name: label, item: `${SITE_URL}${path}` });
  return { "@type": "BreadcrumbList", itemListElement: items };
}

function homeSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { ...softwareApplication, "@id": `${SITE_URL}/#software` },
      { ...howTo, "@id": `${SITE_URL}/#how-to` },
      { ...faq, "@id": `${SITE_URL}/#faq` },
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE, url: SITE_URL, description: DEFAULT_DESCRIPTION },
    ],
  };
}

function pseoSchema(page: PseoPage) {
  const canonical = `${SITE_URL}${page.path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      { ...softwareApplication, "@id": `${SITE_URL}/#software` },
      { "@type": "WebPage", "@id": canonical, name: page.title, url: canonical, description: page.description, isPartOf: { "@id": `${SITE_URL}/#website` } },
      { ...howTo, "@id": `${canonical}#how-to`, name: `How to ${page.keyword}`, description: page.intro },
      { ...faq, "@id": `${canonical}#faq` },
      breadcrumb(page.path, page.title),
    ],
  };
}

function blogIndexSchema() {
  const canonical = `${SITE_URL}/blog`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": canonical, name: "TubeTranscriber Blog", url: canonical, description: "Practical guides for YouTube caption extraction, SRT generation, and creator workflows." },
      breadcrumb("/blog", "Blog"),
    ],
  };
}

export function getHeadMeta(url: string): HeadMeta {
  const path = (url.split("?")[0].replace(/\/+$/, "") || "/").toLowerCase();
  const pseo = findPseoPage(path);
  if (path === "/") return { title: "Free YouTube Transcript Generator | Download SRT, JSON & TXT", description: DEFAULT_DESCRIPTION, canonicalPath: "/", ogTitle: "Free YouTube Transcript Generator | Download SRT, JSON & TXT", ogDescription: DEFAULT_DESCRIPTION, ogType: "website", twitterCard: "summary_large_image", jsonLd: homeSchema() };
  if (pseo) return { title: `${pseo.title} | TubeTranscriber`, description: pseo.description, canonicalPath: pseo.path, ogTitle: `${pseo.title} | TubeTranscriber`, ogDescription: pseo.description, ogType: "website", jsonLd: pseoSchema(pseo) };
  if (path === "/blog") return { title: "TubeTranscriber Blog", description: "Explore practical guides, tutorials, and tips on converting YouTube video captions into clean text, JSON, and SRT files for creators.", canonicalPath: "/blog", ogType: "website", jsonLd: blogIndexSchema() };
  if (path === "/about") return { title: "About, FAQ, and Caption Guide | TubeTranscriber", description: "Learn how TubeTranscriber reads YouTube captions, stores history in your browser, and offers readable text exports.", canonicalPath: "/about", jsonLd: faq };
  if (path === "/privacy") return { title: "Privacy Policy | TubeTranscriber", description: "Read TubeTranscriber’s privacy policy for browser-local history, public video links, and product analytics.", canonicalPath: "/privacy", noindex: true };
  if (path === "/terms") return { title: "Terms of Service | TubeTranscriber", description: "Read the TubeTranscriber terms for responsible use of public video captions and transcript exports.", canonicalPath: "/terms" };
  if (path === "/copyright") return { title: "Copyright and DMCA | TubeTranscriber", description: "Learn about copyright responsibilities, creator rights, and DMCA concerns when using TubeTranscriber.", canonicalPath: "/copyright" };
  if (path === "/contact") return { title: "Contact TubeTranscriber", description: "Contact TubeTranscriber for support, privacy questions, product feedback, and copyright concerns.", canonicalPath: "/contact", noindex: true };
  if (path === "/history") return { title: "Local Transcript History | TubeTranscriber", description: "View transcript lookups saved privately in this browser.", noindex: true };
  if (path === "/transcript") return { title: "YouTube Transcript Reader | TubeTranscriber", description: "Read, search, copy, and export a YouTube transcript.", noindex: true };
  if (path === "/speed-test") return { title: "YouTube Upload Speed Test | TubeTranscriber", description: "Measure upload speed and estimate YouTube video upload times for 1080p, 4K, and custom creator video files.", canonicalPath: "/speed-test" };
  if (path.startsWith("/blog/")) {
    const post = findBlogPost(path.slice("/blog/".length));
    if (post) {
      const canonical = `${SITE_URL}${path}`;
      return { title: `${post.title} | TubeTranscriber`, description: post.seoDescription, canonicalPath: path, ogType: "article", jsonLd: { "@context": "https://schema.org", "@graph": [{ "@type": "BlogPosting", "@id": canonical, headline: post.title, description: post.seoDescription, articleSection: post.category, datePublished: post.date, image: `${SITE_URL}${post.imageUrl}`, mainEntityOfPage: canonical }, breadcrumb(path, post.title)] } };
    }
  }
  return { title: `Page Not Found | ${SITE}`, description: DEFAULT_DESCRIPTION, notFound: true, noindex: true };
}

export const seoDefaults = { SITE, DEFAULT_DESCRIPTION };
