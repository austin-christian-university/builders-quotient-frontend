import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getActiveSession, getSessionById } from "@/lib/queries/session";
import { SignJWT } from "jose";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Only available in development" },
      { status: 403 }
    );
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const jar = await cookies();
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

  // Check for existing session cookie
  let sessionId: string | null = null;
  const existingToken = jar.get("bq-session")?.value;

  if (existingToken) {
    try {
      const { jwtVerify } = await import("jose");
      const { payload } = await jwtVerify(existingToken, secret, {
        issuer: "bq:assess",
        audience: "bq:assess",
      });
      sessionId = (payload.sid as string) ?? null;
    } catch {
      sessionId = null;
    }
  }

  // If we have a session ID, check if it exists in DB
  if (sessionId) {
    const session =
      (await getActiveSession(sessionId)) ??
      (await getSessionById(sessionId));

    if (session) {
      // Session exists — ensure it's completed with dummy responses
      if (session.status !== "completed") {
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

        await supabase
          .from("assessment_sessions")
          .update({
            status: "completed",
            started_at: session.started_at ?? now,
            completed_at: now,
          })
          .eq("id", session.id);
      }

      // Ensure email exists
      await supabase
        .from("applicants")
        .update({ email: "dev@example.com", lead_type: "prospective_student" })
        .eq("id", session.applicant_id)
        .is("email", null);

      // Redirect (cookie already set)
      return NextResponse.redirect(new URL("/assess/personality", request.url));
    }

    // Stale cookie — fall through to create fresh
    sessionId = null;
  }

  // Create everything from scratch
  const { data: applicant, error: applicantError } = await supabase
    .from("applicants")
    .insert({ email: "dev@example.com", lead_type: "prospective_student" })
    .select("id")
    .single();

  if (applicantError || !applicant) {
    return NextResponse.json(
      { error: "Failed to create applicant" },
      { status: 500 }
    );
  }

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
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
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

  // Sign JWT and set cookie on the redirect response
  const token = await new SignJWT({ sid: session.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("bq:assess")
    .setAudience("bq:assess")
    .setExpirationTime("7200s")
    .sign(secret);

  const response = NextResponse.redirect(
    new URL("/assess/personality", request.url)
  );
  response.cookies.set("bq-session", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 7200,
  });

  return response;
}
