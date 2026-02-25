"use server";

import { redirect } from "next/navigation";
import { nanoid } from "nanoid";
import { createServiceClient } from "@/lib/supabase/server";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { getSessionById } from "@/lib/queries/session";
import { emailCaptureSchema } from "@/lib/schemas/applicant";

type CaptureEmailResult =
  | { success: true }
  | {
      success: false;
      error: string;
      fieldErrors?: Partial<
        Record<"email" | "firstName" | "phone" | "leadType", string>
      >;
    };

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

  const resultsToken = nanoid(21);
  const supabase = createServiceClient();

  const { error: updateError } = await supabase
    .from("applicants")
    .update({
      email: parsed.data.email,
      display_name: parsed.data.firstName ?? null,
      phone: parsed.data.phone,
      sms_consent_at: new Date().toISOString(),
      results_token: resultsToken,
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
