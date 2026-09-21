import type { SearchConfig, TelegramSettings } from "./types.ts";

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  minYear: 2022,
  maxMileage: 50_000,
  fuelTypes: ["하이브리드", "전기", "가솔린+전기", "디젤+전기", "수소전기", "수소"],
  keywordsMustHave: [
    "키 보관",
    "열쇠 보관",
    "스페어키",
    "스페어키 2개",
    "시동 확인",
    "시동 정상",
    "정상 시동",
    "시동 확인 완료",
    "계기판 점등",
    "스마트키",
    "버튼시동",
    "차량키",
    "차키",
    "키보관",
    "열쇠보관",
    "시동확인",
    "계기판점등",
    "키 있음",
    "열쇠 있음",
    "키 2개",
    "열쇠 2개",
    "키 보유",
    "열쇠 보유",
  ],
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
