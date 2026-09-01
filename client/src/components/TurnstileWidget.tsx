import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string, options: {
        sitekey: string;
        callback?: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
        "timeout-callback"?: () => void;
        execution?: "render" | "execute";
        theme?: "light" | "dark" | "auto";
      }) => string;
      reset: (widgetId?: string) => void;
      execute?: (widgetId?: string) => void;
      ready?: (callback: () => void) => void;
    };
    __CF_TURNSTILE_SITE_KEY__?: string;
  }
}

const TOKEN_STORAGE_KEY = "tubetranscriber-turnstile-token";
type TokenListener = (token: string) => void;
const tokenListeners = new Set<TokenListener>();
let renderedWidgetId: string | undefined;

export function getTurnstileToken() {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveTurnstileToken(token: string) {
  const normalized = token.trim();
  if (!normalized) return;
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, normalized);
  } catch {
    // Storage can be unavailable in privacy-restricted browsers; the callback remains valid for the page.
  }
  tokenListeners.forEach(listener => listener(normalized));
}

export function onTurnstileToken(listener: TokenListener) {
  tokenListeners.add(listener);
  const current = getTurnstileToken().trim();
  if (current) listener(current);
  return () => tokenListeners.delete(listener);
}

export function clearTurnstileToken() {
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage restrictions.
  }
}

export function resetTurnstileWidget() {
  clearTurnstileToken();
  try {
    if (renderedWidgetId && window.turnstile) window.turnstile.reset(renderedWidgetId);
  } catch {
    // A widget can already be unmounted while a request is settling.
  }
}

/** Clears the one-shot token and explicitly starts a new invisible verification. */
export function requestFreshTurnstileToken() {
  clearTurnstileToken();
  try {
    if (!renderedWidgetId || !window.turnstile) return;
    window.turnstile.reset(renderedWidgetId);
    window.turnstile.execute?.(renderedWidgetId);
  } catch {
    // The widget may still be mounting; its effect will execute it once ready.
  }
}

export default function TurnstileWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const containerIdRef = useRef("tubetranscriber-turnstile-widget");

  useEffect(() => {
    const siteKey = window.__CF_TURNSTILE_SITE_KEY__?.trim();
    if (!siteKey || !containerRef.current) return;

    let cancelled = false;
    let timer: number | undefined;

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return false;
      if (containerRef.current.childElementCount > 0) return true;
      const render = () => {
        if (cancelled || !containerRef.current || !window.turnstile || containerRef.current.childElementCount > 0) return;
        widgetIdRef.current = window.turnstile.render(`#${containerRef.current.id}`, {
          sitekey: siteKey,
          theme: "auto",
          execution: "execute",
          callback: saveTurnstileToken,
          "expired-callback": clearTurnstileToken,
          "error-callback": clearTurnstileToken,
          "timeout-callback": clearTurnstileToken,
        });
        renderedWidgetId = widgetIdRef.current;
        window.turnstile.execute?.(widgetIdRef.current);
      };
      if (window.turnstile.ready) window.turnstile.ready(render);
      else render();
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
      if (renderedWidgetId === widgetIdRef.current) renderedWidgetId = undefined;
    };
  }, []);

  if (typeof window === "undefined" || !window.__CF_TURNSTILE_SITE_KEY__) return null;

  return (
    <div className="turnstile-area" aria-label="Security verification">
      <div id={containerIdRef.current} ref={containerRef} />
      <p className="turnstile-help">Complete the quick security check before extracting captions.</p>
    </div>
  );
}

export { TOKEN_STORAGE_KEY };

type TokenReader = () => string;
type TokenSubscription = (listener: TokenListener) => () => void;

/** Starts exactly one attempt immediately or after the next valid Turnstile token. */
export function startWhenTurnstileTokenAvailable(
  readToken: TokenReader,
  subscribe: TokenSubscription,
  attempt: () => void,
) {
  let started = false;
  let active = true;

  const start = (token: string) => {
    if (!active || started || !token.trim()) return;
    started = true;
    attempt();
  };

  const current = readToken().trim();
  if (current) start(current);
  const unsubscribe = subscribe(start);

  return () => {
    active = false;
    unsubscribe();
  };
}
