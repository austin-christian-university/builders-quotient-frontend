"use client";

import {
  Fragment,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  calculateWordTiming,
  getParagraphBreakWordIndices,
  getSectionBoundaries,
  type AudioWordTiming,
  type WordTiming,
} from "@/lib/assessment/narration-timer";
import type { AudioNarratorResult } from "@/lib/assessment/use-audio-narrator";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";

const SKIP_TOKENS = new Set(["…", "...", "."]);
function isSkipToken(word: string): boolean {
  return SKIP_TOKENS.has(word.trim());
}

// AnimatePresence fade variants for single-slot content transitions
const FADE_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;
function stripLeadingEllipsis(text: string): string {
  return text.replace(/^[\s]*[.…]+[\s]+/, "");
}

export type ActiveContent = "prompt1" | "prompt2" | "prompt3";

type VignetteNarratorProps = {
  vignetteText: string;
  vignettePrompt: string;
  phase2Prompt: string | null;
  phase3Prompt: string | null;
  estimatedNarrationSeconds: number | null;
  /** Whether narration is currently active (word reveal in progress) */
  isNarrating: boolean;
  /** Whether to show all narrative text (past narration phase) */
  showAllNarrative: boolean;
  /** Which prompts are currently visible (legacy — used by WarmupExperience) */
  visiblePrompts?: ReadonlySet<1 | 2 | 3>;
  /** Single-slot content display (used by VignetteExperience). Takes precedence over visiblePrompts. */
  activeContent?: ActiveContent;
  /** Whether phase 1 prompt is currently being revealed word-by-word */
  isPhase1Revealing: boolean;
  /** Whether phase 2 prompt is currently being revealed word-by-word */
  isPhase2Revealing: boolean;
  /** Whether phase 3 prompt is currently being revealed word-by-word */
  isPhase3Revealing: boolean;
  onComplete: () => void;
  /** Audio narrator state, managed by the parent (VignetteExperience). */
  audio: AudioNarratorResult;
  audioTiming?: AudioWordTiming[] | null;
};

export function VignetteNarrator({
  vignetteText,
  vignettePrompt,
  phase2Prompt,
  phase3Prompt,
  estimatedNarrationSeconds,
  isNarrating,
  showAllNarrative,
  visiblePrompts,
  activeContent,
  isPhase1Revealing,
  isPhase2Revealing,
  isPhase3Revealing,
  onComplete,
  audio,
  audioTiming = null,
}: VignetteNarratorProps) {
  const hasCompletedRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const latestWordRef = useRef<HTMLSpanElement>(null);

  const prefersReducedMotion = usePrefersReducedMotion();

  const useAudioMode = audio.hasAudio;
  const isActive = isNarrating;

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

  // --- Timer-based prompt word timings ---
  const prompt1Words = useMemo(
    () => calculateWordTiming(vignettePrompt),
    [vignettePrompt]
  );
  const prompt2Words = useMemo(
    () => (phase2Prompt ? calculateWordTiming(phase2Prompt) : null),
    [phase2Prompt]
  );
  const prompt3Words = useMemo(
    () => (phase3Prompt ? calculateWordTiming(phase3Prompt) : null),
    [phase3Prompt]
  );

  // Paragraph break indices for visual grouping (audio mode)
  const paragraphBreaks = useMemo(
    () => getParagraphBreakWordIndices(vignetteText),
    [vignetteText]
  );

  // Pre-compute narrative paragraph groups for audio mode
  const narrativeParagraphGroups = useMemo(() => {
    if (!audioTiming) return [];
    const timings = audioTiming.slice(0, narrativeEndIdx);
    if (paragraphBreaks.size === 0) return [{ offset: 0, timings }];

    const groups: { offset: number; timings: AudioWordTiming[] }[] = [
      { offset: 0, timings: [] },
    ];
    for (let i = 0; i < timings.length; i++) {
      if (paragraphBreaks.has(i) && groups[groups.length - 1].timings.length > 0) {
        groups.push({ offset: i, timings: [] });
      }
      groups[groups.length - 1].timings.push(timings[i]);
    }
    return groups;
  }, [audioTiming, narrativeEndIdx, paragraphBreaks]);

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
  const [prompt1RevealedCount, setPrompt1RevealedCount] = useState(0);
  const [prompt2RevealedCount, setPrompt2RevealedCount] = useState(0);
  const [prompt3RevealedCount, setPrompt3RevealedCount] = useState(0);

  const effectiveTimerCount =
    !useAudioMode && prefersReducedMotion && isActive
      ? words.length
      : timerRevealedCount;

  // Derived counts for each section
  const totalWords = useAudioMode ? (audioTiming?.length ?? 0) : words.length;

  // Prompt visibility: activeContent (single-slot) takes precedence over visiblePrompts (stacking)
  const showPhase1Prompt = activeContent ? activeContent === "prompt1" : !!visiblePrompts?.has(1);
  const showPhase2Prompt = activeContent ? activeContent === "prompt2" : !!visiblePrompts?.has(2);
  const showPhase3Prompt = activeContent ? activeContent === "prompt3" : !!visiblePrompts?.has(3);

  // Track whether reveal has ever started — prevents flashing full text
  // during the fade-in before the word-by-word reveal begins.
  const [hasPhase2Revealed, setHasPhase2Revealed] = useState(false);
  const [hasPhase3Revealed, setHasPhase3Revealed] = useState(false);
  useEffect(() => { if (isPhase2Revealing) setHasPhase2Revealed(true); }, [isPhase2Revealing]);
  useEffect(() => { if (isPhase3Revealing) setHasPhase3Revealed(true); }, [isPhase3Revealing]);

  // Timer-mode prompt revealing: word-by-word in progress
  const isPrompt1TimerRevealing = !useAudioMode && !prefersReducedMotion
    && showPhase1Prompt && !isActive
    && prompt1RevealedCount < prompt1Words.words.length;
  const isPrompt2TimerRevealing = !useAudioMode && !prefersReducedMotion
    && isPhase2Revealing && prompt2Words != null
    && prompt2RevealedCount < prompt2Words.words.length;
  const isPrompt3TimerRevealing = !useAudioMode && !prefersReducedMotion
    && isPhase3Revealing && prompt3Words != null
    && prompt3RevealedCount < prompt3Words.words.length;

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
        // Wait for the last word to finish speaking before completing.
        // revealedCount fires when the last word's start time is reached,
        // but the word is still being spoken until audioEnd.
        const remaining = Math.max(0, (phase1PromptBound.audioEnd - audio.currentTimeRef.current) * 1000);
        if (remaining <= 0) {
          hasCompletedRef.current = true;
          onComplete();
        } else {
          const timer = setTimeout(() => {
            if (!hasCompletedRef.current) {
              hasCompletedRef.current = true;
              onComplete();
            }
          }, remaining);
          return () => clearTimeout(timer);
        }
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

  // --- Timer mode: drive word reveal for prompt 1 ---
  useEffect(() => {
    if (useAudioMode || prefersReducedMotion) return;
    if (!showPhase1Prompt || isActive) return;

    const pWords = prompt1Words.words;
    if (pWords.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    pWords.forEach((word, i) => {
      timers.push(setTimeout(() => {
        setPrompt1RevealedCount(i + 1);
      }, word.startTime * 1000));
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [useAudioMode, prefersReducedMotion, showPhase1Prompt, isActive, prompt1Words]);

  // --- Timer mode: drive word reveal for prompt 2 ---
  useEffect(() => {
    if (useAudioMode || prefersReducedMotion) return;
    if (!isPhase2Revealing || !prompt2Words) return;

    const pWords = prompt2Words.words;
    if (pWords.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    pWords.forEach((word, i) => {
      timers.push(setTimeout(() => {
        setPrompt2RevealedCount(i + 1);
      }, word.startTime * 1000));
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [useAudioMode, prefersReducedMotion, isPhase2Revealing, prompt2Words]);

  // --- Timer mode: drive word reveal for prompt 3 ---
  useEffect(() => {
    if (useAudioMode || prefersReducedMotion) return;
    if (!isPhase3Revealing || !prompt3Words) return;

    const pWords = prompt3Words.words;
    if (pWords.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    pWords.forEach((word, i) => {
      timers.push(setTimeout(() => {
        setPrompt3RevealedCount(i + 1);
      }, word.startTime * 1000));
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [useAudioMode, prefersReducedMotion, isPhase3Revealing, prompt3Words]);

  // --- Auto-scroll to keep latest word visible ---
  const totalRevealedCount = revealedCount + prompt1RevealedCount + prompt2RevealedCount + prompt3RevealedCount;
  useEffect(() => {
    if (totalRevealedCount <= 0) return;
    const id = requestAnimationFrame(() => {
      latestWordRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [totalRevealedCount]);

  const fadeTransition = { duration: prefersReducedMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] as const };

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
    const phase2PromptCount = (showPhase2Prompt && !isPhase2Revealing && hasPhase2Revealed) || showAll
      ? phase2PromptTimings.length
      : isPhase2Revealing
        ? Math.max(0, audio.revealedCount - phase2PromptStartIdx)
        : 0;

    // Phase 3 prompt words
    const phase3PromptTimings = phase3PromptBound
      ? audioTiming.slice(phase3PromptStartIdx, phase3PromptBound.endIdx + 1)
      : [];
    const phase3PromptCount = (showPhase3Prompt && !isPhase3Revealing && hasPhase3Revealed) || showAll
      ? phase3PromptTimings.length
      : isPhase3Revealing
        ? Math.max(0, audio.revealedCount - phase3PromptStartIdx)
        : 0;

    // Narrative text — always visible (never fades)
    const narrativeTextBlock = (
      <ScrollableTextBox scrollContainerRef={scrollContainerRef} ariaLive="polite">
        {narrativeParagraphGroups.map((group, pIdx) => (
          <Fragment key={pIdx}>
            {pIdx > 0 && <div className="h-3" aria-hidden="true" />}
            <p>
              {group.timings.map((timing, localIdx) => {
                const i = group.offset + localIdx;
                if (i >= narrativeCount) return null;

                const isActiveWord = i === narrativeCount - 1 && !showAll && isActive;
                const isLast = i === narrativeEndIdx - 1;

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
          </Fragment>
        ))}

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
    );

    // Prompt 1 card — fades in/out in single-slot mode
    const prompt1Block = showPhase1Prompt && phase1PromptCount > 0 && (
      <PromptSection
        label="Prompt 1"
        text={!isPhase1Revealing ? stripLeadingEllipsis(vignettePrompt) : undefined}
      >
        {isPhase1Revealing && phase1PromptTimings.length > 0 && (
          <p className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary">
            {phase1PromptTimings.map((timing, i) => {
              if (i >= phase1PromptCount) return null;
              if (isSkipToken(timing.word)) return null;

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
    );

    const prompt2Block = showPhase2Prompt && phase2Prompt && (
      <PromptSection label="Prompt 2" text={(!isPhase2Revealing && hasPhase2Revealed) ? stripLeadingEllipsis(phase2Prompt) : undefined}>
        {isPhase2Revealing && phase2PromptTimings.length > 0 && (
          <p className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary">
            {phase2PromptTimings.map((timing, i) => {
              if (i >= phase2PromptCount) return null;
              if (isSkipToken(timing.word)) return null;

              const globalIdx = phase2PromptStartIdx + i;
              const isActiveWord = globalIdx === audio.revealedCount - 1 && !showAll;
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
        )}
      </PromptSection>
    );

    const prompt3Block = showPhase3Prompt && phase3Prompt && (
      <PromptSection label="Prompt 3" text={(!isPhase3Revealing && hasPhase3Revealed) ? stripLeadingEllipsis(phase3Prompt) : undefined}>
        {isPhase3Revealing && phase3PromptTimings.length > 0 && (
          <p className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary">
            {phase3PromptTimings.map((timing, i) => {
              if (i >= phase3PromptCount) return null;
              if (isSkipToken(timing.word)) return null;

              const globalIdx = phase3PromptStartIdx + i;
              const isActiveWord = globalIdx === audio.revealedCount - 1 && !showAll;
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
        )}
      </PromptSection>
    );

    // Single-slot mode: narrative always visible, only prompt card fades
    if (activeContent) {
      return (
        <div className="w-full space-y-6">
          {narrativeTextBlock}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeContent}
              variants={FADE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={fadeTransition}
            >
              {activeContent === "prompt1" && prompt1Block}
              {activeContent === "prompt2" && prompt2Block}
              {activeContent === "prompt3" && prompt3Block}
            </motion.div>
          </AnimatePresence>
        </div>
      );
    }

    // Legacy stacking mode (warmup)
    return (
      <div className="w-full space-y-6">
        {narrativeTextBlock}
        {prompt1Block}
        {prompt2Block}
        {prompt3Block}
      </div>
    );
  }

  // --- Timer-based fallback rendering ---
  let globalWordIndex = 0;

  // Timer fallback: narrative text — always visible
  const timerNarrativeTextBlock = (
    <ScrollableTextBox scrollContainerRef={scrollContainerRef} ariaLive="polite">
      {sentenceGroups.map((group, sentenceIdx) => {
        const sentenceStartIdx = globalWordIndex;
        globalWordIndex += group.length;
        const sentenceHasAnyRevealed = revealedCount > sentenceStartIdx;
        const isNewParagraph =
          sentenceIdx > 0 &&
          group[0]?.paragraphIndex !==
            sentenceGroups[sentenceIdx - 1]?.[0]?.paragraphIndex;

        return (
          <Fragment key={sentenceIdx}>
            {isNewParagraph && <div className="h-3" aria-hidden="true" />}
            <p
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
          </Fragment>
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
  );

  // Timer fallback: prompt 1 card — fades in single-slot mode
  const timerPrompt1Block = showPhase1Prompt && !isActive && (
    <PromptSection
      label="Prompt 1"
      text={!isPrompt1TimerRevealing ? stripLeadingEllipsis(vignettePrompt) : undefined}
    >
      {isPrompt1TimerRevealing && (
        <p className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary">
          {prompt1Words.words.map((word, i) => {
            if (i >= prompt1RevealedCount) return null;
            if (isSkipToken(word.text)) return null;

            const isActiveW = i === prompt1RevealedCount - 1;
            const isLast = i === prompt1Words.words.length - 1;
            const nextWord = prompt1Words.words[i + 1];
            const wordEnd = nextWord ? nextWord.startTime : prompt1Words.totalDuration;

            if (!isActiveW) {
              return (
                <span key={i} className="inline">
                  {word.text}
                  {!isLast ? " " : ""}
                </span>
              );
            }

            return (
              <ActiveWord
                key={i}
                ref={latestWordRef}
                word={word.text}
                wordStart={word.startTime}
                wordEnd={wordEnd}
                trailingSpace={!isLast}
              />
            );
          })}
        </p>
      )}
    </PromptSection>
  );

  const timerPrompt2Block = showPhase2Prompt && phase2Prompt && (
    <PromptSection
      label="Prompt 2"
      text={(!isPrompt2TimerRevealing && hasPhase2Revealed) ? stripLeadingEllipsis(phase2Prompt) : undefined}
    >
      {isPrompt2TimerRevealing && prompt2Words && (
        <p className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary">
          {prompt2Words.words.map((word, i) => {
            if (i >= prompt2RevealedCount) return null;
            if (isSkipToken(word.text)) return null;

            const isActiveW = i === prompt2RevealedCount - 1;
            const isLast = i === prompt2Words.words.length - 1;
            const nextWord = prompt2Words.words[i + 1];
            const wordEnd = nextWord ? nextWord.startTime : prompt2Words.totalDuration;

            if (!isActiveW) {
              return (
                <span key={i} className="inline">
                  {word.text}
                  {!isLast ? " " : ""}
                </span>
              );
            }

            return (
              <ActiveWord
                key={i}
                ref={latestWordRef}
                word={word.text}
                wordStart={word.startTime}
                wordEnd={wordEnd}
                trailingSpace={!isLast}
              />
            );
          })}
        </p>
      )}
    </PromptSection>
  );

  const timerPrompt3Block = showPhase3Prompt && phase3Prompt && (
    <PromptSection
      label="Prompt 3"
      text={(!isPrompt3TimerRevealing && hasPhase3Revealed) ? stripLeadingEllipsis(phase3Prompt) : undefined}
    >
      {isPrompt3TimerRevealing && prompt3Words && (
        <p className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary">
          {prompt3Words.words.map((word, i) => {
            if (i >= prompt3RevealedCount) return null;
            if (isSkipToken(word.text)) return null;

            const isActiveW = i === prompt3RevealedCount - 1;
            const isLast = i === prompt3Words.words.length - 1;
            const nextWord = prompt3Words.words[i + 1];
            const wordEnd = nextWord ? nextWord.startTime : prompt3Words.totalDuration;

            if (!isActiveW) {
              return (
                <span key={i} className="inline">
                  {word.text}
                  {!isLast ? " " : ""}
                </span>
              );
            }

            return (
              <ActiveWord
                key={i}
                ref={latestWordRef}
                word={word.text}
                wordStart={word.startTime}
                wordEnd={wordEnd}
                trailingSpace={!isLast}
              />
            );
          })}
        </p>
      )}
    </PromptSection>
  );

  // Single-slot mode: narrative always visible, only prompt card fades
  if (activeContent) {
    return (
      <div className="w-full space-y-6">
        {timerNarrativeTextBlock}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeContent}
            variants={FADE_VARIANTS}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={fadeTransition}
          >
            {activeContent === "prompt1" && timerPrompt1Block}
            {activeContent === "prompt2" && timerPrompt2Block}
            {activeContent === "prompt3" && timerPrompt3Block}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Legacy stacking mode (warmup)
  return (
    <div className="w-full space-y-6">
      {timerNarrativeTextBlock}
      {timerPrompt1Block}
      {timerPrompt2Block}
      {timerPrompt3Block}
    </div>
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
  const audioTimingRef = useRef(audioTiming);
  const totalWordsRef = useRef(totalWords);

  useEffect(() => {
    revealedCountRef.current = revealedCount;
    audioTimingRef.current = audioTiming;
    totalWordsRef.current = totalWords;
  });

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
    <div
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
          className="max-h-[50vh] select-none space-y-3 overflow-y-auto pr-3 text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
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
    </div>
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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="select-none rounded-2xl border border-secondary/30 bg-secondary/5 p-5 mt-4"
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
