import type { Archetype, CategoryScore } from "@/lib/schemas/results";

type ArchetypeEntry = {
  name: string;
  tagline: string;
  variant: "pi" | "ci";
};

/**
 * Ordered lookup: PI categories first, then CI.
 * Order matters for tie-breaking (prefer PI, then by listed order).
 */
const ARCHETYPE_MAP: Record<string, ArchetypeEntry> = {
  // PI categories (12)
  "Situation Diagnosis": {
    name: "The Diagnostician",
    tagline: "You see the real problem before anyone else does",
    variant: "pi",
  },
  "Information Gathering": {
    name: "The Investigator",
    tagline: "You find the signal that everyone else misses",
    variant: "pi",
  },
  "Constraint Analysis": {
    name: "The Boundary Mapper",
    tagline: "You know exactly where the walls are and how to work within them",
    variant: "pi",
  },
  "Option Generation": {
    name: "The Possibility Engine",
    tagline: "You see ten doors where others see one",
    variant: "pi",
  },
  "Tradeoff Evaluation": {
    name: "The Weigher",
    tagline: "You hold competing truths in tension until the right choice emerges",
    variant: "pi",
  },
  "Risk Assessment": {
    name: "The Risk Calculator",
    tagline: "You price the downside before placing the bet",
    variant: "pi",
  },
  "Decision Architecture": {
    name: "The Architect",
    tagline: "You design the decision, not just make it",
    variant: "pi",
  },
  "Action Planning": {
    name: "The Operator",
    tagline: "You move while others are still planning",
    variant: "pi",
  },
  "People & Stakeholders": {
    name: "The People Reader",
    tagline: "You understand what drives the people around you",
    variant: "pi",
  },
  "Communication Strategy": {
    name: "The Translator",
    tagline: "You make the complex feel simple and the urgent feel clear",
    variant: "pi",
  },
  "Emotional & Values Reasoning": {
    name: "The Compass",
    tagline: "You navigate by principles when the map runs out",
    variant: "pi",
  },
  "Meta-Cognition": {
    name: "The Philosopher",
    tagline: "You think about how you think",
    variant: "pi",
  },
  // CI categories (12)
  "Pattern Recognition & Observation": {
    name: "The Pattern Spotter",
    tagline: "You see what everyone else overlooks",
    variant: "ci",
  },
  "Information Seeking & Market Research": {
    name: "The Scout",
    tagline: "You map the terrain before anyone knows it's worth exploring",
    variant: "ci",
  },
  "Reframing & Category Innovation": {
    name: "The Reframer",
    tagline: "You find opportunity where others see obstacles",
    variant: "ci",
  },
  "Cross-Domain Connection": {
    name: "The Bridge Builder",
    tagline: "You connect worlds that don't know they need each other",
    variant: "ci",
  },
  "Opportunity Articulation": {
    name: "The Opportunity Architect",
    tagline: "You define the future in concrete terms",
    variant: "ci",
  },
  "Customer & Market Insight": {
    name: "The Empathizer",
    tagline: "You feel what the market needs before it asks",
    variant: "ci",
  },
  "Timing & Context Assessment": {
    name: "The Timekeeper",
    tagline: "You know when the moment is right and when to wait",
    variant: "ci",
  },
  "Validation & Testing Strategy": {
    name: "The Stress Tester",
    tagline: "You find the fatal flaw before it finds you",
    variant: "ci",
  },
  "Risk & Feasibility Evaluation": {
    name: "The Feasibility Analyst",
    tagline: "You distinguish the ambitious from the impossible",
    variant: "ci",
  },
  "Vision Communication": {
    name: "The Storyteller",
    tagline: "You make people believe in what doesn't exist yet",
    variant: "ci",
  },
  "Creative Confidence & Persistence": {
    name: "The Tenacious Creator",
    tagline: "You keep building when everyone else would quit",
    variant: "ci",
  },
  "Meta-Creative Thinking": {
    name: "The Meta-Creator",
    tagline: "You reflect on your own creative process and sharpen it",
    variant: "ci",
  },
};

const RENAISSANCE_ARCHETYPE: Archetype = {
  name: "The Renaissance Builder",
  tagline: "You bring balance where others specialize",
  basedOnCategory: "All categories",
  variant: "pi",
};

/** Category order for deterministic tie-breaking (PI first, then CI). */
const CATEGORY_ORDER = Object.keys(ARCHETYPE_MAP);

const RENAISSANCE_THRESHOLD = 10;

/**
 * Derives the archetype from the 24 category scores (12 PI + 12 CI).
 *
 * Rules:
 * 1. If all categories are within 10 score points of each other,
 *    return "The Renaissance Builder".
 * 2. Otherwise, pick the category with the highest score.
 * 3. Tie-break: prefer PI categories, then by CATEGORY_ORDER.
 */
export function deriveArchetype(
  piCategories: CategoryScore[],
  ciCategories: CategoryScore[]
): Archetype {
  const all = [...piCategories, ...ciCategories];
  if (all.length === 0) return RENAISSANCE_ARCHETYPE;

  const scores = all.map((c) => c.score);
  const spread = Math.max(...scores) - Math.min(...scores);

  if (spread <= RENAISSANCE_THRESHOLD) {
    return RENAISSANCE_ARCHETYPE;
  }

  // Sort by score desc, then by category order for deterministic tie-breaking
  const sorted = [...all].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const aIdx = CATEGORY_ORDER.indexOf(a.category);
    const bIdx = CATEGORY_ORDER.indexOf(b.category);
    return aIdx - bIdx;
  });

  const best = sorted[0];
  const entry = ARCHETYPE_MAP[best.category];

  if (!entry) return RENAISSANCE_ARCHETYPE;

  return {
    name: entry.name,
    tagline: entry.tagline,
    basedOnCategory: best.category,
    variant: entry.variant,
  };
}
