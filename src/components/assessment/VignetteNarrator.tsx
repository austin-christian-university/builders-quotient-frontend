"use client";

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { motion } from "motion/react";
import {
  calculateWordTiming,
  getSectionBoundaries,
  type AudioWordTiming,
  type WordTiming,
} from "@/lib/assessment/narration-timer";
import type { AudioNarratorResult } from "@/lib/assessment/use-audio-narrator";
import type { Phase } from "@/lib/assessment/vignette-reducer";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";

type VignetteNarratorProps = {
  vignetteText: string;
  vignettePrompt: string;
  phase2Prompt: string | null;
  phase3Prompt: string | null;
  estimatedNarrationSeconds: number | null;
  phase: Phase;
  onComplete: () => void;
  /** Audio narrator state, managed by the parent (VignetteExperience). */
  audio: AudioNarratorResult;
  audioTiming?: AudioWordTiming[] | null;
  buffer2SubStage?: "transition" | "prompting" | "thinking";
  buffer3SubStage?: "transition" | "prompting" | "thinking";
};

export function VignetteNarrator({
  vignetteText,
  vignettePrompt,
  phase2Prompt,
  phase3Prompt,
  estimatedNarrationSeconds,
  phase,
  onComplete,
  audio,
  audioTiming = null,
  buffer2SubStage,
  buffer3SubStage,
}: VignetteNarratorProps) {
  const hasCompletedRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const latestWordRef = useRef<HTMLSpanElement>(null);

  const prefersReducedMotion = usePrefersReducedMotion();

  const useAudioMode = audio.hasAudio;
  const isActive = phase === "narrating";

  // Compute section boundaries from audioTiming
  const sectionBounds = useMemo(
    () => (audioTiming ? getSectionBoundaries(audioTiming) : []),
    [audioTiming]
  );
  const narrativeBound = sectionBounds.find((b) => b.section === "narrative");
  const phase1PromptBound = sectionBounds.find((b) => b.section === "phase_1_prompt");
  const phase2PromptBound = sectionBounds.find((b) => b.section === "phase_2_prompt");
  const phase3PromptBound = sectionBounds.find((b) => b.section === "phase_3_prompt");

  // Narrative word count (for splitting audio timings between sections)
  const narrativeEndIdx = narrativeBound ? narrativeBound.endIdx + 1 : (audioTiming?.length ?? 0);
  const phase1PromptStartIdx = phase1PromptBound?.startIdx ?? narrativeEndIdx;
  const phase1PromptEndIdx = phase1PromptBound ? phase1PromptBound.endIdx + 1 : narrativeEndIdx;
  const phase2PromptStartIdx = phase2PromptBound?.startIdx ?? (audioTiming?.length ?? 0);
  const phase3PromptStartIdx = phase3PromptBound?.startIdx ?? (audioTiming?.length ?? 0);

  // --- Timer-based fallback timing (for narrative text only) ---
  const { words, totalDuration } = useMemo(
    () => calculateWordTiming(vignetteText, estimatedNarrationSeconds),
    [vignetteText, estimatedNarrationSeconds]
  );

  const sentenceGroups = useMemo(() => {
    const groups: WordTiming[][] = [];
    for (const word of words) {
      if (!groups[word.sentenceIndex]) {
        groups[word.sentenceIndex] = [];
      }
      groups[word.sentenceIndex].push(word);
    }
    return groups;
  }, [words]);

  // --- State for timer-based reveal ---
  const [timerRevealedCount, setTimerRevealedCount] = useState(0);

  const effectiveTimerCount =
    !useAudioMode && prefersReducedMotion && isActive
      ? words.length
      : timerRevealedCount;

  // Derived counts for each section
  const totalWords = useAudioMode ? (audioTiming?.length ?? 0) : words.length;

  // Show all words when past narrating phase
  const showAllNarrative = phase !== "narrating";

  // Prompt visibility rules
  // Phase 1 prompt appears during narrating (word-by-word as audio reaches it) and stays visible after
  const isPhase1Revealing = phase === "narrating";
  const showPhase1Prompt =
    isPhase1Revealing ||
    phase === "buffer_1" || phase === "recording_1" ||
    phase === "buffer_2" || phase === "recording_2" ||
    phase === "buffer_3" || phase === "recording_3";
  const showPhase2Prompt =
    phase === "buffer_2" || phase === "recording_2" ||
    phase === "buffer_3" || phase === "recording_3";
  const isPhase2Revealing = phase === "buffer_2" && buffer2SubStage === "prompting";
  const showPhase3Prompt = phase === "buffer_3" || phase === "recording_3";
  const isPhase3Revealing = phase === "buffer_3" && buffer3SubStage === "prompting";

  // The actual revealed count
  const revealedCount = showAllNarrative
    ? totalWords
    : useAudioMode
      ? audio.revealedCount
      : effectiveTimerCount;

  // --- Audio mode: fire onComplete when phase_1_prompt section ends ---
  useEffect(() => {
    if (!useAudioMode) return;

    // If we have section boundaries, fire when revealed count reaches end of phase_1_prompt
    if (phase1PromptBound) {
      if (audio.revealedCount >= phase1PromptEndIdx && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete();
      }
      return;
    }

    // Fallback: fire when entire audio completes (old behavior)
    if (audio.isComplete && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete();
    }
  }, [useAudioMode, audio.isComplete, audio.revealedCount, phase1PromptBound, phase1PromptEndIdx, onComplete]);

  // --- Timer mode: drive reveal with setTimeout per word ---
  useEffect(() => {
    if (useAudioMode) return;
    if (!isActive || words.length === 0) return;

    if (prefersReducedMotion) {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        const id = setTimeout(onComplete, 1500);
        return () => clearTimeout(id);
      }
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    words.forEach((word, i) => {
      const timer = setTimeout(() => {
        setTimerRevealedCount(i + 1);
      }, word.startTime * 1000);
      timers.push(timer);
    });

    const completionTimer = setTimeout(() => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete();
      }
    }, totalDuration * 1000);
    timers.push(completionTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [useAudioMode, isActive, onComplete, prefersReducedMotion, words, totalDuration]);

  // --- Auto-scroll to keep latest word visible ---
  useEffect(() => {
    if (revealedCount <= 0) return;
    const id = requestAnimationFrame(() => {
      latestWordRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [revealedCount]);

  // --- Render ---

  // Audio mode: section-aware rendering
  if (useAudioMode && audioTiming) {
    const showAll = prefersReducedMotion;

    // Narrative words (section = "narrative" or no section)
    const narrativeTimings = audioTiming.slice(0, narrativeEndIdx);
    const narrativeCount = showAllNarrative || showAll
      ? narrativeTimings.length
      : Math.min(revealedCount, narrativeTimings.length);

    // Phase 1 prompt words
    const phase1PromptTimings = audioTiming.slice(phase1PromptStartIdx, phase1PromptEndIdx);
    const phase1PromptCount = showAllNarrative || showAll
      ? phase1PromptTimings.length
      : Math.max(0, revealedCount - phase1PromptStartIdx);

    // Phase 2 prompt words
    const phase2PromptTimings = phase2PromptBound
      ? audioTiming.slice(phase2PromptStartIdx, phase2PromptBound.endIdx + 1)
      : [];
    const phase2PromptCount = (showPhase2Prompt && !isPhase2Revealing) || showAll
      ? phase2PromptTimings.length
      : isPhase2Revealing
        ? Math.max(0, audio.revealedCount - phase2PromptStartIdx)
        : 0;

    // Phase 3 prompt words
    const phase3PromptTimings = phase3PromptBound
      ? audioTiming.slice(phase3PromptStartIdx, phase3PromptBound.endIdx + 1)
      : [];
    const phase3PromptCount = (showPhase3Prompt && !isPhase3Revealing) || showAll
      ? phase3PromptTimings.length
      : isPhase3Revealing
        ? Math.max(0, audio.revealedCount - phase3PromptStartIdx)
        : 0;

    return (
      <motion.div layout className="w-full space-y-6">
        <ScrollableTextBox scrollContainerRef={scrollContainerRef} ariaLive="polite">
          <p>
            {narrativeTimings.map((timing, i) => {
              if (i >= narrativeCount) return null;

              const isActiveWord = i === narrativeCount - 1 && !showAll && isActive;
              const isLast = i === narrativeTimings.length - 1;

              if (!isActiveWord) {
                return (
                  <span key={i} className="inline">
                    {timing.word}
                    {!isLast ? " " : ""}
                  </span>
                );
              }

              return (
                <ActiveWord
                  key={i}
                  ref={latestWordRef}
                  word={timing.word}
                  wordStart={timing.start}
                  wordEnd={timing.end}
                  currentTimeRef={audio.currentTimeRef}
                  trailingSpace={!isLast}
                />
              );
            })}
          </p>

          <NarrationDebugBar
            mode="audio"
            hasFailed={audio.hasFailed}
            audioRef={audio.audioRef}
            audioTiming={audioTiming}
            revealedCount={revealedCount}
            totalWords={totalWords}
            isActive
          />
        </ScrollableTextBox>

        {/* Phase 1 prompt — word-by-word during narrating, static text after */}
        {showPhase1Prompt && phase1PromptCount > 0 && (
          <PromptSection
            label="Prompt 1"
            text={!isPhase1Revealing ? vignettePrompt : undefined}
          >
            {isPhase1Revealing && phase1PromptTimings.length > 0 && (
              <p className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary">
                {phase1PromptTimings.map((timing, i) => {
                  if (i >= phase1PromptCount) return null;

                  const globalIdx = phase1PromptStartIdx + i;
                  const isActiveWord = globalIdx === revealedCount - 1 && !showAll;
                  const isLast = i === phase1PromptTimings.length - 1;

                  if (!isActiveWord) {
                    return (
                      <span key={i} className="inline">
                        {timing.word}
                        {!isLast ? " " : ""}
                      </span>
                    );
                  }

                  return (
                    <ActiveWord
                      key={i}
                      ref={latestWordRef}
                      word={timing.word}
                      wordStart={timing.start}
                      wordEnd={timing.end}
                      currentTimeRef={audio.currentTimeRef}
                      trailingSpace={!isLast}
                    />
                  );
                })}
              </p>
            )}
          </PromptSection>
        )}

        {/* Phase 2 prompt */}
        {showPhase2Prompt && phase2Prompt && (
          <PromptSection label="Prompt 2" text={!isPhase2Revealing ? phase2Prompt : undefined}>
            {isPhase2Revealing && phase2PromptTimings.length > 0 && (
              <div className="mt-2">
                <p>
                  {phase2PromptTimings.map((timing, i) => {
                    if (i >= phase2PromptCount) return null;

                    const globalIdx = phase2PromptStartIdx + i;
                    const isActiveWord = globalIdx === revealedCount - 1 && !showAll;
                    const isLast = i === phase2PromptTimings.length - 1;

                    if (!isActiveWord) {
                      return (
                        <span key={i} className="inline">
                          {timing.word}
                          {!isLast ? " " : ""}
                        </span>
                      );
                    }

                    return (
                      <ActiveWord
                        key={i}
                        ref={latestWordRef}
                        word={timing.word}
                        wordStart={timing.start}
                        wordEnd={timing.end}
                        currentTimeRef={audio.currentTimeRef}
                        trailingSpace={!isLast}
                      />
                    );
                  })}
                </p>
              </div>
            )}
          </PromptSection>
        )}

        {/* Phase 3 prompt */}
        {showPhase3Prompt && phase3Prompt && (
          <PromptSection label="Prompt 3" text={!isPhase3Revealing ? phase3Prompt : undefined}>
            {isPhase3Revealing && phase3PromptTimings.length > 0 && (
              <div className="mt-2">
                <p>
                  {phase3PromptTimings.map((timing, i) => {
                    if (i >= phase3PromptCount) return null;

                    const globalIdx = phase3PromptStartIdx + i;
                    const isActiveWord = globalIdx === revealedCount - 1 && !showAll;
                    const isLast = i === phase3PromptTimings.length - 1;

                    if (!isActiveWord) {
                      return (
                        <span key={i} className="inline">
                          {timing.word}
                          {!isLast ? " " : ""}
                        </span>
                      );
                    }

                    return (
                      <ActiveWord
                        key={i}
                        ref={latestWordRef}
                        word={timing.word}
                        wordStart={timing.start}
                        wordEnd={timing.end}
                        currentTimeRef={audio.currentTimeRef}
                        trailingSpace={!isLast}
                      />
                    );
                  })}
                </p>
              </div>
            )}
          </PromptSection>
        )}
      </motion.div>
    );
  }

  // --- Timer-based fallback rendering ---
  let globalWordIndex = 0;

  return (
    <motion.div layout className="w-full space-y-6">
      <ScrollableTextBox scrollContainerRef={scrollContainerRef} ariaLive="polite">
        {sentenceGroups.map((group, sentenceIdx) => {
          const sentenceStartIdx = globalWordIndex;
          globalWordIndex += group.length;
          const sentenceHasAnyRevealed = revealedCount > sentenceStartIdx;

          return (
            <p
              key={sentenceIdx}
              className={
                !sentenceHasAnyRevealed && !prefersReducedMotion
                  ? "opacity-0"
                  : undefined
              }
            >
              {group.map((word, wordIdx) => {
                const absIdx = sentenceStartIdx + wordIdx;
                if (absIdx >= revealedCount) return null;

                const isActiveWord =
                  absIdx === revealedCount - 1 && !prefersReducedMotion && isActive;
                const isLastInGroup = wordIdx === group.length - 1;

                if (!isActiveWord) {
                  return (
                    <span key={`${sentenceIdx}-${wordIdx}`} className="inline">
                      {word.text}
                      {!isLastInGroup ? " " : ""}
                    </span>
                  );
                }

                const nextWord = words[absIdx + 1];
                const wordEndTime = nextWord
                  ? nextWord.startTime
                  : totalDuration;

                return (
                  <ActiveWord
                    key={`${sentenceIdx}-${wordIdx}`}
                    ref={latestWordRef}
                    word={word.text}
                    wordStart={word.startTime}
                    wordEnd={wordEndTime}
                    trailingSpace={!isLastInGroup}
                  />
                );
              })}
            </p>
          );
        })}
        {sentenceGroups.length === 0 && (
          <p className="opacity-0">{vignetteText}</p>
        )}

        <NarrationDebugBar
          mode="timer"
          hasFailed={audio.hasFailed}
          audioRef={audio.audioRef}
          audioTiming={audioTiming}
          revealedCount={revealedCount}
          totalWords={totalWords}
          isActive
        />
      </ScrollableTextBox>

      {/* Phase 1 prompt (timer fallback — show full text) */}
      {showPhase1Prompt && (
        <PromptSection label="Prompt 1" text={vignettePrompt} />
      )}

      {/* Phase 2 prompt (timer fallback — show full text) */}
      {showPhase2Prompt && phase2Prompt && (
        <PromptSection label="Prompt 2" text={phase2Prompt} />
      )}

      {/* Phase 3 prompt (timer fallback — show full text) */}
      {showPhase3Prompt && phase3Prompt && (
        <PromptSection label="Prompt 3" text={phase3Prompt} />
      )}
    </motion.div>
  );
}

// --- ActiveWord: per-character fade-in reveal ---

type ActiveWordProps = {
  word: string;
  wordStart: number;
  wordEnd: number;
  currentTimeRef?: RefObject<number>;
  trailingSpace: boolean;
};

const ActiveWord = forwardRef<HTMLSpanElement, ActiveWordProps>(
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

// --- Narration Debug Bar (dev only, inline) ---

type NarrationDebugBarProps = {
  mode: "audio" | "timer";
  hasFailed: boolean;
  audioRef: RefObject<HTMLAudioElement | null>;
  audioTiming: AudioWordTiming[] | null;
  revealedCount: number;
  totalWords: number;
  isActive: boolean;
};

function NarrationDebugBar({
  mode,
  hasFailed,
  audioRef,
  audioTiming,
  revealedCount,
  totalWords,
  isActive,
}: NarrationDebugBarProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const revealedCountRef = useRef(revealedCount);
  revealedCountRef.current = revealedCount;
  const audioTimingRef = useRef(audioTiming);
  audioTimingRef.current = audioTiming;
  const totalWordsRef = useRef(totalWords);
  totalWordsRef.current = totalWords;

  useEffect(() => {
    const startTime = performance.now();
    let rafId: number;

    const tick = () => {
      const el = canvasRef.current;
      if (!el) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const count = revealedCountRef.current;
      const total = totalWordsRef.current;
      const timing = audioTimingRef.current;
      const audio = audioRef.current;

      if (mode === "audio" && audio && timing && timing.length > 0) {
        const ct = audio.currentTime;
        const dur = audio.duration;
        const lwEnd = timing[timing.length - 1].end;
        const durMismatch = Number.isFinite(dur) ? dur - lwEnd : NaN;

        let expectedIdx = -1;
        for (let i = 0; i < timing.length; i++) {
          if (timing[i].start <= ct) expectedIdx = i;
          else break;
        }
        const expectedCount = expectedIdx + 1;
        const drift = count - expectedCount;

        const driftColor = drift === 0 ? "#6ee7b7" : Math.abs(drift) <= 1 ? "#fbbf24" : "#f87171";
        const durColor = Number.isNaN(durMismatch) ? "#9aa0ac" : Math.abs(durMismatch) > 0.1 ? "#fbbf24" : "#6ee7b7";

        el.innerHTML =
          `<span style="color:#6ee7b7;font-weight:600">AUDIO</span>` +
          ` &middot; ${ct.toFixed(2)}/${Number.isFinite(dur) ? dur.toFixed(2) : "?"}s` +
          ` &middot; <span style="color:${durColor}">\u0394${Number.isNaN(durMismatch) ? "?" : (durMismatch > 0 ? "+" : "") + durMismatch.toFixed(2)}s</span>` +
          ` &middot; ${count}/${total}` +
          ` &middot; <span style="color:${driftColor}">drift ${drift > 0 ? "+" : ""}${drift}</span>`;
      } else {
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
        const modeLabel = hasFailed
          ? `<span style="color:#f87171;font-weight:600">TIMER (audio failed)</span>`
          : `<span style="color:#fbbf24;font-weight:600">TIMER</span>`;
        el.innerHTML = `${modeLabel} &middot; ${count}/${total} &middot; ${elapsed}s`;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [mode, hasFailed, audioRef]);

  if (process.env.NODE_ENV !== "development" || !isActive) return null;

  return (
    <div
      ref={canvasRef}
      className="border-t border-white/10 pt-2 mt-4 font-mono text-[10px] text-green-400/80"
    />
  );
}

// --- ScrollableTextBox: glass card with scroll indicators ---

function ScrollableTextBox({
  scrollContainerRef,
  ariaLive,
  children,
}: {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  ariaLive?: "polite";
  children: React.ReactNode;
}) {
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setCanScrollUp(scrollTop > 2);
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 2);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [scrollContainerRef]);

  return (
    <motion.div
      layout
      className="rounded-2xl border border-border-glass ring-1 ring-inset ring-white/[0.05] bg-bg-elevated/60 p-6 backdrop-blur-xl"
      aria-live={ariaLive}
    >
      <div className="relative">
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-opacity duration-200",
            canScrollUp ? "opacity-100" : "opacity-0"
          )}
        />

        <div
          ref={scrollContainerRef}
          className="max-h-[50vh] space-y-3 overflow-y-auto pr-3 text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
        >
          {children}
        </div>

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-opacity duration-200",
            canScrollDown ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </motion.div>
  );
}

// --- PromptSection ---

function PromptSection({
  label,
  text,
  children,
}: {
  label: string;
  text?: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5 mt-4"
    >
      <p className="mb-1 text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-secondary">
        {label}
      </p>
      {text && (
        <p className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary">
          {text}
        </p>
      )}
      {children}
    </motion.div>
  );
}
