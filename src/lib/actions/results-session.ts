"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { createSessionCookie } from "@/lib/assessment/session-cookie";
import { resolveSessionByResultsToken } from "@/lib/queries/result-token";

/**
 * Re-establishes a session cookie from a results token so the user can
 * navigate to the personality quiz from the results page.
 *
 * Security: The results token is already a capability token (random nanoid).
 * This action only creates cookies for existing completed/scored sessions
 * where the personality quiz hasn't been taken yet.
 */
export async function establishSessionFromToken(
  token: string
): Promise<{ success: true; redirectUrl: string } | { success: false; error: string }> {
  if (!token || token.length > 128) {
    return { success: false, error: "Invalid token" };
  }

  const supabase = createServiceClient();

  const session = await resolveSessionByResultsToken(supabase, token);

  if (!session) {
    return { success: false, error: "Token not found" };
  }

  // 3. Verify personality quiz hasn't been completed
  if (session.personalityCompletedAt) {
    return { success: false, error: "Personality quiz already completed" };
  }

  // 4. Create session cookie
  await createSessionCookie(session.id);

  return { success: true, redirectUrl: "/assess/personality" };
}
