"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioWordTiming } from "./narration-timer";

type AudioNarratorState = {
  revealedCount: number;
  isPlaying: boolean;
  isComplete: boolean;
  hasFailed: boolean;
};

/**
 * Manages <audio> playback and derives the current revealed word count
 * from ElevenLabs word-level timing data.
 *
 * Returns `hasAudio: false` when audioUrl is null OR when playback fails,
 * so the caller can fall back to timer-based narration.
 */
export function useAudioNarrator(
  audioUrl: string | null,
  audioTiming: AudioWordTiming[] | null
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioNarratorState>({
    revealedCount: 0,
    isPlaying: false,
    isComplete: false,
    hasFailed: false,
  });

  // No audio data provided — caller should use timer fallback
  const hasAudioData = audioUrl !== null && audioTiming !== null && audioTiming.length > 0;

  // Create / swap the Audio element when the URL changes
  useEffect(() => {
    if (!hasAudioData) return;

    // Reset state for the new audio source
    setState({ revealedCount: 0, isPlaying: false, isComplete: false, hasFailed: false });

    const audio = new Audio(audioUrl);
    audio.preload = "auto";
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      const t = audio.currentTime;
      // Binary search for the latest word with start <= t
      let lo = 0;
      let hi = audioTiming.length - 1;
      let count = 0;
      while (lo <= hi) {
        const mid = (lo + hi) >>> 1;
        if (audioTiming[mid].start <= t) {
          count = mid + 1;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      setState((prev) =>
        prev.revealedCount === count ? prev : { ...prev, revealedCount: count }
      );
    };

    const handlePlay = () => {
      setState((prev) => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
    };

    const handleEnded = () => {
      setState({
        revealedCount: audioTiming.length,
        isPlaying: false,
        isComplete: true,
        hasFailed: false,
      });
    };

    const handleError = () => {
      // Audio failed to load/decode — signal caller to fall back to timer
      setState((prev) => ({ ...prev, hasFailed: true, isPlaying: false }));
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [hasAudioData, audioUrl, audioTiming]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().catch(() => {
      // Autoplay blocked or playback failed — fall back to timer mode
      setState((prev) => ({ ...prev, hasFailed: true, isPlaying: false }));
    });
  }, []);

  // Audio not available or failed — caller uses timer fallback
  if (!hasAudioData || state.hasFailed) {
    return {
      revealedCount: 0,
      isPlaying: false,
      isComplete: false,
      play,
      audioRef,
      hasAudio: false as const,
    };
  }

  return {
    ...state,
    play,
    audioRef,
    hasAudio: true as const,
  };
}
