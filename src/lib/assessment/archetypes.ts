import type { Archetype, CategoryScore } from "@/lib/schemas/results";

type ArchetypeEntry = {
  name: string;
  tagline: string;
  description: string;
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
    description:
      "You cut through surface noise to locate the actual root cause. This diagnostic instinct is what separates founders who solve the right problem from those who optimize the wrong one.",
    variant: "pi",
  },
  "Information Gathering": {
    name: "The Investigator",
    tagline: "You find the signal that everyone else misses",
    description:
      "You know what to look for and where to look before others realize there's a question worth asking. Founders who gather the right information first make decisions everyone else wishes they'd made.",
    variant: "pi",
  },
  "Constraint Analysis": {
    name: "The Boundary Mapper",
    tagline: "You know exactly where the walls are and how to work within them",
    description:
      "You don't waste energy pushing walls that won't move — you find the hidden doors instead. Knowing your real constraints is the first step to working around them creatively.",
    variant: "pi",
  },
  "Option Generation": {
    name: "The Possibility Engine",
    tagline: "You see ten doors where others see one",
    description:
      "Where others stop at the obvious path, you keep generating alternatives until a better one surfaces. The founders who change industries are always the ones who refused to accept the first answer.",
    variant: "pi",
  },
  "Tradeoff Evaluation": {
    name: "The Weigher",
    tagline: "You hold competing truths in tension until the right choice emerges",
    description:
      "You don't resolve difficult decisions by ignoring half the picture — you sit with the tension long enough to see what others miss. This capacity to hold competing truths is rare and deeply valuable.",
    variant: "pi",
  },
  "Risk Assessment": {
    name: "The Risk Calculator",
    tagline: "You price the downside before placing the bet",
    description:
      "You understand that bold moves are only sustainable when the downside is fully understood. Pricing risk clearly is what lets you take more of it — intelligently.",
    variant: "pi",
  },
  "Decision Architecture": {
    name: "The Architect",
    tagline: "You design the decision, not just make it",
    description:
      "You think about how decisions get made, not just what to decide. Founders who build great companies first build the systems that produce great decisions.",
    variant: "pi",
  },
  "Action Planning": {
    name: "The Operator",
    tagline: "You move while others are still planning",
    description:
      "You translate insight into momentum faster than anyone in the room. The gap between a good idea and a real company is almost always execution — and that's exactly where you live.",
    variant: "pi",
  },
  "People & Stakeholders": {
    name: "The People Reader",
    tagline: "You understand what drives the people around you",
    description:
      "You see past roles and titles to the motivations underneath — and you build strategies that account for real human behavior. Every venture ultimately succeeds or fails on its people.",
    variant: "pi",
  },
  "Communication Strategy": {
    name: "The Translator",
    tagline: "You make the complex feel simple and the urgent feel clear",
    description:
      "You instinctively match the message to the audience and the moment. Founders who can communicate clearly at every level — investors, team, customers — move faster than those who can't.",
    variant: "pi",
  },
  "Emotional & Values Reasoning": {
    name: "The Compass",
    tagline: "You navigate by principles when the map runs out",
    description:
      "When the data runs out and the playbook doesn't apply, you have an internal reference point that holds. Founders with a strong values compass make decisions that hold up over time.",
    variant: "pi",
  },
  "Meta-Cognition": {
    name: "The Philosopher",
    tagline: "You think about how you think",
    description:
      "You don't just reason well — you observe your own reasoning and improve it deliberately. This self-awareness compounds over time into a rare and durable competitive edge.",
    variant: "pi",
  },
  // CI categories (12)
  "Pattern Recognition & Observation": {
    name: "The Pattern Spotter",
    tagline: "You see what everyone else overlooks",
    description:
      "You notice the anomaly before it becomes a trend, and the trend before it becomes obvious. The most transformative ventures begin with someone seeing a pattern the market hasn't named yet.",
    variant: "ci",
  },
  "Information Seeking & Market Research": {
    name: "The Scout",
    tagline: "You map the terrain before anyone knows it's worth exploring",
    description:
      "You gather intelligence systematically and turn raw information into a clear view of the landscape. The founders who enter markets early and win are the ones who did the homework nobody else bothered with.",
    variant: "ci",
  },
  "Reframing & Category Innovation": {
    name: "The Reframer",
    tagline: "You find opportunity where others see obstacles",
    description:
      "You don't accept the way a problem is framed — you question the frame itself and discover entirely new solution spaces. Category-defining companies are almost always built by reframers.",
    variant: "ci",
  },
  "Cross-Domain Connection": {
    name: "The Bridge Builder",
    tagline: "You connect worlds that don't know they need each other",
    description:
      "You pull insights from fields that rarely talk to each other and synthesize something neither could have produced alone. The most original ideas live at the boundaries between disciplines.",
    variant: "ci",
  },
  "Opportunity Articulation": {
    name: "The Opportunity Architect",
    tagline: "You define the future in concrete terms",
    description:
      "You can take a vague intuition about what's possible and make it legible — to investors, to a team, to a market. A well-articulated opportunity is already halfway to a real one.",
    variant: "ci",
  },
  "Customer & Market Insight": {
    name: "The Empathizer",
    tagline: "You feel what the market needs before it asks",
    description:
      "You have an unusual ability to inhabit the perspective of people who aren't you and understand what they actually want versus what they say they want. That's the foundation of every product that truly fits.",
    variant: "ci",
  },
  "Timing & Context Assessment": {
    name: "The Timekeeper",
    tagline: "You know when the moment is right and when to wait",
    description:
      "You read context not just in terms of what's possible, but when it's possible. The same idea that fails in one moment can define an era six months later — and you know the difference.",
    variant: "ci",
  },
  "Validation & Testing Strategy": {
    name: "The Stress Tester",
    tagline: "You find the fatal flaw before it finds you",
    description:
      "You subject your own ideas to rigorous pressure before the market does. The willingness to kill a weak hypothesis quickly is what lets you find and bet on the strong ones.",
    variant: "ci",
  },
  "Risk & Feasibility Evaluation": {
    name: "The Feasibility Analyst",
    tagline: "You distinguish the ambitious from the impossible",
    description:
      "You hold a clear-eyed view of what's actually achievable without losing your appetite for ambitious goals. That rare combination of realism and ambition is what makes ventures both inspiring and executable.",
    variant: "ci",
  },
  "Vision Communication": {
    name: "The Storyteller",
    tagline: "You make people believe in what doesn't exist yet",
    description:
      "You translate an unrealized future into something vivid enough that others can see it, want it, and work toward it. Every company that ever got funded, hired talent, or won customers started with a story.",
    variant: "ci",
  },
  "Creative Confidence & Persistence": {
    name: "The Tenacious Creator",
    tagline: "You keep building when everyone else would quit",
    description:
      "You have an unusual tolerance for the ambiguity and rejection that define the creative process. The founders who change things are almost never the ones with the best first draft — they're the ones who kept going.",
    variant: "ci",
  },
  "Meta-Creative Thinking": {
    name: "The Meta-Creator",
    tagline: "You reflect on your own creative process and sharpen it",
    description:
      "You don't just generate ideas — you study how you generate them and actively improve the process. This recursive creativity compounds over time into a distinctive and formidable creative intelligence.",
    variant: "ci",
  },
};

const RENAISSANCE_ARCHETYPE: Archetype = {
  name: "The Renaissance Builder",
  tagline: "You bring balance where others specialize",
  description:
    "Your reasoning is remarkably consistent across every domain — diagnostic, creative, relational, and strategic. In a world of specialists, you are the rare generalist who can hold the whole picture at once.",
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
    description: entry.description,
    basedOnCategory: best.category,
    variant: entry.variant,
  };
}
