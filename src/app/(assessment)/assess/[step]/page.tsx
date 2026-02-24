import { notFound, redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { getActiveSession } from "@/lib/queries/session";
import {
  getVignetteForStep,
  getCompletedSteps,
  findNextIncomplete,
} from "@/lib/queries/vignettes";
import { recordVignetteServed } from "@/lib/actions/response";
import { createServiceClient } from "@/lib/supabase/server";
import { createSignedDownloadUrl } from "@/lib/supabase/storage";
import { VignetteExperience } from "@/components/assessment/VignetteExperience";

export const dynamic = "force-dynamic";

const TOTAL_STEPS = 4;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  return { title: `Step ${step} of ${TOTAL_STEPS}` };
}

export default async function StepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step: stepParam } = await params;

  // 1. Validate step is 1-4
  const step = parseInt(stepParam, 10);
  if (isNaN(step) || step < 1 || step > TOTAL_STEPS) {
    notFound();
  }

  // 2. Validate session cookie
  const sessionId = await readSessionCookie();
  if (!sessionId) {
    redirect("/assess/setup");
  }

  // 3. Validate active session
  const session = await getActiveSession(sessionId);
  if (!session) {
    redirect("/assess/setup");
  }

  // 4. Enforce linear progression
  const completedSteps = await getCompletedSteps(sessionId, session);

  if (completedSteps.has(step)) {
    // Already completed this step — redirect to next incomplete or complete page
    const nextIncomplete = findNextIncomplete(completedSteps);
    redirect(nextIncomplete ? `/assess/${nextIncomplete}` : "/assess/complete");
  }

  if (step > 1 && !completedSteps.has(step - 1)) {
    // Trying to skip ahead — redirect to the correct step
    const nextIncomplete = findNextIncomplete(completedSteps);
    redirect(nextIncomplete ? `/assess/${nextIncomplete}` : "/assess/complete");
  }

  // 5. Fetch vignette data (safe columns only)
  const vignette = await getVignetteForStep(session, step);
  if (!vignette) {
    throw new Error(`No vignette found for step ${step}`);
  }

  // 6. Record vignette_served_at
  const servedAt = new Date().toISOString();
  await recordVignetteServed(
    sessionId,
    vignette.id,
    vignette.vignette_type,
    servedAt
  );

  // 7. Transition session to in_progress on first step
  if (step === 1 && session.status === "assigned") {
    const supabase = createServiceClient();
    await supabase
      .from("assessment_sessions")
      .update({ status: "in_progress", started_at: servedAt })
      .eq("id", sessionId);
  }

  // 8. Generate signed audio URL if audio has been generated
  const audioUrl = vignette.audio_storage_path
    ? await createSignedDownloadUrl("vignette-audio", vignette.audio_storage_path)
    : null;

  return (
    <VignetteExperience
      step={step}
      totalSteps={TOTAL_STEPS}
      sessionId={sessionId}
      vignetteId={vignette.id}
      vignetteType={vignette.vignette_type}
      vignetteText={vignette.vignette_text}
      vignettePrompt={vignette.vignette_prompt}
      phase2Prompt={vignette.phase_2_prompt}
      servedAt={servedAt}
      audioUrl={audioUrl}
      audioTiming={vignette.audio_timing}
      estimatedNarrationSeconds={vignette.estimated_narration_seconds}
    />
  );
}

