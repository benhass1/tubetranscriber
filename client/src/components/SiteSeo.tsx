import { useEffect } from "react";
import { useLocation } from "wouter";
import { getHeadMeta } from "@/ssr/seo";

const MODIFIED_DATE = "2026-08-27";

function upsertMeta(name: string, content: string, attribute: "name" | "property" = "name") {
  const selector = `meta[${attribute}="${name}"]`;
  const elements = Array.from(document.head.querySelectorAll<HTMLMetaElement>(selector));
  const element = elements.shift() ?? document.createElement("meta");
  elements.forEach((item) => item.remove());
  if (!element.parentElement) {
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.content = content;
}

function upsertCanonical(url: string) {
  const elements = Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'));
  const element = elements.shift() ?? document.createElement("link");
  elements.forEach((item) => item.remove());
  if (!element.parentElement) {
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = url;
}

export default function SiteSeo() {
  const [location] = useLocation();
  const path = location.split("?")[0] || "/";
  const canonical = `https://tubetranscriber.com${path === "/" ? "/" : path}`;

  useEffect(() => {
    const head = getHeadMeta(location);
    const ogTitle = head.ogTitle || head.title;
    const ogDescription = head.ogDescription || head.description;
    document.title = head.title;
    upsertMeta("description", head.description);
    upsertMeta("revised", MODIFIED_DATE);
    upsertMeta("og:title", ogTitle, "property");
    upsertMeta("og:description", ogDescription, "property");
    upsertMeta("og:url", canonical, "property");
    upsertMeta("og:type", head.ogType || "website", "property");
    upsertMeta("twitter:card", head.twitterCard || "summary_large_image", "name");
    upsertMeta("twitter:title", ogTitle, "name");
    upsertMeta("twitter:description", ogDescription, "name");
    upsertCanonical(canonical);

    let script = document.head.querySelector<HTMLScriptElement>("#tube-transcriber-jsonld");
    if (!script) {
      script = document.createElement("script");
      script.id = "tube-transcriber-jsonld";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = head.jsonLd ? JSON.stringify(head.jsonLd) : "";
  }, [canonical, location]);

  return null;
}
