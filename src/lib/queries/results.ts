import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { deriveArchetype } from "@/lib/assessment/archetypes";
import {
  FACET_LABELS,
  ENTREPRENEURIAL_FACETS,
  type PersonalityFacet,
} from "@/lib/assessment/personality-bank";
import type {
  ResultsPageData,
  CategoryScore,
  PersonalityData,
  SignatureMove,
  RarestMove,
  GrowthEdge,
} from "@/lib/schemas/results";

// --- Raw JSONB types from the Python pipeline ---

type RawCategoryScore = {
  category: string;
  percentile: number;
  moves_present: number;
  moves_applicable: number;
  entrepreneur_mean: number;
  entrepreneur_std: number;
};

type RawMoveDetail = {
  move_key: string;
  move_name: string;
  category: string;
  present: boolean;
  applicable: boolean;
  entrepreneur_frequency: number;
  status: string;
};

type RawScoringResult = {
  headline_percentile: number;
  category_scores: RawCategoryScore[];
  move_details: RawMoveDetail[];
  summary_text: string;
  moves_present_total: number;
  moves_applicable_total: number;
  // PI uses n_entrepreneur_incidents, CI uses n_entrepreneur_episodes
  n_entrepreneur_incidents?: number;
  n_entrepreneur_episodes?: number;
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
      percentileSum: number;
      movesPresentMax: number;
      movesApplicableMax: number;
      entrepreneurMeanSum: number;
      entrepreneurStdSum: number;
      count: number;
    }
  >();

  for (const r of typed) {
    for (const cs of r.scoring_result.category_scores) {
      const existing = acc.get(cs.category);
      if (existing) {
        existing.percentileSum += cs.percentile;
        existing.movesPresentMax = Math.max(
          existing.movesPresentMax,
          cs.moves_present
        );
        existing.movesApplicableMax = Math.max(
          existing.movesApplicableMax,
          cs.moves_applicable
        );
        existing.entrepreneurMeanSum += cs.entrepreneur_mean;
        existing.entrepreneurStdSum += cs.entrepreneur_std;
        existing.count += 1;
      } else {
        acc.set(cs.category, {
          percentileSum: cs.percentile,
          movesPresentMax: cs.moves_present,
          movesApplicableMax: cs.moves_applicable,
          entrepreneurMeanSum: cs.entrepreneur_mean,
          entrepreneurStdSum: cs.entrepreneur_std,
          count: 1,
        });
      }
    }
  }

  // Preserve original category order from first response
  const firstCategories = typed[0].scoring_result.category_scores;
  return firstCategories.map((cs) => {
    const a = acc.get(cs.category)!;
    return {
      category: cs.category,
      percentile: Math.round((a.percentileSum / a.count) * 10) / 10,
      movesPresent: a.movesPresentMax,
      movesApplicable: a.movesApplicableMax,
      entrepreneurMean:
        Math.round((a.entrepreneurMeanSum / a.count) * 100) / 100,
      entrepreneurStd:
        Math.round((a.entrepreneurStdSum / a.count) * 100) / 100,
    };
  });
}

/** Union move details across responses: a move is "present" if demonstrated in either. */
function unionMoveDetails(responses: ScoredResponse[]): RawMoveDetail[] {
  const map = new Map<string, RawMoveDetail>();

  for (const r of responses) {
    for (const md of r.scoring_result.move_details) {
      const existing = map.get(md.move_key);
      if (!existing) {
        map.set(md.move_key, { ...md });
      } else if (md.present && !existing.present) {
        // Upgrade: demonstrated in this response but not the other
        map.set(md.move_key, { ...md });
      }
    }
  }

  return Array.from(map.values());
}

/** Extract signature moves (status === "impressive"), strip keys, cap at 5. */
function extractSignatureMoves(moves: RawMoveDetail[]): SignatureMove[] {
  return moves
    .filter((m) => m.status === "impressive")
    .sort((a, b) => a.entrepreneur_frequency - b.entrepreneur_frequency)
    .slice(0, 5)
    .map((m) => ({
      description: m.move_name,
      rarityPercent: Math.round(m.entrepreneur_frequency * 100),
      categoryName: m.category,
    }));
}

/** Find the single rarest present move. */
function extractRarestMove(moves: RawMoveDetail[]): RarestMove | null {
  const present = moves.filter((m) => m.present && m.applicable);
  if (present.length === 0) return null;

  const rarest = present.reduce((min, m) =>
    m.entrepreneur_frequency < min.entrepreneur_frequency ? m : min
  );

  // Convert frequency to human-readable fraction
  const freq = rarest.entrepreneur_frequency;
  const denominator = freq > 0 ? Math.round(1 / freq) : 100;
  const fraction = `1 in ${denominator}`;

  return {
    description: rarest.move_name,
    rarityFraction: fraction,
    categoryName: rarest.category,
  };
}

/** Extract growth edges (status === "gap"), strip keys, cap at 3. */
function extractGrowthEdges(moves: RawMoveDetail[]): GrowthEdge[] {
  return moves
    .filter((m) => m.status === "gap")
    .sort((a, b) => b.entrepreneur_frequency - a.entrepreneur_frequency)
    .slice(0, 3)
    .map((m) => ({
      description: m.move_name,
      categoryName: m.category,
    }));
}

/** Count categories above the entrepreneur average (percentile > 50). */
function countAboveAvg(categories: CategoryScore[]): number {
  return categories.filter((c) => c.percentile > 50).length;
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

  // 3. Fetch all scored responses
  const { data: responses, error: responsesError } = await supabase
    .from("student_responses")
    .select("vignette_type, scoring_result")
    .eq("session_id", session.id)
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

  // 6. Compute headline percentiles
  const piHeadline =
    piResponses.reduce(
      (sum, r) => sum + r.scoring_result.headline_percentile,
      0
    ) / piResponses.length;
  const ciHeadline =
    ciResponses.reduce(
      (sum, r) => sum + r.scoring_result.headline_percentile,
      0
    ) / ciResponses.length;
  const bqPercentile = (piHeadline + ciHeadline) / 2;

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
    c.percentile > best.percentile ? c : best
  );
  const weakest = allCategories.reduce((min, c) =>
    c.percentile < min.percentile ? c : min
  );

  // Corpus size from the first PI response (n_entrepreneur_incidents)
  const corpusSize =
    piResponses[0].scoring_result.n_entrepreneur_incidents ??
    ciResponses[0].scoring_result.n_entrepreneur_episodes ??
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

  return {
    applicant: {
      displayName: applicant.display_name ?? null,
      assessmentType: (session.assessment_type as "public" | "admissions") ?? "public",
    },
    overall: {
      bqPercentile: Math.round(bqPercentile * 10) / 10,
      piHeadlinePercentile: Math.round(piHeadline * 10) / 10,
      ciHeadlinePercentile: Math.round(ciHeadline * 10) / 10,
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
      strongestCategory: {
        name: strongest.category,
        percentile: strongest.percentile,
      },
      biggestGap: Math.round((strongest.percentile - weakest.percentile) * 10) / 10,
      corpusSize,
    },
    narrative: {
      piSummaries,
      ciSummaries,
    },
    personality,
  };
}
