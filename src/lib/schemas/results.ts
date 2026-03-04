import { z } from "zod";

// --- Sub-schemas ---

export const categoryScoreSchema = z.object({
  category: z.string(),
  score: z.number().min(0).max(100),
  movesMatched: z.number().int().min(0),
  movesScored: z.number().int().min(0),
  movesMissed: z.number().int().min(0),
  movesExcluded: z.number().int().min(0),
});

export const archetypeSchema = z.object({
  name: z.string(),
  tagline: z.string(),
  basedOnCategory: z.string(),
  variant: z.enum(["pi", "ci"]),
});

export const signatureMoveSchema = z.object({
  description: z.string(),
  agreementPercent: z.number(),
  categoryName: z.string(),
});

export const rarestMoveSchema = z.object({
  description: z.string(),
  agreementPercent: z.number(),
  categoryName: z.string(),
});

export const growthEdgeSchema = z.object({
  description: z.string(),
  categoryName: z.string(),
});

export const statsSchema = z.object({
  piCategoriesAboveAvg: z.number().int(),
  ciCategoriesAboveAvg: z.number().int(),
  totalCategories: z.number().int(),
  strongestCategory: z.object({
    name: z.string(),
    score: z.number(),
  }),
  biggestGap: z.number(),
  corpusSize: z.number().int(),
});

// --- Entrepreneur match sub-schemas ---

export const categoryProfilePointSchema = z.object({
  category: z.string(),
  value: z.number(),
});

export const sharedTraitSchema = z.object({
  name: z.string(),
  value: z.number(),
});

export const traitDifferenceSchema = z.object({
  name: z.string(),
  studentValue: z.number(),
  entrepreneurValue: z.number(),
});

export const runnerUpSchema = z.object({
  name: z.string(),
  similarity: z.number(),
});

export const entrepreneurMatchSchema = z.object({
  entrepreneurName: z.string(),
  entrepreneurId: z.string(),
  cosineSimilarity: z.number(),
  bioSnippet: z.string().nullable(),
  category: z.string(),
  companies: z.array(z.string()),
  industries: z.array(z.string()),
  studentProfile: z.array(categoryProfilePointSchema),
  entrepreneurProfile: z.array(categoryProfilePointSchema),
  topSharedTraits: z.array(sharedTraitSchema),
  biggestDifferences: z.array(traitDifferenceSchema),
  runnersUp: z.array(runnerUpSchema),
});

// --- Personality sub-schemas ---

export const personalityFacetScoreSchema = z.object({
  facet: z.string(),
  label: z.string(),
  rescaledScore: z.number(),
  itemCount: z.number().int(),
});

export const personalitySummarySchema = z.object({
  globalIndexRescaled: z.number(),
  gritRescaled: z.number(),
  attentionFail: z.boolean(),
  infrequencyFail: z.boolean(),
});

export const personalityDataSchema = z.object({
  facetScores: z.array(personalityFacetScoreSchema),
  summary: personalitySummarySchema,
});

// --- Main schema ---

export const resultsPageDataSchema = z.object({
  applicant: z.object({
    displayName: z.string().nullable(),
    assessmentType: z.enum(["public", "admissions"]),
  }),
  overall: z.object({
    bqScore: z.number(),
    piHeadlineScore: z.number(),
    ciHeadlineScore: z.number(),
  }),
  piCategories: z.array(categoryScoreSchema),
  ciCategories: z.array(categoryScoreSchema),
  archetype: archetypeSchema,
  signatureMoves: z.array(signatureMoveSchema),
  rarestMove: rarestMoveSchema.nullable(),
  growthEdges: z.array(growthEdgeSchema),
  stats: statsSchema,
  narrative: z.object({
    piSummaries: z.array(z.string()),
    ciSummaries: z.array(z.string()),
  }),
  personality: personalityDataSchema.nullable(),
  entrepreneurMatch: entrepreneurMatchSchema.nullable(),
});

// --- Exported types ---

export type ResultsPageData = z.infer<typeof resultsPageDataSchema>;
export type CategoryScore = z.infer<typeof categoryScoreSchema>;
export type Archetype = z.infer<typeof archetypeSchema>;
export type SignatureMove = z.infer<typeof signatureMoveSchema>;
export type RarestMove = z.infer<typeof rarestMoveSchema>;
export type GrowthEdge = z.infer<typeof growthEdgeSchema>;
export type ResultsStats = z.infer<typeof statsSchema>;
export type PersonalityFacetScore = z.infer<typeof personalityFacetScoreSchema>;
export type PersonalityData = z.infer<typeof personalityDataSchema>;
export type EntrepreneurMatch = z.infer<typeof entrepreneurMatchSchema>;
