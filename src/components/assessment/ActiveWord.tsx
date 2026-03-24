import { forwardRef } from "react";

type ActiveWordProps = {
  word: string;
  wordStart: number;
  wordEnd: number;
  trailingSpace: boolean;
};

/**
 * Per-character fade-in reveal for a single word.
 * Each character animates in sequence using the `char-reveal` CSS keyframe.
 * Used by both VignetteNarrator (narrative text) and OrbSubtitles (orb captions).
 */
export const ActiveWord = forwardRef<HTMLSpanElement, ActiveWordProps>(
  function ActiveWord({ word, wordStart, wordEnd, trailingSpace }, ref) {
    const chars = [...word];
    const wordDuration = Math.max(wordEnd - wordStart, 0.05);
    const charAnimDuration = 0.12;

    return (
      <span ref={ref} className="inline whitespace-nowrap">
        {chars.map((char, i) => {
          const delay = (i / chars.length) * wordDuration;
          return (
            <span
              key={i}
              className="inline-block opacity-0"
              style={{
                animation: `char-reveal ${charAnimDuration}s ease-out both`,
                animationDelay: `${delay}s`,
              }}
            >
              {char}
            </span>
          );
        })}
        {trailingSpace && <span className="inline"> </span>}
      </span>
    );
  }
);
