import { findBlogPost } from "../pages/blogData";

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
const DEFAULT_DESCRIPTION = "Extract, search, and download public YouTube video transcripts instantly in TXT, JSON, or SRT format. Free, fast, and no account required.";

const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  description: "A YouTube video to transcript and YouTube video transcript generator that turns YouTube captions into searchable, exportable text.",
  featureList: ["YouTube to transcript conversion", "Plain-text transcript reader", "TXT, JSON, and SRT exports", "Browser-local history"],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Which YouTube links work?", acceptedAnswer: { "@type": "Answer", text: "TubeTranscriber accepts standard YouTube watch links, youtu.be links, Shorts, embed URLs, and YouTube video IDs when captions are exposed by YouTube." } },
    { "@type": "Question", name: "Does TubeTranscriber require an account?", acceptedAnswer: { "@type": "Answer", text: "No. Recent transcript lookups are stored only in the current browser and can be cleared at any time." } },
    { "@type": "Question", name: "Why is a transcript not found?", acceptedAnswer: { "@type": "Answer", text: "A transcript exists only when YouTube exposes captions for that public video." } },
  ],
};

export function getHeadMeta(url: string): HeadMeta {
  const path = (url.split("?")[0].replace(/\/+$/, "") || "/").toLowerCase();
  if (path === "/") return { title: "YouTube to Transcript Generator | TubeTranscriber", description: DEFAULT_DESCRIPTION, canonicalPath: "/", ogTitle: "YouTube to Transcript Generator | TubeTranscriber", ogDescription: "Extract, search, and download public YouTube video transcripts instantly in TXT, JSON, or SRT format. Free and instant.", ogType: "website", twitterCard: "summary_large_image", jsonLd: webApplicationSchema };
  if (path === "/about") return { title: "About, FAQ, and Caption Guide | TubeTranscriber", description: "Learn how TubeTranscriber reads YouTube captions, stores history in your browser, and offers readable text exports.", canonicalPath: "/about", jsonLd: faqSchema };
  if (path === "/privacy") return { title: "Privacy Policy | TubeTranscriber", description: "Read TubeTranscriber’s privacy policy for browser-local history, public video links, and product analytics.", canonicalPath: "/privacy" };
  if (path === "/terms") return { title: "Terms of Service | TubeTranscriber", description: "Read the TubeTranscriber terms for responsible use of public video captions and transcript exports.", canonicalPath: "/terms" };
  if (path === "/copyright") return { title: "Copyright and DMCA | TubeTranscriber", description: "Learn about copyright responsibilities, creator rights, and DMCA concerns when using TubeTranscriber.", canonicalPath: "/copyright" };
  if (path === "/contact") return { title: "Contact TubeTranscriber", description: "Contact TubeTranscriber for support, privacy questions, product feedback, and copyright concerns.", canonicalPath: "/contact" };
  if (path === "/history") return { title: "Local Transcript History | TubeTranscriber", description: "View transcript lookups saved privately in this browser.", noindex: true };
  if (path === "/transcript") return { title: "YouTube Transcript Reader | TubeTranscriber", description: "Read, search, copy, and export a YouTube transcript.", noindex: true };
  if (path === "/speed-test") return { title: "YouTube Upload Speed Test | TubeTranscriber", description: "Measure upload speed and estimate YouTube video upload times for 1080p, 4K, and custom creator video files.", canonicalPath: "/speed-test" };
  if (path.startsWith("/blog/")) {
    const post = findBlogPost(path.slice("/blog/".length));
    if (post) return { title: `${post.title} | TubeTranscriber`, description: post.seoDescription, canonicalPath: path, jsonLd: { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.seoDescription, articleSection: post.category, datePublished: post.date, image: post.imageUrl } };
  }
  return { title: `Page Not Found | ${SITE}`, description: DEFAULT_DESCRIPTION, notFound: true, noindex: true };
}

export const seoDefaults = { SITE, DEFAULT_DESCRIPTION };
