#!/usr/bin/env node
/**
 * Direct scraper smoke test (no dev server / Telegram).
 * Exits non-zero if madang or onbid are unhealthy.
 * Court blocked (WebSquare) is expected and does not fail the check.
 * Optionally enriches prelim candidates the same way production scan does.
 */
import { DEFAULT_SEARCH_CONFIG } from "../src/lib/radar/config.ts";
import { applyFilter } from "../src/lib/radar/filter.ts";

const MIN_FETCH = {
  madang: 10,
  onbid: 5,
};

const enrich = !process.argv.includes("--no-enrich");
const strictA = process.argv.includes("--require-grade-a");

const [{ scrapeMadang, enrichMadangDetail }, { scrapeOnbid, enrichOnbidDetail }, { scrapeCourt }] =
  await Promise.all([
    import("../src/lib/radar/scrapers/madang.ts"),
    import("../src/lib/radar/scrapers/onbid.ts"),
    import("../src/lib/radar/scrapers/court.ts"),
  ]);

const config = DEFAULT_SEARCH_CONFIG;
const started = Date.now();

const [madang, onbid, court] = await Promise.all([
  scrapeMadang(config),
  scrapeOnbid(config),
  scrapeCourt(),
]);

let listings = [...madang.listings, ...onbid.listings, ...court.listings];

if (enrich && listings.length) {
  const prelim = listings.map((row) =>
    applyFilter(row, { ...config, requireKeyKeyword: false }),
  );
  const targets = prelim
    .filter((row) => row.grade === "a" || row.grade === "candidate")
    .slice(0, 8);
  await Promise.all(
    targets.map(async (row) => {
      const extra =
        row.platform === "madang"
          ? await enrichMadangDetail(row)
          : row.platform === "onbid"
            ? await enrichOnbidDetail(row)
            : row.rawText;
      const original = listings.find((item) => item.id === row.id);
      if (original) original.rawText = extra;
    }),
  );
}

listings = listings.map((row) => applyFilter(row, config));

const gradeA = listings.filter((row) => row.grade === "a");
const candidates = listings.filter((row) => row.grade === "candidate");
const rejected = listings.filter((row) => row.grade === "rejected");

const rejectHistogram = {};
for (const row of rejected) {
  for (const reason of row.rejectReasons ?? []) {
    const key = reason.split(":")[0].replace(/\d[\d,]*/g, "N").slice(0, 40);
    rejectHistogram[key] = (rejectHistogram[key] ?? 0) + 1;
  }
}

const sources = [court.report, onbid.report, madang.report].map((s) => ({
  platform: s.platform,
  status: s.status,
  fetched: s.fetched,
  message: s.message,
}));

const failures = [];

for (const report of [madang.report, onbid.report]) {
  const min = MIN_FETCH[report.platform] ?? 1;
  if (report.status !== "live") {
    failures.push(`${report.platform}: expected live, got ${report.status} (${report.message})`);
  } else if ((report.fetched ?? 0) < min) {
    failures.push(
      `${report.platform}: fetched ${report.fetched} < minimum ${min}`,
    );
  }
}

if (court.report.status !== "blocked" && court.report.status !== "live") {
  failures.push(`court: unexpected status ${court.report.status} (${court.report.message})`);
}

if (strictA && gradeA.length === 0) {
  failures.push("no grade-A listings after enrich (strict mode)");
}

const result = {
  ok: failures.length === 0,
  enrich,
  durationMs: Date.now() - started,
  sources,
  totals: {
    fetched: listings.length,
    gradeA: gradeA.length,
    candidates: candidates.length,
    rejected: rejected.length,
  },
  rejectHistogram,
  sampleA: gradeA.slice(0, 3).map((l) => ({
    platform: l.platform,
    carName: l.carName,
    year: l.year,
    mileage: l.mileage,
    fuel: l.fuel,
    keyStatus: l.keyStatus,
  })),
  sampleCandidates: candidates.slice(0, 5).map((l) => ({
    platform: l.platform,
    carName: l.carName,
    year: l.year,
    mileage: l.mileage,
    fuel: l.fuel,
    keyStatus: l.keyStatus,
    rejectReasons: l.rejectReasons,
  })),
  failures,
};

console.log(JSON.stringify(result, null, 2));
if (failures.length) {
  console.error(`\nSCRAPER HEALTH FAILED (${failures.length}):`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}
