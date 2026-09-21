import { t as DEFAULT_SEARCH_CONFIG } from "./config-CaI-hVHF.mjs";
import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/scan-Cftsl-xP.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var YEAR_PATTERNS = [
	/(20\d{2})\s*년식/,
	/(20\d{2})\s*년/,
	/연식[^\d]{0,8}(20\d{2})/
];
var MILEAGE_PATTERNS = [
	/(?:주행거리|계기판)[^\d]{0,12}([\d,]+)\s*(?:km|㎞|킬로미터)/i,
	/([\d,]+)\s*(?:km|㎞)/i,
	/([\d,]+)\s*킬로미터/
];
var ECO_FUEL_RULES = [
	{
		label: "수소전기",
		tests: [
			"수소전기",
			"수소 전기",
			"수소연료"
		]
	},
	{
		label: "가솔린+전기",
		tests: [
			"가솔린+전기",
			"가솔린 + 전기",
			"휘발유+전기"
		]
	},
	{
		label: "디젤+전기",
		tests: [
			"디젤+전기",
			"디젤 + 전기",
			"경유+전기"
		]
	},
	{
		label: "하이브리드",
		tests: [
			"하이브리드",
			"hybrid",
			"hev",
			"phev",
			"lpg+전기",
			"lpg + 전기"
		]
	},
	{
		label: "전기",
		tests: [
			"전기차",
			"전기",
			" ev",
			"ev ",
			"ev차"
		]
	},
	{
		label: "수소",
		tests: ["수소"]
	}
];
var ICE_FUEL_RULES = [
	{
		label: "휘발유",
		tests: ["휘발유", "가솔린"]
	},
	{
		label: "디젤",
		tests: ["디젤", "경유"]
	},
	{
		label: "LPG",
		tests: ["lpg", "엘피지"]
	}
];
function parseYear(text) {
	if (!text) return null;
	for (const pattern of YEAR_PATTERNS) {
		const match = text.match(pattern);
		if (!match) continue;
		const year = Number(match[1]);
		if (year >= 1990 && year <= 2035) return year;
	}
	return null;
}
function parseMileage(text) {
	if (!text) return null;
	const compact = text.replace(/\s+/g, " ");
	for (const pattern of MILEAGE_PATTERNS) {
		const match = compact.match(pattern);
		if (!match) continue;
		const raw = match[1]?.replace(/,/g, "") ?? "";
		const value = Number(raw);
		if (!Number.isFinite(value) || value < 0 || value > 3e6) continue;
		return value;
	}
	return null;
}
function parseFuel(text) {
	if (!text) return "기타";
	const lower = text.toLowerCase();
	for (const rule of ECO_FUEL_RULES) if (rule.tests.some((term) => lower.includes(term.toLowerCase()))) return rule.label;
	for (const rule of ICE_FUEL_RULES) if (rule.tests.some((term) => lower.includes(term.toLowerCase()))) return rule.label;
	return "기타";
}
function extractCarDetails(text) {
	return {
		year: parseYear(text),
		mileage: parseMileage(text),
		fuel: parseFuel(text)
	};
}
function parseWon(value) {
	if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.round(value);
	if (typeof value !== "string") return null;
	const digits = value.replace(/[^\d]/g, "");
	if (!digits) return null;
	const n = Number(digits);
	return Number.isFinite(n) && n > 0 ? n : null;
}
function discountRate(appraisal, minPrice) {
	if (!appraisal || !minPrice || appraisal <= 0) return null;
	const rate = Math.round((1 - minPrice / appraisal) * 100);
	if (!Number.isFinite(rate)) return null;
	return Math.max(0, Math.min(99, rate));
}
function findKeywords(text, keywords) {
	if (!text) return [];
	const found = [];
	for (const word of keywords) {
		const trimmed = word.trim();
		if (!trimmed) continue;
		if (text.includes(trimmed)) found.push(trimmed);
	}
	return found;
}
function mergeText(...parts) {
	return parts.filter((part) => Boolean(part && part.trim())).join(" \n ");
}
var ECO_ALIASES = {
	하이브리드: [
		"하이브리드",
		"hybrid",
		"hev",
		"phev",
		"가솔린+전기",
		"디젤+전기",
		"lpg+전기"
	],
	전기: [
		"전기",
		"ev",
		"수소전기"
	],
	"가솔린+전기": ["가솔린+전기", "하이브리드"],
	"디젤+전기": ["디젤+전기", "하이브리드"],
	수소전기: [
		"수소전기",
		"수소",
		"전기"
	],
	수소: ["수소", "수소전기"]
};
function fuelMatches(fuel, allowed) {
	const target = fuel.toLowerCase();
	return allowed.some((want) => {
		return (ECO_ALIASES[want] ?? [want]).some((alias) => target.includes(alias.toLowerCase()));
	});
}
function evaluateListing(listing, config) {
	const blob = `${listing.carName}\n${listing.rawText}`;
	const matchedKeyKeywords = findKeywords(blob, config.keywordsMustHave);
	const matchedDangerKeywords = findKeywords(blob, config.keywordsExclude);
	const yearOk = listing.year != null && listing.year >= config.minYear;
	const mileageOk = listing.mileage != null && listing.mileage <= config.maxMileage;
	const fuelOk = fuelMatches(listing.fuel, config.fuelTypes);
	const dangerFree = matchedDangerKeywords.length === 0;
	const hasKeySignal = matchedKeyKeywords.length > 0;
	const keyOk = config.requireKeyKeyword ? hasKeySignal : true;
	const rejectReasons = [];
	if (!yearOk) rejectReasons.push(listing.year == null ? "연식 미확인" : `${listing.year}년식 < ${config.minYear}`);
	if (!mileageOk) rejectReasons.push(listing.mileage == null ? "주행거리 미확인" : `${listing.mileage.toLocaleString("ko-KR")}km > ${config.maxMileage.toLocaleString("ko-KR")}km`);
	if (!fuelOk) rejectReasons.push(`연료 ${listing.fuel} 제외`);
	if (!dangerFree) rejectReasons.push(`위험 키워드: ${matchedDangerKeywords.join(", ")}`);
	const stage1 = yearOk && mileageOk && fuelOk && dangerFree;
	let grade = "rejected";
	if (stage1 && keyOk) grade = "a";
	else if (stage1) grade = "candidate";
	if (stage1 && !keyOk) rejectReasons.push("차키 키워드 미확인");
	const keyStatus = hasKeySignal ? `확인 (${matchedKeyKeywords.join(", ")})` : config.requireKeyKeyword ? "미확인" : "검사 생략";
	return {
		yearOk,
		mileageOk,
		fuelOk,
		keyOk,
		dangerFree,
		grade,
		rejectReasons,
		matchedKeyKeywords,
		matchedDangerKeywords,
		keyStatus
	};
}
function applyFilter(listing, config) {
	const result = evaluateListing(listing, config);
	return {
		...listing,
		grade: result.grade,
		rejectReasons: result.rejectReasons,
		matchedKeyKeywords: result.matchedKeyKeywords,
		matchedDangerKeywords: result.matchedDangerKeywords,
		keyStatus: result.keyStatus
	};
}
var scan_exports = /* @__PURE__ */ __exportAll({
	runAuctionScan_createServerFn_handler: () => runAuctionScan_createServerFn_handler,
	sendTelegramAlerts_createServerFn_handler: () => sendTelegramAlerts_createServerFn_handler
});
var ScanInputSchema = { parse(input) {
	const data = input ?? {};
	return {
		config: {
			...DEFAULT_SEARCH_CONFIG,
			...data.config
		},
		enrich: data.enrich !== false
	};
} };
function dedupe(listings) {
	const byId = /* @__PURE__ */ new Map();
	const byCase = /* @__PURE__ */ new Map();
	for (const listing of listings) {
		if (byId.has(listing.id)) continue;
		const caseKey = listing.caseNo.replace(/\s+/g, "");
		const existing = byCase.get(caseKey);
		if (existing && existing.platform !== listing.platform) continue;
		byId.set(listing.id, listing);
		byCase.set(caseKey, listing);
	}
	return [...byId.values()];
}
var runAuctionScan_createServerFn_handler = createServerRpc({
	id: "93528b6dfa3de3ef3a78a0378788808ad4ea1155c8e4dabbfbfad7126a795270",
	name: "runAuctionScan",
	filename: "src/lib/radar/scan.ts"
}, (opts) => runAuctionScan.__executeServer(opts));
var runAuctionScan = createServerFn({ method: "POST" }).validator(ScanInputSchema).handler(runAuctionScan_createServerFn_handler, async ({ data }) => {
	const started = Date.now();
	const { config, enrich } = data;
	const [{ scrapeMadang, enrichMadangDetail }, { scrapeOnbid, enrichOnbidDetail }, { scrapeCourt }] = await Promise.all([
		import("./madang-D5dkmYxs.mjs"),
		import("./onbid-DCVwPhtQ.mjs"),
		import("./court-G7fFGAbT.mjs")
	]);
	const [madang, onbid, court] = await Promise.all([
		scrapeMadang(config),
		scrapeOnbid(config),
		scrapeCourt()
	]);
	let listings = dedupe([
		...madang.listings,
		...onbid.listings,
		...court.listings
	]);
	if (enrich) {
		const targets = listings.map((row) => applyFilter(row, {
			...config,
			requireKeyKeyword: false
		})).filter((row) => row.grade === "a" || row.grade === "candidate").slice(0, 8);
		await Promise.all(targets.map(async (row) => {
			const extra = row.platform === "madang" ? await enrichMadangDetail(row) : row.platform === "onbid" ? await enrichOnbidDetail(row) : row.rawText;
			const original = listings.find((item) => item.id === row.id);
			if (original) original.rawText = extra;
		}));
	}
	listings = listings.map((row) => applyFilter(row, config)).sort((a, b) => {
		const rank = {
			a: 0,
			candidate: 1,
			rejected: 2
		};
		if (rank[a.grade] !== rank[b.grade]) return rank[a.grade] - rank[b.grade];
		return (b.year ?? 0) - (a.year ?? 0);
	});
	const stage1 = listings.filter((row) => row.grade === "a" || row.grade === "candidate");
	return {
		scannedAt: (/* @__PURE__ */ new Date()).toISOString(),
		durationMs: Date.now() - started,
		sources: [
			court.report,
			onbid.report,
			madang.report
		],
		listings,
		totals: {
			fetched: listings.length,
			stage1: stage1.length,
			gradeA: listings.filter((row) => row.grade === "a").length,
			candidates: listings.filter((row) => row.grade === "candidate").length,
			rejected: listings.filter((row) => row.grade === "rejected").length
		}
	};
});
function telegramBody(listing) {
	const mileage = listing.mileage == null ? "미확인" : `${listing.mileage.toLocaleString("ko-KR")} km`;
	const appraisal = listing.appraisalPrice == null ? "—" : `${listing.appraisalPrice.toLocaleString("ko-KR")} 원`;
	const minPrice = listing.minPrice == null ? "—" : `${listing.minPrice.toLocaleString("ko-KR")} 원`;
	const discount = listing.discountRate == null ? "" : ` (${listing.discountRate}% 유찰)`;
	return [
		"A급 알짜 경매/공매 차량 발견",
		"---------------------------------",
		`출처: ${listing.platformName} (${listing.courtOrDept})`,
		`사건/물건번호: ${listing.caseNo}`,
		`차종: ${listing.carName}`,
		`연식: ${listing.year ?? "미확인"}년식 | 주행거리: ${mileage}`,
		`연료: ${listing.fuel}`,
		"",
		`감정평가액: ${appraisal}`,
		`최저매각가: ${minPrice}${discount}`,
		"",
		`차키 상태: ${listing.keyStatus}`,
		`매각/입찰기일: ${listing.auctionDate}`,
		"---------------------------------",
		listing.detailUrl
	].join("\n");
}
var NotifyInput = { parse(input) {
	const data = input;
	return {
		telegram: data.telegram,
		listings: Array.isArray(data.listings) ? data.listings : []
	};
} };
var sendTelegramAlerts_createServerFn_handler = createServerRpc({
	id: "92d2355c98b380f8cb80cce32b15e5d7e3b8d474191fbbc63609bebff08597c5",
	name: "sendTelegramAlerts",
	filename: "src/lib/radar/scan.ts"
}, (opts) => sendTelegramAlerts.__executeServer(opts));
var sendTelegramAlerts = createServerFn({ method: "POST" }).validator(NotifyInput).handler(sendTelegramAlerts_createServerFn_handler, async ({ data }) => {
	const { telegram, listings } = data;
	if (!telegram.enabled || !telegram.botToken || !telegram.chatId) return {
		sent: 0,
		error: "텔레그램 봇 토큰과 채팅 ID가 필요합니다."
	};
	let sent = 0;
	for (const listing of listings) {
		const url = `https://api.telegram.org/bot${telegram.botToken}/sendMessage`;
		const response = await fetch(url, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				chat_id: telegram.chatId,
				text: telegramBody(listing),
				disable_web_page_preview: false
			})
		});
		if (!response.ok) {
			const body = await response.text();
			return {
				sent,
				error: `Telegram HTTP ${response.status}: ${body.slice(0, 180)}`
			};
		}
		sent += 1;
	}
	return { sent };
});
//#endregion
export { parseMileage as a, mergeText as i, discountRate as n, parseWon as o, extractCarDetails as r, parseYear as s, scan_exports as t };
