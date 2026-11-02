"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useUploadQueue } from "@/lib/assessment/upload-queue";

const GATE_TIMEOUT_MS = 60_000; // Show children after 60s regardless

export function UploadGate({ children }: { children: ReactNode }) {
  const { jobs, hasPendingUploads, allComplete, failedJobs, retryJob } =
    useUploadQueue();
  const [timedOut, setTimedOut] = useState(false);

  // If there are no jobs (e.g. user navigated directly), show children immediately
  const noJobs = jobs.length === 0;

  // Timeout: after 60s, show children regardless
  useEffect(() => {
    if (!hasPendingUploads) return;
    const timer = setTimeout(() => setTimedOut(true), GATE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [hasPendingUploads]);

  // Show children when: all complete, no jobs, timed out, or only failed (with timeout)
  const showChildren =
    noJobs || allComplete || timedOut || (!hasPendingUploads && failedJobs.length > 0);

  if (showChildren) {
    return (
      <>
        {/* Subtle note if uploads failed */}
        {failedJobs.length > 0 && (
          <div className="mx-auto mb-4 w-full max-w-lg px-4">
            <div className="border border-ink px-4 py-3 text-center text-sm text-ink">
              <p>
                {failedJobs.length} video upload{failedJobs.length > 1 ? "s" : ""} couldn&rsquo;t
                complete. Don&rsquo;t worry &mdash; your responses were recorded.
              </p>
              <button
                type="button"
                onClick={() => failedJobs.forEach((j) => retryJob(j.id))}
                className="mt-1.5 text-xs font-semibold text-ink underline underline-offset-2 hover:text-text-secondary"
              >
                Try uploading again
              </button>
            </div>
          </div>
        )}
        {children}
      </>
    );
  }

  // Waiting state
  const completedCount = jobs.filter((j) => j.status === "completed").length;
  const totalCount = jobs.length;

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div className="mx-auto mb-6 h-6 w-6 animate-spin rounded-full border-2 border-ink border-t-transparent" />

        <h1 className="font-display text-[clamp(34px,8vw,56px)] font-semibold leading-[0.98] tracking-[-0.045em] text-ink">
          Almost done&#8230;
        </h1>
        <p className="mt-2 text-[length:var(--text-fluid-base)] text-text-secondary">
          Finishing video uploads. Please keep this tab open.
        </p>

        {/* Per-job progress */}
        <div className="mx-auto mt-6 w-full max-w-xs space-y-2">
          {jobs.map((job, i) => (
            <div key={job.id} className="flex items-center gap-3">
              <span className="shrink-0 text-sm tabular-nums text-text-secondary">
                {i + 1}.
              </span>
              <div className="h-1 flex-1 overflow-hidden bg-ink/10">
                <motion.div
                  className="h-full bg-ink"
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      job.status === "completed"
                        ? "100%"
                        : `${job.progress}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              {job.status === "completed" && (
                <svg
                  className="h-4 w-4 shrink-0 text-ink"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              )}
              {job.status === "failed" && (
                <svg
                  className="h-4 w-4 shrink-0 text-ink"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm tabular-nums text-text-secondary" aria-live="polite">
          {completedCount} of {totalCount} uploaded
        </p>
      </motion.div>
    </div>
  );
}
