/**
 * Used-car filter — applies the user's year / mileage / price / fuel criteria
 * to a raw list of `UsedCarListing`s. Listings that pass are marked
 * `grade: "match"`; everything else gets `grade: "rejected"` with a reason.
 *
 * Designed to be tolerant of missing fields: a listing with `year: null` is
 * not auto-rejected — we only filter on a field when it has a parseable value.
 */
import type {
  UsedCarConfig,
  UsedCarFuel,
  UsedCarGrade,
  UsedCarListing,
} from "./types.ts";

const FUEL_LABELS: Record<UsedCarFuel, string> = {
  전기: "전기",
  하이브리드: "하이브리드",
  가솔린: "가솔린",
  디젤: "디젤",
  LPG: "LPG",
  기타: "기타",
};

export interface UsedCarFilterResult {
  grade: UsedCarGrade;
  rejectReasons: string[];
}

export function evaluateUsedCar(
  listing: UsedCarListing,
  config: UsedCarConfig,
): UsedCarFilterResult {
  const reasons: string[] = [];

  if (listing.year != null && listing.year < config.minYear) {
    reasons.push(`${listing.year}년식 < ${config.minYear}`);
  }
  if (listing.mileage != null && listing.mileage > config.maxMileageKm) {
    reasons.push(
      `${listing.mileage.toLocaleString("ko-KR")}km > ${config.maxMileageKm.toLocaleString("ko-KR")}km`,
    );
  }
  if (
    listing.listingPrice != null &&
    listing.listingPrice > config.maxPriceKRW
  ) {
    reasons.push(
      `${(listing.listingPrice / 10_000).toLocaleString("ko-KR")}만원 > ${(config.maxPriceKRW / 10_000).toLocaleString("ko-KR")}만원`,
    );
  }
  if (config.fuelAllowlist.length > 0 && !config.fuelAllowlist.includes(listing.fuel)) {
    reasons.push(`연료 ${FUEL_LABELS[listing.fuel]} 제외`);
  }

  return {
    grade: reasons.length === 0 ? "match" : "rejected",
    rejectReasons: reasons,
  };
}

export function applyUsedCarFilter(
  listing: UsedCarListing,
  config: UsedCarConfig,
): UsedCarListing {
  const result = evaluateUsedCar(listing, config);
  return { ...listing, grade: result.grade, rejectReasons: result.rejectReasons };
}

export function applyUsedCarFilters(
  listings: UsedCarListing[],
  config: UsedCarConfig,
): UsedCarListing[] {
  return listings.map((l) => applyUsedCarFilter(l, config));
}
