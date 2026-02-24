"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { responseSubmissionSchema } from "@/lib/schemas/response";

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

  // Create placeholder rows for both response phases
  const { error } = await supabase.from("student_responses").upsert(
    [
      {
        session_id: sessionId,
        vignette_id: vignetteId,
        vignette_type: vignetteType,
        vignette_served_at: servedAt,
        response_phase: 1,
        response_text: "",
        needs_scoring: false,
      },
      {
        session_id: sessionId,
        vignette_id: vignetteId,
        vignette_type: vignetteType,
        vignette_served_at: servedAt,
        response_phase: 2,
        response_text: "",
        needs_scoring: false,
      },
    ],
    { onConflict: "session_id,vignette_id,response_phase", ignoreDuplicates: true }
  );

  if (error) {
    throw new Error("Failed to record vignette served");
  }
}

/**
 * Submits the video response for a vignette step.
 * Updates the student_responses row with video metadata and marks needs_scoring=true.
 * If this is step 4, also marks the session as completed.
 */
export async function submitVideoResponse(data: {
  sessionId: string;
  vignetteId: string;
  vignetteType: "practical" | "creative";
  step: number;
  storagePath: string;
  videoDurationSeconds: number;
  recordingStartedAt: string;
}): Promise<{ success: true; nextStep?: number; complete?: boolean }> {
  const cookieSessionId = await readSessionCookie();
  if (cookieSessionId !== data.sessionId) {
    throw new Error("Session mismatch");
  }

  const parsed = responseSubmissionSchema.parse(data);
  const supabase = createServiceClient();

  // Update the response row
  const { error: responseError } = await supabase
    .from("student_responses")
    .update({
      video_storage_path: parsed.storagePath,
      video_duration_seconds: parsed.videoDurationSeconds,
      recording_started_at: parsed.recordingStartedAt,
      response_submitted_at: new Date().toISOString(),
      needs_scoring: true,
    })
    .eq("session_id", parsed.sessionId)
    .eq("vignette_id", parsed.vignetteId);

  if (responseError) {
    throw new Error("Failed to submit response");
  }

  // If final step, mark session as completed
  if (parsed.step === 4) {
    const { error: sessionError } = await supabase
      .from("assessment_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", parsed.sessionId);

    if (sessionError) {
      throw new Error("Failed to complete session");
    }

    return { success: true, complete: true };
  }

  return { success: true, nextStep: parsed.step + 1 };
}
