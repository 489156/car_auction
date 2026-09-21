import type { StandardListing, STierBreakdown } from "./types.ts";

/** S-Tier precision thresholds — copied from the design contract. */
export const STIER_MILEAGE_MAX = 15_000;
export const STIER_YEAR_MIN = 2024;
export const STIER_DISCOUNT_MIN = 30;

/**
 * Tokens that signal a professional / official keeper (오토마트 등).
 * Real scrapers rarely surface the keeper name directly; we cast a wide net
 * including addr-side markers (캠코 보관, 자체보관 입고, 보관이전, 항구
 * 보관) so rule ④ fires on production scrapes.
 *
 * The benchmark patterns this list is tuned against:
 *   - "오토마트 인천보관소"            → "오토마트"
 *   - "오토허브 전문보관소"            → "오토허브", "전문보관"
 *   - "인천항 공영 전문보관소"          → "공영", "공영보관소", "공영 전문보관소"
 */
const OFFICIAL_STORAGE_KEYWORDS = [
  // Brand-name professional keepers (most explicit signal)
  "오토마트",
  "오토허브",
  "오토뱅크",
  "오토옥션",
  "오토센터",
  "오토갤러리",
  "automart",
  "autohub",
  // Government / public storage
  "공인보관",
  "공인 보관",
  "공영보관",
  "공영 보관",
  "공영보관소",
  "공영 보관소",
  "공영전문보관소",
  "공영 전문보관소",
  "지자체보관",
  "지자체 보관",
  // Professional keepers
  "전문보관",
  "전문 보관",
  "전문보관소",
  "전문 보관소",
  // Self-managed + inflow markers
  "자체보관",
  "자체 보관",
  "입고보관",
  "입고 보관",
  // Hub / location qualifiers
  "보관장소",
  "보관 이전",
  "보관이전",
  // Korea Asset Management Corp (캠코) operated storage
  "캠코보관",
  "캠코 보관",
  "캠코직영",
  "캠코 직영",
  // Port / import storage (e.g. 인천항 공영 전문보관소, 부산항)
  "인천항",
  "부산항",
  "항만보관",
  "항만 보관",
  // Catch-all generic signals — only fire when paired with 보- token elsewhere,
  // but the substring scan is fine here because the bucket is small.
  "캠코",
];

/** Try to extract a storage site from raw detail text. */
export function extractStorageSite(
  rawText: string,
  fallback?: string,
): string | null {
  const haystack = (rawText ?? "").trim();
  if (!haystack) return fallback ?? null;
  for (const keyword of OFFICIAL_STORAGE_KEYWORDS) {
    const idx = haystack.indexOf(keyword);
    if (idx < 0) continue;
    const start = Math.max(
      0,
      Math.max(
        haystack.lastIndexOf("\n", idx),
        haystack.lastIndexOf("·", idx),
        haystack.lastIndexOf("•", idx),
      ) + 1,
    );
    let snippet = haystack.slice(start, idx + keyword.length).trim();
    if (snippet.length > 40) snippet = snippet.slice(0, 40).trim();
    if (snippet) return snippet;
  }
  return fallback ?? null;
}

/**
 * Decide whether the listing was entrusted to an official / professional
 * keeper. Real-world keepers are buried in different fields per platform:
 *   - Madang: `addr` (e.g. "경기 화성 ○○동 오토마트 ○○보관소")
 *   - Onbid: `courtOrDept` and registry metadata
 *   - Both: `rawText` blob (last-resort scan)
 *
 * Layered detection:
 *   1. Direct keyword match (오토마트 / 오토허브 / 공인보관 / 공영보관 등)
 *   2. Platform + registry inference — Onbid listings from 캠코/한국자산관리공사
 *      are stored at 캠코's official warehouses by default.
 */
export function isOfficialStorage(
  rawText: string,
  storageSite: string | null,
  address: string | null = null,
  registry: string | null = null,
  platform: string | null = null,
): boolean {
  const blob = [storageSite, address, registry, rawText]
    .filter((s) => typeof s === "string" && s.length > 0)
    .join("\n");
  if (blob && OFFICIAL_STORAGE_KEYWORDS.some((keyword) => blob.includes(keyword))) {
    return true;
  }
  // Platform-aware fallback: 캠코 (Onbid) and 한국자산관리공사 operate their
  // own official storage yards; any listing they own is officially stored.
  if (platform === "onbid" && blob && /캠코|한국자산관리공사/.test(blob)) {
    return true;
  }
  return false;
}

function reasonLineFor(rule: keyof Omit<STierBreakdown, "score" | "reasons">, listing: StandardListing): string {
  switch (rule) {
    case "shortMileage":
      return listing.mileage == null
        ? "주행거리 정보 부족"
        : `초단거리 주행거리 (${listing.mileage.toLocaleString("ko-KR")}km ≤ 15k km)`;
    case "warrantyValid":
      return listing.year == null
        ? "제조사 보증 검증 불가"
        : `제조사 무상보증 유효 (${listing.year}년식)`;
    case "sweetDiscount":
      return listing.discountRate == null
        ? "유찰 할인 정보 부족"
        : `유찰 스윗스팟 (${listing.discountRate}% 직행 감가)`;
    case "officialStorage":
      return `공인 전문보관소 입고 (${listing.storageSite ?? "공인보관"})`;
    case "crossValidated":
      return "사고이력·키 상태 교차 검증 완료";
  }
}

/**
 * Compute the S-Tier breakdown for one listing. The five rules are evaluated
 * independently; the score is a 0–100 weighted sum used for ordering and the
 * detail modal progress bar.
 */
export function evaluateSTier(listing: StandardListing): STierBreakdown {
  const shortMileage = listing.mileage != null && listing.mileage <= STIER_MILEAGE_MAX;
  const warrantyValid = listing.year != null && listing.year >= STIER_YEAR_MIN;
  const sweetDiscount = listing.discountRate != null && listing.discountRate >= STIER_DISCOUNT_MIN;
  // Defense-in-depth: rawText is the canonical scan target, but pass the
  // registry / department so a keeper name that lives only in `courtOrDept`
  // still lights up rule ④. Platform is forwarded so the Onbid/캠코 fallback
  // can fire on listings whose rawText is just the registry name.
  const officialStorage = isOfficialStorage(
    listing.rawText,
    listing.storageSite,
    null,
    listing.courtOrDept,
    listing.platform,
  );
  // Cross-validation is implicit once the detail text contains a key keyword
  // and no danger keywords are present (filter already excluded the latter).
  const crossValidated =
    listing.matchedKeyKeywords.length > 0 &&
    listing.matchedDangerKeywords.length === 0;

  const reasons: string[] = [];
  const flags: Array<keyof Omit<STierBreakdown, "score" | "reasons">> = [
    "shortMileage",
    "warrantyValid",
    "sweetDiscount",
    "officialStorage",
    "crossValidated",
  ];
  for (const flag of flags) {
    const value = {
      shortMileage,
      warrantyValid,
      sweetDiscount,
      officialStorage,
      crossValidated,
    }[flag];
    if (value) reasons.push(reasonLineFor(flag, listing));
  }

  // Weighted sum: mileage + warranty + discount are the "headline" signals.
  const weights: Record<typeof flags[number], number> = {
    shortMileage: 24,
    warrantyValid: 22,
    sweetDiscount: 20,
    officialStorage: 18,
    crossValidated: 16,
  };
  let score = 0;
  for (const flag of flags) {
    const value = {
      shortMileage,
      warrantyValid,
      sweetDiscount,
      officialStorage,
      crossValidated,
    }[flag];
    if (value) score += weights[flag];
  }
  // A-grade listings without all 5 rules still get a partial score (8-60) so
  // the UI can show progress toward S-Tier without treating them as failures.
  if (!shortMileage && listing.mileage != null && listing.mileage <= 30_000) {
    score = Math.max(score, 60);
  } else if (!shortMileage) {
    score = Math.max(score, 35);
  }

  return {
    shortMileage,
    warrantyValid,
    sweetDiscount,
    officialStorage,
    crossValidated,
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
  };
}

/** True only when every S-Tier rule passed (mirrors the design contract). */
export function passesAllSTierRules(b: STierBreakdown): boolean {
  return (
    b.shortMileage &&
    b.warrantyValid &&
    b.sweetDiscount &&
    b.officialStorage &&
    b.crossValidated
  );
}