import { describe, it, expect } from "vitest";
import {
  PERSONALITY_ITEMS,
  PERSONALITY_FACETS,
  ENTREPRENEURIAL_FACETS,
  TOTAL_PERSONALITY_ITEMS,
  type PersonalityFacet,
} from "../personality-bank";

describe("personality-bank", () => {
  it("has 96 total items", () => {
    // 7 entrepreneurial facets x 12 + GR x 10 + AC x 2 = 96
    expect(PERSONALITY_ITEMS).toHaveLength(96);
    expect(TOTAL_PERSONALITY_ITEMS).toBe(96);
  });

  it("has correct item count per facet", () => {
    const counts = new Map<PersonalityFacet, number>();
    for (const item of PERSONALITY_ITEMS) {
      counts.set(item.facet, (counts.get(item.facet) ?? 0) + 1);
    }

    // 12 each for AM, RT, IN, AU, SE, ST, IL
    expect(counts.get("AM")).toBe(12);
    expect(counts.get("RT")).toBe(12);
    expect(counts.get("IN")).toBe(12);
    expect(counts.get("AU")).toBe(12);
    expect(counts.get("SE")).toBe(12);
    expect(counts.get("ST")).toBe(12);
    expect(counts.get("IL")).toBe(12);
    // 10 for GR
    expect(counts.get("GR")).toBe(10);
    // 2 for AC
    expect(counts.get("AC")).toBe(2);
  });

  it("has all unique item IDs", () => {
    const ids = PERSONALITY_ITEMS.map((item) => item.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("has valid facet codes on all items", () => {
    const validFacets = new Set(PERSONALITY_FACETS);
    for (const item of PERSONALITY_ITEMS) {
      expect(validFacets.has(item.facet)).toBe(true);
    }
  });

  it("has the expected number of reverse-coded items", () => {
    const reverseCount = PERSONALITY_ITEMS.filter((item) => item.reverse).length;
    // Each of the 7 entrepreneurial facets has ~3 reverse items (varies)
    // GR has 3, AC has 0
    // AM: AM08, AM10 = 2
    // RT: RT04, RT06, RT08, RT10 = 4
    // IN: IN04, IN08, IN12 = 3
    // AU: AU04, AU08, AU12 = 3
    // SE: SE04, SE08 = 2
    // ST: ST03, ST06, ST08 = 3
    // IL: IL03, IL06, IL09 = 3
    // GR: GR04, GR06, GR08 = 3
    // AC: 0
    // Total: 2 + 4 + 3 + 3 + 2 + 3 + 3 + 3 + 0 = 23
    expect(reverseCount).toBeGreaterThan(0);
    expect(reverseCount).toBe(23);
  });

  it("has 9 facets total", () => {
    expect(PERSONALITY_FACETS).toHaveLength(9);
  });

  it("has 7 entrepreneurial facets (excludes GR and AC)", () => {
    expect(ENTREPRENEURIAL_FACETS).toHaveLength(7);
    expect(ENTREPRENEURIAL_FACETS).not.toContain("GR");
    expect(ENTREPRENEURIAL_FACETS).not.toContain("AC");
  });

  it("all items have non-empty text", () => {
    for (const item of PERSONALITY_ITEMS) {
      expect(item.text.trim().length).toBeGreaterThan(0);
    }
  });

  it("all items have boolean reverse field", () => {
    for (const item of PERSONALITY_ITEMS) {
      expect(typeof item.reverse).toBe("boolean");
    }
  });
});
