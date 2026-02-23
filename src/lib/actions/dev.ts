"use server";

import { createServiceClient } from "@/lib/supabase/server";
import {
  readSessionCookie,
  createSessionCookie,
} from "@/lib/assessment/session-cookie";
import { getActiveSession, getSessionById } from "@/lib/queries/session";

export async function devSkipToComplete(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (process.env.NODE_ENV !== "development") {
    return { success: false, error: "Only available in development" };
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const existingSessionId = await readSessionCookie();

  if (existingSessionId) {
    // Path A: Cookie exists — use existing session
    const session =
      (await getActiveSession(existingSessionId)) ??
      (await getSessionById(existingSessionId));

    if (!session) {
      return { success: false, error: "Session not found" };
    }

    // If already completed, just return success
    if (session.status === "completed") {
      return { success: true };
    }

    // Upsert dummy responses for all 4 vignettes
    const allVignetteIds = [
      ...session.practical_vignette_ids.map((id: string) => ({
        id,
        type: "practical" as const,
      })),
      ...session.creative_vignette_ids.map((id: string) => ({
        id,
        type: "creative" as const,
      })),
    ];

    await Promise.all(
      allVignetteIds.map((vignette) =>
        supabase.from("student_responses").upsert(
          {
            session_id: session.id,
            vignette_id: vignette.id,
            vignette_type: vignette.type,
            response_text: "",
            video_storage_path: `dev/dummy-${session.id}-${vignette.id}.webm`,
            video_duration_seconds: 30,
            vignette_served_at: now,
            recording_started_at: now,
            response_submitted_at: now,
            needs_scoring: true,
          },
          { onConflict: "session_id,vignette_id" }
        )
      )
    );

    // Mark session as completed
    await supabase
      .from("assessment_sessions")
      .update({
        status: "completed",
        started_at: session.started_at ?? now,
        completed_at: now,
      })
      .eq("id", session.id);

    return { success: true };
  }

  // Path B: No cookie — create everything from scratch
  const { data: applicant, error: applicantError } = await supabase
    .from("applicants")
    .insert({ email: null })
    .select("id")
    .single();

  if (applicantError || !applicant) {
    return { success: false, error: "Failed to create applicant" };
  }

  // Fetch active vignettes
  const [piResult, ciResult] = await Promise.all([
    supabase
      .from("pi_vignettes")
      .select("id")
      .eq("active", true)
      .order("created_at"),
    supabase
      .from("ci_vignettes")
      .select("id")
      .eq("active", true)
      .order("created_at"),
  ]);

  const piIds = (piResult.data ?? []).map((v) => v.id);
  const ciIds = (ciResult.data ?? []).map((v) => v.id);

  // Create completed session
  const { data: session, error: sessionError } = await supabase
    .from("assessment_sessions")
    .insert({
      applicant_id: applicant.id,
      status: "completed",
      assessment_type: "public",
      practical_vignette_ids: piIds,
      creative_vignette_ids: ciIds,
      started_at: now,
      completed_at: now,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return { success: false, error: "Failed to create session" };
  }

  // Insert dummy responses
  const allVignetteIds = [
    ...piIds.map((id) => ({ id, type: "practical" as const })),
    ...ciIds.map((id) => ({ id, type: "creative" as const })),
  ];

  await Promise.all(
    allVignetteIds.map((vignette) =>
      supabase.from("student_responses").insert({
        session_id: session.id,
        vignette_id: vignette.id,
        vignette_type: vignette.type,
        response_text: "",
        video_storage_path: `dev/dummy-${session.id}-${vignette.id}.webm`,
        video_duration_seconds: 30,
        vignette_served_at: now,
        recording_started_at: now,
        response_submitted_at: now,
        needs_scoring: true,
      })
    )
  );

  // Set session cookie
  await createSessionCookie(session.id);

  return { success: true };
}
