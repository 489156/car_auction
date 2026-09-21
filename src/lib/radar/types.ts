export const PLATFORMS = ["court", "onbid", "madang"] as const;
export type Platform = (typeof PLATFORMS)[number];

export type SourceStatus = "live" | "blocked" | "empty" | "error";

export type ListingGrade = "a" | "candidate" | "rejected";

export type SearchConfig = {
  minYear: number;
  maxMileage: number;
  fuelTypes: string[];
  keywordsMustHave: string[];
  keywordsExclude: string[];
  requireKeyKeyword: boolean;
  maxListingsPerSource: number;
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
  };
};

export type TelegramSettings = {
  botToken: string;
  chatId: string;
  enabled: boolean;
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
