"use client";

import { useCallback, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { Button } from "@/components/ui/button";
import { AudioOrb } from "./AudioOrb";
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
  const [skipped, setSkipped] = useState(false);
  const [canContinue, setCanContinue] = useState(false);

  const isSpeaking = playbackState === "playing";
  const showAllCaptions = playbackState === "error";

  const handleEnded = useCallback(() => {
    setPlaybackState("ended");
    setCanContinue(true);
  }, []);

  const handleError = useCallback(() => {
    setPlaybackState("error");
    setCanContinue(true);
  }, []);

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

  const handleReplay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
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
        onEnded={handleEnded}
        onError={handleError}
        aria-label="Assessment briefing narration"
      />

      {/* Orb */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <AudioOrb
          audioRef={audioRef}
          isPlaying={isSpeaking}
          prefersReducedMotion={prefersReducedMotion}
        />

        {/* Screen reader: full transcript always available */}
        <div aria-live="polite" className="sr-only">
          {isSpeaking &&
            script.captions.map((caption, i) => (
              <p key={i}>{caption.text}</p>
            ))}
        </div>

        {/* Visual fallback when audio fails */}
        {showAllCaptions && (
          <div className="max-w-[500px] text-center">
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
          </div>
        )}
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
