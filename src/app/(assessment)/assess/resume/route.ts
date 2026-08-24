import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createSessionCookie } from "@/lib/assessment/session-cookie";
import { resolveSessionByResultsToken } from "@/lib/queries/result-token";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token || token.length > 128) {
    return NextResponse.redirect(new URL("/404", request.url));
  }

  const supabase = createServiceClient();

  const session = await resolveSessionByResultsToken(supabase, token);

  if (!session || session.applicant.leadType !== "prospective_student") {
    return NextResponse.redirect(new URL("/404", request.url));
  }

  // Already completed personality → send to results
  if (session.personalityCompletedAt) {
    return NextResponse.redirect(new URL(`/results/${token}`, request.url));
  }

  // Restore session and send to personality quiz
  await createSessionCookie(session.id);
  return NextResponse.redirect(new URL("/assess/personality", request.url));
}
