"use client";

import { type RefObject } from "react";
import { Narrator } from "@/components/narrator/Narrator";

type VoiceRingProps = {
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  size?: number;
};

/** The briefing narrator: Unify's woven ring in ink, moving with the narration. */
export function VoiceRing({ audioRef, isPlaying, size = 170 }: VoiceRingProps) {
  return (
    <Narrator
      state={isPlaying ? "speaking" : "idle"}
      audioRef={audioRef}
      size={size}
      label={isPlaying ? "The narrator is speaking." : "The narrator is waiting."}
    />
  );
}
