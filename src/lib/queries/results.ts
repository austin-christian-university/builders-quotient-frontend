import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import {
  FACET_LABELS,
  ENTREPRENEURIAL_FACETS,
  type PersonalityFacet,
} from "@/lib/assessment/personality-bank";
import {
  PERSONALITY_DIMENSION_KEYS,
} from "@/lib/assessment/personality-dimensions";
import {
  PI_CANONICAL_CATEGORIES,
  CI_CANONICAL_CATEGORIES,
  interpolateFromNeighbors,
} from "@/lib/assessment/scoring-categories";
import type { PersonalityVector } from "@/lib/assessment/personality-dimensions";
import {
  getIntelligenceNarrative,
  getCommunicationNarrative,
  getPersonalityNarrative,
} from "@/lib/assessment/narrative-templates";
import type {
  Archetype,
  ResultsPageData,
  CategoryScore,
  PersonalityData,
  NarrativeBlock,
  NarrativeMatch,
  CorpusAverage,
  RadarCategory,
} from "@/lib/schemas/results";

// --- Raw JSONB types from the Python pipeline (consensus-based scoring) ---

type RawCategoryScore = {
  category: string;
  similarity_score: number;
  moves_matched: number;
  moves_scored: number;
  moves_missed: number;
  moves_excluded: number;
  entrepreneur_mean?: number;
  entrepreneur_std?: number;
};

type RawMoveDetail = {
  move_key: string;
  move_name: string;
  category: string;
  student_present: boolean;
  in_consensus: boolean;
  agreement_rate: number;
};

type RawScoringResult = {
  headline_score: number;
  track1_category_scores: RawCategoryScore[];
  move_details: RawMoveDetail[];
  summary_text: string;
  track1_n_experts?: number;
};

type ScoredResponse = {
  vignette_type: "practical" | "creative";
  scoring_result: RawScoringResult;
};

// --- Helpers ---

/** Average category scores across multiple responses of the same type. */
function aggregateCategories(
  responses: ScoredResponse[],
  type: "practical" | "creative"
): CategoryScore[] {
  const typed = responses.filter((r) => r.vignette_type === type);
  if (typed.length === 0) return [];

  // Build a map of category -> accumulated values
  const acc = new Map<
    string,
    {
      scoreSum: number;
      movesMatchedMax: number;
      movesScoredMax: number;
      movesMissedMax: number;
      movesExcludedMax: number;
      count: number;
    }
  >();

  for (const r of typed) {
    if (!Array.isArray(r.scoring_result.track1_category_scores)) continue;
    for (const cs of r.scoring_result.track1_category_scores) {
      const existing = acc.get(cs.category);
      if (existing) {
        existing.scoreSum += cs.similarity_score * 100;
        existing.movesMatchedMax = Math.max(
          existing.movesMatchedMax,
          cs.moves_matched
        );
        existing.movesScoredMax = Math.max(
          existing.movesScoredMax,
          cs.moves_scored
        );
        existing.movesMissedMax = Math.max(
          existing.movesMissedMax,
          cs.moves_missed
        );
        existing.movesExcludedMax = Math.max(
          existing.movesExcludedMax,
          cs.moves_excluded
        );
        existing.count += 1;
      } else {
        acc.set(cs.category, {
          scoreSum: cs.similarity_score * 100,
          movesMatchedMax: cs.moves_matched,
          movesScoredMax: cs.moves_scored,
          movesMissedMax: cs.moves_missed,
          movesExcludedMax: cs.moves_excluded,
          count: 1,
        });
      }
    }
  }

  // Preserve original category order from first response
  const firstCategories =
    typed[0].scoring_result.track1_category_scores ?? [];
  return firstCategories.map((cs) => {
    const a = acc.get(cs.category)!;
    return {
      category: cs.category,
      score: Math.round((a.scoreSum / a.count) * 10) / 10,
      movesMatched: a.movesMatchedMax,
      movesScored: a.movesScoredMax,
      movesMissed: a.movesMissedMax,
      movesExcluded: a.movesExcludedMax,
    };
  });
}

/**
 * Extract corpus averages from raw category scores.
 * Returns null if no entrepreneur_mean data is available.
 */
function extractCorpusAverage(
  responses: ScoredResponse[],
  type: "practical" | "creative"
): CorpusAverage | null {
  const typed = responses.filter((r) => r.vignette_type === type);
  if (typed.length === 0) return null;

  // Accumulate entrepreneur_mean per category across responses
  const acc = new Map<string, { sum: number; count: number }>();
  let hasAnyMean = false;

  for (const r of typed) {
    if (!Array.isArray(r.scoring_result.track1_category_scores)) continue;
    for (const cs of r.scoring_result.track1_category_scores) {
      if (cs.entrepreneur_mean == null) continue;
      hasAnyMean = true;
      const existing = acc.get(cs.category);
      if (existing) {
        existing.sum += cs.entrepreneur_mean * 100;
        existing.count += 1;
      } else {
        acc.set(cs.category, { sum: cs.entrepreneur_mean * 100, count: 1 });
      }
    }
  }

  if (!hasAnyMean) return null;

  // Preserve original category order
  const firstCategories =
    typed[0].scoring_result.track1_category_scores ?? [];
  const categories = firstCategories
    .filter((cs) => acc.has(cs.category))
    .map((cs) => {
      const a = acc.get(cs.category)!;
      return {
        category: cs.category,
        averageScore: Math.round((a.sum / a.count) * 10) / 10,
      };
    });

  return categories.length > 0 ? { categories } : null;
}

/**
 * Compute bidirectional radar data from move_details.
 * Per category: studentScore = fraction of moves demonstrated,
 * entrepreneurScore = mean agreement_rate. Both 0–1.
 * Averaged across vignettes of the same type.
 *
 * Always returns exactly `canonicalCategories.length` entries in
 * canonical order. Missing categories are interpolated from neighbors.
 */
function computeRadarFromMoveDetails(
  responses: ScoredResponse[],
  type: "practical" | "creative",
  canonicalCategories: readonly string[]
): RadarCategory[] {
  const typed = responses.filter((r) => r.vignette_type === type);
  if (typed.length === 0) {
    return canonicalCategories.map((category) => ({
      category,
      studentScore: 0,
      entrepreneurScore: 0,
    }));
  }

  // Per-vignette: category -> { studentScore, entrepreneurScore }
  const vignetteResults: Map<
    string,
    { studentScore: number; entrepreneurScore: number }
  >[] = [];

  for (const r of typed) {
    if (!Array.isArray(r.scoring_result.move_details)) continue;

    // Group moves by category
    const byCategory = new Map<string, RawMoveDetail[]>();
    for (const md of r.scoring_result.move_details) {
      const arr = byCategory.get(md.category);
      if (arr) arr.push(md);
      else byCategory.set(md.category, [md]);
    }

    const catScores = new Map<
      string,
      { studentScore: number; entrepreneurScore: number }
    >();
    for (const [category, moves] of byCategory) {
      const studentPresent = moves.filter((m) => m.student_present).length;
      const studentScore = studentPresent / moves.length;
      const entrepreneurScore =
        moves.reduce((sum, m) => sum + m.agreement_rate, 0) / moves.length;
      catScores.set(category, { studentScore, entrepreneurScore });
    }

    vignetteResults.push(catScores);
  }

  if (vignetteResults.length === 0) {
    return canonicalCategories.map((category) => ({
      category,
      studentScore: 0,
      entrepreneurScore: 0,
    }));
  }

  // Average across vignettes per category (only for categories with data)
  const scored = new Map<
    string,
    { studentScore: number; entrepreneurScore: number }
  >();
  for (const category of canonicalCategories) {
    let studentSum = 0;
    let entrepreneurSum = 0;
    let count = 0;
    for (const vr of vignetteResults) {
      const scores = vr.get(category);
      if (scores) {
        studentSum += scores.studentScore;
        entrepreneurSum += scores.entrepreneurScore;
        count++;
      }
    }
    if (count > 0) {
      scored.set(category, {
        studentScore: studentSum / count,
        entrepreneurScore: entrepreneurSum / count,
      });
    }
  }

  // Build index-based maps for interpolation
  const studentScoredMap = new Map<number, number>();
  const entrepreneurScoredMap = new Map<number, number>();
  for (let i = 0; i < canonicalCategories.length; i++) {
    const s = scored.get(canonicalCategories[i]);
    if (s) {
      studentScoredMap.set(i, s.studentScore);
      entrepreneurScoredMap.set(i, s.entrepreneurScore);
    }
  }

  const n = canonicalCategories.length;

  // Emit all canonical categories in order, interpolating missing ones
  return canonicalCategories.map((category, i) => {
    const existing = scored.get(category);
    if (existing) {
      return { category, ...existing };
    }
    return {
      category,
      studentScore: interpolateFromNeighbors(i, studentScoredMap, n),
      entrepreneurScore: interpolateFromNeighbors(
        i,
        entrepreneurScoredMap,
        n
      ),
    };
  });
}

// --- Main query ---

/**
 * Fetches all results data for a given token.
 * Returns null if the token is invalid, session is not found, or data is incomplete.
 */
export async function getResultsByToken(
  token: string
): Promise<ResultsPageData | null> {
  const supabase = createServiceClient();

  // 1. Look up applicant by results_token
  const { data: applicant, error: applicantError } = await supabase
    .from("applicants")
    .select("id, display_name, lead_type")
    .eq("results_token", token)
    .single();

  if (applicantError || !applicant) return null;

  // 2. Find their scored/completed session (prefer "scored" over "completed")
  const { data: scoredSession } = await supabase
    .from("assessment_sessions")
    .select("id, assessment_type, personality_completed_at, archetype_name, archetype_tagline, archetype_description, archetype_based_on_category, archetype_variant")
    .eq("applicant_id", applicant.id)
    .eq("status", "scored")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const session =
    scoredSession ??
    (
      await supabase
        .from("assessment_sessions")
        .select("id, assessment_type, personality_completed_at, archetype_name, archetype_tagline, archetype_description, archetype_based_on_category, archetype_variant")
        .eq("applicant_id", applicant.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
    ).data;

  if (!session) return null;

  // 3. Fetch scored responses (phase 1 only — pipeline writes combined score there)
  const { data: responses, error: responsesError } = await supabase
    .from("student_responses")
    .select("vignette_type, scoring_result")
    .eq("session_id", session.id)
    .eq("response_phase", 1)
    .not("scoring_result", "is", null);

  if (responsesError || !responses || responses.length === 0) return null;

  // 4. Validate: need at least 2 PI + 2 CI scored responses
  const scored = responses as ScoredResponse[];
  const piResponses = scored.filter((r) => r.vignette_type === "practical");
  const ciResponses = scored.filter((r) => r.vignette_type === "creative");

  if (piResponses.length < 2 || ciResponses.length < 2) return null;

  // 5. Aggregate category scores
  const piCategories = aggregateCategories(scored, "practical");
  const ciCategories = aggregateCategories(scored, "creative");

  // 6. Extract corpus averages from entrepreneur_mean in JSONB (graceful degradation)
  const piCorpusAverage = extractCorpusAverage(scored, "practical");
  const ciCorpusAverage = extractCorpusAverage(scored, "creative");

  // 6b. Compute bidirectional radar data from move_details (always 12 categories)
  const piRadar = computeRadarFromMoveDetails(scored, "practical", PI_CANONICAL_CATEGORIES);
  const ciRadar = computeRadarFromMoveDetails(scored, "creative", CI_CANONICAL_CATEGORIES);

  // 7. Archetype — read from DB
  const archetype: Archetype = {
    name: (session.archetype_name as string) ?? "Unclassified",
    tagline: (session.archetype_tagline as string) ?? "",
    description: (session.archetype_description as string) ?? "",
    ...(session.archetype_based_on_category
      ? { basedOnCategory: session.archetype_based_on_category as string }
      : {}),
    variant: (session.archetype_variant as "pi" | "ci" | "balanced") ?? "balanced",
  };

  // 8. Intelligence narrative
  const intelligenceNarrative = getIntelligenceNarrative(piCategories, ciCategories);

  // 9. Pipeline-generated narrative summaries (kept for reference)
  const piSummaries = piResponses.map((r) => r.scoring_result.summary_text);
  const ciSummaries = ciResponses.map((r) => r.scoring_result.summary_text);

  // 10. Personality data (nullable -- only present when quiz was taken)
  let personality: PersonalityData | null = null;
  let personalityNarrative: NarrativeBlock[] = [];

  const { data: personalityScores } = await supabase
    .from("personality_scores")
    .select("facet, rescaled_score, item_count")
    .eq("session_id", session.id);

  if (personalityScores && personalityScores.length > 0) {
    // Get summary from session row
    const { data: sessionRow } = await supabase
      .from("assessment_sessions")
      .select("personality_summary")
      .eq("id", session.id)
      .single();

    const summary = sessionRow?.personality_summary as {
      globalIndexRescaled?: number;
      gritRescaled?: number;
      attentionFail?: boolean;
      infrequencyFail?: boolean;
    } | null;

    if (summary) {
      // Filter out AC (attention checks), keep entrepreneurial facets + GR
      const displayFacets = new Set<string>([...ENTREPRENEURIAL_FACETS, "GR"]);
      const facetScores = personalityScores
        .filter((s) => displayFacets.has(s.facet))
        .map((s) => ({
          facet: s.facet,
          label: FACET_LABELS[s.facet as PersonalityFacet] ?? s.facet,
          rescaledScore: Math.round(s.rescaled_score * 10) / 10,
          itemCount: s.item_count,
        }));

      personality = {
        facetScores,
        summary: {
          globalIndexRescaled: Math.round((summary.globalIndexRescaled ?? 0) * 10) / 10,
          gritRescaled: Math.round((summary.gritRescaled ?? 0) * 10) / 10,
          attentionFail: summary.attentionFail ?? false,
          infrequencyFail: summary.infrequencyFail ?? false,
        },
      };

      // Generate personality narrative from facet scores
      personalityNarrative = getPersonalityNarrative(facetScores);
    }
  }

  // 11. Communication match (narrative-driven) + communication profile
  let communicationMatch: NarrativeMatch | null = null;
  let communicationProfile: { category: string; value: number }[] | null = null;
  let communicationCorpusAverage: CorpusAverage | null = null;
  let communicationNarrative: NarrativeBlock[] = [];

  const { data: studentPersonalityProfile } = await supabase
    .from("student_personality_profiles")
    .select("matched_entrepreneur_id, matched_entrepreneur_name, matched_bio_snippet, top_5_matches, personality_vector")
    .eq("session_id", session.id)
    .single();

  // Build communication radar profile, corpus average, and narrative from student vector
  if (studentPersonalityProfile) {
    const studentVector =
      (studentPersonalityProfile.personality_vector as PersonalityVector | null) ?? {};

    communicationProfile = PERSONALITY_DIMENSION_KEYS
      .filter((k) => studentVector[k] != null)
      .map((k) => ({
        category: k,
        value: studentVector[k],
      }));

    if (communicationProfile.length === 0) {
      communicationProfile = null;
    }

    // Generate communication narrative from full 20-dim profile
    if (communicationProfile) {
      communicationNarrative = getCommunicationNarrative(communicationProfile);
    }

    // Compute corpus average across all entrepreneur personality vectors
    if (communicationProfile) {
      const { data: allProfiles } = await supabase
        .from("entrepreneur_personality_profiles")
        .select("personality_vector")
        .not("personality_vector", "is", null);

      if (allProfiles && allProfiles.length > 0) {
        const dimSums = new Map<string, { sum: number; count: number }>();

        for (const row of allProfiles) {
          const vec = row.personality_vector as PersonalityVector | null;
          if (!vec) continue;
          for (const k of PERSONALITY_DIMENSION_KEYS) {
            if (vec[k] == null) continue;
            const existing = dimSums.get(k);
            if (existing) {
              existing.sum += vec[k];
              existing.count += 1;
            } else {
              dimSums.set(k, { sum: vec[k], count: 1 });
            }
          }
        }

        const corpusCategories = communicationProfile
          .filter((p) => dimSums.has(p.category))
          .map((p) => {
            const a = dimSums.get(p.category)!;
            return {
              category: p.category,
              averageScore: Math.round((a.sum / a.count) * 100 * 10) / 10,
            };
          });

        if (corpusCategories.length > 0) {
          communicationCorpusAverage = { categories: corpusCategories };
        }
      }
    }
  }

  // Build communication match narrative
  if (studentPersonalityProfile?.matched_entrepreneur_id) {
    const top5Comm = (studentPersonalityProfile.top_5_matches as { entrepreneur_id: string; name: string }[] | null) ?? [];
    const runnerUpEntriesComm = top5Comm.slice(1, 3); // 2 runners-up
    const allCommEntrepreneurIds = [
      studentPersonalityProfile.matched_entrepreneur_id,
      ...runnerUpEntriesComm.map(e => e.entrepreneur_id),
    ];

    const [{ data: commEntrepreneurs }, { data: commNarratives }] = await Promise.all([
      supabase
        .from("entrepreneurs")
        .select("id, name, companies, industries, bio_narrative")
        .in("id", allCommEntrepreneurIds),
      supabase
        .from("entrepreneur_communication_narratives")
        .select("entrepreneur_id, communication_style, signature_moves, strengths, blindspots")
        .in("entrepreneur_id", allCommEntrepreneurIds),
    ]);

    function buildCommNarrative(
      entrepreneurId: string,
      entrepreneurName: string,
      fallbackBioSnippet: string | null,
    ) {
      const ent = commEntrepreneurs?.find(e => e.id === entrepreneurId);
      const narrative = commNarratives?.find(n => n.entrepreneur_id === entrepreneurId);

      return {
        entrepreneurName: ent?.name ?? entrepreneurName,
        entrepreneurId,
        companies: (ent?.companies as string[]) ?? [],
        industries: (ent?.industries as string[]) ?? [],
        bioNarrative: (ent?.bio_narrative as string) ?? null,
        fallbackBioSnippet,
        domainStyle: (narrative?.communication_style as string) ?? null,
        signatureMoves: (narrative?.signature_moves as { title: string; description: string }[]) ?? [],
        strengths: (narrative?.strengths as string) ?? null,
        blindspots: (narrative?.blindspots as string) ?? null,
      };
    }

    communicationMatch = {
      primary: buildCommNarrative(
        studentPersonalityProfile.matched_entrepreneur_id,
        studentPersonalityProfile.matched_entrepreneur_name,
        studentPersonalityProfile.matched_bio_snippet ?? null,
      ),
      runnersUp: runnerUpEntriesComm.map(entry =>
        buildCommNarrative(entry.entrepreneur_id, entry.name, null)
      ),
    };
  }

  // 12. Reasoning match (narrative-driven)
  let reasoningMatch: NarrativeMatch | null = null;

  const { data: reasoningProfile } = await supabase
    .from("student_reasoning_profiles")
    .select("matched_entrepreneur_id, matched_entrepreneur_name, matched_bio_snippet, top_5_matches")
    .eq("session_id", session.id)
    .single();

  if (reasoningProfile?.matched_entrepreneur_id) {
    const top5Reasoning = (reasoningProfile.top_5_matches as { entrepreneur_id: string; name: string }[] | null) ?? [];
    const runnerUpEntriesReasoning = top5Reasoning.slice(1, 3); // 2 runners-up
    const allReasoningEntrepreneurIds = [
      reasoningProfile.matched_entrepreneur_id,
      ...runnerUpEntriesReasoning.map(e => e.entrepreneur_id),
    ];

    const [{ data: reasoningEntrepreneurs }, { data: reasoningNarratives }] = await Promise.all([
      supabase
        .from("entrepreneurs")
        .select("id, name, companies, industries, bio_narrative")
        .in("id", allReasoningEntrepreneurIds),
      supabase
        .from("entrepreneur_reasoning_narratives")
        .select("entrepreneur_id, reasoning_style, signature_moves, strengths, blindspots")
        .in("entrepreneur_id", allReasoningEntrepreneurIds),
    ]);

    function buildReasoningNarrative(
      entrepreneurId: string,
      entrepreneurName: string,
      fallbackBioSnippet: string | null,
    ) {
      const ent = reasoningEntrepreneurs?.find(e => e.id === entrepreneurId);
      const narrative = reasoningNarratives?.find(n => n.entrepreneur_id === entrepreneurId);

      return {
        entrepreneurName: ent?.name ?? entrepreneurName,
        entrepreneurId,
        companies: (ent?.companies as string[]) ?? [],
        industries: (ent?.industries as string[]) ?? [],
        bioNarrative: (ent?.bio_narrative as string) ?? null,
        fallbackBioSnippet,
        domainStyle: (narrative?.reasoning_style as string) ?? null,
        signatureMoves: (narrative?.signature_moves as { title: string; description: string }[]) ?? [],
        strengths: (narrative?.strengths as string) ?? null,
        blindspots: (narrative?.blindspots as string) ?? null,
      };
    }

    reasoningMatch = {
      primary: buildReasoningNarrative(
        reasoningProfile.matched_entrepreneur_id,
        reasoningProfile.matched_entrepreneur_name,
        reasoningProfile.matched_bio_snippet ?? null,
      ),
      runnersUp: runnerUpEntriesReasoning.map(entry =>
        buildReasoningNarrative(entry.entrepreneur_id, entry.name, null)
      ),
    };
  }

  return {
    applicant: {
      displayName: applicant.display_name ?? null,
      assessmentType: (session.assessment_type as "public" | "admissions") ?? "public",
      leadType: (applicant.lead_type as "prospective_student" | "general_interest") ?? null,
      personalityCompleted: !!session.personality_completed_at,
    },
    piCategories,
    ciCategories,
    piRadar,
    ciRadar,
    piCorpusAverage,
    ciCorpusAverage,
    archetype,
    intelligenceNarrative,
    reasoningMatch,
    communicationProfile,
    communicationCorpusAverage,
    communicationNarrative,
    communicationMatch,
    personality,
    personalityNarrative,
    narrative: {
      piSummaries,
      ciSummaries,
    },
  };
}
