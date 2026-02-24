"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import {
  readSessionCookie,
  createSessionCookie,
  clearSessionCookie,
} from "@/lib/assessment/session-cookie";
import { getActiveSession, getSessionById } from "@/lib/queries/session";
import {
  PERSONALITY_ITEMS,
  type LikertValue,
} from "@/lib/assessment/personality-bank";

export async function devResetSession(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (process.env.NODE_ENV !== "development") {
    return { success: false, error: "Only available in development" };
  }

  const sessionId = await readSessionCookie();

  if (sessionId) {
    const session = await getSessionById(sessionId);

    if (session) {
      const supabase = createServiceClient();

      // Delete in FK order: responses -> scores -> session -> applicant
      await supabase
        .from("student_responses")
        .delete()
        .eq("session_id", session.id);

      await supabase
        .from("personality_responses")
        .delete()
        .eq("session_id", session.id);

      await supabase
        .from("personality_scores")
        .delete()
        .eq("session_id", session.id);

      await supabase
        .from("assessment_sessions")
        .delete()
        .eq("id", session.id);

      await supabase.from("applicants").delete().eq("id", session.applicant_id);
    }
  }

  await clearSessionCookie();

  return { success: true };
}

export async function devGetSessionStatus(): Promise<{
  status: string | null;
  sessionId: string | null;
}> {
  if (process.env.NODE_ENV !== "development") {
    return { status: null, sessionId: null };
  }

  const sessionId = await readSessionCookie();
  if (!sessionId) return { status: null, sessionId: null };

  const session = await getSessionById(sessionId);
  if (!session) return { status: null, sessionId: null };

  return { status: session.status, sessionId: session.id };
}

/**
 * Core DB logic for creating a completed assessment session.
 * Does NOT redirect -- callers decide what to do next.
 */
async function completeSessionInDb(): Promise<{
  success: boolean;
  sessionId?: string;
  error?: string;
}> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const existingSessionId = await readSessionCookie();

  if (existingSessionId) {
    // Path A: Cookie exists -- use existing session
    const session =
      (await getActiveSession(existingSessionId)) ??
      (await getSessionById(existingSessionId));

    if (!session) {
      // Stale cookie -- clear it and fall through to Path B (create fresh)
      await clearSessionCookie();
    } else {
      // If already completed, just return success
      if (session.status === "completed") {
        return { success: true, sessionId: session.id };
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

      const upsertResults = await Promise.all(
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

      const failedUpsert = upsertResults.find((r) => r.error);
      if (failedUpsert?.error) {
        return {
          success: false,
          error: `Failed to upsert responses: ${failedUpsert.error.message}`,
        };
      }

      // Mark session as completed
      const { error: updateError } = await supabase
        .from("assessment_sessions")
        .update({
          status: "completed",
          started_at: session.started_at ?? now,
          completed_at: now,
        })
        .eq("id", session.id);

      if (updateError) {
        return {
          success: false,
          error: `Failed to update session: ${updateError.message}`,
        };
      }

      return { success: true, sessionId: session.id };
    }
  }

  // Path B: No cookie -- create everything from scratch
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

  const insertResults = await Promise.all(
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

  const failedInsert = insertResults.find((r) => r.error);
  if (failedInsert?.error) {
    return {
      success: false,
      error: `Failed to insert responses: ${failedInsert.error.message}`,
    };
  }

  // Set session cookie
  await createSessionCookie(session.id);

  return { success: true, sessionId: session.id };
}

export async function devSkipToComplete(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (process.env.NODE_ENV !== "development") {
    return { success: false, error: "Only available in development" };
  }

  const result = await completeSessionInDb();
  if (!result.success) {
    return { success: false, error: result.error };
  }

  redirect("/assess/complete");
}

/**
 * Creates a completed session with email captured so developers can jump
 * directly to /assess/personality without doing the full intelligence assessment.
 */
export async function devSkipToPersonality(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (process.env.NODE_ENV !== "development") {
    return { success: false, error: "Only available in development" };
  }

  // First ensure we have a completed session with email
  const result = await completeSessionInDb();
  if (!result.success) return result;

  const supabase = createServiceClient();
  const sessionId = await readSessionCookie();
  if (!sessionId) {
    return { success: false, error: "No session cookie" };
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    return { success: false, error: "Session not found" };
  }

  // Ensure applicant has an email (required gate for personality)
  await supabase
    .from("applicants")
    .update({
      email: "dev@example.com",
      lead_type: "prospective_student",
    })
    .eq("id", session.applicant_id)
    .is("email", null);

  return { success: true };
}

export type FillStrategy =
  | "all-1"
  | "all-3"
  | "all-5"
  | "random"
  | "realistic";

export async function devFillPersonality(
  sessionId: string,
  strategy: FillStrategy
): Promise<{
  success: boolean;
  responses?: Record<string, LikertValue>;
  error?: string;
}> {
  if (process.env.NODE_ENV !== "development") {
    return { success: false, error: "Only available in development" };
  }

  const cookieSessionId = await readSessionCookie();
  if (cookieSessionId !== sessionId) {
    return { success: false, error: "Session mismatch" };
  }

  const responses: Record<string, LikertValue> = {};

  for (const item of PERSONALITY_ITEMS) {
    let value: LikertValue;
    switch (strategy) {
      case "all-1":
        value = 1;
        break;
      case "all-3":
        value = 3;
        break;
      case "all-5":
        value = 5;
        break;
      case "random":
        value = (Math.floor(Math.random() * 5) + 1) as LikertValue;
        break;
      case "realistic":
        // High scorer: forward items get 4, reverse items get 2
        value = item.reverse ? 2 : 4;
        break;
    }
    responses[item.id] = value;
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const rows = PERSONALITY_ITEMS.map((item) => ({
    session_id: sessionId,
    item_id: item.id,
    facet: item.facet,
    response_value: responses[item.id],
    reverse_scored: item.reverse,
    created_at: now,
  }));

  const { error: upsertError } = await supabase
    .from("personality_responses")
    .upsert(rows, { onConflict: "session_id,item_id" });

  if (upsertError) {
    console.error("[devFillPersonality] Upsert error:", upsertError);
    return {
      success: false,
      error: `Failed to save responses: ${upsertError.message}`,
    };
  }

  // Set personality_started_at if null
  await supabase
    .from("assessment_sessions")
    .update({ personality_started_at: now })
    .eq("id", sessionId)
    .is("personality_started_at", null);

  return { success: true, responses };
}
