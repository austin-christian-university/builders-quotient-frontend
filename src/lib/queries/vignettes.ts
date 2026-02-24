import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { SessionRow } from "@/lib/schemas/session";
import type { AudioWordTiming } from "@/lib/assessment/narration-timer";

/** Safe columns to expose to the client — never include scoring anchors, moves, or exemplars. */
const PI_SAFE_COLUMNS =
  "id, vignette_text, phase_1_prompt, phase_2_prompt, situation_type, audio_storage_path, audio_timing, estimated_narration_seconds" as const;
const CI_SAFE_COLUMNS =
  "id, vignette_text, phase_1_prompt, phase_2_prompt, episode_type, audio_storage_path, audio_timing, estimated_narration_seconds" as const;

export type VignetteData = {
  id: string;
  vignette_text: string;
  vignette_prompt: string;
  type_label: string;
  vignette_type: "practical" | "creative";
  audio_storage_path: string | null;
  audio_timing: AudioWordTiming[] | null;
  estimated_narration_seconds: number | null;
};

/**
 * Fetches the vignette for a given step (1-4) using the session's assigned IDs.
 * Steps 1-2 → practical (pi_vignettes), steps 3-4 → creative (ci_vignettes).
 */
export async function getVignetteForStep(
  session: SessionRow,
  step: number
): Promise<VignetteData | null> {
  const supabase = createServiceClient();

  if (step <= 2) {
    const vignetteId = session.practical_vignette_ids[step - 1];
    if (!vignetteId) return null;

    const { data, error } = await supabase
      .from("pi_vignettes")
      .select(PI_SAFE_COLUMNS)
      .eq("id", vignetteId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      vignette_text: data.vignette_text,
      vignette_prompt: data.phase_1_prompt ?? "",
      type_label: data.situation_type,
      vignette_type: "practical",
      audio_storage_path: data.audio_storage_path,
      audio_timing: data.audio_timing,
      estimated_narration_seconds: data.estimated_narration_seconds,
    };
  }

  // Steps 3-4: creative intelligence
  const vignetteId = session.creative_vignette_ids[step - 3];
  if (!vignetteId) return null;

  const { data, error } = await supabase
    .from("ci_vignettes")
    .select(CI_SAFE_COLUMNS)
    .eq("id", vignetteId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    vignette_text: data.vignette_text,
    vignette_prompt: data.phase_1_prompt ?? "",
    type_label: data.episode_type,
    vignette_type: "creative",
    audio_storage_path: data.audio_storage_path,
    audio_timing: data.audio_timing,
    estimated_narration_seconds: data.estimated_narration_seconds,
  };
}

/**
 * Returns the set of completed step numbers (1-4) for a session.
 * A step is complete when `response_submitted_at IS NOT NULL`.
 */
export async function getCompletedSteps(
  sessionId: string,
  session: SessionRow
): Promise<Set<number>> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("student_responses")
    .select("vignette_id")
    .eq("session_id", sessionId)
    .not("response_submitted_at", "is", null);

  if (error || !data) return new Set();

  const completedIds = new Set(data.map((r) => r.vignette_id));
  const steps = new Set<number>();

  session.practical_vignette_ids.forEach((id, i) => {
    if (completedIds.has(id)) steps.add(i + 1);
  });
  session.creative_vignette_ids.forEach((id, i) => {
    if (completedIds.has(id)) steps.add(i + 3);
  });

  return steps;
}

const DEFAULT_TOTAL_STEPS = 4;

/**
 * Returns the first step number (1-based) that is not in the completedSteps set,
 * or null if all steps are complete.
 */
export function findNextIncomplete(
  completedSteps: Set<number>,
  totalSteps: number = DEFAULT_TOTAL_STEPS
): number | null {
  for (let i = 1; i <= totalSteps; i++) {
    if (!completedSteps.has(i)) return i;
  }
  return null;
}
