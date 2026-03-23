# Replace Prompts with Fade Transition

**Date:** 2026-03-23
**Status:** Draft

## Problem

During the intelligence assessment, prompts 2 and 3 stack below prompt 1 and the narrative text. By the time prompt 3 appears, the timer and recording controls are pushed far down the page, making them hard to see. The accumulated text is also no longer useful — students don't need to re-read the narrative or earlier prompts while responding to the current one.

## Solution

Replace the stacking model with a single content slot. When a new prompt arrives, the previous content fades out and the new prompt fades in. Only one piece of content is visible at a time, with no way to look back.

## State Model

Replace `visiblePrompts: ReadonlySet<1 | 2 | 3>` with a single `activeContent` value:

```typescript
type ActiveContent = "narrative" | "prompt2" | "prompt3"
```

**Mapping to phases:**

| Phase | `activeContent` | What's displayed |
|-------|----------------|------------------|
| `narrating` → `buffer_1` → `recording_1` | `"narrative"` | Full narrative text + prompt 1 (word-by-word reveal during narration, then static) |
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

**Scroll:** When new content fades in, scroll the content container to the top.

**Reduced motion:** When `prefers-reduced-motion` is active, skip the fade and do an instant swap (no duration).

## Audio Timing — No Changes

The audio seek-to-boundary fires when the substage switches from "transition" to "prompting." This is the same 2-second delay as today. The fade animation is purely visual, happening during time that currently shows a spinner and "Preparing next prompt…" text.

No changes to:
- `use-audio-narrator.ts` (audio playback + word sync)
- `narration-timer.ts` (word timing utilities)
- `vignette-reducer.ts` (phase state machine)

## Component Changes

### VignetteExperience.tsx (orchestrator)
- Replace `visiblePrompts` set with `activeContent` state
- Set `activeContent = "prompt2"` at start of buffer_2's transition substage
- Set `activeContent = "prompt3"` at start of buffer_3's transition substage
- Remove `showPrompt1/2/3` visibility booleans
- Pass `activeContent` to VignetteNarrator instead of `visiblePrompts`

### VignetteNarrator.tsx (display)
- Wrap content area in `<AnimatePresence mode="wait">`
- Use `activeContent` as the `key` on the `<motion.div>` wrapper
- When `"narrative"`: render narrative text + prompt 1 (same as today's full narration view)
- When `"prompt2"`: render only prompt 2 section (label + text)
- When `"prompt3"`: render only prompt 3 section (label + text)
- Word-by-word reveal logic for prompts 2/3 stays identical — runs inside the faded-in container

### No changes needed
- `CountdownRing.tsx` — sits below the content slot, unaffected
- `vignette-reducer.ts` — phase state machine unchanged
- `use-audio-narrator.ts` — audio seek and word reveal decoupled from display
- `narration-timer.ts` — timing utilities unchanged

## Files Touched

| File | Change |
|------|--------|
| `src/components/assessment/VignetteExperience.tsx` | Replace `visiblePrompts` with `activeContent`, remove prompt visibility booleans |
| `src/components/assessment/VignetteNarrator.tsx` | AnimatePresence wrapper, conditional rendering by `activeContent`, fade animation |
