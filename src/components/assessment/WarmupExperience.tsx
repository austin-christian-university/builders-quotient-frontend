"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { OrbGuide } from "@/components/assessment/OrbGuide";
import { ConsentGate } from "@/components/assessment/ConsentGate";
import { WarmupJourneyMap } from "@/components/assessment/WarmupJourneyMap";
import { CameraPip } from "@/components/assessment/CameraPip";
import { useMediaStreamContext } from "@/lib/assessment/media-stream-context";
import { useVideoRecorder } from "@/lib/assessment/use-video-recorder";
import {
  WARMUP_INTRO_SCRIPT,
  POST_WARMUP_SCRIPT,
  PRE_EXAM_SCRIPT,
} from "@/lib/assessment/orb-scripts";
import { createSession } from "@/lib/actions/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ConsentData } from "@/lib/schemas/consent";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const WarmupDevToolbar =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("./WarmupDevToolbar").then((m) => ({ default: m.WarmupDevToolbar })), {
        ssr: false,
      })
    : null;

// ─── Constants ──────────────────────────────────────────────────────

const WARMUP_PROMPTS = [
  {
    text: "What\u2019s something you\u2019ve built or created that you\u2019re proud of?",
    thinkTime: 10,
    recordTime: 30,
  },
  {
    text: "If you could start any business tomorrow, what would it be?",
    thinkTime: 15,
    recordTime: 45,
  },
  {
    text: "What\u2019s one thing about you that most people wouldn\u2019t guess?",
    thinkTime: 10,
    recordTime: 30,
  },
];

const EXPO_OUT = [0.16, 1, 0.3, 1] as const;

const CIRCUMFERENCE = 2 * Math.PI * 54;

// ─── Types ──────────────────────────────────────────────────────────

type WarmupPhase =
  | "intro_orb"
  | "recording"
  | "transition_orb"
  | "consent"
  | "uploading"
  | "pre_exam_orb"
  | "done"
  | "declined";

type RecordingSubPhase = "thinking" | "recording";

// ─── Component ──────────────────────────────────────────────────────

export function WarmupExperience() {
  const router = useRouter();
  const {
    stream,
    status: streamStatus,
    retry: acquireStream,
    error: streamError,
  } = useMediaStreamContext();
  const recorder = useVideoRecorder(stream);

  const [phase, setPhase] = useState<WarmupPhase>("intro_orb");
  const [promptIndex, setPromptIndex] = useState(0);
  const [recordingSubPhase, setRecordingSubPhase] =
    useState<RecordingSubPhase>("thinking");
  const [thinkSecondsLeft, setThinkSecondsLeft] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const blobsRef = useRef<(Blob | null)[]>([null, null, null]);
  const thinkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPrompt =
    phase === "recording" ? WARMUP_PROMPTS[promptIndex] : null;

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Callback ref: sets srcObject when video element mounts or stream changes.
  // useCallback ensures it only changes when stream changes (no flash on re-render).
  const cameraCallbackRef = useCallback(
    (el: HTMLVideoElement | null) => {
      if (el && stream) {
        el.srcObject = stream;
      }
    },
    [stream]
  );

  // ─── Stream acquisition on mount ─────────────────────────────────

  useEffect(() => {
    if (streamStatus === "idle") {
      acquireStream();
    }
  }, [streamStatus, acquireStream]);

  // ─── beforeunload during recording ────────────────────────────────

  useEffect(() => {
    if (recorder.status !== "recording") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [recorder.status]);

  // ─── Think countdown timer ────────────────────────────────────────

  useEffect(() => {
    if (phase !== "recording" || recordingSubPhase !== "thinking") return;

    const prompt = WARMUP_PROMPTS[promptIndex];
    setThinkSecondsLeft(prompt.thinkTime);

    thinkTimerRef.current = setInterval(() => {
      setThinkSecondsLeft((prev) => {
        if (prev <= 1) {
          if (thinkTimerRef.current) clearInterval(thinkTimerRef.current);
          thinkTimerRef.current = null;
          setRecordingSubPhase("recording");
          recorder.start();
          setAnnouncement("Recording. Speak whenever you\u2019re ready.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (thinkTimerRef.current) {
        clearInterval(thinkTimerRef.current);
        thinkTimerRef.current = null;
      }
    };
    // recorder.start is stable (useCallback), promptIndex drives re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, recordingSubPhase, promptIndex]);

  // ─── Auto-stop at record time limit ───────────────────────────────

  useEffect(() => {
    if (
      phase !== "recording" ||
      recordingSubPhase !== "recording" ||
      recorder.status !== "recording" ||
      !currentPrompt
    )
      return;
    if (recorder.duration >= currentPrompt.recordTime) {
      handleStopRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.duration, recorder.status, phase, recordingSubPhase, currentPrompt]);

  // ─── Phase handlers ───────────────────────────────────────────────

  const startRecordingPhase = useCallback(
    (index: number) => {
      setPromptIndex(index);
      setPhase("recording");
      setRecordingSubPhase("thinking");
      const prompt = WARMUP_PROMPTS[index];
      setAnnouncement(
        `Warmup question ${index + 1} of 3: ${prompt.text} Think time: ${prompt.thinkTime} seconds.`
      );
    },
    []
  );

  const handleStopRecording = useCallback(async () => {
    const blob = await recorder.clip();
    blobsRef.current[promptIndex] = blob;

    if (promptIndex < 2) {
      startRecordingPhase(promptIndex + 1);
    } else {
      // Last recording done — skip straight to transition orb
      setPhase("transition_orb");
      setAnnouncement("Transitioning to assessment consent.");
    }
  }, [promptIndex, recorder, startRecordingPhase]);

  const handleConsentAccept = useCallback(
    async (consent: ConsentData) => {
      setPhase("uploading");
      setUploadError(null);
      setAnnouncement("Setting up your assessment");

      try {
        const result = await createSession(consent);

        if (result.status === "resumed" || result.status === "cooldown") {
          router.push(result.redirectPath);
          return;
        }

        // Upload warmup blobs (best-effort — never block the student)
        const uploadPromises = blobsRef.current.map(async (blob, i) => {
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

        await Promise.allSettled(uploadPromises);

        // Show pre-exam orb before navigating to vignette 1
        setPhase("pre_exam_orb");
        setAnnouncement("Final reminders before we begin.");
      } catch (err) {
        setUploadError(
          err instanceof Error
            ? err.message
            : "Something went wrong setting up your assessment. Please try again."
        );
        setPhase("consent");
      }
    },
    [router]
  );

  const handleConsentDecline = useCallback(() => {
    blobsRef.current = [null, null, null];
    setPhase("declined");
    setAnnouncement(
      "Assessment declined. Your recordings have been discarded."
    );
  }, []);

  // ─── Computed ─────────────────────────────────────────────────────

  const recordingSecondsRemaining = currentPrompt
    ? Math.max(0, currentPrompt.recordTime - recorder.duration)
    : 0;

  const isOrbPhase = phase === "intro_orb" || phase === "transition_orb" || phase === "pre_exam_orb";

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

      {/* Phase A: Intro Orb */}
      {phase === "intro_orb" && (
        <OrbGuide
          script={WARMUP_INTRO_SCRIPT}
          onContinue={() => startRecordingPhase(0)}
          onSkip={() => startRecordingPhase(0)}
        />
      )}

      {/* Phase D: Transition Orb */}
      {phase === "transition_orb" && (
        <OrbGuide
          script={POST_WARMUP_SCRIPT}
          onContinue={() => {
            setPhase("consent");
            setAnnouncement("Review and consent.");
          }}
          onSkip={() => {
            setPhase("consent");
            setAnnouncement("Review and consent.");
          }}
        />
      )}

      {/* Phase G: Pre-exam Orb (after consent + upload, before vignette 1) */}
      {phase === "pre_exam_orb" && (
        <OrbGuide
          script={PRE_EXAM_SCRIPT}
          onContinue={() => router.push("/assess/1")}
          onSkip={() => router.push("/assess/1")}
        />
      )}

      {/* Phases B, C, E, uploading, declined — custom full-screen layout */}
      {!isOrbPhase && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg-base">
          {/* Ambient background decoration */}
          <BackgroundDecoration reduced={prefersReducedMotion} />

          {/* Spacer for journey map */}
          <div className="h-14 shrink-0" />

          {/* Main content */}
          <div className="flex-1 overflow-y-auto px-4 pb-[env(safe-area-inset-bottom)]">
            <div className="flex min-h-full flex-col items-center py-8">
            <div className="my-auto flex w-full flex-col items-center">
            <AnimatePresence mode="wait">
              {/* Phase B: Recording */}
              {phase === "recording" && currentPrompt && (
                <motion.div
                  key={`recording-${promptIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: EXPO_OUT }}
                  className="flex w-full max-w-2xl flex-col items-center gap-6"
                >
                  {/* Prompt */}
                  <div className="text-center">
                    <p className="text-[length:var(--text-fluid-xs)] uppercase tracking-[0.3em] text-text-secondary">
                      Question {promptIndex + 1} of 3
                    </p>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: EXPO_OUT }}
                      className="mx-auto mt-3 max-w-xl font-display text-[length:var(--text-fluid-xl)] font-semibold tracking-[-0.01em] text-text-primary md:text-[length:var(--text-fluid-xl)]"
                    >
                      {currentPrompt.text}
                    </motion.p>
                  </div>

                  {/* Camera preview */}
                  <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border-glass bg-bg-base">
                    <div className="aspect-video">
                      {stream ? (
                        <video
                          ref={cameraCallbackRef}
                          autoPlay
                          playsInline
                          muted
                          aria-label="Camera preview"
                          className="h-full w-full object-cover [-webkit-transform:scaleX(-1)] [transform:scaleX(-1)]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-text-secondary">
                          {streamStatus === "acquiring" &&
                            "Connecting camera\u2026"}
                          {streamStatus === "error" && "Camera not available"}
                        </div>
                      )}
                    </div>

                    {/* Recording indicator */}
                    {recordingSubPhase === "recording" &&
                      recorder.status === "recording" && (
                        <div className="absolute right-3 top-3">
                          <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                            <span className="relative flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                            </span>
                            <span className="text-xs font-medium tabular-nums text-red-500">
                              REC
                            </span>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Countdown / Controls */}
                  <div className="flex flex-col items-center gap-4">
                    {recordingSubPhase === "thinking" && (
                      <ThinkCountdown
                        secondsLeft={thinkSecondsLeft}
                        totalSeconds={currentPrompt.thinkTime}
                        reduced={prefersReducedMotion}
                      />
                    )}

                    {recordingSubPhase === "recording" && (
                      <div className="flex flex-col items-center gap-4">
                        <RecordCountdown
                          secondsRemaining={recordingSecondsRemaining}
                          totalSeconds={currentPrompt.recordTime}
                          reduced={prefersReducedMotion}
                        />

                        {recorder.duration >= 5 && (
                          <motion.button
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: EXPO_OUT }}
                            onClick={handleStopRecording}
                            className="rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-[length:var(--text-fluid-sm)] font-medium text-text-primary backdrop-blur-sm transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
                          >
                            I&rsquo;m Done
                          </motion.button>
                        )}
                      </div>
                    )}
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

              {/* Phase E: Consent */}
              {phase === "consent" && (
                <motion.div
                  key="consent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: EXPO_OUT }}
                  className="flex w-full justify-center"
                >
                  <ConsentGate
                    onAccept={handleConsentAccept}
                    onDecline={handleConsentDecline}
                    eyebrow="One Last Step"
                    heading="Review &amp; Consent"
                    buttonText="Start the Assessment"
                    embedded
                  />
                </motion.div>
              )}

              {/* Uploading state */}
              {phase === "uploading" && (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: EXPO_OUT }}
                  className="flex flex-col items-center gap-8"
                >
                  <div
                    className="h-[200px] w-[200px] rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle at 35% 35%, rgba(233,185,73,0.3), rgba(77,163,255,0.15), transparent 70%)",
                      animation: prefersReducedMotion
                        ? "none"
                        : "orb-breathe 4s ease-in-out infinite",
                      boxShadow: "0 0 60px rgba(233,185,73,0.2)",
                    }}
                  />
                  <p className="font-display text-[length:var(--text-fluid-lg)] font-medium text-text-primary">
                    Setting up your assessment&hellip;
                  </p>

                  {uploadError && (
                    <div
                      role="alert"
                      className="w-full max-w-md rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[length:var(--text-fluid-sm)] text-red-300"
                    >
                      <p>{uploadError}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setPhase("consent");
                          setUploadError(null);
                        }}
                        className="mt-2 underline underline-offset-2 hover:text-text-primary"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Declined state */}
              {phase === "declined" && (
                <motion.div
                  key="declined"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: EXPO_OUT }}
                  className="flex w-full justify-center"
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
          </div>
        </div>
      )}

      {/* Camera PiP during orb phases */}
      {isOrbPhase && <CameraPip stream={stream} />}

      {/* Dev toolbar — skip warmup phases */}
      {WarmupDevToolbar && (
        <WarmupDevToolbar
          phase={phase}
          promptIndex={promptIndex}
          onSkipToConsent={() => {
            setPhase("consent");
            setAnnouncement("Review and consent.");
          }}
          onSkipToExam={() => router.push("/assess/1")}
        />
      )}
    </>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function ThinkCountdown({
  secondsLeft,
  totalSeconds,
  reduced,
}: {
  secondsLeft: number;
  totalSeconds: number;
  reduced: boolean;
}) {
  const offset = CIRCUMFERENCE * (1 - secondsLeft / totalSeconds);

  return (
    <div className="relative flex h-[120px] w-[120px] items-center justify-center">
      {!reduced && (
        <svg
          viewBox="0 0 120 120"
          className="absolute inset-0 -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-border-glass"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-primary"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1s linear",
              filter: "drop-shadow(0 0 6px rgba(77, 163, 255, 0.6))",
            }}
          />
        </svg>
      )}
      <div className="flex flex-col items-center">
        <span className="text-[length:var(--text-fluid-sm)] text-text-secondary">
          Think&hellip;
        </span>
        <span className="font-display text-[length:var(--text-fluid-xl)] font-bold tabular-nums text-text-primary">
          {secondsLeft}
        </span>
      </div>
    </div>
  );
}

function RecordCountdown({
  secondsRemaining,
  totalSeconds,
  reduced,
}: {
  secondsRemaining: number;
  totalSeconds: number;
  reduced: boolean;
}) {
  const offset = CIRCUMFERENCE * (secondsRemaining / totalSeconds);

  return (
    <div className="relative flex h-[120px] w-[120px] items-center justify-center">
      {!reduced && (
        <svg
          viewBox="0 0 120 120"
          className="absolute inset-0 -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-border-glass"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-red-500"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1s linear",
              filter: "drop-shadow(0 0 6px rgba(239, 68, 68, 0.6))",
            }}
          />
        </svg>
      )}
      <span
        className={cn(
          "font-display text-[length:var(--text-fluid-xl)] font-bold tabular-nums",
          secondsRemaining <= 5 ? "text-red-400" : "text-text-primary"
        )}
      >
        {formatTime(secondsRemaining)}
      </span>
    </div>
  );
}

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
      className="w-full max-w-lg rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[length:var(--text-fluid-sm)] text-red-300"
    >
      <p>
        {error || "Your camera or microphone disconnected. Please check your device and try again."}
      </p>
      <div className="mt-2 flex gap-4">
        <button
          type="button"
          onClick={onRetry}
          className="underline underline-offset-2 hover:text-text-primary"
        >
          Retry
        </button>
        <a
          href="/assess/setup"
          className="underline underline-offset-2 hover:text-text-primary"
        >
          Return to Equipment Check
        </a>
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

// ─── Helpers ────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
