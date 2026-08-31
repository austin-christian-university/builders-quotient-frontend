"use server";

import { createServiceClient } from "@/lib/supabase/server";
import {
  authorizeVignetteWrite,
  authorizeSessionWrite,
} from "@/lib/assessment/vignette-auth";
import {
  reserveResponseSchema,
  confirmUploadSchema,
  reportSuspicionEventsSchema,
} from "@/lib/schemas/response";

/**
 * Phase 1 — Reserve.
 * Called immediately when recording stops. Sets response_submitted_at so that
 * getCompletedSteps() unblocks the next vignette. The video hasn't been
 * uploaded yet (upload_status = 'pending', needs_scoring = false).
 */
export async function reserveResponse(data: {
  sessionId: string;
  vignetteId: string;
  vignetteType: "practical" | "creative";
  step: number;
  responsePhase: number;
  videoDurationSeconds: number;
  recordingStartedAt: string;
  writeToken?: string;
}): Promise<{ success: true; nextStep?: number; complete?: boolean }> {
  await authorizeVignetteWrite({
    sessionId: data.sessionId,
    vignetteId: data.vignetteId,
    writeToken: data.writeToken,
  });

  const parsed = reserveResponseSchema.parse(data);
  const supabase = createServiceClient();

  const { error: responseError } = await supabase
    .from("student_responses")
    .update({
      video_duration_seconds: parsed.videoDurationSeconds,
      recording_started_at: parsed.recordingStartedAt,
      response_submitted_at: new Date().toISOString(),
      upload_status: "pending",
      needs_scoring: false,
    })
    .eq("session_id", parsed.sessionId)
    .eq("vignette_id", parsed.vignetteId)
    .eq("response_phase", parsed.responsePhase);

  if (responseError) {
    throw new Error("Failed to reserve response");
  }

  // If final step AND final phase, mark session as completed
  if (parsed.step === 4 && parsed.responsePhase === 3) {
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

  // Navigate to next step only after phase 3 is complete
  if (parsed.responsePhase === 3) {
    return { success: true, nextStep: parsed.step + 1 };
  }

  // Phase 1 reserved — no navigation yet
  return { success: true };
}

/**
 * Phase 2 — Confirm upload.
 * Called after the blob has been successfully uploaded to Supabase Storage.
 * Sets video_storage_path, upload_status = 'uploaded', needs_scoring = true
 * so the scoring pipeline picks up the row.
 */
export async function confirmUpload(data: {
  sessionId: string;
  vignetteId: string;
  responsePhase: number;
  storagePath: string;
  writeToken?: string;
}): Promise<{ success: true }> {
  await authorizeVignetteWrite({
    sessionId: data.sessionId,
    vignetteId: data.vignetteId,
    writeToken: data.writeToken,
  });

  const parsed = confirmUploadSchema.parse(data);
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("student_responses")
    .update({
      video_storage_path: parsed.storagePath,
      upload_status: "uploaded",
      needs_scoring: true,
    })
    .eq("session_id", parsed.sessionId)
    .eq("vignette_id", parsed.vignetteId)
    .eq("response_phase", parsed.responsePhase);

  if (error) {
    throw new Error("Failed to confirm upload");
  }

  return { success: true };
}

/**
 * Called when all retries are exhausted.
 * Sets upload_status = 'failed' so admins can identify orphaned responses.
 */
export async function reportUploadFailure(data: {
  sessionId: string;
  vignetteId: string;
  responsePhase: number;
  writeToken?: string;
}): Promise<{ success: true }> {
  await authorizeVignetteWrite({
    sessionId: data.sessionId,
    vignetteId: data.vignetteId,
    writeToken: data.writeToken,
  });

  const supabase = createServiceClient();

  const { error } = await supabase
    .from("student_responses")
    .update({ upload_status: "failed" })
    .eq("session_id", data.sessionId)
    .eq("vignette_id", data.vignetteId)
    .eq("response_phase", data.responsePhase);

  if (error) {
    throw new Error("Failed to report upload failure");
  }

  return { success: true };
}

/**
 * Append suspicion events (copy attempts, tab switches, etc.) to the
 * assessment_sessions.suspicion_flags JSONB array. Uses array concatenation
 * so flags from earlier vignettes aren't overwritten.
 *
 * Fire-and-forget from the client — failure here shouldn't block navigation.
 */
export async function reportSuspicionEvents(data: {
  sessionId: string;
  events: { type: string; timestamp: string; phase: string }[];
  writeToken?: string;
}): Promise<void> {
  await authorizeSessionWrite({
    sessionId: data.sessionId,
    writeToken: data.writeToken,
  });

  const parsed = reportSuspicionEventsSchema.parse(data);
  const supabase = createServiceClient();

  // Append to existing array using jsonb concatenation
  const { error } = await supabase.rpc("append_suspicion_flags", {
    p_session_id: parsed.sessionId,
    p_new_flags: parsed.events,
  });

  if (error) {
    // Log but don't throw — this is best-effort telemetry
    console.error("[BQ] Failed to report suspicion events:", error.message);
  }
}
