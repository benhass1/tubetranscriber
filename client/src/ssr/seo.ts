export type HeadMeta = {
  title: string;
  description: string;
  canonicalPath?: string;
  noindex?: boolean;
  notFound?: boolean;
  jsonLd?: Record<string, unknown>;
};

const SITE = "TubeTranscriber";
const DEFAULT_DESCRIPTION = "Convert YouTube videos to accurate transcripts in seconds. Search, copy, and export captions as TXT, JSON, or SRT with TubeTranscriber online.";

const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  description: "A YouTube video to transcript and YouTube video transcript generator that turns available captions into searchable, exportable text.",
  featureList: ["YouTube to transcript conversion", "Plain-text transcript reader", "TXT, JSON, and SRT exports", "Browser-local history"],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Which YouTube links work?", acceptedAnswer: { "@type": "Answer", text: "TubeTranscriber accepts standard YouTube watch links, youtu.be links, Shorts, embed URLs, and YouTube video IDs when captions are available." } },
    { "@type": "Question", name: "Does TubeTranscriber require an account?", acceptedAnswer: { "@type": "Answer", text: "No. Recent transcript lookups are stored only in the current browser and can be cleared at any time." } },
    { "@type": "Question", name: "Why is a transcript unavailable?", acceptedAnswer: { "@type": "Answer", text: "A transcript is available only when YouTube exposes captions for that public video." } },
  ],
};

export function getHeadMeta(url: string): HeadMeta {
  const path = (url.split("?")[0].replace(/\/+$/, "") || "/").toLowerCase();
  if (path === "/") return { title: "YouTube to Transcript Generator | TubeTranscriber", description: DEFAULT_DESCRIPTION, canonicalPath: "/", jsonLd: webApplicationSchema };
  if (path === "/about") return { title: "About, FAQ, and Caption Guide | TubeTranscriber", description: "Learn how TubeTranscriber reads available YouTube captions, stores history in your browser, and offers readable text exports.", canonicalPath: "/about", jsonLd: faqSchema };
  if (path === "/privacy") return { title: "Privacy Policy | TubeTranscriber", description: "Read TubeTranscriber’s privacy policy for browser-local history, public video links, and product analytics.", canonicalPath: "/privacy" };
  if (path === "/terms") return { title: "Terms of Service | TubeTranscriber", description: "Read the TubeTranscriber terms for responsible use of public video captions and transcript exports.", canonicalPath: "/terms" };
  if (path === "/copyright") return { title: "Copyright and DMCA | TubeTranscriber", description: "Learn about copyright responsibilities, creator rights, and DMCA concerns when using TubeTranscriber.", canonicalPath: "/copyright" };
  if (path === "/contact") return { title: "Contact TubeTranscriber", description: "Contact TubeTranscriber for support, privacy questions, product feedback, and copyright concerns.", canonicalPath: "/contact" };
  if (path === "/history") return { title: "Local Transcript History | TubeTranscriber", description: "View transcript lookups saved privately in this browser.", noindex: true };
  if (path === "/transcript") return { title: "YouTube Transcript Reader | TubeTranscriber", description: "Read, search, copy, and export an available YouTube transcript.", noindex: true };
  return { title: `Page Not Found | ${SITE}`, description: DEFAULT_DESCRIPTION, notFound: true, noindex: true };
}

export const seoDefaults = { SITE, DEFAULT_DESCRIPTION };
