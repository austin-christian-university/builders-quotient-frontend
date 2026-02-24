import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { getSessionById } from "@/lib/queries/session";
import { getPersonalityScores } from "@/lib/queries/personality";
import { DebugContent } from "./debug-content";

export const metadata = {
  title: "Personality Debug — Builders Quotient",
};

export default async function PersonalityDebugPage() {
  if (process.env.NODE_ENV !== "development") {
    redirect("/");
  }

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

  const scores = await getPersonalityScores(sessionId);
  if (!scores) {
    redirect("/assess/personality");
  }

  return (
    <DebugContent
      sessionId={sessionId}
      facetScores={scores.facetScores}
      summary={scores.summary}
      completedAt={scores.completedAt}
    />
  );
}
