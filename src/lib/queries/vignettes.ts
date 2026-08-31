import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { createSignedDownloadUrl } from "@/lib/supabase/storage";
import type { SessionRow } from "@/lib/schemas/session";
import type { AudioWordTiming } from "@/lib/assessment/narration-timer";

/**
 * Randomly selects an active assessment form (a pre-built pair of 2 PI + 2 CI vignettes).
 * Throws if no active forms exist.
 */
export async function selectAssessmentForm(): Promise<{
  formCode: string;
  piVignetteIds: string[];
  ciVignetteIds: string[];
}> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("assessment_forms")
    .select("form_code, pi_vignette_ids, ci_vignette_ids")
    .eq("active", true);

  if (error) {
    throw new Error(`Failed to fetch assessment forms: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("No active assessment forms available");
  }

  const form = data[Math.floor(Math.random() * data.length)];

  return {
    formCode: form.form_code,
    piVignetteIds: form.pi_vignette_ids,
    ciVignetteIds: form.ci_vignette_ids,
  };
}

/** Safe columns to expose to the client — never include scoring anchors, moves, or exemplars. */
const PI_SAFE_COLUMNS =
  "id, vignette_text, phase_1_prompt, phase_2_prompt, phase_3_prompt, situation_type, audio_storage_path, audio_timing, estimated_narration_seconds" as const;
const CI_SAFE_COLUMNS =
  "id, vignette_text, phase_1_prompt, phase_2_prompt, phase_3_prompt, episode_type, audio_storage_path, audio_timing, estimated_narration_seconds" as const;

export type VignetteData = {
  id: string;
  vignette_text: string;
  vignette_prompt: string;
  phase_2_prompt: string | null;
  phase_3_prompt: string | null;
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
      phase_2_prompt: data.phase_2_prompt ?? null,
      phase_3_prompt: data.phase_3_prompt ?? null,
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
    phase_2_prompt: data.phase_2_prompt ?? null,
    phase_3_prompt: data.phase_3_prompt ?? null,
    type_label: data.episode_type,
    vignette_type: "creative",
    audio_storage_path: data.audio_storage_path,
    audio_timing: data.audio_timing,
    estimated_narration_seconds: data.estimated_narration_seconds,
  };
}

/**
 * Returns the set of completed step numbers (1-4) for a session.
 * A step is complete when all three phases (1, 2, 3) have `response_submitted_at IS NOT NULL`.
 */
export async function getCompletedSteps(
  sessionId: string,
  session: SessionRow
): Promise<Set<number>> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("student_responses")
    .select("vignette_id, response_phase, upload_status")
    .eq("session_id", sessionId)
    .not("response_submitted_at", "is", null);

  if (error || !data) return new Set();

  // Group by vignette_id, collect which phases are submitted.
  //
  // A phase counts as submitted once the recording is reserved, so a student is
  // never blocked while an upload is still in flight ('pending'). But a phase
  // whose upload definitively FAILED does not count: there is no video behind
  // it, so treating it as done sends the student past a vignette that can never
  // be scored. In August 2026 a student walked through three failed uploads to
  // the finish screen with the UI reporting the vignette complete.
  const phasesByVignette = new Map<string, Set<number>>();
  for (const r of data) {
    if (r.upload_status === "failed") continue;
    const existing = phasesByVignette.get(r.vignette_id) ?? new Set();
    existing.add(r.response_phase);
    phasesByVignette.set(r.vignette_id, existing);
  }

  // A step is complete only when all three phases are submitted
  const steps = new Set<number>();

  session.practical_vignette_ids.forEach((id, i) => {
    const phases = phasesByVignette.get(id);
    if (phases && phases.has(1) && phases.has(2) && phases.has(3)) {
      steps.add(i + 1);
    }
  });
  session.creative_vignette_ids.forEach((id, i) => {
    const phases = phasesByVignette.get(id);
    if (phases && phases.has(1) && phases.has(2) && phases.has(3)) {
      steps.add(i + 3);
    }
  });

  return steps;
}

export type ReviewVignette = {
  id: string;
  vignette_text: string;
  phase_1_prompt: string | null;
  phase_2_prompt: string | null;
  phase_3_prompt: string | null;
  type_label: string;
  vignette_type: "practical" | "creative";
  active: boolean;
  audio_url: string | null;
  estimated_narration_seconds: number | null;
};

/**
 * Fetches all PI and CI vignettes for the review page.
 * Generates signed audio download URLs for each vignette that has audio.
 */
export async function getAllVignettesForReview(): Promise<{
  pi: ReviewVignette[];
  ci: ReviewVignette[];
}> {
  const supabase = createServiceClient();

  const [piResult, ciResult] = await Promise.all([
    supabase
      .from("pi_vignettes")
      .select(
        "id, vignette_text, phase_1_prompt, phase_2_prompt, phase_3_prompt, situation_type, active, audio_storage_path, estimated_narration_seconds"
      )
      .order("id"),
    supabase
      .from("ci_vignettes")
      .select(
        "id, vignette_text, phase_1_prompt, phase_2_prompt, phase_3_prompt, episode_type, active, audio_storage_path, estimated_narration_seconds"
      )
      .order("id"),
  ]);

  if (piResult.error) throw new Error(`PI fetch failed: ${piResult.error.message}`);
  if (ciResult.error) throw new Error(`CI fetch failed: ${ciResult.error.message}`);

  async function withAudioUrl(
    row: {
      id: string;
      vignette_text: string;
      phase_1_prompt: string | null;
      phase_2_prompt: string | null;
      phase_3_prompt: string | null;
      active: boolean;
      audio_storage_path: string | null;
      estimated_narration_seconds: number | null;
    },
    typeLabel: string,
    vignetteType: "practical" | "creative"
  ): Promise<ReviewVignette> {
    const audio_url = row.audio_storage_path
      ? await createSignedDownloadUrl("vignette-audio", row.audio_storage_path)
      : null;

    return {
      id: row.id,
      vignette_text: row.vignette_text,
      phase_1_prompt: row.phase_1_prompt,
      phase_2_prompt: row.phase_2_prompt,
      phase_3_prompt: row.phase_3_prompt,
      type_label: typeLabel,
      vignette_type: vignetteType,
      active: row.active,
      audio_url,
      estimated_narration_seconds: row.estimated_narration_seconds,
    };
  }

  const [pi, ci] = await Promise.all([
    Promise.all(
      (piResult.data ?? []).map((row) =>
        withAudioUrl(row, row.situation_type, "practical")
      )
    ),
    Promise.all(
      (ciResult.data ?? []).map((row) =>
        withAudioUrl(row, row.episode_type, "creative")
      )
    ),
  ]);

  return { pi, ci };
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

/**
 * The vignette id a session assigns to a given step, without loading the
 * vignette itself. Used to check a write token's `vid` claim against the step
 * a caller is asking to upload for.
 */
export function vignetteIdForStep(
  session: SessionRow,
  step: number
): string | null {
  if (step <= 2) return session.practical_vignette_ids[step - 1] ?? null;
  return session.creative_vignette_ids[step - 3] ?? null;
}
