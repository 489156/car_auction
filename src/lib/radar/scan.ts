import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_SEARCH_CONFIG } from "./config.ts";
import { applyFilter } from "./filter.ts";
import type { ScanResult, SearchConfig, StandardListing, TelegramSettings } from "./types.ts";

const ScanInputSchema = {
  parse(input: unknown): { config: SearchConfig; enrich: boolean } {
    const data = (input ?? {}) as { config?: Partial<SearchConfig>; enrich?: boolean };
    return {
      config: { ...DEFAULT_SEARCH_CONFIG, ...data.config },
      enrich: data.enrich !== false,
    };
  },
};

function dedupe(listings: StandardListing[]): StandardListing[] {
  const byId = new Map<string, StandardListing>();
  const byCase = new Map<string, StandardListing>();
  for (const listing of listings) {
    if (byId.has(listing.id)) continue;
    const caseKey = listing.caseNo.replace(/\s+/g, "");
    const existing = byCase.get(caseKey);
    if (existing && existing.platform !== listing.platform) continue;
    byId.set(listing.id, listing);
    byCase.set(caseKey, listing);
  }
  return [...byId.values()];
}

export const runAuctionScan = createServerFn({ method: "POST" })
  .validator(ScanInputSchema)
  .handler(async ({ data }): Promise<ScanResult> => {
    const started = Date.now();
    const { config, enrich } = data;
    const [{ scrapeMadang, enrichMadangDetail }, { scrapeOnbid, enrichOnbidDetail }, { scrapeCourt }] =
      await Promise.all([
        import("./scrapers/madang.ts"),
        import("./scrapers/onbid.ts"),
        import("./scrapers/court.ts"),
      ]);

    const [madang, onbid, court] = await Promise.all([
      scrapeMadang(config),
      scrapeOnbid(config),
      scrapeCourt(),
    ]);

    let listings = dedupe([...madang.listings, ...onbid.listings, ...court.listings]);

    if (enrich) {
      const prelim = listings.map((row) =>
        applyFilter(row, { ...config, requireKeyKeyword: false }),
      );
      const targets = prelim
        .filter((row) => row.grade === "a" || row.grade === "candidate")
        .slice(0, 8);
      await Promise.all(
        targets.map(async (row) => {
          const extra =
            row.platform === "madang"
              ? await enrichMadangDetail(row)
              : row.platform === "onbid"
                ? await enrichOnbidDetail(row)
                : row.rawText;
          const original = listings.find((item) => item.id === row.id);
          if (original) original.rawText = extra;
        }),
      );
    }

    listings = listings
      .map((row) => applyFilter(row, config))
      .sort((a, b) => {
        const rank = { a: 0, candidate: 1, rejected: 2 };
        if (rank[a.grade] !== rank[b.grade]) return rank[a.grade] - rank[b.grade];
        return (b.year ?? 0) - (a.year ?? 0);
      });

    const stage1 = listings.filter((row) => row.grade === "a" || row.grade === "candidate");
    return {
      scannedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      sources: [court.report, onbid.report, madang.report],
      listings,
      totals: {
        fetched: listings.length,
        stage1: stage1.length,
        gradeA: listings.filter((row) => row.grade === "a").length,
        candidates: listings.filter((row) => row.grade === "candidate").length,
        rejected: listings.filter((row) => row.grade === "rejected").length,
      },
    };
  });

function telegramBody(listing: StandardListing): string {
  const mileage =
    listing.mileage == null ? "미확인" : `${listing.mileage.toLocaleString("ko-KR")} km`;
  const appraisal =
    listing.appraisalPrice == null
      ? "—"
      : `${listing.appraisalPrice.toLocaleString("ko-KR")} 원`;
  const minPrice =
    listing.minPrice == null ? "—" : `${listing.minPrice.toLocaleString("ko-KR")} 원`;
  const discount =
    listing.discountRate == null ? "" : ` (${listing.discountRate}% 유찰)`;
  return [
    "A급 알짜 경매/공매 차량 발견",
    "---------------------------------",
    `출처: ${listing.platformName} (${listing.courtOrDept})`,
    `사건/물건번호: ${listing.caseNo}`,
    `차종: ${listing.carName}`,
    `연식: ${listing.year ?? "미확인"}년식 | 주행거리: ${mileage}`,
    `연료: ${listing.fuel}`,
    "",
    `감정평가액: ${appraisal}`,
    `최저매각가: ${minPrice}${discount}`,
    "",
    `차키 상태: ${listing.keyStatus}`,
    `매각/입찰기일: ${listing.auctionDate}`,
    "---------------------------------",
    listing.detailUrl,
  ].join("\n");
}

const NotifyInput = {
  parse(input: unknown): { telegram: TelegramSettings; listings: StandardListing[] } {
    const data = input as { telegram: TelegramSettings; listings: StandardListing[] };
    return {
      telegram: data.telegram,
      listings: Array.isArray(data.listings) ? data.listings : [],
    };
  },
};

export const sendTelegramAlerts = createServerFn({ method: "POST" })
  .validator(NotifyInput)
  .handler(async ({ data }): Promise<{ sent: number; error?: string }> => {
    const { telegram, listings } = data;
    if (!telegram.enabled || !telegram.botToken || !telegram.chatId) {
      return { sent: 0, error: "텔레그램 봇 토큰과 채팅 ID가 필요합니다." };
    }
    let sent = 0;
    for (const listing of listings) {
      const url = `https://api.telegram.org/bot${telegram.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: telegram.chatId,
          text: telegramBody(listing),
          disable_web_page_preview: false,
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        return { sent, error: `Telegram HTTP ${response.status}: ${body.slice(0, 180)}` };
      }
      sent += 1;
    }
    return { sent };
  });
