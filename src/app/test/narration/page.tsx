"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { calculateWordTiming, type WordTiming } from "@/lib/assessment/narration-timer";
import { cn } from "@/lib/utils";

const DUMMY_TEXT_WITH_PARAGRAPHS = `Marcus had been running his family's auto repair shop for twelve years when the first electric vehicle rolled into his bay. He stared at the silent engine compartment, realizing that everything he knew about combustion engines was about to become obsolete. His two best mechanics quit that month, convinced the business was dying.

Rather than panic, Marcus spent three weekends at a community college learning EV diagnostics. He discovered that most independent shops in his city had simply stopped accepting electric vehicles altogether. The gap in the market was enormous. He retrofitted two of his six bays with specialized EV equipment and started marketing directly to Tesla and Rivian owners who were tired of dealership wait times.

Within eighteen months, his EV service bays were generating more revenue than the traditional four combined. He began training his remaining mechanics on hybrid and electric systems, turning what felt like a threat into the biggest growth opportunity his shop had ever seen. The key insight wasn't technical — it was recognizing that most competitors were frozen by the same fear he'd initially felt.

Now Marcus faces a new decision. A regional fleet company wants to contract him for all their electric vehicle maintenance across three states. The deal would require hiring fifteen new technicians and opening two satellite locations. He has the expertise but not the capital, and he's weighing whether to take on investors for the first time in his career.`;

const DUMMY_TEXT_NO_PARAGRAPHS = `Marcus had been running his family's auto repair shop for twelve years when the first electric vehicle rolled into his bay. He stared at the silent engine compartment, realizing that everything he knew about combustion engines was about to become obsolete. His two best mechanics quit that month, convinced the business was dying. Rather than panic, Marcus spent three weekends at a community college learning EV diagnostics. He discovered that most independent shops in his city had simply stopped accepting electric vehicles altogether. The gap in the market was enormous. He retrofitted two of his six bays with specialized EV equipment and started marketing directly to Tesla and Rivian owners who were tired of dealership wait times. Within eighteen months, his EV service bays were generating more revenue than the traditional four combined. He began training his remaining mechanics on hybrid and electric systems, turning what felt like a threat into the biggest growth opportunity his shop had ever seen. The key insight wasn't technical — it was recognizing that most competitors were frozen by the same fear he'd initially felt. Now Marcus faces a new decision. A regional fleet company wants to contract him for all their electric vehicle maintenance across three states. The deal would require hiring fifteen new technicians and opening two satellite locations. He has the expertise but not the capital, and he's weighing whether to take on investors for the first time in his career.`;

export default function NarrationTestPage() {
  const [mode, setMode] = useState<"paragraphs" | "no-paragraphs" | "instant">("paragraphs");
  const [isPlaying, setIsPlaying] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const latestWordRef = useRef<HTMLSpanElement>(null);

  const text = mode === "no-paragraphs" ? DUMMY_TEXT_NO_PARAGRAPHS : DUMMY_TEXT_WITH_PARAGRAPHS;

  const { words, totalDuration } = useMemo(
    () => calculateWordTiming(text),
    [text]
  );

  // Group words by paragraph index so each paragraph renders as one <p>
  // with flowing inline text (not one <p> per sentence).
  const paragraphGroups = useMemo(() => {
    const groups: WordTiming[][] = [];
    for (const word of words) {
      if (!groups[word.paragraphIndex]) {
        groups[word.paragraphIndex] = [];
      }
      groups[word.paragraphIndex].push(word);
    }
    return groups;
  }, [words]);

  // Drive word reveal
  useEffect(() => {
    if (!isPlaying || words.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    words.forEach((word, i) => {
      timers.push(
        setTimeout(() => {
          setRevealedCount(i + 1);
        }, word.startTime * 1000)
      );
    });

    timers.push(
      setTimeout(() => {
        setIsPlaying(false);
      }, totalDuration * 1000)
    );

    return () => timers.forEach(clearTimeout);
  }, [isPlaying, words, totalDuration]);

  // Auto-scroll
  useEffect(() => {
    if (revealedCount <= 0) return;
    requestAnimationFrame(() => {
      latestWordRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }, [revealedCount]);

  const effectiveCount = showAll || mode === "instant" ? words.length : revealedCount;

  let paraWordOffset = 0;

  return (
    <div className="min-h-screen bg-bg-base p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="font-display text-[length:var(--text-fluid-2xl)] font-bold text-text-primary">
            Narration Paragraph Test
          </h1>
          <p className="mt-2 text-text-secondary text-[length:var(--text-fluid-sm)]">
            Testing double-newline paragraph rendering in the narration flow.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setMode("paragraphs");
              setRevealedCount(0);
              setIsPlaying(false);
              setShowAll(false);
            }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              mode === "paragraphs"
                ? "bg-primary text-bg-base"
                : "bg-bg-surface text-text-secondary hover:text-text-primary"
            )}
          >
            With Paragraphs
          </button>
          <button
            onClick={() => {
              setMode("no-paragraphs");
              setRevealedCount(0);
              setIsPlaying(false);
              setShowAll(false);
            }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              mode === "no-paragraphs"
                ? "bg-primary text-bg-base"
                : "bg-bg-surface text-text-secondary hover:text-text-primary"
            )}
          >
            Without Paragraphs
          </button>
          <button
            onClick={() => {
              setMode("instant");
              setRevealedCount(words.length);
              setIsPlaying(false);
              setShowAll(true);
            }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              mode === "instant"
                ? "bg-primary text-bg-base"
                : "bg-bg-surface text-text-secondary hover:text-text-primary"
            )}
          >
            Instant (All Visible)
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setRevealedCount(0);
              setShowAll(false);
              setIsPlaying(true);
            }}
            disabled={isPlaying}
            className="rounded-full bg-secondary px-6 py-2 text-sm font-semibold text-bg-base transition-colors hover:bg-secondary-hover disabled:opacity-50"
          >
            {isPlaying ? "Playing\u2026" : "Play Narration"}
          </button>
          <button
            onClick={() => {
              setShowAll(true);
              setIsPlaying(false);
            }}
            className="rounded-full bg-bg-surface px-6 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            Show All
          </button>
          <button
            onClick={() => {
              setRevealedCount(0);
              setIsPlaying(false);
              setShowAll(false);
            }}
            className="rounded-full bg-bg-surface px-6 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            Reset
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-xs font-mono text-text-secondary">
          <span>{words.length} words</span>
          <span>{paragraphGroups.length} paragraphs</span>
          <span>{totalDuration.toFixed(1)}s duration</span>
          <span>{effectiveCount}/{words.length} revealed</span>
        </div>

        {/* Rendered narration */}
        <div className="rounded-2xl border border-border-glass ring-1 ring-inset ring-white/[0.05] bg-bg-elevated/60 p-6 backdrop-blur-xl">
          <div className="relative">
            <div
              ref={scrollContainerRef}
              className="max-h-[60vh] select-none space-y-4 overflow-y-auto pr-3 text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
            >
              {paragraphGroups.map((paraWords, paraIdx) => {
                const paraStartIdx = paraWordOffset;
                paraWordOffset += paraWords.length;
                const paraHasAnyRevealed = effectiveCount > paraStartIdx;

                return (
                  <p
                    key={paraIdx}
                    className={cn(
                      !paraHasAnyRevealed ? "opacity-0" : undefined,
                    )}
                  >
                    {paraWords.map((word, wordIdx) => {
                      const absIdx = paraStartIdx + wordIdx;
                      if (absIdx >= effectiveCount) return null;

                      const isActiveWord =
                        absIdx === effectiveCount - 1 && isPlaying;
                      const isLastInPara = wordIdx === paraWords.length - 1;

                      if (isActiveWord) {
                        return (
                          <span
                            key={`${paraIdx}-${wordIdx}`}
                            ref={latestWordRef}
                            className="inline font-semibold text-primary"
                          >
                            {word.text}
                            {!isLastInPara ? " " : ""}
                          </span>
                        );
                      }

                      return (
                        <span key={`${paraIdx}-${wordIdx}`} className="inline">
                          {word.text}
                          {!isLastInPara ? " " : ""}
                        </span>
                      );
                    })}
                  </p>
                );
              })}
              {paragraphGroups.length === 0 && (
                <p className="text-text-secondary italic">No text to display</p>
              )}
            </div>
          </div>
        </div>

        {/* Debug: paragraph structure */}
        <details className="text-xs text-text-secondary">
          <summary className="cursor-pointer hover:text-text-primary">
            Debug: Paragraph Structure
          </summary>
          <div className="mt-2 space-y-2 font-mono">
            {paragraphGroups.map((paraWords, idx) => (
              <div key={idx} className="rounded bg-bg-surface p-2 border-l-2 border-secondary">
                <span className="text-primary">
                  P{idx} ({paraWords.length} words)
                </span>
                {" \u2014 "}
                {paraWords.map((w) => w.text).join(" ").substring(0, 100)}
                {paraWords.map((w) => w.text).join(" ").length > 100 ? "\u2026" : ""}
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
