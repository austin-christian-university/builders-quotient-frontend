import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { getSessionById } from "@/lib/queries/session";
import { BriefingClient } from "./briefing-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Assessment Briefing",
};

export default async function BriefingPage() {
  const sessionId = await readSessionCookie();
  if (!sessionId) redirect("/assess/setup");

  const session = await getSessionById(sessionId);
  if (!session) redirect("/assess/setup");

  // Already completed briefing — skip to step 1
  if (session.briefing_completed_at) {
    redirect("/assess/1");
  }

  // Session must be assigned (post-setup, pre-assessment)
  if (session.status !== "assigned") {
    redirect("/assess/1");
  }

  return <BriefingClient />;
}
