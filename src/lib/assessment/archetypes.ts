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
  // PI categories
  "Diagnosing the Situation": {
    name: "The Diagnostician",
    tagline: "You see the real problem before anyone else does",
    variant: "pi",
  },
  "Reasoning Through Options": {
    name: "The Systems Thinker",
    tagline: "You map every path before choosing one",
    variant: "pi",
  },
  "Taking Action": {
    name: "The Operator",
    tagline: "You move while others are still planning",
    variant: "pi",
  },
  "People & Relationships": {
    name: "The People Reader",
    tagline: "You understand what drives the people around you",
    variant: "pi",
  },
  "Meta-Reasoning": {
    name: "The Philosopher",
    tagline: "You think about how you think",
    variant: "pi",
  },
  // CI categories
  "Observing and Noticing": {
    name: "The Pattern Spotter",
    tagline: "You see what everyone else overlooks",
    variant: "ci",
  },
  "Reframing and Connecting": {
    name: "The Reframer",
    tagline: "You find opportunity where others see obstacles",
    variant: "ci",
  },
  "Articulating the Opportunity": {
    name: "The Opportunity Architect",
    tagline: "You define the future in concrete terms",
    variant: "ci",
  },
  "Evaluating and Stress-Testing": {
    name: "The Stress Tester",
    tagline: "You find the fatal flaw before it finds you",
    variant: "ci",
  },
  "Communicating the Vision": {
    name: "The Storyteller",
    tagline: "You make people believe in what doesn't exist yet",
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
 * Derives the archetype from the 10 category percentiles (5 PI + 5 CI).
 *
 * Rules:
 * 1. If all 10 categories are within 10 percentile points of each other,
 *    return "The Renaissance Builder".
 * 2. Otherwise, pick the category with the highest percentile.
 * 3. Tie-break: prefer PI categories, then by CATEGORY_ORDER.
 */
export function deriveArchetype(
  piCategories: CategoryScore[],
  ciCategories: CategoryScore[]
): Archetype {
  const all = [...piCategories, ...ciCategories];
  if (all.length === 0) return RENAISSANCE_ARCHETYPE;

  const percentiles = all.map((c) => c.percentile);
  const spread = Math.max(...percentiles) - Math.min(...percentiles);

  if (spread <= RENAISSANCE_THRESHOLD) {
    return RENAISSANCE_ARCHETYPE;
  }

  // Sort by percentile desc, then by category order for deterministic tie-breaking
  const sorted = [...all].sort((a, b) => {
    if (b.percentile !== a.percentile) return b.percentile - a.percentile;
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
