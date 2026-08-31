import { notFound, redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { mintVignetteToken } from "@/lib/assessment/vignette-token";
import { getSessionById } from "@/lib/queries/session";
import {
  getVignetteForStep,
  getCompletedSteps,
  findNextIncomplete,
} from "@/lib/queries/vignettes";
import { recordVignetteServed } from "@/lib/actions/response";
import { createServiceClient } from "@/lib/supabase/server";
import { createSignedDownloadUrl } from "@/lib/supabase/storage";
import { VignetteExperience } from "@/components/assessment/VignetteExperience";
import { StepWithCiBriefing } from "./StepWithCiBriefing";

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

  // 3. Validate session exists and is active (only assigned/in_progress)
  const session = await getSessionById(sessionId);
  if (!session || session.status === "abandoned") {
    redirect("/assess/setup");
  }

  // 4. Enforce linear progression
  const completedSteps = await getCompletedSteps(sessionId, session);

  // `status === "completed"` is set by reserveResponse when the LAST recording
  // stops — before its upload finishes. So "completed" means "finished
  // recording", not "we have every video". Redirecting on it unconditionally
  // deadlocks a student whose upload failed: /complete sends them here because
  // a step is incomplete, and this sends them straight back. Only bounce them
  // to the finish line when every step actually has video behind it.
  if (session.status === "completed" && completedSteps.size >= TOTAL_STEPS) {
    redirect("/assess/complete");
  }

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

  // 9. Mint a capability token for this (session, vignette). The client keeps
  // it in memory so an already-captured recording can still be saved if the
  // session cookie is lost part-way through the vignette.
  const writeToken = await mintVignetteToken(sessionId, vignette.id);

  const vignetteElement = (
    <VignetteExperience
      step={step}
      totalSteps={TOTAL_STEPS}
      sessionId={sessionId}
      writeToken={writeToken}
      vignetteId={vignette.id}
      vignetteType={vignette.vignette_type}
      vignetteText={vignette.vignette_text}
      vignettePrompt={vignette.vignette_prompt}
      phase2Prompt={vignette.phase_2_prompt}
      phase3Prompt={vignette.phase_3_prompt}
      servedAt={servedAt}
      audioUrl={audioUrl}
      audioTiming={vignette.audio_timing}
      estimatedNarrationSeconds={vignette.estimated_narration_seconds}
    />
  );

  if (step === 3) {
    return <StepWithCiBriefing sessionId={sessionId}>{vignetteElement}</StepWithCiBriefing>;
  }

  return vignetteElement;
}

