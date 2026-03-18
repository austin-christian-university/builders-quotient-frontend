"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { Button } from "@/components/ui/button";
import type { OrbScript } from "@/lib/assessment/orb-scripts";

type OrbGuideProps = {
  script: OrbScript;
  onContinue: () => void;
  onSkip: () => void;
};

type PlaybackState = "idle" | "playing" | "ended" | "error";

export function OrbGuide({ script, onContinue, onSkip }: OrbGuideProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [currentCaptionIndex, setCurrentCaptionIndex] = useState(-1);
  const [skipped, setSkipped] = useState(false);
  const [canContinue, setCanContinue] = useState(false);

  const isSpeaking = playbackState === "playing";

  // Audio timeupdate → find current caption
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    const idx = script.captions.findIndex(
      (c) => t >= c.startTime && t < c.endTime
    );
    if (idx !== -1) setCurrentCaptionIndex(idx);
  }, [script.captions]);

  // Audio ended
  const handleEnded = useCallback(() => {
    setPlaybackState("ended");
    setCanContinue(true);
    setCurrentCaptionIndex(script.captions.length - 1);
  }, [script.captions.length]);

  // Audio error — fallback to static captions
  const handleError = useCallback(() => {
    setPlaybackState("error");
    setCanContinue(true);
  }, []);

  // Start playback
  const startPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(() => {
      setPlaybackState("playing");
    }).catch(() => {
      setPlaybackState("error");
      setCanContinue(true);
    });
  }, []);

  // Skip
  const handleSkip = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setSkipped(true);
    setCanContinue(true);
    setPlaybackState("ended");
    onSkip();
  }, [onSkip]);

  // Replay
  const handleReplay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentCaptionIndex(-1);
    setCanContinue(false);
    setSkipped(false);
    audio.currentTime = 0;
    audio.play().then(() => {
      setPlaybackState("playing");
    }).catch(() => {
      setPlaybackState("error");
      setCanContinue(true);
    });
  }, []);

  const showAllCaptions = playbackState === "error";
  const currentCaption =
    currentCaptionIndex >= 0 ? script.captions[currentCaptionIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-base">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/3 h-[60vh] w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(77,163,255,0.08),transparent_70%)] blur-3xl" />
      </div>

      {/* Audio element */}
      <audio
        ref={audioRef}
        src={script.audioUrl}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        aria-label="Assessment briefing narration"
      />

      {/* Orb */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <div
          data-speaking={isSpeaking || undefined}
          className={[
            "h-[120px] w-[120px] rounded-full md:h-[150px] md:w-[150px]",
            "bg-[radial-gradient(circle_at_35%_35%,rgba(77,163,255,0.6),rgba(77,163,255,0.15)_60%,rgba(77,163,255,0.05))]",
            "shadow-[0_0_60px_rgba(77,163,255,0.3),0_0_120px_rgba(77,163,255,0.1)]",
            "relative",
            !prefersReducedMotion && "animate-orb-breathe",
            !prefersReducedMotion && "data-[speaking]:animate-orb-speak",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden="true"
        >
          {/* Inner highlight */}
          <div className="absolute inset-2 rounded-full bg-[radial-gradient(circle_at_40%_35%,rgba(255,255,255,0.15),transparent_60%)]" />
        </div>

        {/* Caption area */}
        <div
          aria-live="polite"
          className="min-h-[4rem] max-w-[500px] text-center"
        >
          {showAllCaptions ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-text-secondary">
                Audio unavailable — read below
              </p>
              {script.captions.map((caption, i) => (
                <p
                  key={i}
                  className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary"
                >
                  {caption.text}
                </p>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {currentCaption && (
                <motion.p
                  key={currentCaptionIndex}
                  initial={
                    prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }
                  }
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                  className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary"
                >
                  {currentCaption.text}
                </motion.p>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex flex-col items-center gap-3 pb-12">
        {playbackState === "idle" && (
          <Button onClick={startPlayback} size="lg">
            Begin
          </Button>
        )}

        {playbackState !== "idle" && (
          <>
            {(playbackState === "ended" || skipped) && !showAllCaptions && (
              <button
                onClick={handleReplay}
                className="text-sm text-text-secondary underline underline-offset-4 transition-colors hover:text-text-primary"
              >
                Replay
              </button>
            )}
            <div className="flex items-center gap-4">
              {!skipped && playbackState === "playing" && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip
                </Button>
              )}
              <Button
                onClick={onContinue}
                disabled={!canContinue}
                size="lg"
              >
                Continue
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
