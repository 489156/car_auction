// Verify the used-cars lane renders in the UI: tab switch, scan button,
// table layout. Captures a screenshot too.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

await mkdir("./screenshots", { recursive: true });

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: "ko-KR" });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`console.error: ${m.text()}`);
  });

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(2000);

  // Click the "중고 매물 (로컬)" tab
  const usedCarTab = page.locator('button:has-text("중고 매물")').first();
  await usedCarTab.click();
  await page.waitForTimeout(1000);

  await page.screenshot({ path: "./screenshots/usedcars-tab-empty.png", fullPage: false });

  // Trigger the scan
  const scanBtn = page.locator('button:has-text("중고 매물 스캔")').first();
  if ((await scanBtn.count()) > 0) {
    await scanBtn.click();
    // Wait for results — both sites run Playwright, total ~10-15s typical
    console.log("scan triggered, waiting for results...");
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(1000);
      const txt = (await page.evaluate(() => document.body.innerText)) || "";
      if (txt.includes("필터 통과") && !txt.includes("수집 중…")) {
        console.log(`results arrived after ${i + 1}s`);
        break;
      }
    }
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: "./screenshots/usedcars-tab-filled.png", fullPage: false });

  const bodyText = await page.evaluate(() => document.body.innerText);
  const hasTab = bodyText.includes("경매") && bodyText.includes("중고");
  const hasKCar = bodyText.includes("K Car");
  const hasKbc = bodyText.includes("KB차차차");
  console.log("=== Used-cars UI verification ===");
  console.log(`body length: ${bodyText.length}`);
  console.log(`tab labels visible: ${hasTab}`);
  console.log(`K Car visible: ${hasKCar}`);
  console.log(`KB차차차 visible: ${hasKbc}`);
  console.log(`console errors: ${consoleErrors.length}`);
  for (const e of consoleErrors.slice(0, 5)) console.log(`  ${e}`);

  // Mobile
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "ko-KR" });
  const mpage = await mctx.newPage();
  await mpage.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded" });
  await mpage.waitForTimeout(2000);
  await mpage.locator('button:has-text("중고 매물")').first().click();
  await mpage.waitForTimeout(1000);
  await mpage.screenshot({ path: "./screenshots/usedcars-mobile.png", fullPage: false });

  console.log("\nscreenshots: ./screenshots/usedcars-*.png");
} finally {
  await browser.close();
}
