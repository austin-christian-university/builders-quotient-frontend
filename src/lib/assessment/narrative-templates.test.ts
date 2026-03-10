import { describe, it, expect } from "vitest";
import {
  PI_TEMPLATES,
  CI_TEMPLATES,
  COMMUNICATION_TEMPLATES,
  PERSONALITY_TEMPLATES,
  getIntelligenceNarrative,
  getCommunicationNarrative,
  getPersonalityNarrative,
} from "./narrative-templates";
import type { CategoryScore, PersonalityFacetScore } from "@/lib/schemas/results";

// --- Category name constants (source of truth for expected template keys) ---

const PI_CATEGORIES = [
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
];

const CI_CATEGORIES = [
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
];

const COMMUNICATION_META_CATEGORIES = [
  "Energy & Dynamism",
  "Confidence & Authority",
  "Warmth & Interpersonal",
  "Communication Style",
  "Self-Presentation",
];

const PERSONALITY_FACETS = [
  "Ambition",
  "Risk Tolerance",
  "Innovativeness",
  "Autonomy",
  "Self-Efficacy",
  "Stress Tolerance",
  "Internal Locus of Control",
  "Grit",
];

// --- Helpers ---

function makeCategoryScore(category: string, score: number): CategoryScore {
  return {
    category,
    score,
    movesMatched: 5,
    movesScored: 10,
    movesMissed: 5,
    movesExcluded: 0,
  };
}

function makeFacetScore(
  facet: string,
  label: string,
  rescaledScore: number,
): PersonalityFacetScore {
  return { facet, label, rescaledScore, itemCount: 12 };
}

// --- Template completeness tests ---

describe("PI_TEMPLATES", () => {
  it("has entries for all 12 PI categories", () => {
    for (const cat of PI_CATEGORIES) {
      expect(PI_TEMPLATES[cat]).toBeDefined();
    }
  });

  it("each entry has non-empty strength and growth strings", () => {
    for (const cat of PI_CATEGORIES) {
      const entry = PI_TEMPLATES[cat];
      expect(entry.strength).toBeTruthy();
      expect(entry.growth).toBeTruthy();
      expect(typeof entry.strength).toBe("string");
      expect(typeof entry.growth).toBe("string");
      expect(entry.strength.length).toBeGreaterThan(10);
      expect(entry.growth.length).toBeGreaterThan(10);
    }
  });
});

describe("CI_TEMPLATES", () => {
  it("has entries for all 12 CI categories", () => {
    for (const cat of CI_CATEGORIES) {
      expect(CI_TEMPLATES[cat]).toBeDefined();
    }
  });

  it("each entry has non-empty strength and growth strings", () => {
    for (const cat of CI_CATEGORIES) {
      const entry = CI_TEMPLATES[cat];
      expect(entry.strength).toBeTruthy();
      expect(entry.growth).toBeTruthy();
      expect(typeof entry.strength).toBe("string");
      expect(typeof entry.growth).toBe("string");
      expect(entry.strength.length).toBeGreaterThan(10);
      expect(entry.growth.length).toBeGreaterThan(10);
    }
  });
});

describe("COMMUNICATION_TEMPLATES", () => {
  it("has entries for all 5 meta-categories", () => {
    for (const cat of COMMUNICATION_META_CATEGORIES) {
      expect(COMMUNICATION_TEMPLATES[cat]).toBeDefined();
    }
  });

  it("each entry has non-empty strength and growth strings", () => {
    for (const cat of COMMUNICATION_META_CATEGORIES) {
      const entry = COMMUNICATION_TEMPLATES[cat];
      expect(entry.strength).toBeTruthy();
      expect(entry.growth).toBeTruthy();
      expect(typeof entry.strength).toBe("string");
      expect(typeof entry.growth).toBe("string");
      expect(entry.strength.length).toBeGreaterThan(10);
      expect(entry.growth.length).toBeGreaterThan(10);
    }
  });
});

describe("PERSONALITY_TEMPLATES", () => {
  it("has entries for all 8 facets", () => {
    for (const facet of PERSONALITY_FACETS) {
      expect(PERSONALITY_TEMPLATES[facet]).toBeDefined();
    }
  });

  it("each entry has non-empty strength and growth strings", () => {
    for (const facet of PERSONALITY_FACETS) {
      const entry = PERSONALITY_TEMPLATES[facet];
      expect(entry.strength).toBeTruthy();
      expect(entry.growth).toBeTruthy();
      expect(typeof entry.strength).toBe("string");
      expect(typeof entry.growth).toBe("string");
      expect(entry.strength.length).toBeGreaterThan(10);
      expect(entry.growth.length).toBeGreaterThan(10);
    }
  });
});

// --- Selection function tests ---

describe("getIntelligenceNarrative", () => {
  it("returns top 3-4 strengths and bottom 2-3 growth from combined PI + CI", () => {
    // Create PI categories scored 90 down to 46 (decreasing by 4)
    const piCategories = PI_CATEGORIES.map((cat, i) =>
      makeCategoryScore(cat, 90 - i * 4),
    );
    // Create CI categories scored 85 down to 41 (decreasing by 4)
    const ciCategories = CI_CATEGORIES.map((cat, i) =>
      makeCategoryScore(cat, 85 - i * 4),
    );

    const result = getIntelligenceNarrative(piCategories, ciCategories);

    // Should have blocks
    expect(result.length).toBeGreaterThan(0);

    const strengths = result.filter((b) => b.type === "strength");
    const growth = result.filter((b) => b.type === "growth");

    // Top 3-4 categories should be strengths
    expect(strengths.length).toBeGreaterThanOrEqual(3);
    expect(strengths.length).toBeLessThanOrEqual(4);

    // Bottom 2-3 should be growth
    expect(growth.length).toBeGreaterThanOrEqual(2);
    expect(growth.length).toBeLessThanOrEqual(3);

    // Verify strength blocks are from the highest-scoring categories
    const allSorted = [...piCategories, ...ciCategories].sort(
      (a, b) => b.score - a.score,
    );
    for (const s of strengths) {
      // Each strength category should be in the top portion
      const idx = allSorted.findIndex((c) => c.category === s.category);
      expect(idx).toBeLessThan(strengths.length);
    }

    // Verify growth blocks are from the lowest-scoring categories
    const bottomSorted = [...allSorted].reverse();
    for (const g of growth) {
      const idx = bottomSorted.findIndex((c) => c.category === g.category);
      expect(idx).toBeLessThan(growth.length);
    }

    // Each block has non-empty text
    for (const block of result) {
      expect(block.text.length).toBeGreaterThan(0);
      expect(block.category.length).toBeGreaterThan(0);
    }
  });

  it("returns empty array when both inputs are empty", () => {
    const result = getIntelligenceNarrative([], []);
    expect(result).toEqual([]);
  });

  it("handles only PI categories (no CI)", () => {
    const piCategories = PI_CATEGORIES.map((cat, i) =>
      makeCategoryScore(cat, 90 - i * 5),
    );
    const result = getIntelligenceNarrative(piCategories, []);
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles only CI categories (no PI)", () => {
    const ciCategories = CI_CATEGORIES.map((cat, i) =>
      makeCategoryScore(cat, 90 - i * 5),
    );
    const result = getIntelligenceNarrative([], ciCategories);
    expect(result.length).toBeGreaterThan(0);
  });

  it("skips categories without template entries (graceful degradation)", () => {
    const categories = [
      makeCategoryScore("Nonexistent Category", 95),
      makeCategoryScore("Another Fake", 10),
      ...PI_CATEGORIES.slice(0, 4).map((cat, i) =>
        makeCategoryScore(cat, 80 - i * 10),
      ),
    ];
    const result = getIntelligenceNarrative(categories, []);

    // Should not contain blocks for nonexistent categories
    const categoryNames = result.map((b) => b.category);
    expect(categoryNames).not.toContain("Nonexistent Category");
    expect(categoryNames).not.toContain("Another Fake");
  });
});

describe("getCommunicationNarrative", () => {
  it("returns top 2 strengths and bottom 1-2 growth from 5 meta-categories", () => {
    // Create a 20-dimension profile with varying values per category
    const profile = [
      // Energy & Dynamism (pv_01-04): high values
      { category: "pv_01", value: 0.9 },
      { category: "pv_02", value: 0.85 },
      { category: "pv_03", value: 0.88 },
      { category: "pv_04", value: 0.92 },
      // Confidence & Authority (pv_05-08): medium-high
      { category: "pv_05", value: 0.75 },
      { category: "pv_06", value: 0.7 },
      { category: "pv_07", value: 0.72 },
      { category: "pv_08", value: 0.68 },
      // Warmth & Interpersonal (pv_09-12): medium
      { category: "pv_09", value: 0.55 },
      { category: "pv_10", value: 0.5 },
      { category: "pv_11", value: 0.52 },
      { category: "pv_12", value: 0.58 },
      // Communication Style (pv_13-16): low
      { category: "pv_13", value: 0.35 },
      { category: "pv_14", value: 0.3 },
      { category: "pv_15", value: 0.32 },
      { category: "pv_16", value: 0.28 },
      // Self-Presentation (pv_17-20): lowest
      { category: "pv_17", value: 0.2 },
      { category: "pv_18", value: 0.15 },
      { category: "pv_19", value: 0.18 },
      { category: "pv_20", value: 0.22 },
    ];

    const result = getCommunicationNarrative(profile);

    const strengths = result.filter((b) => b.type === "strength");
    const growth = result.filter((b) => b.type === "growth");

    expect(strengths.length).toBe(2);
    expect(growth.length).toBeGreaterThanOrEqual(1);
    expect(growth.length).toBeLessThanOrEqual(2);

    // Top 2 should be Energy & Dynamism and Confidence & Authority
    const strengthCategories = strengths.map((b) => b.category);
    expect(strengthCategories).toContain("Energy & Dynamism");
    expect(strengthCategories).toContain("Confidence & Authority");

    // Each block has non-empty text
    for (const block of result) {
      expect(block.text.length).toBeGreaterThan(0);
    }
  });

  it("returns empty array when input is empty", () => {
    const result = getCommunicationNarrative([]);
    expect(result).toEqual([]);
  });
});

describe("getPersonalityNarrative", () => {
  it("returns 2 strengths and 1-2 growth areas", () => {
    const facetScores: PersonalityFacetScore[] = [
      makeFacetScore("AM", "Ambition", 90),
      makeFacetScore("RT", "Risk Tolerance", 75),
      makeFacetScore("IN", "Innovativeness", 85),
      makeFacetScore("AU", "Autonomy", 60),
      makeFacetScore("SE", "Self-Efficacy", 55),
      makeFacetScore("ST", "Stress Tolerance", 40),
      makeFacetScore("IL", "Internal Locus of Control", 35),
      makeFacetScore("GR", "Grit", 70),
    ];

    const result = getPersonalityNarrative(facetScores);

    const strengths = result.filter((b) => b.type === "strength");
    const growth = result.filter((b) => b.type === "growth");

    expect(strengths.length).toBe(2);
    expect(growth.length).toBeGreaterThanOrEqual(1);
    expect(growth.length).toBeLessThanOrEqual(2);

    // Top 2 by rescaledScore: Ambition (90) and Innovativeness (85)
    const strengthLabels = strengths.map((b) => b.category);
    expect(strengthLabels).toContain("Ambition");
    expect(strengthLabels).toContain("Innovativeness");

    // Bottom by rescaledScore: Internal Locus of Control (35) and Stress Tolerance (40)
    const growthLabels = growth.map((b) => b.category);
    expect(growthLabels).toContain("Internal Locus of Control");

    // Each block has non-empty text
    for (const block of result) {
      expect(block.text.length).toBeGreaterThan(0);
    }
  });

  it("returns empty array when input is empty", () => {
    const result = getPersonalityNarrative([]);
    expect(result).toEqual([]);
  });

  it("skips Attention Checks facet", () => {
    const facetScores: PersonalityFacetScore[] = [
      makeFacetScore("AM", "Ambition", 90),
      makeFacetScore("RT", "Risk Tolerance", 75),
      makeFacetScore("IN", "Innovativeness", 85),
      makeFacetScore("AU", "Autonomy", 60),
      makeFacetScore("SE", "Self-Efficacy", 55),
      makeFacetScore("ST", "Stress Tolerance", 40),
      makeFacetScore("IL", "Internal Locus of Control", 35),
      makeFacetScore("GR", "Grit", 70),
      makeFacetScore("AC", "Attention Checks", 100),
    ];

    const result = getPersonalityNarrative(facetScores);
    const categories = result.map((b) => b.category);
    expect(categories).not.toContain("Attention Checks");
  });

  it("handles fewer than 3 facets gracefully", () => {
    const facetScores: PersonalityFacetScore[] = [
      makeFacetScore("AM", "Ambition", 90),
      makeFacetScore("GR", "Grit", 30),
    ];

    const result = getPersonalityNarrative(facetScores);

    const strengths = result.filter((b) => b.type === "strength");
    const growth = result.filter((b) => b.type === "growth");

    // With only 2 facets, should get at most 1 strength and 1 growth
    expect(strengths.length).toBeGreaterThanOrEqual(1);
    expect(growth.length).toBeGreaterThanOrEqual(1);
  });
});
