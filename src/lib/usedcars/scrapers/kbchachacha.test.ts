/**
 * Tests for the KB차차차 scraper's card-text parser. KB차차차's `.item` cards
 * are scraped with `readCardsFromPage` (page.evaluate) which splits the
 * `innerText` into name / year-month / mileage / region / tags / price.
 *
 * We exercise `toUsedCarListing` against realistic ParsedKbcCard shapes
 * mirroring real KB차차차 DOM output.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toUsedCarListing } from "./kbchachacha.ts";

function card(
  overrides: Partial<{
    carName: string;
    yearMonth: string;
    mileageText: string;
    priceText: string;
    region: string;
    tags: string[];
    detailUrl: string;
    carSeq: string | null;
  }> = {},
) {
  return {
    carName: "테슬라 Model 3 Highland RWD",
    yearMonth: "25/03식",
    mileageText: "27,224km",
    priceText: "4,450 만원",
    region: "경기",
    tags: ["실차주", "헛걸음보상", "검정색 시트"],
    detailUrl:
      "https://www.kbchachacha.com/public/car/detail.kbc?carSeq=28773989",
    carSeq: "28773989",
    ...overrides,
  };
}

describe("KB차차차 card parser", () => {
  it("extracts car name, price, year, mileage, region", () => {
    const l = toUsedCarListing(card());
    assert.ok(l);
    assert.equal(l!.carName, "테슬라 Model 3 Highland RWD");
    assert.equal(l!.listingPrice, 4_450 * 10_000);
    assert.equal(l!.year, 2025);
    assert.equal(l!.mileage, 27_224);
    assert.equal(l!.seller, "경기");
    assert.equal(l!.platform, "kbchachacha");
    assert.equal(l!.platformName, "KB차차차");
  });

  it("uses carSeq for id and full detailUrl", () => {
    const l = toUsedCarListing(card());
    assert.equal(l!.id, "kbchachacha:28773989");
    assert.match(l!.detailUrl, /carSeq=28773989/);
  });

  it("recognises fuel from tags when present", () => {
    const l = toUsedCarListing(card({ tags: ["전기", "실차주"] }));
    assert.equal(l!.fuel, "전기");
    assert.equal(l!.fuelLabel, "전기");
  });

  it("falls back to 기타 when no fuel tag", () => {
    const l = toUsedCarListing(card({ tags: ["실차주"] }));
    assert.equal(l!.fuel, "기타");
    assert.equal(l!.fuelLabel, "기타");
  });

  it("handles missing price", () => {
    const l = toUsedCarListing(card({ priceText: "" }));
    assert.equal(l!.listingPrice, null);
  });

  it("handles missing year-month gracefully", () => {
    const l = toUsedCarListing(card({ yearMonth: "" }));
    assert.equal(l!.year, null);
  });

  it("parses 2018 car from KB차차차 18/05식 format", () => {
    const l = toUsedCarListing(card({ yearMonth: "18/05식" }));
    assert.equal(l!.year, 2018);
  });

  it("skips cards with empty car name", () => {
    const l = toUsedCarListing(card({ carName: "   " }));
    assert.equal(l, null);
  });

  it("falls back to name+year+mileage id when carSeq is missing", () => {
    const l = toUsedCarListing(card({ carSeq: null }));
    assert.match(l!.id, /^kbchachacha:테슬라/);
  });
});
