import { n as fetchText, r as jitterDelay } from "./http-BM2hjrjK.mjs";
import { a as parseMileage, i as mergeText, n as discountRate, o as parseWon, r as extractCarDetails, s as parseYear } from "./scan-H37VM0YZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/madang-CH2EBS4I.js
var LIST_URL = "https://madangs.com/search/car";
var MIN_HEALTHY_FETCH = 10;
function fieldFirst(block, key) {
	const quoted = block.match(new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`));
	if (quoted) return quoted[1].replace(/\\"/g, "\"").replace(/\\\\/g, "\\");
	const array = block.match(new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)\\]`));
	if (array) return array[1].replace(/"/g, " ").replace(/,/g, " ").trim() || null;
	const raw = block.match(new RegExp(`"${key}"\\s*:\\s*([^,}\\]]+)`));
	if (!raw) return null;
	const value = raw[1].trim();
	if (value === "null" || value === "undefined") return null;
	return value.replace(/^"|"$/g, "");
}
function fieldLast(block, key) {
	const quotedRe = new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, "g");
	let lastQuoted = null;
	let match;
	while ((match = quotedRe.exec(block)) !== null) lastQuoted = match[1].replace(/\\"/g, "\"").replace(/\\\\/g, "\\");
	if (lastQuoted != null) return lastQuoted;
	const arrayRe = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)\\]`, "g");
	let lastArray = null;
	while ((match = arrayRe.exec(block)) !== null) lastArray = match[1].replace(/"/g, " ").replace(/,/g, " ").trim() || null;
	if (lastArray != null) return lastArray;
	const rawRe = new RegExp(`"${key}"\\s*:\\s*([^,}\\]]+)`, "g");
	let lastRaw = null;
	while ((match = rawRe.exec(block)) !== null) {
		const value = match[1].trim();
		if (value === "null" || value === "undefined") continue;
		lastRaw = value.replace(/^"|"$/g, "");
	}
	return lastRaw;
}
function unescapePayload(html) {
	let text = html;
	for (let i = 0; i < 6; i++) {
		const next = text.replace(/\\"/g, "\"").replace(/\\n/g, "\n");
		if (next === text) break;
		text = next;
	}
	return text;
}
function parseBlocks(html) {
	const text = unescapePayload(html);
	const listings = [];
	const seen = /* @__PURE__ */ new Set();
	const parts = text.split(/"m_code"\s*:\s*"?/);
	for (let i = 1; i < parts.length; i++) {
		const mCode = parts[i].match(/^([^",}\s]+)/)?.[1];
		if (!mCode || seen.has(mCode)) continue;
		const before = parts[i - 1].slice(-2200);
		const after = parts[i].slice(0, 1600);
		const carName = fieldLast(before, "car_name");
		const caseNo = fieldLast(before, "case_num") ?? fieldLast(before, "case_num_dash");
		if (!carName || !caseNo) continue;
		seen.add(mCode);
		const yearField = fieldLast(before, "car_year");
		const mileageField = fieldLast(before, "car_total_mileage_int") ?? fieldLast(before, "car_total_mileage") ?? fieldFirst(after, "car_total_mileage_int") ?? fieldFirst(after, "car_total_mileage");
		const fuelField = fieldFirst(after, "car_fuel") ?? fieldLast(before, "car_fuel") ?? "";
		const etc = fieldLast(before, "car_etc") ?? "";
		const storage = fieldFirst(after, "car_storage_method") ?? fieldLast(before, "car_storage_method") ?? "";
		const special = fieldLast(before, "special_right") ?? fieldFirst(after, "special_right") ?? "";
		const addr = fieldFirst(after, "addr") ?? fieldLast(before, "addr") ?? "";
		const blob = mergeText(addr, carName, fuelField, etc, storage, special, before.slice(-800), after.slice(0, 800));
		const parsed = extractCarDetails(blob);
		const year = (yearField && Number(yearField) >= 1990 ? Number(yearField) : null) ?? parsed.year ?? parseYear(etc) ?? parseYear(addr);
		const mileage = parseMileage(String(mileageField ?? "")) ?? (mileageField && /^\d+$/.test(mileageField) ? Number(mileageField) : null) ?? parsed.mileage;
		const fuel = parsed.fuel === "기타" ? extractCarDetails(fuelField).fuel : parsed.fuel;
		const appraisal = parseWon(fieldLast(before, "m_evaluate_price") ?? fieldFirst(after, "m_evaluate_price") ?? fieldFirst(after, "eval_price_v"));
		const minPrice = parseWon(fieldFirst(after, "low_price") ?? fieldLast(before, "m_bid_price_last") ?? fieldFirst(after, "last_price"));
		const path = fieldLast(before, "case_url") ?? fieldFirst(after, "case_url") ?? `/caview?m_code=${mCode}`;
		listings.push({
			id: `madang:${caseNo}`,
			platform: "madang",
			platformName: "경매마당",
			caseNo,
			courtOrDept: fieldLast(before, "bubwon") ?? fieldLast(before, "bubwon_short") ?? "법원 미상",
			carName,
			year,
			mileage,
			fuel: fuel || "기타",
			appraisalPrice: appraisal,
			minPrice,
			discountRate: discountRate(appraisal, minPrice),
			auctionDate: fieldLast(before, "m_bid_date") ?? fieldLast(before, "m_bid_date_last") ?? fieldFirst(after, "m_bid_date") ?? "—",
			detailUrl: path.startsWith("http") ? path : `https://madangs.com${path}`,
			imageUrl: fieldLast(before, "img_url") ?? fieldFirst(after, "img_url"),
			status: fieldLast(before, "state") ?? fieldFirst(after, "state") ?? fieldFirst(after, "pbctCltrStatNm") ?? "",
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
function stripHtml(text) {
	return text.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ");
}
async function fetchMadangOnce() {
	const result = await fetchText(LIST_URL, { timeoutMs: 2e4 });
	if (!result.ok) return {
		ok: false,
		status: result.status,
		listings: [],
		bytes: 0,
		signalCount: 0
	};
	const signalCount = (result.text.match(/car_name/g) || []).length;
	return {
		ok: true,
		status: result.status,
		listings: parseBlocks(result.text),
		bytes: result.text.length,
		signalCount
	};
}
async function scrapeMadang(config) {
	try {
		let best = await fetchMadangOnce();
		if (best.ok && best.listings.length < MIN_HEALTHY_FETCH) {
			await jitterDelay(400, 900);
			const retry = await fetchMadangOnce();
			if (retry.listings.length > best.listings.length) best = retry;
		}
		if (!best.ok) return {
			listings: [],
			report: {
				platform: "madang",
				label: "경매마당",
				status: "error",
				fetched: 0,
				message: `HTTP ${best.status}`
			}
		};
		const listings = best.listings.slice(0, config.maxListingsPerSource);
		const parseGap = best.signalCount > 0 && listings.length === 0 ? ` (페이지에 car_name ${best.signalCount}건 신호 있으나 파싱 0건)` : best.signalCount > listings.length ? ` (페이지 신호 ${best.signalCount}건 → 파싱 ${listings.length}건)` : "";
		return {
			listings,
			report: {
				platform: "madang",
				label: "경매마당",
				status: listings.length ? "live" : "empty",
				fetched: listings.length,
				message: listings.length ? `차량검색 페이지에서 ${listings.length}건 수집 (대법원 경매 중계 포함)${parseGap}` : `목록 파싱 결과가 없습니다.${parseGap || ` bytes=${best.bytes}`}`
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
		const text = stripHtml(unescapePayload(result.text));
		return mergeText(listing.rawText, text.slice(0, 12e3));
	} catch {
		return listing.rawText;
	}
}
//#endregion
export { enrichMadangDetail, scrapeMadang };
