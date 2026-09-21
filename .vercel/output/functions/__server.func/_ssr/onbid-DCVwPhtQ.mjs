import { n as fetchText, r as jitterDelay, t as extractCsrf } from "./http-ChsCgeta.mjs";
import { a as parseMileage, i as mergeText, n as discountRate, o as parseWon, r as extractCarDetails, s as parseYear } from "./scan-Cftsl-xP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onbid-DCVwPhtQ.js
var SEARCH_PAGE = "https://www.onbid.co.kr/op/cltrpbancinf/cltr/cltrcdtnsrch/CltrCdtnSrchController/mvmnCltrCdtnSrchClg.do";
var SEARCH_API = "https://www.onbid.co.kr/op/cltrpbancinf/clbtcltrclg/cltrclbtcltrclg/CltrClbtCltrClgController/inqCltrClbtVhcClg.do";
function toListing(item) {
	const name = item.onbidCltrNm?.trim();
	const cltrNo = String(item.onbidCltrno ?? "").trim();
	const condNo = String(item.pbctCdtnNo ?? "").trim();
	if (!name || !cltrNo) return null;
	const caseNo = item.scrnIndctCltrMngNo?.trim() || `${cltrNo}-${condNo}`;
	const blob = mergeText(name, item.drvDstcNm, item.fuelContDsvlmNm, item.carFuelKindCd, item.nrtpNm, item.ctgrFullNm, item.usgNm);
	const parsed = extractCarDetails(blob);
	const year = (item.nrtpNm && Number(item.nrtpNm) >= 1990 ? Number(item.nrtpNm) : null) ?? parsed.year ?? parseYear(name);
	const mileage = parseMileage(item.drvDstcNm ?? "") ?? parsed.mileage;
	const fuelSource = mergeText(item.carFuelKindCd, item.fuelContDsvlmNm, name);
	const fuel = extractCarDetails(fuelSource).fuel;
	const appraisal = parseWon(item.cltrApslEvlAvgAmt);
	const minPrice = parseWon(item.lowstBidPrc);
	const params = new URLSearchParams({
		onbidCltrno: cltrNo,
		pbctCdtnNo: condNo
	});
	return {
		id: `onbid:${caseNo}`,
		platform: "onbid",
		platformName: "온비드",
		caseNo,
		courtOrDept: item.regOrgNm ?? "캠코 온비드",
		carName: name,
		year,
		mileage,
		fuel,
		appraisalPrice: appraisal,
		minPrice,
		discountRate: discountRate(appraisal, minPrice),
		auctionDate: item.pbctDdlnDt ?? item.pbctBegnDtm ?? "—",
		detailUrl: `https://www.onbid.co.kr/op/cltrpbancinf/cltrdtl/CltrDtlController/mvmnCltrDtl.do?${params.toString()}`,
		imageUrl: null,
		status: item.pbancPbctCltrStatNm ?? "",
		rawText: blob,
		keyStatus: "미검사",
		matchedKeyKeywords: [],
		matchedDangerKeywords: [],
		grade: "rejected",
		rejectReasons: [],
		collectedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
async function searchPage(cookies, csrf, pageIndex, extra) {
	const body = new URLSearchParams();
	body.set("_csrf", csrf);
	body.set("srchCltrType", "0002");
	body.set("pageIndex", String(pageIndex));
	body.set("pageUnit", "40");
	body.set("srchDspsMthod", "ALL");
	for (const [key, value] of Object.entries(extra)) if (Array.isArray(value)) for (const item of value) body.append(key, item);
	else body.set(key, value);
	const result = await fetchText(SEARCH_API, {
		method: "POST",
		cookies,
		timeoutMs: 18e3,
		headers: {
			"content-type": "application/x-www-form-urlencoded; charset=UTF-8",
			"x-csrf-token": csrf,
			"x-requested-with": "XMLHttpRequest",
			referer: SEARCH_PAGE
		},
		body
	});
	let payload = {};
	try {
		payload = JSON.parse(result.text);
	} catch {
		payload = {};
	}
	return {
		items: payload.cltrInfVOList ?? [],
		cookies: result.cookies,
		total: payload.totalCount ?? 0
	};
}
async function scrapeOnbid(config) {
	try {
		const page = await fetchText(SEARCH_PAGE, { timeoutMs: 2e4 });
		if (!page.ok) return {
			listings: [],
			report: {
				platform: "onbid",
				label: "온비드",
				status: "error",
				fetched: 0,
				message: `검색 페이지 HTTP ${page.status}`
			}
		};
		const csrf = extractCsrf(page.text);
		if (!csrf) return {
			listings: [],
			report: {
				platform: "onbid",
				label: "온비드",
				status: "blocked",
				fetched: 0,
				message: "CSRF 토큰을 읽지 못했습니다. 접속 대기열(NetFunnel)일 수 있습니다."
			}
		};
		let cookies = page.cookies;
		const eco = await searchPage(cookies, csrf, 1, { srchFuelType: [
			"0004",
			"0005",
			"0007",
			"0008"
		] });
		cookies = eco.cookies;
		let items = eco.items;
		if (items.length === 0) {
			await jitterDelay(300, 600);
			const broad = await searchPage(cookies, csrf, 1, {});
			items = broad.items;
			if (broad.total > items.length) {
				await jitterDelay(350, 700);
				const page2 = await searchPage(broad.cookies, csrf, 2, {});
				items = items.concat(page2.items);
			}
		}
		const listings = items.map(toListing).filter((row) => row != null).slice(0, config.maxListingsPerSource);
		return {
			listings,
			report: {
				platform: "onbid",
				label: "온비드",
				status: listings.length ? "live" : "empty",
				fetched: listings.length,
				message: listings.length ? `차량 조건검색 AJAX에서 ${listings.length}건 수집` : "진행 중 차량 공매가 없거나 필터가 비었습니다."
			}
		};
	} catch (error) {
		return {
			listings: [],
			report: {
				platform: "onbid",
				label: "온비드",
				status: "error",
				fetched: 0,
				message: error instanceof Error ? error.message : "요청 실패"
			}
		};
	}
}
async function enrichOnbidDetail(listing) {
	try {
		const result = await fetchText(listing.detailUrl, { timeoutMs: 12e3 });
		if (!result.ok) return listing.rawText;
		const text = result.text.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
		return mergeText(listing.rawText, text.slice(0, 8e3));
	} catch {
		return listing.rawText;
	}
}
//#endregion
export { enrichOnbidDetail, scrapeOnbid };
