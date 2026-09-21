import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_SEARCH_CONFIG } from "./config.ts";
import { applyFilter } from "./filter.ts";
import {
  getNotifiedIds,
  markListingsNotified,
  resolveTelegram,
  saveScanResult,
} from "./persistence.ts";
import { evaluateSTier, passesAllSTierRules } from "./stier.ts";
import type { ScanResult, SearchConfig, StandardListing, TelegramSettings } from "./types.ts";

const ScanInputSchema = {
  parse(input: unknown): { config: SearchConfig; enrich: boolean; persist?: boolean } {
    const data = (input ?? {}) as {
      config?: Partial<SearchConfig>;
      enrich?: boolean;
      persist?: boolean;
    };
    return {
      config: { ...DEFAULT_SEARCH_CONFIG, ...data.config },
      enrich: data.enrich !== false,
      persist: data.persist !== false,
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

async function executeScan(config: SearchConfig, enrich: boolean): Promise<ScanResult> {
  const started = Date.now();
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
      .slice(0, 20);
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
    .map((row) => {
      const graded = applyFilter(row, config);
      const breakdown = evaluateSTier(graded);
      return {
        ...graded,
        isSTier: passesAllSTierRules(breakdown),
        sTierScore: breakdown.score,
        sTierBreakdown: breakdown,
      };
    })
    .sort((a, b) => {
      // S-Tier first, then by score, then by A-grade → candidate → rejected.
      if (a.isSTier !== b.isSTier) return a.isSTier ? -1 : 1;
      if (a.isSTier && b.isSTier) return b.sTierScore - a.sTierScore;
      const rank = { a: 0, candidate: 1, rejected: 2 };
      if (rank[a.grade] !== rank[b.grade]) return rank[a.grade] - rank[b.grade];
      return (b.year ?? 0) - (a.year ?? 0);
    });

  const stage1 = listings.filter((row) => row.grade === "a" || row.grade === "candidate");
  const sTier = listings.filter((row) => row.isSTier);
  const sweetDiscountListings = sTier.filter(
    (row) => row.discountRate != null && row.discountRate >= 30,
  );
  const sweetDiscountPct =
    sweetDiscountListings.length > 0
      ? Math.round(
          sweetDiscountListings.reduce((sum, row) => sum + (row.discountRate ?? 0), 0) /
            sweetDiscountListings.length,
        )
      : 0;
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
      sTier: sTier.length,
      sweetDiscountPct,
    },
  };
}

export const runAuctionScan = createServerFn({ method: "POST" })
  .validator(ScanInputSchema)
  .handler(async ({ data }): Promise<ScanResult> => {
    const scan = await executeScan(data.config, data.enrich);
    if (data.persist) {
      try {
        await saveScanResult(scan);
      } catch (error) {
        console.error("radar persist failed", error);
      }
    }
    return scan;
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
  parse(input: unknown): { telegram?: Partial<TelegramSettings>; listings: StandardListing[] } {
    const data = input as {
      telegram?: Partial<TelegramSettings>;
      listings: StandardListing[];
    };
    return {
      telegram: data.telegram,
      listings: Array.isArray(data.listings) ? data.listings : [],
    };
  },
};

export const sendTelegramAlerts = createServerFn({ method: "POST" })
  .validator(NotifyInput)
  .handler(async ({ data }): Promise<{ sent: number; error?: string }> => {
    const telegram = resolveTelegram(data.telegram);
    if (!telegram.enabled || !telegram.botToken || !telegram.chatId) {
      return {
        sent: 0,
        error:
          "텔레그램이 비활성이거나 토큰/채팅 ID가 없습니다. TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 환경변수 또는 설정값을 확인하세요.",
      };
    }
    let sent = 0;
    for (const listing of data.listings) {
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
    if (sent) {
      try {
        await markListingsNotified(data.listings.map((row) => row.id));
      } catch (error) {
        console.error("radar notify ledger failed", error);
      }
    }
    return { sent };
  });

const ScheduledInput = {
  parse(input: unknown): { secret?: string } {
    const data = (input ?? {}) as { secret?: string };
    return { secret: data.secret };
  },
};

export const runScheduledRadar = createServerFn({ method: "POST" })
  .validator(ScheduledInput)
  .handler(
    async ({
      data,
    }): Promise<{
      ok: boolean;
      error?: string;
      scan?: ScanResult;
      notified: number;
      freshIds: string[];
    }> => {
      const expected = process.env.CRON_SECRET?.trim();
      if (expected && data.secret !== expected) {
        return { ok: false, error: "unauthorized", notified: 0, freshIds: [] };
      }

      const scan = await executeScan(DEFAULT_SEARCH_CONFIG, true);
      try {
        await saveScanResult(scan);
      } catch (error) {
        console.error("scheduled persist failed", error);
      }

      const known = new Set(await getNotifiedIds());
      const fresh = scan.listings.filter(
        (row) => row.grade === "a" && !known.has(row.id),
      );
      if (!fresh.length) {
        return { ok: true, scan, notified: 0, freshIds: [] };
      }

      const telegram = resolveTelegram({ enabled: true });
      if (!telegram.botToken || !telegram.chatId) {
        return {
          ok: true,
          scan,
          notified: 0,
          freshIds: fresh.map((row) => row.id),
          error: "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not configured",
        };
      }

      let notified = 0;
      for (const listing of fresh) {
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
          return {
            ok: false,
            scan,
            notified,
            freshIds: fresh.map((row) => row.id),
            error: `Telegram HTTP ${response.status}: ${body.slice(0, 180)}`,
          };
        }
        notified += 1;
      }
      await markListingsNotified(fresh.map((row) => row.id));
      return {
        ok: true,
        scan,
        notified,
        freshIds: fresh.map((row) => row.id),
      };
    },
  );
