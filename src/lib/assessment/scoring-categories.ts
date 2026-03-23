/**
 * Canonical category arrays for PI and CI radar charts.
 * These define the fixed order and complete set of 12 categories
 * that always appear on the radar chart, regardless of which
 * categories the scoring pipeline detected moves in.
 *
 * Category order:
 *   Index 0 = 12 o'clock, proceeding clockwise at 30° intervals.
 */

export const PI_CANONICAL_CATEGORIES = [
  "Situation Diagnosis",
  "Information Gathering",
  "Constraint Analysis",
  "Option Generation",
  "Tradeoff Evaluation",
  "Risk Assessment",
  "Decision Architecture",
  "Action Planning",
  "People & Stakeholders",
  "Communication Strategy",
  "Emotional & Values Reasoning",
  "Meta-Cognition",
] as const;

export const CI_CANONICAL_CATEGORIES = [
  "Pattern Recognition & Observation",
  "Information Seeking & Market Research",
  "Reframing & Category Innovation",
  "Cross-Domain Connection",
  "Opportunity Articulation",
  "Customer & Market Insight",
  "Timing & Context Assessment",
  "Validation & Testing Strategy",
  "Risk & Feasibility Evaluation",
  "Vision Communication",
  "Creative Confidence & Persistence",
  "Meta-Creative Thinking",
] as const;

export type PICategory = (typeof PI_CANONICAL_CATEGORIES)[number];
export type CICategory = (typeof CI_CANONICAL_CATEGORIES)[number];

/**
 * Interpolate a missing score by walking outward in both directions
 * from the missing index until a scored neighbor is found on each side.
 * Returns the average of the two nearest scored neighbors.
 *
 * If multiple consecutive categories are missing, all get the same
 * averaged value (plateau) because they share the same nearest neighbors.
 */
export function interpolateFromNeighbors(
  index: number,
  scoredMap: Map<number, number>,
  length: number
): number {
  let leftValue: number | undefined;
  let rightValue: number | undefined;

  for (let distance = 1; distance <= length; distance++) {
    if (leftValue === undefined) {
      const leftIdx = (index - distance + length) % length;
      if (scoredMap.has(leftIdx)) leftValue = scoredMap.get(leftIdx)!;
    }
    if (rightValue === undefined) {
      const rightIdx = (index + distance) % length;
      if (scoredMap.has(rightIdx)) rightValue = scoredMap.get(rightIdx)!;
    }
    if (leftValue !== undefined && rightValue !== undefined) {
      return (leftValue + rightValue) / 2;
    }
  }

  if (leftValue !== undefined) return leftValue;
  if (rightValue !== undefined) return rightValue;
  return 0;
}
