import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { deriveArchetype } from "@/lib/assessment/archetypes";
import {
  FACET_LABELS,
  ENTREPRENEURIAL_FACETS,
  type PersonalityFacet,
} from "@/lib/assessment/personality-bank";
import {
  averageByCategory,
  PERSONALITY_DIMENSION_NAMES,
} from "@/lib/assessment/personality-dimensions";
import type { PersonalityVector } from "@/lib/assessment/personality-dimensions";
import type {
  ResultsPageData,
  CategoryScore,
  PersonalityData,
  EntrepreneurMatch,
  SignatureMove,
  RarestMove,
  GrowthEdge,
} from "@/lib/schemas/results";

// --- Raw JSONB types from the Python pipeline (consensus-based scoring) ---

type RawCategoryScore = {
  category: string;
  similarity_score: number;
  moves_matched: number;
  moves_scored: number;
  moves_missed: number;
  moves_excluded: number;
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

/** Extract signature moves: student demonstrated but NOT in consensus (unique insights). */
function extractSignatureMoves(moves: RawMoveDetail[]): SignatureMove[] {
  return moves
    .filter((m) => m.student_present && !m.in_consensus)
    .sort((a, b) => a.agreement_rate - b.agreement_rate)
    .slice(0, 3)
    .map((m) => ({
      description: m.move_name,
      agreementPercent: Math.round(m.agreement_rate * 100),
      categoryName: m.category,
    }));
}

/** Find the single rarest present move (lowest agreement rate where student demonstrated). */
function extractRarestMove(moves: RawMoveDetail[]): RarestMove | null {
  const present = moves.filter((m) => m.student_present);
  if (present.length === 0) return null;

  const rarest = present.reduce((min, m) =>
    m.agreement_rate < min.agreement_rate ? m : min
  );

  return {
    description: rarest.move_name,
    agreementPercent: Math.round(rarest.agreement_rate * 100),
    categoryName: rarest.category,
  };
}

/** Extract growth edges: in consensus but student missed (high-value gaps). */
function extractGrowthEdges(moves: RawMoveDetail[]): GrowthEdge[] {
  return moves
    .filter((m) => !m.student_present && m.in_consensus)
    .sort((a, b) => b.agreement_rate - a.agreement_rate)
    .slice(0, 3)
    .map((m) => ({
      description: m.move_name,
      categoryName: m.category,
    }));
}

/** Count categories above average (score > 50). */
function countAboveAvg(categories: CategoryScore[]): number {
  return categories.filter((c) => c.score > 50).length;
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

  // 2. Find their completed/scored session
  const { data: session, error: sessionError } = await supabase
    .from("assessment_sessions")
    .select("id, assessment_type")
    .eq("applicant_id", applicant.id)
    .in("status", ["completed", "scored"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (sessionError || !session) return null;

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

  // 6. Compute headline scores (already percentages from pipeline)
  const piHeadline =
    piResponses.reduce(
      (sum, r) => sum + r.scoring_result.headline_score,
      0
    ) / piResponses.length;
  const ciHeadline =
    ciResponses.reduce(
      (sum, r) => sum + r.scoring_result.headline_score,
      0
    ) / ciResponses.length;
  const bqScore = (piHeadline + ciHeadline) / 2;

  // 7. Union moves across all responses, then derive
  const allPiMoves = unionMoveDetails(piResponses);
  const allCiMoves = unionMoveDetails(ciResponses);
  const allMoves = [...allPiMoves, ...allCiMoves];

  const signatureMoves = extractSignatureMoves(allMoves);
  const rarestMove = extractRarestMove(allMoves);
  const growthEdges = extractGrowthEdges(allMoves);

  // 8. Archetype
  const archetype = deriveArchetype(piCategories, ciCategories);

  // 9. Stats
  const allCategories = [...piCategories, ...ciCategories];
  const strongest = allCategories.reduce((best, c) =>
    c.score > best.score ? c : best
  );
  const weakest = allCategories.reduce((min, c) =>
    c.score < min.score ? c : min
  );

  // Corpus size from the first PI response (track1_n_experts)
  const corpusSize =
    piResponses[0].scoring_result.track1_n_experts ??
    ciResponses[0].scoring_result.track1_n_experts ??
    274;

  // 10. Narratives
  const piSummaries = piResponses.map((r) => r.scoring_result.summary_text);
  const ciSummaries = ciResponses.map((r) => r.scoring_result.summary_text);

  // 11. Personality data (nullable -- only present when quiz was taken)
  let personality: PersonalityData | null = null;

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
    }
  }

  // 12. Entrepreneur personality match (nullable -- only present after pipeline matching)
  let entrepreneurMatch: EntrepreneurMatch | null = null;

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
    const { data: entrepreneurProfile } = await supabase
      .from("entrepreneur_personality_profiles")
      .select("personality_vector")
      .eq("entrepreneur_id", studentProfile.matched_entrepreneur_id)
      .single();

    const studentVector =
      (studentProfile.personality_vector as PersonalityVector | null) ?? {};
    const entrepreneurVector =
      (entrepreneurProfile?.personality_vector as PersonalityVector | null) ??
      {};

    // Average both vectors by 5 categories for radar chart
    const studentCategoryProfile = averageByCategory(studentVector);
    const entrepreneurCategoryProfile = averageByCategory(entrepreneurVector);

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

    entrepreneurMatch = {
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

  return {
    applicant: {
      displayName: applicant.display_name ?? null,
      assessmentType: (session.assessment_type as "public" | "admissions") ?? "public",
    },
    overall: {
      bqScore: Math.round(bqScore * 10) / 10,
      piHeadlineScore: Math.round(piHeadline * 10) / 10,
      ciHeadlineScore: Math.round(ciHeadline * 10) / 10,
    },
    piCategories,
    ciCategories,
    archetype,
    signatureMoves,
    rarestMove,
    growthEdges,
    stats: {
      piCategoriesAboveAvg: countAboveAvg(piCategories),
      ciCategoriesAboveAvg: countAboveAvg(ciCategories),
      totalCategories: allCategories.length,
      strongestCategory: {
        name: strongest.category,
        score: strongest.score,
      },
      biggestGap: Math.round((strongest.score - weakest.score) * 10) / 10,
      corpusSize,
    },
    narrative: {
      piSummaries,
      ciSummaries,
    },
    personality,
    entrepreneurMatch,
  };
}
