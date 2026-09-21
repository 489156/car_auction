export type ExtractedSpecs = {
  year: number | null;
  mileage: number | null;
  fuel: string;
};

const YEAR_PATTERNS = [
  /(20\d{2})\s*년식/,
  /(20\d{2})\s*년/,
  /연식[^\d]{0,8}(20\d{2})/,
];

const MILEAGE_PATTERNS = [
  /(?:주행거리|계기판)[^\d]{0,12}([\d,]+)\s*(?:km|㎞|킬로미터)/i,
  /([\d,]+)\s*(?:km|㎞)/i,
  /([\d,]+)\s*킬로미터/,
];

const ECO_FUEL_RULES: Array<{ label: string; tests: string[] }> = [
  { label: "수소전기", tests: ["수소전기", "수소 전기", "수소연료"] },
  { label: "가솔린+전기", tests: ["가솔린+전기", "가솔린 + 전기", "휘발유+전기"] },
  { label: "디젤+전기", tests: ["디젤+전기", "디젤 + 전기", "경유+전기"] },
  { label: "하이브리드", tests: ["하이브리드", "hybrid", "hev", "phev", "lpg+전기", "lpg + 전기"] },
  { label: "전기", tests: ["전기차", "전기", " ev", "ev ", "ev차"] },
  { label: "수소", tests: ["수소"] },
];

const ICE_FUEL_RULES: Array<{ label: string; tests: string[] }> = [
  { label: "휘발유", tests: ["휘발유", "가솔린"] },
  { label: "디젤", tests: ["디젤", "경유"] },
  { label: "LPG", tests: ["lpg", "엘피지"] },
];

export function parseYear(text: string): number | null {
  if (!text) return null;
  for (const pattern of YEAR_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    const year = Number(match[1]);
    if (year >= 1990 && year <= 2035) return year;
  }
  return null;
}

export function parseMileage(text: string): number | null {
  if (!text) return null;
  const compact = text.replace(/\s+/g, " ");
  for (const pattern of MILEAGE_PATTERNS) {
    const match = compact.match(pattern);
    if (!match) continue;
    const raw = match[1]?.replace(/,/g, "") ?? "";
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 3_000_000) continue;
    return value;
  }
  return null;
}

export function parseFuel(text: string): string {
  if (!text) return "기타";
  const lower = text.toLowerCase();
  for (const rule of ECO_FUEL_RULES) {
    if (rule.tests.some((term) => lower.includes(term.toLowerCase()))) {
      return rule.label;
    }
  }
  for (const rule of ICE_FUEL_RULES) {
    if (rule.tests.some((term) => lower.includes(term.toLowerCase()))) {
      return rule.label;
    }
  }
  return "기타";
}

export function extractCarDetails(text: string): ExtractedSpecs {
  return {
    year: parseYear(text),
    mileage: parseMileage(text),
    fuel: parseFuel(text),
  };
}

export function parseWon(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value !== "string") return null;
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function discountRate(
  appraisal: number | null,
  minPrice: number | null,
): number | null {
  if (!appraisal || !minPrice || appraisal <= 0) return null;
  const rate = Math.round((1 - minPrice / appraisal) * 100);
  if (!Number.isFinite(rate)) return null;
  return Math.max(0, Math.min(99, rate));
}

export function findKeywords(text: string, keywords: string[]): string[] {
  if (!text) return [];
  const compact = text.replace(/\s+/g, "");
  const found: string[] = [];
  for (const word of keywords) {
    const trimmed = word.trim();
    if (!trimmed) continue;
    const compactWord = trimmed.replace(/\s+/g, "");
    if (
      text.includes(trimmed) ||
      (compactWord.length > 0 && compact.includes(compactWord))
    ) {
      found.push(trimmed);
    }
  }
  return found;
}

export function mergeText(...parts: Array<string | null | undefined>): string {
  return parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" \n ");
}
