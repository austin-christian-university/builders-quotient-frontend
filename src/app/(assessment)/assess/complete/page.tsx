import { redirect } from "next/navigation";
import { readSessionCookieDetails } from "@/lib/assessment/session-cookie";
import { getSessionById } from "@/lib/queries/session";
import {
  getCompletedSteps,
  findNextIncomplete,
} from "@/lib/queries/vignettes";
import { createServiceClient } from "@/lib/supabase/server";
import { EmailCapture } from "@/components/assessment/EmailCapture";
import { UploadGate } from "@/components/assessment/UploadGate";
import { CooldownBanner } from "@/components/assessment/CooldownBanner";

export const metadata = {
  title: "Assessment Complete — Builders Quotient",
};

const TOTAL_STEPS = 4;

export default async function CompletePage() {
  // 1. Validate session cookie
  const cookie = await readSessionCookieDetails();
  if (!cookie) {
    redirect("/assess/setup");
  }
  const sessionId = cookie.sessionId;

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

  // 4. Check if email already captured -> redirect to thank-you
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

  // A degraded cookie means this student lost their session cookie mid-exam and
  // finished on a vignette write token. Their responses are saved, but email
  // capture requires full trust — showing the form would hand them a field that
  // can only fail. Tell them what actually happened instead.
  if (cookie.trust === "degraded") {
    return (
      <UploadGate>
        <div className="mx-auto max-w-md space-y-4 p-6 text-center">
          <h1 className="text-[length:var(--text-fluid-lg)] font-semibold text-text-primary">
            Your responses are saved
          </h1>
          <p className="text-text-secondary">
            Your browser dropped its session part-way through, so we can&rsquo;t
            attach your results to an email address from here. Everything you
            recorded is safe.
          </p>
          <p className="text-text-secondary">
            Email Admissions with the reference below and they&rsquo;ll send your
            results.
          </p>
          <p className="font-mono text-xs break-all text-text-secondary">
            {sessionId.slice(0, 8)}
          </p>
          <a
            className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
            href={`mailto:enrollment@austinchristianu.org?subject=${encodeURIComponent(
              `Assessment results \u2014 session ${sessionId.slice(0, 8)}`
            )}`}
          >
            Email Admissions
          </a>
        </div>
      </UploadGate>
    );
  }

  return (
    <UploadGate>
      <CooldownBanner />
      <EmailCapture />
    </UploadGate>
  );
}
