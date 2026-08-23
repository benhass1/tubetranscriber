import SiteShell from "@/components/SiteShell";

type LegalKind = "privacy" | "terms" | "copyright" | "contact";

const content: Record<LegalKind, { eyebrow: string; title: string; intro: string; sections: Array<{ heading: string; body: string }> }> = {
  privacy: {
    eyebrow: "Privacy policy", title: "Your browser, your transcript history.", intro: "This policy explains how TubeTranscriber handles data when you use the public website.",
    sections: [
      { heading: "Browser-local history", body: "Recent video lookups are stored in the local storage of the browser you are using. TubeTranscriber does not require an account to keep this history, and you can delete individual entries or clear all history at any time." },
      { heading: "Video links and captions", body: "When you submit a public YouTube link, the service requests metadata and caption data provided by YouTube needed to produce your transcript. Do not submit links you are not authorized to use." },
      { heading: "Analytics and changes", body: "We may use aggregate, privacy-conscious service analytics to understand site performance. This policy may change as the product evolves; the updated version will always be published on this page." },
    ],
  },
  terms: {
    eyebrow: "Terms of service", title: "Use captions responsibly.", intro: "By using TubeTranscriber, you agree to use the service lawfully and in a manner that respects creators and platform rules.",
    sections: [
      { heading: "Permitted use", body: "TubeTranscriber is provided to help visitors read and work with captions exposed publicly for a YouTube video. You are responsible for confirming that your use of exported material is lawful and authorized." },
      { heading: "Service limits", body: "Caption access depends on YouTube and the original video. We cannot guarantee that every video exposes captions, that a transcript will be complete, or that the service will always be online." },
      { heading: "No affiliation", body: "TubeTranscriber is an independent tool and is not affiliated with, endorsed by, or sponsored by YouTube or Google." },
    ],
  },
  copyright: {
    eyebrow: "Copyright and DMCA", title: "Respect the original work.", intro: "Creators retain their rights in video content and captions. TubeTranscriber does not grant permission to copy, republish, or redistribute anyone else’s work.",
    sections: [
      { heading: "Copyright notice", body: "Exported transcripts may contain copyrighted material. Use them only where you have the required rights, permission, or a lawful basis to do so." },
      { heading: "Copyright concerns", body: "If you believe that TubeTranscriber content or functionality infringes your rights, contact us with the relevant YouTube URL, a description of the concern, and a way to reach you. We will review good-faith reports promptly." },
      { heading: "Creator controls", body: "If captions are not exposed or are restricted by the source platform, TubeTranscriber will not create a transcript from that inaccessible caption track." },
    ],
  },
  contact: {
    eyebrow: "Contact", title: "Questions, feedback, or copyright concerns?", intro: "We welcome reports about the service, accessibility, privacy, and copyright matters.",
    sections: [
      { heading: "General support", body: "For product questions, include the page you were using, the public video link if relevant, and a short description of what happened so the issue can be reproduced." },
      { heading: "Privacy and legal requests", body: "For privacy, terms, or copyright matters, clearly state the nature of your request and provide enough information for us to review it responsibly." },
      { heading: "Reach us", body: "Email support@tubetranscriber.com. Please do not include confidential information in an initial message." },
    ],
  },
};

export default function LegalPage({ kind }: { kind: LegalKind }) {
  const page = content[kind];
  return <SiteShell><section className="legal-page content-container"><p className="eyebrow">{page.eyebrow}</p><h1>{page.title}</h1><p className="legal-intro">{page.intro}</p><div className="legal-sections">{page.sections.map(section => <section key={section.heading}><h2>{section.heading}</h2><p>{section.body}</p></section>)}</div></section></SiteShell>;
}
