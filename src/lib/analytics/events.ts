import posthog from "posthog-js";

function capture(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    posthog.capture(event, properties);
  } catch {
    // PostHog not initialized — no-op
  }
}

export function assessmentStarted(sessionId: string) {
  capture("assessment_started", { sessionId });
}

export function vignetteViewed(
  sessionId: string,
  step: number,
  vignetteType: string,
) {
  capture("vignette_viewed", { sessionId, step, vignetteType });
}

export function vignetteCompleted(
  sessionId: string,
  step: number,
  vignetteType: string,
) {
  capture("vignette_completed", { sessionId, step, vignetteType });
}

export function intelligenceCompleted(sessionId: string) {
  capture("intelligence_completed", { sessionId });
}

export function emailCaptured(sessionId: string, leadType: string) {
  capture("email_captured", { sessionId, leadType });
}

export function personalityStarted(sessionId: string) {
  capture("personality_started", { sessionId });
}

export function personalityPageCompleted(sessionId: string, page: number) {
  capture("personality_page_completed", { sessionId, page });
}

export function personalityCompleted(sessionId: string, variant: string) {
  capture("personality_completed", { sessionId, variant });
}

export function assessmentCompleted(sessionId: string, variant: string) {
  capture("assessment_completed", { sessionId, variant });
}

export function resultsViewed() {
  capture("results_viewed");
}

export function uploadFailed(
  sessionId: string,
  step: number,
  phase: number,
) {
  capture("upload_failed", { sessionId, step, phase });
}
