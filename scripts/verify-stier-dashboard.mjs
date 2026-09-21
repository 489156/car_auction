/**
 * Visual verification harness for the S-Tier Precision Dashboard.
 *
 * Hits http://127.0.0.1:8080 with Playwright Chromium, takes desktop + mobile
 * screenshots, captures console errors, and verifies the new dashboard markers
 * (S-Tier Precision Engine badge, 4 metric cards, 5 precision rules, scan
 * button). Runs against an already-started dev server.
 */
import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = process.env.RADAR_URL ?? "http://127.0.0.1:8080/";
const OUT_DIR = resolve(process.cwd(), "screenshots");
mkdirSync(OUT_DIR, { recursive: true });

// On this Windows box Playwright's headless-shell variant is not installed,
// only the full Chromium binary. Detect any installed chromium-#### and use it.
function findChromium() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_PATH,
    "C:\\Users\\User\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return undefined;
}

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, deviceScaleFactor: 1 },
  { name: "mobile", width: 390, height: 844, deviceScaleFactor: 2 },
];

const REQUIRED_MARKERS = [
  "AuctionCarRadar",
  "S-Tier Precision Engine",
  "총 스캔",
  "S-Tier 매칭",
  "A-Grade 표준",
  "평균 스윗 할인",
  "① 주행거리",
  "② 보증 유효",
  "③ 할인",
  "④ 공인 보관소",
  "⑤ 사고·주행 교차검증",
  "S-Tier 매칭 스캔",
];

const FAILURES = [];
function check(label, ok) {
  if (!ok) FAILURES.push(label);
}

async function auditContext(browser, viewport) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor,
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`console: ${msg.text()}`);
  });

  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(800);

  const html = await page.content();
  for (const marker of REQUIRED_MARKERS) {
    check(`[${viewport.name}] missing marker: ${marker}`, html.includes(marker));
  }

  // Spot-check live elements (don't rely on HTML strings alone).
  const headerVisible = await page.getByRole("heading", { name: /AuctionCarRadar/ }).isVisible();
  check(`[${viewport.name}] header heading visible`, headerVisible);
  const scanBtn = page.getByRole("button", { name: /S-Tier 매칭 스캔/ });
  check(`[${viewport.name}] scan button visible`, await scanBtn.isVisible());

  const file = resolve(OUT_DIR, `stier-dashboard-${viewport.name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await ctx.close();
  return { viewport: viewport.name, consoleErrors, file };
}

(async () => {
  const launchOpts = findChromium() ? { executablePath: findChromium() } : {};
  const browser = await chromium.launch(launchOpts);
  try {
    const results = [];
    for (const vp of VIEWPORTS) {
      results.push(await auditContext(browser, vp));
    }
    const report = {
      baseUrl: BASE_URL,
      chromium: findChromium() ?? "playwright-default",
      timestamp: new Date().toISOString(),
      results,
      passed: FAILURES.length === 0,
      failures: FAILURES,
    };
    console.log(JSON.stringify(report, null, 2));
    if (!report.passed) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();