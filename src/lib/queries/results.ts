import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { deriveArchetype } from "@/lib/assessment/archetypes";
import {
  FACET_LABELS,
  ENTREPRENEURIAL_FACETS,
  type PersonalityFacet,
} from "@/lib/assessment/personality-bank";
import {
  PERSONALITY_DIMENSION_NAMES,
  PERSONALITY_DIMENSION_KEYS,
} from "@/lib/assessment/personality-dimensions";
import type { PersonalityVector } from "@/lib/assessment/personality-dimensions";
import {
  getIntelligenceNarrative,
  getCommunicationNarrative,
  getPersonalityNarrative,
} from "@/lib/assessment/narrative-templates";
import type {
  ResultsPageData,
  CategoryScore,
  PersonalityData,
  EntrepreneurMatch,
  NarrativeBlock,
  CorpusAverage,
  RadarCategory,
  ReasoningMatch,
  MatchRunnerUp,
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

/** Union move details across responses: a move is "present" if demonstrated in either. */
function unionMoveDetails(responses: ScoredResponse[]): RawMoveDetail[] {
  const map = new Map<string, RawMoveDetail>();

  for (const r of responses) {
    if (!Array.isArray(r.scoring_result.move_details)) continue;
    for (const md of r.scoring_result.move_details) {
      const existing = map.get(md.move_key);
      if (!existing) {
        map.set(md.move_key, { ...md });
      } else if (md.student_present && !existing.student_present) {
        // Upgrade: demonstrated in this response but not the other
        map.set(md.move_key, { ...md });
      }
    }
  }

  return Array.from(map.values());
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
 */
function computeRadarFromMoveDetails(
  responses: ScoredResponse[],
  type: "practical" | "creative"
): RadarCategory[] {
  const typed = responses.filter((r) => r.vignette_type === type);
  if (typed.length === 0) return [];

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

  if (vignetteResults.length === 0) return [];

  // Collect all categories seen across vignettes
  const allCategories = new Set<string>();
  for (const vr of vignetteResults) {
    for (const cat of vr.keys()) allCategories.add(cat);
  }

  // Average across vignettes per category
  const result: RadarCategory[] = [];
  for (const category of allCategories) {
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
      result.push({
        category,
        studentScore: studentSum / count,
        entrepreneurScore: entrepreneurSum / count,
      });
    }
  }

  // Preserve category order from first response's move_details
  const firstMoveDetails = typed[0].scoring_result.move_details ?? [];
  const categoryOrder: string[] = [];
  const seen = new Set<string>();
  for (const md of firstMoveDetails) {
    if (!seen.has(md.category)) {
      categoryOrder.push(md.category);
      seen.add(md.category);
    }
  }
  result.sort((a, b) => {
    const ai = categoryOrder.indexOf(a.category);
    const bi = categoryOrder.indexOf(b.category);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return result;
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
    .select("id, assessment_type")
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
        .select("id, assessment_type")
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

  // 6b. Compute bidirectional radar data from move_details
  const piRadar = computeRadarFromMoveDetails(scored, "practical");
  const ciRadar = computeRadarFromMoveDetails(scored, "creative");

  // 7. Archetype
  const archetype = deriveArchetype(piCategories, ciCategories);

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

  // 11. Communication match (was entrepreneurMatch) + communication profile
  let communicationMatch: EntrepreneurMatch | null = null;
  let communicationProfile: { category: string; value: number }[] | null = null;
  let communicationCorpusAverage: CorpusAverage | null = null;
  let communicationNarrative: NarrativeBlock[] = [];

  const { data: studentProfile } = await supabase
    .from("student_personality_profiles")
    .select(
      "matched_entrepreneur_id, matched_entrepreneur_name, matched_cosine_similarity, matched_bio_snippet, top_5_matches, personality_vector",
    )
    .eq("session_id", session.id)
    .single();

  if (studentProfile?.matched_entrepreneur_id) {
    // Fetch entrepreneur details
    const { data: entrepreneur } = await supabase
      .from("entrepreneurs")
      .select("category, companies, industries")
      .eq("id", studentProfile.matched_entrepreneur_id)
      .single();

    // Fetch entrepreneur's personality vector for comparison
    const { data: entrepreneurProfileRow } = await supabase
      .from("entrepreneur_personality_profiles")
      .select("personality_vector")
      .eq("entrepreneur_id", studentProfile.matched_entrepreneur_id)
      .single();

    const studentVector =
      (studentProfile.personality_vector as PersonalityVector | null) ?? {};
    const entrepreneurVector =
      (entrepreneurProfileRow?.personality_vector as PersonalityVector | null) ??
      {};

    // Build full 20-dim communication profile from student vector
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

    // Build full 20-dim profiles for radar chart comparison
    const studentCategoryProfile = PERSONALITY_DIMENSION_KEYS
      .filter((k) => studentVector[k] != null)
      .map((k) => ({ category: k, value: studentVector[k] }));
    const entrepreneurCategoryProfile = PERSONALITY_DIMENSION_KEYS
      .filter((k) => entrepreneurVector[k] != null)
      .map((k) => ({ category: k, value: entrepreneurVector[k] }));

    // Top 3 shared traits: smallest absolute difference where both score notably
    const dimensionDiffs = Object.keys(studentVector)
      .filter((k) => studentVector[k] != null && entrepreneurVector[k] != null)
      .map((k) => ({
        key: k,
        name: PERSONALITY_DIMENSION_NAMES[k] ?? k,
        studentValue: studentVector[k],
        entrepreneurValue: entrepreneurVector[k],
        diff: Math.abs(studentVector[k] - entrepreneurVector[k]),
        avgValue: (studentVector[k] + entrepreneurVector[k]) / 2,
      }));

    const topSharedTraits = dimensionDiffs
      .slice()
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 3)
      .map((d) => ({ name: d.name, value: Math.round(d.avgValue * 100) }));

    const biggestDifferences = dimensionDiffs
      .slice()
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 3)
      .map((d) => ({
        name: d.name,
        studentValue: Math.round(d.studentValue * 100),
        entrepreneurValue: Math.round(d.entrepreneurValue * 100),
      }));

    // Runners-up from top_5_matches (skip the first which is the primary match)
    const top5 =
      (studentProfile.top_5_matches as
        | { entrepreneur_id: string; name: string; cosine_similarity: number }[]
        | null) ?? [];
    const runnersUp = top5.slice(1, 5).map((e) => ({
      name: e.name,
      similarity: Math.round(e.cosine_similarity * 100),
    }));

    communicationMatch = {
      entrepreneurName: studentProfile.matched_entrepreneur_name,
      entrepreneurId: studentProfile.matched_entrepreneur_id,
      cosineSimilarity: studentProfile.matched_cosine_similarity,
      bioSnippet: studentProfile.matched_bio_snippet ?? null,
      category: entrepreneur?.category ?? "entrepreneur",
      companies: (entrepreneur?.companies as string[]) ?? [],
      industries: (entrepreneur?.industries as string[]) ?? [],
      studentProfile: studentCategoryProfile,
      entrepreneurProfile: entrepreneurCategoryProfile,
      topSharedTraits,
      biggestDifferences,
      runnersUp,
    };
  }

  // 12. Reasoning match (intelligence-based entrepreneur matching)
  let reasoningMatch: ReasoningMatch | null = null;

  const { data: reasoningProfile } = await supabase
    .from("student_reasoning_profiles")
    .select(
      "matched_entrepreneur_id, matched_entrepreneur_name, matched_combined_similarity, matched_pi_similarity, matched_ci_similarity, matched_bio_snippet, top_5_matches"
    )
    .eq("session_id", session.id)
    .single();

  if (reasoningProfile?.matched_entrepreneur_id) {
    // Fetch entrepreneur details
    const { data: matchedEntrepreneur } = await supabase
      .from("entrepreneurs")
      .select("category, companies, industries")
      .eq("id", reasoningProfile.matched_entrepreneur_id)
      .single();

    // Build move-key → category mapping from scored PI responses
    const moveToCategoryMap = new Map<string, string>();
    for (const r of piResponses) {
      if (Array.isArray(r.scoring_result.move_details)) {
        for (const md of r.scoring_result.move_details) {
          if (!moveToCategoryMap.has(md.move_key)) {
            moveToCategoryMap.set(md.move_key, md.category);
          }
        }
      }
    }

    // Student category scores from piRadar (move_details-based, 0-1 → 0-100)
    const studentCategoryScores = piRadar.map((rc) => ({
      category: rc.category,
      score: Math.round(rc.studentScore * 100 * 10) / 10,
    }));

    // Fetch matched entrepreneur's global reasoning profile
    const { data: entrepreneurReasoningRow } = await supabase
      .from("entrepreneur_reasoning_profiles")
      .select("reasoning_move_probabilities")
      .eq("entrepreneur_id", reasoningProfile.matched_entrepreneur_id)
      .eq("situation_type", "global")
      .single();

    // Helper: compute per-category scores from move probabilities
    function computeCategoryScoresFromMoveProbs(
      moveProbs: Record<string, number>,
      categoryOrder: { category: string }[]
    ): { category: string; score: number }[] {
      const catAcc = new Map<string, { sum: number; count: number }>();
      for (const [moveKey, prob] of Object.entries(moveProbs)) {
        const cat = moveToCategoryMap.get(moveKey);
        if (!cat) continue;
        const existing = catAcc.get(cat);
        if (existing) {
          existing.sum += prob;
          existing.count += 1;
        } else {
          catAcc.set(cat, { sum: prob, count: 1 });
        }
      }
      return categoryOrder.map((sc) => {
        const acc = catAcc.get(sc.category);
        return {
          category: sc.category,
          score: acc ? Math.round((acc.sum / acc.count) * 100 * 10) / 10 : 0,
        };
      });
    }

    // Compute entrepreneur category scores
    const entrepreneurCategoryScores = entrepreneurReasoningRow?.reasoning_move_probabilities
      ? computeCategoryScoresFromMoveProbs(
          entrepreneurReasoningRow.reasoning_move_probabilities as Record<string, number>,
          studentCategoryScores
        )
      : studentCategoryScores.map((sc) => ({ category: sc.category, score: 0 }));

    // Top shared strengths: categories where both score similarly
    const categoryDiffs = studentCategoryScores.map((sc, i) => ({
      category: sc.category,
      studentScore: sc.score,
      entrepreneurScore: entrepreneurCategoryScores[i]?.score ?? 0,
      diff: Math.abs(sc.score - (entrepreneurCategoryScores[i]?.score ?? 0)),
      avgScore: (sc.score + (entrepreneurCategoryScores[i]?.score ?? 0)) / 2,
    }));

    const topSharedStrengths = categoryDiffs
      .slice()
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 3)
      .map((d) => ({ name: d.category, value: Math.round(d.avgScore) }));

    const biggestDifferences = categoryDiffs
      .slice()
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 3)
      .map((d) => ({
        name: d.category,
        studentValue: Math.round(d.studentScore),
        entrepreneurValue: Math.round(d.entrepreneurScore),
      }));

    // Runners-up from top_5_matches (skip first = primary match)
    const top5Reasoning =
      (reasoningProfile.top_5_matches as
        | {
            entrepreneur_id: string;
            name: string;
            combined_similarity: number;
            pi_similarity: number;
            ci_similarity: number;
          }[]
        | null) ?? [];
    const runnerUpEntries = top5Reasoning.slice(1, 5);
    const runnerUpIds = runnerUpEntries.map((e) => e.entrepreneur_id);

    let runnersUp: MatchRunnerUp[] = [];

    if (runnerUpIds.length > 0) {
      const [{ data: runnerUpEntrepreneurs }, { data: runnerUpReasoningProfiles }] =
        await Promise.all([
          supabase
            .from("entrepreneurs")
            .select("id, category, companies, industries")
            .in("id", runnerUpIds),
          supabase
            .from("entrepreneur_reasoning_profiles")
            .select("entrepreneur_id, reasoning_move_probabilities")
            .in("entrepreneur_id", runnerUpIds)
            .eq("situation_type", "global"),
        ]);

      runnersUp = runnerUpEntries.map((entry) => {
        const entDetails = runnerUpEntrepreneurs?.find(
          (e) => e.id === entry.entrepreneur_id
        );
        const entReasoning = runnerUpReasoningProfiles?.find(
          (r) => r.entrepreneur_id === entry.entrepreneur_id
        );

        const categoryScores = entReasoning?.reasoning_move_probabilities
          ? computeCategoryScoresFromMoveProbs(
              entReasoning.reasoning_move_probabilities as Record<string, number>,
              studentCategoryScores
            )
          : [];

        return {
          entrepreneurName: entry.name,
          bioSnippet: null,
          companies: (entDetails?.companies as string[]) ?? [],
          industries: (entDetails?.industries as string[]) ?? [],
          categoryScores,
        };
      });
    }

    reasoningMatch = {
      entrepreneurName: reasoningProfile.matched_entrepreneur_name,
      bioSnippet: reasoningProfile.matched_bio_snippet ?? null,
      companies: (matchedEntrepreneur?.companies as string[]) ?? [],
      industries: (matchedEntrepreneur?.industries as string[]) ?? [],
      studentCategoryScores,
      entrepreneurCategoryScores,
      topSharedStrengths,
      biggestDifferences,
      runnersUp,
    };
  }

  return {
    applicant: {
      displayName: applicant.display_name ?? null,
      assessmentType: (session.assessment_type as "public" | "admissions") ?? "public",
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
