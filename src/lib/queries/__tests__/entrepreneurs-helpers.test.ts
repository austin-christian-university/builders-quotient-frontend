import { describe, it, expect } from "vitest";
import {
  computeCorpusMax,
  averageScores,
  computeAvgPersonalityVector,
  sanitizePersonalityVector,
  countDistinct,
  computeTraitStats,
} from "../entrepreneurs-helpers";
import type { EntrepreneurSummary } from "@/lib/schemas/entrepreneurs";
import {
  PI_CANONICAL_CATEGORIES,
  CI_CANONICAL_CATEGORIES,
} from "@/lib/assessment/scoring-categories";

function makeEntrepreneur(
  overrides: Partial<EntrepreneurSummary> = {}
): EntrepreneurSummary {
  return {
    id: "e1",
    name: "Test Founder",
    archetype_key: "analytical_exploratory__insight_market",
    archetype_name: "Test Archetype",
    archetype_tagline: "",
    pi_style: "analytical_exploratory",
    ci_style: "insight_market",
    pi_d1_score: 0,
    pi_d2_score: 0,
    ci_d1_score: 0,
    ci_d2_score: 0,
    pi_category_scores: null,
    ci_category_scores: null,
    industries: null,
    ...overrides,
  } as EntrepreneurSummary;
}

describe("computeCorpusMax", () => {
  it("seeds all canonical categories to zero with no data", () => {
    const result = computeCorpusMax([]);
    for (const cat of PI_CANONICAL_CATEGORIES) {
      expect(result.pi[cat]).toBe(0);
    }
    for (const cat of CI_CANONICAL_CATEGORIES) {
      expect(result.ci[cat]).toBe(0);
    }
  });

  it("takes the max across entrepreneurs per category", () => {
    const cat = PI_CANONICAL_CATEGORIES[0];
    const es = [
      makeEntrepreneur({ pi_category_scores: { [cat]: 0.3 } }),
      makeEntrepreneur({ pi_category_scores: { [cat]: 0.9 } }),
      makeEntrepreneur({ pi_category_scores: { [cat]: 0.5 } }),
    ];
    expect(computeCorpusMax(es).pi[cat]).toBe(0.9);
  });

  it("handles entrepreneurs missing either PI or CI scores", () => {
    const piCat = PI_CANONICAL_CATEGORIES[0];
    const ciCat = CI_CANONICAL_CATEGORIES[0];
    const es = [
      makeEntrepreneur({ pi_category_scores: { [piCat]: 0.7 }, ci_category_scores: null }),
      makeEntrepreneur({ pi_category_scores: null, ci_category_scores: { [ciCat]: 0.8 } }),
    ];
    const result = computeCorpusMax(es);
    expect(result.pi[piCat]).toBe(0.7);
    expect(result.ci[ciCat]).toBe(0.8);
  });
});

describe("averageScores", () => {
  it("returns an empty object when no entrepreneurs have scores", () => {
    const result = averageScores([makeEntrepreneur()], "pi_category_scores");
    expect(result).toEqual({});
  });

  it("computes the arithmetic mean per category", () => {
    const cat = PI_CANONICAL_CATEGORIES[0];
    const es = [
      makeEntrepreneur({ pi_category_scores: { [cat]: 0.2 } }),
      makeEntrepreneur({ pi_category_scores: { [cat]: 0.4 } }),
      makeEntrepreneur({ pi_category_scores: { [cat]: 0.6 } }),
    ];
    expect(averageScores(es, "pi_category_scores")[cat]).toBeCloseTo(0.4);
  });

  it("divides by count per category (sparse data)", () => {
    const catA = PI_CANONICAL_CATEGORIES[0];
    const catB = PI_CANONICAL_CATEGORIES[1];
    const es = [
      makeEntrepreneur({ pi_category_scores: { [catA]: 1.0 } }),
      makeEntrepreneur({ pi_category_scores: { [catA]: 0.5, [catB]: 0.8 } }),
    ];
    const avg = averageScores(es, "pi_category_scores");
    expect(avg[catA]).toBeCloseTo(0.75);
    expect(avg[catB]).toBeCloseTo(0.8);
  });
});

describe("computeAvgPersonalityVector", () => {
  it("returns null for an empty profile list", () => {
    expect(computeAvgPersonalityVector([])).toBeNull();
  });

  it("returns null when no profile has any valid numeric keys", () => {
    expect(
      computeAvgPersonalityVector([
        { personality_vector: null as unknown as Record<string, number> },
      ])
    ).toBeNull();
  });

  it("averages numeric values across profiles", () => {
    const result = computeAvgPersonalityVector([
      { personality_vector: { pv_01: 0.2, pv_02: 0.4 } },
      { personality_vector: { pv_01: 0.4, pv_02: 0.8 } },
    ]);
    expect(result?.pv_01).toBeCloseTo(0.3);
    expect(result?.pv_02).toBeCloseTo(0.6);
  });

  it("skips NaN and non-numeric values", () => {
    const result = computeAvgPersonalityVector([
      { personality_vector: { pv_01: 0.5, pv_02: NaN } },
      { personality_vector: { pv_01: 0.7, pv_02: 1.0 } },
      { personality_vector: { pv_01: "bad" as unknown as number, pv_02: 0.6 } },
    ]);
    expect(result?.pv_01).toBeCloseTo(0.6);
    expect(result?.pv_02).toBeCloseTo(0.8);
  });
});

describe("sanitizePersonalityVector", () => {
  it("returns null for null or undefined input", () => {
    expect(sanitizePersonalityVector(null)).toBeNull();
    expect(sanitizePersonalityVector(undefined)).toBeNull();
  });

  it("returns null when no whitelisted keys are present", () => {
    expect(sanitizePersonalityVector({ unrelated_key: 0.5 })).toBeNull();
  });

  it("accepts all 20 pv_NN keys", () => {
    const raw: Record<string, number> = {};
    for (let i = 1; i <= 20; i++) raw[`pv_${String(i).padStart(2, "0")}`] = 0.5;
    const result = sanitizePersonalityVector(raw);
    expect(result).not.toBeNull();
    expect(Object.keys(result!)).toHaveLength(20);
  });

  it("clamps values above 1 to 1 and below 0 to 0", () => {
    const result = sanitizePersonalityVector({ pv_01: 1.7, pv_02: -0.4, pv_03: 0.5 });
    expect(result?.pv_01).toBe(1);
    expect(result?.pv_02).toBe(0);
    expect(result?.pv_03).toBe(0.5);
  });

  it("drops NaN and non-numeric values", () => {
    const result = sanitizePersonalityVector({
      pv_01: NaN,
      pv_02: "nope" as unknown as number,
      pv_03: 0.42,
    });
    expect(result?.pv_01).toBeUndefined();
    expect(result?.pv_02).toBeUndefined();
    expect(result?.pv_03).toBe(0.42);
  });

  it("ignores unrelated keys outside pv_01–pv_20", () => {
    const result = sanitizePersonalityVector({ pv_01: 0.5, pv_99: 0.9, bogus: 0.2 });
    expect(result?.pv_99).toBeUndefined();
    expect((result as Record<string, number>).bogus).toBeUndefined();
  });
});

describe("countDistinct", () => {
  it("returns 0 when every array is null", () => {
    expect(countDistinct([null, null])).toBe(0);
  });

  it("counts the unique union across arrays", () => {
    expect(countDistinct([["a", "b"], ["b", "c"], null, ["d"]])).toBe(4);
  });

  it("dedupes repeats within a single array", () => {
    expect(countDistinct([["a", "a", "a"]])).toBe(1);
  });
});

describe("computeTraitStats", () => {
  it("computes mean, stddev, min, max per trait index", () => {
    const vectors = [
      [0.2, 0.5],
      [0.4, 0.5],
      [0.6, 0.5],
    ];
    const stats = computeTraitStats(vectors, ["pv_01", "pv_02"]);
    expect(stats[0].key).toBe("pv_01");
    expect(stats[0].mean).toBeCloseTo(0.4);
    expect(stats[0].min).toBe(0.2);
    expect(stats[0].max).toBe(0.6);
    expect(stats[0].stddev).toBeCloseTo(Math.sqrt(0.026666), 2);

    // pv_02 has zero variance
    expect(stats[1].mean).toBe(0.5);
    expect(stats[1].stddev).toBe(0);
    expect(stats[1].min).toBe(0.5);
    expect(stats[1].max).toBe(0.5);
  });

  it("rounds results to 3 decimal places", () => {
    const stats = computeTraitStats([[0.123456], [0.234567]], ["pv_01"]);
    expect(stats[0].mean.toString()).toMatch(/^\d+\.\d{1,3}$/);
  });
});
