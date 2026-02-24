"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import {
  personalityPageSchema,
  personalitySubmitSchema,
} from "@/lib/schemas/personality";
import { PERSONALITY_ITEMS } from "@/lib/assessment/personality-bank";
import {
  computePersonalityScores,
  type PersonalityResponseInput,
} from "@/lib/assessment/personality-score";

export async function savePersonalityPage(input: unknown): Promise<{
  success: boolean;
  savedCount?: number;
  error?: string;
}> {
  const parsed = personalityPageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { sessionId, responses } = parsed.data;

  const cookieSessionId = await readSessionCookie();
  if (cookieSessionId !== sessionId) {
    return { success: false, error: "Session mismatch" };
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // Upsert responses (ON CONFLICT session_id, item_id)
  const rows = responses.map((r) => ({
    session_id: sessionId,
    item_id: r.itemId,
    facet: r.facet,
    response_value: r.value,
    reverse_scored: r.reverse,
    created_at: now,
  }));

  const { error: upsertError } = await supabase
    .from("personality_responses")
    .upsert(rows, { onConflict: "session_id,item_id" });

  if (upsertError) {
    return { success: false, error: "Failed to save responses" };
  }

  // On first save, set personality_started_at
  await supabase
    .from("assessment_sessions")
    .update({ personality_started_at: now })
    .eq("id", sessionId)
    .is("personality_started_at", null);

  return { success: true, savedCount: responses.length };
}

export async function submitPersonalityQuiz(input: unknown): Promise<{
  success: boolean;
  error?: string;
}> {
  const parsed = personalitySubmitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { sessionId } = parsed.data;

  const cookieSessionId = await readSessionCookie();
  if (cookieSessionId !== sessionId) {
    return { success: false, error: "Session mismatch" };
  }

  const supabase = createServiceClient();

  // Fetch all responses for this session
  const { data: rawResponses, error: fetchError } = await supabase
    .from("personality_responses")
    .select("item_id, facet, response_value, reverse_scored")
    .eq("session_id", sessionId);

  if (fetchError || !rawResponses) {
    return { success: false, error: "Failed to fetch responses" };
  }

  if (rawResponses.length < PERSONALITY_ITEMS.length) {
    return {
      success: false,
      error: `Missing responses: ${rawResponses.length}/${PERSONALITY_ITEMS.length}`,
    };
  }

  // Compute scores
  const responseInputs: PersonalityResponseInput[] = rawResponses.map((r) => ({
    itemId: r.item_id,
    facet: r.facet,
    value: r.response_value,
    reverse: r.reverse_scored,
  }));

  const scores = computePersonalityScores(responseInputs);

  // Upsert 9 facet rows to personality_scores
  const facetRows = Object.values(scores.facets).map((f) => ({
    session_id: sessionId,
    facet: f.facet,
    item_count: f.itemCount,
    raw_mean: f.mean,
    rescaled_score: f.rescaled,
  }));

  const { error: scoresError } = await supabase
    .from("personality_scores")
    .upsert(facetRows, { onConflict: "session_id,facet" });

  if (scoresError) {
    return { success: false, error: "Failed to save scores" };
  }

  // Write summary to session
  const now = new Date().toISOString();
  const { error: sessionError } = await supabase
    .from("assessment_sessions")
    .update({
      personality_completed_at: now,
      personality_summary: {
        globalIndex: scores.globalIndex,
        globalIndexRescaled: scores.globalIndexRescaled,
        gritMean: scores.gritMean,
        gritRescaled: scores.gritRescaled,
        attentionFail: scores.attentionFail,
        infrequencyFail: scores.infrequencyFail,
        straightLineFlag: scores.straightLineFlag,
        missingItemCount: scores.missingItemCount,
      },
    })
    .eq("id", sessionId);

  if (sessionError) {
    return { success: false, error: "Failed to update session" };
  }

  return { success: true };
}
