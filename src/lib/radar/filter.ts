import type { ListingGrade, SearchConfig, StandardListing } from "./types.ts";
import { findKeywords } from "./parser.ts";

const ECO_ALIASES: Record<string, string[]> = {
  하이브리드: ["하이브리드", "hybrid", "hev", "phev", "가솔린+전기", "디젤+전기", "lpg+전기"],
  전기: ["전기", "ev", "수소전기"],
  "가솔린+전기": ["가솔린+전기", "하이브리드"],
  "디젤+전기": ["디젤+전기", "하이브리드"],
  수소전기: ["수소전기", "수소", "전기"],
  수소: ["수소", "수소전기"],
};

function fuelMatches(fuel: string, allowed: string[]): boolean {
  const target = fuel.toLowerCase();
  return allowed.some((want) => {
    const aliases = ECO_ALIASES[want] ?? [want];
    return aliases.some((alias) => target.includes(alias.toLowerCase()));
  });
}

export type FilterBreakdown = {
  yearOk: boolean;
  mileageOk: boolean;
  fuelOk: boolean;
  keyOk: boolean;
  dangerFree: boolean;
  grade: ListingGrade;
  rejectReasons: string[];
  matchedKeyKeywords: string[];
  matchedDangerKeywords: string[];
  keyStatus: string;
};

export function evaluateListing(
  listing: Pick<
    StandardListing,
    "year" | "mileage" | "fuel" | "rawText" | "carName"
  >,
  config: SearchConfig,
): FilterBreakdown {
  const blob = `${listing.carName}\n${listing.rawText}`;
  const matchedKeyKeywords = findKeywords(blob, config.keywordsMustHave);
  const matchedDangerKeywords = findKeywords(blob, config.keywordsExclude);

  const yearOk = listing.year != null && listing.year >= config.minYear;
  const mileageOk =
    listing.mileage != null && listing.mileage <= config.maxMileage;
  const fuelOk = fuelMatches(listing.fuel, config.fuelTypes);
  const dangerFree = matchedDangerKeywords.length === 0;
  const hasKeySignal = matchedKeyKeywords.length > 0;
  const keyOk = config.requireKeyKeyword ? hasKeySignal : true;

  const rejectReasons: string[] = [];
  if (!yearOk) {
    rejectReasons.push(
      listing.year == null
        ? "연식 미확인"
        : `${listing.year}년식 < ${config.minYear}`,
    );
  }
  if (!mileageOk) {
    rejectReasons.push(
      listing.mileage == null
        ? "주행거리 미확인"
        : `${listing.mileage.toLocaleString("ko-KR")}km > ${config.maxMileage.toLocaleString("ko-KR")}km`,
    );
  }
  if (!fuelOk) {
    rejectReasons.push(`연료 ${listing.fuel} 제외`);
  }
  if (!dangerFree) {
    rejectReasons.push(`위험 키워드: ${matchedDangerKeywords.join(", ")}`);
  }

  const stage1 = yearOk && mileageOk && fuelOk && dangerFree;
  let grade: ListingGrade = "rejected";
  if (stage1 && keyOk) grade = "a";
  else if (stage1) grade = "candidate";

  if (stage1 && !keyOk) {
    rejectReasons.push("차키 키워드 미확인");
  }

  const keyStatus = hasKeySignal
    ? `확인 (${matchedKeyKeywords.join(", ")})`
    : config.requireKeyKeyword
      ? "미확인"
      : "검사 생략";

  return {
    yearOk,
    mileageOk,
    fuelOk,
    keyOk,
    dangerFree,
    grade,
    rejectReasons,
    matchedKeyKeywords,
    matchedDangerKeywords,
    keyStatus,
  };
}

export function applyFilter(
  listing: StandardListing,
  config: SearchConfig,
): StandardListing {
  const result = evaluateListing(listing, config);
  return {
    ...listing,
    grade: result.grade,
    rejectReasons: result.rejectReasons,
    matchedKeyKeywords: result.matchedKeyKeywords,
    matchedDangerKeywords: result.matchedDangerKeywords,
    keyStatus: result.keyStatus,
  };
}

export function applyFilters(
  listings: StandardListing[],
  config: SearchConfig,
): StandardListing[] {
  return listings.map((listing) => applyFilter(listing, config));
}
