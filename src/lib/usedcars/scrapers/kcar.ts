/**
 * K Car scraper — Playwright-driven, **local-only**.
 *
 * K Car's listing API (`api.kcar.com/bc/search/list/drct`) encrypts the
 * request body with a per-session key, so direct HTTP scraping is not
 * feasible without re-implementing their crypto. This scraper loads the SPA
 * in a headless browser and reads the rendered cards instead.
 *
 * On Vercel (or any environment without Playwright/Chromium) the scraper
 * returns an empty result with a clear "local-only" status.
 */
import type { UsedCarConfig, UsedCarListing, UsedCarPlatform, UsedCarFuel } from "../types.ts";

const LIST_URL = "https://www.kcar.com/bc/search";
const WAIT_SELECTOR = ".carListBox";

/** Korean fuel label → normalised category. */
function classifyFuel(label: string): UsedCarFuel {
  const t = label.trim();
  if (/전기|EV|ev/i.test(t)) return "전기";
  if (/하이브리드|hybrid/i.test(t)) return "하이브리드";
  if (/가솔린|휘발유/i.test(t)) return "가솔린";
  if (/디젤|경유/i.test(t)) return "디젤";
  if (/LPG|엘피지/i.test(t)) return "LPG";
  return "기타";
}

const PRICE_RE = /([\d,]+)\s*만\s*원/;
const YEAR_MONTH_RE = /(\d{2})\s*년\s*(\d{1,2})\s*월\s*식/;
const MILEAGE_RE = /([\d,]+)\s*km/i;

/**
 * Extract carId from a thumbnail URL like
 * `https://img.kcar.com/3dcarpicture/2026/09/173/61394722_2/main/main780.jpg`.
 * Returns null when no id is present.
 */
function carIdFromImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/\/(\d{6,})_\d+\/main\//);
  return m ? m[1] : null;
}

interface ParsedCard {
  carTit: string;
  carExp: string;
  yearMonth: string;
  mileageText: string;
  fuelText: string;
  seller: string;
  tags: string[];
  imageUrl: string | null;
  carId: string | null;
}

/**
 * Parse a K Car `.carListBox` card via `page.evaluate`. Returns the structured
 * fields used by `toUsedCarListing`, or `null` when the card is missing the
 * minimum data (price + name).
 */
async function readCardsFromPage(
  page: import("playwright").Page,
): Promise<ParsedCard[]> {
  return await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".carListBox"));
    const out: Array<{
      carTit: string;
      carExp: string;
      yearMonth: string;
      mileageText: string;
      fuelText: string;
      seller: string;
      tags: string[];
      imageUrl: string | null;
      carId: string | null;
    }> = [];
    for (const card of cards) {
      const tit = card.querySelector(".carTit");
      const exp = card.querySelector(".carExp");
      if (!tit || !exp) continue;

      // Walk all leaf-ish spans in DOM order. K Car's card layout is:
      //   [promo spans] [carTit] [carExp (+할부)] [year-month] [mileage] [fuel] [seller] [tags...]
      const allSpans = Array.from(card.querySelectorAll("span"));
      const leafTexts = allSpans
        .map((s: Element) => (s as HTMLElement).innerText || "")
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);

      const yearMonth =
        leafTexts.find((t: string) => /\d+\s*년\s*\d+\s*월\s*식/.test(t)) ?? "";
      const mileageText = leafTexts.find((t: string) => /km/i.test(t)) ?? "";
      const fuelText =
        leafTexts.find((t: string) =>
          /(전기|하이브리드|가솔린|디젤|LPG|휘발유|경유)/.test(t),
        ) ?? "";

      // Seller: the span that comes RIGHT AFTER the fuel span in DOM order.
      // K Car always renders `[fuel, seller, tag, tag, ...]`.
      let seller = "";
      if (fuelText) {
        const fuelIdx = leafTexts.indexOf(fuelText);
        const next = leafTexts[fuelIdx + 1];
        if (next && !/\d/.test(next) && !/(KW|만원|할부|찜하기|비교함)/.test(next)) {
          seller = next;
        }
      }

      // Tags: spans that match known K Car tag patterns. These appear after
      // the seller in DOM order, so we only consider those.
      const tagPatterns = /^(KW|6개월|12개월|4WD|2WD|AWD|세금|세제|정비|주행|짧은|제조사|무료|보증|홈서비스|관리|추천|무사고)$/;
      const fuelIdx = fuelText ? leafTexts.indexOf(fuelText) : -1;
      const tags = leafTexts
        .slice(fuelIdx + 1)
        .filter((t: string) => tagPatterns.test(t));

      // Image
      const img = card.querySelector(
        "img[src*='3dcarpicture'], img[src*='kcarmall']",
      );
      const imageUrl = img?.getAttribute("src") ?? null;
      out.push({
        carTit: ((tit as HTMLElement).innerText || "").trim(),
        carExp: ((exp as HTMLElement).innerText || "").trim(),
        yearMonth: yearMonth.trim(),
        mileageText,
        fuelText,
        seller,
        tags,
        imageUrl,
        carId: null,
      });
    }
    return out;
  });
}

export function toUsedCarListing(card: ParsedCard): UsedCarListing | null {
  const carName = card.carTit.replace(/\s+/g, " ").trim();
  if (!carName) return null;

  // Price: "3,470만원" → 34700000
  const priceMatch = card.carExp.match(PRICE_RE);
  const listingPrice = priceMatch
    ? Number(priceMatch[1].replace(/,/g, "")) * 10_000
    : null;

  // Year: "23년 5월식" → 2023
  const ymMatch = card.yearMonth.match(YEAR_MONTH_RE);
  const year = ymMatch ? 2000 + Number(ymMatch[1]) : null;

  // Mileage: "49,823km" → 49823
  const kmMatch = card.mileageText.match(MILEAGE_RE);
  const mileage = kmMatch ? Number(kmMatch[1].replace(/,/g, "")) : null;

  const carId =
    card.carId ?? carIdFromImageUrl(card.imageUrl) ?? `${carName}-${year}-${mileage}`;
  const id = `kcar:${carId}`;
  const fuel = classifyFuel(card.fuelText);

  return {
    id,
    platform: "kcar",
    platformName: "K Car",
    carName,
    year,
    mileage,
    listingPrice,
    fuel,
    fuelLabel: card.fuelText,
    seller: card.seller || "K Car 메가센터",
    detailUrl: `https://www.kcar.com/bc/search`,
    imageUrl: card.imageUrl,
    tags: card.tags,
    rawText: [card.carTit, card.carExp, card.yearMonth, card.mileageText, card.fuelText, card.seller, ...card.tags]
      .filter(Boolean)
      .join(" \n "),
    collectedAt: new Date().toISOString(),
  };
}

export interface KCarScrapeResult {
  ok: boolean;
  listings: UsedCarListing[];
  /** "live" / "empty" / "error" / "skipped" — matches `UsedCarSourceReport.status` */
  status: "live" | "empty" | "error" | "skipped";
  message: string;
  localOnly: boolean;
}

export async function scrapeKCar(
  config: UsedCarConfig,
): Promise<KCarScrapeResult> {
  // Lazy import so a build environment without Playwright doesn't fail.
  let playwright: typeof import("playwright") | null = null;
  try {
    playwright = await import("playwright");
  } catch {
    return {
      ok: false,
      listings: [],
      status: "skipped",
      message:
        "K Car 스크레이퍼는 Playwright 헤드리스 브라우저가 필요합니다. 로컬에서 `npm install playwright && npx playwright install chromium` 후 다시 시도하세요.",
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
    try {
      await page.waitForSelector(WAIT_SELECTOR, { timeout: 15_000 });
    } catch {
      return {
        ok: false,
        listings: [],
        status: "empty",
        message: `K Car 검색 페이지에서 매물 카드를 찾지 못했습니다 (${WAIT_SELECTOR} 셀렉터 timeout).`,
        localOnly: true,
      };
    }
    await page.waitForTimeout(2_000);
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
          ? `K Car 검색 페이지에서 ${listings.length}건 추출 (Playwright 헤드리스, 로컬 전용)`
          : "K Car 매물이 없습니다.",
      localOnly: true,
    };
  } catch (error) {
    return {
      ok: false,
      listings: [],
      status: "error",
      message: error instanceof Error ? error.message : "K Car 스크레이퍼 오류",
      localOnly: true,
    };
  } finally {
    await browser.close();
  }
}
