/**
 * Interaction verification for the S-Tier Precision Dashboard.
 *
 * Walks the user flow:
 *  - load homepage (post-style dashboard)
 *  - click "S-Tier 매칭 스캔" → scan modal opens, animates through progress
 *  - click "실제 스캔 실행" → server scan runs, listings table populates
 *  - click bell icon → notification drawer opens
 *  - click "알림 규칙" → settings modal opens
 *  - click first listing row → detail modal opens
 *
 * Captures console errors and screenshots each step. Designed to fail loudly
 * if a modal does not render or a click does not register.
 */
import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = process.env.RADAR_URL ?? "http://127.0.0.1:8080/";
const OUT_DIR = resolve(process.cwd(), "screenshots");
mkdirSync(OUT_DIR, { recursive: true });

function findChromium() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_PATH,
    "C:\\Users\\User\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);
  return candidates.find((p) => p && existsSync(p));
}

const STEPS = [];
const CONSOLE = [];
function step(name, ok, extra) {
  STEPS.push({ name, ok, ...(extra ?? {}) });
  if (!ok) console.error(`✗ ${name}`);
  else console.log(`✓ ${name}`);
}

async function shoot(page, label) {
  const file = resolve(OUT_DIR, `stier-flow-${label}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

(async () => {
  const launchOpts = findChromium() ? { executablePath: findChromium() } : {};
  const browser = await chromium.launch(launchOpts);
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  page.on("pageerror", (err) => CONSOLE.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") CONSOLE.push(`console: ${msg.text()}`);
  });

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(500);

    step("home loads", await page.getByRole("heading", { name: /AuctionCarRadar/ }).isVisible());
    step("scan button visible", await page.getByRole("button", { name: /S-Tier 매칭 스캔|스캔/ }).first().isVisible());

    await shoot(page, "01-home");

    // --- Open scan modal ---
    await page.getByRole("button", { name: /S-Tier 매칭 스캔/ }).first().click();
    // Wait for the scan modal heading to appear — Vite cold start can take
    // longer than 5s on first load, hence the generous 12s timeout.
    await page.getByRole("heading", { name: /S-Tier 스캔/ }).waitFor({ state: "visible", timeout: 12_000 }).catch(() => {});
    await page.waitForTimeout(300);
    step("scan modal opens", await page.getByRole("heading", { name: /S-Tier 스캔/ }).isVisible().catch(() => false));
    await shoot(page, "02-scan-modal");
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(400);

    // --- Open settings modal ---
    await page.getByRole("button", { name: /알림 규칙/ }).first().click();
    await page.getByRole("heading", { name: /웹 알림 규칙/ }).waitFor({ state: "visible", timeout: 12_000 }).catch(() => {});
    await page.waitForTimeout(300);
    step("settings modal opens", await page.getByRole("heading", { name: /웹 알림 규칙/ }).isVisible().catch(() => false));
    await shoot(page, "03-settings-modal");

    // Adjust threshold slider via label
    const threshold = page.locator('input[type="range"]');
    if (await threshold.count()) {
      await threshold.first().fill("85");
    }
    await page.getByRole("button", { name: /규칙 저장/ }).click();
    await page.waitForTimeout(400);
    step("settings modal closes after save", !(await page.getByRole("heading", { name: /웹 알림 규칙/ }).isVisible().catch(() => false)));

    // --- Trigger the real scan via the scan modal "Run actual scan" button ---
    await page.getByRole("button", { name: /S-Tier 매칭 스캔|스캔/ }).first().click();
    await page.waitForTimeout(800);
    // Wait for the simulation to finish (~3.5s) so the "Run actual scan" CTA appears
    await page.waitForTimeout(4500);
    const runScanBtn = page.getByRole("button", { name: /실제 스캔 실행/ });
    const runScanVisible = await runScanBtn.isVisible().catch(() => false);
    step("simulation completed (Run button visible)", runScanVisible);
    if (runScanVisible) {
      await runScanBtn.click();
    }
    // Give the server scan up to 60s; scrapers depend on Korean public networks.
    try {
      await page.waitForResponse(
        (resp) => resp.url().includes("/_server") || resp.url().includes("scan"),
        { timeout: 20_000 },
      );
    } catch {
      /* network sandbox may block — we still assert the UI state */
    }
    await page.waitForTimeout(8_000);
    step("scan modal closes (post-run)", !(await page.getByRole("heading", { name: /S-Tier 스캔/ }).isVisible().catch(() => false)));
    await shoot(page, "04-after-scan");

    // Detect whether real listings appeared.
    const rowCount = await page.locator("table tbody tr").count();
    step(`listings table populated (rows=${rowCount})`, rowCount > 0);

    // Read the S-Tier / A-Grade / Total counts off the metrics cards so we
    // can confirm rule-④ widening actually surfaces more S-Tier matches.
    async function readMetric(label) {
      const card = page.locator("section").filter({ hasText: label }).first();
      if (!(await card.count())) return null;
      const value = await card.locator("h3").first().innerText().catch(() => "");
      return value.trim();
    }
    const sTierCount = await readMetric("S-Tier 매칭");
    const aGradeCount = await readMetric("A-Grade 표준");
    const totalCount = await readMetric("총 스캔");
    console.log(
      `\nMetrics after scan → 총 스캔 ${totalCount ?? "?"} · S-Tier ${sTierCount ?? "?"} · A-Grade ${aGradeCount ?? "?"}`,
    );

    // --- Open notification drawer ---
    await page.getByRole("button", { name: /알림 열기/ }).click();
    await page.waitForTimeout(400);
    step("notification drawer opens", (await page.getByText(/웹 알림 피드/).isVisible().catch(() => false)));
    await shoot(page, "05-notification-drawer");
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(200);

    // --- Open detail modal by clicking the first listing row ---
    if (rowCount > 0) {
      // Click the "상세" Inspect button in the Actions column (the right-most
      // one in each row), not the bookmark toggle.
      const inspectBtn = page.locator("table tbody tr").first().getByRole("button", { name: "상세" });
      await inspectBtn.click().catch(() => {});
      await page.waitForTimeout(500);
      step(
        "detail modal opens",
        (await page.getByText(/S-Tier Precision Score/).isVisible().catch(() => false)),
      );
      await shoot(page, "06-detail-modal");
    } else {
      step("detail modal opens", false, { reason: "no listings to click" });
    }
  } finally {
    await ctx.close();
    await browser.close();
  }

  const passed = STEPS.every((s) => s.ok) && CONSOLE.length === 0;
  console.log(JSON.stringify({ passed, steps: STEPS, consoleErrors: CONSOLE }, null, 2));
  if (!passed) process.exitCode = 1;
})();