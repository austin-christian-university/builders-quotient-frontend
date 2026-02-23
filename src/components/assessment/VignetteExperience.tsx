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
import { useAudioNarrator } from "@/lib/assessment/use-audio-narrator";
import type { AudioWordTiming } from "@/lib/assessment/narration-timer";
import dynamic from "next/dynamic";

const DevToolbar =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("./DevToolbar").then((m) => ({ default: m.DevToolbar })), {
        ssr: false,
      })
    : null;

// --- Constants ---
const BUFFER_SECONDS = 30;
const MIN_RECORDING_SECONDS = 10;
const MAX_RECORDING_SECONDS = 180;
const MAX_UPLOAD_RETRIES = 3;
const MAX_BLOB_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB Supabase bucket limit

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
    phase: "ready",
    errorMessage: null,
    retryCount: 0,
  });

  // Audio narrator lives here (not in VignetteNarrator) so the Audio element
  // survives the ready→narrating phase transition without being destroyed.
  const audio = useAudioNarrator(audioUrl, audioTiming);

  const { stream, streamRef, status: streamStatus, error: streamError, retry: retryStream } = useMediaStream();
  const recorder = useVideoRecorder(stream);
  const [bufferRemaining, setBufferRemaining] = useState(BUFFER_SECONDS);
  const [uploadProgress, setUploadProgress] = useState(0);
  const blobRef = useRef<Blob | null>(null);
  const uploadAttemptRef = useRef(0);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

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

      const blobSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
      console.log(`[BQ Upload] Starting upload — blob: ${blobSizeMB} MB, type: ${blob.type}, attempt: ${uploadAttemptRef.current + 1}/${MAX_UPLOAD_RETRIES}`);

      // Validate blob size before attempting upload
      if (blob.size > MAX_BLOB_SIZE_BYTES) {
        console.error(`[BQ Upload] Blob too large: ${blobSizeMB} MB (limit: 50 MB)`);
        dispatch({
          type: "ERROR",
          message: `Recording too large (${blobSizeMB} MB). Try a shorter response.`,
        });
        return;
      }

      try {
        // --- Step 1: Get presigned URL ---
        console.log("[BQ Upload] Fetching presigned URL...");
        const presignRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vignetteType, step }),
        });

        if (!presignRes.ok) {
          const errorText = await presignRes.text().catch(() => "no body");
          console.error(`[BQ Upload] Presign failed: ${presignRes.status} — ${errorText}`);
          throw new Error(`Failed to get upload URL (${presignRes.status})`);
        }

        const { uploadUrl, storagePath, token } = await presignRes.json();
        console.log(`[BQ Upload] Presigned URL received — path: ${storagePath}`);

        if (cancelled) return;

        // --- Step 2: XHR upload to Supabase Storage ---
        // Dynamic timeout: assume worst-case 1 Mbps, add 30s buffer, min 120s
        const dynamicTimeoutSec = Math.max(120, Math.ceil(blob.size / (125 * 1024)) + 30);
        console.log(`[BQ Upload] Starting XHR PUT — timeout: ${dynamicTimeoutSec}s`);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;

          xhr.upload.onprogress = (e) => {
            if (cancelled) return;
            // Use e.total when computable, fall back to blob.size (always known)
            const total = e.lengthComputable ? e.total : blob.size;
            const pct = total > 0 ? (e.loaded / total) * 100 : 0;
            setUploadProgress(pct);
            console.log(`[BQ Upload] Progress: ${pct.toFixed(1)}% (${e.loaded}/${total}, lengthComputable: ${e.lengthComputable})`);
          };

          xhr.onload = () => {
            xhrRef.current = null;
            console.log(`[BQ Upload] XHR onload — status: ${xhr.status}, response: ${xhr.responseText.slice(0, 200)}`);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed: ${xhr.status} — ${xhr.responseText.slice(0, 200)}`));
            }
          };

          xhr.onerror = () => {
            xhrRef.current = null;
            console.error("[BQ Upload] XHR onerror — network error");
            reject(new Error("Upload network error"));
          };

          xhr.ontimeout = () => {
            xhrRef.current = null;
            console.error(`[BQ Upload] XHR timeout after ${dynamicTimeoutSec}s`);
            reject(new Error("Upload timed out"));
          };

          xhr.onabort = () => {
            xhrRef.current = null;
            console.log("[BQ Upload] XHR aborted (cleanup)");
            reject(new Error("Upload aborted"));
          };

          xhr.timeout = dynamicTimeoutSec * 1000;

          xhr.open("PUT", uploadUrl, true);
          // Strip codec params (e.g. "video/webm;codecs=vp9,opus" → "video/webm")
          // Supabase Storage rejects MIME types with codec suffixes
          const contentType = (blob.type || "video/webm").split(";")[0];
          xhr.setRequestHeader("Content-Type", contentType);
          if (token) {
            xhr.setRequestHeader("x-upsert", "true");
          }
          xhr.send(blob);
        });

        if (cancelled) return;

        // --- Step 3: Record metadata via server action ---
        console.log("[BQ Upload] Calling submitVideoResponse...");
        const result = await submitVideoResponse({
          sessionId,
          vignetteId,
          vignetteType,
          step,
          storagePath,
          videoDurationSeconds: recorder.duration,
          recordingStartedAt: recorder.startTime ?? new Date().toISOString(),
        });
        console.log("[BQ Upload] submitVideoResponse result:", result);

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

        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[BQ Upload] Error: ${errMsg}`);

        uploadAttemptRef.current += 1;
        if (uploadAttemptRef.current < MAX_UPLOAD_RETRIES) {
          const delay = Math.pow(2, uploadAttemptRef.current) * 1000;
          console.log(`[BQ Upload] Retrying in ${delay}ms (attempt ${uploadAttemptRef.current + 1}/${MAX_UPLOAD_RETRIES})`);
          setTimeout(() => {
            if (!cancelled) {
              setUploadProgress(0);
              upload();
            }
          }, delay);
        } else {
          console.error("[BQ Upload] All retries exhausted");
          dispatch({
            type: "ERROR",
            message: errMsg || "Upload failed after multiple attempts",
          });
        }
      }
    }

    upload();
    return () => {
      cancelled = true;
      if (xhrRef.current) {
        console.log("[BQ Upload] Cleanup — aborting active XHR");
        xhrRef.current.abort();
        xhrRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.retryCount]);

  const handleBegin = useCallback(() => {
    // Call play() directly inside the click handler so the browser
    // recognises the user gesture and allows audio playback.
    audio.play();
    dispatch({ type: "BEGIN" });
  }, [audio]);

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

  const isReady = state.phase === "ready";
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
    <>
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
            {/* Ready phase — brief intro before narration begins */}
            {isReady && (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-1 flex-col items-center justify-center"
              >
                <div className="w-full max-w-md space-y-8 text-center">
                  <div className="space-y-3">
                    <p className="text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-text-secondary">
                      Scenario {step} of {totalSteps}
                    </p>
                    <h1 className="text-[length:var(--text-fluid-lg)] font-semibold tracking-tight text-text-primary">
                      {vignetteType === "practical" ? "Practical Intelligence" : "Creative Intelligence"}
                    </h1>
                    <p className="text-[length:var(--text-fluid-sm)] leading-relaxed text-text-secondary">
                      You&rsquo;ll hear a real-world scenario narrated to you.
                      Listen carefully&nbsp;&mdash; afterward, you&rsquo;ll respond on camera.
                    </p>
                  </div>

                  <Button variant="primary" size="lg" onClick={handleBegin}>
                    Begin Scenario
                  </Button>
                </div>

                {/* Camera PiP during ready */}
                <CameraPip stream={streamRef.current} />
              </motion.div>
            )}

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
                    audio={audio}
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
                        audio={audio}
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

    {DevToolbar && (
      <DevToolbar
        state={state}
        dispatch={dispatch}
        bufferRemaining={bufferRemaining}
        recorderDuration={recorder.duration}
        recorderStatus={recorder.status}
        streamStatus={streamStatus}
        sessionId={sessionId}
      />
    )}
  </>
  );
}

// --- Ambient gradient orbs behind the glass panels ---
function AmbientBackground({ phase }: { phase: string }) {
  const isActive = phase === "ready" || phase === "narrating" || phase === "buffer" || phase === "recording";

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
