import type { SourceReport, StandardListing } from "../types.ts";
import { fetchText } from "./http.ts";

const COURT_HOME = "https://www.courtauction.go.kr/pgj/index.on";

export async function scrapeCourt(): Promise<{
  listings: StandardListing[];
  report: SourceReport;
}> {
  try {
    const result = await fetchText(COURT_HOME, { timeoutMs: 10_000 });
    if (!result.ok) {
      return {
        listings: [],
        report: {
          platform: "court",
          label: "대법원 법원경매",
          status: "blocked",
          fetched: 0,
          message:
            "공식 사이트 연결에 실패했습니다. 경매마당 수집분이 법원 자동차 경매(타경)를 중계합니다.",
        },
      };
    }
    const isWebSquare = result.text.includes("WebSquare") || result.text.includes("w2xPath");
    return {
      listings: [],
      report: {
        platform: "court",
        label: "대법원 법원경매",
        status: "blocked",
        fetched: 0,
        message: isWebSquare
          ? "공식 사이트는 WebSquare SPA라 HTTP만으로는 목록을 뽑을 수 없습니다. 경매마당이 타경 차량을 중계합니다."
          : "공식 사이트 응답에서 자동차 검색 API를 찾지 못했습니다. 경매마당 중계분을 사용합니다.",
      },
    };
  } catch {
    return {
      listings: [],
      report: {
        platform: "court",
        label: "대법원 법원경매",
        status: "blocked",
        fetched: 0,
        message:
          "공식 사이트 타임아웃. 대법원 자동차 검색은 WebSquare 기반이라 서버에서 직접 열리지 않습니다.",
      },
    };
  }
}
