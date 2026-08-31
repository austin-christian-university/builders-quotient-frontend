"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { confirmUpload, reportUploadFailure } from "@/lib/actions/response-upload";
import * as analytics from "@/lib/analytics/events";

// --- Types ---

export type UploadJobStatus = "queued" | "uploading" | "completed" | "failed";

export type UploadJob = {
  id: string;
  sessionId: string;
  /** Capability token for (session, vignette); see lib/assessment/vignette-token.ts */
  writeToken: string;
  vignetteId: string;
  vignetteType: "practical" | "creative";
  step: number;
  responsePhase: number;
  status: UploadJobStatus;
  progress: number;
  retryCount: number;
  /** Epoch ms before which this job must not be retried (backoff). */
  nextAttemptAt?: number;
  error?: string;
};

type EnqueuePayload = {
  blob: Blob;
  sessionId: string;
  writeToken: string;
  vignetteId: string;
  vignetteType: "practical" | "creative";
  step: number;
  responsePhase: number;
};

type UploadQueueContextValue = {
  jobs: UploadJob[];
  enqueue: (payload: EnqueuePayload) => void;
  retryJob: (jobId: string) => void;
  hasPendingUploads: boolean;
  allComplete: boolean;
  failedJobs: UploadJob[];
};

const UploadQueueContext = createContext<UploadQueueContextValue | null>(null);

// --- Constants ---
const MAX_RETRIES = 5;
const STALL_TIMEOUT_MS = 30_000;
const BACKOFF_BASE_MS = 2000;

// --- Provider ---

export function UploadQueueProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  // Bumped when a backoff timer expires, to re-run the queue effect.
  const [tick, setTick] = useState(0);
  const blobMapRef = useRef<Map<string, Blob>>(new Map());
  const processingRef = useRef(false);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived state
  const hasPendingUploads = jobs.some(
    (j) => j.status === "queued" || j.status === "uploading"
  );
  const allComplete =
    jobs.length > 0 && jobs.every((j) => j.status === "completed");
  const failedJobs = jobs.filter((j) => j.status === "failed");

  // --- beforeunload guard ---
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (jobs.some((j) => j.status === "queued" || j.status === "uploading")) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [jobs]);

  // --- Enqueue ---
  const enqueue = useCallback((payload: EnqueuePayload) => {
    const id = `${payload.sessionId}-${payload.vignetteType}-${payload.step}-p${payload.responsePhase}`;
    blobMapRef.current.set(id, payload.blob);
    setJobs((prev) => {
      // Replace existing job if re-enqueued (e.g. manual retry)
      const filtered = prev.filter((j) => j.id !== id);
      return [
        ...filtered,
        {
          id,
          sessionId: payload.sessionId,
          writeToken: payload.writeToken,
          vignetteId: payload.vignetteId,
          vignetteType: payload.vignetteType,
          step: payload.step,
          responsePhase: payload.responsePhase,
          status: "queued" as const,
          progress: 0,
          retryCount: 0,
        },
      ];
    });
  }, []);

  // --- Retry a failed job ---
  const retryJob = useCallback((jobId: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: "queued" as const,
              progress: 0,
              error: undefined,
              nextAttemptAt: undefined,
            }
          : j
      )
    );
  }, []);

  // --- Process queue sequentially ---
  //
  // Picks the first job that is queued AND past its backoff. Selecting purely
  // on `status === "queued"` head-of-line blocks: a job that keeps failing is
  // re-queued at the front, so every later phase starves behind it and never
  // attempts even once. In August 2026 a student's vignette-4 phase-1 upload
  // hit a permanent 400; phases 2 and 3 were never tried, and all three
  // recordings were lost while the UI reported the vignette complete.
  useEffect(() => {
    if (processingRef.current) return;

    const now = Date.now();
    const nextJob = jobs.find(
      (j) => j.status === "queued" && (j.nextAttemptAt ?? 0) <= now
    );

    if (!nextJob) {
      // Nothing runnable now. If something is merely backing off, wake up when
      // the soonest one becomes eligible — otherwise it waits for an unrelated
      // state change that may never come.
      const soonest = jobs
        .filter((j) => j.status === "queued" && (j.nextAttemptAt ?? 0) > now)
        .reduce<number | null>(
          (min, j) => (min === null ? j.nextAttemptAt! : Math.min(min, j.nextAttemptAt!)),
          null
        );
      if (soonest !== null) {
        const timer = setTimeout(() => setTick((t) => t + 1), soonest - now);
        return () => clearTimeout(timer);
      }
      return;
    }

    processingRef.current = true;

    const blob = blobMapRef.current.get(nextJob.id);
    if (!blob) {
      // Blob was lost (shouldn't happen), mark failed
      setJobs((prev) =>
        prev.map((j) =>
          j.id === nextJob.id
            ? { ...j, status: "failed" as const, error: "Recording data lost" }
            : j
        )
      );
      processingRef.current = false;
      return;
    }

    // Mark as uploading
    setJobs((prev) =>
      prev.map((j) =>
        j.id === nextJob.id ? { ...j, status: "uploading" as const, progress: 0 } : j
      )
    );

    processJob(nextJob, blob);

    async function processJob(job: UploadJob, jobBlob: Blob) {
      try {
        // Step 1: Get presigned URL
        const presignRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // The job's own session, so the route cannot sign a path for a
            // different session than confirmUpload will record.
            sessionId: job.sessionId,
            vignetteType: job.vignetteType,
            step: job.step,
            responsePhase: job.responsePhase,
            writeToken: job.writeToken,
          }),
        });

        if (!presignRes.ok) {
          throw new Error(`Failed to get upload URL (${presignRes.status})`);
        }

        // storagePath intentionally ignored: confirmUpload derives it from
        // (session, type, step, phase) server-side rather than trusting the client.
        const { uploadUrl, token } = await presignRes.json();

        // Step 2: XHR PUT with progress tracking + stall detection
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;

          // Stall detection: reset timer on every progress event
          function resetStallTimer() {
            if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
            stallTimerRef.current = setTimeout(() => {
              console.warn("[BQ Upload Queue] Stall detected, aborting");
              xhr.abort();
            }, STALL_TIMEOUT_MS);
          }

          resetStallTimer();

          xhr.upload.onprogress = (e) => {
            resetStallTimer();
            const total = e.lengthComputable ? e.total : jobBlob.size;
            const pct = total > 0 ? (e.loaded / total) * 100 : 0;
            setJobs((prev) =>
              prev.map((j) =>
                j.id === job.id ? { ...j, progress: pct } : j
              )
            );
          };

          xhr.onload = () => {
            xhrRef.current = null;
            if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(
                new Error(`Upload failed: ${xhr.status}`)
              );
            }
          };

          xhr.onerror = () => {
            xhrRef.current = null;
            if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
            reject(new Error("Network error during upload"));
          };

          xhr.ontimeout = () => {
            xhrRef.current = null;
            if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
            reject(new Error("Upload timed out"));
          };

          xhr.onabort = () => {
            xhrRef.current = null;
            if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
            reject(new Error("Upload stalled"));
          };

          // Dynamic timeout: worst-case 0.5 Mbps + 60s buffer
          xhr.timeout = Math.max(
            120_000,
            Math.ceil(jobBlob.size / (64 * 1024)) * 1000 + 60_000
          );

          xhr.open("PUT", uploadUrl, true);
          const contentType = (jobBlob.type || "video/webm").split(";")[0];
          xhr.setRequestHeader("Content-Type", contentType);
          if (token) {
            xhr.setRequestHeader("x-upsert", "true");
          }
          xhr.send(jobBlob);
        });

        // Step 3: Confirm upload via server action
        await confirmUpload({
          sessionId: job.sessionId,
          writeToken: job.writeToken,
          vignetteId: job.vignetteId,
          vignetteType: job.vignetteType,
          step: job.step,
          responsePhase: job.responsePhase,
        });

        // Success — release blob, mark completed
        blobMapRef.current.delete(job.id);
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? { ...j, status: "completed" as const, progress: 100 }
              : j
          )
        );
        processingRef.current = false;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const currentRetry =
          jobs.find((j) => j.id === job.id)?.retryCount ?? 0;

        if (currentRetry < MAX_RETRIES - 1) {
          // Retry with exponential backoff
          const delay = BACKOFF_BASE_MS * Math.pow(2, currentRetry);
          console.log(
            `[BQ Upload Queue] Retry ${currentRetry + 1}/${MAX_RETRIES} for ${job.id} in ${delay}ms`
          );

          setJobs((prev) =>
            prev.map((j) =>
              j.id === job.id
                ? {
                    ...j,
                    status: "queued" as const,
                    progress: 0,
                    retryCount: currentRetry + 1,
                    nextAttemptAt: Date.now() + delay,
                  }
                : j
            )
          );

          // Release the worker immediately. The backoff now lives on the job
          // itself, so other phases can upload while this one waits instead of
          // the whole queue idling.
          processingRef.current = false;
        } else {
          // All retries exhausted
          console.error(
            `[BQ Upload Queue] All retries exhausted for ${job.id}: ${errMsg}`
          );

          // Analytics: track upload failure
          analytics.uploadFailed(job.sessionId, job.step, job.responsePhase);

          // Report failure to server
          reportUploadFailure({
            sessionId: job.sessionId,
            writeToken: job.writeToken,
            vignetteId: job.vignetteId,
            responsePhase: job.responsePhase,
          }).catch(() => {
            // Best-effort — don't throw if this fails
          });

          setJobs((prev) =>
            prev.map((j) =>
              j.id === job.id
                ? {
                    ...j,
                    status: "failed" as const,
                    error: errMsg,
                    retryCount: currentRetry + 1,
                  }
                : j
            )
          );
          processingRef.current = false;
        }
      }
    }
  }, [jobs, tick]);

  return (
    <UploadQueueContext.Provider
      value={{ jobs, enqueue, retryJob, hasPendingUploads, allComplete, failedJobs }}
    >
      {children}
    </UploadQueueContext.Provider>
  );
}

export function useUploadQueue() {
  const ctx = useContext(UploadQueueContext);
  if (!ctx) {
    throw new Error("useUploadQueue must be used within UploadQueueProvider");
  }
  return ctx;
}
