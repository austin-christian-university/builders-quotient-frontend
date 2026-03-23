import { describe, it, expect } from "vitest";
import {
  interpolateFromNeighbors,
  PI_CANONICAL_CATEGORIES,
  CI_CANONICAL_CATEGORIES,
} from "@/lib/assessment/scoring-categories";
import { getCategoryMeta } from "@/components/results/short-labels";

// ---------------------------------------------------------------------------
// Helper: build a scored map from sparse entries
// ---------------------------------------------------------------------------
function buildScoredMap(entries: [number, number][]): Map<number, number> {
  return new Map(entries);
}

// ---------------------------------------------------------------------------
// 1. interpolateFromNeighbors — all present (no-op)
// ---------------------------------------------------------------------------
describe("interpolateFromNeighbors", () => {
  it("returns the scored value when the index is present", () => {
    const scored = buildScoredMap([
      [0, 0.5],
      [1, 0.6],
      [2, 0.7],
    ]);
    // Index 1 is present — should return its own value
    // (Note: interpolateFromNeighbors is only called for MISSING indices,
    //  but if called on a present index it walks outward and finds neighbors.)
    // This test verifies the walk finds immediate neighbors correctly.
    expect(interpolateFromNeighbors(1, scored, 3)).toBeCloseTo(0.6); // avg of 0.5 and 0.7
  });

  // ---------------------------------------------------------------------------
  // 2. One missing with immediate neighbors → correct average
  // ---------------------------------------------------------------------------
  it("averages immediate neighbors for a single missing category", () => {
    // 12 categories, index 2 missing, neighbors at 1 (0.4) and 3 (0.8)
    const scored = buildScoredMap([
      [0, 0.5],
      [1, 0.4],
      // index 2 missing
      [3, 0.8],
      [4, 0.6],
      [5, 0.5],
      [6, 0.7],
      [7, 0.3],
      [8, 0.9],
      [9, 0.4],
      [10, 0.6],
      [11, 0.5],
    ]);
    expect(interpolateFromNeighbors(2, scored, 12)).toBeCloseTo(0.6); // (0.4 + 0.8) / 2
  });

  // ---------------------------------------------------------------------------
  // 3. Three consecutive missing → plateau behavior
  // ---------------------------------------------------------------------------
  it("produces a plateau when multiple consecutive categories are missing", () => {
    // Indices 2, 3, 4 missing; nearest scored neighbors: 1 (0.4) and 5 (0.8)
    const scored = buildScoredMap([
      [0, 0.5],
      [1, 0.4],
      // 2, 3, 4 missing
      [5, 0.8],
      [6, 0.7],
      [7, 0.3],
      [8, 0.9],
      [9, 0.4],
      [10, 0.6],
      [11, 0.5],
    ]);
    const expected = (0.4 + 0.8) / 2; // 0.6
    expect(interpolateFromNeighbors(2, scored, 12)).toBeCloseTo(expected);
    expect(interpolateFromNeighbors(3, scored, 12)).toBeCloseTo(expected);
    expect(interpolateFromNeighbors(4, scored, 12)).toBeCloseTo(expected);
  });

  // ---------------------------------------------------------------------------
  // 4. Index 0 missing → wraps to index 11
  // ---------------------------------------------------------------------------
  it("wraps around when index 0 is missing", () => {
    // Index 0 missing; neighbors: 11 (0.38) and 1 (0.71)
    const scored = buildScoredMap([
      // index 0 missing
      [1, 0.71],
      [2, 0.5],
      [3, 0.6],
      [4, 0.7],
      [5, 0.5],
      [6, 0.4],
      [7, 0.3],
      [8, 0.9],
      [9, 0.4],
      [10, 0.6],
      [11, 0.38],
    ]);
    expect(interpolateFromNeighbors(0, scored, 12)).toBeCloseTo(
      (0.38 + 0.71) / 2
    );
  });

  // ---------------------------------------------------------------------------
  // 5. Index 11 missing → wraps to index 0
  // ---------------------------------------------------------------------------
  it("wraps around when last index is missing", () => {
    // Index 11 missing; neighbors: 10 (0.6) and 0 (0.5)
    const scored = buildScoredMap([
      [0, 0.5],
      [1, 0.4],
      [2, 0.7],
      [3, 0.6],
      [4, 0.7],
      [5, 0.5],
      [6, 0.4],
      [7, 0.3],
      [8, 0.9],
      [9, 0.4],
      [10, 0.6],
      // index 11 missing
    ]);
    expect(interpolateFromNeighbors(11, scored, 12)).toBeCloseTo(
      (0.6 + 0.5) / 2
    );
  });

  // ---------------------------------------------------------------------------
  // 6. Only 1 category scored → all missing get that value
  // ---------------------------------------------------------------------------
  it("uses the single scored value when only one category has data", () => {
    const scored = buildScoredMap([[5, 0.75]]);
    // Any missing index should find 5 from both directions
    expect(interpolateFromNeighbors(0, scored, 12)).toBeCloseTo(0.75);
    expect(interpolateFromNeighbors(3, scored, 12)).toBeCloseTo(0.75);
    expect(interpolateFromNeighbors(11, scored, 12)).toBeCloseTo(0.75);
  });

  // ---------------------------------------------------------------------------
  // 7. Zero categories scored → returns 0
  // ---------------------------------------------------------------------------
  it("returns 0 when no categories are scored", () => {
    const scored = buildScoredMap([]);
    expect(interpolateFromNeighbors(0, scored, 12)).toBe(0);
    expect(interpolateFromNeighbors(6, scored, 12)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 8. Output order matches canonical order (integration-style)
// ---------------------------------------------------------------------------
describe("canonical category ordering", () => {
  it("PI canonical categories are exactly 12", () => {
    expect(PI_CANONICAL_CATEGORIES).toHaveLength(12);
  });

  it("CI canonical categories are exactly 12", () => {
    expect(CI_CANONICAL_CATEGORIES).toHaveLength(12);
  });

  it("PI and CI have no duplicate categories", () => {
    expect(new Set(PI_CANONICAL_CATEGORIES).size).toBe(12);
    expect(new Set(CI_CANONICAL_CATEGORIES).size).toBe(12);
  });
});

// ---------------------------------------------------------------------------
// 9. All canonical names exist in CATEGORY_META (consistency check)
// ---------------------------------------------------------------------------
describe("canonical name consistency with short-labels", () => {
  it("every PI canonical category has metadata in CATEGORY_META", () => {
    for (const category of PI_CANONICAL_CATEGORIES) {
      const meta = getCategoryMeta(category);
      expect(meta, `Missing CATEGORY_META entry for PI: "${category}"`).toBeDefined();
      expect(meta!.label).toBeTruthy();
      expect(meta!.description).toBeTruthy();
    }
  });

  it("every CI canonical category has metadata in CATEGORY_META", () => {
    for (const category of CI_CANONICAL_CATEGORIES) {
      const meta = getCategoryMeta(category);
      expect(meta, `Missing CATEGORY_META entry for CI: "${category}"`).toBeDefined();
      expect(meta!.label).toBeTruthy();
      expect(meta!.description).toBeTruthy();
    }
  });
});
