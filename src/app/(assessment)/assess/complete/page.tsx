import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { getSessionById } from "@/lib/queries/session";
import {
  getCompletedSteps,
  findNextIncomplete,
} from "@/lib/queries/vignettes";
import { createServiceClient } from "@/lib/supabase/server";
import { EmailCapture } from "@/components/assessment/EmailCapture";

export const metadata = {
  title: "Assessment Complete — Builders Quotient",
};

const TOTAL_STEPS = 4;

export default async function CompletePage() {
  // 1. Validate session cookie
  const sessionId = await readSessionCookie();
  if (!sessionId) {
    redirect("/assess/setup");
  }

  // 2. Validate completed session
  const session = await getSessionById(sessionId);
  if (!session) {
    redirect("/assess/setup");
  }

  if (session.status !== "completed") {
    const completedSoFar = await getCompletedSteps(sessionId, session);
    const nextStep = findNextIncomplete(completedSoFar);
    redirect(nextStep ? `/assess/${nextStep}` : "/assess/setup");
  }

  // 3. Enforce all 4 steps completed
  const completedSteps = await getCompletedSteps(sessionId, session);
  if (completedSteps.size < TOTAL_STEPS) {
    const nextStep = findNextIncomplete(completedSteps);
    redirect(nextStep ? `/assess/${nextStep}` : "/assess/setup");
  }

  // 4. Check if email already captured → redirect to thank-you
  const supabase = createServiceClient();
  const { data: applicant } = await supabase
    .from("applicants")
    .select("email, lead_type")
    .eq("id", session.applicant_id)
    .single();

  if (applicant?.email) {
    const path =
      applicant.lead_type === "prospective_student" ? "student" : "general";
    redirect(`/assess/thank-you?path=${path}`);
  }

  return <EmailCapture />;
}

