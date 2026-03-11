import { describe, it, expect } from "vitest";
import {
  narrativeBlockSchema,
  corpusAverageCategorySchema,
  corpusAverageSchema,
  signatureMoveSchema,
  entrepreneurNarrativeSchema,
  narrativeMatchSchema,
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

// --- signatureMoveSchema ---

describe("signatureMoveSchema", () => {
  it("validates a valid signature move", () => {
    const result = signatureMoveSchema.safeParse({
      title: "The Pivot Maestro",
      description: "Rapidly reframes constraints as opportunities.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = signatureMoveSchema.safeParse({
      description: "Rapidly reframes constraints as opportunities.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing description", () => {
    const result = signatureMoveSchema.safeParse({
      title: "The Pivot Maestro",
    });
    expect(result.success).toBe(false);
  });
});

// --- entrepreneurNarrativeSchema ---

describe("entrepreneurNarrativeSchema", () => {
  const fullNarrative = {
    entrepreneurName: "Sara Blakely",
    entrepreneurId: "sara-blakely-001",
    companies: ["Spanx"],
    industries: ["Fashion", "Retail"],
    bioNarrative: "Sara built Spanx from a $5,000 idea into a billion-dollar brand.",
    fallbackBioSnippet: "Founder of Spanx.",
    domainStyle: "Consumer products visionary",
    signatureMoves: [
      { title: "The Bootstrap Blueprint", description: "Builds empires with minimal capital." },
    ],
    strengths: "Relentless resourcefulness and customer obsession.",
    blindspots: "Can underestimate the need for early external capital.",
  };

  it("validates full entrepreneur narrative data", () => {
    const result = entrepreneurNarrativeSchema.safeParse(fullNarrative);
    expect(result.success).toBe(true);
  });

  it("validates with all nullable fields set to null", () => {
    const result = entrepreneurNarrativeSchema.safeParse({
      ...fullNarrative,
      bioNarrative: null,
      fallbackBioSnippet: null,
      domainStyle: null,
      strengths: null,
      blindspots: null,
    });
    expect(result.success).toBe(true);
  });

  it("validates with empty companies, industries, and signatureMoves arrays", () => {
    const result = entrepreneurNarrativeSchema.safeParse({
      ...fullNarrative,
      companies: [],
      industries: [],
      signatureMoves: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing entrepreneurName", () => {
    const { entrepreneurName: _omitted, ...rest } = fullNarrative;
    const result = entrepreneurNarrativeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing entrepreneurId", () => {
    const { entrepreneurId: _omitted, ...rest } = fullNarrative;
    const result = entrepreneurNarrativeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing signatureMoves", () => {
    const { signatureMoves: _omitted, ...rest } = fullNarrative;
    const result = entrepreneurNarrativeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// --- narrativeMatchSchema ---

const baseEntrepreneurNarrative = {
  entrepreneurName: "Elon Musk",
  entrepreneurId: "elon-musk-001",
  companies: ["Tesla", "SpaceX"],
  industries: ["Automotive", "Aerospace"],
  bioNarrative: "Elon relentlessly pursues first-principles thinking to solve civilization-scale problems.",
  fallbackBioSnippet: "Founder of Tesla and SpaceX.",
  domainStyle: "Systems thinker and moonshot executor",
  signatureMoves: [
    { title: "First Principles Deconstruction", description: "Strips problems to their atomic components." },
  ],
  strengths: "Unmatched vision and execution velocity.",
  blindspots: "Can underestimate human organizational complexity.",
};

const runnerUpNarrative = {
  entrepreneurName: "Jeff Bezos",
  entrepreneurId: "jeff-bezos-001",
  companies: ["Amazon"],
  industries: ["E-commerce", "Cloud"],
  bioNarrative: null,
  fallbackBioSnippet: "Founder of Amazon.",
  domainStyle: null,
  signatureMoves: [],
  strengths: null,
  blindspots: null,
};

describe("narrativeMatchSchema", () => {
  it("validates a match with primary and 2 runners-up", () => {
    const result = narrativeMatchSchema.safeParse({
      primary: baseEntrepreneurNarrative,
      runnersUp: [runnerUpNarrative, { ...runnerUpNarrative, entrepreneurId: "runner-2" }],
    });
    expect(result.success).toBe(true);
  });

  it("validates a match with an empty runnersUp array", () => {
    const result = narrativeMatchSchema.safeParse({
      primary: baseEntrepreneurNarrative,
      runnersUp: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 2 runners-up", () => {
    const result = narrativeMatchSchema.safeParse({
      primary: baseEntrepreneurNarrative,
      runnersUp: [
        runnerUpNarrative,
        { ...runnerUpNarrative, entrepreneurId: "runner-2" },
        { ...runnerUpNarrative, entrepreneurId: "runner-3" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing primary", () => {
    const result = narrativeMatchSchema.safeParse({
      runnersUp: [],
    });
    expect(result.success).toBe(false);
  });
});

// --- reasoningMatchSchema / communicationMatchSchema (narrative aliases) ---

describe("reasoningMatchSchema", () => {
  it("accepts the narrativeMatchSchema shape", () => {
    const result = reasoningMatchSchema.safeParse({
      primary: baseEntrepreneurNarrative,
      runnersUp: [runnerUpNarrative],
    });
    expect(result.success).toBe(true);
  });

  it("rejects the old radar-based shape", () => {
    const result = reasoningMatchSchema.safeParse({
      entrepreneurName: "Elon Musk",
      bioSnippet: null,
      companies: [],
      industries: [],
      studentCategoryScores: [],
      entrepreneurCategoryScores: [],
      topSharedStrengths: [],
      biggestDifferences: [],
      runnersUp: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("communicationMatchSchema", () => {
  it("accepts the narrativeMatchSchema shape", () => {
    const result = communicationMatchSchema.safeParse({
      primary: baseEntrepreneurNarrative,
      runnersUp: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects the old cosine-similarity-based shape", () => {
    const result = communicationMatchSchema.safeParse({
      entrepreneurName: "Howard Schultz",
      entrepreneurId: "abc123",
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
