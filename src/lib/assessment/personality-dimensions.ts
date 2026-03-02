/**
 * Personality Vector dimensions (20 traits, 5 categories).
 * Mirrors Python's PERSONALITY_DIMENSION_NAMES and PERSONALITY_DIMENSION_CATEGORIES
 * from triarchic-databank/src/models/personality_schemas.py.
 */

export const PERSONALITY_DIMENSION_NAMES: Record<string, string> = {
  // Energy & Dynamism
  pv_01: "Overall energy level",
  pv_02: "Speaking pace/tempo",
  pv_03: "Physical expressiveness",
  pv_04: "Vocal dynamism",
  // Confidence & Authority
  pv_05: "Projected confidence",
  pv_06: "Composure under pressure",
  pv_07: "Decisiveness in speech",
  pv_08: "Physical presence/command",
  // Warmth & Interpersonal Style
  pv_09: "Warmth and approachability",
  pv_10: "Humor and playfulness",
  pv_11: "Active listening signals",
  pv_12: "Empathy expression",
  // Communication Style
  pv_13: "Storytelling orientation",
  pv_14: "Analytical precision",
  pv_15: "Passion/conviction intensity",
  pv_16: "Conciseness vs elaboration",
  // Self-Presentation & Authenticity
  pv_17: "Formality level",
  pv_18: "Vulnerability display",
  pv_19: "Intensity/seriousness",
  pv_20: "Adaptability in interaction",
};

export const PERSONALITY_DIMENSION_KEYS = Object.keys(
  PERSONALITY_DIMENSION_NAMES,
);

export const PERSONALITY_DIMENSION_CATEGORIES: Record<string, string[]> = {
  "Energy & Dynamism": ["pv_01", "pv_02", "pv_03", "pv_04"],
  "Confidence & Authority": ["pv_05", "pv_06", "pv_07", "pv_08"],
  "Warmth & Interpersonal": ["pv_09", "pv_10", "pv_11", "pv_12"],
  "Communication Style": ["pv_13", "pv_14", "pv_15", "pv_16"],
  "Self-Presentation": ["pv_17", "pv_18", "pv_19", "pv_20"],
};

export type PersonalityVector = Record<string, number>;

/** Average a 20-dimension personality vector down to 5 category means. */
export function averageByCategory(
  vector: PersonalityVector,
): { category: string; value: number }[] {
  return Object.entries(PERSONALITY_DIMENSION_CATEGORIES).map(
    ([category, keys]) => {
      const values = keys
        .map((k) => vector[k])
        .filter((v) => v !== undefined && v !== null);
      const mean =
        values.length > 0
          ? values.reduce((sum, v) => sum + v, 0) / values.length
          : 0;
      return { category, value: Math.round(mean * 100) / 100 };
    },
  );
}
