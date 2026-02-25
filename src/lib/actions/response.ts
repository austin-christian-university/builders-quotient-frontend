"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { readSessionCookie } from "@/lib/assessment/session-cookie";

/**
 * Records that a vignette has been served to the student.
 * Called from the Server Component at render time.
 * UPSERTs with needs_scoring=false so the pipeline ignores incomplete rows.
 */
export async function recordVignetteServed(
  sessionId: string,
  vignetteId: string,
  vignetteType: "practical" | "creative",
  servedAt: string
) {
  const cookieSessionId = await readSessionCookie();
  if (cookieSessionId !== sessionId) {
    throw new Error("Session mismatch");
  }

  const supabase = createServiceClient();

  // Create placeholder rows for all three response phases
  const { error } = await supabase.from("student_responses").upsert(
    [1, 2, 3].map((phase) => ({
      session_id: sessionId,
      vignette_id: vignetteId,
      vignette_type: vignetteType,
      vignette_served_at: servedAt,
      response_phase: phase,
      response_text: "",
      needs_scoring: false,
    })),
    { onConflict: "session_id,vignette_id,response_phase", ignoreDuplicates: true }
  );

  if (error) {
    throw new Error("Failed to record vignette served");
  }
}

