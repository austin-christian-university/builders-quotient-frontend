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
  description: z.string(),
  basedOnCategory: z.string().optional(),
  variant: z.enum(["pi", "ci", "balanced"]),
});

// --- Entrepreneur narrative match sub-schemas ---

export const signatureMoveSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const entrepreneurNarrativeSchema = z.object({
  entrepreneurName: z.string(),
  entrepreneurId: z.string(),
  companies: z.array(z.string()),
  industries: z.array(z.string()),
  bioNarrative: z.string().nullable(),
  fallbackBioSnippet: z.string().nullable(),
  domainStyle: z.string().nullable(),
  signatureMoves: z.array(signatureMoveSchema),
  strengths: z.string().nullable(),
  blindspots: z.string().nullable(),
});

export const narrativeMatchSchema = z.object({
  primary: entrepreneurNarrativeSchema,
  runnersUp: z.array(entrepreneurNarrativeSchema).max(2),
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

// --- Radar chart data (from move_details, bidirectional) ---

export const radarCategorySchema = z.object({
  category: z.string(),
  studentScore: z.number().min(0).max(1),
  entrepreneurScore: z.number().min(0).max(1),
});

// --- New narrative and corpus schemas ---

export const narrativeBlockSchema = z.object({
  category: z.string(),
  type: z.enum(["strength", "growth"]),
  text: z.string(),
});

export const corpusAverageCategorySchema = z.object({
  category: z.string(),
  averageScore: z.number().min(0).max(100),
});

export const corpusAverageSchema = z.object({
  categories: z.array(corpusAverageCategorySchema),
});

// --- Match schemas (narrative-driven) ---

export const reasoningMatchSchema = narrativeMatchSchema;
export const communicationMatchSchema = narrativeMatchSchema;

// --- Main schema ---

export const resultsPageDataSchema = z.object({
  applicant: z.object({
    displayName: z.string().nullable(),
    assessmentType: z.enum(["public", "admissions"]),
    leadType: z.enum(["prospective_student", "general_interest"]).nullable(),
    personalityCompleted: z.boolean(),
  }),
  piCategories: z.array(categoryScoreSchema),
  ciCategories: z.array(categoryScoreSchema),
  piRadar: z.array(radarCategorySchema),
  ciRadar: z.array(radarCategorySchema),
  piCorpusAverage: corpusAverageSchema.nullable(),
  ciCorpusAverage: corpusAverageSchema.nullable(),
  archetype: archetypeSchema,
  intelligenceNarrative: z.array(narrativeBlockSchema),
  reasoningMatch: reasoningMatchSchema.nullable(),
  communicationProfile: z
    .array(z.object({ category: z.string(), value: z.number() }))
    .nullable(),
  communicationCorpusAverage: corpusAverageSchema.nullable(),
  communicationNarrative: z.array(narrativeBlockSchema),
  communicationMatch: communicationMatchSchema.nullable(),
  personality: personalityDataSchema.nullable(),
  personalityNarrative: z.array(narrativeBlockSchema),
  narrative: z.object({
    piSummaries: z.array(z.string()),
    ciSummaries: z.array(z.string()),
  }),
});

// --- Exported types ---

export type ResultsPageData = z.infer<typeof resultsPageDataSchema>;
export type CategoryScore = z.infer<typeof categoryScoreSchema>;
export type Archetype = z.infer<typeof archetypeSchema>;
export type PersonalityFacetScore = z.infer<typeof personalityFacetScoreSchema>;
export type PersonalityData = z.infer<typeof personalityDataSchema>;
export type NarrativeBlock = z.infer<typeof narrativeBlockSchema>;
export type CorpusAverageCategory = z.infer<typeof corpusAverageCategorySchema>;
export type CorpusAverage = z.infer<typeof corpusAverageSchema>;
export type RadarCategory = z.infer<typeof radarCategorySchema>;
export type SignatureMove = z.infer<typeof signatureMoveSchema>;
export type EntrepreneurNarrative = z.infer<typeof entrepreneurNarrativeSchema>;
export type NarrativeMatch = z.infer<typeof narrativeMatchSchema>;
// Backward-compatible aliases
export type ReasoningMatch = z.infer<typeof reasoningMatchSchema>;
export type CommunicationMatch = z.infer<typeof communicationMatchSchema>;
