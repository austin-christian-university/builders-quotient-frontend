import type { SupabaseClient } from "@supabase/supabase-js";

/** Session statuses whose results page is viewable. */
export const VIEWABLE_SESSION_STATUSES = ["scored", "completed"] as const;

export type ResolvedResultSession = {
  id: string;
  applicantId: string;
  status: string;
  assessmentType: string | null;
  personalityCompletedAt: string | null;
  archetypeName: string | null;
  archetypeTagline: string | null;
  archetypeDescription: string | null;
  archetypeBasedOnCategory: string | null;
  archetypeVariant: string | null;
  applicant: {
    id: string;
    displayName: string | null;
    leadType: string | null;
  };
};

/** Raw row shape returned by the query below. */
type SessionRow = {
  id: string;
  applicant_id: string;
  status: string;
  assessment_type: string | null;
  personality_completed_at: string | null;
  archetype_name: string | null;
  archetype_tagline: string | null;
  archetype_description: string | null;
  archetype_based_on_category: string | null;
  archetype_variant: string | null;
  applicants: {
    id: string;
    display_name: string | null;
    lead_type: string | null;
  } | null;
};

const SELECT = [
  "id",
  "applicant_id",
  "status",
  "assessment_type",
  "personality_completed_at",
  "archetype_name",
  "archetype_tagline",
  "archetype_description",
  "archetype_based_on_category",
  "archetype_variant",
  "applicants(id, display_name, lead_type)",
].join(", ");

/**
 * Resolve a per-attempt results token to its session.
 *
 * One token, one attempt, forever — a retake mints a new token rather than
 * re-pointing this one. Returns null for unknown tokens and for sessions that
 * are not viewable yet (or ever).
 */
export async function resolveSessionByResultsToken(
  client: SupabaseClient,
  token: string
): Promise<ResolvedResultSession | null> {
  if (!token || token.length > 128) return null;

  const { data, error } = await client
    .from("assessment_sessions")
    .select(SELECT)
    .eq("results_token", token)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as SessionRow;

  if (!(VIEWABLE_SESSION_STATUSES as readonly string[]).includes(row.status)) {
    return null;
  }

  const applicant = row.applicants;

  return {
    id: row.id,
    applicantId: row.applicant_id,
    status: row.status,
    assessmentType: row.assessment_type,
    personalityCompletedAt: row.personality_completed_at,
    archetypeName: row.archetype_name,
    archetypeTagline: row.archetype_tagline,
    archetypeDescription: row.archetype_description,
    archetypeBasedOnCategory: row.archetype_based_on_category,
    archetypeVariant: row.archetype_variant,
    applicant: {
      id: applicant?.id ?? row.applicant_id,
      displayName: applicant?.display_name ?? null,
      leadType: applicant?.lead_type ?? null,
    },
  };
}
