// End-to-end smoke: drive both used-car scrapers via Playwright and dump
// a summary. Runs locally only — Vercel build won't include this.
import { scrapeKCar } from "../src/lib/usedcars/scrapers/kcar.ts";
import { scrapeKbchachacha } from "../src/lib/usedcars/scrapers/kbchachacha.ts";
import { DEFAULT_USED_CAR_CONFIG } from "../src/lib/usedcars/types.ts";

const started = Date.now();
const [kcar, kbc] = await Promise.all([
  scrapeKCar({ ...DEFAULT_USED_CAR_CONFIG, maxListingsPerSource: 8 }),
  scrapeKbchachacha({ ...DEFAULT_USED_CAR_CONFIG, maxListingsPerSource: 8 }),
]);

console.log(`elapsed ${Date.now() - started}ms\n`);

for (const [name, res] of [
  ["K Car", kcar],
  ["KB차차차", kbc],
]) {
  console.log(`=== ${name} ===`);
  console.log(`status: ${res.status}, ok: ${res.ok}, localOnly: ${res.localOnly}`);
  console.log(`message: ${res.message}`);
  console.log(`listings: ${res.listings.length}`);
  for (const l of res.listings) {
    const yr = l.year ?? "?";
    const km = l.mileage?.toLocaleString("ko-KR") ?? "?";
    const pr = l.listingPrice != null ? `${(l.listingPrice / 10_000).toLocaleString("ko-KR")}만원` : "?";
    console.log(`  - ${l.carName} | ${yr}년 | ${km}km | ${pr} | ${l.fuel} | ${l.seller}`);
  }
  console.log("");
}
