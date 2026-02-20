"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ProgressIndicator } from "./ProgressIndicator";
import { VignetteNarrator } from "./VignetteNarrator";
import { ProcessingBuffer } from "./ProcessingBuffer";
import { VideoRecorder } from "./VideoRecorder";
import { CameraPip } from "./CameraPip";
import { useMediaStream } from "@/lib/assessment/use-media-stream";
import { useVideoRecorder } from "@/lib/assessment/use-video-recorder";
import { submitVideoResponse } from "@/lib/actions/response";
import { Button } from "@/components/ui/button";
import { reducer } from "@/lib/assessment/vignette-reducer";
import type { AudioWordTiming } from "@/lib/assessment/narration-timer";

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
  audioTiming: AudioWordTiming[] | null;
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
  servedAt: _servedAt,
  audioUrl,
  audioTiming,
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
        const presignRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vignetteType, step }),
        });

        if (!presignRes.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { uploadUrl, storagePath, token } = await presignRes.json();

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
          xhr.timeout = 120000;

          xhr.open("PUT", uploadUrl, true);
          xhr.setRequestHeader("Content-Type", blob.type || "video/webm");
          if (token) {
            xhr.setRequestHeader("x-upsert", "true");
          }
          xhr.send(blob);
        });

        if (cancelled) return;

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

  const isNarrating = state.phase === "narrating";
  const isTwoColumn =
    state.phase === "buffer" ||
    state.phase === "recording" ||
    state.phase === "uploading";
  const showNarrator =
    state.phase === "narrating" ||
    state.phase === "buffer" ||
    state.phase === "recording";

  return (
    <LayoutGroup>
      <div className="relative flex min-h-dvh flex-col">
        {/* Ambient background orbs */}
        <AmbientBackground phase={state.phase} />

        <ProgressIndicator step={step} totalSteps={totalSteps} />

        <div className="relative z-10 flex flex-1 flex-col px-4 pb-8">
          {/* Camera error banner */}
          {streamStatus === "error" && state.phase !== "uploading" && state.phase !== "transitioning" && (
            <div className="mx-auto mb-4 w-full max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center">
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

          {/* Main content area */}
          <AnimatePresence mode="wait">
            {/* Narrating phase — full-width centered */}
            {isNarrating && (
              <motion.div
                key="narrating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-1 flex-col items-center justify-center"
              >
                <div className="w-full max-w-2xl">
                  <VignetteNarrator
                    vignetteText={vignetteText}
                    vignettePrompt={vignettePrompt}
                    estimatedNarrationSeconds={estimatedNarrationSeconds}
                    audioUrl={audioUrl}
                    audioTiming={audioTiming}
                    showPrompt={false}
                    onComplete={handleNarrationComplete}
                    isActive={true}
                  />
                </div>

                {/* Camera PiP during narration */}
                <CameraPip stream={streamRef.current} />
              </motion.div>
            )}

            {/* Two-column phase — buffer, recording, uploading */}
            {isTwoColumn && (
              <motion.div
                key="two-column"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mx-auto flex w-full max-w-5xl flex-1 items-start pt-4"
              >
                <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_380px]">
                  {/* Left panel — Vignette text + prompt */}
                  <div className="min-w-0">
                    {showNarrator && (
                      <VignetteNarrator
                        vignetteText={vignetteText}
                        vignettePrompt={vignettePrompt}
                        estimatedNarrationSeconds={estimatedNarrationSeconds}
                        audioUrl={audioUrl}
                        audioTiming={audioTiming}
                        showPrompt={true}
                        onComplete={handleNarrationComplete}
                        isActive={false}
                      />
                    )}
                  </div>

                  {/* Right panel — Camera + countdown */}
                  <div className="space-y-4">
                    {state.phase === "buffer" && (
                      <ProcessingBuffer
                        secondsRemaining={bufferRemaining}
                        totalSeconds={BUFFER_SECONDS}
                      />
                    )}

                    <VideoRecorder
                      stream={streamRef.current}
                      isRecording={state.phase === "recording"}
                      isUploading={state.phase === "uploading"}
                      duration={recorder.duration}
                      uploadProgress={uploadProgress}
                      onStop={handleRecordingStop}
                      minRecordingSeconds={MIN_RECORDING_SECONDS}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Transitioning state */}
            {state.phase === "transitioning" && (
              <motion.div
                key="transitioning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 flex-col items-center justify-center gap-4"
              >
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-text-secondary">
                  {step < totalSteps ? "Loading next scenario\u2026" : "Finishing up\u2026"}
                </p>
              </motion.div>
            )}

            {/* Error state */}
            {state.phase === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 flex-col items-center justify-center"
              >
                <div className="w-full max-w-md space-y-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
                  <p className="text-text-primary">{state.errorMessage}</p>
                  <p className="text-sm text-text-secondary">
                    Your recording is saved locally. You can try uploading again.
                  </p>
                  <Button variant="primary" onClick={handleRetry}>
                    Try Again
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LayoutGroup>
  );
}

// --- Ambient gradient orbs behind the glass panels ---
function AmbientBackground({ phase }: { phase: string }) {
  const isActive = phase === "narrating" || phase === "buffer" || phase === "recording";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        animate={{
          x: isActive ? 0 : -40,
          y: isActive ? 0 : 30,
        }}
        transition={{ duration: 3, ease: "easeInOut" }}
        className="absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]"
      />
      <motion.div
        animate={{
          x: isActive ? 0 : 30,
          y: isActive ? 0 : -20,
        }}
        transition={{ duration: 3.5, ease: "easeInOut" }}
        className="absolute -right-24 top-1/3 h-[400px] w-[400px] rounded-full bg-secondary/[0.08] blur-[100px]"
      />
      <motion.div
        animate={{
          x: isActive ? 0 : 20,
          y: isActive ? 0 : 40,
        }}
        transition={{ duration: 4, ease: "easeInOut" }}
        className="absolute -bottom-20 left-1/3 h-[350px] w-[350px] rounded-full bg-primary/[0.06] blur-[100px]"
      />
    </div>
  );
}
