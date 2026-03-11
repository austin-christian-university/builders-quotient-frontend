import { describe, it, expect } from "vitest";
import {
  narrativeBlockSchema,
  corpusAverageCategorySchema,
  corpusAverageSchema,
  matchRunnerUpSchema,
  reasoningMatchSchema,
  communicationMatchSchema,
  resultsPageDataSchema,
} from "./results";

// --- narrativeBlockSchema ---

describe("narrativeBlockSchema", () => {
  it("validates a strength block", () => {
    const result = narrativeBlockSchema.safeParse({
      category: "Decision Architecture",
      type: "strength",
      text: "You excel at breaking complex decisions into manageable steps.",
    });
    expect(result.success).toBe(true);
  });

  it("validates a growth block", () => {
    const result = narrativeBlockSchema.safeParse({
      category: "Risk Assessment",
      type: "growth",
      text: "Expanding your risk framing vocabulary would sharpen your edge.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid type", () => {
    const result = narrativeBlockSchema.safeParse({
      category: "Decision Architecture",
      type: "neutral",
      text: "Some text.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing category", () => {
    const result = narrativeBlockSchema.safeParse({
      type: "strength",
      text: "Some text.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing text", () => {
    const result = narrativeBlockSchema.safeParse({
      category: "Decision Architecture",
      type: "strength",
    });
    expect(result.success).toBe(false);
  });
});

// --- corpusAverageCategorySchema ---

describe("corpusAverageCategorySchema", () => {
  it("validates a valid category average", () => {
    const result = corpusAverageCategorySchema.safeParse({
      category: "Option Generation",
      averageScore: 72.5,
    });
    expect(result.success).toBe(true);
  });

  it("accepts boundary values 0 and 100", () => {
    expect(
      corpusAverageCategorySchema.safeParse({
        category: "Option Generation",
        averageScore: 0,
      }).success
    ).toBe(true);
    expect(
      corpusAverageCategorySchema.safeParse({
        category: "Option Generation",
        averageScore: 100,
      }).success
    ).toBe(true);
  });

  it("rejects a score below 0", () => {
    const result = corpusAverageCategorySchema.safeParse({
      category: "Option Generation",
      averageScore: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a score above 100", () => {
    const result = corpusAverageCategorySchema.safeParse({
      category: "Option Generation",
      averageScore: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing averageScore", () => {
    const result = corpusAverageCategorySchema.safeParse({
      category: "Option Generation",
    });
    expect(result.success).toBe(false);
  });
});

// --- corpusAverageSchema ---

describe("corpusAverageSchema", () => {
  it("validates a valid corpus average with multiple categories", () => {
    const result = corpusAverageSchema.safeParse({
      categories: [
        { category: "Option Generation", averageScore: 65 },
        { category: "Decision Architecture", averageScore: 78 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("validates an empty categories array", () => {
    const result = corpusAverageSchema.safeParse({ categories: [] });
    expect(result.success).toBe(true);
  });

  it("rejects missing categories field", () => {
    const result = corpusAverageSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects categories with invalid items", () => {
    const result = corpusAverageSchema.safeParse({
      categories: [{ category: "Option Generation", averageScore: 200 }],
    });
    expect(result.success).toBe(false);
  });
});

// --- matchRunnerUpSchema ---

describe("matchRunnerUpSchema", () => {
  it("validates a full runner-up entry", () => {
    const result = matchRunnerUpSchema.safeParse({
      entrepreneurName: "Sara Blakely",
      bioSnippet: "Founder of Spanx, built a billion-dollar brand from scratch.",
      companies: ["Spanx"],
      industries: ["Fashion", "Retail"],
      categoryScores: [
        { category: "Option Generation", score: 82 },
        { category: "Decision Architecture", score: 91 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("validates a runner-up with null bioSnippet", () => {
    const result = matchRunnerUpSchema.safeParse({
      entrepreneurName: "Sara Blakely",
      bioSnippet: null,
      companies: ["Spanx"],
      industries: ["Fashion"],
      categoryScores: [],
    });
    expect(result.success).toBe(true);
  });

  it("validates a runner-up with empty companies and industries", () => {
    const result = matchRunnerUpSchema.safeParse({
      entrepreneurName: "Jane Doe",
      bioSnippet: null,
      companies: [],
      industries: [],
      categoryScores: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing entrepreneurName", () => {
    const result = matchRunnerUpSchema.safeParse({
      bioSnippet: null,
      companies: [],
      industries: [],
      categoryScores: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing categoryScores", () => {
    const result = matchRunnerUpSchema.safeParse({
      entrepreneurName: "Jane Doe",
      bioSnippet: null,
      companies: [],
      industries: [],
    });
    expect(result.success).toBe(false);
  });
});

// --- reasoningMatchSchema ---

describe("reasoningMatchSchema", () => {
  const validRunnerUp = {
    entrepreneurName: "Sara Blakely",
    bioSnippet: null,
    companies: ["Spanx"],
    industries: ["Fashion"],
    categoryScores: [{ category: "Option Generation", score: 80 }],
  };

  const validReasoningMatch = {
    entrepreneurName: "Elon Musk",
    bioSnippet: "Founded Tesla, SpaceX, and multiple other ventures.",
    companies: ["Tesla", "SpaceX"],
    industries: ["Automotive", "Aerospace"],
    studentCategoryScores: [
      { category: "Option Generation", score: 88 },
      { category: "Decision Architecture", score: 75 },
    ],
    entrepreneurCategoryScores: [
      { category: "Option Generation", score: 95 },
      { category: "Decision Architecture", score: 90 },
    ],
    topSharedStrengths: [
      { name: "Option Generation", value: 88 },
    ],
    biggestDifferences: [
      { name: "Risk Assessment", studentValue: 60, entrepreneurValue: 95 },
    ],
    runnersUp: [validRunnerUp],
  };

  it("validates a full reasoning match", () => {
    const result = reasoningMatchSchema.safeParse(validReasoningMatch);
    expect(result.success).toBe(true);
  });

  it("validates with null bioSnippet", () => {
    const result = reasoningMatchSchema.safeParse({
      ...validReasoningMatch,
      bioSnippet: null,
    });
    expect(result.success).toBe(true);
  });

  it("validates with empty arrays for optional collections", () => {
    const result = reasoningMatchSchema.safeParse({
      ...validReasoningMatch,
      topSharedStrengths: [],
      biggestDifferences: [],
      runnersUp: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing entrepreneurName", () => {
    const { entrepreneurName: _omitted, ...rest } = validReasoningMatch;
    const result = reasoningMatchSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing runnersUp", () => {
    const { runnersUp: _omitted, ...rest } = validReasoningMatch;
    const result = reasoningMatchSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid runner-up in runnersUp array", () => {
    const result = reasoningMatchSchema.safeParse({
      ...validReasoningMatch,
      runnersUp: [{ entrepreneurName: "Missing fields" }],
    });
    expect(result.success).toBe(false);
  });
});

// --- communicationMatchSchema ---

describe("communicationMatchSchema", () => {
  it("is an alias of entrepreneurMatchSchema and validates the same shape", () => {
    const result = communicationMatchSchema.safeParse({
      entrepreneurName: "Howard Schultz",
      entrepreneurId: "abc123",
      cosineSimilarity: 0.87,
      bioSnippet: "Built Starbucks into a global brand.",
      category: "communication",
      companies: ["Starbucks"],
      industries: ["Food & Beverage"],
      studentProfile: [{ category: "Vision Communication", value: 82 }],
      entrepreneurProfile: [{ category: "Vision Communication", value: 91 }],
      topSharedTraits: [{ name: "Vision Communication", value: 82 }],
      biggestDifferences: [
        {
          name: "Creative Confidence",
          studentValue: 65,
          entrepreneurValue: 90,
        },
      ],
      runnersUp: [{ name: "Oprah Winfrey", similarity: 0.81 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing entrepreneurId", () => {
    const result = communicationMatchSchema.safeParse({
      entrepreneurName: "Howard Schultz",
      cosineSimilarity: 0.87,
      bioSnippet: null,
      category: "communication",
      companies: [],
      industries: [],
      studentProfile: [],
      entrepreneurProfile: [],
      topSharedTraits: [],
      biggestDifferences: [],
      runnersUp: [],
    });
    expect(result.success).toBe(false);
  });
});

// --- resultsPageDataSchema (new shape) ---

describe("resultsPageDataSchema", () => {
  const baseApplicant = {
    displayName: "Jordan Lee",
    assessmentType: "public" as const,
  };

  const baseCategoryScore = {
    category: "Option Generation",
    score: 75,
    movesMatched: 5,
    movesScored: 8,
    movesMissed: 3,
    movesExcluded: 0,
  };

  const baseArchetype = {
    name: "The Optimizer",
    tagline: "You find the best path through any problem.",
    description: "Your natural instinct is to weigh every option and find the most efficient route forward.",
    basedOnCategory: "Decision Architecture",
    variant: "pi" as const,
  };

  const baseNarrativeBlock = {
    category: "Option Generation",
    type: "strength" as const,
    text: "You generate options with ease.",
  };

  const baseRadarCategory = {
    category: "Option Generation",
    studentScore: 0.65,
    entrepreneurScore: 0.72,
  };

  const minimalValidData = {
    applicant: baseApplicant,
    piCategories: [baseCategoryScore],
    ciCategories: [baseCategoryScore],
    piRadar: [baseRadarCategory],
    ciRadar: [baseRadarCategory],
    piCorpusAverage: null,
    ciCorpusAverage: null,
    archetype: baseArchetype,
    intelligenceNarrative: [baseNarrativeBlock],
    reasoningMatch: null,
    communicationProfile: null,
    communicationCorpusAverage: null,
    communicationNarrative: [],
    communicationMatch: null,
    personality: null,
    personalityNarrative: [],
    narrative: { piSummaries: ["PI summary."], ciSummaries: ["CI summary."] },
  };

  it("validates a minimal valid results page with all nullable fields null", () => {
    const result = resultsPageDataSchema.safeParse(minimalValidData);
    expect(result.success).toBe(true);
  });

  it("validates with a null displayName", () => {
    const result = resultsPageDataSchema.safeParse({
      ...minimalValidData,
      applicant: { displayName: null, assessmentType: "admissions" },
    });
    expect(result.success).toBe(true);
  });

  it("validates with piCorpusAverage populated", () => {
    const result = resultsPageDataSchema.safeParse({
      ...minimalValidData,
      piCorpusAverage: {
        categories: [{ category: "Option Generation", averageScore: 68 }],
      },
    });
    expect(result.success).toBe(true);
  });

  it("validates with intelligenceNarrative having strength and growth blocks", () => {
    const result = resultsPageDataSchema.safeParse({
      ...minimalValidData,
      intelligenceNarrative: [
        { category: "Option Generation", type: "strength", text: "You are strong here." },
        { category: "Risk Assessment", type: "growth", text: "Room to grow here." },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("validates with communicationProfile populated", () => {
    const result = resultsPageDataSchema.safeParse({
      ...minimalValidData,
      communicationProfile: [{ category: "Vision Communication", value: 88 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing applicant field", () => {
    const { applicant: _omitted, ...rest } = minimalValidData;
    const result = resultsPageDataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid assessmentType", () => {
    const result = resultsPageDataSchema.safeParse({
      ...minimalValidData,
      applicant: { displayName: "Jordan", assessmentType: "enterprise" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing archetype", () => {
    const { archetype: _omitted, ...rest } = minimalValidData;
    const result = resultsPageDataSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("does not require overall/bqScore (old field removed)", () => {
    // The new schema should not have an 'overall' field
    const result = resultsPageDataSchema.safeParse(minimalValidData);
    if (result.success) {
      expect("overall" in result.data).toBe(false);
    } else {
      // If it fails, that's a problem
      expect(result.success).toBe(true);
    }
  });
});
