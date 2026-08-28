const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileConfigured() {
  return Boolean(process.env.CF_TURNSTILE_SITE_KEY?.trim() && process.env.CF_TURNSTILE_SECRET_KEY?.trim());
}

export async function verifyTurnstileToken(token: string, remoteIp?: string) {
  const secret = process.env.CF_TURNSTILE_SECRET_KEY?.trim();
  if (!secret || !token.trim()) return false;

  const body = new URLSearchParams({ secret, response: token.trim() });
  if (remoteIp) body.set("remoteip", remoteIp);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.warn("[Turnstile] verification request failed", error instanceof Error ? error.message : "unknown error");
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
