import { USER_AGENT } from "../config.ts";

export type FetchResult = {
  ok: boolean;
  status: number;
  text: string;
  cookies: string[];
  url: string;
};

function mergeCookies(existing: string[], setCookies: string[]): string[] {
  const map = new Map<string, string>();
  for (const cookie of existing) {
    const name = cookie.split("=")[0];
    if (name) map.set(name, cookie);
  }
  for (const header of setCookies) {
    const pair = header.split(";")[0]?.trim();
    if (!pair) continue;
    const name = pair.split("=")[0];
    if (name) map.set(name, pair);
  }
  return [...map.values()];
}

export async function fetchText(
  url: string,
  init: RequestInit & { timeoutMs?: number; cookies?: string[] } = {},
): Promise<FetchResult> {
  const { timeoutMs = 18_000, cookies = [], ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = new Headers(rest.headers);
    if (!headers.has("user-agent")) headers.set("user-agent", USER_AGENT);
    if (!headers.has("accept-language")) {
      headers.set("accept-language", "ko-KR,ko;q=0.9,en;q=0.8");
    }
    if (cookies.length && !headers.has("cookie")) {
      headers.set("cookie", cookies.join("; "));
    }
    const response = await fetch(url, {
      ...rest,
      headers,
      signal: controller.signal,
      redirect: rest.redirect ?? "follow",
    });
    const text = await response.text();
    const setCookies =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [];
    return {
      ok: response.ok,
      status: response.status,
      text,
      cookies: mergeCookies(cookies, setCookies),
      url: response.url,
    };
  } finally {
    clearTimeout(timer);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function jitterDelay(min = 250, max = 700): Promise<void> {
  const span = Math.max(0, max - min);
  return sleep(min + Math.random() * span);
}

export function extractCsrf(html: string): string | null {
  const meta = html.match(/_csrf"\s+content\s*=\s*"([^"]+)"/i);
  if (meta?.[1]) return meta[1];
  const input = html.match(/name="_csrf"[^>]*value="([^"]+)"/i);
  return input?.[1] ?? null;
}
