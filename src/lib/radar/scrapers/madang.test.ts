/**
 * Regression tests for the madang scraper's boundary detection.
 *
 * The original bug: the scraper split on `m_code` and used 2200/1600-char
 * windows, so a field in item N could leak from item N-1's tail or item
 * N+1's head into item N's parsed record. Prices, storageSite, etc. were
 * often off-by-one (or "jumbled" across rows) on real data.
 *
 * These tests construct synthetic Next.js-style payloads that replicate the
 * real structure (m_code in the middle of each item block, nested objects
 * like `m_state`, escaped quotes inside URL strings) and assert that
 * every parsed listing's fields come from its own block — never from a
 * neighbour.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findBlockForMCode,
  findItemBlocks,
} from "./madang.ts";

/** Build one clean Next.js-style item block. */
function mkItem({
  caseNo,
  mCode,
  carName,
  carStorage,
  mEvaluatePrice,
  lowPrice,
  addr,
  extra = "",
}: {
  caseNo: string;
  mCode: string;
  carName: string;
  carStorage: string;
  mEvaluatePrice: number;
  lowPrice: number;
  addr: string;
  extra?: string;
}): string {
  return [
    `{`,
    `"car_storage_method": "${carStorage}"`,
    `"m_bid_price_last": ${lowPrice}`,
    `"case_num": "${caseNo}"`,
    `"car_name": "${carName}"`,
    `"addr": "${addr}"`,
    `"eval_price_v": ${mEvaluatePrice}`,
    `"m_evaluate_price": ${mEvaluatePrice}`,
    `"m_state": { "dday": "D-21" }`,
    `"low_price": ${lowPrice}`,
    `"low_price_kor": "${lowPrice / 10000}만원"`,
    `"car_year": 2024`,
    `"use_type": "자동차"`,
    `"eval_price": "${mEvaluatePrice / 10000}만원"`,
    `"m_code": "M_${mCode}"`,
    `"area": "-"`,
    extra,
    `}`,
  ]
    .filter((s) => s.length > 0)
    .join(",");
}

const A = mkItem({
  caseNo: "2025-A-001",
  mCode: "A",
  carName: "Honda Civic Hybrid A",
  carStorage: "오토마트 A보관소",
  mEvaluatePrice: 25_000_000,
  lowPrice: 17_500_000,
  addr: "서울 강남구 A주차장",
});
const B = mkItem({
  caseNo: "2025-B-002",
  mCode: "B",
  carName: "Toyota Prius Hybrid B",
  carStorage: "오토허브 B보관소",
  mEvaluatePrice: 33_000_000,
  lowPrice: 29_700_000,
  addr: "경기 성남시 B보관소",
});
const C = mkItem({
  caseNo: "2025-C-003",
  mCode: "C",
  carName: "Kia Niro Hybrid C",
  carStorage: "공영 전문보관소 C",
  mEvaluatePrice: 28_000_000,
  lowPrice: 22_400_000,
  addr: "인천 연수구 C보관소",
  // Simulate the G90-style placeholder + real value pattern.
  extra: `"car_storage_method": "제3자 안태수 보관"`,
});

const payload = `[${A},${B},${C}]`;

describe("findItemBlocks", () => {
  it("returns one block per unique m_code", () => {
    const blocks = findItemBlocks(payload);
    assert.equal(blocks.length, 3);
    assert.deepEqual(
      blocks.map((b) => b.mCode).sort(),
      ["M_A", "M_B", "M_C"],
    );
  });

  it("never leaks neighbour data — each block carries only its own fields", () => {
    const blocks = findItemBlocks(payload);
    for (const { mCode, block } of blocks) {
      for (const other of blocks) {
        if (other.mCode === mCode) continue;
        const otherCaseNo = other.block.match(/"case_num":\s*"([^"]+)"/)?.[1];
        const otherCarName = other.block.match(/"car_name":\s*"([^"]+)"/)?.[1];
        if (otherCaseNo) {
          assert.ok(
            !block.includes(otherCaseNo),
            `${mCode} block leaked case_no ${otherCaseNo}`,
          );
        }
        if (otherCarName) {
          assert.ok(
            !block.includes(otherCarName),
            `${mCode} block leaked car_name ${otherCarName}`,
          );
        }
      }
    }
  });

  it("duplicate m_codes collapse to a single block", () => {
    const duplicated = `[${A},${B},${C},${B}]`;
    const blocks = findItemBlocks(duplicated);
    assert.equal(blocks.length, 3);
  });

  it("handles `\"` escapes inside values (the real madang page emits URLs with these)", () => {
    // Construct B directly with an escaped quote inside the addr value.
    // Real madang detail-page URLs look like `https://madangs.com/caview?m_code=...&foo=\"bar\"`.
    const BWithQuote =
      `{` +
      `"car_storage_method": "오토허브 B보관소",` +
      `"m_bid_price_last": 29700000,` +
      `"case_num": "2025-B-002",` +
      `"car_name": "Toyota Prius Hybrid B",` +
      `"addr": "ab\\"cd",` +
      `"eval_price_v": 33000000,` +
      `"m_evaluate_price": 33000000,` +
      `"m_state": { "dday": "D-21" },` +
      `"low_price": 29700000,` +
      `"low_price_kor": "2970만원",` +
      `"car_year": 2024,` +
      `"use_type": "자동차",` +
      `"eval_price": "3300만원",` +
      `"m_code": "M_B",` +
      `"area": "-"` +
      `}`;
    const escaped = `[${A},${BWithQuote},${C}]`;
    const blocks = findItemBlocks(escaped);
    assert.equal(blocks.length, 3);
    const bBlock = blocks.find((b) => b.mCode === "M_B")!;
    // Block must still be balanced braces.
    const opens = bBlock.block.split("{").length - 1;
    const closes = bBlock.block.split("}").length - 1;
    assert.equal(opens, closes, "block must have balanced braces");
    assert.equal(bBlock.block.match(/"case_num":\s*"([^"]+)"/)?.[1], "2025-B-002");
  });
});

describe("findBlockForMCode", () => {
  it("returns the same block as findItemBlocks for the given m_code", () => {
    const blocks = findItemBlocks(payload);
    const b = blocks.find((b) => b.mCode === "M_B")!;
    const ref = findBlockForMCode(payload, "M_B");
    assert.ok(ref);
    assert.equal(ref, b.block);
  });
});

describe("per-block field extraction (the original bug surface)", () => {
  it("m_evaluate_price is read from this item's own block, not the neighbour", () => {
    const blocks = findItemBlocks(payload);
    const extract = (block: string) => {
      const re = /"m_evaluate_price"\s*:\s*(\d+)/g;
      const values = [...block.matchAll(re)].map((m) => Number(m[1]));
      return values.length ? values[values.length - 1] : null;
    };
    assert.equal(extract(blocks[0].block), 25_000_000);
    assert.equal(extract(blocks[1].block), 33_000_000);
    assert.equal(extract(blocks[2].block), 28_000_000);
  });

  it("low_price uses the LAST write inside the block (handles placeholders)", () => {
    const blocks = findItemBlocks(payload);
    const extractLast = (block: string) => {
      const re = /"low_price"\s*:\s*(\d+)/g;
      const values = [...block.matchAll(re)].map((m) => Number(m[1]));
      return values.length ? values[values.length - 1] : null;
    };
    assert.equal(extractLast(blocks[0].block), 17_500_000);
    assert.equal(extractLast(blocks[1].block), 29_700_000);
    assert.equal(extractLast(blocks[2].block), 22_400_000);
  });

  it("car_storage_method picks the LAST write so a placeholder can't shadow it", () => {
    const blocks = findItemBlocks(payload);
    const extractLast = (block: string) => {
      const re = /"car_storage_method"\s*:\s*"([^"]*)"/g;
      const values = [...block.matchAll(re)].map((m) => m[1]);
      return values.length ? values[values.length - 1] : null;
    };
    assert.equal(extractLast(blocks[0].block), "오토마트 A보관소");
    assert.equal(extractLast(blocks[1].block), "오토허브 B보관소");
    assert.equal(extractLast(blocks[2].block), "제3자 안태수 보관");
  });

  it("addr is unique per item (no off-by-one from neighbour)", () => {
    const blocks = findItemBlocks(payload);
    const extract = (block: string) =>
      block.match(/"addr":\s*"([^"]+)"/)?.[1];
    assert.equal(extract(blocks[0].block), "서울 강남구 A주차장");
    assert.equal(extract(blocks[1].block), "경기 성남시 B보관소");
    assert.equal(extract(blocks[2].block), "인천 연수구 C보관소");
  });

  it("case_num is unique per item", () => {
    const blocks = findItemBlocks(payload);
    const extract = (block: string) =>
      block.match(/"case_num":\s*"([^"]+)"/)?.[1];
    assert.equal(extract(blocks[0].block), "2025-A-001");
    assert.equal(extract(blocks[1].block), "2025-B-002");
    assert.equal(extract(blocks[2].block), "2025-C-003");
  });
});