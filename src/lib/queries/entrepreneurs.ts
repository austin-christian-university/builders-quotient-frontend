import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import {
  ARCHETYPES,
  communicationNarrativeSchema,
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

/** Average personality vectors across all entrepreneurs for corpus comparison. */
function computeAvgPersonalityVector(
  profiles: { personality_vector: Record<string, number> }[]
): Record<string, number> | null {
  if (profiles.length === 0) return null;

  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const profile of profiles) {
    if (!profile.personality_vector) continue;
    for (const [key, val] of Object.entries(profile.personality_vector)) {
      if (typeof val !== "number" || isNaN(val)) continue; // skip bad values
      sums[key] = (sums[key] ?? 0) + val;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }

  if (Object.keys(sums).length === 0) return null;

  const avg: Record<string, number> = {};
  for (const key of Object.keys(sums)) {
    avg[key] = sums[key] / counts[key];
  }
  return avg;
}

/** Whitelist pv_01–pv_20 keys and clamp values to 0–1. */
function sanitizePersonalityVector(raw: Record<string, number> | null | undefined): Record<string, number> | null {
  if (!raw) return null;
  const VALID_KEYS = Array.from({ length: 20 }, (_, i) => `pv_${String(i + 1).padStart(2, "0")}`);
  const result: Record<string, number> = {};
  for (const key of VALID_KEYS) {
    const val = raw[key];
    if (typeof val === "number" && !isNaN(val)) {
      result[key] = Math.max(0, Math.min(1, val));
    }
  }
  return Object.keys(result).length > 0 ? result : null;
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
  corpusAvgPersonalityVector: Record<string, number> | null;
  personalityTraitStats: { key: string; mean: number; stddev: number; min: number; max: number }[] | null;
  personalityVectors: number[][] | null;
} | null> {
  const supabase = createServiceClient();

  const [{ data, error }, { data: allPersonalityProfiles }] = await Promise.all([
    supabase
      .from("entrepreneurs")
      .select(
        "id, name, archetype_key, archetype_name, archetype_tagline, pi_style, ci_style, pi_d1_score, pi_d2_score, ci_d1_score, ci_d2_score, pi_category_scores, ci_category_scores, industries"
      )
      .not("archetype_key", "is", null),
    supabase
      .from("entrepreneur_personality_profiles")
      .select("personality_vector"),
  ]);

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

  const corpusAvgPersonalityVector = computeAvgPersonalityVector(allPersonalityProfiles ?? []);

  // Compute per-trait stats + extract individual vectors for charts
  const VALID_KEYS = Array.from({ length: 20 }, (_, i) => `pv_${String(i + 1).padStart(2, "0")}`);
  let personalityTraitStats: { key: string; mean: number; stddev: number; min: number; max: number }[] | null = null;
  let personalityVectors: number[][] | null = null;

  if (allPersonalityProfiles && allPersonalityProfiles.length > 0) {
    const validProfiles = allPersonalityProfiles.filter(
      (p) => p.personality_vector && typeof p.personality_vector === "object"
    );

    if (validProfiles.length > 0) {
      // Extract individual vectors as arrays (ordered by VALID_KEYS)
      personalityVectors = validProfiles.map((p) =>
        VALID_KEYS.map((k) => {
          const v = (p.personality_vector as Record<string, number>)[k];
          return typeof v === "number" && !isNaN(v) ? Math.max(0, Math.min(1, v)) : 0;
        })
      );

      // Compute per-trait stats
      personalityTraitStats = VALID_KEYS.map((key, idx) => {
        const values = personalityVectors!.map((v) => v[idx]);
        const n = values.length;
        const mean = values.reduce((a, b) => a + b, 0) / n;
        const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
        return {
          key,
          mean: Math.round(mean * 1000) / 1000,
          stddev: Math.round(Math.sqrt(variance) * 1000) / 1000,
          min: Math.round(Math.min(...values) * 1000) / 1000,
          max: Math.round(Math.max(...values) * 1000) / 1000,
        };
      });
    }
  }

  return { entrepreneurs, gridCells, stats, corpusMax, corpusAvgPersonalityVector, personalityTraitStats, personalityVectors };
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

  // Run all independent fetches in parallel
  const [
    { data: allEntrepreneurs },
    { data: personalityProfile },
    { data: commNarrative },
    { data: allPersonalityProfiles },
  ] = await Promise.all([
    supabase
      .from("entrepreneurs")
      .select(
        "id, name, archetype_key, archetype_name, archetype_tagline, pi_style, ci_style, pi_d1_score, pi_d2_score, ci_d1_score, ci_d2_score, pi_category_scores, ci_category_scores, industries"
      )
      .not("archetype_key", "is", null),
    supabase
      .from("entrepreneur_personality_profiles")
      .select("personality_vector")
      .eq("entrepreneur_id", id)
      .maybeSingle(),
    supabase
      .from("entrepreneur_communication_narratives")
      .select("communication_style, signature_moves, strengths, blindspots")
      .eq("entrepreneur_id", id)
      .maybeSingle(),
    supabase
      .from("entrepreneur_personality_profiles")
      .select("personality_vector"),
  ]);

  const allEnts = (allEntrepreneurs ?? []) as EntrepreneurSummary[];
  const corpusMax = computeCorpusMax(allEnts);

  // Archetype average for comparison trace
  const sameArchetype = allEnts.filter((e) => e.archetype_key === entrepreneur.archetype_key);
  const archetypeAvgPiScores = averageScores(sameArchetype, "pi_category_scores");
  const archetypeAvgCiScores = averageScores(sameArchetype, "ci_category_scores");

  const parsedNarrative = commNarrative
    ? communicationNarrativeSchema.safeParse(commNarrative)
    : null;

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
    personalityVector: sanitizePersonalityVector(personalityProfile?.personality_vector),
    corpusAvgPersonalityVector: computeAvgPersonalityVector(allPersonalityProfiles ?? []),
    communicationNarrative: parsedNarrative?.success ? parsedNarrative.data : null,
  };
}
