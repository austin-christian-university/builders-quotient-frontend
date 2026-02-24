import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { LikertValue } from "@/lib/assessment/personality-bank";

/** Fetches all existing personality responses for a session, keyed by item ID. */
export async function getPersonalityProgress(
  sessionId: string
): Promise<Record<string, LikertValue>> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("personality_responses")
    .select("item_id, response_value")
    .eq("session_id", sessionId);

  if (error || !data) return {};

  const progress: Record<string, LikertValue> = {};
  for (const row of data) {
    progress[row.item_id] = row.response_value as LikertValue;
  }
  return progress;
}

/** Fetches computed personality scores for a session. */
export async function getPersonalityScores(sessionId: string) {
  const supabase = createServiceClient();

  const [scoresResult, sessionResult] = await Promise.all([
    supabase
      .from("personality_scores")
      .select("*")
      .eq("session_id", sessionId),
    supabase
      .from("assessment_sessions")
      .select("personality_summary, personality_completed_at")
      .eq("id", sessionId)
      .single(),
  ]);

  if (scoresResult.error || sessionResult.error) return null;

  return {
    facetScores: scoresResult.data ?? [],
    summary: sessionResult.data?.personality_summary,
    completedAt: sessionResult.data?.personality_completed_at,
  };
}
