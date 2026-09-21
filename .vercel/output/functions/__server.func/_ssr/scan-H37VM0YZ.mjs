import { n as DEFAULT_SEARCH_CONFIG, t as __exportAll } from "./rolldown-runtime-D7D4PA-g.mjs";
import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/scan-H37VM0YZ.js
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
	const compact = text.replace(/\s+/g, "");
	const found = [];
	for (const word of keywords) {
		const trimmed = word.trim();
		if (!trimmed) continue;
		const compactWord = trimmed.replace(/\s+/g, "");
		if (text.includes(trimmed) || compactWord.length > 0 && compact.includes(compactWord)) found.push(trimmed);
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
var _0002_radar_default = "-- AuctionCarRadar scan history + notification ledger\nCREATE TABLE IF NOT EXISTS radar_scans (\n  id BIGSERIAL PRIMARY KEY,\n  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  duration_ms INTEGER NOT NULL DEFAULT 0,\n  fetched INTEGER NOT NULL DEFAULT 0,\n  stage1 INTEGER NOT NULL DEFAULT 0,\n  grade_a INTEGER NOT NULL DEFAULT 0,\n  candidates INTEGER NOT NULL DEFAULT 0,\n  rejected INTEGER NOT NULL DEFAULT 0,\n  sources_json JSONB NOT NULL DEFAULT '[]'::jsonb\n);\n\nCREATE TABLE IF NOT EXISTS radar_listings (\n  id TEXT PRIMARY KEY,\n  scan_id BIGINT REFERENCES radar_scans(id) ON DELETE CASCADE,\n  platform TEXT NOT NULL,\n  platform_name TEXT NOT NULL DEFAULT '',\n  case_no TEXT NOT NULL DEFAULT '',\n  court_or_dept TEXT NOT NULL DEFAULT '',\n  car_name TEXT NOT NULL DEFAULT '',\n  year INTEGER,\n  mileage INTEGER,\n  fuel TEXT NOT NULL DEFAULT '',\n  appraisal_price BIGINT,\n  min_price BIGINT,\n  discount_rate INTEGER,\n  auction_date TEXT NOT NULL DEFAULT '',\n  detail_url TEXT NOT NULL DEFAULT '',\n  image_url TEXT,\n  status TEXT NOT NULL DEFAULT '',\n  key_status TEXT NOT NULL DEFAULT '',\n  grade TEXT NOT NULL DEFAULT 'rejected',\n  reject_reasons_json JSONB NOT NULL DEFAULT '[]'::jsonb,\n  matched_key_keywords_json JSONB NOT NULL DEFAULT '[]'::jsonb,\n  raw_text TEXT NOT NULL DEFAULT '',\n  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n);\n\nCREATE INDEX IF NOT EXISTS radar_listings_grade_idx ON radar_listings (grade);\nCREATE INDEX IF NOT EXISTS radar_listings_scan_id_idx ON radar_listings (scan_id);\n\nCREATE TABLE IF NOT EXISTS radar_notified (\n  listing_id TEXT PRIMARY KEY,\n  notified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n);\n\nCREATE TABLE IF NOT EXISTS radar_settings (\n  key TEXT PRIMARY KEY,\n  value TEXT NOT NULL DEFAULT '',\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n);\n";
/**
* Migration bookkeeping shared by the two appliers — `scripts/migrate.mjs`
* (deploy, `readdir`) and `src/lib/db.ts` (PGLite preview, `import.meta.glob`).
*
* Applied files are keyed by BASENAME, so the same file applies once no matter
* which directory it is globbed from. That is what makes the auth schema safe to
* copy from `migrations/auth/` into `migrations/` when an app turns sign-in on:
* a database that already has `0001_auth.sql` will not re-run it.
*
* Neither applier descends into subdirectories, so `migrations/auth/*.sql` is
* out of scope for both until it is copied up.
*/
/**
* The `_migrations` key for a migration path (or bare filename).
* @param {string} path
* @returns {string}
*/
function migrationName(path) {
	return path.split("/").pop() ?? path;
}
/**
* @param {string} path
* @returns {boolean}
*/
function isMigrationFile(path) {
	return path.endsWith(".sql");
}
/**
* Migrations in `paths` that are not yet in `applied`, in apply order.
* Non-`.sql` entries (a `readdir` also yields `migrations/auth/`) are dropped.
* @param {Iterable<string>} paths
* @param {Iterable<string>} applied
* @returns {Array<{ name: string, path: string }>}
*/
function pendingMigrations(paths, applied) {
	const done = new Set(applied);
	return [...paths].filter(isMigrationFile).map((path) => ({
		name: migrationName(path),
		path
	})).sort((a, b) => a.name.localeCompare(b.name)).filter(({ name }) => !done.has(name));
}
var rawDatabaseUrl = typeof process !== "undefined" ? process.env.DATABASE_URL : void 0;
var databaseUrl = rawDatabaseUrl && rawDatabaseUrl.trim() ? rawDatabaseUrl : void 0;
/**
* Active backend: real **Neon** when `DATABASE_URL` is set (deployed / configured
* sandbox), otherwise a local embedded **PGLite** (Postgres compiled to WASM) so
* the app has a working database even with nothing configured — the live preview
* included. Swap in Neon later by just setting `DATABASE_URL`; no code changes.
*/
var dbSource = databaseUrl ? "neon" : "pglite";
/**
* Init state lives on globalThis as promises: dev HMR creates new instances of
* this module, and two instances racing module-level state would open a second
* pool or run two concurrent PGLite migration passes (whose duplicate
* `_migrations` insert rejects — and would get memoized, poisoning every later
* `getSql()`). A failed init clears its slot so the next call retries.
*/
var globalRef = globalThis;
/**
* Result-type parity: Postgres sends every value as text plus a type OID — the
* JS value is the DRIVER's parsing choice, and pg and PGLite disagree (pg:
* int8 -> string, date -> local-midnight Date; PGLite: int8 -> BigInt, which
* JSON.stringify rejects, date -> UTC Date). Normalize both so preview and
* production return identical, JSON-safe shapes:
*   int8/bigint (incl. count(*)) -> number (past 2^53 loses precision — cast
*                                   `::text` if you ever need huge integers)
*   date                         -> 'YYYY-MM-DD' string
*   interval                     -> Postgres interval text
* numeric already comes back as a string on both (arbitrary precision).
*/
var OID_INT8 = 20;
var OID_DATE = 1082;
var OID_INTERVAL = 1186;
var identity = (v) => v;
/** Wrap a query runner in the tagged-template + `.query()` `Sql` surface. */
function toSql(run) {
	const sql = (async (strings, ...values) => {
		let text = strings[0];
		for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1]}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	return sql;
}
function createNeonSql() {
	globalRef.__pgSqlPromise__ ??= (async () => {
		const { Pool, types } = await import("../_libs/pg.mjs").then((n) => n.t);
		types.setTypeParser(OID_INT8, Number);
		types.setTypeParser(OID_DATE, identity);
		types.setTypeParser(OID_INTERVAL, identity);
		const pool = new Pool({ connectionString: databaseUrl });
		return toSql(async (text, params) => {
			return (await pool.query(text, params)).rows;
		});
	})().catch((err) => {
		globalRef.__pgSqlPromise__ = void 0;
		throw err;
	});
	return globalRef.__pgSqlPromise__;
}
async function createPgliteSql() {
	globalRef.__pgliteInstance__ ??= (async () => {
		const { PGlite } = await import("../_libs/electric-sql__pglite.mjs").then((n) => n.t);
		const pg = new PGlite({ parsers: {
			[OID_INT8]: Number,
			[OID_DATE]: identity,
			[OID_INTERVAL]: identity
		} });
		await pg.waitReady;
		await pg.exec("create table if not exists _migrations (name text primary key, applied_at timestamptz not null default now())");
		return pg;
	})().catch((err) => {
		globalRef.__pgliteInstance__ = void 0;
		throw err;
	});
	const pg = await globalRef.__pgliteInstance__;
	const migrate = async () => {
		const migrations = /* #__PURE__ */ Object.assign({ "/migrations/0002_radar.sql": _0002_radar_default });
		const done = (await pg.query("select name from _migrations")).rows.map((r) => r.name);
		for (const { name, path } of pendingMigrations(Object.keys(migrations), done)) await pg.transaction(async (tx) => {
			await tx.exec(migrations[path]);
			await tx.query("insert into _migrations (name) values ($1)", [name]);
		});
	};
	const pass = (globalRef.__pgliteMigrateChain__ ?? Promise.resolve()).catch(() => void 0).then(migrate);
	globalRef.__pgliteMigrateChain__ = pass;
	await pass;
	return toSql(async (text, params) => {
		return (await pg.query(text, params)).rows;
	});
}
var sqlPromise = null;
async function createSql() {
	if (typeof window !== "undefined") throw new Error("@/lib/db is server-only — call getSql() from a createServerFn handler or a server route loader, never from client code.");
	return dbSource === "neon" ? createNeonSql() : createPgliteSql();
}
/**
* Get the shared, **server-only** SQL client. Neon when `DATABASE_URL` is set,
* otherwise the local PGLite fallback. Memoized — safe to call per request.
*
* Schema comes from `migrations/*.sql`, auto-applied before the first query on
* both backends — define tables there, never inline in server functions.
*/
function getSql() {
	sqlPromise ??= createSql().catch((err) => {
		sqlPromise = null;
		throw err;
	});
	return sqlPromise;
}
/**
* Finish DB bootstrap before the server handles traffic.
*
* - **PGLite** (preview / no `DATABASE_URL`): open the in-memory DB and apply
*   `migrations/*.sql`. Idempotent — concurrent callers share one promise.
* - **Neon**: no-op (pool is created lazily on first query).
*
* Vite `configureServer` awaits this at dev startup; production imports of this
* module kick it off immediately (see bottom of file).
*/
function ensureDbReady() {
	if (dbSource !== "pglite") return Promise.resolve();
	return getSql().then(() => void 0);
}
var globalBoot = globalThis;
if (typeof window === "undefined" && dbSource === "pglite") globalBoot.__pgBootstrapPromise__ ??= ensureDbReady().catch((err) => {
	globalBoot.__pgBootstrapPromise__ = void 0;
	console.error("[db] PGLite bootstrap failed:", err);
	throw err;
});
async function saveScanResult(scan) {
	const sql = await getSql();
	const rows = await sql`
    INSERT INTO radar_scans (
      scanned_at, duration_ms, fetched, stage1, grade_a, candidates, rejected, sources_json
    ) VALUES (
      ${scan.scannedAt}::timestamptz,
      ${scan.durationMs},
      ${scan.totals.fetched},
      ${scan.totals.stage1},
      ${scan.totals.gradeA},
      ${scan.totals.candidates},
      ${scan.totals.rejected},
      ${JSON.stringify(scan.sources)}::jsonb
    )
    RETURNING id
  `;
	const scanId = Number(rows[0]?.id ?? 0);
	for (const listing of scan.listings) await sql`
      INSERT INTO radar_listings (
        id, scan_id, platform, platform_name, case_no, court_or_dept, car_name,
        year, mileage, fuel, appraisal_price, min_price, discount_rate, auction_date,
        detail_url, image_url, status, key_status, grade, reject_reasons_json,
        matched_key_keywords_json, raw_text, collected_at, updated_at
      ) VALUES (
        ${listing.id},
        ${scanId},
        ${listing.platform},
        ${listing.platformName},
        ${listing.caseNo},
        ${listing.courtOrDept},
        ${listing.carName},
        ${listing.year},
        ${listing.mileage},
        ${listing.fuel},
        ${listing.appraisalPrice},
        ${listing.minPrice},
        ${listing.discountRate},
        ${listing.auctionDate},
        ${listing.detailUrl},
        ${listing.imageUrl},
        ${listing.status},
        ${listing.keyStatus},
        ${listing.grade},
        ${JSON.stringify(listing.rejectReasons)}::jsonb,
        ${JSON.stringify(listing.matchedKeyKeywords)}::jsonb,
        ${listing.rawText.slice(0, 8e3)},
        ${listing.collectedAt}::timestamptz,
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        scan_id = EXCLUDED.scan_id,
        grade = EXCLUDED.grade,
        key_status = EXCLUDED.key_status,
        reject_reasons_json = EXCLUDED.reject_reasons_json,
        matched_key_keywords_json = EXCLUDED.matched_key_keywords_json,
        raw_text = EXCLUDED.raw_text,
        updated_at = NOW()
    `;
	return scanId;
}
async function getNotifiedIds() {
	return (await (await getSql())`
    SELECT listing_id FROM radar_notified ORDER BY notified_at DESC LIMIT 5000
  `).map((row) => row.listing_id);
}
async function markListingsNotified(ids) {
	if (!ids.length) return;
	const sql = await getSql();
	for (const id of ids) await sql`
      INSERT INTO radar_notified (listing_id, notified_at)
      VALUES (${id}, NOW())
      ON CONFLICT (listing_id) DO NOTHING
    `;
}
function resolveTelegram(client) {
	const envToken = typeof process !== "undefined" && process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
	const envChat = typeof process !== "undefined" && process.env.TELEGRAM_CHAT_ID?.trim() || "";
	return {
		botToken: envToken || client?.botToken || "",
		chatId: envChat || client?.chatId || "",
		enabled: Boolean(client?.enabled ?? (envToken && envChat))
	};
}
var scan_exports = /* @__PURE__ */ __exportAll({
	runAuctionScan_createServerFn_handler: () => runAuctionScan_createServerFn_handler,
	runScheduledRadar_createServerFn_handler: () => runScheduledRadar_createServerFn_handler,
	sendTelegramAlerts_createServerFn_handler: () => sendTelegramAlerts_createServerFn_handler
});
var ScanInputSchema = { parse(input) {
	const data = input ?? {};
	return {
		config: {
			...DEFAULT_SEARCH_CONFIG,
			...data.config
		},
		enrich: data.enrich !== false,
		persist: data.persist !== false
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
async function executeScan(config, enrich) {
	const started = Date.now();
	const [{ scrapeMadang, enrichMadangDetail }, { scrapeOnbid, enrichOnbidDetail }, { scrapeCourt }] = await Promise.all([
		import("./madang-CH2EBS4I.mjs"),
		import("./onbid-BktwRvrK.mjs"),
		import("./court-De4bIqDK.mjs")
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
		})).filter((row) => row.grade === "a" || row.grade === "candidate").slice(0, 20);
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
}
var runAuctionScan_createServerFn_handler = createServerRpc({
	id: "93528b6dfa3de3ef3a78a0378788808ad4ea1155c8e4dabbfbfad7126a795270",
	name: "runAuctionScan",
	filename: "src/lib/radar/scan.ts"
}, (opts) => runAuctionScan.__executeServer(opts));
var runAuctionScan = createServerFn({ method: "POST" }).validator(ScanInputSchema).handler(runAuctionScan_createServerFn_handler, async ({ data }) => {
	const scan = await executeScan(data.config, data.enrich);
	if (data.persist) try {
		await saveScanResult(scan);
	} catch (error) {
		console.error("radar persist failed", error);
	}
	return scan;
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
	const telegram = resolveTelegram(data.telegram);
	if (!telegram.enabled || !telegram.botToken || !telegram.chatId) return {
		sent: 0,
		error: "텔레그램이 비활성이거나 토큰/채팅 ID가 없습니다. TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 환경변수 또는 설정값을 확인하세요."
	};
	let sent = 0;
	for (const listing of data.listings) {
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
	if (sent) try {
		await markListingsNotified(data.listings.map((row) => row.id));
	} catch (error) {
		console.error("radar notify ledger failed", error);
	}
	return { sent };
});
var ScheduledInput = { parse(input) {
	return { secret: (input ?? {}).secret };
} };
var runScheduledRadar_createServerFn_handler = createServerRpc({
	id: "02eba702d4a5ca0df66a4a191037c297cfe1cf08b508fd214ecad2942f0756e4",
	name: "runScheduledRadar",
	filename: "src/lib/radar/scan.ts"
}, (opts) => runScheduledRadar.__executeServer(opts));
var runScheduledRadar = createServerFn({ method: "POST" }).validator(ScheduledInput).handler(runScheduledRadar_createServerFn_handler, async ({ data }) => {
	const expected = process.env.CRON_SECRET?.trim();
	if (expected && data.secret !== expected) return {
		ok: false,
		error: "unauthorized",
		notified: 0,
		freshIds: []
	};
	const scan = await executeScan(DEFAULT_SEARCH_CONFIG, true);
	try {
		await saveScanResult(scan);
	} catch (error) {
		console.error("scheduled persist failed", error);
	}
	const known = new Set(await getNotifiedIds());
	const fresh = scan.listings.filter((row) => row.grade === "a" && !known.has(row.id));
	if (!fresh.length) return {
		ok: true,
		scan,
		notified: 0,
		freshIds: []
	};
	const telegram = resolveTelegram({ enabled: true });
	if (!telegram.botToken || !telegram.chatId) return {
		ok: true,
		scan,
		notified: 0,
		freshIds: fresh.map((row) => row.id),
		error: "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not configured"
	};
	let notified = 0;
	for (const listing of fresh) {
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
				ok: false,
				scan,
				notified,
				freshIds: fresh.map((row) => row.id),
				error: `Telegram HTTP ${response.status}: ${body.slice(0, 180)}`
			};
		}
		notified += 1;
	}
	await markListingsNotified(fresh.map((row) => row.id));
	return {
		ok: true,
		scan,
		notified,
		freshIds: fresh.map((row) => row.id)
	};
});
//#endregion
export { parseMileage as a, mergeText as i, discountRate as n, parseWon as o, extractCarDetails as r, parseYear as s, scan_exports as t };
