import { getSql } from "@/lib/db";
import type { ScanResult, StandardListing, TelegramSettings } from "./types.ts";

export async function saveScanResult(scan: ScanResult): Promise<number> {
  const sql = await getSql();
  const rows = await sql<{ id: number }>`
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
  for (const listing of scan.listings) {
    await sql`
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
        ${listing.rawText.slice(0, 8000)},
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
  }
  return scanId;
}

export async function getNotifiedIds(): Promise<string[]> {
  const sql = await getSql();
  const rows = await sql<{ listing_id: string }>`
    SELECT listing_id FROM radar_notified ORDER BY notified_at DESC LIMIT 5000
  `;
  return rows.map((row) => row.listing_id);
}

export async function markListingsNotified(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const sql = await getSql();
  for (const id of ids) {
    await sql`
      INSERT INTO radar_notified (listing_id, notified_at)
      VALUES (${id}, NOW())
      ON CONFLICT (listing_id) DO NOTHING
    `;
  }
}

export async function loadRecentGradeA(limit = 50): Promise<StandardListing[]> {
  const sql = await getSql();
  const rows = await sql<Record<string, unknown>>`
    SELECT * FROM radar_listings
    WHERE grade = 'a'
    ORDER BY updated_at DESC
    LIMIT ${limit}
  `;
  return rows.map(rowToListing);
}

function rowToListing(row: Record<string, unknown>): StandardListing {
  const reject = row.reject_reasons_json;
  const keys = row.matched_key_keywords_json;
  return {
    id: String(row.id),
    platform: row.platform as StandardListing["platform"],
    platformName: String(row.platform_name ?? ""),
    caseNo: String(row.case_no ?? ""),
    courtOrDept: String(row.court_or_dept ?? ""),
    carName: String(row.car_name ?? ""),
    year: row.year == null ? null : Number(row.year),
    mileage: row.mileage == null ? null : Number(row.mileage),
    fuel: String(row.fuel ?? ""),
    appraisalPrice: row.appraisal_price == null ? null : Number(row.appraisal_price),
    minPrice: row.min_price == null ? null : Number(row.min_price),
    discountRate: row.discount_rate == null ? null : Number(row.discount_rate),
    auctionDate: String(row.auction_date ?? ""),
    detailUrl: String(row.detail_url ?? ""),
    imageUrl: row.image_url == null ? null : String(row.image_url),
    status: String(row.status ?? ""),
    rawText: String(row.raw_text ?? ""),
    keyStatus: String(row.key_status ?? ""),
    matchedKeyKeywords: Array.isArray(keys) ? (keys as string[]) : [],
    matchedDangerKeywords: [],
    grade: (row.grade as StandardListing["grade"]) ?? "rejected",
    rejectReasons: Array.isArray(reject) ? (reject as string[]) : [],
    collectedAt: String(row.collected_at ?? new Date().toISOString()),
  };
}

export function resolveTelegram(
  client: Partial<TelegramSettings> | undefined,
): TelegramSettings {
  const envToken =
    (typeof process !== "undefined" && process.env.TELEGRAM_BOT_TOKEN?.trim()) ||
    "";
  const envChat =
    (typeof process !== "undefined" && process.env.TELEGRAM_CHAT_ID?.trim()) ||
    "";
  return {
    botToken: envToken || client?.botToken || "",
    chatId: envChat || client?.chatId || "",
    enabled: Boolean(client?.enabled ?? (envToken && envChat)),
  };
}
