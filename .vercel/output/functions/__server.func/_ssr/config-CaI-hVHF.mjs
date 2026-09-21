//#region node_modules/.nitro/vite/services/ssr/assets/config-CaI-hVHF.js
var DEFAULT_SEARCH_CONFIG = {
	minYear: 2022,
	maxMileage: 5e4,
	fuelTypes: [
		"하이브리드",
		"전기",
		"가솔린+전기",
		"디젤+전기",
		"수소전기",
		"수소"
	],
	keywordsMustHave: [
		"키 보관",
		"열쇠 보관",
		"스페어키",
		"시동 확인",
		"계기판 점등"
	],
	keywordsExclude: [
		"전손",
		"침수",
		"운행불가",
		"운행 불가",
		"불상",
		"유치권",
		"폐차",
		"대파"
	],
	requireKeyKeyword: true,
	maxListingsPerSource: 80
};
var DEFAULT_TELEGRAM = {
	botToken: "",
	chatId: "",
	enabled: false
};
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
//#endregion
export { DEFAULT_TELEGRAM as n, USER_AGENT as r, DEFAULT_SEARCH_CONFIG as t };
