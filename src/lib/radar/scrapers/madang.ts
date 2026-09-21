import type { SearchConfig, SourceReport, StandardListing } from "../types.ts";
import {
  discountRate,
  extractCarDetails,
  mergeText,
  parseMileage,
  parseWon,
  parseYear,
} from "../parser.ts";
import { fetchText, jitterDelay } from "./http.ts";

const LIST_URL = "https://madangs.com/search/car";
const MIN_HEALTHY_FETCH = 10;

function field(block: string, key: string): string | null {
  const quoted = block.match(new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`));
  if (quoted) {
    return quoted[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  const raw = block.match(new RegExp(`"${key}"\\s*:\\s*([^,}\\]]+)`));
  if (!raw) return null;
  const value = raw[1].trim();
  if (value === "null" || value === "undefined") return null;
  if (value.startsWith("[")) {
    // Arrays like car_etc:["2020년식","65,683km"] — flatten for text matching
    const inner = block.match(new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)\\]`));
    return inner?.[1]?.replace(/"/g, " ").replace(/,/g, " ").trim() ?? null;
  }
  return value.replace(/^"|"$/g, "");
}

function unescapePayload(html: string): string {
  let text = html;
  for (let i = 0; i < 6; i++) {
    const next = text.replace(/\\"/g, '"').replace(/\\n/g, "\n");
    if (next === text) break;
    text = next;
  }
  return text;
}

function parseBlocks(html: string): StandardListing[] {
  const text = unescapePayload(html);
  const listings: StandardListing[] = [];
  const seen = new Set<string>();

  const mCodeRe = /"m_code"\s*:\s*"?([^",}\s]+)"?/g;
  let match: RegExpExecArray | null;
  while ((match = mCodeRe.exec(text)) !== null) {
    const mCode = match[1];
    if (!mCode || seen.has(mCode)) continue;

    const center = match.index;
    const block = text.slice(Math.max(0, center - 2500), center + 3500);
    const carName = field(block, "car_name");
    const caseNo = field(block, "case_num") ?? field(block, "case_num_dash");
    if (!carName || !caseNo) continue;
    seen.add(mCode);

    const yearField = field(block, "car_year");
    const mileageField =
      field(block, "car_total_mileage_int") ?? field(block, "car_total_mileage");
    const fuelField = field(block, "car_fuel") ?? "";
    const etc = field(block, "car_etc") ?? "";
    const storage = field(block, "car_storage_method") ?? "";
    const special = field(block, "special_right") ?? "";
    const addr = field(block, "addr") ?? "";
    const blob = mergeText(addr, carName, fuelField, etc, storage, special, block.slice(0, 1800));
    const parsed = extractCarDetails(blob);

    const year =
      (yearField && Number(yearField) >= 1990 ? Number(yearField) : null) ??
      parsed.year ??
      parseYear(etc) ??
      parseYear(addr);
    const mileage =
      parseMileage(String(mileageField ?? "")) ??
      (mileageField && /^\d+$/.test(mileageField) ? Number(mileageField) : null) ??
      parsed.mileage;
    const fuel = parsed.fuel === "기타" ? extractCarDetails(fuelField).fuel : parsed.fuel;

    const appraisal = parseWon(field(block, "m_evaluate_price") ?? field(block, "eval_price_v"));
    const minPrice = parseWon(
      field(block, "low_price") ?? field(block, "m_bid_price_last") ?? field(block, "last_price"),
    );
    const path = field(block, "case_url") ?? `/caview?m_code=${mCode}`;

    listings.push({
      id: `madang:${caseNo}`,
      platform: "madang",
      platformName: "경매마당",
      caseNo,
      courtOrDept: field(block, "bubwon") ?? field(block, "bubwon_short") ?? "법원 미상",
      carName,
      year,
      mileage,
      fuel: fuel || "기타",
      appraisalPrice: appraisal,
      minPrice,
      discountRate: discountRate(appraisal, minPrice),
      auctionDate: field(block, "m_bid_date") ?? field(block, "m_bid_date_last") ?? "—",
      detailUrl: path.startsWith("http") ? path : `https://madangs.com${path}`,
      imageUrl: field(block, "img_url"),
      status: field(block, "state") ?? field(block, "pbctCltrStatNm") ?? "",
      rawText: mergeText(addr, etc, storage, special, fuelField, carName),
      keyStatus: "미검사",
      matchedKeyKeywords: [],
      matchedDangerKeywords: [],
      grade: "rejected",
      rejectReasons: [],
      collectedAt: new Date().toISOString(),
    });
  }
  return listings;
}

async function fetchMadangOnce(): Promise<{
  ok: boolean;
  status: number;
  listings: StandardListing[];
  bytes: number;
  signalCount: number;
}> {
  const result = await fetchText(LIST_URL, { timeoutMs: 20_000 });
  if (!result.ok) {
    return { ok: false, status: result.status, listings: [], bytes: 0, signalCount: 0 };
  }
  const signalCount = (result.text.match(/car_name/g) || []).length;
  const listings = parseBlocks(result.text);
  return {
    ok: true,
    status: result.status,
    listings,
    bytes: result.text.length,
    signalCount,
  };
}

export async function scrapeMadang(
  config: SearchConfig,
): Promise<{ listings: StandardListing[]; report: SourceReport }> {
  try {
    let best = await fetchMadangOnce();
    // Retry once if the Next.js shell arrived but parse yield was thin
    if (
      best.ok &&
      best.listings.length < MIN_HEALTHY_FETCH &&
      best.signalCount >= MIN_HEALTHY_FETCH
    ) {
      await jitterDelay(400, 900);
      const retry = await fetchMadangOnce();
      if (retry.listings.length > best.listings.length) best = retry;
    } else if (best.ok && best.listings.length < MIN_HEALTHY_FETCH) {
      await jitterDelay(400, 900);
      const retry = await fetchMadangOnce();
      if (retry.listings.length > best.listings.length) best = retry;
    }

    if (!best.ok) {
      return {
        listings: [],
        report: {
          platform: "madang",
          label: "경매마당",
          status: "error",
          fetched: 0,
          message: `HTTP ${best.status}`,
        },
      };
    }

    const listings = best.listings.slice(0, config.maxListingsPerSource);
    const parseGap =
      best.signalCount > 0 && listings.length === 0
        ? ` (페이지에 car_name ${best.signalCount}건 신호 있으나 파싱 0건)`
        : best.signalCount > listings.length
          ? ` (페이지 신호 ${best.signalCount}건 → 파싱 ${listings.length}건)`
          : "";

    return {
      listings,
      report: {
        platform: "madang",
        label: "경매마당",
        status: listings.length ? "live" : "empty",
        fetched: listings.length,
        message: listings.length
          ? `차량검색 페이지에서 ${listings.length}건 수집 (대법원 경매 중계 포함)${parseGap}`
          : `목록 파싱 결과가 없습니다.${parseGap || ` bytes=${best.bytes}`}`,
      },
    };
  } catch (error) {
    return {
      listings: [],
      report: {
        platform: "madang",
        label: "경매마당",
        status: "error",
        fetched: 0,
        message: error instanceof Error ? error.message : "요청 실패",
      },
    };
  }
}

export async function enrichMadangDetail(listing: StandardListing): Promise<string> {
  try {
    const result = await fetchText(listing.detailUrl, { timeoutMs: 12_000 });
    if (!result.ok) return listing.rawText;
    const text = result.text
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ");
    return mergeText(listing.rawText, text.slice(0, 8000));
  } catch {
    return listing.rawText;
  }
}
