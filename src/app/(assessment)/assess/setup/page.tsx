import { redirect } from "next/navigation";
import { readSessionCookie, COOLDOWN_MS } from "@/lib/assessment/session-cookie";
import { getSessionById } from "@/lib/queries/session";
import {
  getCompletedSteps,
  findNextIncomplete,
} from "@/lib/queries/vignettes";
import { createServiceClient } from "@/lib/supabase/server";
import { SetupClient } from "./setup-client";

export const metadata = {
  title: "Setup",
};

export default async function SetupPage() {
  // If the user already has a valid session, handle by status
  const sessionId = await readSessionCookie();
  if (sessionId) {
    const session = await getSessionById(sessionId);

    if (session?.status === "assigned" || session?.status === "in_progress") {
      const completedSteps = await getCompletedSteps(sessionId, session);
      const nextStep = findNextIncomplete(completedSteps) ?? 1;
      redirect(`/assess/${nextStep}?resume=true`);
    }

    if (session?.status === "completed" && session.completed_at) {
      const cooldownExpiresAt =
        new Date(session.completed_at).getTime() + COOLDOWN_MS;

      // eslint-disable-next-line react-hooks/purity -- this is a server component; Date.now() is fine
      if (Date.now() < cooldownExpiresAt) {
        const until = new Date(cooldownExpiresAt).toISOString();

        // Check if email was already captured
        const supabase = createServiceClient();
        const { data: applicant } = await supabase
          .from("applicants")
          .select("email, lead_type")
          .eq("id", session.applicant_id)
          .single();

        if (applicant?.email) {
          const path =
            applicant.lead_type === "prospective_student" ? "student" : "general";
          redirect(
            `/assess/thank-you?path=${path}&cooldown=true&until=${encodeURIComponent(until)}`
          );
        } else {
          redirect(
            `/assess/complete?cooldown=true&until=${encodeURIComponent(until)}`
          );
        }
      }
      // else: cooldown expired — fall through to render setup.
      // The stale cookie will be cleared by createSession when consent is submitted.
    }
  }

  return <SetupClient />;
}
