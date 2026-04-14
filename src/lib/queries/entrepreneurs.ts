import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import {
  ARCHETYPES,
  type EntrepreneurSummary,
  type EntrepreneurDetail,
  type ArchetypeGridCell,
  type CorpusMaxScores,
  type ExplorerStats,
  type ArchetypeDetailData,
  type EntrepreneurProfileData,
  type ArchetypeRef,
} from "@/lib/schemas/entrepreneurs";
import {
  PI_CANONICAL_CATEGORIES,
  CI_CANONICAL_CATEGORIES,
} from "@/lib/assessment/scoring-categories";

// --- Helpers ---

/** Compute per-category max across all entrepreneurs for radar chart scaling. */
function computeCorpusMax(entrepreneurs: EntrepreneurSummary[]): CorpusMaxScores {
  const piMax: Record<string, number> = {};
  const ciMax: Record<string, number> = {};

  for (const cat of PI_CANONICAL_CATEGORIES) {
    piMax[cat] = 0;
  }
  for (const cat of CI_CANONICAL_CATEGORIES) {
    ciMax[cat] = 0;
  }

  for (const e of entrepreneurs) {
    if (e.pi_category_scores) {
      for (const [cat, val] of Object.entries(e.pi_category_scores)) {
        if (val > (piMax[cat] ?? 0)) piMax[cat] = val;
      }
    }
    if (e.ci_category_scores) {
      for (const [cat, val] of Object.entries(e.ci_category_scores)) {
        if (val > (ciMax[cat] ?? 0)) ciMax[cat] = val;
      }
    }
  }

  return { pi: piMax, ci: ciMax };
}

/** Average category scores across a set of entrepreneurs. */
function averageScores(
  entrepreneurs: EntrepreneurSummary[],
  field: "pi_category_scores" | "ci_category_scores"
): Record<string, number> {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const e of entrepreneurs) {
    const scores = e[field];
    if (!scores) continue;
    for (const [cat, val] of Object.entries(scores)) {
      sums[cat] = (sums[cat] ?? 0) + val;
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
  }

  const avg: Record<string, number> = {};
  for (const cat of Object.keys(sums)) {
    avg[cat] = sums[cat] / counts[cat];
  }
  return avg;
}

/** Count distinct values from an array-of-arrays. */
function countDistinct(arrays: (string[] | null)[]): number {
  const set = new Set<string>();
  for (const arr of arrays) {
    if (!arr) continue;
    for (const v of arr) set.add(v);
  }
  return set.size;
}

// --- Main queries ---

/**
 * Fetches all data needed for the Archetype Explorer overview page.
 * Returns null if no entrepreneurs have archetypes.
 */
export async function getExplorerData(): Promise<{
  entrepreneurs: EntrepreneurSummary[];
  gridCells: ArchetypeGridCell[];
  stats: ExplorerStats;
  corpusMax: CorpusMaxScores;
} | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("entrepreneurs")
    .select(
      "id, name, archetype_key, archetype_name, archetype_tagline, pi_style, ci_style, pi_d1_score, pi_d2_score, ci_d1_score, ci_d2_score, pi_category_scores, ci_category_scores, industries"
    )
    .not("archetype_key", "is", null);

  if (error || !data || data.length === 0) return null;

  const entrepreneurs = data as EntrepreneurSummary[];
  const corpusMax = computeCorpusMax(entrepreneurs);

  // Build grid cells — one per archetype (all 16)
  const countsByKey = new Map<string, number>();
  for (const e of entrepreneurs) {
    countsByKey.set(e.archetype_key, (countsByKey.get(e.archetype_key) ?? 0) + 1);
  }

  const gridCells: ArchetypeGridCell[] = ARCHETYPES.map((archetype) => ({
    archetype,
    count: countsByKey.get(archetype.key) ?? 0,
  }));

  // Compute stats
  const totalEntrepreneurs = entrepreneurs.length;
  const totalIndustries = countDistinct(entrepreneurs.map((e) => e.industries));
  const pctInsightDriven =
    Math.round(
      (entrepreneurs.filter((e) => e.ci_d1_score >= 0).length / totalEntrepreneurs) * 1000
    ) / 10;
  const pctExploratory =
    Math.round(
      (entrepreneurs.filter((e) => e.pi_d2_score >= 0).length / totalEntrepreneurs) * 1000
    ) / 10;

  // Find the archetype with the highest count
  let dominantKey = "";
  let dominantCount = 0;
  for (const [key, count] of countsByKey) {
    if (count > dominantCount) {
      dominantKey = key;
      dominantCount = count;
    }
  }
  const dominantArchetypeRef = ARCHETYPES.find((a) => a.key === dominantKey);
  const dominantArchetype = {
    name: dominantArchetypeRef?.name ?? "Unknown",
    pct: Math.round((dominantCount / totalEntrepreneurs) * 1000) / 10,
  };

  const emptyArchetypeCount = gridCells.filter((c) => c.count === 0).length;

  const stats: ExplorerStats = {
    totalEntrepreneurs,
    totalIndustries,
    pctInsightDriven,
    pctExploratory,
    topDifferentiator: "People & Stakeholders",
    dominantArchetype,
    emptyArchetypeCount,
  };

  return { entrepreneurs, gridCells, stats, corpusMax };
}

/**
 * Fetches data for an archetype detail page.
 * Returns null if the archetype key doesn't match any known archetype.
 */
export async function getArchetypeDetail(
  archetypeKey: string
): Promise<ArchetypeDetailData | null> {
  // Validate key against known archetypes
  const archetypeRef = ARCHETYPES.find((a) => a.key === archetypeKey) as ArchetypeRef | undefined;
  if (!archetypeRef) return null;

  const supabase = createServiceClient();

  // Fetch entrepreneurs for this archetype
  const { data: archetypeEntrepreneurs, error: archetypeError } = await supabase
    .from("entrepreneurs")
    .select(
      "id, name, archetype_key, archetype_name, archetype_tagline, archetype_description, pi_style, ci_style, pi_d1_score, pi_d2_score, ci_d1_score, ci_d2_score, pi_category_scores, ci_category_scores, industries"
    )
    .eq("archetype_key", archetypeKey);

  if (archetypeError || !archetypeEntrepreneurs || archetypeEntrepreneurs.length === 0) return null;

  // Fetch all entrepreneurs for corpus averages and max scaling
  const { data: allEntrepreneurs } = await supabase
    .from("entrepreneurs")
    .select(
      "id, name, archetype_key, archetype_name, archetype_tagline, pi_style, ci_style, pi_d1_score, pi_d2_score, ci_d1_score, ci_d2_score, pi_category_scores, ci_category_scores, industries"
    )
    .not("archetype_key", "is", null);

  const allEnts = (allEntrepreneurs ?? []) as EntrepreneurSummary[];
  const archetypeEnts = archetypeEntrepreneurs as EntrepreneurSummary[];

  const corpusMax = computeCorpusMax(allEnts);
  const avgPiScores = averageScores(archetypeEnts, "pi_category_scores");
  const avgCiScores = averageScores(archetypeEnts, "ci_category_scores");
  const corpusAvgPiScores = averageScores(allEnts, "pi_category_scores");
  const corpusAvgCiScores = averageScores(allEnts, "ci_category_scores");

  const description = (archetypeEntrepreneurs[0] as { archetype_description?: string | null })
    .archetype_description ?? "";

  return {
    archetype: archetypeRef,
    description,
    entrepreneurs: archetypeEnts,
    avgPiScores,
    avgCiScores,
    corpusAvgPiScores,
    corpusAvgCiScores,
    corpusMax,
  };
}

/**
 * Fetches data for an individual entrepreneur profile page.
 * Returns null if the entrepreneur is not found or has no archetype.
 */
export async function getEntrepreneurProfile(
  id: string
): Promise<EntrepreneurProfileData | null> {
  const supabase = createServiceClient();

  const { data: entrepreneur, error } = await supabase
    .from("entrepreneurs")
    .select(
      "id, name, archetype_key, archetype_name, archetype_tagline, archetype_description, pi_style, ci_style, pi_d1_score, pi_d2_score, ci_d1_score, ci_d2_score, pi_category_scores, ci_category_scores, industries, bio_narrative"
    )
    .eq("id", id)
    .not("archetype_key", "is", null)
    .single();

  if (error || !entrepreneur) return null;

  // Fetch all entrepreneurs for corpus max + scatter plot positions
  const { data: allEntrepreneurs } = await supabase
    .from("entrepreneurs")
    .select(
      "id, name, archetype_key, archetype_name, archetype_tagline, pi_style, ci_style, pi_d1_score, pi_d2_score, ci_d1_score, ci_d2_score, pi_category_scores, ci_category_scores, industries"
    )
    .not("archetype_key", "is", null);

  const allEnts = (allEntrepreneurs ?? []) as EntrepreneurSummary[];
  const corpusMax = computeCorpusMax(allEnts);

  // Archetype average for comparison trace
  const sameArchetype = allEnts.filter((e) => e.archetype_key === entrepreneur.archetype_key);
  const archetypeAvgPiScores = averageScores(sameArchetype, "pi_category_scores");
  const archetypeAvgCiScores = averageScores(sameArchetype, "ci_category_scores");

  return {
    entrepreneur: entrepreneur as EntrepreneurDetail,
    archetypeAvgPiScores,
    archetypeAvgCiScores,
    corpusMax,
    allEntrepreneurs: allEnts.map((e) => ({
      id: e.id,
      pi_d1_score: e.pi_d1_score,
      pi_d2_score: e.pi_d2_score,
      ci_d1_score: e.ci_d1_score,
      ci_d2_score: e.ci_d2_score,
    })),
  };
}
