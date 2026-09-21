import { n as fetchText } from "./http-ChsCgeta.mjs";
import { a as parseMileage, i as mergeText, n as discountRate, o as parseWon, r as extractCarDetails, s as parseYear } from "./scan-Cftsl-xP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/madang-D5dkmYxs.js
var LIST_URL = "https://madangs.com/search/car";
function field(block, key) {
	const quoted = block.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`));
	if (quoted) return quoted[1];
	const raw = block.match(new RegExp(`"${key}"\\s*:\\s*([^,}\\]]+)`));
	if (!raw) return null;
	const value = raw[1].trim();
	if (value === "null" || value === "undefined") return null;
	return value.replace(/^"|"$/g, "");
}
function unescapePayload(html) {
	return html.replace(/\\"/g, "\"").replace(/\\n/g, "\n");
}
function parseBlocks(html) {
	const chunks = unescapePayload(html).split(/\{"addr":/);
	const listings = [];
	const seen = /* @__PURE__ */ new Set();
	for (const chunk of chunks) {
		const block = `{"addr":${chunk}`;
		const carName = field(block, "car_name");
		const caseNo = field(block, "case_num") ?? field(block, "case_num_dash");
		const mCode = field(block, "m_code");
		if (!carName || !caseNo || !mCode) continue;
		if (seen.has(mCode)) continue;
		seen.add(mCode);
		const yearField = field(block, "car_year");
		const mileageField = field(block, "car_total_mileage_int") ?? field(block, "car_total_mileage");
		const fuelField = field(block, "car_fuel") ?? "";
		const etc = field(block, "car_etc") ?? "";
		const storage = field(block, "car_storage_method") ?? "";
		const special = field(block, "special_right") ?? "";
		const addr = field(block, "addr") ?? "";
		const blob = mergeText(addr, carName, fuelField, etc, storage, special, block.slice(0, 1800));
		const parsed = extractCarDetails(blob);
		const year = (yearField && Number(yearField) >= 1990 ? Number(yearField) : null) ?? parsed.year ?? parseYear(etc) ?? parseYear(addr);
		const mileage = parseMileage(String(mileageField ?? "")) ?? (mileageField && /^\d+$/.test(mileageField) ? Number(mileageField) : null) ?? parsed.mileage;
		const fuel = parsed.fuel === "기타" ? extractCarDetails(fuelField).fuel : parsed.fuel;
		const appraisal = parseWon(field(block, "m_evaluate_price") ?? field(block, "eval_price_v"));
		const minPrice = parseWon(field(block, "low_price") ?? field(block, "m_bid_price_last") ?? field(block, "last_price"));
		const path = field(block, "case_url") ?? `/caview?m_code=${mCode}`;
		listings.push({
			id: `madang:${caseNo}`,
			platform: "madang",
			platformName: "경매마당",
			caseNo,
			courtOrDept: field(block, "bubwon") ?? field(block, "bubwon_short") ?? "법원 미상",
			carName,
			year,
			mileage,
			fuel: fuel || "기타",
			appraisalPrice: appraisal,
			minPrice,
			discountRate: discountRate(appraisal, minPrice),
			auctionDate: field(block, "m_bid_date") ?? field(block, "m_bid_date_last") ?? "—",
			detailUrl: path.startsWith("http") ? path : `https://madangs.com${path}`,
			imageUrl: field(block, "img_url"),
			status: field(block, "state") ?? field(block, "pbctCltrStatNm") ?? "",
			rawText: mergeText(addr, etc, storage, special, fuelField, carName),
			keyStatus: "미검사",
			matchedKeyKeywords: [],
			matchedDangerKeywords: [],
			grade: "rejected",
			rejectReasons: [],
			collectedAt: (/* @__PURE__ */ new Date()).toISOString()
		});
	}
	return listings;
}
async function scrapeMadang(config) {
	try {
		const result = await fetchText(LIST_URL, { timeoutMs: 2e4 });
		if (!result.ok) return {
			listings: [],
			report: {
				platform: "madang",
				label: "경매마당",
				status: "error",
				fetched: 0,
				message: `HTTP ${result.status}`
			}
		};
		const listings = parseBlocks(result.text).slice(0, config.maxListingsPerSource);
		return {
			listings,
			report: {
				platform: "madang",
				label: "경매마당",
				status: listings.length ? "live" : "empty",
				fetched: listings.length,
				message: listings.length ? `차량검색 페이지에서 ${listings.length}건 수집 (대법원 경매 중계 포함)` : "목록 파싱 결과가 없습니다."
			}
		};
	} catch (error) {
		return {
			listings: [],
			report: {
				platform: "madang",
				label: "경매마당",
				status: "error",
				fetched: 0,
				message: error instanceof Error ? error.message : "요청 실패"
			}
		};
	}
}
async function enrichMadangDetail(listing) {
	try {
		const result = await fetchText(listing.detailUrl, { timeoutMs: 12e3 });
		if (!result.ok) return listing.rawText;
		const text = result.text.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
		return mergeText(listing.rawText, text.slice(0, 8e3));
	} catch {
		return listing.rawText;
	}
}
//#endregion
export { enrichMadangDetail, scrapeMadang };
