"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { VoiceRing } from "./VoiceRing";
import { OrbSubtitles } from "./OrbSubtitles";
import type { OrbScript } from "@/lib/assessment/orb-scripts";
import { motion } from "motion/react";

type OrbGuideProps = {
  script: OrbScript;
  onContinue: () => void;
  onSkip: () => void;
};

type PlaybackState = "idle" | "playing" | "ended" | "error";

export function OrbGuide({ script, onContinue, onSkip }: OrbGuideProps) {
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper text-ink overflow-hidden">
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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 sm:gap-8 px-6 -translate-y-6 sm:translate-y-0">
        <VoiceRing
          audioRef={audioRef}
          isPlaying={isSpeaking}
        />

        {/* Subtitle area — always reserves 3 lines so the orb never shifts */}
        {!showAllCaptions && (
          <div
            className="shrink-0 mx-auto max-w-[500px] h-[4.875em] text-center text-[length:var(--text-fluid-base)] leading-relaxed overflow-hidden"
            aria-hidden="true"
          >
            {script.wordTimings && (
              <OrbSubtitles
                wordTimings={script.wordTimings}
                captions={script.captions}
                audioRef={audioRef}
                isPlaying={isSpeaking}
              />
            )}
          </div>
        )}

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
              <p className="text-sm text-text-secondary">
                Audio unavailable — read below
              </p>
              {script.captions.map((caption, i) => (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  className="text-[length:var(--text-fluid-base)] leading-relaxed text-ink"
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
        className="relative z-10 flex flex-col items-center justify-end gap-3 pb-12 min-h-44 sm:min-h-20"
      >
        {playbackState === "idle" && (
          <div className="w-full px-6 sm:px-0 sm:w-auto">
            <Button
              onClick={startPlayback}
              size="lg"
              className="w-full sm:w-auto sm:min-w-44"
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
              className="w-full sm:w-auto"
            >
              <Button
                onClick={onContinue}
                disabled={!canContinue}
                size="lg"
                className="w-full sm:w-auto sm:min-w-44"
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
