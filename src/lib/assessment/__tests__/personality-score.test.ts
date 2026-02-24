import { describe, it, expect, vi } from "vitest";

// Mock server-only before importing the module
vi.mock("server-only", () => ({}));

import { computePersonalityScores } from "../personality-score";
import type { PersonalityResponseInput } from "../personality-score";
import {
  PERSONALITY_ITEMS,
  PERSONALITY_FACETS,
  ENTREPRENEURIAL_FACETS,
  type PersonalityFacet,
  type LikertValue,
} from "../personality-bank";

/** Helper: create a full response set with all items answered at a given value. */
function allItemsAtValue(value: LikertValue): PersonalityResponseInput[] {
  return PERSONALITY_ITEMS.map((item) => ({
    itemId: item.id,
    facet: item.facet,
    value,
    reverse: item.reverse,
  }));
}

/** Helper: create responses for a single facet at a given value. */
function facetAtValue(
  facet: PersonalityFacet,
  value: LikertValue
): PersonalityResponseInput[] {
  return PERSONALITY_ITEMS.filter((item) => item.facet === facet).map(
    (item) => ({
      itemId: item.id,
      facet: item.facet,
      value,
      reverse: item.reverse,
    })
  );
}

describe("computePersonalityScores", () => {
  it("computes scores for all items answered at 5 (happy path)", () => {
    const responses = allItemsAtValue(5);
    const result = computePersonalityScores(responses);

    expect(result.missingItemCount).toBe(0);
    expect(result.straightLineFlag).toBe(true); // all same value

    // All facets should have scores
    for (const facet of PERSONALITY_FACETS) {
      expect(result.facets[facet]).toBeDefined();
      expect(result.facets[facet].itemCount).toBeGreaterThan(0);
    }
  });

  it("reverse-codes items correctly", () => {
    // Answer all items with value 1
    // Forward items: adjusted = 1, Reverse items: adjusted = 6 - 1 = 5
    const responses = allItemsAtValue(1);
    const result = computePersonalityScores(responses);

    // AM has 2 reverse items (AM08, AM10) and 10 forward items
    // Forward: 1, Reverse: 5
    // Mean = (10 * 1 + 2 * 5) / 12 = 20 / 12 ≈ 1.667
    const amScore = result.facets["AM"];
    expect(amScore.mean).toBeCloseTo(20 / 12, 2);
  });

  it("rescales Likert mean 1 to 0%", () => {
    // Need all forward items answered at 1 and all reverse items answered at 5
    // so adjusted values are all 1
    const responses = PERSONALITY_ITEMS.map((item) => ({
      itemId: item.id,
      facet: item.facet,
      value: (item.reverse ? 5 : 1) as LikertValue,
      reverse: item.reverse,
    }));
    const result = computePersonalityScores(responses);

    // Every item's adjusted value is 1, so mean = 1, rescaled = ((1 - 1) / 4) * 100 = 0
    for (const facet of PERSONALITY_FACETS) {
      expect(result.facets[facet].mean).toBeCloseTo(1, 5);
      expect(result.facets[facet].rescaled).toBeCloseTo(0, 5);
    }
  });

  it("rescales Likert mean 3 to 50%", () => {
    const responses = PERSONALITY_ITEMS.map((item) => ({
      itemId: item.id,
      facet: item.facet,
      value: (item.reverse ? 3 : 3) as LikertValue,
      reverse: item.reverse,
    }));
    const result = computePersonalityScores(responses);

    // Adjusted for forward: 3, for reverse: 6 - 3 = 3
    // Mean = 3, rescaled = ((3 - 1) / 4) * 100 = 50
    for (const facet of PERSONALITY_FACETS) {
      expect(result.facets[facet].mean).toBeCloseTo(3, 5);
      expect(result.facets[facet].rescaled).toBeCloseTo(50, 5);
    }
  });

  it("rescales Likert mean 5 to 100%", () => {
    const responses = PERSONALITY_ITEMS.map((item) => ({
      itemId: item.id,
      facet: item.facet,
      value: (item.reverse ? 1 : 5) as LikertValue,
      reverse: item.reverse,
    }));
    const result = computePersonalityScores(responses);

    for (const facet of PERSONALITY_FACETS) {
      expect(result.facets[facet].mean).toBeCloseTo(5, 5);
      expect(result.facets[facet].rescaled).toBeCloseTo(100, 5);
    }
  });

  it("computes globalIndex from 7 entrepreneurial facets only", () => {
    // Give entrepreneurial facets all 5 (adjusted), GR and AC different
    const responses = PERSONALITY_ITEMS.map((item) => {
      const isEntrepreneurial = ENTREPRENEURIAL_FACETS.includes(item.facet);
      return {
        itemId: item.id,
        facet: item.facet,
        value: (isEntrepreneurial
          ? item.reverse
            ? 1
            : 5
          : 3) as LikertValue,
        reverse: item.reverse,
      };
    });

    const result = computePersonalityScores(responses);

    // Entrepreneurial facets all have mean 5
    for (const facet of ENTREPRENEURIAL_FACETS) {
      expect(result.facets[facet].mean).toBeCloseTo(5, 2);
    }

    // Global index should be mean of the 7 entrepreneurial facet means = 5
    expect(result.globalIndex).toBeCloseTo(5, 2);
    expect(result.globalIndexRescaled).toBeCloseTo(100, 2);

    // GR and AC should NOT be 5
    expect(result.facets["GR"].mean).not.toBeCloseTo(5, 1);
  });

  it("detects attention check fail: AC01 < 4", () => {
    // AC01 "Please select 'Agree' for this item" — reverse: false
    // If answered with 1, adjusted = 1, which is < 4 → fail
    const responses = allItemsAtValue(4);
    const ac01 = responses.find((r) => r.itemId === "AC01")!;
    ac01.value = 1; // Should trigger attention fail

    const result = computePersonalityScores(responses);
    expect(result.attentionFail).toBe(true);
  });

  it("passes attention check when AC01 >= 4", () => {
    const responses = allItemsAtValue(4);
    const result = computePersonalityScores(responses);
    // AC01 answered 4, adjusted = 4 (not reverse), 4 >= 4 → pass
    expect(result.attentionFail).toBe(false);
  });

  it("detects infrequency fail: AC02 > 3", () => {
    // AC02 "I have never used a computer before" — reverse: false
    // If answered with 4, adjusted = 4, which is > 3 → fail
    const responses = allItemsAtValue(3);
    const ac02 = responses.find((r) => r.itemId === "AC02")!;
    ac02.value = 4;

    const result = computePersonalityScores(responses);
    expect(result.infrequencyFail).toBe(true);
  });

  it("passes infrequency check when AC02 <= 3", () => {
    // Answer AC02 with value 3 (adjusted = 3, not reverse), 3 is not > 3 → pass
    const responses = allItemsAtValue(3);
    const result = computePersonalityScores(responses);
    expect(result.infrequencyFail).toBe(false);
  });

  it("detects straight-lining: all identical raw values across 10+ items", () => {
    const responses = allItemsAtValue(3);
    const result = computePersonalityScores(responses);
    expect(result.straightLineFlag).toBe(true);
  });

  it("does not flag straight-lining with mixed values", () => {
    const responses = PERSONALITY_ITEMS.map((item, i) => ({
      itemId: item.id,
      facet: item.facet,
      value: ((i % 5) + 1) as LikertValue,
      reverse: item.reverse,
    }));
    const result = computePersonalityScores(responses);
    expect(result.straightLineFlag).toBe(false);
  });

  it("counts missing items", () => {
    // Only answer AM facet items
    const responses = facetAtValue("AM", 4);
    const result = computePersonalityScores(responses);
    expect(result.missingItemCount).toBe(PERSONALITY_ITEMS.length - 12);
  });

  it("handles empty responses", () => {
    const result = computePersonalityScores([]);
    expect(result.missingItemCount).toBe(PERSONALITY_ITEMS.length);
    expect(result.globalIndex).toBe(0);
    expect(result.straightLineFlag).toBe(false);
    expect(result.attentionFail).toBe(false);
    expect(result.infrequencyFail).toBe(false);
  });

  it("computes grit from GR facet", () => {
    // All GR items answered at 5 (forward) or 1 (reverse)
    const responses = PERSONALITY_ITEMS.map((item) => ({
      itemId: item.id,
      facet: item.facet,
      value: (item.facet === "GR"
        ? item.reverse
          ? 1
          : 5
        : 3) as LikertValue,
      reverse: item.reverse,
    }));
    const result = computePersonalityScores(responses);
    expect(result.gritMean).toBeCloseTo(5, 2);
    expect(result.gritRescaled).toBeCloseTo(100, 2);
  });
});
