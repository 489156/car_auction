import type { SearchConfig, TelegramSettings } from "./types.ts";

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  minYear: 2022,
  maxMileage: 50_000,
  fuelTypes: ["하이브리드", "전기", "가솔린+전기", "디젤+전기", "수소전기", "수소"],
  keywordsMustHave: ["키 보관", "열쇠 보관", "스페어키", "시동 확인", "계기판 점등"],
  keywordsExclude: ["전손", "침수", "운행불가", "운행 불가", "불상", "유치권", "폐차", "대파"],
  requireKeyKeyword: true,
  maxListingsPerSource: 80,
};

export const DEFAULT_TELEGRAM: TelegramSettings = {
  botToken: "",
  chatId: "",
  enabled: false,
};

export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
