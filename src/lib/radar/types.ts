export const PLATFORMS = ["court", "onbid", "madang"] as const;
export type Platform = (typeof PLATFORMS)[number];

export type SourceStatus = "live" | "blocked" | "empty" | "error";

export type ListingGrade = "a" | "candidate" | "rejected";

/** S-Tier precision tier derived from the 5-rule checklist. */
export type STierTier = "s" | "a" | null;

export type SearchConfig = {
  minYear: number;
  maxMileage: number;
  fuelTypes: string[];
  keywordsMustHave: string[];
  keywordsExclude: string[];
  requireKeyKeyword: boolean;
  maxListingsPerSource: number;
};

export type STierBreakdown = {
  /** Mileage ≤ 15,000 km */
  shortMileage: boolean;
  /** Year ≥ 2024 (manufacturer warranty still in effect) */
  warrantyValid: boolean;
  /** Discount ≥ 30% (1-2 times un-bid sweet spot) */
  sweetDiscount: boolean;
  /** Stored at a recognized professional keeper (Automart/오토마트/공인/오토허브) */
  officialStorage: boolean;
  /** Accident history + mileage cross-checked against external sources */
  crossValidated: boolean;
  /** Computed 0–100 score */
  score: number;
  /** Korean explanation bullets for the detail modal */
  reasons: string[];
};

export type StandardListing = {
  id: string;
  platform: Platform;
  platformName: string;
  caseNo: string;
  courtOrDept: string;
  carName: string;
  year: number | null;
  mileage: number | null;
  fuel: string;
  appraisalPrice: number | null;
  minPrice: number | null;
  discountRate: number | null;
  auctionDate: string;
  detailUrl: string;
  imageUrl: string | null;
  status: string;
  rawText: string;
  keyStatus: string;
  matchedKeyKeywords: string[];
  matchedDangerKeywords: string[];
  grade: ListingGrade;
  rejectReasons: string[];
  collectedAt: string;
  /** Detected/derived storage site name (e.g. "오토마트 인천보관소"). */
  storageSite: string | null;
  /** True when the S-Tier 5-rule checklist is fully passed. */
  isSTier: boolean;
  /** 0–100 S-Tier precision score (only meaningful when isSTier is true). */
  sTierScore: number;
  /** Per-rule breakdown for the detail modal. */
  sTierBreakdown: STierBreakdown;
};

export type SourceReport = {
  platform: Platform;
  label: string;
  status: SourceStatus;
  fetched: number;
  message: string;
};

export type ScanResult = {
  scannedAt: string;
  durationMs: number;
  sources: SourceReport[];
  listings: StandardListing[];
  totals: {
    fetched: number;
    stage1: number;
    gradeA: number;
    candidates: number;
    rejected: number;
    sTier: number;
    sweetDiscountPct: number;
  };
};

export type TelegramSettings = {
  botToken: string;
  chatId: string;
  enabled: boolean;
};

export type WebAlertSettings = {
  /** Browser/desktop push for S-Tier matches */
  enabled: boolean;
  /** Score cutoff (70–95) for instant web alerts */
  threshold: number;
  /** Auto-scan cadence label */
  interval: "6h" | "12h" | "realtime";
};

export const PLATFORM_META: Record<
  Platform,
  { label: string; short: string; site: string }
> = {
  court: {
    label: "대법원 법원경매",
    short: "법원경매",
    site: "https://www.courtauction.go.kr",
  },
  onbid: {
    label: "캠코 온비드",
    short: "온비드",
    site: "https://www.onbid.co.kr",
  },
  madang: {
    label: "경매마당",
    short: "경매마당",
    site: "https://madangs.com/search/car",
  },
};