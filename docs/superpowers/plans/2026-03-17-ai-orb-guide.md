# AI Orb Guide Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI orb guide that briefs users before the assessment and between the PI/CI sections, replacing the verbose overview page with an engaging audio+caption experience.

**Architecture:** A reusable `OrbGuide` client component handles orb visuals, audio playback, and caption sync. It's rendered at two touchpoints: a new `/assess/briefing` route (pre-exam) and inline on the step 3 page (CI transition). A new `briefing_completed_at` column on `assessment_sessions` gates the pre-exam briefing. The overview page is trimmed to a single-screen glance.

**Tech Stack:** Next.js App Router, React 19, Framer Motion, CSS @keyframes, native `<audio>` element, Supabase (DB column addition)

**Spec:** `docs/superpowers/specs/2026-03-17-ai-orb-guide-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/components/assessment/OrbGuide.tsx` | Client component: luminous orb visual, `<audio>` playback, caption sync via `timeupdate`, Skip/Continue/Replay controls |
| `src/components/assessment/OrbGuide.test.tsx` | Unit tests for OrbGuide component |
| `src/lib/assessment/orb-scripts.ts` | Exports `PRE_EXAM_SCRIPT` and `CI_TRANSITION_SCRIPT` constants with `OrbScript` type (audioUrl + captions array). Placeholder timing until audio is produced. |
| `src/lib/assessment/orb-scripts.test.ts` | Validates script structure (non-empty captions, ordered timestamps, non-empty text) |
| `src/app/(assessment)/assess/briefing/page.tsx` | Server page: session gate, renders OrbGuide with pre-exam script |
| `src/app/(assessment)/assess/briefing/briefing-client.tsx` | Client wrapper: Begin button (autoplay gate), OrbGuide, navigation on continue/skip |
| `src/lib/actions/briefing.ts` | Server action: `completeBriefing` — sets `briefing_completed_at` on session |
| `src/app/(assessment)/assess/[step]/StepWithCiBriefing.tsx` | Client wrapper for step 3: shows OrbGuide first, then renders children (VignetteExperience) after dismiss |

### Modified Files
| File | Change |
|------|--------|
| `src/app/(assessment)/assess/overview/overview-content.tsx` | Strip to hero + stats + CTA |
| `src/lib/actions/session.ts:62,173` | Redirect to `/assess/briefing`; resumption routes through briefing if `briefing_completed_at` is null |
| `src/app/(assessment)/assess/[step]/page.tsx:87-116` | When step=3, wrap VignetteExperience in StepWithCiBriefing |
| `src/lib/analytics/events.ts` | Add `briefingCompleted` and `briefingSkipped` event helpers |

---

## Task 1: Database — Add `briefing_completed_at` Column

**Files:**
- Modify: Supabase dashboard (SQL editor)

- [ ] **Step 1: Run migration SQL**

Connect to Supabase SQL editor and run:

```sql
ALTER TABLE assessment_sessions
ADD COLUMN briefing_completed_at timestamptz DEFAULT NULL;
```

- [ ] **Step 2: Verify column exists**

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'assessment_sessions'
  AND column_name = 'briefing_completed_at';
```

Expected: one row with `timestamptz` type, default `NULL`.

- [ ] **Step 3: Commit** (no code change — DB-only migration)

Note: This project does not use generated Supabase types (`database.types.ts` does not exist). The Supabase client is untyped, so the new column works without type regeneration.

---

## Task 2: Orb Script Constants and Types

**Files:**
- Create: `src/lib/assessment/orb-scripts.ts`
- Create: `src/lib/assessment/orb-scripts.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/assessment/orb-scripts.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  PRE_EXAM_SCRIPT,
  CI_TRANSITION_SCRIPT,
  type OrbScript,
} from "./orb-scripts";

function validateScript(script: OrbScript) {
  expect(script.audioUrl).toBeTruthy();
  expect(script.captions.length).toBeGreaterThan(0);

  for (const caption of script.captions) {
    expect(caption.text.trim().length).toBeGreaterThan(0);
    expect(caption.endTime).toBeGreaterThan(caption.startTime);
    expect(caption.startTime).toBeGreaterThanOrEqual(0);
  }

  // Captions should be in chronological order
  for (let i = 1; i < script.captions.length; i++) {
    expect(script.captions[i].startTime).toBeGreaterThanOrEqual(
      script.captions[i - 1].startTime
    );
  }
}

describe("orb scripts", () => {
  it("PRE_EXAM_SCRIPT has valid structure", () => {
    validateScript(PRE_EXAM_SCRIPT);
  });

  it("CI_TRANSITION_SCRIPT has valid structure", () => {
    validateScript(CI_TRANSITION_SCRIPT);
  });

  it("PRE_EXAM_SCRIPT has 6 caption segments", () => {
    expect(PRE_EXAM_SCRIPT.captions).toHaveLength(6);
  });

  it("CI_TRANSITION_SCRIPT has 5 caption segments", () => {
    expect(CI_TRANSITION_SCRIPT.captions).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/assessment/orb-scripts.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

Create `src/lib/assessment/orb-scripts.ts`:

```ts
export type OrbCaption = {
  startTime: number;
  endTime: number;
  text: string;
};

export type OrbScript = {
  audioUrl: string;
  captions: OrbCaption[];
};

/**
 * Pre-exam briefing script (~60-90s).
 * Played after setup, before vignette 1.
 *
 * IMPORTANT: Caption timing is placeholder until audio is produced.
 * After generating the ElevenLabs audio, update startTime/endTime
 * values by listening to the audio and noting segment boundaries.
 */
export const PRE_EXAM_SCRIPT: OrbScript = {
  audioUrl: "/audio/briefing-pre-exam.mp3",
  captions: [
    {
      startTime: 0,
      endTime: 12,
      text: "Hey, welcome! Let me walk you through what\u2019s coming up. You\u2019re about to step into four real business scenarios drawn from the lives of actual entrepreneurs.",
    },
    {
      startTime: 12,
      endTime: 26,
      text: "Each scenario follows the same rhythm: you\u2019ll hear the story narrated to you, then respond in three phases \u2014 understand, analyze, and communicate. You get a thinking window before each one.",
    },
    {
      startTime: 26,
      endTime: 38,
      text: "There are no right answers here. We\u2019re looking at how you think, not what you know. A thoughtful wrong answer beats a lucky right one every time.",
    },
    {
      startTime: 38,
      endTime: 56,
      text: "Your first two scenarios are about practical intelligence \u2014 real problems these entrepreneurs actually faced. Your job is to reason through them like you\u2019re in the room. Ask questions, challenge assumptions, think out loud.",
    },
    {
      startTime: 56,
      endTime: 72,
      text: "Narrate your thinking as it happens. If you\u2019re unsure, say so. If you\u2019d want more info, tell us what and why. The more you externalize your process, the richer your profile.",
    },
    {
      startTime: 72,
      endTime: 78,
      text: "Alright, you\u2019re ready. Let\u2019s go.",
    },
  ],
};

/**
 * CI transition briefing script (~30-45s).
 * Played after vignette 2, before vignette 3.
 *
 * IMPORTANT: Caption timing is placeholder until audio is produced.
 */
export const CI_TRANSITION_SCRIPT: OrbScript = {
  audioUrl: "/audio/briefing-ci-transition.mp3",
  captions: [
    {
      startTime: 0,
      endTime: 5,
      text: "Nice work on those first two. Take a breath.",
    },
    {
      startTime: 5,
      endTime: 16,
      text: "Your next two scenarios are going to feel different. They\u2019re about creative intelligence \u2014 and the mindset is completely different from what you just did.",
    },
    {
      startTime: 16,
      endTime: 28,
      text: "Instead of problems to solve, you\u2019ll hear about real market situations. Your job isn\u2019t to fix anything \u2014 it\u2019s to spot opportunities. Think like an entrepreneur scanning for what\u2019s possible, not what\u2019s broken.",
    },
    {
      startTime: 28,
      endTime: 37,
      text: "Brainstorm freely. Connect dots across industries. The wilder the idea, the better \u2014 as long as you can explain your reasoning.",
    },
    {
      startTime: 37,
      endTime: 43,
      text: "Alright, two more to go. Let\u2019s see how you think when the canvas is blank.",
    },
  ],
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/assessment/orb-scripts.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/assessment/orb-scripts.ts src/lib/assessment/orb-scripts.test.ts
git commit -m "Add orb script constants with placeholder timing"
```

---

## Task 3: OrbGuide Component

**Files:**
- Create: `src/components/assessment/OrbGuide.tsx`
- Create: `src/components/assessment/OrbGuide.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/assessment/OrbGuide.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { OrbGuide } from "./OrbGuide";
import type { OrbScript } from "@/lib/assessment/orb-scripts";

// Mock HTMLMediaElement.play/pause
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(
    () => Promise.resolve()
  );
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  Object.defineProperty(HTMLMediaElement.prototype, "duration", {
    get: () => 10,
    configurable: true,
  });
});

const MOCK_SCRIPT: OrbScript = {
  audioUrl: "/audio/test.mp3",
  captions: [
    { startTime: 0, endTime: 5, text: "First caption" },
    { startTime: 5, endTime: 10, text: "Second caption" },
  ],
};

describe("OrbGuide", () => {
  it("renders the Begin button in idle state", () => {
    render(
      <OrbGuide
        script={MOCK_SCRIPT}
        onContinue={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /begin/i })).toBeInTheDocument();
  });

  it("shows Skip and disabled Continue after clicking Begin", async () => {
    render(
      <OrbGuide
        script={MOCK_SCRIPT}
        onContinue={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /begin/i }));
    });
    expect(screen.getByRole("button", { name: /skip/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("calls onSkip and enables Continue when Skip is clicked", async () => {
    const onSkip = vi.fn();
    render(
      <OrbGuide
        script={MOCK_SCRIPT}
        onContinue={vi.fn()}
        onSkip={onSkip}
      />
    );
    // Start playback first
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /begin/i }));
    });
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(onSkip).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /continue/i })).not.toBeDisabled();
  });

  it("shows all captions as static text when audio fails to load", async () => {
    render(
      <OrbGuide
        script={MOCK_SCRIPT}
        onContinue={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    // Simulate audio error
    const audio = document.querySelector("audio");
    act(() => {
      audio?.dispatchEvent(new Event("error"));
    });
    expect(screen.getByText("First caption")).toBeInTheDocument();
    expect(screen.getByText("Second caption")).toBeInTheDocument();
    // Continue should be enabled on error
    expect(screen.getByRole("button", { name: /continue/i })).not.toBeDisabled();
  });

  it("has aria-live region for captions", () => {
    render(
      <OrbGuide
        script={MOCK_SCRIPT}
        onContinue={vi.fn()}
        onSkip={vi.fn()}
      />
    );
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/assessment/OrbGuide.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the OrbGuide component**

Create `src/components/assessment/OrbGuide.tsx`. This is the core component — here's the full implementation:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { Button } from "@/components/ui/button";
import type { OrbScript } from "@/lib/assessment/orb-scripts";

type OrbGuideProps = {
  script: OrbScript;
  onContinue: () => void;
  onSkip: () => void;
};

type PlaybackState = "idle" | "playing" | "ended" | "error";

export function OrbGuide({ script, onContinue, onSkip }: OrbGuideProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [currentCaptionIndex, setCurrentCaptionIndex] = useState(-1);
  const [skipped, setSkipped] = useState(false);
  const [canContinue, setCanContinue] = useState(false);

  const isSpeaking = playbackState === "playing";

  // Audio timeupdate → find current caption
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    const idx = script.captions.findIndex(
      (c) => t >= c.startTime && t < c.endTime
    );
    if (idx !== -1) setCurrentCaptionIndex(idx);
  }, [script.captions]);

  // Audio ended
  const handleEnded = useCallback(() => {
    setPlaybackState("ended");
    setCanContinue(true);
    // Show last caption
    setCurrentCaptionIndex(script.captions.length - 1);
  }, [script.captions.length]);

  // Audio error — fallback to static captions
  const handleError = useCallback(() => {
    setPlaybackState("error");
    setCanContinue(true);
  }, []);

  // Start playback (called from Begin button or on mount after user interaction)
  const startPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(() => {
      setPlaybackState("playing");
    }).catch(() => {
      // Autoplay blocked or load failure
      setPlaybackState("error");
      setCanContinue(true);
    });
  }, []);

  // Skip
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

  // Replay
  const handleReplay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentCaptionIndex(-1);
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

  // Determine what caption to show
  const showAllCaptions = playbackState === "error";
  const currentCaption =
    currentCaptionIndex >= 0 ? script.captions[currentCaptionIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-base">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/3 h-[60vh] w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(77,163,255,0.08),transparent_70%)] blur-3xl" />
      </div>

      {/* Audio element */}
      <audio
        ref={audioRef}
        src={script.audioUrl}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        aria-label="Assessment briefing narration"
      />

      {/* Orb */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <div
          data-speaking={isSpeaking || undefined}
          className={[
            "h-[120px] w-[120px] rounded-full md:h-[150px] md:w-[150px]",
            "bg-[radial-gradient(circle_at_35%_35%,rgba(77,163,255,0.6),rgba(77,163,255,0.15)_60%,rgba(77,163,255,0.05))]",
            "shadow-[0_0_60px_rgba(77,163,255,0.3),0_0_120px_rgba(77,163,255,0.1)]",
            "relative",
            !prefersReducedMotion && "animate-orb-breathe",
            !prefersReducedMotion && "data-[speaking]:animate-orb-speak",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden="true"
        >
          {/* Inner highlight */}
          <div className="absolute inset-2 rounded-full bg-[radial-gradient(circle_at_40%_35%,rgba(255,255,255,0.15),transparent_60%)]" />
        </div>

        {/* Caption area */}
        <div
          aria-live="polite"
          className="min-h-[4rem] max-w-[500px] text-center"
        >
          {showAllCaptions ? (
            // Error fallback: show all captions as static text
            <div className="flex flex-col gap-3">
              <p className="text-xs text-text-secondary">
                Audio unavailable — read below
              </p>
              {script.captions.map((caption, i) => (
                <p
                  key={i}
                  className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary"
                >
                  {caption.text}
                </p>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {currentCaption && (
                <motion.p
                  key={currentCaptionIndex}
                  initial={
                    prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }
                  }
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                  className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary"
                >
                  {currentCaption.text}
                </motion.p>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex flex-col items-center gap-3 pb-12">
        {playbackState === "idle" && (
          <Button onClick={startPlayback} size="lg">
            Begin
          </Button>
        )}

        {playbackState !== "idle" && (
          <>
            {(playbackState === "ended" || skipped) && !showAllCaptions && (
              <button
                onClick={handleReplay}
                className="text-sm text-text-secondary underline underline-offset-4 transition-colors hover:text-text-primary"
              >
                Replay
              </button>
            )}
            <div className="flex items-center gap-4">
              {!skipped && playbackState === "playing" && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip
                </Button>
              )}
              <Button
                onClick={onContinue}
                disabled={!canContinue}
                size="lg"
              >
                Continue
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add orb keyframe animations to global CSS**

In `src/app/globals.css`, add to the `@theme` block (alongside existing `--animate-fade-in`, `--animate-glow-pulse`, etc.):

```css
--animate-orb-breathe: orb-breathe 4s ease-in-out infinite;
--animate-orb-speak: orb-speak 2s ease-in-out infinite;
```

Then add the `@keyframes` definitions after the existing ones (e.g., after the `glow-pulse` keyframes):

```css
@keyframes orb-breathe {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.03); filter: brightness(1.1); }
}

@keyframes orb-speak {
  0%, 100% { transform: scale(1); filter: brightness(1.05); }
  50% { transform: scale(1.06); filter: brightness(1.2); }
}
```

This follows the existing codebase pattern: register as `--animate-*` theme variables so Tailwind generates `animate-orb-breathe` and `animate-orb-speak` as standard utilities that work with `data-[speaking]:` variants.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/assessment/OrbGuide.test.tsx`
Expected: PASS (all 5 tests)

If tests fail due to missing `@testing-library/jest-dom` matchers (like `toHaveAttribute`), check `vitest.setup.ts` for the import. The existing test suite has some failures related to this — make sure `OrbGuide.test.tsx` imports are self-sufficient.

- [ ] **Step 6: Commit**

```bash
git add src/components/assessment/OrbGuide.tsx src/components/assessment/OrbGuide.test.tsx src/app/globals.css
git commit -m "Add OrbGuide component with audio playback and caption sync"
```

---

## Task 4: Briefing Server Action

**Files:**
- Create: `src/lib/actions/briefing.ts`

- [ ] **Step 1: Create the server action**

Create `src/lib/actions/briefing.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Marks the pre-exam briefing as completed and redirects to step 1.
 * Called when user clicks Continue or Skip on the briefing page.
 */
export async function completeBriefing() {
  const sessionId = await readSessionCookie();
  if (!sessionId) redirect("/assess/setup");

  const supabase = createServiceClient();
  await supabase
    .from("assessment_sessions")
    .update({ briefing_completed_at: new Date().toISOString() })
    .eq("id", sessionId);

  redirect("/assess/1");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/briefing.ts
git commit -m "Add completeBriefing server action"
```

---

## Task 5: Briefing Page Route

**Files:**
- Create: `src/app/(assessment)/assess/briefing/page.tsx`
- Create: `src/app/(assessment)/assess/briefing/briefing-client.tsx`

- [ ] **Step 1: Create the server page with session gating**

Create `src/app/(assessment)/assess/briefing/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/assessment/session-cookie";
import { getSessionById } from "@/lib/queries/session";
import { BriefingClient } from "./briefing-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Assessment Briefing",
};

export default async function BriefingPage() {
  const sessionId = await readSessionCookie();
  if (!sessionId) redirect("/assess/setup");

  const session = await getSessionById(sessionId);
  if (!session) redirect("/assess/setup");

  // Already completed briefing — skip to step 1
  if (session.briefing_completed_at) {
    redirect("/assess/1");
  }

  // Session must be assigned (post-setup, pre-assessment)
  if (session.status !== "assigned") {
    redirect("/assess/1");
  }

  return <BriefingClient />;
}
```

- [ ] **Step 2: Create the client wrapper**

Create `src/app/(assessment)/assess/briefing/briefing-client.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { OrbGuide } from "@/components/assessment/OrbGuide";
import { PRE_EXAM_SCRIPT } from "@/lib/assessment/orb-scripts";
import { completeBriefing } from "@/lib/actions/briefing";

export function BriefingClient() {
  const [isPending, startTransition] = useTransition();

  const handleContinue = () => {
    startTransition(async () => {
      await completeBriefing();
    });
  };

  const handleSkip = () => {
    // Analytics differentiation happens here if needed.
    // Skip just enables Continue — the user still clicks Continue to navigate.
  };

  return (
    <OrbGuide
      script={PRE_EXAM_SCRIPT}
      onContinue={handleContinue}
      onSkip={handleSkip}
    />
  );
}
```

- [ ] **Step 3: Verify page renders in dev**

Run: `npm run dev`
Navigate to `/assess/briefing` (you'll need an active session cookie — create one via the setup flow or use the dev toolbar).
Expected: Orb appears, Begin button is shown. Clicking Begin plays audio (or shows error fallback if no MP3 exists yet).

- [ ] **Step 4: Commit**

```bash
git add src/app/\(assessment\)/assess/briefing/
git commit -m "Add briefing page with session gate and OrbGuide"
```

---

## Task 6: Update Session Action — Redirect to Briefing

**Files:**
- Modify: `src/lib/actions/session.ts:62,173`

- [ ] **Step 1: Update new session redirect**

In `src/lib/actions/session.ts`, change line 173:

```ts
// Before:
redirect("/assess/1");

// After:
redirect("/assess/briefing");
```

- [ ] **Step 2: Update session resumption logic**

In `src/lib/actions/session.ts`, update the resumption block (around lines 57-63). Currently:

```ts
const completedSteps = await getCompletedSteps(existingSessionId, existing);
const nextStep = findNextIncomplete(completedSteps) ?? 1;
redirect(`/assess/${nextStep}?resume=true`);
```

Replace with:

```ts
const completedSteps = await getCompletedSteps(existingSessionId, existing);
const nextStep = findNextIncomplete(completedSteps) ?? 1;

// If no steps completed and briefing not yet seen, route through briefing
if (
  completedSteps.size === 0 &&
  !existing.briefing_completed_at
) {
  redirect("/assess/briefing");
}

redirect(`/assess/${nextStep}?resume=true`);
```

- [ ] **Step 3: Verify the full flow**

Run: `npm run dev`
1. Go to `/assess/overview` → Continue to Setup → Complete consent + equipment
2. Should redirect to `/assess/briefing` (not `/assess/1`)
3. Click Begin → listen (or skip) → Continue
4. Should land on `/assess/1`

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/session.ts
git commit -m "Route new and resumed sessions through briefing page"
```

---

## Task 7: CI Transition Briefing on Step 3

**Files:**
- Create: `src/app/(assessment)/assess/[step]/StepWithCiBriefing.tsx`
- Modify: `src/app/(assessment)/assess/[step]/page.tsx`

- [ ] **Step 1: Create the CI briefing gate wrapper**

Create `src/app/(assessment)/assess/[step]/StepWithCiBriefing.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { OrbGuide } from "@/components/assessment/OrbGuide";
import { CI_TRANSITION_SCRIPT } from "@/lib/assessment/orb-scripts";

const SESSION_STORAGE_KEY = "ci_briefing_seen";

export function StepWithCiBriefing({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read sessionStorage after mount to avoid hydration mismatch
  const [briefingSeen, setBriefingSeen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem(SESSION_STORAGE_KEY) === "true";
    setBriefingSeen(seen);
    setMounted(true);
  }, []);

  const handleContinue = useCallback(() => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
    setBriefingSeen(true);
  }, []);

  const handleSkip = useCallback(() => {
    // Skip just enables Continue — analytics wired in Task 9
  }, []);

  // Show nothing until mounted to avoid hydration mismatch
  if (!mounted) return null;

  if (!briefingSeen) {
    return (
      <OrbGuide
        script={CI_TRANSITION_SCRIPT}
        onContinue={handleContinue}
        onSkip={handleSkip}
      />
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Wrap step 3 in the gate**

In `src/app/(assessment)/assess/[step]/page.tsx`, add the import at the top:

```ts
import { StepWithCiBriefing } from "./StepWithCiBriefing";
```

Then wrap the return when `step === 3`. Change the final return block (around line 100-116) from:

```tsx
return (
  <VignetteExperience ... />
);
```

To:

```tsx
const vignetteElement = (
  <VignetteExperience
    step={step}
    totalSteps={TOTAL_STEPS}
    sessionId={sessionId}
    vignetteId={vignette.id}
    vignetteType={vignette.vignette_type}
    vignetteText={vignette.vignette_text}
    vignettePrompt={vignette.vignette_prompt}
    phase2Prompt={vignette.phase_2_prompt}
    phase3Prompt={vignette.phase_3_prompt}
    servedAt={servedAt}
    audioUrl={audioUrl}
    audioTiming={vignette.audio_timing}
    estimatedNarrationSeconds={vignette.estimated_narration_seconds}
  />
);

if (step === 3) {
  return <StepWithCiBriefing>{vignetteElement}</StepWithCiBriefing>;
}

return vignetteElement;
```

**Spec deviation note:** The spec says `vignette_served_at` should be recorded only after the briefing is dismissed. However, the step page is a server component that fetches vignette data and records `vignette_served_at` unconditionally before any client code runs. Deferring this would require splitting the server component or adding a separate server action, which adds significant complexity for minimal benefit. The CI briefing gate is a client-side delay only — the vignette data is fetched but not shown until the briefing is dismissed. The `vignette_served_at` timestamp will be ~30-45s earlier than the actual vignette display, but this does not affect scoring (scoring is based on response timing, not serve timing). This is an acceptable tradeoff.

- [ ] **Step 3: Verify in dev**

Run: `npm run dev`
Complete vignettes 1-2, then navigate to step 3.
Expected: CI briefing orb appears first. After continue, VignetteExperience loads.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(assessment\)/assess/\[step\]/StepWithCiBriefing.tsx src/app/\(assessment\)/assess/\[step\]/page.tsx
git commit -m "Add CI transition briefing gate on step 3"
```

---

## Task 8: Trim Overview Page

**Files:**
- Modify: `src/app/(assessment)/assess/overview/overview-content.tsx`

- [ ] **Step 1: Replace overview content**

Rewrite `src/app/(assessment)/assess/overview/overview-content.tsx` to keep only the hero, stats, and CTA. Strip out the phases array, tips array, all the section components, and the ScrollReveal imports.

The new version should be a single-screen page with:
- Centered layout, vertically centered content
- Eyebrow: "Builders Quotient Assessment"
- Title: "What to Expect"
- Subtitle: One sentence — "You're about to step into real business scenarios drawn from the lives of actual entrepreneurs — no textbooks, no multiple choice."
- Stats line: "~20 min · 4 scenarios · Camera required"
- CTA: "Continue to Setup" button
- Sub-CTA note: "Camera & microphone required"

Keep the ambient background effects (radial gradients, dot grid). Remove all ScrollReveal usage since there's nothing to scroll. Keep the Framer Motion entrance animation on the centered block.

Reference the current hero section (lines 148-214) as the pattern — the new page is essentially just this section with the stats inlined.

- [ ] **Step 2: Verify in dev**

Run: `npm run dev`
Navigate to `/assess/overview`.
Expected: Single-screen page, no scrolling, hero + stats + CTA only.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(assessment\)/assess/overview/overview-content.tsx
git commit -m "Trim overview page to hero, stats, and CTA"
```

---

## Task 9: Analytics Events

**Files:**
- Modify: `src/lib/analytics/events.ts`

- [ ] **Step 1: Add briefing analytics events**

Add to `src/lib/analytics/events.ts`:

```ts
export function briefingCompleted(sessionId: string, briefingType: "pre_exam" | "ci_transition") {
  capture("briefing_completed", { sessionId, briefingType });
}

export function briefingSkipped(sessionId: string, briefingType: "pre_exam" | "ci_transition") {
  capture("briefing_skipped", { sessionId, briefingType });
}
```

- [ ] **Step 2: Wire analytics into briefing client**

Update `src/app/(assessment)/assess/briefing/briefing-client.tsx`:
- Add a `skippedRef = useRef(false)` to track whether skip was pressed
- In `handleSkip`: set `skippedRef.current = true` and call `analytics.briefingSkipped(sessionId, "pre_exam")`
- In `handleContinue`: only call `analytics.briefingCompleted(sessionId, "pre_exam")` if `!skippedRef.current`
- Pass `sessionId` as a prop from the server page

Update `src/app/(assessment)/assess/[step]/StepWithCiBriefing.tsx` similarly:
- Add `sessionId` prop, use same skip tracking pattern with `"ci_transition"` as the briefing type

- [ ] **Step 3: Commit**

```bash
git add src/lib/analytics/events.ts src/app/\(assessment\)/assess/briefing/briefing-client.tsx src/app/\(assessment\)/assess/\[step\]/StepWithCiBriefing.tsx
git commit -m "Add briefing analytics events"
```

---

## Task 10: Audio Production (Manual)

This task happens outside of code. No test or commit needed.

- [ ] **Step 1: Select ElevenLabs voice**

Browse ElevenLabs voice library. Look for a warm, friendly, natural-sounding voice. Male or female — match the vibe of "friendly professor." Test with a sample sentence from the script.

- [ ] **Step 2: Generate pre-exam briefing audio**

Paste the full pre-exam script text into ElevenLabs. Generate MP3. Download and save as `public/audio/briefing-pre-exam.mp3`.

- [ ] **Step 3: Generate CI transition audio**

Paste the CI transition script text. Generate MP3. Save as `public/audio/briefing-ci-transition.mp3`.

- [ ] **Step 4: Author caption timing**

Listen to each audio file. Note the start/end time (in seconds) for each caption segment. Update the timing values in `src/lib/assessment/orb-scripts.ts` to match the actual audio.

- [ ] **Step 5: Re-run tests and verify**

Run: `npx vitest run src/lib/assessment/orb-scripts.test.ts`
Expected: PASS with updated timing values.

Then test the full flow in dev to confirm captions sync with audio.

- [ ] **Step 6: Commit audio files and updated timing**

```bash
git add public/audio/ src/lib/assessment/orb-scripts.ts
git commit -m "Add briefing audio files and finalize caption timing"
```

---

## Task 11: Build Verification

- [ ] **Step 1: Run full test suite**

Run: `npm run test:run`
Expected: All new tests pass. Pre-existing failures (ResumeBanner, CooldownBanner, MobileWarningDialog) are unrelated.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Clean build with no errors.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No new lint errors.

- [ ] **Step 4: End-to-end flow verification**

Manual walkthrough of the complete flow:
1. `/assess/overview` — trimmed single-screen page
2. `/assess/setup` — consent + equipment (unchanged)
3. `/assess/briefing` — orb plays pre-exam briefing, Begin → play → Continue
4. `/assess/1` → `/assess/2` — PI vignettes (unchanged)
5. `/assess/3` — CI briefing orb appears first, then vignette 3
6. `/assess/4` → `/assess/complete` — remainder unchanged
