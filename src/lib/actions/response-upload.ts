"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import {
  reserveResponseSchema,
  confirmUploadSchema,
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
}): Promise<{ success: true; nextStep?: number; complete?: boolean }> {
  const cookieSessionId = await readSessionCookie();
  if (cookieSessionId !== data.sessionId) {
    throw new Error("Session mismatch");
  }

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
}): Promise<{ success: true }> {
  const cookieSessionId = await readSessionCookie();
  if (cookieSessionId !== data.sessionId) {
    throw new Error("Session mismatch");
  }

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
}): Promise<{ success: true }> {
  const cookieSessionId = await readSessionCookie();
  if (cookieSessionId !== data.sessionId) {
    throw new Error("Session mismatch");
  }

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
