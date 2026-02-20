"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressIndicator } from "./ProgressIndicator";
import { VignetteNarrator } from "./VignetteNarrator";
import { ProcessingBuffer } from "./ProcessingBuffer";
import { VideoRecorder } from "./VideoRecorder";
import { useMediaStream } from "@/lib/assessment/use-media-stream";
import { useVideoRecorder } from "@/lib/assessment/use-video-recorder";
import { submitVideoResponse } from "@/lib/actions/response";
import { Button } from "@/components/ui/button";
import { reducer } from "@/lib/assessment/vignette-reducer";

// --- Constants ---
const BUFFER_SECONDS = 30;
const MIN_RECORDING_SECONDS = 10;
const MAX_RECORDING_SECONDS = 180;
const MAX_UPLOAD_RETRIES = 3;

// --- Props ---
type VignetteExperienceProps = {
  step: number;
  totalSteps: number;
  sessionId: string;
  vignetteId: string;
  vignetteType: "practical" | "creative";
  vignetteText: string;
  vignettePrompt: string;
  servedAt: string;
  audioUrl: string | null;
  estimatedNarrationSeconds: number | null;
};

export function VignetteExperience({
  step,
  totalSteps,
  sessionId,
  vignetteId,
  vignetteType,
  vignetteText,
  vignettePrompt,
  servedAt,
  estimatedNarrationSeconds,
}: VignetteExperienceProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, {
    phase: "narrating",
    errorMessage: null,
    retryCount: 0,
  });

  const { stream, streamRef, status: streamStatus, error: streamError, retry: retryStream } = useMediaStream();
  const recorder = useVideoRecorder(stream);
  const [bufferRemaining, setBufferRemaining] = useState(BUFFER_SECONDS);
  const [uploadProgress, setUploadProgress] = useState(0);
  const blobRef = useRef<Blob | null>(null);
  const uploadAttemptRef = useRef(0);

  // --- Buffer countdown ---
  useEffect(() => {
    if (state.phase !== "buffer") return;

    setBufferRemaining(BUFFER_SECONDS);
    const interval = setInterval(() => {
      setBufferRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          dispatch({ type: "BUFFER_COMPLETE" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.phase]);

  // --- Auto-start recording when buffer completes ---
  useEffect(() => {
    if (state.phase === "recording" && recorder.status === "idle") {
      recorder.start();
    }
  }, [state.phase, recorder]);

  // --- Auto-stop at max recording time ---
  useEffect(() => {
    if (state.phase !== "recording") return;
    if (recorder.duration >= MAX_RECORDING_SECONDS) {
      recorder.stop();
    }
  }, [state.phase, recorder.duration, recorder]);

  // --- Handle recording stop → upload transition ---
  useEffect(() => {
    if (recorder.status === "done" && recorder.blob && state.phase === "recording") {
      blobRef.current = recorder.blob;
      dispatch({ type: "RECORDING_STOPPED" });
    }
  }, [recorder.status, recorder.blob, state.phase]);

  // --- Handle camera error during recording ---
  useEffect(() => {
    if (
      recorder.status === "error" &&
      recorder.blob &&
      state.phase === "recording"
    ) {
      // Partial recording — upload what we have
      blobRef.current = recorder.blob;
      dispatch({ type: "RECORDING_STOPPED" });
    }
  }, [recorder.status, recorder.blob, state.phase]);

  // --- Upload flow ---
  useEffect(() => {
    if (state.phase !== "uploading" || !blobRef.current) return;

    let cancelled = false;

    async function upload() {
      const blob = blobRef.current;
      if (!blob) return;

      try {
        // Get presigned URL
        const presignRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vignetteType, step }),
        });

        if (!presignRes.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { uploadUrl, storagePath, token } = await presignRes.json();

        // Upload via XHR for progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && !cancelled) {
              setUploadProgress((e.loaded / e.total) * 100);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Upload network error"));
          xhr.ontimeout = () => reject(new Error("Upload timed out"));
          xhr.timeout = 120000; // 2 minutes

          xhr.open("PUT", uploadUrl, true);
          xhr.setRequestHeader("Content-Type", blob.type || "video/webm");
          if (token) {
            xhr.setRequestHeader("x-upsert", "true");
          }
          xhr.send(blob);
        });

        if (cancelled) return;

        // Submit to server action
        const result = await submitVideoResponse({
          sessionId,
          vignetteId,
          vignetteType,
          step,
          storagePath,
          videoDurationSeconds: recorder.duration,
          recordingStartedAt: recorder.startTime ?? new Date().toISOString(),
        });

        if (cancelled) return;

        dispatch({ type: "UPLOAD_COMPLETE" });

        // Navigate
        setTimeout(() => {
          if (result.complete) {
            router.push("/assess/complete");
          } else if (result.nextStep) {
            router.push(`/assess/${result.nextStep}`);
          }
        }, 800);
      } catch (err) {
        if (cancelled) return;

        uploadAttemptRef.current += 1;
        if (uploadAttemptRef.current < MAX_UPLOAD_RETRIES) {
          // Retry with exponential backoff — call upload() directly
          // instead of dispatching, since phase is already "uploading"
          const delay = Math.pow(2, uploadAttemptRef.current) * 1000;
          setTimeout(() => {
            if (!cancelled) {
              setUploadProgress(0);
              upload();
            }
          }, delay);
        } else {
          dispatch({
            type: "ERROR",
            message:
              err instanceof Error
                ? err.message
                : "Upload failed after multiple attempts",
          });
        }
      }
    }

    upload();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.retryCount]);

  const handleNarrationComplete = useCallback(() => {
    dispatch({ type: "NARRATION_COMPLETE" });
  }, []);

  const handleRecordingStop = useCallback(() => {
    recorder.stop();
  }, [recorder]);

  const handleRetry = useCallback(() => {
    uploadAttemptRef.current = 0;
    setUploadProgress(0);
    dispatch({ type: "RETRY" });
  }, []);

  const showCamera =
    state.phase === "buffer" ||
    state.phase === "recording" ||
    state.phase === "uploading";

  return (
    <div className="flex min-h-dvh flex-col">
      <ProgressIndicator
        step={step}
        totalSteps={totalSteps}
        vignetteType={vignetteType}
      />

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 pb-8">
        {/* Camera error at the top level */}
        {streamStatus === "error" && state.phase !== "uploading" && state.phase !== "transitioning" && (
          <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
            <p className="text-sm text-red-400">{streamError}</p>
            <button
              type="button"
              onClick={retryStream}
              className="mt-2 text-sm text-primary underline underline-offset-2"
            >
              Retry camera access
            </button>
          </div>
        )}

        {/* Narrator — visible during narrating, buffer, recording */}
        {(state.phase === "narrating" ||
          state.phase === "buffer" ||
          state.phase === "recording") && (
          <VignetteNarrator
            vignetteText={vignetteText}
            vignettePrompt={vignettePrompt}
            estimatedNarrationSeconds={estimatedNarrationSeconds}
            showPrompt={state.phase !== "narrating"}
            onComplete={handleNarrationComplete}
            isActive={state.phase === "narrating"}
          />
        )}

        {/* Buffer countdown */}
        {state.phase === "buffer" && (
          <ProcessingBuffer
            secondsRemaining={bufferRemaining}
            totalSeconds={BUFFER_SECONDS}
          />
        )}

        {/* Camera preview + recorder */}
        {showCamera && (
          <VideoRecorder
            stream={streamRef.current}
            isRecording={state.phase === "recording"}
            isUploading={state.phase === "uploading"}
            duration={recorder.duration}
            uploadProgress={uploadProgress}
            onStop={handleRecordingStop}
            minRecordingSeconds={MIN_RECORDING_SECONDS}
          />
        )}

        {/* Transitioning state */}
        {state.phase === "transitioning" && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-text-secondary">
              {step < totalSteps ? "Loading next scenario\u2026" : "Finishing up\u2026"}
            </p>
          </div>
        )}

        {/* Error state */}
        {state.phase === "error" && (
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-text-primary">{state.errorMessage}</p>
            <p className="text-sm text-text-secondary">
              Your recording is saved locally. You can try uploading again.
            </p>
            <Button variant="primary" onClick={handleRetry}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
