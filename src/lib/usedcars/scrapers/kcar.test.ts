/**
 * Tests for the K Car scraper's card-text parser. We construct realistic
 * `ParsedCard` shapes (matching the actual `.carListBox` DOM structure) and
 * assert that `toUsedCarListing` produces correct `UsedCarListing`s.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toUsedCarListing } from "./kcar.ts";

function card(overrides: Partial<{
  carTit: string;
  carExp: string;
  yearMonth: string;
  mileageText: string;
  fuelText: string;
  seller: string;
  tags: string[];
  imageUrl: string | null;
  carId: string | null;
}> = {}) {
  return {
    carTit: "현대 아이오닉 5 롱레인지 2WD",
    carExp: "3,470만원",
    yearMonth: "23년 5월식",
    mileageText: "24,258km",
    fuelText: "전기",
    seller: "홈서비스 메가센터",
    tags: ["6개월 보증", "KW6무료", "짧은 Km"],
    imageUrl:
      "https://img.kcar.com/3dcarpicture/2026/09/173/61386293_1/main/main780.jpg",
    carId: null,
    ...overrides,
  };
}

describe("K Car card parser", () => {
  it("extracts car name, price, year, mileage, fuel, seller", () => {
    const l = toUsedCarListing(card());
    assert.ok(l);
    assert.equal(l!.carName, "현대 아이오닉 5 롱레인지 2WD");
    assert.equal(l!.listingPrice, 3_470 * 10_000);
    assert.equal(l!.year, 2023);
    assert.equal(l!.mileage, 24_258);
    assert.equal(l!.fuel, "전기");
    assert.equal(l!.fuelLabel, "전기");
    assert.equal(l!.seller, "홈서비스 메가센터");
    assert.deepEqual(l!.tags, ["6개월 보증", "KW6무료", "짧은 Km"]);
  });

  it("uses carId from image URL when present", () => {
    const l = toUsedCarListing(card());
    assert.ok(l);
    assert.match(l!.id, /^kcar:61386293/);
    assert.equal(l!.platform, "kcar");
    assert.equal(l!.platformName, "K Car");
  });

  it("falls back to name+year+mileage when no image URL or carId", () => {
    const l = toUsedCarListing(card({ imageUrl: null }));
    assert.ok(l);
    assert.match(l!.id, /^kcar:현대/);
  });

  it("handles hybrid fuel labels", () => {
    const l = toUsedCarListing(card({ fuelText: "하이브리드" }));
    assert.equal(l!.fuel, "하이브리드");
  });

  it("handles diesel and 가솔린 fuel labels", () => {
    assert.equal(toUsedCarListing(card({ fuelText: "디젤" }))!.fuel, "디젤");
    assert.equal(toUsedCarListing(card({ fuelText: "가솔린" }))!.fuel, "가솔린");
    assert.equal(toUsedCarListing(card({ fuelText: "LPG" }))!.fuel, "LPG");
  });

  it("handles missing price gracefully", () => {
    const l = toUsedCarListing(card({ carExp: "가격문의" }));
    assert.equal(l!.listingPrice, null);
  });

  it("handles missing year gracefully", () => {
    const l = toUsedCarListing(card({ yearMonth: "" }));
    assert.equal(l!.year, null);
  });

  it("skips cards with empty car name", () => {
    const l = toUsedCarListing(card({ carTit: "  " }));
    assert.equal(l, null);
  });

  it("parses 19-year-old car with explicit year prefix", () => {
    const l = toUsedCarListing(card({ yearMonth: "19년 11월식" }));
    assert.equal(l!.year, 2019);
  });
});
