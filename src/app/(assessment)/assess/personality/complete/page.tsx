import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { getSessionById } from "@/lib/queries/session";
import { createServiceClient } from "@/lib/supabase/server";
import { PersonalityCompleteContent } from "./complete-content";

export const metadata = {
  title: "Personality Profile Complete \u2014 Builders Quotient",
};

export default async function PersonalityCompletePage() {
  const sessionId = await readSessionCookie();
  if (!sessionId) {
    redirect("/assess/setup");
  }

  const session = await getSessionById(sessionId);
  if (!session) {
    redirect("/assess/setup");
  }

  if (!session.personality_completed_at) {
    redirect("/assess/personality");
  }

  // Fetch lead_type to determine variant
  const supabase = createServiceClient();
  const { data: applicant } = await supabase
    .from("applicants")
    .select("lead_type")
    .eq("id", session.applicant_id)
    .single();

  const variant =
    applicant?.lead_type === "prospective_student" ? "student" : "general";

  return <PersonalityCompleteContent variant={variant} />;
}
