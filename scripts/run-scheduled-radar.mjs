#!/usr/bin/env node
/**
 * Local/CI scheduled radar runner.
 * Prefer the HTTP cron route in production: GET/POST /api/cron/radar?secret=...
 *
 * Usage:
 *   node --experimental-strip-types scripts/run-scheduled-radar.mjs
 *
 * Env:
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (optional notify)
 *   DATABASE_URL (optional; otherwise PGLite via app helpers may not be available here)
 *   RADAR_BASE_URL + CRON_SECRET — if set, hits the deployed cron endpoint instead
 */
const base = process.env.RADAR_BASE_URL?.replace(/\/$/, "");
const secret = process.env.CRON_SECRET || "";

if (base) {
  const url = `${base}/api/cron/radar${secret ? `?secret=${encodeURIComponent(secret)}` : ""}`;
  const response = await fetch(url, {
    method: "POST",
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
  const text = await response.text();
  console.log(text);
  process.exit(response.ok ? 0 : 1);
}

console.error(
  "Set RADAR_BASE_URL (and optional CRON_SECRET) to call /api/cron/radar, or invoke runScheduledRadar from the running app.",
);
process.exit(2);
