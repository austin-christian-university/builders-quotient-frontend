import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { getSessionById } from "@/lib/queries/session";
import { getPersonalityProgress } from "@/lib/queries/personality";
import { createServiceClient } from "@/lib/supabase/server";
import { PersonalityClient } from "./personality-client";

export const metadata = {
  title: "Personality Profile \u2014 Builders Quotient",
};

export default async function PersonalityPage() {
  // 1. Validate session cookie
  const sessionId = await readSessionCookie();
  if (!sessionId) {
    redirect("/assess/setup");
  }

  // 2. Verify session exists and intelligence is completed
  const session = await getSessionById(sessionId);
  if (!session || session.status !== "completed") {
    redirect("/assess/setup");
  }

  // 3. Check applicant has email captured
  const supabase = createServiceClient();
  const { data: applicant } = await supabase
    .from("applicants")
    .select("email")
    .eq("id", session.applicant_id)
    .single();

  if (!applicant?.email) {
    redirect("/assess/complete");
  }

  // 4. Check if personality already completed
  if (session.personality_completed_at) {
    redirect("/assess/personality/complete");
  }

  // 5. Load existing progress for resume
  const existingResponses = await getPersonalityProgress(sessionId);

  return (
    <PersonalityClient
      sessionId={sessionId}
      existingResponses={existingResponses}
    />
  );
}
