"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { OrbGuide } from "@/components/assessment/OrbGuide";
import { ConsentGate } from "@/components/assessment/ConsentGate";
import { WarmupJourneyMap } from "@/components/assessment/WarmupJourneyMap";
import { VignetteNarrator } from "@/components/assessment/VignetteNarrator";
import { CountdownRing } from "@/components/assessment/CountdownRing";
import { CountdownDigit } from "@/components/assessment/CountdownDigit";
import { CameraPip } from "@/components/assessment/CameraPip";
import { useMediaStreamContext } from "@/lib/assessment/media-stream-context";
import { useVideoRecorder } from "@/lib/assessment/use-video-recorder";
import { useAudioNarrator } from "@/lib/assessment/use-audio-narrator";
import { playCountdownTone } from "@/lib/assessment/countdown-tone";
import {
  WARMUP_INTRO_SCRIPT,
  POST_WARMUP_SCRIPT,
  PRE_EXAM_SCRIPT,
} from "@/lib/assessment/orb-scripts";
import {
  WARMUP_VIGNETTE_TEXT,
  WARMUP_VIGNETTE_PROMPT,
  WARMUP_PROMPTS,
  WARMUP_AUDIO_URL,
  WARMUP_NARRATION_SECONDS,
  WARMUP_BUFFER_SECONDS,
  WARMUP_RECORDING_SECONDS,
} from "@/lib/assessment/warmup-content";
import { WARMUP_AUDIO_TIMING } from "@/lib/assessment/warmup-audio-timing";
import {
  warmupReducer,
  INITIAL_WARMUP_STATE,
  type WarmupPhase,
} from "@/lib/assessment/warmup-reducer";
import { createSession } from "@/lib/actions/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ConsentData } from "@/lib/schemas/consent";
import dynamic from "next/dynamic";

const WarmupDevToolbar =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () =>
          import("./WarmupDevToolbar").then((m) => ({
            default: m.WarmupDevToolbar,
          })),
        { ssr: false }
      )
    : null;

// ─── Component ──────────────────────────────────────────────────────

export function WarmupExperience() {
  const router = useRouter();
  const prefersReducedMotion = usePrefersReducedMotion();

  const [state, dispatch] = useReducer(warmupReducer, INITIAL_WARMUP_STATE);

  // ─── Media stream ─────────────────────────────────────────────────
  const {
    stream,
    status: streamStatus,
    retry: acquireStream,
    error: streamError,
  } = useMediaStreamContext();
  const recorder = useVideoRecorder(stream);

  useEffect(() => {
    if (streamStatus === "idle") {
      acquireStream();
    }
  }, [streamStatus, acquireStream]);

  // ─── Audio narrator ──────────────────────────────────────────────
  const audio = useAudioNarrator(WARMUP_AUDIO_URL, WARMUP_AUDIO_TIMING);

  // ─── Refs ─────────────────────────────────────────────────────────
  const audioPlayRef = useRef(audio.play);
  audioPlayRef.current = audio.play;
  const audioCtxRef = useRef<AudioContext | null>(null);
  const blob1Ref = useRef<Blob | null>(null);
  const blob2Ref = useRef<Blob | null>(null);
  const blob3Ref = useRef<Blob | null>(null);
  const playedTonesRef = useRef(new Set<number>());

  // ─── Timer state ──────────────────────────────────────────────────
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [bufferRemaining, setBufferRemaining] = useState(WARMUP_BUFFER_SECONDS);
  const [recordingRemaining, setRecordingRemaining] = useState(WARMUP_RECORDING_SECONDS);
  // Resolves to true when a new session was created; false if resumed/cooldown (already navigated)
  const sessionPromiseRef = useRef<Promise<boolean> | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // ─── Computed: visible prompts ────────────────────────────────────
  const warmupVisiblePrompts = useMemo(() => {
    const set = new Set<1 | 2 | 3>();
    const p = state.phase;
    if (
      [
        "narrating",
        "buffer_1",
        "recording_1",
        "buffer_2",
        "recording_2",
        "buffer_3",
        "recording_3",
      ].includes(p)
    ) {
      set.add(1);
    }
    if (["buffer_2", "recording_2", "buffer_3", "recording_3"].includes(p)) {
      set.add(2);
    }
    if (["buffer_3", "recording_3"].includes(p)) {
      set.add(3);
    }
    return set as ReadonlySet<1 | 2 | 3>;
  }, [state.phase]);

  // ─── Derived state ────────────────────────────────────────────────
  const isOrbPhase =
    state.phase === "intro_orb" ||
    state.phase === "transition_orb" ||
    state.phase === "pre_exam_orb";

  const showNarrator =
    state.phase === "narrating" ||
    state.phase === "buffer_1" ||
    state.phase === "recording_1" ||
    state.phase === "buffer_2" ||
    state.phase === "recording_2" ||
    state.phase === "buffer_3" ||
    state.phase === "recording_3";

  // ─── beforeunload during recording ────────────────────────────────
  useEffect(() => {
    if (recorder.status !== "recording") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [recorder.status]);

  // ─── BEGIN handler (intro_orb -> countdown) ───────────────────────
  const handleBegin = useCallback(() => {
    try {
      audioCtxRef.current = new AudioContext();
    } catch {
      // AudioContext may not be available in all environments
    }
    dispatch({ type: "BEGIN" });
    setAnnouncement("Get ready. Countdown starting.");
  }, []);

  // ─── 3-2-1 Countdown ─────────────────────────────────────────────
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

  const handleCountdownTone = useCallback((n: number) => {
    if (playedTonesRef.current.has(n)) return;
    playedTonesRef.current.add(n);
    const ctx = audioCtxRef.current;
    if (ctx) playCountdownTone(ctx, 440);
  }, []);

  // ─── Narration complete ───────────────────────────────────────────
  const handleNarrationComplete = useCallback(() => {
    audio.pause(); // Stop audio at end of phase_1_prompt
    dispatch({ type: "NARRATION_COMPLETE" });
    setAnnouncement(
      `Question 1 of 3: ${WARMUP_PROMPTS[0]}. Think time: ${WARMUP_BUFFER_SECONDS} seconds.`
    );
  }, [audio]);

  // ─── Prompt 1 reveal duration (timer fallback: words / 1.6 wps) ──
  const prompt1RevealMs = useMemo(() => {
    if (audio.hasAudio) return 0; // Audio mode: prompt is already spoken
    const wordCount = WARMUP_PROMPTS[0].split(/\s+/).filter(Boolean).length;
    return Math.ceil((wordCount / 1.6) * 1000);
  }, [audio.hasAudio]);

  // ─── Buffer countdowns ────────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== "buffer_1") return;

    // In timer fallback mode, delay countdown start until prompt 1 reveal finishes.
    // In audio mode prompt1RevealMs is 0 (prompt was spoken during narration).
    const delayTimer = setTimeout(() => {
      setBufferRemaining(WARMUP_BUFFER_SECONDS);
      const interval = setInterval(() => {
        setBufferRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            dispatch({ type: "BUFFER_1_COMPLETE" });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Store interval for cleanup
      cleanupRef.current = () => clearInterval(interval);
    }, prompt1RevealMs);

    const cleanupRef = { current: () => {} };
    return () => {
      clearTimeout(delayTimer);
      cleanupRef.current();
    };
  }, [state.phase, prompt1RevealMs]);

  useEffect(() => {
    if (state.phase !== "buffer_2") return;

    setBufferRemaining(WARMUP_BUFFER_SECONDS);
    setAnnouncement(
      `Question 2 of 3: ${WARMUP_PROMPTS[1]}. Think time: ${WARMUP_BUFFER_SECONDS} seconds.`
    );
    const interval = setInterval(() => {
      setBufferRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          dispatch({ type: "BUFFER_2_COMPLETE" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "buffer_3") return;

    setBufferRemaining(WARMUP_BUFFER_SECONDS);
    setAnnouncement(
      `Question 3 of 3: ${WARMUP_PROMPTS[2]}. Think time: ${WARMUP_BUFFER_SECONDS} seconds.`
    );
    const interval = setInterval(() => {
      setBufferRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          dispatch({ type: "BUFFER_3_COMPLETE" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.phase]);

  // ─── Recording phases: auto-start recorder ────────────────────────
  useEffect(() => {
    if (state.phase !== "recording_1") return;
    if (recorder.status === "idle") {
      recorder.start();
      setAnnouncement("Recording. Speak whenever you\u2019re ready.");
    }
  }, [state.phase, recorder.status, recorder.start]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.phase !== "recording_2") return;
    if (recorder.status === "idle") {
      recorder.start();
      setAnnouncement("Recording. Speak whenever you\u2019re ready.");
    }
  }, [state.phase, recorder.status, recorder.start]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.phase !== "recording_3") return;
    if (recorder.status === "idle") {
      recorder.start();
      setAnnouncement("Recording. Speak whenever you\u2019re ready.");
    }
  }, [state.phase, recorder.status, recorder.start]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Recording countdowns ─────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== "recording_1") return;

    setRecordingRemaining(WARMUP_RECORDING_SECONDS);
    const interval = setInterval(() => {
      setRecordingRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "recording_2") return;

    setRecordingRemaining(WARMUP_RECORDING_SECONDS);
    const interval = setInterval(() => {
      setRecordingRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "recording_3") return;

    setRecordingRemaining(WARMUP_RECORDING_SECONDS);
    const interval = setInterval(() => {
      setRecordingRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.phase]);

  // ─── Auto-clip at recording expiry ────────────────────────────────
  useEffect(() => {
    if (state.phase !== "recording_1" || recordingRemaining > 0) return;
    if (recorder.status !== "recording") return;

    let cancelled = false;
    async function clipPhase() {
      const blob = await recorder.clip();
      if (cancelled) return;
      blob1Ref.current = blob;
      dispatch({ type: "RECORDING_1_COMPLETE" });
    }
    clipPhase();
    return () => {
      cancelled = true;
    };
  }, [state.phase, recordingRemaining, recorder.status, recorder.clip]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.phase !== "recording_2" || recordingRemaining > 0) return;
    if (recorder.status !== "recording") return;

    let cancelled = false;
    async function clipPhase() {
      const blob = await recorder.clip();
      if (cancelled) return;
      blob2Ref.current = blob;
      dispatch({ type: "RECORDING_2_COMPLETE" });
    }
    clipPhase();
    return () => {
      cancelled = true;
    };
  }, [state.phase, recordingRemaining, recorder.status, recorder.clip]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.phase !== "recording_3" || recordingRemaining > 0) return;
    if (recorder.status !== "recording") return;

    let cancelled = false;
    async function clipPhase() {
      const blob = await recorder.clip();
      if (cancelled) return;
      blob3Ref.current = blob;
      dispatch({ type: "RECORDING_3_COMPLETE" });
    }
    clipPhase();
    return () => {
      cancelled = true;
    };
  }, [state.phase, recordingRemaining, recorder.status, recorder.clip]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Early stop handler (shared across all recording phases) ──────
  const handleStopRecordingEarly = useCallback(() => {
    setRecordingRemaining(0);
  }, []);

  // ─── Early stop handler for think (buffer) phases ─────────────────
  const handleStopBufferEarly = useCallback(() => {
    setBufferRemaining(0);
    const p = state.phase;
    if (p === "buffer_1") dispatch({ type: "BUFFER_1_COMPLETE" });
    else if (p === "buffer_2") dispatch({ type: "BUFFER_2_COMPLETE" });
    else if (p === "buffer_3") dispatch({ type: "BUFFER_3_COMPLETE" });
  }, [state.phase]);

  // ─── Transition orb -> consent ────────────────────────────────────
  const handleTransitionComplete = useCallback(() => {
    dispatch({ type: "TRANSITION_COMPLETE" });
    setAnnouncement("Review and consent.");
  }, []);

  // ─── Consent handlers ─────────────────────────────────────────────
  const handleConsentAccept = useCallback(
    (consent: ConsentData) => {
      dispatch({ type: "CONSENT_ACCEPTED" });
      setAnnouncement("Final reminders before we begin.");

      // Start session creation in background (awaited before navigating to /assess/1)
      if (!sessionPromiseRef.current) {
        sessionPromiseRef.current = createSession(consent).then((result) => {
          if (result.status === "resumed" || result.status === "cooldown") {
            router.push(result.redirectPath);
            return false; // Already navigated — orb handler should not push /assess/1
          }

          // Upload warmup blobs (best-effort, never awaited)
          const blobs = [blob1Ref.current, blob2Ref.current, blob3Ref.current];
          const uploadPromises = blobs.map(async (blob, i) => {
            if (!blob) return;
            try {
              const presignRes = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ warmupIndex: i + 1 }),
              });
              if (!presignRes.ok) return;
              const { uploadUrl } = await presignRes.json();
              await fetch(uploadUrl, {
                method: "PUT",
                body: blob,
                headers: { "Content-Type": "video/webm" },
              });
            } catch {
              console.warn(
                `[Warmup] Failed to upload warmup recording ${i + 1}`
              );
            }
          });
          Promise.allSettled(uploadPromises);
          return true; // New session created — orb handler should navigate to /assess/1
        });
      }
    },
    [router]
  );

  const handleConsentDecline = useCallback(() => {
    blob1Ref.current = null;
    blob2Ref.current = null;
    blob3Ref.current = null;
    dispatch({ type: "CONSENT_DECLINED" });
    setAnnouncement(
      "Assessment declined. Your recordings have been discarded."
    );
  }, []);

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <>
      {/* Journey map — fixed above everything */}
      <div className="fixed top-0 right-0 left-0 z-[60]">
        <WarmupJourneyMap currentSection="warmup" />
      </div>

      {/* Accessibility: live region */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* Phase: Intro Orb */}
      {state.phase === "intro_orb" && (
        <OrbGuide
          script={WARMUP_INTRO_SCRIPT}
          onContinue={handleBegin}
          onSkip={handleBegin}
        />
      )}

      {/* Phase: Transition Orb */}
      {state.phase === "transition_orb" && (
        <OrbGuide
          script={POST_WARMUP_SCRIPT}
          onContinue={handleTransitionComplete}
          onSkip={handleTransitionComplete}
        />
      )}

      {/* Phase: Pre-exam Orb (after consent + upload, before vignette 1) */}
      {state.phase === "pre_exam_orb" && (
        <OrbGuide
          script={PRE_EXAM_SCRIPT}
          onContinue={async () => {
            try {
              const shouldNavigate = await sessionPromiseRef.current;
              if (shouldNavigate) {
                dispatch({ type: "PRE_EXAM_COMPLETE" });
                router.push("/assess/1");
              }
            } catch {
              router.push("/assess/setup");
            }
          }}
          onSkip={async () => {
            try {
              const shouldNavigate = await sessionPromiseRef.current;
              if (shouldNavigate) {
                dispatch({ type: "PRE_EXAM_COMPLETE" });
                router.push("/assess/1");
              }
            } catch {
              router.push("/assess/setup");
            }
          }}
        />
      )}

      {/* Non-orb phases: full-screen layout */}
      {!isOrbPhase && state.phase !== "done" && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg-base">
          {/* Ambient background decoration */}
          <BackgroundDecoration reduced={prefersReducedMotion} />

          {/* Spacer for journey map */}
          <div className="h-14 shrink-0" />

          {/* Main content */}
          <div className="flex flex-1 flex-col overflow-y-auto px-4 pb-[env(safe-area-inset-bottom)]">
            <AnimatePresence mode="wait">
                  {/* Countdown: 3-2-1 */}
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
                      >
                        <CountdownDigit
                          number={countdownNumber}
                          onEnterComplete={handleCountdownTone}
                          prefersReducedMotion={prefersReducedMotion}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Active phases: narrating + buffer + recording */}
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
                          vignetteText={WARMUP_VIGNETTE_TEXT}
                          vignettePrompt={WARMUP_VIGNETTE_PROMPT}
                          phase2Prompt={WARMUP_PROMPTS[1]}
                          phase3Prompt={WARMUP_PROMPTS[2]}
                          estimatedNarrationSeconds={WARMUP_NARRATION_SECONDS}
                          isNarrating={state.phase === "narrating"}
                          showAllNarrative={state.phase !== "narrating"}
                          visiblePrompts={warmupVisiblePrompts}
                          isPhase1Revealing={state.phase === "narrating"}
                          isPhase2Revealing={false}
                          isPhase3Revealing={false}
                          onComplete={handleNarrationComplete}
                          audio={audio}
                          audioTiming={WARMUP_AUDIO_TIMING}
                        />

                        {/* Components below the teleprompter */}
                        <div className="flex w-full flex-col items-center space-y-4">
                          {/* buffer_1 */}
                          {state.phase === "buffer_1" && (
                            <CountdownRing
                              secondsRemaining={bufferRemaining}
                              totalSeconds={WARMUP_BUFFER_SECONDS}
                              mode="think"
                              onStopEarly={handleStopBufferEarly}
                            />
                          )}

                          {/* recording_1 */}
                          {state.phase === "recording_1" && (
                            <CountdownRing
                              secondsRemaining={recordingRemaining}
                              totalSeconds={WARMUP_RECORDING_SECONDS}
                              mode="recording"
                              onStopEarly={handleStopRecordingEarly}
                            />
                          )}

                          {/* buffer_2 */}
                          {state.phase === "buffer_2" && (
                            <CountdownRing
                              secondsRemaining={bufferRemaining}
                              totalSeconds={WARMUP_BUFFER_SECONDS}
                              mode="think"
                              onStopEarly={handleStopBufferEarly}
                            />
                          )}

                          {/* recording_2 */}
                          {state.phase === "recording_2" && (
                            <CountdownRing
                              secondsRemaining={recordingRemaining}
                              totalSeconds={WARMUP_RECORDING_SECONDS}
                              mode="recording"
                              onStopEarly={handleStopRecordingEarly}
                            />
                          )}

                          {/* buffer_3 */}
                          {state.phase === "buffer_3" && (
                            <CountdownRing
                              secondsRemaining={bufferRemaining}
                              totalSeconds={WARMUP_BUFFER_SECONDS}
                              mode="think"
                              onStopEarly={handleStopBufferEarly}
                            />
                          )}

                          {/* recording_3 */}
                          {state.phase === "recording_3" && (
                            <CountdownRing
                              secondsRemaining={recordingRemaining}
                              totalSeconds={WARMUP_RECORDING_SECONDS}
                              mode="recording"

                              onStopEarly={handleStopRecordingEarly}
                            />
                          )}

                          {/* Camera PiP during active phases */}
                          <CameraPip stream={stream} />
                        </div>
                      </div>

                      {/* Stream error */}
                      {streamStatus === "error" && (
                        <StreamErrorAlert
                          error={streamError}
                          onRetry={acquireStream}
                        />
                      )}
                    </motion.div>
                  )}

                  {/* Consent */}
                  {state.phase === "consent" && (
                    <motion.div
                      key="consent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="flex flex-1 w-full items-center justify-center"
                    >
                      <ConsentGate
                        onAccept={handleConsentAccept}
                        onDecline={handleConsentDecline}
                        eyebrow="One Last Step"
                        heading="Review & Consent"
                        buttonText="Start the Assessment"
                        embedded
                      />
                    </motion.div>
                  )}

                  {/* Declined */}
                  {state.phase === "declined" && (
                    <motion.div
                      key="declined"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="flex flex-1 w-full items-center justify-center"
                    >
                      <Card className="w-full max-w-md">
                        <CardHeader>
                          <h1 className="font-display text-[length:var(--text-fluid-2xl)] font-bold tracking-[-0.01em]">
                            No problem at all.
                          </h1>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <p className="text-[length:var(--text-fluid-base)] text-text-secondary">
                            Your practice recordings have been discarded &mdash;
                            nothing was saved. If you change your mind, you can
                            always come back and start fresh.
                          </p>
                          <Button
                            size="lg"
                            className="w-full"
                            onClick={() => router.push("/")}
                          >
                            Return Home
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Camera PiP during orb phases */}
      {isOrbPhase && <CameraPip stream={stream} />}

      {/* Dev toolbar */}
      {WarmupDevToolbar && (
        <WarmupDevToolbar
          phase={state.phase}
          onDevSetPhase={(phase) =>
            dispatch({ type: "DEV_SET_PHASE", phase })
          }
          onSkipToExam={() => router.push("/assess/1")}
        />
      )}
    </>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

// ─── Sub-components ─────────────────────────────────────────────────

function StreamErrorAlert({
  error,
  onRetry,
}: {
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="mt-6 w-full max-w-lg rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[length:var(--text-fluid-sm)] text-red-300"
    >
      <p>
        {error ||
          "Your camera or microphone disconnected. Please check your device and try again."}
      </p>
      <div className="mt-2 flex gap-4">
        <button
          type="button"
          onClick={onRetry}
          className="underline underline-offset-2 hover:text-text-primary"
        >
          Retry
        </button>
        <Link
          href="/assess/setup"
          className="underline underline-offset-2 hover:text-text-primary"
        >
          Return to Equipment Check
        </Link>
      </div>
    </div>
  );
}

function BackgroundDecoration({ reduced }: { reduced: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {/* Ambient gradient orbs */}
      {!reduced && (
        <>
          <div
            className="absolute left-1/4 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-100 blur-3xl mix-blend-screen"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(77,163,255,0.08), transparent 70%)",
              animation: "orb-breathe 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute right-1/4 top-2/3 h-[500px] w-[500px] translate-x-1/2 -translate-y-1/2 rounded-full opacity-100 blur-3xl mix-blend-screen"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(233,185,73,0.05), transparent 70%)",
              animation: "orb-breathe 10s ease-in-out infinite 2s",
            }}
          />
        </>
      )}
      {/* Dot grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}
