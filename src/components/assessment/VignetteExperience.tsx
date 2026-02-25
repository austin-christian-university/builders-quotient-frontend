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
import { reducer, type Phase } from "@/lib/assessment/vignette-reducer";
import { useAudioNarrator } from "@/lib/assessment/use-audio-narrator";
import { playCountdownTone } from "@/lib/assessment/countdown-tone";
import { getSectionBoundaries, type AudioWordTiming } from "@/lib/assessment/narration-timer";
import dynamic from "next/dynamic";

const DevToolbar =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("./DevToolbar").then((m) => ({ default: m.DevToolbar })), {
      ssr: false,
    })
    : null;

// --- Constants ---
const BUFFER_1_SECONDS = 30;
const RECORDING_1_SECONDS = 75;
const TRANSITION_SECONDS = 2;
const BUFFER_2_THINKING_SECONDS = 30;
const RECORDING_2_SECONDS = 45;
const BUFFER_3_THINKING_SECONDS = 30;
const RECORDING_3_SECONDS = 45;
const MAX_BLOB_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB Supabase bucket limit

type Buffer2SubStage = "transition" | "prompting" | "thinking";
type Buffer3SubStage = "transition" | "prompting" | "thinking";

// --- Props ---
type VignetteExperienceProps = {
  step: number;
  totalSteps: number;
  sessionId: string;
  vignetteId: string;
  vignetteType: "practical" | "creative";
  vignetteText: string;
  vignettePrompt: string;
  phase2Prompt: string | null;
  phase3Prompt: string | null;
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
  phase2Prompt,
  phase3Prompt,
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
  const [buffer1Remaining, setBuffer1Remaining] = useState(BUFFER_1_SECONDS);
  const [recording1Remaining, setRecording1Remaining] = useState(RECORDING_1_SECONDS);
  const [buffer2ThinkingRemaining, setBuffer2ThinkingRemaining] = useState(BUFFER_2_THINKING_SECONDS);
  const [recording2Remaining, setRecording2Remaining] = useState(RECORDING_2_SECONDS);
  const [buffer2SubStage, setBuffer2SubStage] = useState<Buffer2SubStage>("transition");
  const [buffer3ThinkingRemaining, setBuffer3ThinkingRemaining] = useState(BUFFER_3_THINKING_SECONDS);
  const [recording3Remaining, setRecording3Remaining] = useState(RECORDING_3_SECONDS);
  const [buffer3SubStage, setBuffer3SubStage] = useState<Buffer3SubStage>("transition");
  const [countdownNumber, setCountdownNumber] = useState(3);
  const prefersReducedMotion = usePrefersReducedMotion();
  const phaseContainerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioPlayRef = useRef(audio.play);
  audioPlayRef.current = audio.play;
  const playedTonesRef = useRef(new Set<number>());
  const phase1BlobRef = useRef<Blob | null>(null);
  const phase1StartTimeRef = useRef<string | null>(null);
  const phase1DurationRef = useRef(0);
  const phase2BlobRef = useRef<Blob | null>(null);
  const phase2StartTimeRef = useRef<string | null>(null);
  const phase2DurationRef = useRef(0);
  const phase3BlobRef = useRef<Blob | null>(null);
  const phase3StartTimeRef = useRef<string | null>(null);
  const phase3DurationRef = useRef(0);

  // Compute section boundaries for prompt audio detection
  const sectionBoundaries = audioTiming ? getSectionBoundaries(audioTiming) : [];
  const phase1PromptBoundary = sectionBoundaries.find((b) => b.section === "phase_1_prompt");
  const phase2PromptBoundary = sectionBoundaries.find((b) => b.section === "phase_2_prompt");
  const phase3PromptBoundary = sectionBoundaries.find((b) => b.section === "phase_3_prompt");

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
    if (playedTonesRef.current.has(n)) return;
    playedTonesRef.current.add(n);
    const ctx = audioCtxRef.current;
    if (ctx) playCountdownTone(ctx, 440);
  }, []);

  // --- buffer_1 countdown ---
  useEffect(() => {
    if (state.phase !== "buffer_1") return;

    setBuffer1Remaining(BUFFER_1_SECONDS);
    const interval = setInterval(() => {
      setBuffer1Remaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          dispatch({ type: "BUFFER_1_COMPLETE" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.phase]);

  // --- recording_1: auto-start recorder ---
  useEffect(() => {
    if (state.phase !== "recording_1") return;
    if (recorder.status === "idle") {
      recorder.start();
      phase1StartTimeRef.current = new Date().toISOString();
    }
  }, [state.phase, recorder.status, recorder.start]);

  // recording_1: 75s countdown (separate from recorder to avoid resets)
  useEffect(() => {
    if (state.phase !== "recording_1") return;

    setRecording1Remaining(RECORDING_1_SECONDS);
    const interval = setInterval(() => {
      setRecording1Remaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.phase]);

  // Auto-clip at recording_1 countdown expiry
  useEffect(() => {
    if (state.phase !== "recording_1" || recording1Remaining > 0) return;
    if (recorder.status !== "recording") return;

    let cancelled = false;

    async function clipPhase1() {
      phase1DurationRef.current = RECORDING_1_SECONDS;
      const blob = await recorder.clip();
      if (cancelled) return;
      phase1BlobRef.current = blob;
      dispatch({ type: "RECORDING_1_COMPLETE" });
    }

    clipPhase1();
    return () => { cancelled = true; };
  }, [state.phase, recording1Remaining, recorder.status, recorder.clip]);

  // Handle recorder error during recording_1
  useEffect(() => {
    if (state.phase !== "recording_1") return;
    if (recorder.status === "error") {
      // Try to salvage partial blob if available
      if (recorder.blob) {
        phase1BlobRef.current = recorder.blob;
        phase1DurationRef.current = recorder.duration;
        dispatch({ type: "RECORDING_1_COMPLETE" });
      } else {
        dispatch({ type: "ERROR", message: "Recording failed. Please try again." });
      }
    }
  }, [state.phase, recorder.status, recorder.blob, recorder.duration]);

  // --- buffer_2: transition -> prompting -> thinking ---
  useEffect(() => {
    if (state.phase !== "buffer_2") return;

    setBuffer2SubStage("transition");
    setBuffer2ThinkingRemaining(BUFFER_2_THINKING_SECONDS);

    // Sub-stage 1: "transition" (2s) — enqueue phase 1 blob for upload
    const phase1Blob = phase1BlobRef.current;
    if (phase1Blob) {
      // Validate and enqueue phase 1 upload
      if (phase1Blob.size <= MAX_BLOB_SIZE_BYTES) {
        reserveResponse({
          sessionId,
          vignetteId,
          vignetteType,
          step,
          responsePhase: 1,
          videoDurationSeconds: phase1DurationRef.current,
          recordingStartedAt: phase1StartTimeRef.current ?? new Date().toISOString(),
        }).then(() => {
          uploadQueue.enqueue({
            blob: phase1Blob,
            sessionId,
            vignetteId,
            vignetteType,
            step,
            responsePhase: 1,
          });
        }).catch((err) => {
          console.error("[BQ] Failed to reserve phase 1:", err);
        });
      }
      phase1BlobRef.current = null;
    }

    const transitionTimer = setTimeout(() => {
      setBuffer2SubStage("prompting");

      // Resume audio for phase_2_prompt
      if (audio.hasAudio && phase2PromptBoundary) {
        const audioEl = audio.audioRef.current;
        if (audioEl) {
          audioEl.currentTime = phase2PromptBoundary.audioStart;
        }
        audio.play();
      }
    }, TRANSITION_SECONDS * 1000);

    return () => clearTimeout(transitionTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // Detect when phase_2_prompt audio finishes -> switch to thinking sub-stage
  useEffect(() => {
    if (state.phase !== "buffer_2" || buffer2SubStage !== "prompting") return;

    if (!audio.hasAudio || !phase2PromptBoundary) {
      // No audio — go straight to thinking after a brief pause
      const timer = setTimeout(() => setBuffer2SubStage("thinking"), 1000);
      return () => clearTimeout(timer);
    }

    // Check if revealed count has reached end of phase_2_prompt section
    if (audio.revealedCount >= phase2PromptBoundary.endIdx + 1) {
      audio.pause();
      setBuffer2SubStage("thinking");
    }
  }, [state.phase, buffer2SubStage, audio, phase2PromptBoundary]);

  // Also transition to thinking when audio completes entirely
  useEffect(() => {
    if (state.phase !== "buffer_2" || buffer2SubStage !== "prompting") return;
    if (audio.hasAudio && audio.isComplete) {
      setBuffer2SubStage("thinking");
    }
  }, [state.phase, buffer2SubStage, audio]);

  // buffer_2 thinking countdown
  useEffect(() => {
    if (state.phase !== "buffer_2" || buffer2SubStage !== "thinking") return;

    setBuffer2ThinkingRemaining(BUFFER_2_THINKING_SECONDS);
    const interval = setInterval(() => {
      setBuffer2ThinkingRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          dispatch({ type: "BUFFER_2_COMPLETE" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.phase, buffer2SubStage]);

  // --- recording_2: auto-start recorder ---
  useEffect(() => {
    if (state.phase !== "recording_2") return;
    if (recorder.status === "idle") {
      recorder.start();
      phase2StartTimeRef.current = new Date().toISOString();
    }
  }, [state.phase, recorder.status, recorder.start]);

  // recording_2: 45s countdown (separate from recorder to avoid resets)
  useEffect(() => {
    if (state.phase !== "recording_2") return;

    setRecording2Remaining(RECORDING_2_SECONDS);
    const interval = setInterval(() => {
      setRecording2Remaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.phase]);

  // Auto-clip at recording_2 countdown expiry (clip instead of stop, so recorder can restart for phase 3)
  useEffect(() => {
    if (state.phase !== "recording_2" || recording2Remaining > 0) return;
    if (recorder.status !== "recording") return;

    let cancelled = false;

    async function clipPhase2() {
      phase2DurationRef.current = RECORDING_2_SECONDS;
      const blob = await recorder.clip();
      if (cancelled) return;
      phase2BlobRef.current = blob;
      dispatch({ type: "RECORDING_2_COMPLETE" });
    }

    clipPhase2();
    return () => { cancelled = true; };
  }, [state.phase, recording2Remaining, recorder.status, recorder.clip]);

  // Handle recorder error during recording_2
  useEffect(() => {
    if (state.phase !== "recording_2") return;
    if (recorder.status === "error") {
      if (recorder.blob) {
        phase2BlobRef.current = recorder.blob;
        phase2DurationRef.current = recorder.duration;
        dispatch({ type: "RECORDING_2_COMPLETE" });
      } else {
        dispatch({ type: "ERROR", message: "Recording failed. Please try again." });
      }
    }
  }, [state.phase, recorder.status, recorder.blob, recorder.duration]);

  // --- buffer_3: transition -> prompting -> thinking ---
  useEffect(() => {
    if (state.phase !== "buffer_3") return;

    setBuffer3SubStage("transition");
    setBuffer3ThinkingRemaining(BUFFER_3_THINKING_SECONDS);

    // Sub-stage 1: "transition" (2s) — enqueue phase 2 blob for upload
    const phase2Blob = phase2BlobRef.current;
    if (phase2Blob) {
      if (phase2Blob.size <= MAX_BLOB_SIZE_BYTES) {
        reserveResponse({
          sessionId,
          vignetteId,
          vignetteType,
          step,
          responsePhase: 2,
          videoDurationSeconds: phase2DurationRef.current,
          recordingStartedAt: phase2StartTimeRef.current ?? new Date().toISOString(),
        }).then(() => {
          uploadQueue.enqueue({
            blob: phase2Blob,
            sessionId,
            vignetteId,
            vignetteType,
            step,
            responsePhase: 2,
          });
        }).catch((err) => {
          console.error("[BQ] Failed to reserve phase 2:", err);
        });
      }
      phase2BlobRef.current = null;
    }

    const transitionTimer = setTimeout(() => {
      setBuffer3SubStage("prompting");

      // Resume audio for phase_3_prompt (if available)
      if (audio.hasAudio && phase3PromptBoundary) {
        const audioEl = audio.audioRef.current;
        if (audioEl) {
          audioEl.currentTime = phase3PromptBoundary.audioStart;
        }
        audio.play();
      }
    }, TRANSITION_SECONDS * 1000);

    return () => clearTimeout(transitionTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // Detect when phase_3_prompt audio finishes -> switch to thinking sub-stage
  useEffect(() => {
    if (state.phase !== "buffer_3" || buffer3SubStage !== "prompting") return;

    if (!audio.hasAudio || !phase3PromptBoundary) {
      // No audio — go straight to thinking after a brief pause
      const timer = setTimeout(() => setBuffer3SubStage("thinking"), 1000);
      return () => clearTimeout(timer);
    }

    // Check if revealed count has reached end of phase_3_prompt section
    if (audio.revealedCount >= phase3PromptBoundary.endIdx + 1) {
      audio.pause();
      setBuffer3SubStage("thinking");
    }
  }, [state.phase, buffer3SubStage, audio, phase3PromptBoundary]);

  // Also transition to thinking when audio completes entirely
  useEffect(() => {
    if (state.phase !== "buffer_3" || buffer3SubStage !== "prompting") return;
    if (audio.hasAudio && audio.isComplete) {
      setBuffer3SubStage("thinking");
    }
  }, [state.phase, buffer3SubStage, audio]);

  // buffer_3 thinking countdown
  useEffect(() => {
    if (state.phase !== "buffer_3" || buffer3SubStage !== "thinking") return;

    setBuffer3ThinkingRemaining(BUFFER_3_THINKING_SECONDS);
    const interval = setInterval(() => {
      setBuffer3ThinkingRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          dispatch({ type: "BUFFER_3_COMPLETE" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.phase, buffer3SubStage]);

  // --- recording_3: auto-start recorder ---
  // Allow start from "error" state too (e.g. if recording_2 errored with a partial blob)
  useEffect(() => {
    if (state.phase !== "recording_3") return;
    if (recorder.status === "idle" || recorder.status === "error") {
      recorder.start();
      phase3StartTimeRef.current = new Date().toISOString();
    }
  }, [state.phase, recorder.status, recorder.start]);

  // recording_3: 45s countdown (separate from recorder to avoid resets)
  useEffect(() => {
    if (state.phase !== "recording_3") return;

    setRecording3Remaining(RECORDING_3_SECONDS);
    const interval = setInterval(() => {
      setRecording3Remaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.phase]);

  // Auto-stop at recording_3 countdown expiry
  useEffect(() => {
    if (state.phase !== "recording_3" || recording3Remaining > 0) return;
    if (recorder.status !== "recording") return;

    recorder.stop();
  }, [state.phase, recording3Remaining, recorder.status, recorder.stop]);

  // Handle recording_3 done -> submitting
  useEffect(() => {
    if (recorder.status === "done" && recorder.blob && state.phase === "recording_3") {
      phase3BlobRef.current = recorder.blob;
      phase3DurationRef.current = RECORDING_3_SECONDS;
      dispatch({ type: "RECORDING_3_COMPLETE" });
    }
  }, [recorder.status, recorder.blob, state.phase]);

  // Handle camera error during recording_3
  useEffect(() => {
    if (state.phase !== "recording_3") return;
    if (recorder.status === "error") {
      if (recorder.blob) {
        phase3BlobRef.current = recorder.blob;
        phase3DurationRef.current = recorder.duration;
        dispatch({ type: "RECORDING_3_COMPLETE" });
      } else {
        dispatch({ type: "ERROR", message: "Recording failed. Please try again." });
      }
    }
  }, [state.phase, recorder.status, recorder.blob, recorder.duration]);

  // --- Submit flow: reserve phase 3 + enqueue background upload ---
  useEffect(() => {
    if (state.phase !== "submitting" || !phase3BlobRef.current) return;

    let cancelled = false;

    async function submit() {
      const blob = phase3BlobRef.current;
      if (!blob) return;

      if (blob.size > MAX_BLOB_SIZE_BYTES) {
        const blobSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        dispatch({
          type: "ERROR",
          message: `Recording too large (${blobSizeMB} MB). Try a shorter response.`,
        });
        return;
      }

      try {
        const result = await reserveResponse({
          sessionId,
          vignetteId,
          vignetteType,
          step,
          responsePhase: 3,
          videoDurationSeconds: phase3DurationRef.current || RECORDING_3_SECONDS,
          recordingStartedAt: phase3StartTimeRef.current ?? new Date().toISOString(),
        });

        if (cancelled) return;

        uploadQueue.enqueue({
          blob,
          sessionId,
          vignetteId,
          vignetteType,
          step,
          responsePhase: 3,
        });

        phase3BlobRef.current = null;

        dispatch({ type: "SUBMIT_COMPLETE" });

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
    const el = audio.audioRef.current;
    if (el) {
      el.play().then(() => {
        el.pause();
        el.currentTime = 0;
      }).catch(() => {});
    }

    try {
      audioCtxRef.current = new AudioContext();
    } catch {}

    dispatch({ type: "BEGIN_COUNTDOWN" });
  }, [audio]);

  const handleNarrationComplete = useCallback(() => {
    audio.pause();
    dispatch({ type: "NARRATION_COMPLETE" });
  }, [audio]);

  const isReady = state.phase === "ready";
  const showNarrator =
    state.phase === "narrating" ||
    state.phase === "buffer_1" ||
    state.phase === "recording_1" ||
    state.phase === "buffer_2" ||
    state.phase === "recording_2" ||
    state.phase === "buffer_3" ||
    state.phase === "recording_3";

  return (
    <>
      <LayoutGroup>
        <div className="relative flex min-h-dvh flex-col">
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

              {/* Active phases — Teleprompter + recording UI */}
              {showNarrator && (
                <motion.div
                  key="active-phases"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center pt-4"
                >
                  <div className="w-full space-y-6">
                    <VignetteNarrator
                      vignetteText={vignetteText}
                      vignettePrompt={vignettePrompt}
                      phase2Prompt={phase2Prompt}
                      phase3Prompt={phase3Prompt}
                      estimatedNarrationSeconds={estimatedNarrationSeconds}
                      audio={audio}
                      audioTiming={audioTiming}
                      phase={state.phase}
                      onComplete={handleNarrationComplete}
                      buffer2SubStage={buffer2SubStage}
                      buffer3SubStage={buffer3SubStage}
                    />

                    {/* Components below the text/prompt */}
                    <div className="flex w-full flex-col items-center space-y-4">
                      {/* buffer_1: ProcessingBuffer */}
                      {state.phase === "buffer_1" && (
                        <div className="w-full">
                          <ProcessingBuffer
                            secondsRemaining={buffer1Remaining}
                            totalSeconds={BUFFER_1_SECONDS}
                          />
                        </div>
                      )}

                      {/* recording_1: countdown ring */}
                      {state.phase === "recording_1" && (
                        <VideoRecorder
                          secondsRemaining={recording1Remaining}
                          totalSeconds={RECORDING_1_SECONDS}
                          phaseLabel="Phase 1"
                        />
                      )}

                      {/* buffer_2 */}
                      {state.phase === "buffer_2" && (
                        <div className="w-full">
                          {buffer2SubStage === "transition" && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex flex-col items-center gap-3"
                            >
                              <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-transparent" aria-hidden="true" />
                              <p className="text-text-secondary">Preparing next prompt&#8230;</p>
                            </motion.div>
                          )}
                          {buffer2SubStage === "prompting" && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex flex-col items-center gap-2"
                            >
                              <p className="text-[length:var(--text-fluid-sm)] text-text-secondary">
                                Listen to the next prompt&#8230;
                              </p>
                            </motion.div>
                          )}
                          {buffer2SubStage === "thinking" && (
                            <ProcessingBuffer
                              secondsRemaining={buffer2ThinkingRemaining}
                              totalSeconds={BUFFER_2_THINKING_SECONDS}
                            />
                          )}
                        </div>
                      )}

                      {/* recording_2: countdown ring */}
                      {state.phase === "recording_2" && (
                        <VideoRecorder
                          secondsRemaining={recording2Remaining}
                          totalSeconds={RECORDING_2_SECONDS}
                          phaseLabel="Phase 2"
                        />
                      )}

                      {/* buffer_3 */}
                      {state.phase === "buffer_3" && (
                        <div className="w-full">
                          {buffer3SubStage === "transition" && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex flex-col items-center gap-3"
                            >
                              <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-transparent" aria-hidden="true" />
                              <p className="text-text-secondary">Preparing final prompt&#8230;</p>
                            </motion.div>
                          )}
                          {buffer3SubStage === "prompting" && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex flex-col items-center gap-2"
                            >
                              <p className="text-[length:var(--text-fluid-sm)] text-text-secondary">
                                Listen to the final prompt&#8230;
                              </p>
                            </motion.div>
                          )}
                          {buffer3SubStage === "thinking" && (
                            <ProcessingBuffer
                              secondsRemaining={buffer3ThinkingRemaining}
                              totalSeconds={BUFFER_3_THINKING_SECONDS}
                            />
                          )}
                        </div>
                      )}

                      {/* recording_3: countdown ring */}
                      {state.phase === "recording_3" && (
                        <VideoRecorder
                          secondsRemaining={recording3Remaining}
                          totalSeconds={RECORDING_3_SECONDS}
                          phaseLabel="Phase 3"
                        />
                      )}

                      {/* Camera PiP during active phases */}
                      <CameraPip stream={streamRef.current} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Submitting state */}
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
          buffer1Remaining={buffer1Remaining}
          recording1Remaining={recording1Remaining}
          buffer2SubStage={buffer2SubStage}
          buffer2ThinkingRemaining={buffer2ThinkingRemaining}
          recording2Remaining={recording2Remaining}
          buffer3SubStage={buffer3SubStage}
          buffer3ThinkingRemaining={buffer3ThinkingRemaining}
          recording3Remaining={recording3Remaining}
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
function AmbientBackground({ phase, prefersReducedMotion }: { phase: Phase; prefersReducedMotion?: boolean }) {
  if (prefersReducedMotion) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -right-24 top-1/3 h-[400px] w-[400px] rounded-full bg-secondary/[0.08] blur-[100px]" />
        <div className="absolute -bottom-20 left-1/3 h-[350px] w-[350px] rounded-full bg-primary/[0.06] blur-[100px]" />
      </div>
    );
  }

  const isActive = phase === "ready" || phase === "countdown" || phase === "narrating" ||
    phase === "buffer_1" || phase === "recording_1" || phase === "buffer_2" || phase === "recording_2" ||
    phase === "buffer_3" || phase === "recording_3";

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
