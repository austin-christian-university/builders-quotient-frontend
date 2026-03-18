"use server";

import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Marks the pre-exam briefing as completed and redirects to step 1.
 * Called when user clicks Continue or Skip on the briefing page.
 */
export async function completeBriefing() {
  const sessionId = await readSessionCookie();
  if (!sessionId) redirect("/assess/setup");

  const supabase = createServiceClient();
  await supabase
    .from("assessment_sessions")
    .update({ briefing_completed_at: new Date().toISOString() })
    .eq("id", sessionId);

  redirect("/assess/1");
}
