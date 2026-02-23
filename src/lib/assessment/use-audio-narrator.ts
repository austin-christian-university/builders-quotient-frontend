"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { findRevealedCount, type AudioWordTiming } from "./narration-timer";

type AudioNarratorState = {
  revealedCount: number;
  isPlaying: boolean;
  isComplete: boolean;
  hasFailed: boolean;
};

/** Return type of useAudioNarrator — discriminated union on `hasAudio`. */
export type AudioNarratorResult = ReturnType<typeof useAudioNarrator>;

/**
 * Manages <audio> playback and derives the current revealed word count
 * from ElevenLabs word-level timing data.
 *
 * Uses requestAnimationFrame (~60fps) instead of the timeupdate event (~4Hz)
 * for sub-frame word sync accuracy. Exposes a currentTimeRef for character-level
 * interpolation without triggering re-renders.
 *
 * Returns `hasAudio: false` when audioUrl is null OR when playback fails,
 * so the caller can fall back to timer-based narration.
 */
export function useAudioNarrator(
  audioUrl: string | null,
  audioTiming: AudioWordTiming[] | null
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTimeRef = useRef(0);
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
    currentTimeRef.current = 0;

    const audio = new Audio(audioUrl);
    audio.preload = "auto";
    audioRef.current = audio;

    // rAF loop state
    let rafId: number | null = null;
    let lastCount = 0;

    const tick = () => {
      currentTimeRef.current = audio.currentTime;
      const count = findRevealedCount(audioTiming, audio.currentTime);
      if (count !== lastCount) {
        lastCount = count;
        setState((prev) =>
          prev.revealedCount === count ? prev : { ...prev, revealedCount: count }
        );
      }
      rafId = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (rafId === null) {
        lastCount = 0;
        rafId = requestAnimationFrame(tick);
      }
    };

    const stopLoop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const handlePlay = () => {
      setState((prev) => ({ ...prev, isPlaying: true }));
      startLoop();
    };

    const handlePause = () => {
      setState((prev) => ({ ...prev, isPlaying: false }));
      stopLoop();
    };

    const handleEnded = () => {
      stopLoop();
      setState({
        revealedCount: audioTiming.length,
        isPlaying: false,
        isComplete: true,
        hasFailed: false,
      });
    };

    const handleError = () => {
      stopLoop();
      // Log detailed error info before falling back to timer
      const err = audio.error;
      console.error("[useAudioNarrator] Audio element error:", {
        code: err?.code,
        message: err?.message,
        // MediaError codes: 1=ABORTED, 2=NETWORK, 3=DECODE, 4=SRC_NOT_SUPPORTED
        codeName: err ? ["", "ABORTED", "NETWORK", "DECODE", "SRC_NOT_SUPPORTED"][err.code] : "unknown",
        networkState: audio.networkState,
        readyState: audio.readyState,
        src: audio.src,
        currentSrc: audio.currentSrc,
      });
      setState((prev) => ({ ...prev, hasFailed: true, isPlaying: false }));
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      stopLoop();
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
    audio.play().catch((err) => {
      console.error("[useAudioNarrator] play() rejected:", {
        name: err?.name,
        message: err?.message,
        audioSrc: audio.src?.substring(0, 120) + "…",
        networkState: audio.networkState,
        readyState: audio.readyState,
      });
      setState((prev) => ({ ...prev, hasFailed: true, isPlaying: false }));
    });
  }, []);

  // Audio not available or failed — caller uses timer fallback
  if (!hasAudioData || state.hasFailed) {
    return {
      revealedCount: 0,
      isPlaying: false,
      isComplete: false,
      hasFailed: state.hasFailed,
      play,
      audioRef,
      currentTimeRef,
      hasAudio: false as const,
    };
  }

  return {
    ...state,
    hasFailed: false as const,
    play,
    audioRef,
    currentTimeRef,
    hasAudio: true as const,
  };
}
