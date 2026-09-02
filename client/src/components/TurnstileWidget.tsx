import { useEffect, useId, useRef, useState } from "react";

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
      remove?: (widgetId?: string) => void;
      execute?: (widgetId?: string) => void;
      ready?: (callback: () => void) => void;
    };
    __CF_TURNSTILE_SITE_KEY__?: string;
  }
}

export const TURNSTILE_HARD_TIMEOUT_MS = 20_000;
const TOKEN_STORAGE_KEY = "tubetranscriber-turnstile-token";
type TokenListener = (token: string) => void;
const tokenListeners = new Set<TokenListener>();
type TurnstileFailureReason = "error" | "timeout" | "expired";
type FailureListener = (reason: TurnstileFailureReason) => void;
const failureListeners = new Set<FailureListener>();
const renderedWidgetIds = new Set<string>();
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

export function onTurnstileFailure(listener: FailureListener) {
  failureListeners.add(listener);
  return () => failureListeners.delete(listener);
}

function notifyTurnstileFailure(reason: TurnstileFailureReason) {
  failureListeners.forEach(listener => listener(reason));
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
  const turnstileId = useId();
  const [mounted, setMounted] = useState(false);
  const containerId = `tubetranscriber-turnstile-widget-${turnstileId.replace(/:/g, "")}`;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const siteKey = window.__CF_TURNSTILE_SITE_KEY__?.trim();
    if (!siteKey || !containerRef.current) return;

    let cancelled = false;
    let timer: number | undefined;
    let retryTimer: number | undefined;
    let renderRequested = false;
    let automaticRetries = 0;

    const handleFailure = (reason: TurnstileFailureReason) => {
      clearTurnstileToken();
      if (cancelled) return;
      if (automaticRetries >= 1 || !widgetIdRef.current || !window.turnstile) {
        notifyTurnstileFailure(reason);
        return;
      }
      automaticRetries += 1;
      try {
        window.turnstile.reset(widgetIdRef.current);
        retryTimer = window.setTimeout(() => {
          if (!cancelled && widgetIdRef.current) window.turnstile?.execute?.(widgetIdRef.current);
        }, 250);
      } catch {
        notifyTurnstileFailure(reason);
      }
    };

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return false;
      if (widgetIdRef.current || renderRequested || containerRef.current.childElementCount > 0) return true;
      renderRequested = true;
      const render = () => {
        if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
        try {
          widgetIdRef.current = window.turnstile.render(`#${containerId}`, {
            sitekey: siteKey,
            theme: "auto",
            execution: "execute",
            callback: saveTurnstileToken,
            "expired-callback": () => handleFailure("expired"),
            "error-callback": () => handleFailure("error"),
            "timeout-callback": () => handleFailure("timeout"),
          });
          renderedWidgetIds.add(widgetIdRef.current);
          renderedWidgetId = widgetIdRef.current;
          window.turnstile.execute?.(widgetIdRef.current);
        } catch {
          renderRequested = false;
          notifyTurnstileFailure("error");
        }
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
      if (retryTimer) window.clearTimeout(retryTimer);
      const widgetId = widgetIdRef.current;
      if (widgetId) {
        renderedWidgetIds.delete(widgetId);
        try { window.turnstile?.remove?.(widgetId); } catch { /* Widget may already be gone. */ }
        if (renderedWidgetId === widgetId) renderedWidgetId = Array.from(renderedWidgetIds).at(-1);
      }
      widgetIdRef.current = undefined;
    };
  }, [containerId, mounted]);

  if (!mounted || typeof window === "undefined" || !window.__CF_TURNSTILE_SITE_KEY__) return null;

  return (
    <div className="turnstile-area" aria-label="Security verification">
      <div id={containerId} ref={containerRef} />
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
