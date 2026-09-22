/**
 * Used-car lane types. Parallel to `StandardListing` but without auction-specific
 * concepts (appraisal vs min bid, court case number, discount %, S-Tier rules).
 *
 * Listings are still normalised to the smallest common shape across both scrapers
 * so the UI can render them with one component.
 */

export type UsedCarPlatform = "kcar" | "kbchachacha";

export type UsedCarFuel =
  | "전기"
  | "하이브리드"
  | "가솔린"
  | "디젤"
  | "LPG"
  | "기타";

export interface UsedCarListing {
  /** Stable id — `<platform>:<platform-specific id>` */
  id: string;
  platform: UsedCarPlatform;
  platformName: string;
  /** Display label of the car (e.g. "현대 더 뉴 그랜드 스타렉스 밴 3인승 스마트") */
  carName: string;
  /** 4-digit year, e.g. 2024 — null when unparseable */
  year: number | null;
  /** Mileage in km — null when unparseable */
  mileage: number | null;
  /** Listing price in KRW — null when unparseable */
  listingPrice: number | null;
  /** Fuel classification — "기타" when unparseable */
  fuel: UsedCarFuel;
  /** Raw Korean fuel label as it appeared on the page, for the tooltip */
  fuelLabel: string;
  /** Region / seller name as displayed (KB차차차: 딜러명, K Car: "홈서비스 메가센터" 등) */
  seller: string;
  /** Absolute URL to the listing's detail page */
  detailUrl: string;
  /** Optional thumbnail URL */
  imageUrl: string | null;
  /** Tags / features shown beneath the price (e.g. "6개월 보증", "정비완료") */
  tags: string[];
  /** Source card text — kept so the detail modal can show what was scraped */
  rawText: string;
  /** ISO timestamp of when the listing was collected */
  collectedAt: string;
  /** Set by `applyUsedCarFilter` */
  grade?: UsedCarGrade;
  /** Reasons why this listing was filtered out (empty when grade is "match") */
  rejectReasons?: string[];
}

export interface UsedCarConfig {
  /** Inclusive minimum year. Listings older than this are filtered out. */
  minYear: number;
  /** Inclusive maximum mileage in km. */
  maxMileageKm: number;
  /** Inclusive maximum price in KRW. */
  maxPriceKRW: number;
  /** Allowed fuel types. Empty array = all fuels allowed. */
  fuelAllowlist: UsedCarFuel[];
  /** Max listings to keep per platform. */
  maxListingsPerSource: number;
}

export const DEFAULT_USED_CAR_CONFIG: UsedCarConfig = {
  minYear: 2024,
  maxMileageKm: 50_000,
  maxPriceKRW: 30_000_000,
  fuelAllowlist: ["전기", "하이브리드"],
  maxListingsPerSource: 30,
};

export type UsedCarGrade = "match" | "rejected";

export interface UsedCarSourceReport {
  platform: UsedCarPlatform;
  label: string;
  /** "live" when at least one listing scraped, "empty" when zero, "error" on failure */
  status: "live" | "empty" | "error" | "skipped";
  fetched: number;
  /** Korean-language status message shown on the dashboard */
  message: string;
  /** True when the scraper needs Playwright locally and it isn't available here */
  localOnly: boolean;
}

export interface UsedCarScanResult {
  scannedAt: string;
  durationMs: number;
  config: UsedCarConfig;
  listings: UsedCarListing[];
  totals: {
    fetched: number;
    matched: number;
    rejected: number;
    byPlatform: Record<UsedCarPlatform, number>;
  };
  sources: UsedCarSourceReport[];
}
