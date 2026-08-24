"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { getSessionById } from "@/lib/queries/session";
import {
  emailCaptureSchema,
  normalizeUSPhone,
  type CaptureEmailResult,
  type LeadType,
} from "@/lib/schemas/applicant";

/**
 * Find an existing applicant matching the given email or phone,
 * excluding the current anonymous applicant.
 */
async function findDuplicateApplicant(
  email: string,
  phone: string,
  excludeId: string
) {
  const supabase = createServiceClient();

  // Check email match first (stronger identity signal)
  const { data: emailMatch } = await supabase
    .from("applicants")
    .select("id")
    .eq("email", email)
    .neq("id", excludeId)
    .limit(1)
    .maybeSingle();

  if (emailMatch) {
    return { applicantId: emailMatch.id, emailMatch: true, phoneMatch: false };
  }

  // Check phone match
  const { data: phoneMatch } = await supabase
    .from("applicants")
    .select("id")
    .eq("phone", phone)
    .neq("id", excludeId)
    .limit(1)
    .maybeSingle();

  if (phoneMatch) {
    return { applicantId: phoneMatch.id, emailMatch: false, phoneMatch: true };
  }

  return null;
}

/**
 * Merge the current session under an existing applicant:
 * 1. Re-point assessment_sessions.applicant_id
 * 2. Re-point consent_records.applicant_id
 * 3. Update existing applicant with new info (don't overwrite email/phone)
 * 4. Delete orphaned anonymous applicant (only if email IS NULL for safety)
 */
async function mergeIntoExistingApplicant(
  existingApplicantId: string,
  anonymousApplicantId: string,
  sessionId: string,
  data: {
    displayName: string | undefined;
    leadType: string;
    smsMarketingConsent: boolean;
    emailMarketingConsent: boolean;
  }
) {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // Re-point session
  const { error: sessionErr } = await supabase
    .from("assessment_sessions")
    .update({ applicant_id: existingApplicantId })
    .eq("id", sessionId);

  if (sessionErr) throw new Error("Failed to link session to existing profile");

  // Re-point consent records
  const { error: consentErr } = await supabase
    .from("consent_records")
    .update({ applicant_id: existingApplicantId })
    .eq("applicant_id", anonymousApplicantId);

  if (consentErr) throw new Error("Failed to re-point consent records");

  // Update existing applicant with new info (preserve email and phone).
  // The results token lives on assessment_sessions — each attempt keeps its own.
  const updates: Record<string, unknown> = {
    lead_type: data.leadType,
  };
  if (data.displayName) {
    updates.display_name = data.displayName;
  }
  if (data.smsMarketingConsent) {
    updates.sms_marketing_consent_at = now;
  }
  if (data.emailMarketingConsent) {
    updates.email_marketing_consent_at = now;
  }

  const { error: updateErr } = await supabase
    .from("applicants")
    .update(updates)
    .eq("id", existingApplicantId);

  if (updateErr) throw new Error("Failed to update existing applicant");

  // Delete orphaned anonymous applicant (safety: only if email IS NULL)
  const { error: deleteErr } = await supabase
    .from("applicants")
    .delete()
    .eq("id", anonymousApplicantId)
    .is("email", null);

  if (deleteErr) {
    // Non-fatal: orphan remains but merge succeeded
    console.error("Failed to clean up orphaned applicant:", deleteErr);
  }
}

export async function captureEmail(
  formData: FormData
): Promise<CaptureEmailResult> {
  const sessionId = await readSessionCookie();
  if (!sessionId) {
    return { success: false, error: "Session expired. Please start over." };
  }

  const session = await getSessionById(sessionId);
  if (!session || session.status !== "completed") {
    return {
      success: false,
      error: "Assessment not completed. Please finish all steps first.",
    };
  }

  const raw = {
    email: formData.get("email"),
    firstName: formData.get("firstName") || undefined,
    phone: formData.get("phone"),
    leadType: formData.get("leadType") || undefined,
    smsMarketingConsent: formData.get("smsMarketingConsent"),
    emailMarketingConsent: formData.get("emailMarketingConsent"),
  };

  const parsed = emailCaptureSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Partial<
      Record<"email" | "firstName" | "phone" | "leadType", string>
    > = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as
        | "email"
        | "firstName"
        | "phone"
        | "leadType";
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors,
    };
  }

  // --- Duplicate detection ---
  const duplicate = await findDuplicateApplicant(
    parsed.data.email,
    parsed.data.phone,
    session.applicant_id
  );

  if (duplicate) {
    return {
      success: false,
      duplicateFound: true,
      duplicateEmail: duplicate.emailMatch,
      duplicatePhone: duplicate.phoneMatch,
      existingApplicantId: duplicate.applicantId,
    };
  }

  // --- No duplicate: normal flow ---
  const supabase = createServiceClient();

  const { error: updateError } = await supabase
    .from("applicants")
    .update({
      email: parsed.data.email,
      display_name: parsed.data.firstName ?? null,
      phone: parsed.data.phone,
      sms_consent_at: new Date().toISOString(),
      lead_type: parsed.data.leadType,
      ...(parsed.data.smsMarketingConsent && {
        sms_marketing_consent_at: new Date().toISOString(),
      }),
      ...(parsed.data.emailMarketingConsent && {
        email_marketing_consent_at: new Date().toISOString(),
      }),
    })
    .eq("id", session.applicant_id);

  if (updateError) {
    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }

  const path =
    parsed.data.leadType === "prospective_student" ? "student" : "general";
  redirect(`/assess/thank-you?path=${path}`);
}

/**
 * Link an assessment session to an existing applicant profile.
 * Called from the duplicate-detection modal when the user chooses
 * "Save to my existing profile".
 */
export async function linkToExistingProfile(
  existingApplicantId: string,
  email: string,
  phone: string,
  leadType: LeadType,
  displayName?: string,
  smsMarketingConsent?: boolean,
  emailMarketingConsent?: boolean,
): Promise<{ success: true } | { success: false; error: string }> {
  const sessionId = await readSessionCookie();
  if (!sessionId) {
    return { success: false, error: "Session expired. Please start over." };
  }

  const session = await getSessionById(sessionId);
  if (!session || session.status !== "completed") {
    return {
      success: false,
      error: "Assessment not completed. Please finish all steps first.",
    };
  }

  // Re-verify the duplicate match server-side to prevent forged applicant IDs
  const normalizedPhone = normalizeUSPhone(phone);
  if (!normalizedPhone) {
    return { success: false, error: "Invalid phone number." };
  }
  const duplicate = await findDuplicateApplicant(email, normalizedPhone, session.applicant_id);
  if (!duplicate || duplicate.applicantId !== existingApplicantId) {
    return { success: false, error: "Profile match has changed. Please try again." };
  }

  try {
    await mergeIntoExistingApplicant(
      existingApplicantId,
      session.applicant_id,
      session.id,
      {
        displayName,
        leadType,
        smsMarketingConsent: smsMarketingConsent ?? false,
        emailMarketingConsent: emailMarketingConsent ?? false,
      }
    );
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }

  const path = leadType === "prospective_student" ? "student" : "general";
  redirect(`/assess/thank-you?path=${path}`);
}
