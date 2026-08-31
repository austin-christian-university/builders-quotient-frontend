"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { responseStoragePath } from "@/lib/assessment/storage-paths";
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
  writeToken: string;
}): Promise<{ success: true; nextStep?: number; complete?: boolean }> {
  await authorizeVignetteWrite({
    sessionId: data.sessionId,
    vignetteId: data.vignetteId,
    writeToken: data.writeToken,
  });

  const parsed = reserveResponseSchema.parse(data);
  const supabase = createServiceClient();

  // Written as two statements on purpose. The client hands the blob to the
  // upload queue regardless of how this call goes, so confirmUpload can land
  // FIRST — and a read-then-write here would still lose that race between the
  // read and the write. Splitting it lets the second statement carry its own
  // `upload_status <> 'uploaded'` guard, so the database decides atomically.

  // 1. Timing always applies; it describes the take, not the upload.
  const { data: reserved, error: responseError } = await supabase
    .from("student_responses")
    .update({
      video_duration_seconds: parsed.videoDurationSeconds,
      recording_started_at: parsed.recordingStartedAt,
      response_submitted_at: new Date().toISOString(),
    })
    .eq("session_id", parsed.sessionId)
    .eq("vignette_id", parsed.vignetteId)
    .eq("response_phase", parsed.responsePhase)
    .select("id");

  if (responseError) {
    throw new Error("Failed to reserve response");
  }
  // A filter that matches nothing is not an error in PostgREST. Without this
  // the caller is told the response was saved when nothing was written.
  if (!reserved || reserved.length === 0) {
    throw new Error("Failed to reserve response: no rows matched");
  }

  // 2. Reset the upload state ONLY if the upload has not already been
  // confirmed. Without the neq guard, a confirmUpload that landed first gets
  // downgraded back to pending and the video sits in storage, never scored.
  const { error: uploadStateError } = await supabase
    .from("student_responses")
    .update({ upload_status: "pending", needs_scoring: false })
    .eq("session_id", parsed.sessionId)
    .eq("vignette_id", parsed.vignetteId)
    .eq("response_phase", parsed.responsePhase)
    .neq("upload_status", "uploaded");

  if (uploadStateError) {
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
  vignetteType: "practical" | "creative";
  step: number;
  responsePhase: number;
  writeToken: string;
}): Promise<{ success: true }> {
  await authorizeVignetteWrite({
    sessionId: data.sessionId,
    vignetteId: data.vignetteId,
    writeToken: data.writeToken,
    // Runs after reserveResponse has already marked the session completed on
    // the final phase; gating on an active session would leave that video
    // uploaded but never flagged for scoring.
    sessionState: "unscored",
  });

  const parsed = confirmUploadSchema.parse(data);
  const supabase = createServiceClient();

  // Never trust the client's storagePath. It is fully derived from
  // (session, type, step, phase) — the same formula /api/upload signs — so
  // accepting the caller's string would let a token holder point a response at
  // an arbitrary object, including another student's recording.
  const storagePath = responseStoragePath(parsed);

  const { data: existing, error: readError } = await supabase
    .from("student_responses")
    .select("response_submitted_at")
    .eq("session_id", parsed.sessionId)
    .eq("vignette_id", parsed.vignetteId)
    .eq("response_phase", parsed.responsePhase)
    .maybeSingle();

  if (readError) {
    throw new Error("Failed to confirm upload");
  }
  if (!existing) {
    throw new Error("Failed to confirm upload: no such response row");
  }

  const { data: confirmed, error } = await supabase
    .from("student_responses")
    .update({
      video_storage_path: storagePath,
      upload_status: "uploaded",
      needs_scoring: true,
      // If reserveResponse never landed, the video is here but
      // getCompletedSteps would still treat the step as incomplete and send
      // the student back to re-record a take they cannot repeat. A confirmed
      // upload is proof enough that the response exists.
      ...(existing.response_submitted_at
        ? {}
        : { response_submitted_at: new Date().toISOString() }),
    })
    .eq("session_id", parsed.sessionId)
    .eq("vignette_id", parsed.vignetteId)
    .eq("response_phase", parsed.responsePhase)
    .select("id");

  if (error) {
    throw new Error("Failed to confirm upload");
  }
  if (!confirmed || confirmed.length === 0) {
    throw new Error("Failed to confirm upload: no rows matched");
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
  writeToken: string;
}): Promise<{ success: true }> {
  await authorizeVignetteWrite({
    sessionId: data.sessionId,
    vignetteId: data.vignetteId,
    writeToken: data.writeToken,
    sessionState: "unscored",
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
  writeToken: string;
}): Promise<void> {
  await authorizeSessionWrite({
    sessionId: data.sessionId,
    writeToken: data.writeToken,
    sessionState: "unscored",
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
