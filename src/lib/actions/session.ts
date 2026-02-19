"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import {
  createSessionCookie,
  readSessionCookie,
} from "@/lib/assessment/session-cookie";
import { getActiveSession } from "@/lib/queries/session";

/**
 * Creates an anonymous applicant + assessment session, sets the session cookie,
 * and redirects to the first assessment step.
 *
 * Called when the user clicks "I'm Ready" on the setup page.
 */
export async function createAssessmentSession() {
  // Resume existing session if cookie is still valid
  const existingSessionId = await readSessionCookie();
  if (existingSessionId) {
    const existing = await getActiveSession(existingSessionId);
    if (existing) {
      redirect("/assess/1");
    }
  }

  const supabase = createServiceClient();

  // 1. Create anonymous applicant (email captured later at the results gate)
  const { data: applicant, error: applicantError } = await supabase
    .from("applicants")
    .insert({ email: null })
    .select("id")
    .single();

  if (applicantError || !applicant) {
    throw new Error("Failed to create applicant");
  }

  // 2. Fetch active vignettes for assignment
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

  if (piResult.error || ciResult.error) {
    throw new Error("Failed to fetch vignettes for assignment");
  }

  const piIds = (piResult.data ?? []).map((v) => v.id);
  const ciIds = (ciResult.data ?? []).map((v) => v.id);

  // 3. Create the assessment session
  const { data: session, error: sessionError } = await supabase
    .from("assessment_sessions")
    .insert({
      applicant_id: applicant.id,
      status: "assigned",
      assessment_type: "public",
      practical_vignette_ids: piIds,
      creative_vignette_ids: ciIds,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    throw new Error("Failed to create assessment session");
  }

  // 4. Set session cookie and redirect
  await createSessionCookie(session.id);
  redirect("/assess/1");
}
