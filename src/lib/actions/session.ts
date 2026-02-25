"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import {
  createSessionCookie,
  readSessionCookie,
} from "@/lib/assessment/session-cookie";
import { getActiveSession } from "@/lib/queries/session";
import {
  consentDataSchema,
  consentTypes,
  type ConsentData,
} from "@/lib/schemas/consent";
import { createHash } from "crypto";

const IP_HASH_SALT = process.env.IP_HASH_SALT;
if (!IP_HASH_SALT && process.env.NODE_ENV === "production") {
  throw new Error("IP_HASH_SALT environment variable is not set");
}
const _ipHashSalt = IP_HASH_SALT ?? "bq-default-salt-dev-only";

function hashIp(ip: string): string {
  return createHash("sha256")
    .update(_ipHashSalt + ip)
    .digest("hex")
    .slice(0, 16);
}

/**
 * Creates an anonymous applicant + assessment session, stores consent records,
 * sets the session cookie, and redirects to the first assessment step.
 *
 * Called when the user clicks "I'm Ready" on the setup page.
 */
export async function createAssessmentSession(consentRaw: ConsentData) {
  // Validate consent data
  const consent = consentDataSchema.parse(consentRaw);

  // Resume existing session if cookie is still valid
  const existingSessionId = await readSessionCookie();
  if (existingSessionId) {
    const existing = await getActiveSession(existingSessionId);
    if (existing) {
      redirect("/assess/1");
    }
  }

  const supabase = createServiceClient();

  // Capture request metadata for consent records
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const rawIp = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = rawIp !== "unknown" ? hashIp(rawIp) : null;
  const userAgent = headersList.get("user-agent")?.slice(0, 512) ?? null;

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

  // 4. Store consent records
  // Use the server-side timestamp as the authoritative consent time.
  // The client-provided consentedAt is already validated as a legal ISO string,
  // but for legal defensibility the server's clock is the canonical record.
  const serverConsentedAt = new Date().toISOString();
  const consentRecords = consentTypes.map((type) => ({
    applicant_id: applicant.id,
    session_id: session.id,
    consent_type: type,
    consent_version: consent.consentVersion,
    consented_at: serverConsentedAt,
    ip_hash: ipHash,
    user_agent: userAgent,
  }));

  const { error: consentError } = await supabase
    .from("consent_records")
    .insert(consentRecords);

  if (consentError) {
    console.error("Failed to store consent records:", consentError);
    // Don't block session creation — consent was given, record failure for alerting
  }

  // 5. Set session cookie and redirect
  await createSessionCookie(session.id);
  redirect("/assess/1");
}
