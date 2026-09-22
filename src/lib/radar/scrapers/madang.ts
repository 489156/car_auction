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

/**
 * Extract the first value of `key` in `block`.
 * Handles `"key":"string"`, `"key":[array]`, and `"key":scalar` shapes.
 */
function fieldFirst(block: string, key: string): string | null {
  const quoted = block.match(
    new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`),
  );
  if (quoted) {
    return quoted[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  const array = block.match(new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)\\]`));
  if (array) {
    return array[1].replace(/"/g, " ").replace(/,/g, " ").trim() || null;
  }
  const raw = block.match(new RegExp(`"${key}"\\s*:\\s*([^,}\\]]+)`));
  if (!raw) return null;
  const value = raw[1].trim();
  if (value === "null" || value === "undefined") return null;
  return value.replace(/^"|"$/g, "");
}

/**
 * Extract the LAST value of `key` in `block`.
 * Some items emit placeholder fields (e.g. `"car_storage_method":""` before
 * the real value later in the block); we want the last write.
 */
function fieldLast(block: string, key: string): string | null {
  const quotedRe = new RegExp(
    `"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`,
    "g",
  );
  let lastQuoted: string | null = null;
  let match: RegExpExecArray | null;
  while ((match = quotedRe.exec(block)) !== null) {
    lastQuoted = match[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  if (lastQuoted != null) return lastQuoted;

  const arrayRe = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)\\]`, "g");
  let lastArray: string | null = null;
  while ((match = arrayRe.exec(block)) !== null) {
    lastArray = match[1].replace(/"/g, " ").replace(/,/g, " ").trim() || null;
  }
  if (lastArray != null) return lastArray;

  const rawRe = new RegExp(`"${key}"\\s*:\\s*([^,}\\]]+)`, "g");
  let lastRaw: string | null = null;
  while ((match = rawRe.exec(block)) !== null) {
    const value = match[1].trim();
    if (value === "null" || value === "undefined") continue;
    lastRaw = value.replace(/^"|"$/g, "");
  }
  return lastRaw;
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

/**
 * Find every `{ ... }` object block at the *top* level of the page payload
 * (i.e. objects separated by `,` inside the items array). For each block,
 * record whether it contains an `"m_code"` key so we can dedupe.
 *
 * Implementation: a single forward scan with a JSON-aware depth counter
 * (string literals are skipped, and `\"` is treated as an escape). This
 * avoids the recursive walker bug where `\"` inside a value string was
 * mistaken for a real string boundary.
 */
export function findItemBlocks(
  text: string,
): { mCode: string; block: string }[] {
  // Find every `{` that sits at the top level of an items array — i.e. right
  // after `[` or `,{`. The match keeps the comma so we know the offset.
  const topLevelRe = /(?:\[\s*|\},\s*)\{/g;
  const starts: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = topLevelRe.exec(text)) !== null) {
    // The `{` itself is the last char of the match.
    starts.push(m.index + m[0].length - 1);
  }

  const seen = new Set<string>();
  const out: { mCode: string; block: string }[] = [];
  for (const start of starts) {
    // Walk forward, JSON-aware, until matching `}`.
    let end = start + 1;
    let depth = 1;
    let safety = 0;
    while (end < text.length && depth > 0) {
      if (++safety > 1_000_000) break; // defensive — should never fire
      const c = text[end];
      if (c === '"') {
        // Skip the entire string literal. `\"` is an escape, not a close.
        end++;
        while (end < text.length && text[end] !== '"') {
          if (text[end] === "\\") end++; // skip escaped char
          end++;
        }
        end++; // move past closing `"`
        continue;
      }
      if (c === "{") depth++;
      else if (c === "}") depth--;
      end++;
    }
    if (depth !== 0) continue; // malformed
    const block = text.slice(start, end);
    const mCodeMatch = block.match(/"m_code"\s*:\s*"?([^",}\s]+)/);
    const mCode = mCodeMatch?.[1];
    if (!mCode) continue;
    if (seen.has(mCode)) continue;
    seen.add(mCode);
    out.push({ mCode, block });
  }
  return out;
}

/**
 * Kept for the test suite — given an `m_code` value, return the enclosing
 * `{ ... }` block. Implemented as a thin wrapper around `findItemBlocks`
 * so the two paths can never diverge.
 */
export function findBlockForMCode(
  text: string,
  mCodeValue: string,
): string | null {
  const blocks = findItemBlocks(text);
  const hit = blocks.find((b) => b.mCode === mCodeValue);
  return hit ? hit.block : null;
}

function parseBlocks(html: string): StandardListing[] {
  const text = unescapePayload(html);
  const listings: StandardListing[] = [];

  // Each block is one item's complete `{ ... }` — every field extraction below
  // is scoped to this block, so we never leak into the previous or next item.
  const blocks = findItemBlocks(text);

  for (const { block } of blocks) {
    const carName = fieldFirst(block, "car_name");
    const caseNo =
      fieldFirst(block, "case_num") ?? fieldFirst(block, "case_num_dash");
    if (!carName || !caseNo) continue;

    const yearField = fieldFirst(block, "car_year");
    const mileageField =
      fieldFirst(block, "car_total_mileage_int") ??
      fieldFirst(block, "car_total_mileage");
    const fuelField = fieldFirst(block, "car_fuel") ?? "";
    const etc = fieldFirst(block, "car_etc") ?? "";
    // car_storage_method sometimes has a placeholder empty value then a real
    // value later in the same block — take the last write.
    const storage = fieldLast(block, "car_storage_method") ?? "";
    const special = fieldFirst(block, "special_right") ?? "";
    const addr = fieldFirst(block, "addr") ?? "";

    const blob = mergeText(
      addr,
      carName,
      fuelField,
      etc,
      storage,
      special,
      block.slice(0, 4000),
    );
    const parsed = extractCarDetails(blob);

    const year =
      (yearField && Number(yearField) >= 1990 ? Number(yearField) : null) ??
      parsed.year ??
      parseYear(etc) ??
      parseYear(addr);
    const mileage =
      parseMileage(String(mileageField ?? "")) ??
      (mileageField && /^\d+$/.test(mileageField)
        ? Number(mileageField)
        : null) ??
      parsed.mileage;
    const fuel =
      parsed.fuel === "기타" ? extractCarDetails(fuelField).fuel : parsed.fuel;

    // Prices: take the LAST write inside the block so a placeholder empty
    // value can't shadow the real value emitted later.
    const appraisal = parseWon(
      fieldLast(block, "m_evaluate_price") ??
        fieldLast(block, "eval_price_v"),
    );
    const minPrice = parseWon(
      fieldLast(block, "low_price") ??
        fieldLast(block, "m_bid_price_last") ??
        fieldLast(block, "last_price"),
    );
    const path =
      fieldFirst(block, "case_url") ?? `/caview?m_code=${block.match(/m_code":"([^"]+)/)?.[1] ?? ""}`;

    listings.push({
      id: `madang:${caseNo}`,
      platform: "madang",
      platformName: "경매마당",
      caseNo,
      courtOrDept:
        fieldFirst(block, "bubwon") ??
        fieldFirst(block, "bubwon_short") ??
        "법원 미상",
      carName,
      year,
      mileage,
      fuel: fuel || "기타",
      appraisalPrice: appraisal,
      minPrice,
      discountRate: discountRate(appraisal, minPrice),
      auctionDate:
        fieldFirst(block, "m_bid_date") ??
        fieldFirst(block, "m_bid_date_last") ??
        "—",
      detailUrl: path.startsWith("http") ? path : `https://madangs.com${path}`,
      imageUrl: fieldFirst(block, "img_url"),
      status:
        fieldFirst(block, "state") ??
        fieldFirst(block, "pbctCltrStatNm") ??
        "",
      rawText: mergeText(addr, etc, storage, special, fuelField, carName),
      keyStatus: "미검사",
      matchedKeyKeywords: [],
      matchedDangerKeywords: [],
      grade: "rejected",
      rejectReasons: [],
      storageSite: storage || addr || null,
      isSTier: false,
      sTierScore: 0,
      sTierBreakdown: {
        shortMileage: false,
        warrantyValid: false,
        sweetDiscount: false,
        officialStorage: false,
        crossValidated: false,
        score: 0,
        reasons: [],
      },
      collectedAt: new Date().toISOString(),
    });
  }
  return listings;
}

function stripHtml(text: string): string {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ");
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
    return {
      ok: false,
      status: result.status,
      listings: [],
      bytes: 0,
      signalCount: 0,
    };
  }
  const signalCount = (result.text.match(/car_name/g) || []).length;
  return {
    ok: true,
    status: result.status,
    listings: parseBlocks(result.text),
    bytes: result.text.length,
    signalCount,
  };
}

export async function scrapeMadang(
  config: SearchConfig,
): Promise<{ listings: StandardListing[]; report: SourceReport }> {
  try {
    let best = await fetchMadangOnce();
    if (best.ok && best.listings.length < MIN_HEALTHY_FETCH) {
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

export async function enrichMadangDetail(
  listing: StandardListing,
): Promise<string> {
  try {
    const result = await fetchText(listing.detailUrl, { timeoutMs: 12_000 });
    if (!result.ok) return listing.rawText;
    // Detail pages are also Next.js shells — unescape RSC payloads before stripping tags.
    const unescaped = unescapePayload(result.text);
    const text = stripHtml(unescaped);
    return mergeText(listing.rawText, text.slice(0, 12000));
  } catch {
    return listing.rawText;
  }
}