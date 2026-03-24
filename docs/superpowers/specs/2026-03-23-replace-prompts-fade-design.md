# Replace Prompts with Fade Transition

**Date:** 2026-03-23
**Status:** Shipped (v0.2.3.0)

## Problem

During the intelligence assessment, prompts 2 and 3 stack below prompt 1 and the narrative text. By the time prompt 3 appears, earlier prompts and the narrative are stacked above it, pushing the timer and recording controls far down the page. The student only needs the current prompt while recording.

## Solution

Replace the stacking model with a single content slot. When a new prompt arrives, the previous content fades out and the new prompt fades in. Only one piece of content is visible at a time, with no way to look back.

## Scope

This change applies to both the intelligence assessment flow (`VignetteExperience`) and the warmup flow (`WarmupExperience`). Both now use the `activeContent` prop on `VignetteNarrator` for single-slot fade-transition prompt display. The warmup was updated to use the same pattern for visual consistency, replacing the earlier `visiblePrompts` approach with `activeContent` and buffer sub-stages (transition/prompting/thinking) mirroring the exam flow.

## State Model

In `VignetteExperience.tsx`, replace the `examVisiblePrompts` memo (which builds a `ReadonlySet<1 | 2 | 3>`) with a single `activeContent` value:

```typescript
type ActiveContent = "narrative" | "prompt2" | "prompt3"
```

**Mapping to phases:**

| Phase | `activeContent` | What's displayed |
|-------|----------------|------------------|
| `narrating` → `buffer_1` → `recording_1` | `"narrative"` | Full narrative text + prompt 1 (prompt 1 appears progressively as narration reaches it, same as today) |
| `buffer_2` (transition substage) | `"prompt2"` | Fade out narrative+prompt1, fade in prompt 2 |
| `buffer_2` (prompting/thinking) → `recording_2` | `"prompt2"` | Prompt 2 (word-by-word reveal during prompting, then static) |
| `buffer_3` (transition substage) | `"prompt3"` | Fade out prompt 2, fade in prompt 3 |
| `buffer_3` (prompting/thinking) → `recording_3` | `"prompt3"` | Prompt 3 (word-by-word reveal during prompting, then static) |

Prompt 1 is part of the narration audio stream, so narrative + prompt 1 are treated as one continuous content block under `"narrative"`.

## Animation

Framer Motion `AnimatePresence` with `mode="wait"` wraps the content slot. The `activeContent` value is used as the `key` on the motion wrapper.

**Fade specs:**
- Exit: opacity 1 → 0, ~600ms, expo-out easing (`cubic-bezier(0.16, 1, 0.3, 1)`)
- Hold: ~200ms empty gap for breathing room
- Enter: opacity 0 → 1, ~600ms, expo-out easing
- Total: ~1400ms of the 2000ms transition substage

The remaining ~600ms before the "prompting" substage starts means the new prompt text is visible briefly before audio begins — a natural "read ahead" moment.

**Scroll:** When `activeContent` changes, reset the scroll container to the top via a dedicated `useEffect`, separate from the existing word-tracking auto-scroll.

**Reduced motion:** When `prefers-reduced-motion` is active, skip the fade and do an instant swap (no duration).

## Audio Timing — No Changes

The audio seek-to-boundary fires when the substage switches from "transition" to "prompting." This is the same 2-second delay as today. The fade animation is purely visual, happening during time that currently shows a spinner and "Preparing next prompt…" text.

No changes to:
- `use-audio-narrator.ts` (audio playback + word sync)
- `narration-timer.ts` (word timing utilities)
- `vignette-reducer.ts` (phase state machine)

## Component Changes

### VignetteExperience.tsx (orchestrator)
- Replace the `examVisiblePrompts` memo with an `activeContent` state variable
- Set `activeContent = "prompt2"` at start of buffer_2's transition substage
- Set `activeContent = "prompt3"` at start of buffer_3's transition substage
- Pass `activeContent` to VignetteNarrator instead of `visiblePrompts`

### VignetteNarrator.tsx (display)
- Accept both `visiblePrompts` (legacy, unused since both callers now use `activeContent`) and `activeContent` (new) props. When `activeContent` is provided, it takes precedence. The `visiblePrompts` prop is dead code and can be removed in a future cleanup.
- Wrap content area in `<AnimatePresence mode="wait">`
- Use `activeContent` as the `key` on the `<motion.div>` wrapper
- When `"narrative"`: render narrative text + prompt 1 (same as today's full narration view)
- When `"prompt2"`: render only prompt 2 section (label + text)
- When `"prompt3"`: render only prompt 3 section (label + text)
- `isPhase1Revealing`, `isPhase2Revealing`, `isPhase3Revealing` props remain unchanged — they control word-by-word reveal within whichever content block is active
- Both the audio rendering path and the timer-fallback rendering path need the same structural change (AnimatePresence wrapper keyed on `activeContent`)
- Remove the `showPhase1Prompt`, `showPhase2Prompt`, `showPhase3Prompt` derived booleans (local to VignetteNarrator) when `activeContent` is provided, since visibility is now driven by the single `activeContent` value

### No changes needed
- `CountdownRing.tsx` — sits below the content slot; independently gained a floating timer badge (IntersectionObserver + createPortal) and "I'm Done" minimum increased to 10s
- `vignette-reducer.ts` — phase state machine unchanged
- `use-audio-narrator.ts` — audio seek and word reveal decoupled from display
- `narration-timer.ts` — timing utilities unchanged

## Files Touched

| File | Change |
|------|--------|
| `src/components/assessment/VignetteExperience.tsx` | Replace `examVisiblePrompts` memo with `activeContent` state, pass to VignetteNarrator |
| `src/components/assessment/VignetteNarrator.tsx` | Accept `activeContent` prop, AnimatePresence wrapper, conditional rendering by active content, fade animation, scroll-to-top on change. Both audio and timer-fallback paths updated. |
| `src/components/assessment/WarmupExperience.tsx` | Replace `warmupVisiblePrompts` memo with `activeContent` state, add buffer sub-stages (transition/prompting/thinking) mirroring exam flow, pass `activeContent` to VignetteNarrator |
| `src/components/assessment/CountdownRing.tsx` | Add FloatingTimerBadge (IntersectionObserver + createPortal), increase MIN_SECONDS_BEFORE_STOP from 5 to 10, add audio stall watchdog (15s) |
