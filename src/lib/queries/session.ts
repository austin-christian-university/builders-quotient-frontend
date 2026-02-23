import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

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
