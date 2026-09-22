/**
 * Tests for the used-car filter. The filter applies the user's
 * year / mileage / price / fuel criteria; missing fields are NOT auto-rejected
 * (we only filter on a field when it has a parseable value).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyUsedCarFilters,
  evaluateUsedCar,
} from "./filter.ts";
import {
  DEFAULT_USED_CAR_CONFIG,
  type UsedCarListing,
} from "./types.ts";

function listing(overrides: Partial<UsedCarListing> = {}): UsedCarListing {
  return {
    id: "test:1",
    platform: "kcar",
    platformName: "K Car",
    carName: "현대 아이오닉 5",
    year: 2024,
    mileage: 24_000,
    listingPrice: 2_800 * 10_000,
    fuel: "전기",
    fuelLabel: "전기",
    seller: "메가센터",
    detailUrl: "https://example.com",
    imageUrl: null,
    tags: [],
    rawText: "",
    collectedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("evaluateUsedCar", () => {
  it("passes when all fields satisfy the default config", () => {
    const r = evaluateUsedCar(listing(), DEFAULT_USED_CAR_CONFIG);
    assert.equal(r.grade, "match");
    assert.deepEqual(r.rejectReasons, []);
  });

  it("rejects a car older than minYear", () => {
    const r = evaluateUsedCar(listing({ year: 2020 }), DEFAULT_USED_CAR_CONFIG);
    assert.equal(r.grade, "rejected");
    assert.ok(r.rejectReasons.some((s) => s.includes("년식")));
  });

  it("rejects a car with mileage above maxMileageKm", () => {
    const r = evaluateUsedCar(
      listing({ mileage: 60_000 }),
      DEFAULT_USED_CAR_CONFIG,
    );
    assert.equal(r.grade, "rejected");
    assert.ok(r.rejectReasons.some((s) => s.includes("km")));
  });

  it("rejects a car above maxPriceKRW", () => {
    const r = evaluateUsedCar(
      listing({ listingPrice: 3_500 * 10_000 }),
      DEFAULT_USED_CAR_CONFIG,
    );
    assert.equal(r.grade, "rejected");
    assert.ok(r.rejectReasons.some((s) => s.includes("만원")));
  });

  it("rejects a fuel type outside the allowlist", () => {
    const r = evaluateUsedCar(
      listing({ fuel: "디젤" }),
      DEFAULT_USED_CAR_CONFIG,
    );
    assert.equal(r.grade, "rejected");
    assert.ok(r.rejectReasons.some((s) => s.includes("연료")));
  });

  it("passes when fuelAllowlist is empty (any fuel allowed)", () => {
    const r = evaluateUsedCar(
      listing({ fuel: "디젤" }),
      { ...DEFAULT_USED_CAR_CONFIG, fuelAllowlist: [] },
    );
    assert.equal(r.grade, "match");
  });

  it("does NOT auto-reject when fields are missing", () => {
    const r = evaluateUsedCar(
      listing({ year: null, mileage: null, listingPrice: null }),
      DEFAULT_USED_CAR_CONFIG,
    );
    // Missing fields are tolerated — we only filter on values we have.
    assert.equal(r.grade, "match");
  });

  it("combines multiple reject reasons", () => {
    const r = evaluateUsedCar(
      listing({ year: 2020, mileage: 80_000, fuel: "디젤" }),
      DEFAULT_USED_CAR_CONFIG,
    );
    assert.equal(r.grade, "rejected");
    assert.ok(r.rejectReasons.length >= 3);
  });
});

describe("applyUsedCarFilters", () => {
  it("attaches grade + rejectReasons to each listing", () => {
    const input = [
      listing({ id: "a" }),
      listing({ id: "b", year: 2020 }),
    ];
    const out = applyUsedCarFilters(input, DEFAULT_USED_CAR_CONFIG);
    assert.equal(out.length, 2);
    assert.equal(out[0].grade, "match");
    assert.deepEqual(out[0].rejectReasons, []);
    assert.equal(out[1].grade, "rejected");
    assert.ok((out[1].rejectReasons ?? []).length > 0);
  });
});
