import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createSessionCookie } from "@/lib/assessment/session-cookie";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token || token.length > 128) {
    return NextResponse.redirect(new URL("/404", request.url));
  }

  const supabase = createServiceClient();

  // Look up applicant by results_token
  const { data: applicant } = await supabase
    .from("applicants")
    .select("id, lead_type, results_token")
    .eq("results_token", token)
    .single();

  if (!applicant || applicant.lead_type !== "prospective_student") {
    return NextResponse.redirect(new URL("/404", request.url));
  }

  // Find latest session — prefer "scored" over "completed"
  const { data: scoredSession } = await supabase
    .from("assessment_sessions")
    .select("id, personality_completed_at")
    .eq("applicant_id", applicant.id)
    .eq("status", "scored")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const session =
    scoredSession ??
    (
      await supabase
        .from("assessment_sessions")
        .select("id, personality_completed_at")
        .eq("applicant_id", applicant.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
    ).data;

  if (!session) {
    return NextResponse.redirect(new URL("/404", request.url));
  }

  // Already completed personality → send to results
  if (session.personality_completed_at) {
    return NextResponse.redirect(new URL(`/results/${token}`, request.url));
  }

  // Restore session and send to personality quiz
  await createSessionCookie(session.id);
  return NextResponse.redirect(new URL("/assess/personality", request.url));
}
