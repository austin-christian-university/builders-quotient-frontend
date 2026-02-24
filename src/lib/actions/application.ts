"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { getSessionById } from "@/lib/queries/session";

/**
 * Marks the BQ as complete for prospective students.
 * Sets `applicants.bq_completed_at` to now().
 * Idempotent: no-ops if already set or if lead_type is not prospective_student.
 */
export async function markBqComplete(): Promise<{
  success: boolean;
  error?: string;
}> {
  const sessionId = await readSessionCookie();
  if (!sessionId) {
    return { success: false, error: "No session" };
  }

  const session = await getSessionById(sessionId);
  if (!session || !session.personality_completed_at) {
    return { success: false, error: "Personality not completed" };
  }

  const supabase = createServiceClient();

  // Only set bq_completed_at for prospective students, and only if not already set
  const { error } = await supabase
    .from("applicants")
    .update({ bq_completed_at: new Date().toISOString() })
    .eq("id", session.applicant_id)
    .eq("lead_type", "prospective_student")
    .is("bq_completed_at", null);

  if (error) {
    return { success: false, error: "Failed to update" };
  }

  return { success: true };
}
