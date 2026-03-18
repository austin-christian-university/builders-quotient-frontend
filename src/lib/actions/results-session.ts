"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { createSessionCookie } from "@/lib/assessment/session-cookie";

/**
 * Re-establishes a session cookie from a results token so the user can
 * navigate to the personality quiz from the results page.
 *
 * Security: The results token is already a capability token (random nanoid).
 * This action only creates cookies for existing completed/scored sessions
 * where the personality quiz hasn't been taken yet.
 */
export async function establishSessionFromToken(
  token: string
): Promise<{ success: true; redirectUrl: string } | { success: false; error: string }> {
  if (!token || token.length > 128) {
    return { success: false, error: "Invalid token" };
  }

  const supabase = createServiceClient();

  // 1. Look up applicant by results_token
  const { data: applicant, error: applicantError } = await supabase
    .from("applicants")
    .select("id")
    .eq("results_token", token)
    .single();

  if (applicantError || !applicant) {
    return { success: false, error: "Token not found" };
  }

  // 2. Find their session — prefer "scored" over "completed" (matches getResultsByToken)
  const { data: scoredSession } = await supabase
    .from("assessment_sessions")
    .select("id, personality_completed_at")
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
        .select("id, personality_completed_at")
        .eq("applicant_id", applicant.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
    ).data;

  if (!session) {
    return { success: false, error: "No completed session found" };
  }

  // 3. Verify personality quiz hasn't been completed
  if (session.personality_completed_at) {
    return { success: false, error: "Personality quiz already completed" };
  }

  // 4. Create session cookie
  await createSessionCookie(session.id);

  return { success: true, redirectUrl: "/assess/personality" };
}
