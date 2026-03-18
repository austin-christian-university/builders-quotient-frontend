"use client";

import { useCallback, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { Button } from "@/components/ui/button";
import { AudioOrb } from "./AudioOrb";
import type { OrbScript } from "@/lib/assessment/orb-scripts";
import { motion } from "motion/react";

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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-base overflow-hidden">
      {/* Epic Apple-style background gradients */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-bg-base" />

        {/* Glowing orbs — static when reduced motion preferred */}
        {prefersReducedMotion ? (
          <>
            <div className="absolute left-[-10%] top-[-20%] h-[70vh] w-[70vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(77,163,255,0.1),transparent_70%)] blur-3xl mix-blend-screen opacity-30" />
            <div className="absolute bottom-[-20%] right-[-10%] h-[60vh] w-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(77,163,255,0.05),transparent_70%)] blur-3xl mix-blend-screen opacity-20" />
          </>
        ) : (
          <>
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[-10%] top-[-20%] h-[70vh] w-[70vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(77,163,255,0.15),transparent_70%)] blur-3xl mix-blend-screen"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-[-20%] right-[-10%] h-[60vh] w-[60vw] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(77,163,255,0.1),transparent_70%)] blur-3xl mix-blend-screen"
            />
          </>
        )}

        {/* Dot grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, rgb(255 255 255) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-base/40 to-bg-base" />
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
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-3"
            >
              <p className="text-xs text-text-secondary uppercase tracking-widest">
                Audio unavailable — read below
              </p>
              {script.captions.map((caption, i) => (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary/90 font-light"
                >
                  {caption.text}
                </motion.p>
              ))}
            </motion.div>
          </div>
        )}
      </div>

      {/* Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 flex flex-col items-center gap-3 pb-12"
      >
        {playbackState === "idle" && (
          <div className="relative group w-full px-6 sm:px-0 sm:w-auto">
            <div className="absolute -inset-1 rounded-full bg-white/20 blur opacity-75 group-hover:opacity-100 transition duration-500" />
            <Button
              onClick={startPlayback}
              size="lg"
              className="relative w-full sm:w-auto rounded-full border border-white/10 bg-white/5 px-8 py-5 sm:px-10 sm:py-6 text-sm sm:text-base uppercase tracking-widest text-text-primary backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            >
              Begin
            </Button>
          </div>
        )}

        {playbackState !== "idle" && (
          <div className="flex flex-col-reverse sm:flex-row items-center gap-4 sm:gap-6 w-full px-6 sm:px-0 sm:w-auto">
            {/* Secondary Actions */}
            <div className="flex items-center gap-4">
              {(playbackState === "ended" || skipped) && !showAllCaptions && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                  <Button
                    variant="ghost"
                    onClick={handleReplay}
                    className="text-text-secondary hover:text-text-primary transition-colors tracking-widest uppercase text-xs sm:text-sm"
                  >
                    Replay
                  </Button>
                </motion.div>
              )}
              {!skipped && playbackState === "playing" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                  <Button 
                    variant="ghost" 
                    onClick={handleSkip}
                    className="text-text-secondary hover:text-text-primary transition-colors tracking-widest uppercase text-xs sm:text-sm"
                  >
                    Skip
                  </Button>
                </motion.div>
              )}
            </div>
            
            {/* Primary Action */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.5 }}
              className="relative group w-full sm:w-auto"
            >
              {!canContinue ? null : <div className="absolute -inset-1 rounded-full bg-white/20 blur opacity-75 group-hover:opacity-100 transition duration-500" />}
              <Button
                onClick={onContinue}
                disabled={!canContinue}
                size="lg"
                className="relative w-full sm:w-auto rounded-full border border-white/10 bg-white/5 px-8 py-5 sm:px-10 sm:py-6 text-sm sm:text-base uppercase tracking-widest text-text-primary backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.05)] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-white/5 disabled:shadow-none"
              >
                Continue
              </Button>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
