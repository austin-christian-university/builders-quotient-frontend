"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { ProgressIndicator } from "./ProgressIndicator";
import { VignetteNarrator } from "./VignetteNarrator";
import { ProcessingBuffer } from "./ProcessingBuffer";
import { VideoRecorder } from "./VideoRecorder";
import { CameraPip } from "./CameraPip";
import { useMediaStream } from "@/lib/assessment/use-media-stream";
import { useVideoRecorder } from "@/lib/assessment/use-video-recorder";
import { reserveResponse } from "@/lib/actions/response-upload";
import { useUploadQueue } from "@/lib/assessment/upload-queue";
import { Button } from "@/components/ui/button";
import { reducer } from "@/lib/assessment/vignette-reducer";
import { useAudioNarrator } from "@/lib/assessment/use-audio-narrator";
import { playCountdownTone } from "@/lib/assessment/countdown-tone";
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
  const uploadQueue = useUploadQueue();
  const [state, dispatch] = useReducer(reducer, {
    phase: "ready",
    errorMessage: null,
    retryCount: 0,
  });

  // Audio narrator lives here (not in VignetteNarrator) so the Audio element
  // survives the ready->narrating phase transition without being destroyed.
  const audio = useAudioNarrator(audioUrl, audioTiming);

  const { stream, streamRef, status: streamStatus, error: streamError, retry: retryStream } = useMediaStream();
  const recorder = useVideoRecorder(stream);
  const [bufferRemaining, setBufferRemaining] = useState(BUFFER_SECONDS);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const prefersReducedMotion = usePrefersReducedMotion();
  const phaseContainerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioPlayRef = useRef(audio.play);
  audioPlayRef.current = audio.play;
  const playedTonesRef = useRef(new Set<number>());
  const blobRef = useRef<Blob | null>(null);

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

  // --- 3-2-1 countdown ---
  useEffect(() => {
    if (state.phase !== "countdown") return;

    playedTonesRef.current.clear();
    setCountdownNumber(3);

    const t1 = setTimeout(() => setCountdownNumber(2), 1000);
    const t2 = setTimeout(() => setCountdownNumber(1), 2000);
    const t3 = setTimeout(() => {
      audioPlayRef.current();
      dispatch({ type: "COUNTDOWN_COMPLETE" });
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [state.phase]);

  // Called by CountdownDigit when a number finishes its enter animation
  const handleCountdownTone = useCallback((n: number) => {
    if (playedTonesRef.current.has(n)) return; // guard against exit re-fire
    playedTonesRef.current.add(n);
    const ctx = audioCtxRef.current;
    if (ctx) playCountdownTone(ctx, 440); // A4 for all three numbers
  }, []);

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

  // --- Handle recording stop -> submit transition ---
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

  // --- Submit flow: reserve + enqueue background upload ---
  useEffect(() => {
    if (state.phase !== "submitting" || !blobRef.current) return;

    let cancelled = false;

    async function submit() {
      const blob = blobRef.current;
      if (!blob) return;

      // Validate blob size
      if (blob.size > MAX_BLOB_SIZE_BYTES) {
        const blobSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        dispatch({
          type: "ERROR",
          message: `Recording too large (${blobSizeMB} MB). Try a shorter response.`,
        });
        return;
      }

      try {
        // Phase 1: Reserve the response (instant, unblocks progression)
        const result = await reserveResponse({
          sessionId,
          vignetteId,
          vignetteType,
          step,
          videoDurationSeconds: recorder.duration,
          recordingStartedAt: recorder.startTime ?? new Date().toISOString(),
        });

        if (cancelled) return;

        // Enqueue background upload (Phase 2)
        uploadQueue.enqueue({
          blob,
          sessionId,
          vignetteId,
          vignetteType,
          step,
        });

        // Release blob ref from this component (queue holds it now)
        blobRef.current = null;

        dispatch({ type: "SUBMIT_COMPLETE" });

        // Navigate after brief transition
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
        dispatch({ type: "ERROR", message: errMsg || "Failed to save response" });
      }
    }

    submit();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  const handleBegin = useCallback(() => {
    // Prime narration audio in the user-gesture handler so the browser
    // unlocks it for later programmatic playback after the countdown.
    const el = audio.audioRef.current;
    if (el) {
      el.play().then(() => {
        el.pause();
        el.currentTime = 0;
      }).catch(() => {
        // Audio priming failed — countdown will still work, timer fallback kicks in
      });
    }

    // Create AudioContext (also unlocked by the gesture) for countdown tones
    try {
      audioCtxRef.current = new AudioContext();
    } catch {
      // Web Audio unavailable — countdown will be silent
    }

    dispatch({ type: "BEGIN_COUNTDOWN" });
  }, [audio]);

  const handleNarrationComplete = useCallback(() => {
    dispatch({ type: "NARRATION_COMPLETE" });
  }, []);

  const handleRecordingStop = useCallback(() => {
    recorder.stop();
  }, [recorder]);

  const isReady = state.phase === "ready";
  const isNarrating = state.phase === "narrating";
  const isTwoColumn =
    state.phase === "buffer" || state.phase === "recording";
  const showNarrator =
    state.phase === "narrating" ||
    state.phase === "buffer" ||
    state.phase === "recording";

  return (
    <>
    <LayoutGroup>
      <div className="relative flex min-h-dvh flex-col">
        {/* Ambient background orbs */}
        <AmbientBackground phase={state.phase} prefersReducedMotion={prefersReducedMotion} />

        <ProgressIndicator step={step} totalSteps={totalSteps} />

        <div className="relative z-10 flex flex-1 flex-col px-4 pb-8">
          {/* Camera error banner */}
          {streamStatus === "error" && state.phase !== "submitting" && state.phase !== "transitioning" && (
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
            {/* Ready phase */}
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

            {/* Countdown phase */}
            {state.phase === "countdown" && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-1 flex-col items-center justify-center"
              >
                <div
                  tabIndex={-1}
                  aria-label={`Countdown: ${countdownNumber}`}
                  aria-live="assertive"
                  ref={phaseContainerRef}
                >
                  <CountdownDigit number={countdownNumber} onEnterComplete={handleCountdownTone} prefersReducedMotion={prefersReducedMotion} />
                </div>
              </motion.div>
            )}

            {/* Narrating phase */}
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

            {/* Two-column phase — buffer, recording */}
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
                      duration={recorder.duration}
                      onStop={handleRecordingStop}
                      minRecordingSeconds={MIN_RECORDING_SECONDS}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Submitting state (brief, <1s) */}
            {state.phase === "submitting" && (
              <motion.div
                key="submitting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 flex-col items-center justify-center gap-4"
              >
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
                <p className="text-text-secondary" role="status" tabIndex={-1} ref={phaseContainerRef}>
                  Saving your response&#8230;
                </p>
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
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
                <p className="text-text-secondary" role="status" tabIndex={-1} ref={phaseContainerRef}>
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
                <div
                  className="w-full max-w-md space-y-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center"
                  role="alert"
                  tabIndex={-1}
                  ref={phaseContainerRef}
                >
                  <p className="text-text-primary">{state.errorMessage}</p>
                  <p className="text-sm text-text-secondary">
                    Please try again or contact support if the problem persists.
                  </p>
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

// --- Countdown digit with scale+fade animation per number ---
function CountdownDigit({
  number,
  onEnterComplete,
  prefersReducedMotion,
}: {
  number: number;
  onEnterComplete?: (n: number) => void;
  prefersReducedMotion?: boolean;
}) {
  // Fire onEnterComplete immediately for reduced motion since there's no animation
  useEffect(() => {
    if (prefersReducedMotion) {
      onEnterComplete?.(number);
    }
  }, [prefersReducedMotion, number, onEnterComplete]);

  if (prefersReducedMotion) {
    return (
      <span
        className="select-none text-[clamp(6rem,20vw,10rem)] font-bold leading-none tracking-tight text-text-primary"
        style={{ textShadow: "0 0 40px rgba(77, 163, 255, 0.35)" }}
      >
        {number}
      </span>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={number}
        initial={{ opacity: 0, scale: 1.3 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onAnimationComplete={() => onEnterComplete?.(number)}
        className="select-none text-[clamp(6rem,20vw,10rem)] font-bold leading-none tracking-tight text-text-primary"
        style={{ textShadow: "0 0 40px rgba(77, 163, 255, 0.35)" }}
      >
        {number}
      </motion.span>
    </AnimatePresence>
  );
}

// --- Ambient gradient orbs behind the glass panels ---
function AmbientBackground({ phase, prefersReducedMotion }: { phase: string; prefersReducedMotion?: boolean }) {
  if (prefersReducedMotion) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -right-24 top-1/3 h-[400px] w-[400px] rounded-full bg-secondary/[0.08] blur-[100px]" />
        <div className="absolute -bottom-20 left-1/3 h-[350px] w-[350px] rounded-full bg-primary/[0.06] blur-[100px]" />
      </div>
    );
  }

  const isActive = phase === "ready" || phase === "countdown" || phase === "narrating" || phase === "buffer" || phase === "recording";

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
