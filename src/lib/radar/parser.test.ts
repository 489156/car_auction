import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateListing } from "./filter.ts";
import { DEFAULT_SEARCH_CONFIG } from "./config.ts";
import { extractCarDetails, parseMileage, parseYear } from "./parser.ts";

describe("parser", () => {
  it("reads 2024년식", () => {
    assert.equal(parseYear("현대 아이오닉5 2024년식"), 2024);
  });

  it("reads comma mileage", () => {
    assert.equal(parseMileage("47,580km"), 47580);
  });

  it("reads spaced km", () => {
    assert.equal(parseMileage("50000 km"), 50000);
  });

  it("reads 킬로미터", () => {
    assert.equal(parseMileage("주행거리 12,345 킬로미터"), 12345);
  });

  it("classifies hybrid and electric", () => {
    assert.equal(extractCarDetails("토요타 RAV4 Hybrid").fuel, "하이브리드");
    assert.equal(extractCarDetails("아이오닉5 전기").fuel, "전기");
    assert.equal(extractCarDetails("가솔린+전기 니로").fuel, "가솔린+전기");
  });
});

describe("filter AND engine", () => {
  const base = {
    carName: "토요타 RAV4 Hybrid",
    year: 2024,
    mileage: 9113,
    fuel: "하이브리드",
    rawText: "키 보관 확인, 스페어키 있음",
  };

  it("passes A-grade when all rules match", () => {
    const result = evaluateListing(base, DEFAULT_SEARCH_CONFIG);
    assert.equal(result.grade, "a");
  });

  it("rejects old year", () => {
    const result = evaluateListing({ ...base, year: 2019 }, DEFAULT_SEARCH_CONFIG);
    assert.equal(result.grade, "rejected");
  });

  it("rejects high mileage", () => {
    const result = evaluateListing({ ...base, mileage: 88000 }, DEFAULT_SEARCH_CONFIG);
    assert.equal(result.grade, "rejected");
  });

  it("rejects danger keyword", () => {
    const result = evaluateListing(
      { ...base, rawText: "키 보관, 전손 이력" },
      DEFAULT_SEARCH_CONFIG,
    );
    assert.equal(result.grade, "rejected");
    assert.ok(result.matchedDangerKeywords.includes("전손"));
  });

  it("marks candidate when key keyword is missing", () => {
    const result = evaluateListing(
      { ...base, rawText: "하이브리드 무사고" },
      DEFAULT_SEARCH_CONFIG,
    );
    assert.equal(result.grade, "candidate");
  });

  it("detects 키 보관", () => {
    const result = evaluateListing(base, DEFAULT_SEARCH_CONFIG);
    assert.ok(result.matchedKeyKeywords.includes("키 보관"));
  });
});
