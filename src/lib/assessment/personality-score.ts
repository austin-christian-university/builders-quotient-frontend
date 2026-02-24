import "server-only";

import {
  ENTREPRENEURIAL_FACETS,
  PERSONALITY_FACETS,
  PERSONALITY_ITEMS,
  type PersonalityFacet,
  type LikertValue,
} from "@/lib/assessment/personality-bank";

export interface PersonalityResponseInput {
  itemId: string;
  facet: PersonalityFacet;
  value: LikertValue;
  reverse: boolean;
}

export interface FacetScore {
  facet: PersonalityFacet;
  itemCount: number;
  mean: number;
  rescaled: number;
}

export interface PersonalityScoreSummary {
  facets: Record<string, FacetScore>;
  globalIndex: number;
  globalIndexRescaled: number;
  gritMean: number;
  gritRescaled: number;
  attentionFail: boolean;
  infrequencyFail: boolean;
  straightLineFlag: boolean;
  missingItemCount: number;
}

function rescale(mean: number): number {
  return ((mean - 1) / 4) * 100;
}

function reverseScore(value: LikertValue): LikertValue {
  return (6 - value) as LikertValue;
}

export function computePersonalityScores(
  responses: PersonalityResponseInput[]
): PersonalityScoreSummary {
  const facetBuckets = new Map<PersonalityFacet, LikertValue[]>(
    PERSONALITY_FACETS.map((facet) => [facet, []])
  );

  const adjustedValues: LikertValue[] = [];
  const rawValues: LikertValue[] = [];
  const responseMap = new Map<string, LikertValue>();

  for (const response of responses) {
    const adjusted = response.reverse
      ? reverseScore(response.value)
      : response.value;
    const bucket = facetBuckets.get(response.facet);
    if (bucket) {
      bucket.push(adjusted);
    }
    adjustedValues.push(adjusted);
    rawValues.push(response.value);
    responseMap.set(response.itemId, adjusted);
  }

  const facets: Record<string, FacetScore> = {};

  for (const facet of PERSONALITY_FACETS) {
    const values = facetBuckets.get(facet) ?? [];
    const itemCount = values.length;
    const mean = itemCount
      ? values.reduce((sum, v) => sum + v, 0) / itemCount
      : 0;
    const rescaled = itemCount ? rescale(mean) : 0;

    facets[facet] = { facet, itemCount, mean, rescaled };
  }

  const attentionResponse = responseMap.get("AC01");
  const infrequencyResponse = responseMap.get("AC02");

  const attentionFail =
    attentionResponse !== undefined ? attentionResponse < 4 : false;
  const infrequencyFail =
    infrequencyResponse !== undefined ? infrequencyResponse > 3 : false;

  const globalFacetScores = ENTREPRENEURIAL_FACETS.map(
    (facet) => facets[facet]
  ).filter((score) => score && score.itemCount > 0);

  const globalIndex = globalFacetScores.length
    ? globalFacetScores.reduce((sum, score) => sum + score.mean, 0) /
      globalFacetScores.length
    : 0;
  const globalIndexRescaled = rescale(globalIndex);

  const gritScore = facets["GR"] ?? {
    mean: 0,
    rescaled: 0,
    itemCount: 0,
    facet: "GR" as PersonalityFacet,
  };
  const gritMean = gritScore.mean;
  const gritRescaled = gritScore.itemCount ? rescale(gritMean) : 0;

  const straightLineFlag =
    rawValues.length >= 10 && new Set(rawValues).size === 1;

  const missingItemCount = PERSONALITY_ITEMS.reduce(
    (count, item) => (responseMap.has(item.id) ? count : count + 1),
    0
  );

  return {
    facets,
    globalIndex,
    globalIndexRescaled,
    gritMean,
    gritRescaled,
    attentionFail,
    infrequencyFail,
    straightLineFlag,
    missingItemCount,
  };
}
