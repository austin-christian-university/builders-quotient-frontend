import { z } from "zod";

// --- Archetype reference (all 16, including empty ones) ---

export const ARCHETYPES = [
  { key: "analytical_exploratory__insight_market", name: "The Pathfinder", tagline: "Sees what others miss and knows where it leads", piStyle: "analytical_exploratory", ciStyle: "insight_market" },
  { key: "analytical_exploratory__insight_process", name: "The Theorist", tagline: "Maps the invisible structures behind breakthroughs", piStyle: "analytical_exploratory", ciStyle: "insight_process" },
  { key: "analytical_exploratory__validation_market", name: "The Cartographer", tagline: "Charts new territory with evidence in hand", piStyle: "analytical_exploratory", ciStyle: "validation_market" },
  { key: "analytical_exploratory__validation_process", name: "The Prospector", tagline: "Digs deep, tests everything, finds real gold", piStyle: "analytical_exploratory", ciStyle: "validation_process" },
  { key: "analytical_decisive__insight_market", name: "The Strategist", tagline: "Turns sharp insight into decisive market moves", piStyle: "analytical_decisive", ciStyle: "insight_market" },
  { key: "analytical_decisive__insight_process", name: "The Catalyst", tagline: "Applies analytical precision to ignite creative change", piStyle: "analytical_decisive", ciStyle: "insight_process" },
  { key: "analytical_decisive__validation_market", name: "The Optimizer", tagline: "Finds the highest-leverage path and executes it", piStyle: "analytical_decisive", ciStyle: "validation_market" },
  { key: "analytical_decisive__validation_process", name: "The Sentinel", tagline: "Guards quality with analytical rigor and disciplined execution", piStyle: "analytical_decisive", ciStyle: "validation_process" },
  { key: "interpersonal_exploratory__insight_market", name: "The Luminary", tagline: "Inspires new possibilities by illuminating what people need", piStyle: "interpersonal_exploratory", ciStyle: "insight_market" },
  { key: "interpersonal_exploratory__insight_process", name: "The Weaver", tagline: "Connects people and ideas into unexpected combinations", piStyle: "interpersonal_exploratory", ciStyle: "insight_process" },
  { key: "interpersonal_exploratory__validation_market", name: "The Navigator", tagline: "Guides ventures forward by reading people and markets", piStyle: "interpersonal_exploratory", ciStyle: "validation_market" },
  { key: "interpersonal_exploratory__validation_process", name: "The Steward", tagline: "Nurtures ideas through careful cultivation and testing", piStyle: "interpersonal_exploratory", ciStyle: "validation_process" },
  { key: "interpersonal_decisive__insight_market", name: "The Torchbearer", tagline: "Champions bold visions with the conviction to rally others", piStyle: "interpersonal_decisive", ciStyle: "insight_market" },
  { key: "interpersonal_decisive__insight_process", name: "The Alchemist", tagline: "Transforms creative intuition into tangible results through people", piStyle: "interpersonal_decisive", ciStyle: "insight_process" },
  { key: "interpersonal_decisive__validation_market", name: "The Builder", tagline: "Constructs lasting ventures by understanding people and validating markets", piStyle: "interpersonal_decisive", ciStyle: "validation_market" },
  { key: "interpersonal_decisive__validation_process", name: "The Anchor", tagline: "Grounds teams in reality with steadfast judgment and proven methods", piStyle: "interpersonal_decisive", ciStyle: "validation_process" },
] as const;

export type ArchetypeRef = (typeof ARCHETYPES)[number];

// --- Grid layout constants ---

export const PI_STYLES = [
  { key: "analytical_exploratory", label: "Analytical & Exploratory" },
  { key: "analytical_decisive", label: "Analytical & Decisive" },
  { key: "interpersonal_exploratory", label: "Interpersonal & Exploratory" },
  { key: "interpersonal_decisive", label: "Interpersonal & Decisive" },
] as const;

export const CI_STYLES = [
  { key: "insight_market", label: "Insight & Market" },
  { key: "insight_process", label: "Insight & Process" },
  { key: "validation_market", label: "Validation & Market" },
  { key: "validation_process", label: "Validation & Process" },
] as const;

// --- Schemas for data from Supabase ---

export const entrepreneurSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  archetype_key: z.string(),
  archetype_name: z.string(),
  archetype_tagline: z.string(),
  pi_style: z.string(),
  ci_style: z.string(),
  pi_d1_score: z.number(),
  pi_d2_score: z.number(),
  ci_d1_score: z.number(),
  ci_d2_score: z.number(),
  pi_category_scores: z.record(z.string(), z.number()),
  ci_category_scores: z.record(z.string(), z.number()),
  industries: z.array(z.string()).nullable(),
});

export type EntrepreneurSummary = z.infer<typeof entrepreneurSummarySchema>;

export const entrepreneurDetailSchema = entrepreneurSummarySchema.extend({
  archetype_description: z.string().nullable(),
  bio_narrative: z.string().nullable(),
});

export type EntrepreneurDetail = z.infer<typeof entrepreneurDetailSchema>;

// --- Computed types for pages ---

export type ArchetypeGridCell = {
  archetype: ArchetypeRef;
  count: number;
};

export type CorpusMaxScores = {
  pi: Record<string, number>;
  ci: Record<string, number>;
};

export type ExplorerStats = {
  totalEntrepreneurs: number;
  totalIndustries: number;
  pctInsightDriven: number;
  pctExploratory: number;
  topDifferentiator: string;
  dominantArchetype: { name: string; pct: number };
  emptyArchetypeCount: number;
};

export type ArchetypeDetailData = {
  archetype: ArchetypeRef;
  description: string;
  entrepreneurs: EntrepreneurSummary[];
  avgPiScores: Record<string, number>;
  avgCiScores: Record<string, number>;
  corpusAvgPiScores: Record<string, number>;
  corpusAvgCiScores: Record<string, number>;
  corpusMax: CorpusMaxScores;
};

export type EntrepreneurProfileData = {
  entrepreneur: EntrepreneurDetail;
  archetypeAvgPiScores: Record<string, number>;
  archetypeAvgCiScores: Record<string, number>;
  corpusMax: CorpusMaxScores;
  allEntrepreneurs: { id: string; pi_d1_score: number; pi_d2_score: number; ci_d1_score: number; ci_d2_score: number }[];
};
