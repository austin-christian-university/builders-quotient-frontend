import type { EntrepreneurSummary, CorpusMaxScores } from "@/lib/schemas/entrepreneurs";
import {
  PI_CANONICAL_CATEGORIES,
  CI_CANONICAL_CATEGORIES,
} from "@/lib/assessment/scoring-categories";

/** Compute per-category max across all entrepreneurs for radar chart scaling. */
export function computeCorpusMax(entrepreneurs: EntrepreneurSummary[]): CorpusMaxScores {
  const piMax: Record<string, number> = {};
  const ciMax: Record<string, number> = {};

  for (const cat of PI_CANONICAL_CATEGORIES) {
    piMax[cat] = 0;
  }
  for (const cat of CI_CANONICAL_CATEGORIES) {
    ciMax[cat] = 0;
  }

  for (const e of entrepreneurs) {
    if (e.pi_category_scores) {
      for (const [cat, val] of Object.entries(e.pi_category_scores)) {
        if (val > (piMax[cat] ?? 0)) piMax[cat] = val;
      }
    }
    if (e.ci_category_scores) {
      for (const [cat, val] of Object.entries(e.ci_category_scores)) {
        if (val > (ciMax[cat] ?? 0)) ciMax[cat] = val;
      }
    }
  }

  return { pi: piMax, ci: ciMax };
}

/** Average category scores across a set of entrepreneurs. */
export function averageScores(
  entrepreneurs: EntrepreneurSummary[],
  field: "pi_category_scores" | "ci_category_scores"
): Record<string, number> {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const e of entrepreneurs) {
    const scores = e[field];
    if (!scores) continue;
    for (const [cat, val] of Object.entries(scores)) {
      sums[cat] = (sums[cat] ?? 0) + val;
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
  }

  const avg: Record<string, number> = {};
  for (const cat of Object.keys(sums)) {
    avg[cat] = sums[cat] / counts[cat];
  }
  return avg;
}

/** Average personality vectors across all entrepreneurs for corpus comparison. */
export function computeAvgPersonalityVector(
  profiles: { personality_vector: Record<string, number> }[]
): Record<string, number> | null {
  if (profiles.length === 0) return null;

  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const profile of profiles) {
    if (!profile.personality_vector) continue;
    for (const [key, val] of Object.entries(profile.personality_vector)) {
      if (typeof val !== "number" || isNaN(val)) continue;
      sums[key] = (sums[key] ?? 0) + val;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }

  if (Object.keys(sums).length === 0) return null;

  const avg: Record<string, number> = {};
  for (const key of Object.keys(sums)) {
    avg[key] = sums[key] / counts[key];
  }
  return avg;
}

/** Whitelist pv_01–pv_20 keys and clamp values to 0–1. */
export function sanitizePersonalityVector(
  raw: Record<string, number> | null | undefined
): Record<string, number> | null {
  if (!raw) return null;
  const VALID_KEYS = Array.from({ length: 20 }, (_, i) => `pv_${String(i + 1).padStart(2, "0")}`);
  const result: Record<string, number> = {};
  for (const key of VALID_KEYS) {
    const val = raw[key];
    if (typeof val === "number" && !isNaN(val)) {
      result[key] = Math.max(0, Math.min(1, val));
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

/** Count distinct values from an array-of-arrays. */
export function countDistinct(arrays: (string[] | null)[]): number {
  const set = new Set<string>();
  for (const arr of arrays) {
    if (!arr) continue;
    for (const v of arr) set.add(v);
  }
  return set.size;
}

/** Compute per-trait stats (mean, stddev, min, max) from a matrix of vectors. */
export function computeTraitStats(
  vectors: number[][],
  keys: string[]
): { key: string; mean: number; stddev: number; min: number; max: number }[] {
  return keys.map((key, idx) => {
    const values = vectors.map((v) => v[idx]);
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    return {
      key,
      mean: Math.round(mean * 1000) / 1000,
      stddev: Math.round(Math.sqrt(variance) * 1000) / 1000,
      min: Math.round(Math.min(...values) * 1000) / 1000,
      max: Math.round(Math.max(...values) * 1000) / 1000,
    };
  });
}
