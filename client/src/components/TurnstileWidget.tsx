import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback?: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
        theme?: "light" | "dark" | "auto";
      }) => string;
      reset: (widgetId?: string) => void;
    };
    __CF_TURNSTILE_SITE_KEY__?: string;
  }
}

const TOKEN_STORAGE_KEY = "tubetranscriber-turnstile-token";

export function getTurnstileToken() {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveTurnstileToken(token: string) {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Storage can be unavailable in privacy-restricted browsers; the callback remains valid for the page.
  }
}

export function clearTurnstileToken() {
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage restrictions.
  }
}

export default function TurnstileWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const siteKey = window.__CF_TURNSTILE_SITE_KEY__?.trim();
    if (!siteKey || !containerRef.current) return;

    let cancelled = false;
    let timer: number | undefined;

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return false;
      if (containerRef.current.childElementCount > 0) return true;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "auto",
        callback: saveTurnstileToken,
        "expired-callback": clearTurnstileToken,
        "error-callback": clearTurnstileToken,
      });
      return true;
    };

    if (!renderWidget()) {
      timer = window.setInterval(() => {
        if (renderWidget() && timer) window.clearInterval(timer);
      }, 100);
    }

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, []);

  if (typeof window === "undefined" || !window.__CF_TURNSTILE_SITE_KEY__) return null;

  return (
    <div className="turnstile-area" aria-label="Security verification">
      <div ref={containerRef} />
      <p className="turnstile-help">Complete the quick security check before extracting captions.</p>
    </div>
  );
}
