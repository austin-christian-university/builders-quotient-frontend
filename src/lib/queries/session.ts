import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

/**
 * Session statuses that still accept writes for an accepted response.
 * "completed" is included because the final phase's upload confirms just after
 * reserveResponse completes the session; "scored" and "abandoned" are not, so a
 * durable credential cannot reopen a graded submission.
 */
export const UNSCORED_STATUSES = ["assigned", "in_progress", "completed"];

/** Fetches an active session by ID. Returns null if not found or completed. */
export async function getActiveSession(sessionId: string) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("assessment_sessions")
    .select("*")
    .eq("id", sessionId)
    .in("status", ["assigned", "in_progress"])
    .single();

  if (error || !data) return null;
  return data;
}

/** Fetches a session by ID regardless of status. Returns null if not found. */
export async function getSessionById(sessionId: string) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("assessment_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error || !data) return null;
  return data;
}
