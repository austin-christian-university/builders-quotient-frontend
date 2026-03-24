"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { AudioWordTiming } from "@/lib/assessment/narration-timer";
import type { OrbCaption } from "@/lib/assessment/orb-scripts";
import { buildCueGroups, type CueGroup } from "@/lib/assessment/cue-groups";

type OrbSubtitlesProps = {
  wordTimings: AudioWordTiming[];
  captions: OrbCaption[];
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
};

/**
 * Cinematic floating subtitles for orb narration.
 * Shows one cue group (sentence) at a time, fully visible,
 * with a quick crossfade between groups.
 */
const LINGER_MS = 2000;

export function OrbSubtitles({
  wordTimings,
  captions,
  audioRef,
  isPlaying,
}: OrbSubtitlesProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [lingering, setLingering] = useState(false);
  const rafRef = useRef<number>(0);
  const lingerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const cueGroups = useMemo(
    () => buildCueGroups(wordTimings, captions),
    [wordTimings, captions],
  );

  // Track audio currentTime via requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = () => {
      const audio = audioRef.current;
      if (audio) {
        setCurrentTime(audio.currentTime);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, audioRef]);

  // Hold the last subtitle briefly after playback ends
  useEffect(() => {
    if (!isPlaying && currentTime > 0) {
      setLingering(true);
      lingerRef.current = setTimeout(() => setLingering(false), LINGER_MS);
      return () => clearTimeout(lingerRef.current);
    }
    setLingering(false);
  }, [isPlaying, currentTime]);

  // Find the active cue group based on current audio time
  const activeCueIndex = useMemo(() => {
    if (cueGroups.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < cueGroups.length; i++) {
      if (currentTime >= cueGroups[i].startTime) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [cueGroups, currentTime]);

  const activeCue: CueGroup | null =
    activeCueIndex >= 0 ? cueGroups[activeCueIndex] : null;

  if (cueGroups.length === 0) return null;

  const visible = (isPlaying || lingering) && activeCue;

  const cueText = activeCue
    ? activeCue.words.map((w) => w.word).join(" ")
    : "";

  return (
    <div
      className="mx-auto max-w-[500px] min-h-[3.5em] px-6 text-center"
      aria-hidden="true"
    >
      <AnimatePresence mode="wait">
        {visible ? (
          <motion.p
            key={activeCueIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: lingering ? 0.4 : 0.15, ease: "easeOut" }}
            className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary/80 font-light"
          >
            {cueText}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
