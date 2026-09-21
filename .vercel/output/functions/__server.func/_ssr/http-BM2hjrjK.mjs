import { i as USER_AGENT } from "./rolldown-runtime-D7D4PA-g.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/http-BM2hjrjK.js
function mergeCookies(existing, setCookies) {
	const map = /* @__PURE__ */ new Map();
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
async function fetchText(url, init = {}) {
	const { timeoutMs = 18e3, cookies = [], ...rest } = init;
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const headers = new Headers(rest.headers);
		if (!headers.has("user-agent")) headers.set("user-agent", USER_AGENT);
		if (!headers.has("accept-language")) headers.set("accept-language", "ko-KR,ko;q=0.9,en;q=0.8");
		if (cookies.length && !headers.has("cookie")) headers.set("cookie", cookies.join("; "));
		const response = await fetch(url, {
			...rest,
			headers,
			signal: controller.signal,
			redirect: rest.redirect ?? "follow"
		});
		const text = await response.text();
		const setCookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
		return {
			ok: response.ok,
			status: response.status,
			text,
			cookies: mergeCookies(cookies, setCookies),
			url: response.url
		};
	} finally {
		clearTimeout(timer);
	}
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function jitterDelay(min = 250, max = 700) {
	const span = Math.max(0, max - min);
	return sleep(min + Math.random() * span);
}
function extractCsrf(html) {
	const meta = html.match(/_csrf"\s+content\s*=\s*"([^"]+)"/i);
	if (meta?.[1]) return meta[1];
	return html.match(/name="_csrf"[^>]*value="([^"]+)"/i)?.[1] ?? null;
}
//#endregion
export { fetchText as n, jitterDelay as r, extractCsrf as t };
