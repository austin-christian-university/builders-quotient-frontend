# Warmup-Exam Flow Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify warmup and exam timer UIs, add a narrated warmup vignette, and make the warmup flow mirror the exam's rhythm (countdown -> narration -> buffer/record x3).

**Architecture:** Create a shared `CountdownRing` component used by both flows. Rewrite the warmup to use a new state machine (`warmup-reducer.ts`) that mirrors the exam's `vignette-reducer.ts`. Generalize `VignetteNarrator` to accept a `visiblePrompts` prop so both flows can drive it. Extract `CountdownDigit` to a shared component.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Framer Motion, Tailwind CSS v4, Vitest

**Spec:** `docs/superpowers/specs/2026-03-19-warmup-exam-parity-design.md`

---

### Task 1: Extract `CountdownDigit` to shared component

**Files:**
- Create: `src/components/assessment/CountdownDigit.tsx`
- Modify: `src/components/assessment/VignetteExperience.tsx` (lines 1049-1091)
- Create: `src/components/assessment/__tests__/CountdownDigit.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/assessment/__tests__/CountdownDigit.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CountdownDigit } from "../CountdownDigit";

describe("CountdownDigit", () => {
  it("renders the number", () => {
    render(
      <CountdownDigit
        number={3}
        onEnterComplete={() => {}}
        prefersReducedMotion={true}
      />
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders static text when prefersReducedMotion is true", () => {
    const { container } = render(
      <CountdownDigit
        number={2}
        onEnterComplete={() => {}}
        prefersReducedMotion={true}
      />
    );
    // Should not have motion.span (rendered as plain span)
    expect(container.querySelector("span")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/assessment/__tests__/CountdownDigit.test.tsx`
Expected: FAIL — cannot find module `../CountdownDigit`

- [ ] **Step 3: Create CountdownDigit component**

Extract from `VignetteExperience.tsx` lines 1049-1091. The component is currently an inline function:

Copy the exact implementation from VignetteExperience.tsx lines 1048-1091, preserving:
- `onEnterComplete?: (n: number) => void` — optional, takes number arg
- `prefersReducedMotion?: boolean` — optional
- `useEffect` that calls `onEnterComplete?.(number)` when `prefersReducedMotion` is true
- `exit={{ opacity: 0, scale: 0.85 }}` animation
- `onAnimationComplete={() => onEnterComplete?.(number)}` (passes number)
- Exact class names: `select-none text-[clamp(6rem,20vw,10rem)] font-bold leading-none tracking-tight text-text-primary`
- Exact textShadow: `0 0 40px rgba(77, 163, 255, 0.35)`
- Wrap animated version in `<AnimatePresence mode="wait">`

```tsx
// src/components/assessment/CountdownDigit.tsx
"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

type CountdownDigitProps = {
  number: number;
  onEnterComplete?: (n: number) => void;
  prefersReducedMotion?: boolean;
};

export function CountdownDigit({
  number,
  onEnterComplete,
  prefersReducedMotion,
}: CountdownDigitProps) {
  useEffect(() => {
    if (prefersReducedMotion) {
      onEnterComplete?.(number);
    }
  }, [prefersReducedMotion, number, onEnterComplete]);

  if (prefersReducedMotion) {
    return (
      <span
        className="select-none text-[clamp(6rem,20vw,10rem)] font-bold leading-none tracking-tight text-text-primary"
        style={{ textShadow: "0 0 40px rgba(77, 163, 255, 0.35)" }}
      >
        {number}
      </span>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={number}
        initial={{ opacity: 0, scale: 1.3 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onAnimationComplete={() => onEnterComplete?.(number)}
        className="select-none text-[clamp(6rem,20vw,10rem)] font-bold leading-none tracking-tight text-text-primary"
        style={{ textShadow: "0 0 40px rgba(77, 163, 255, 0.35)" }}
      >
        {number}
      </motion.span>
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Update VignetteExperience.tsx to import shared CountdownDigit**

In `VignetteExperience.tsx`:
- Add import: `import { CountdownDigit } from "./CountdownDigit";`
- Delete the inline `CountdownDigit` function (lines 1049-1091)
- The usage at ~line 751 (`<CountdownDigit ... />`) stays the same since the props are identical

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/assessment/__tests__/CountdownDigit.test.tsx`
Expected: PASS

- [ ] **Step 6: Run existing tests to verify no regression**

Run: `npx vitest run`
Expected: All existing passing tests still pass

- [ ] **Step 7: Commit**

```bash
git add src/components/assessment/CountdownDigit.tsx src/components/assessment/__tests__/CountdownDigit.test.tsx src/components/assessment/VignetteExperience.tsx
git commit -m "refactor: extract CountdownDigit to shared component"
```

---

### Task 2: Create unified `CountdownRing` component

**Files:**
- Create: `src/components/assessment/CountdownRing.tsx`
- Create: `src/components/assessment/__tests__/CountdownRing.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// src/components/assessment/__tests__/CountdownRing.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CountdownRing } from "../CountdownRing";

describe("CountdownRing", () => {
  describe("think mode", () => {
    it("renders countdown seconds and Think label", () => {
      render(
        <CountdownRing
          secondsRemaining={15}
          totalSeconds={30}
          mode="think"
        />
      );
      expect(screen.getByText("15")).toBeInTheDocument();
      expect(screen.getByText("Think\u2026")).toBeInTheDocument();
    });

    it("does not render I'm Done button", () => {
      render(
        <CountdownRing
          secondsRemaining={15}
          totalSeconds={30}
          mode="think"
          onStopEarly={() => {}}
        />
      );
      expect(screen.queryByText(/done/i)).not.toBeInTheDocument();
    });
  });

  describe("recording mode", () => {
    it("renders MM:SS time and RECORDING label", () => {
      render(
        <CountdownRing
          secondsRemaining={65}
          totalSeconds={75}
          mode="recording"
        />
      );
      expect(screen.getByText("1:05")).toBeInTheDocument();
      expect(screen.getByText("RECORDING")).toBeInTheDocument();
    });

    it("shows I'm Done button after 5s elapsed", () => {
      render(
        <CountdownRing
          secondsRemaining={20}
          totalSeconds={30}
          mode="recording"
          onStopEarly={() => {}}
        />
      );
      // 30 - 20 = 10s elapsed, > 5s threshold
      expect(screen.getByText(/done/i)).toBeInTheDocument();
    });

    it("hides I'm Done button before 5s elapsed", () => {
      render(
        <CountdownRing
          secondsRemaining={28}
          totalSeconds={30}
          mode="recording"
          onStopEarly={() => {}}
        />
      );
      // 30 - 28 = 2s elapsed, < 5s threshold
      expect(screen.queryByText(/done/i)).not.toBeInTheDocument();
    });

    it("renders custom label when provided", () => {
      render(
        <CountdownRing
          secondsRemaining={30}
          totalSeconds={45}
          mode="recording"
          label="Phase 2"
        />
      );
      expect(screen.getByText("Phase 2")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/assessment/__tests__/CountdownRing.test.tsx`
Expected: FAIL — cannot find module `../CountdownRing`

- [ ] **Step 3: Implement CountdownRing**

```tsx
// src/components/assessment/CountdownRing.tsx
"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";

const MIN_SECONDS_BEFORE_STOP = 5;

type CountdownRingProps = {
  secondsRemaining: number;
  totalSeconds: number;
  mode: "think" | "recording";
  label?: string;
  onStopEarly?: () => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CountdownRing({
  secondsRemaining,
  totalSeconds,
  mode,
  label,
  onStopEarly,
}: CountdownRingProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const circumference = 2 * Math.PI * 54;
  const progress = 1 - secondsRemaining / totalSeconds;
  const offset = circumference * (1 - progress);
  const elapsed = totalSeconds - secondsRemaining;

  const isThink = mode === "think";
  const isDramatic = isThink
    ? secondsRemaining <= 3
    : secondsRemaining <= 5;
  const canStopEarly =
    !isThink && onStopEarly && elapsed >= MIN_SECONDS_BEFORE_STOP;

  const ringColor = isThink ? "text-primary" : "text-red-500";
  const glowFilter = isThink
    ? "drop-shadow(0 0 6px var(--color-primary))"
    : "drop-shadow(0 0 6px rgba(239, 68, 68, 0.6))";

  return (
    <div className="flex w-full flex-col items-center gap-4" aria-live="polite">
      {/* Countdown ring */}
      <div
        className={cn(
          "relative flex items-center justify-center",
          !prefersReducedMotion && "transition-all duration-500",
          isThink && isDramatic && !prefersReducedMotion
            ? "h-40 w-40"
            : "h-32 w-32"
        )}
      >
        {/* Background pulse during dramatic threshold (think mode only) */}
        {isThink && isDramatic && !prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/10"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 120 120"
          aria-hidden="true"
        >
          {/* Background ring */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-border-glass"
          />
          {/* Progress ring */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(
              ringColor,
              "transition-[stroke-dashoffset] duration-1000 ease-linear"
            )}
            style={{ filter: glowFilter }}
          />
        </svg>

        {/* Center content */}
        <div className="flex flex-col items-center gap-0.5">
          {isThink ? (
            /* Think mode: animated countdown + "Think..." */
            <>
              {prefersReducedMotion ? (
                <span
                  className={cn(
                    "font-display font-bold tabular-nums text-text-primary",
                    isDramatic
                      ? "text-[length:var(--text-fluid-4xl)]"
                      : "text-[length:var(--text-fluid-3xl)]"
                  )}
                >
                  {secondsRemaining}
                </span>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.span
                    key={secondsRemaining}
                    initial={{
                      y: 20,
                      opacity: 0,
                      scale: isDramatic ? 0.8 : 1,
                    }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{
                      type: "spring",
                      duration: 0.3,
                      bounce: 0.15,
                    }}
                    className={cn(
                      "font-display font-bold tabular-nums text-text-primary",
                      isDramatic
                        ? "text-[length:var(--text-fluid-4xl)]"
                        : "text-[length:var(--text-fluid-3xl)]"
                    )}
                  >
                    {secondsRemaining}
                  </motion.span>
                </AnimatePresence>
              )}
              <span className="text-xs font-medium uppercase tracking-widest text-text-secondary">
                Think&hellip;
              </span>
            </>
          ) : (
            /* Recording mode: MM:SS + "RECORDING" (or custom label) */
            <>
              <span
                className={cn(
                  "font-display font-bold tabular-nums",
                  "text-[length:var(--text-fluid-xl)]",
                  isDramatic ? "text-red-400" : "text-text-primary"
                )}
                role="timer"
                aria-label={`${secondsRemaining} seconds remaining`}
              >
                {formatTime(secondsRemaining)}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-red-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                {label ?? "RECORDING"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* "I'm Done" button (recording mode only, after 5s) */}
      {canStopEarly && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={onStopEarly}
          className="rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-medium text-text-primary backdrop-blur-sm transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
        >
          I&rsquo;m Done
        </motion.button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/assessment/__tests__/CountdownRing.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/assessment/CountdownRing.tsx src/components/assessment/__tests__/CountdownRing.test.tsx
git commit -m "feat: add unified CountdownRing component"
```

---

### Task 3: Migrate exam flow to `CountdownRing`

**Files:**
- Modify: `src/components/assessment/VignetteExperience.tsx`
- Delete: `src/components/assessment/ProcessingBuffer.tsx`
- Delete: `src/components/assessment/VideoRecorder.tsx`

- [ ] **Step 1: Update VignetteExperience imports**

In `src/components/assessment/VignetteExperience.tsx`:
- Remove: `import { ProcessingBuffer } from "./ProcessingBuffer";`
- Remove: `import { VideoRecorder } from "./VideoRecorder";`
- Add: `import { CountdownRing } from "./CountdownRing";`

- [ ] **Step 2: Replace ProcessingBuffer usages with CountdownRing**

Search for `<ProcessingBuffer` in VignetteExperience.tsx. There are three usages:

**buffer_1 (~line 855):** Simple swap — replace `<ProcessingBuffer>` with `<CountdownRing mode="think">`. Remove the `<p>Recording begins in...</p>` text below it.

**buffer_2 (~line 896) and buffer_3 (~line 940):** These have sub-stage conditional rendering (`transition` / `prompting` / `thinking`). Only replace the `<ProcessingBuffer>` inside the `{buffer2SubStage === "thinking" && ...}` block with `<CountdownRing mode="think">`. Keep the `"transition"` (spinner + "Preparing next prompt...") and `"prompting"` (listen message) sub-stage renders unchanged.

```tsx
{/* buffer_1 — simple swap */}
{state.phase === "buffer_1" && (
  <CountdownRing
    secondsRemaining={buffer1Remaining}
    totalSeconds={BUFFER_1_SECONDS}
    mode="think"
  />
)}

{/* buffer_2 — only replace the thinking sub-stage */}
{state.phase === "buffer_2" && (
  <div className="w-full">
    {buffer2SubStage === "transition" && (/* keep existing spinner */)}
    {buffer2SubStage === "prompting" && (/* keep existing listen message */)}
    {buffer2SubStage === "thinking" && (
      <CountdownRing
        secondsRemaining={buffer2ThinkingRemaining}
        totalSeconds={BUFFER_2_THINKING_SECONDS}
        mode="think"
      />
    )}
  </div>
)}
```

Same pattern for buffer_3.

- [ ] **Step 3: Replace VideoRecorder usages with CountdownRing**

Search for `<VideoRecorder` in VignetteExperience.tsx. There should be three usages (recording_1, recording_2, recording_3). Replace each with:

```tsx
<CountdownRing
  secondsRemaining={recordingSecondsRef.current}
  totalSeconds={RECORDING_1_SECONDS}  // or appropriate constant
  mode="recording"
  label="Phase 1"  // or "Phase 2", "Phase 3"
  onStopEarly={handleStopEarly}
/>
```

Remove the separate "Recording - Phase X" badge that was previously above the VideoRecorder ring (CountdownRing includes "RECORDING" label internally).

- [ ] **Step 4: Delete old components**

```bash
rm src/components/assessment/ProcessingBuffer.tsx
rm src/components/assessment/VideoRecorder.tsx
```

- [ ] **Step 5: Run full test suite to verify no regressions**

Run: `npx vitest run`
Expected: All passing tests still pass. (ProcessingBuffer and VideoRecorder had no tests to break.)

- [ ] **Step 6: Run build to verify no type errors**

Run: `npx next build`
Expected: Build succeeds. Check for any import errors referencing deleted files.

- [ ] **Step 7: Commit**

```bash
git add src/components/assessment/VignetteExperience.tsx
git rm src/components/assessment/ProcessingBuffer.tsx src/components/assessment/VideoRecorder.tsx
git commit -m "refactor: migrate exam flow from ProcessingBuffer/VideoRecorder to CountdownRing"
```

---

### Task 4: Generalize `VignetteNarrator` to accept `visiblePrompts` prop

**Files:**
- Modify: `src/components/assessment/VignetteNarrator.tsx` (lines 19, 31-44, 133-157)
- Modify: `src/components/assessment/VignetteExperience.tsx` (update VignetteNarrator call site)

- [ ] **Step 1: Update VignetteNarrator props**

In `src/components/assessment/VignetteNarrator.tsx`:

Remove the `Phase` import (line 19):
```tsx
// DELETE: import type { Phase } from "@/lib/assessment/vignette-reducer";
```

Update the props type (lines 31-44). Replace the `phase` prop with visibility flags:

```tsx
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
  /** Which prompts are currently visible */
  visiblePrompts: ReadonlySet<1 | 2 | 3>;
  /** Whether phase 1 prompt is currently being revealed word-by-word */
  isPhase1Revealing: boolean;
  /** Whether phase 2 prompt is currently being revealed word-by-word */
  isPhase2Revealing: boolean;
  /** Whether phase 3 prompt is currently being revealed word-by-word */
  isPhase3Revealing: boolean;
  onComplete: () => void;
  audio: AudioNarratorResult;
  audioTiming?: AudioWordTiming[] | null;
};
```

- [ ] **Step 2: Update VignetteNarrator internal logic**

Replace the prompt visibility derivation (lines 66, 131, and 133-157) with the new props. Specifically:

**Line 66 — delete:** `const isActive = phase === "narrating";`
**Replace with:** `const isActive = isNarrating;`

**Line 131 — delete:** `const showAllNarrative = phase !== "narrating";`
**This is now a prop** — use `showAllNarrative` directly from props (already destructured).

**Lines 133-146 — delete the entire block** that derives visibility from `phase`. Replace with:
```tsx
const showPhase1Prompt = visiblePrompts.has(1);
const showPhase2Prompt = visiblePrompts.has(2);
const showPhase3Prompt = visiblePrompts.has(3);
// isPhase1Revealing, isPhase2Revealing, isPhase3Revealing come directly from props
```

**Lines 148-157 — keep the timer-revealing derivations unchanged in structure:**
```tsx
// These remain the same, just using the new variable sources:
const isPrompt1TimerRevealing = !useAudioMode && !prefersReducedMotion
  && showPhase1Prompt && !isActive
  && prompt1RevealedCount < prompt1Words.words.length;
const isPrompt2TimerRevealing = !useAudioMode && !prefersReducedMotion
  && isPhase2Revealing && prompt2Words != null
  && prompt2RevealedCount < prompt2Words.words.length;
const isPrompt3TimerRevealing = !useAudioMode && !prefersReducedMotion
  && isPhase3Revealing && prompt3Words != null
  && prompt3RevealedCount < prompt3Words.words.length;
```

Remove the `buffer2SubStage` and `buffer3SubStage` props from the type definition — the revealing logic is now driven by the `isPhase2Revealing`/`isPhase3Revealing` boolean props.

- [ ] **Step 3: Update VignetteExperience to pass new props**

In `VignetteExperience.tsx`, update the `<VignetteNarrator>` call site. Compute the visibility values from the exam's phase:

```tsx
const examVisiblePrompts = useMemo(() => {
  const set = new Set<1 | 2 | 3>();
  const p = state.phase;
  // Prompt 1 visible from narrating onward
  if (p !== "ready" && p !== "countdown") set.add(1);
  // Prompt 2 visible from buffer_2 onward
  if (p === "buffer_2" || p === "recording_2" || p === "buffer_3" || p === "recording_3") set.add(2);
  // Prompt 3 visible from buffer_3 onward
  if (p === "buffer_3" || p === "recording_3") set.add(3);
  return set;
}, [state.phase]);

<VignetteNarrator
  vignetteText={vignetteText}
  vignettePrompt={vignettePrompt}
  phase2Prompt={phase2Prompt}
  phase3Prompt={phase3Prompt}
  estimatedNarrationSeconds={estimatedNarrationSeconds}
  isNarrating={state.phase === "narrating"}
  showAllNarrative={state.phase !== "narrating"}
  visiblePrompts={examVisiblePrompts}
  isPhase1Revealing={state.phase === "narrating"}
  isPhase2Revealing={state.phase === "buffer_2" && buffer2SubStage === "prompting"}
  isPhase3Revealing={state.phase === "buffer_3" && buffer3SubStage === "prompting"}
  onComplete={handleNarrationComplete}
  audio={audio}
  audioTiming={audioTiming}
/>
```

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 5: Run build**

Run: `npx next build`
Expected: Build succeeds with no type errors

- [ ] **Step 6: Commit**

```bash
git add src/components/assessment/VignetteNarrator.tsx src/components/assessment/VignetteExperience.tsx
git commit -m "refactor: generalize VignetteNarrator to accept visiblePrompts prop"
```

---

### Task 5: Create warmup content and warmup reducer

**Files:**
- Create: `src/lib/assessment/warmup-content.ts`
- Create: `src/lib/assessment/warmup-reducer.ts`
- Create: `src/lib/assessment/__tests__/warmup-reducer.test.ts`

- [ ] **Step 1: Create warmup content**

```tsx
// src/lib/assessment/warmup-content.ts

export const WARMUP_VIGNETTE_TEXT = `Every great company started with someone noticing something others missed. A frustration that everyone else accepted. A gap that nobody thought to fill. The founders who built the companies you use every day weren't born with some special gene for business — they just paid attention differently. They asked "why does it have to be this way?" when everyone else asked "where do I sign up?" Today, you're going to practice thinking like they do. You'll hear a short scenario, then answer three questions about it. There are no wrong answers — we're just interested in how you think.`;

export const WARMUP_PROMPTS = [
  "What's something you've built or created that you're proud of?",
  "If you could start any business tomorrow, what would it be?",
  "What's one thing about you that most people wouldn't guess?",
] as const;

/** Prompt that appears at the end of the vignette narration (matches exam pattern).
 *  Derived from WARMUP_PROMPTS[0] to avoid drift. */
export const WARMUP_VIGNETTE_PROMPT = WARMUP_PROMPTS[0];

/** Estimated narration duration in seconds (for timer fallback mode) */
export const WARMUP_NARRATION_SECONDS = 35;

/** Buffer (think) duration in seconds */
export const WARMUP_BUFFER_SECONDS = 10;

/** Recording duration in seconds */
export const WARMUP_RECORDING_SECONDS = 30;
```

- [ ] **Step 2: Write failing tests for warmup reducer**

```ts
// src/lib/assessment/__tests__/warmup-reducer.test.ts
import { describe, it, expect } from "vitest";
import { warmupReducer, type WarmupState, type WarmupAction } from "../warmup-reducer";

function createState(overrides: Partial<WarmupState> = {}): WarmupState {
  return { phase: "intro_orb", ...overrides };
}

describe("warmupReducer", () => {
  it("transitions from intro_orb to countdown on BEGIN", () => {
    const state = warmupReducer(createState(), { type: "BEGIN" });
    expect(state.phase).toBe("countdown");
  });

  it("transitions from countdown to narrating on COUNTDOWN_COMPLETE", () => {
    const state = warmupReducer(
      createState({ phase: "countdown" }),
      { type: "COUNTDOWN_COMPLETE" }
    );
    expect(state.phase).toBe("narrating");
  });

  it("transitions from narrating to buffer_1 on NARRATION_COMPLETE", () => {
    const state = warmupReducer(
      createState({ phase: "narrating" }),
      { type: "NARRATION_COMPLETE" }
    );
    expect(state.phase).toBe("buffer_1");
  });

  it("transitions through buffer -> recording -> buffer cycle", () => {
    let state = createState({ phase: "buffer_1" });
    state = warmupReducer(state, { type: "BUFFER_1_COMPLETE" });
    expect(state.phase).toBe("recording_1");

    state = warmupReducer(state, { type: "RECORDING_1_COMPLETE" });
    expect(state.phase).toBe("buffer_2");

    state = warmupReducer(state, { type: "BUFFER_2_COMPLETE" });
    expect(state.phase).toBe("recording_2");

    state = warmupReducer(state, { type: "RECORDING_2_COMPLETE" });
    expect(state.phase).toBe("buffer_3");

    state = warmupReducer(state, { type: "BUFFER_3_COMPLETE" });
    expect(state.phase).toBe("recording_3");

    state = warmupReducer(state, { type: "RECORDING_3_COMPLETE" });
    expect(state.phase).toBe("transition_orb");
  });

  it("transitions through post-recording phases", () => {
    let state = createState({ phase: "transition_orb" });
    state = warmupReducer(state, { type: "TRANSITION_COMPLETE" });
    expect(state.phase).toBe("consent");

    state = warmupReducer(state, { type: "CONSENT_ACCEPTED" });
    expect(state.phase).toBe("uploading");

    state = warmupReducer(state, { type: "UPLOAD_COMPLETE" });
    expect(state.phase).toBe("pre_exam_orb");

    state = warmupReducer(state, { type: "PRE_EXAM_COMPLETE" });
    expect(state.phase).toBe("done");
  });

  it("transitions to declined on CONSENT_DECLINED", () => {
    const state = warmupReducer(
      createState({ phase: "consent" }),
      { type: "CONSENT_DECLINED" }
    );
    expect(state.phase).toBe("declined");
  });

  it("supports DEV_SET_PHASE for dev toolbar", () => {
    const state = warmupReducer(
      createState(),
      { type: "DEV_SET_PHASE", phase: "buffer_2" }
    );
    expect(state.phase).toBe("buffer_2");
  });

  it("returns current state for invalid transitions", () => {
    const state = createState({ phase: "intro_orb" });
    const result = warmupReducer(state, { type: "NARRATION_COMPLETE" });
    expect(result).toBe(state);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/assessment/__tests__/warmup-reducer.test.ts`
Expected: FAIL — cannot find module `../warmup-reducer`

- [ ] **Step 4: Implement warmup reducer**

```ts
// src/lib/assessment/warmup-reducer.ts

export type WarmupPhase =
  | "intro_orb"
  | "countdown"
  | "narrating"
  | "buffer_1"
  | "recording_1"
  | "buffer_2"
  | "recording_2"
  | "buffer_3"
  | "recording_3"
  | "transition_orb"
  | "consent"
  | "uploading"
  | "pre_exam_orb"
  | "done"
  | "declined";

export type WarmupAction =
  | { type: "BEGIN" }
  | { type: "COUNTDOWN_COMPLETE" }
  | { type: "NARRATION_COMPLETE" }
  | { type: "BUFFER_1_COMPLETE" }
  | { type: "RECORDING_1_COMPLETE" }
  | { type: "BUFFER_2_COMPLETE" }
  | { type: "RECORDING_2_COMPLETE" }
  | { type: "BUFFER_3_COMPLETE" }
  | { type: "RECORDING_3_COMPLETE" }
  | { type: "TRANSITION_COMPLETE" }
  | { type: "CONSENT_ACCEPTED" }
  | { type: "CONSENT_DECLINED" }
  | { type: "UPLOAD_COMPLETE" }
  | { type: "PRE_EXAM_COMPLETE" }
  | { type: "DEV_SET_PHASE"; phase: WarmupPhase };

export type WarmupState = {
  phase: WarmupPhase;
};

const TRANSITIONS: Partial<Record<WarmupPhase, Partial<Record<WarmupAction["type"], WarmupPhase>>>> = {
  intro_orb: { BEGIN: "countdown" },
  countdown: { COUNTDOWN_COMPLETE: "narrating" },
  narrating: { NARRATION_COMPLETE: "buffer_1" },
  buffer_1: { BUFFER_1_COMPLETE: "recording_1" },
  recording_1: { RECORDING_1_COMPLETE: "buffer_2" },
  buffer_2: { BUFFER_2_COMPLETE: "recording_2" },
  recording_2: { RECORDING_2_COMPLETE: "buffer_3" },
  buffer_3: { BUFFER_3_COMPLETE: "recording_3" },
  recording_3: { RECORDING_3_COMPLETE: "transition_orb" },
  transition_orb: { TRANSITION_COMPLETE: "consent" },
  consent: {
    CONSENT_ACCEPTED: "uploading",
    CONSENT_DECLINED: "declined",
  },
  uploading: { UPLOAD_COMPLETE: "pre_exam_orb" },
  pre_exam_orb: { PRE_EXAM_COMPLETE: "done" },
};

export function warmupReducer(state: WarmupState, action: WarmupAction): WarmupState {
  if (action.type === "DEV_SET_PHASE") {
    if (process.env.NODE_ENV !== "development") return state;
    return { ...state, phase: action.phase };
  }

  const nextPhase = TRANSITIONS[state.phase]?.[action.type];
  if (nextPhase) {
    return { ...state, phase: nextPhase };
  }

  return state;
}

export const INITIAL_WARMUP_STATE: WarmupState = { phase: "intro_orb" };
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/assessment/__tests__/warmup-reducer.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/assessment/warmup-content.ts src/lib/assessment/warmup-reducer.ts src/lib/assessment/__tests__/warmup-reducer.test.ts
git commit -m "feat: add warmup content and state machine reducer"
```

---

### Task 6: Rewrite `WarmupExperience.tsx`

This is the largest task. The existing 801-line component gets rewritten to use the new reducer and shared components.

**Files:**
- Rewrite: `src/components/assessment/WarmupExperience.tsx`

**Key references to read before implementing:**
- `src/components/assessment/VignetteExperience.tsx` — pattern for countdown, narration, buffer/recording phases, audio context, blob management
- `src/lib/assessment/warmup-reducer.ts` — state machine
- `src/lib/assessment/warmup-content.ts` — constants
- `src/components/assessment/VignetteNarrator.tsx` — new props interface

- [ ] **Step 1: Rewrite WarmupExperience.tsx**

**Important:** The old WarmupExperience imports from `"framer-motion"` — the rewrite MUST use `"motion/react"` to match the rest of the codebase (VignetteExperience, CountdownRing, etc.).

The rewritten component should:

1. **Use `useReducer` with `warmupReducer`** instead of multiple `useState` calls for phase management
2. **Phase rendering map:**
   - `intro_orb`: OrbGuide with WARMUP_INTRO_SCRIPT (keep existing scripts from current implementation)
   - `countdown`: 3-2-1 CountdownDigit animation (same pattern as VignetteExperience lines ~735-770)
   - `narrating`: VignetteNarrator with warmup content, timer fallback mode (no audio URL initially). Pass `isNarrating={true}`, `showAllNarrative={false}`, `visiblePrompts`, `isPhase1Revealing={true}`, `isPhase2Revealing={false}`, `isPhase3Revealing={false}`. **Note:** For the warmup, `isPhase2Revealing` and `isPhase3Revealing` are ALWAYS `false` — prompts appear instantly when added to `visiblePrompts`, not word-by-word. This matches the spec's "no sub-stages" design.
   - `buffer_1/2/3`: CountdownRing `mode="think"`, CameraPip, use `setInterval` 1s countdown from `WARMUP_BUFFER_SECONDS`. Dispatch `BUFFER_N_COMPLETE` when timer hits 0.
   - `recording_1/2/3`: CountdownRing `mode="recording"`, CameraPip, use `setInterval` 1s countdown from `WARMUP_RECORDING_SECONDS`. Auto-start recorder at phase entry, stop at timer expiry or "I'm Done". Dispatch `RECORDING_N_COMPLETE`.
   - `transition_orb`: OrbGuide with POST_WARMUP_SCRIPT
   - `consent`: ConsentGate (keep existing)
   - `uploading`: Upload blobs to Supabase Storage (keep existing logic)
   - `pre_exam_orb`: OrbGuide with PRE_EXAM_SCRIPT
   - `done`/`declined`: Router navigation (keep existing)

3. **Compute `visiblePrompts` from phase:**
   ```tsx
   const visiblePrompts = useMemo(() => {
     const set = new Set<1 | 2 | 3>();
     const p = state.phase;
     const phases: WarmupPhase[] = [
       "narrating", "buffer_1", "recording_1",
       "buffer_2", "recording_2", "buffer_3", "recording_3",
     ];
     if (phases.includes(p)) set.add(1);
     if (["buffer_2", "recording_2", "buffer_3", "recording_3"].includes(p)) set.add(2);
     if (["buffer_3", "recording_3"].includes(p)) set.add(3);
     return set;
   }, [state.phase]);
   ```

4. **AudioContext for countdown tone:** Create `audioCtxRef` in the `handleBegin` callback (same pattern as VignetteExperience).

5. **Blob management:** Three refs (`blob1Ref`, `blob2Ref`, `blob3Ref`) for the three recording phases. Use the same `useMediaRecorder` hook as the current implementation.

6. **beforeunload handler:** Keep the existing pattern — add `beforeunload` listener when `recorder.status === "recording"`.

7. **Stream error handling:** Keep `StreamErrorAlert` component (can be moved to a shared file or kept inline).

8. **Screen reader announcements:** Use `aria-live` regions for phase transitions, same as current.

- [ ] **Step 2: Verify the component renders without errors**

Run: `npx next build`
Expected: Build succeeds

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: PASS (some existing warmup tests may need updating — see Task 8)

- [ ] **Step 4: Commit**

```bash
git add src/components/assessment/WarmupExperience.tsx
git commit -m "feat: rewrite WarmupExperience with exam-parity flow"
```

---

### Task 7: Update `WarmupDevToolbar`

**Files:**
- Modify: `src/components/assessment/WarmupDevToolbar.tsx`

- [ ] **Step 1: Update WarmupDevToolbar for new phase model**

The toolbar needs to:
- Import `WarmupPhase` from `warmup-reducer` instead of the old inline `WarmupPhase`
- Update phase labels to include new phases (countdown, narrating, buffer_1, recording_1, etc.)
- Update skip button logic for new phases
- Add skip buttons for new phases: "Skip Narration", "Skip to Recording 1", etc.

Update the phase label map:

```tsx
const PHASE_LABELS: Record<WarmupPhase, string> = {
  intro_orb: "Intro Orb",
  countdown: "Countdown",
  narrating: "Narrating",
  buffer_1: "Buffer 1 (Think)",
  recording_1: "Recording 1",
  buffer_2: "Buffer 2 (Think)",
  recording_2: "Recording 2",
  buffer_3: "Buffer 3 (Think)",
  recording_3: "Recording 3",
  transition_orb: "Transition Orb",
  consent: "Consent",
  uploading: "Uploading",
  pre_exam_orb: "Pre-Exam Orb",
  done: "Done",
  declined: "Declined",
};
```

Update props to accept a dispatch function for `DEV_SET_PHASE` actions instead of individual skip callbacks:

```tsx
type WarmupDevToolbarProps = {
  phase: WarmupPhase;
  onDevSetPhase: (phase: WarmupPhase) => void;
  onSkipToExam: () => void;
};
```

- [ ] **Step 2: Run build to verify**

Run: `npx next build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/assessment/WarmupDevToolbar.tsx
git commit -m "feat: update WarmupDevToolbar for new warmup phase model"
```

---

### Task 8: Update existing tests

**Files:**
- Modify: any existing test files that reference old warmup types or deleted components

- [ ] **Step 1: Search for broken test references**

Run: `npx vitest run 2>&1` and check for failures. Also grep for imports of deleted files:

```bash
grep -r "ProcessingBuffer\|VideoRecorder" src/ --include="*.test.*"
grep -r "WarmupPhase" src/ --include="*.test.*"
```

- [ ] **Step 2: Fix any broken imports or assertions**

Update tests that reference the old `WarmupPhase` type, `ProcessingBuffer`, or `VideoRecorder`.

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Run build**

Run: `npx next build`
Expected: Build succeeds with no errors

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: update tests for warmup-exam parity refactor"
```

---

### Task 9: Manual QA verification

- [ ] **Step 1: Start dev server and walk through warmup flow**

Run: `npm run dev`

Navigate to `http://localhost:3000/assess/warmup` and verify:
1. OrbGuide intro works as before
2. 3-2-1 countdown plays with tones
3. Warmup vignette narrates with teleprompter word reveal (timer fallback mode)
4. Buffer phases show blue CountdownRing with "Think..." label
5. Recording phases show red CountdownRing with "RECORDING" label and MM:SS
6. Prompts reveal progressively (prompt 1 after narration, prompt 2 at buffer_2, prompt 3 at buffer_3)
7. "I'm Done" button appears after 5s of recording
8. Camera PiP visible during buffer/recording phases
9. Transition orb, consent, and pre-exam orb work as before
10. Dev toolbar works with new phase labels and skip buttons

- [ ] **Step 2: Walk through exam flow to verify CountdownRing migration**

Navigate to exam flow and verify:
1. Buffer phases now show blue ring (was gold)
2. Recording phases show red ring with "RECORDING" + MM:SS inside
3. All timing, narration, and recording functionality unchanged
4. "I'm Done" button still works

- [ ] **Step 3: Check responsive layouts**

Test on mobile viewport (375x812) and desktop (1280x720) for both flows.

- [ ] **Step 4: Final commit if any QA fixes needed**

```bash
git add -A
git commit -m "fix: QA fixes for warmup-exam parity"
```
