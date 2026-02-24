"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useUploadQueue } from "@/lib/assessment/upload-queue";
import { cn } from "@/lib/utils";

export function UploadStatusBar() {
  const { jobs, retryJob, hasPendingUploads, allComplete } = useUploadQueue();
  const [dismissed, setDismissed] = useState(false);

  // Auto-dismiss 3s after all uploads complete
  useEffect(() => {
    if (!allComplete) {
      setDismissed(false);
      return;
    }
    const timer = setTimeout(() => setDismissed(true), 3000);
    return () => clearTimeout(timer);
  }, [allComplete]);

  const activeJobs = jobs.filter(
    (j) => j.status === "queued" || j.status === "uploading"
  );
  const failedJobs = jobs.filter((j) => j.status === "failed");
  const completedCount = jobs.filter((j) => j.status === "completed").length;

  const isVisible =
    (hasPendingUploads || failedJobs.length > 0 || (allComplete && !dismissed)) &&
    jobs.length > 0;

  // Detect slow upload (< 100 KB/s for 10+ seconds heuristic)
  // We approximate this by checking if an uploading job has < 10% progress after being active
  const currentUpload = jobs.find((j) => j.status === "uploading");
  const [slowDetected, setSlowDetected] = useState(false);

  useEffect(() => {
    if (!currentUpload || currentUpload.status !== "uploading") {
      setSlowDetected(false);
      return;
    }
    // Check after 10 seconds if progress is still low
    const timer = setTimeout(() => {
      if (currentUpload.progress < 10) {
        setSlowDetected(true);
      }
    }, 10_000);
    return () => clearTimeout(timer);
  }, [currentUpload?.id, currentUpload?.status, currentUpload?.progress]);

  // Average progress across active jobs
  const avgProgress =
    activeJobs.length > 0
      ? activeJobs.reduce((sum, j) => sum + j.progress, 0) / activeJobs.length
      : 0;

  const hasFailed = failedJobs.length > 0;
  const tint = hasFailed ? "red" : slowDetected ? "amber" : "default";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div
            className={cn(
              "mx-auto max-w-2xl px-4 py-2",
            )}
          >
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm backdrop-blur-md",
                tint === "red" &&
                  "border-red-500/30 bg-red-500/10 text-red-300",
                tint === "amber" &&
                  "border-amber-500/30 bg-amber-500/10 text-amber-300",
                tint === "default" &&
                  "border-border-glass bg-bg-elevated/60 text-text-secondary"
              )}
            >
              {/* Status icon */}
              {allComplete ? (
                <svg
                  className="h-4 w-4 shrink-0 text-emerald-400"
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
              ) : hasFailed ? (
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              ) : (
                <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}

              {/* Message */}
              <span className="min-w-0 flex-1 truncate" aria-live="polite">
                {allComplete
                  ? "All responses saved"
                  : hasFailed
                    ? `Upload failed for ${failedJobs.length} response${failedJobs.length > 1 ? "s" : ""}`
                    : `Saving response ${completedCount + 1} of ${jobs.length}\u2026`}
              </span>

              {/* Progress bar (for active uploads) */}
              {hasPendingUploads && !hasFailed && (
                <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${avgProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}

              {/* Retry button for failed jobs */}
              {hasFailed && (
                <button
                  type="button"
                  onClick={() => failedJobs.forEach((j) => retryJob(j.id))}
                  className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/30"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
