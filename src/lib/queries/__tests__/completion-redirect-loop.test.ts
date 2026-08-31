import { describe, it, expect } from "vitest";

/**
 * Regression test for the redirect loop introduced alongside the upload-failure
 * completion gate (2026-08-31, found by adversarial review before any student
 * hit it).
 *
 * `reserveResponse` sets `session.status = "completed"` when the LAST recording
 * stops — BEFORE its upload finishes. Once `getCompletedSteps` began excluding
 * phases with `upload_status = 'failed'`, these two rules deadlocked:
 *
 *   complete/page.tsx   — completedSteps.size < 4      → redirect(/assess/N)
 *   assess/[step]/page  — session.status === "completed" → redirect(/assess/complete)
 *
 * A student whose upload failed bounced between them forever and could never
 * re-record. That is strictly worse than the silent data loss it replaced.
 *
 * The fix makes the step page's bounce conditional on every step actually
 * having video behind it. This test pins the routing decision itself.
 */

const TOTAL_STEPS = 4;

/** Mirrors assess/[step]/page.tsx — does the step page bounce to /complete? */
function stepPageRedirectsToComplete(
  sessionStatus: string,
  completedSteps: Set<number>
): boolean {
  return sessionStatus === "completed" && completedSteps.size >= TOTAL_STEPS;
}

/** Mirrors complete/page.tsx — does the complete page bounce back to a step? */
function completePageRedirectsToStep(completedSteps: Set<number>): boolean {
  return completedSteps.size < TOTAL_STEPS;
}

describe("completion routing — no deadlock when an upload fails", () => {
  it("does not bounce both ways when a step is incomplete", () => {
    // The incident shape: session marked completed, but step 4's upload failed.
    const completed = new Set([1, 2, 3]);

    expect(completePageRedirectsToStep(completed)).toBe(true);
    expect(stepPageRedirectsToComplete("completed", completed)).toBe(false);
    // Exactly one side redirects, so the student lands on step 4 and can re-record.
  });

  it("still sends a genuinely finished student to the completion page", () => {
    const completed = new Set([1, 2, 3, 4]);

    expect(completePageRedirectsToStep(completed)).toBe(false);
    expect(stepPageRedirectsToComplete("completed", completed)).toBe(true);
  });

  it("never lets both pages redirect at once, for any completion state", () => {
    // Exhaustive: the deadlock is precisely "both true" at the same time.
    for (let size = 0; size <= TOTAL_STEPS; size++) {
      const completed = new Set(
        Array.from({ length: size }, (_, i) => i + 1)
      );
      const bothRedirect =
        completePageRedirectsToStep(completed) &&
        stepPageRedirectsToComplete("completed", completed);
      expect(bothRedirect).toBe(false);
    }
  });

  it("leaves in-progress sessions untouched", () => {
    const completed = new Set([1, 2]);
    expect(stepPageRedirectsToComplete("in_progress", completed)).toBe(false);
  });
});
