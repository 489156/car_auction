/**
 * KB차차차 scraper — Playwright-driven, **local-only**.
 *
 * KB차차차's listing API is not directly reachable (the public search page
 * is a Vue SPA that fetches results through an internal endpoint). This
 * scraper loads the page in a headless browser and reads the rendered card
 * list. Cards are then parsed with stable Korean-text patterns.
 *
 * On Vercel (or any environment without Playwright/Chromium) the scraper
 * returns an empty result with a clear "local-only" status.
 */
import type { UsedCarConfig, UsedCarListing, UsedCarFuel } from "../types.ts";

const LIST_URL = "https://www.kbchachacha.com/public/search/main.kbc";

function classifyFuel(label: string): UsedCarFuel {
  const t = label.trim();
  if (/전기|EV|ev/i.test(t)) return "전기";
  if (/하이브리드|hybrid/i.test(t)) return "하이브리드";
  if (/가솔린|휘발유/i.test(t)) return "가솔린";
  if (/디젤|경유/i.test(t)) return "디젤";
  if (/LPG/i.test(t)) return "LPG";
  return "기타";
}

const PRICE_RE = /([\d,]+)\s*만\s*원/;
const YEAR_MONTH_RE = /(\d{2})\s*\/\s*(\d{1,2})\s*식/;
const MILEAGE_RE = /([\d,]+)\s*km/i;

interface ParsedKbcCard {
  carName: string;
  yearMonth: string;
  mileageText: string;
  priceText: string;
  region: string;
  tags: string[];
  detailUrl: string;
  carSeq: string | null;
}

async function readCardsFromPage(
  page: import("playwright").Page,
): Promise<ParsedKbcCard[]> {
  return await page.evaluate(() => {
    const out: ParsedKbcCard[] = [];
    // KB차차차 cards: <div class="item"> with <a href="/public/car/detail.kbc?carSeq=...">
    const cards = Array.from(document.querySelectorAll("div.item"));
    for (const card of cards) {
      const link =
        card.querySelector("a[href*='detail.kbc']") ||
        card.querySelector("a");
      const href = link?.getAttribute("href") ?? "";
      const detailUrl = href
        ? href.startsWith("http")
          ? href
          : `https://www.kbchachacha.com${href}`
        : "";
      const carSeqMatch = href.match(/carSeq=(\d+)/);
      const carSeq = carSeqMatch ? carSeqMatch[1] : null;

      const txt = (card as HTMLElement).innerText.replace(/\s+/g, " ").trim();
      if (!txt || txt.length < 20 || txt.length > 500) continue;
      // KB차차차 cards always include a price in 만원 and a mileage in km.
      if (!/만원/.test(txt) || !/km/i.test(txt)) continue;

      // Split title from the rest by the first occurrence of year/month pattern
      const ymMatch = txt.match(/(\d{2}\s*\/\s*\d{1,2}\s*식)/);
      const yearMonth = ymMatch?.[1] ?? "";
      const carName = ymMatch
        ? txt.slice(0, ymMatch.index).trim()
        : txt.split(/\s+/).slice(0, 8).join(" ");

      const kmMatch = txt.match(/([\d,]+)\s*km/i);
      const mileageText = kmMatch ? kmMatch[0] : "";

      const priceMatch = txt.match(/([\d,]+)\s*만\s*원/);
      const priceText = priceMatch ? priceMatch[0] : "";

      // Region: the first whitespace-delimited token after mileage. KB차차차
      // pages render this as a single short word like "경기" or "서울".
      const afterKm = txt.slice((kmMatch?.index ?? 0) + kmMatch![0].length);
      const regionMatch = afterKm.match(/^\s*(\S+)/);
      const region = regionMatch ? regionMatch[1] : "";

      // Tags: tokens between region and price that aren't the price itself.
      const afterRegion = afterKm.replace(/^\s*\S+\s*/, "");
      const beforePrice = afterRegion.split(priceText)[0] ?? "";
      const tags = beforePrice
        .trim()
        .split(/\s+/)
        .filter((s: string) => s.length >= 2);

      out.push({
        carName,
        yearMonth,
        mileageText,
        priceText,
        region,
        tags,
        detailUrl,
        carSeq,
      });
    }
    return out;
  });
}

export function toUsedCarListing(card: ParsedKbcCard): UsedCarListing | null {
  const carName = card.carName.trim();
  if (!carName) return null;

  const priceMatch = card.priceText.match(PRICE_RE);
  const listingPrice = priceMatch
    ? Number(priceMatch[1].replace(/,/g, "")) * 10_000
    : null;

  const ymMatch = card.yearMonth.match(YEAR_MONTH_RE);
  const year = ymMatch ? 2000 + Number(ymMatch[1]) : null;

  const kmMatch = card.mileageText.match(MILEAGE_RE);
  const mileage = kmMatch ? Number(kmMatch[1].replace(/,/g, "")) : null;

  const fuelText = card.tags.find((t) =>
    /(전기|하이브리드|가솔린|디젤|LPG|휘발유|경유)/.test(t),
  ) ?? "기타";
  const fuel = classifyFuel(fuelText);

  const carId = card.carSeq ?? `${carName}-${year}-${mileage}`;
  return {
    id: `kbchachacha:${carId}`,
    platform: "kbchachacha",
    platformName: "KB차차차",
    carName,
    year,
    mileage,
    listingPrice,
    fuel,
    fuelLabel: fuelText,
    seller: card.region || "KB차차차",
    detailUrl: card.detailUrl,
    imageUrl: null,
    tags: card.tags,
    rawText: [
      carName,
      card.yearMonth,
      card.mileageText,
      card.priceText,
      card.region,
      ...card.tags,
    ]
      .filter(Boolean)
      .join(" \n "),
    collectedAt: new Date().toISOString(),
  };
}

export interface KbcScrapeResult {
  ok: boolean;
  listings: UsedCarListing[];
  status: "live" | "empty" | "error" | "skipped";
  message: string;
  localOnly: boolean;
}

export async function scrapeKbchachacha(
  config: UsedCarConfig,
): Promise<KbcScrapeResult> {
  let playwright: typeof import("playwright") | null = null;
  try {
    playwright = await import("playwright");
  } catch {
    return {
      ok: false,
      listings: [],
      status: "skipped",
      message:
        "KB차차차 스크레이퍼는 Playwright 헤드리스 브라우저가 필요합니다. 로컬에서 `npm install playwright && npx playwright install chromium` 후 다시 시도하세요.",
      localOnly: true,
    };
  }
  if (!playwright) {
    return {
      ok: false,
      listings: [],
      status: "skipped",
      message: "Playwright 로드 실패",
      localOnly: true,
    };
  }

  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1366, height: 900 },
      locale: "ko-KR",
    });
    const page = await ctx.newPage();
    await page.goto(LIST_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
    // Wait for at least one card to appear
    let foundCards = false;
    for (let i = 0; i < 6 && !foundCards; i++) {
      await page.waitForTimeout(3_000);
      const count = await page
        .evaluate(() => document.querySelectorAll("div.item a[href*='detail.kbc']").length)
        .catch(() => 0);
      if (count > 0) foundCards = true;
    }
    if (!foundCards) {
      // Try clicking the search button as a last resort
      try {
        await page.evaluate(() => {
          const btn = Array.from(
            document.querySelectorAll("button, a, .btn, [class*=search]"),
          ).find((b) => /검색|search/i.test((b as HTMLElement).innerText || ""));
          if (btn) (btn as HTMLElement).click();
        });
        await page.waitForTimeout(8_000);
        foundCards = (await page
          .evaluate(() => document.querySelectorAll("div.item a[href*='detail.kbc']").length)
          .catch(() => 0)) > 0;
      } catch {}
    }
    if (!foundCards) {
      return {
        ok: false,
        listings: [],
        status: "empty",
        message:
          "KB차차차 검색 페이지에서 매물 카드를 찾지 못했습니다. 페이지 구조가 바뀌었거나 로그인이 필요할 수 있습니다.",
        localOnly: true,
      };
    }

    const cards = await readCardsFromPage(page);
    const listings = cards
      .map(toUsedCarListing)
      .filter((l): l is UsedCarListing => l !== null)
      .slice(0, config.maxListingsPerSource);

    return {
      ok: listings.length > 0,
      listings,
      status: listings.length > 0 ? "live" : "empty",
      message:
        listings.length > 0
          ? `KB차차차 검색 페이지에서 ${listings.length}건 추출 (Playwright 헤드리스, 로컬 전용)`
          : "KB차차차 매물이 없습니다.",
      localOnly: true,
    };
  } catch (error) {
    return {
      ok: false,
      listings: [],
      status: "error",
      message: error instanceof Error ? error.message : "KB차차차 스크레이퍼 오류",
      localOnly: true,
    };
  } finally {
    await browser.close();
  }
}
