import { describe, it, expect } from "vitest";
import type { UploadJob } from "@/lib/assessment/upload-queue";

/**
 * Regression tests for the August 2026 silent upload loss.
 *
 * A student re-recorded vignette 4 after an error. Phase 1's upload hit a
 * permanent 400 (the storage path already existed and signed URLs were minted
 * with `upsert: false`). The queue selected work with:
 *
 *     jobs.find((j) => j.status === "queued")
 *
 * and a failing job is re-queued in place, so phase 1 was picked on every pass
 * and phases 2 and 3 never attempted even once. All three recordings were lost
 * while the UI reported the vignette complete.
 *
 * These tests pin the selection rule itself. The rule is duplicated here rather
 * than exported because the provider is a React component; if the selector in
 * upload-queue.tsx changes, this must change with it.
 */
function selectNextJob(jobs: UploadJob[], now: number): UploadJob | undefined {
  return jobs.find(
    (j) => j.status === "queued" && (j.nextAttemptAt ?? 0) <= now
  );
}

function job(overrides: Partial<UploadJob> & { id: string }): UploadJob {
  return {
    sessionId: "s1",
    vignetteId: "v4",
    vignetteType: "creative",
    step: 4,
    responsePhase: 1,
    status: "queued",
    progress: 0,
    retryCount: 0,
    ...overrides,
  };
}

const NOW = 1_000_000;

describe("upload queue — next job selection", () => {
  it("picks the first runnable job", () => {
    const jobs = [job({ id: "p1" }), job({ id: "p2", responsePhase: 2 })];
    expect(selectNextJob(jobs, NOW)?.id).toBe("p1");
  });

  it("does not head-of-line block behind a job that is backing off", () => {
    // The exact August 2026 shape: phase 1 keeps failing and is re-queued with
    // a backoff. Phases 2 and 3 must still get their turn.
    const jobs = [
      job({ id: "p1", retryCount: 2, nextAttemptAt: NOW + 8_000 }),
      job({ id: "p2", responsePhase: 2 }),
      job({ id: "p3", responsePhase: 3 }),
    ];
    expect(selectNextJob(jobs, NOW)?.id).toBe("p2");
  });

  it("returns to the backed-off job once its delay elapses", () => {
    const jobs = [
      job({ id: "p1", retryCount: 2, nextAttemptAt: NOW + 8_000 }),
      job({ id: "p2", responsePhase: 2, status: "completed" }),
    ];
    expect(selectNextJob(jobs, NOW)).toBeUndefined();
    expect(selectNextJob(jobs, NOW + 8_000)?.id).toBe("p1");
  });

  it("treats a job with no backoff as immediately runnable", () => {
    const jobs = [job({ id: "p1" })];
    expect(selectNextJob(jobs, 0)?.id).toBe("p1");
  });

  it("skips jobs that are not queued", () => {
    const jobs = [
      job({ id: "p1", status: "uploading" }),
      job({ id: "p2", responsePhase: 2, status: "failed" }),
      job({ id: "p3", responsePhase: 3, status: "completed" }),
      job({ id: "p4", responsePhase: 1, step: 3 }),
    ];
    expect(selectNextJob(jobs, NOW)?.id).toBe("p4");
  });

  it("permanently-failing phase 1 cannot starve the rest of the vignette", () => {
    // Walk the queue the way the effect does: every pass must make progress on
    // *some* phase, never spin on the same doomed job.
    let jobs: UploadJob[] = [
      job({ id: "p1" }),
      job({ id: "p2", responsePhase: 2 }),
      job({ id: "p3", responsePhase: 3 }),
    ];
    const attempted: string[] = [];
    let clock = NOW;

    for (let i = 0; i < 3; i++) {
      const next = selectNextJob(jobs, clock);
      if (!next) break;
      attempted.push(next.id);
      // p1 always fails and backs off; the others succeed.
      jobs = jobs.map((j) =>
        j.id !== next.id
          ? j
          : next.id === "p1"
            ? { ...j, retryCount: j.retryCount + 1, nextAttemptAt: clock + 60_000 }
            : { ...j, status: "completed" as const }
      );
      clock += 1_000;
    }

    expect(attempted).toEqual(["p1", "p2", "p3"]);
  });
});
