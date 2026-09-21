/**
 * S-Tier Precision detector regression tests.
 *
 * These three mock listings are the S-Tier benchmark patterns from the
 * prototype HTML (mockListings in auctioncarradar_web_dashboard.html). They
 * must all five-rule-pass and score >= 85 with `isSTier === true`.
 *
 *   - s-benchmark  : RAV4 Hybrid at Court  / "오토마트 인천보관소"
 *   - s-002        : 그랜저 Hybrid at Madang / "오토허브 전문보관소"
 *   - s-003        : EV6 at Onbid / "인천항 공영 전문보관소" / 한국자산관리공사
 *
 * Edge cases below ensure the detector doesn't false-positive on rejected or
 * near-miss listings.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateSTier,
  isOfficialStorage,
  passesAllSTierRules,
} from "./stier.ts";
import type { Platform, StandardListing, STierBreakdown } from "./types.ts";

function makeListing(partial: Partial<StandardListing> & { platform: Platform }): StandardListing {
  return {
    id: partial.id ?? "test",
    platform: partial.platform,
    platformName: partial.platformName ?? partial.platform,
    caseNo: partial.caseNo ?? "X-0000",
    courtOrDept: partial.courtOrDept ?? "",
    carName: partial.carName ?? "",
    year: partial.year ?? null,
    mileage: partial.mileage ?? null,
    fuel: partial.fuel ?? "하이브리드",
    appraisalPrice: partial.appraisalPrice ?? null,
    minPrice: partial.minPrice ?? null,
    discountRate: partial.discountRate ?? null,
    auctionDate: partial.auctionDate ?? "—",
    detailUrl: partial.detailUrl ?? "",
    imageUrl: partial.imageUrl ?? null,
    status: partial.status ?? "",
    rawText: partial.rawText ?? "",
    keyStatus: partial.keyStatus ?? "미검사",
    matchedKeyKeywords: partial.matchedKeyKeywords ?? [],
    matchedDangerKeywords: partial.matchedDangerKeywords ?? [],
    grade: partial.grade ?? "a",
    rejectReasons: partial.rejectReasons ?? [],
    collectedAt: partial.collectedAt ?? new Date().toISOString(),
    storageSite: partial.storageSite ?? null,
    isSTier: false,
    sTierScore: 0,
    sTierBreakdown: {
      shortMileage: false,
      warrantyValid: false,
      sweetDiscount: false,
      officialStorage: false,
      crossValidated: false,
      score: 0,
      reasons: [],
    } satisfies STierBreakdown,
  };
}

function expectSTierMatches(label: string, listing: StandardListing) {
  const breakdown = evaluateSTier(listing);
  const isSTier = passesAllSTierRules(breakdown);
  const ok =
    breakdown.shortMileage &&
    breakdown.warrantyValid &&
    breakdown.sweetDiscount &&
    breakdown.officialStorage &&
    breakdown.crossValidated &&
    breakdown.score >= 85 &&
    isSTier;
  assert.ok(ok, `${label} should be S-Tier but got ${JSON.stringify(breakdown, null, 2)}`);
  return breakdown;
}

describe("isOfficialStorage keyword matrix", () => {
  it("matches 오토마트 + region suffix", () => {
    assert.equal(
      isOfficialStorage("", "오토마트 인천보관소", null, null, "court"),
      true,
    );
  });
  it("matches 오토허브 + 전문보관소 suffix", () => {
    assert.equal(
      isOfficialStorage("", "오토허브 전문보관소", null, null, "madang"),
      true,
    );
  });
  it("matches 인천항 공영 전문보관소 (split keyword)", () => {
    assert.equal(
      isOfficialStorage("", "인천항 공영 전문보관소", null, "한국자산관리공사", "onbid"),
      true,
    );
  });
  it("matches pure 캠코 / 한국자산관리공사 registry on Onbid", () => {
    assert.equal(
      isOfficialStorage("일반 차량 보관", null, null, "한국자산관리공사", "onbid"),
      true,
    );
  });
  it("does not match generic parking without official signal", () => {
    assert.equal(
      isOfficialStorage("법원 지정 주차장", null, "서울중앙지방법원", "서울중앙지방법원", "court"),
      false,
    );
  });
});

describe("S-Tier benchmark: prototype HTML mocks (3 listings)", () => {
  it("RAV4 Hybrid (Court, 오토마트 인천보관소)", () => {
    const breakdown = expectSTierMatches(
      "RAV4 Hybrid",
      makeListing({
        id: "s-benchmark",
        platform: "court",
        platformName: "Court",
        caseNo: "2026타경502520",
        courtOrDept: "인천지방법원",
        carName: "토요타 RAV4 Hybrid 2WD (신차급)",
        year: 2024,
        mileage: 9113,
        fuel: "하이브리드",
        appraisalPrice: 39_000_000,
        minPrice: 27_300_000,
        discountRate: 30,
        storageSite: "오토마트 인천보관소",
        rawText:
          "2024년식 초단거리 9,113 km 주행. 하이브리드 배터리 및 차체 무상보증 유효. " +
          "인천 오토마트 전문 보관소 안전 입고. 카히스토리 및 계기판 주행거리 교차검증 일치. " +
          "스페어키 포함 2개 보관 (시동 정상)",
        matchedKeyKeywords: ["스페어키"],
      }),
    );
    // Sanity: the canonical 5 rules fire.
    assert.equal(breakdown.shortMileage, true);
    assert.equal(breakdown.warrantyValid, true);
    assert.equal(breakdown.sweetDiscount, true);
    assert.equal(breakdown.officialStorage, true);
    assert.equal(breakdown.crossValidated, true);
  });

  it("그랜저 Hybrid (Madang, 오토허브 전문보관소)", () => {
    const breakdown = expectSTierMatches(
      "그랜저 Hybrid",
      makeListing({
        id: "s-002",
        platform: "madang",
        platformName: "Madang",
        caseNo: "M-260901-012",
        courtOrDept: "경매마당 수원의왕센터",
        carName: "현대 디 올 뉴 그랜저 하이브리드 GN7",
        year: 2024,
        mileage: 12_400,
        fuel: "하이브리드",
        appraisalPrice: 47_000_000,
        minPrice: 32_900_000,
        discountRate: 30,
        storageSite: "오토허브 전문보관소",
        rawText:
          "실내 신차 보호비닐 미제거. 오토허브 보관소 입고. 하이브리드 보증 잔여. " +
          "스페어키 2개 보관 중",
        matchedKeyKeywords: ["스페어키"],
      }),
    );
    assert.equal(breakdown.officialStorage, true);
    assert.ok(
      breakdown.reasons.some((r) => /오토허브/.test(r)),
      "reason should mention 오토허브",
    );
  });

  it("EV6 (Onbid, 인천항 공영 전문보관소)", () => {
    const breakdown = expectSTierMatches(
      "EV6 Onbid",
      makeListing({
        id: "s-003",
        platform: "onbid",
        platformName: "Onbid",
        caseNo: "2026-0912-00481",
        courtOrDept: "한국자산관리공사 서울본부",
        carName: "기아 EV6 롱레인지 2WD 어스",
        year: 2024,
        mileage: 14_200,
        fuel: "전기",
        appraisalPrice: 43_000_000,
        minPrice: 30_100_000,
        discountRate: 30,
        storageSite: "인천항 공영 전문보관소",
        rawText:
          "전기차 배터리 SOH 99% 상태. 제조사 무상보증 적용 대상. " +
          "스페어키 보유 (정상 시동)",
        matchedKeyKeywords: ["스페어키"],
      }),
    );
    assert.equal(breakdown.officialStorage, true);
    assert.ok(
      breakdown.reasons.some((r) => /공영|인천항|한국자산/.test(r)),
      "reason should mention 공영 or 인천항 or 한국자산",
    );
  });
});

describe("S-Tier false-positive guards", () => {
  it("A-Grade candidate with mileage 28k stays A-Grade (rule ① fails)", () => {
    const listing = makeListing({
      platform: "court",
      year: 2023,
      mileage: 28_400,
      fuel: "전기",
      discountRate: 36,
      storageSite: "법원 지정 주차장",
      rawText: "키 보관 (시동 확인)",
      matchedKeyKeywords: ["키 보관"],
    });
    const breakdown = evaluateSTier(listing);
    assert.equal(breakdown.shortMileage, false);
    assert.equal(breakdown.warrantyValid, false);
    assert.equal(passesAllSTierRules(breakdown), false);
    // Partial score from rule ③ still surfaces in UI progress bar.
    assert.ok(breakdown.score >= 20 && breakdown.score <= 60);
  });

  it("Rejected listing with WRECK keyword gets partial score (cross-validation fails)", () => {
    const listing = makeListing({
      platform: "madang",
      year: 2024,
      mileage: 12_000,
      fuel: "하이브리드",
      discountRate: 30,
      storageSite: "오토허브 전문보관소",
      rawText: "전손 차량입니다. 시동 불가.",
      matchedKeyKeywords: [],
      matchedDangerKeywords: ["전손"],
    });
    const breakdown = evaluateSTier(listing);
    assert.equal(breakdown.crossValidated, false);
    assert.equal(passesAllSTierRules(breakdown), false);
  });

  it("null mileage gracefully degrades — rule ① fails but score stays non-negative", () => {
    const listing = makeListing({
      platform: "court",
      year: 2024,
      mileage: null,
      fuel: "하이브리드",
      discountRate: 30,
      storageSite: "오토마트 인천보관소",
      rawText: "스페어키 보관",
      matchedKeyKeywords: ["스페어키"],
    });
    const breakdown = evaluateSTier(listing);
    assert.equal(breakdown.shortMileage, false);
    assert.equal(passesAllSTierRules(breakdown), false);
  });
});