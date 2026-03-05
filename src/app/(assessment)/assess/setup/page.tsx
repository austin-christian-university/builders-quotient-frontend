import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
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

const COOLDOWN_HOURS = 2;

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
      const until = new Date(
        new Date(session.completed_at).getTime() + COOLDOWN_HOURS * 60 * 60 * 1000
      ).toISOString();

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
  }

  return <SetupClient />;
}
