# Warmup-Exam Flow Parity Design

**Date:** 2026-03-19
**Status:** Approved
**Goal:** Make the warmup flow mirror the real exam experience so students get a true rehearsal, and unify timer components across both flows.

## Problem

The warmup and exam flows currently look and feel very different:

- **Warmup:** OrbGuide intro -> standalone questions with inline think/record timers -> no vignette narration
- **Exam:** 3-2-1 countdown -> narrated vignette (audio + teleprompter) -> buffer/think -> record x3 with progressive prompt reveal

This disconnect means the warmup doesn't prepare students for what the real exam actually feels like. Additionally, timer components are duplicated: the warmup has inline `ThinkCountdown`/`RecordCountdown`, while the exam has `ProcessingBuffer` (gold ring) and `VideoRecorder` (red ring).

## Design

### 1. Unified `CountdownRing` Component

**File:** `src/components/assessment/CountdownRing.tsx` (new)
**Replaces:** `ProcessingBuffer.tsx`, `VideoRecorder.tsx`, warmup's inline `ThinkCountdown`/`RecordCountdown`

**Props:**

```ts
type CountdownRingProps = {
  secondsRemaining: number;
  totalSeconds: number;
  mode: "think" | "recording";
  label?: string;             // optional override text
  onStopEarly?: () => void;   // shows "I'm Done" after 5s (recording mode only)
};
```

**Visual behavior:**

| Aspect | Think mode | Recording mode |
|--------|-----------|----------------|
| Ring color | Blue (`--color-primary`) with glow | Red (`#ef4444`) with glow |
| Center text (top) | Countdown seconds | MM:SS formatted time |
| Center text (bottom) | "Think..." | "RECORDING" |
| Number animation | Spring transition (AnimatePresence) | Static tabular-nums |
| Dramatic threshold | <= 3s: background pulse, larger text | <= 5s: red text color shift |
| "I'm Done" button | N/A | Appears after 5s elapsed |

- Ring starts full and depletes clockwise (same math as current components)
- SVG viewBox 0 0 120 120, radius 54, strokeWidth 4
- Respects `prefers-reduced-motion` (disables pulse, spring, uses static numbers)
- Background ring uses `text-border-glass` (consistent with current)

### 2. Warmup Vignette Content

**Storage:** Hardcoded constant in `src/lib/assessment/warmup-content.ts` (not from Supabase)

**Vignette narrative (~30-45 seconds):** A short inspirational piece about the builder mindset. Not a real entrepreneur interview, but something that sets the tone and leads into the 3 practice prompts. Example direction: "Every great company started with someone noticing something others missed..." Warm, exciting, gets students in the right headspace.

**3 practice prompts (revealed progressively):**
1. "What's something you've built or created that you're proud of?"
2. "If you could start any business tomorrow, what would it be?"
3. "What's one thing about you that most people wouldn't guess?"

**Audio:** TTS audio file + word-level timing JSON, matching the format used by real vignettes (`audioTiming` array). Initially can be generated via the same TTS pipeline or hardcoded with manual timing. Stored as a static asset (not Supabase Storage).

**Narration:** Uses the existing `VignetteNarrator` component with audio mode for word-by-word reveal. `VignetteNarrator` currently imports the exam's `Phase` type and uses it for prompt visibility logic. To share it with the warmup, generalize it to accept a `visiblePrompts: Set<1 | 2 | 3>` prop (or similar) instead of deriving visibility from the phase name directly. The warmup and exam orchestrators each compute which prompts are visible based on their own phase, then pass that to the narrator. This avoids coupling the narrator to either reducer's phase type.

### 3. Warmup State Machine

**File:** `src/lib/assessment/warmup-reducer.ts` (new, modeled on `vignette-reducer.ts`)

**Phase sequence:**

```
intro_orb          # OrbGuide explains the assessment (existing)
  |
countdown          # 3-2-1 animated digits + tone (reuse CountdownDigit)
  |
narrating          # Warmup vignette: audio + teleprompter word reveal
  |                # Prompt 1 revealed at end of narration section
buffer_1 (10s)     # CountdownRing think mode. Camera PiP visible.
  |                # No sub-stages — prompts appear instantly (simpler than exam).
recording_1 (30s)  # CountdownRing recording mode. "I'm Done" after 5s.
  |
buffer_2 (10s)     # Prompt 2 appears instantly at start. CountdownRing think mode.
  |                # No transition/prompting/thinking sub-stages (exam has these
  |                # for word-by-word prompt reveal; warmup uses instant reveal).
recording_2 (30s)  # CountdownRing recording mode.
  |
buffer_3 (10s)     # Prompt 3 appears instantly at start. CountdownRing think mode.
  |
recording_3 (30s)  # CountdownRing recording mode.
  |
transition_orb     # Post-warmup OrbGuide (existing)
  |
consent            # Review & consent gate (existing)
  |
uploading          # Background upload of warmup blobs (existing)
  |
pre_exam_orb       # Final reminders before vignette 1 (existing)
  |
done / declined
```

**Prompt visibility (progressive reveal, same as exam):**
- Prompt 1: visible from `narrating` through `recording_3`
- Prompt 2: visible from `buffer_2` through `recording_3`
- Prompt 3: visible only during `buffer_3` and `recording_3`

**Durations:**
- Buffer/think: 10 seconds (all phases)
- Recording: 30 seconds (all phases)
- Total active warmup: ~30-45s narration + 3 x (10s + 30s) = ~2.5-3 min

**Data flow:** Warmup recordings stored client-side in blobs (same as today), uploaded during the `uploading` phase. No Supabase vignette fetching needed.

### 4. Exam Migration

**File changes:** `src/components/assessment/VignetteExperience.tsx`

**Swap components:**
- `<ProcessingBuffer />` -> `<CountdownRing mode="think" />`
- `<VideoRecorder />` -> `<CountdownRing mode="recording" />`

**Visual changes to exam:**
- Buffer/think phases: blue ring (was gold/secondary)
- Recording phases: red ring with "RECORDING" + MM:SS inside (was red ring with "Recording - Phase X" badge above ring)

**Additional exam text changes:**
- Buffer/think phases: secondary text below ring changes from "Recording begins in N seconds" to just the countdown seconds inside the ring with "Think..." label (matching warmup)
- Recording phases: "Recording - Phase X" badge above ring is removed; phase label moves into CountdownRing's `label` prop (shown as "RECORDING - Phase X" inside the ring below MM:SS)

**NOT changing:**
- `vignette-reducer.ts` state machine
- Prompt reveal logic
- Upload flow and Supabase interactions
- Session management
- All timing constants

**Requires generalization (not a rewrite):**
- `VignetteNarrator` — decouple from exam `Phase` type, accept `visiblePrompts` prop instead
- `CountdownDigit` — extract from inline function in VignetteExperience.tsx to shared component

### 5. `WarmupExperience.tsx` Rewrite

The existing 801-line `WarmupExperience.tsx` gets rewritten to use:
- The new `warmup-reducer.ts` state machine
- `CountdownRing` for all timer UI
- `VignetteNarrator` for the warmup vignette narration
- `CountdownDigit` for the 3-2-1 countdown
- `CameraPip` for camera preview during buffer/recording phases
- `OrbGuide` for intro/transition/pre-exam phases (existing)
- `ConsentGate` for consent (existing)

The component becomes a thin orchestrator dispatching actions to the reducer and rendering the appropriate UI for each phase.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `src/components/assessment/CountdownRing.tsx` | Create | Unified timer ring component |
| `src/components/assessment/CountdownDigit.tsx` | Create | Extract from VignetteExperience.tsx inline function to shared component |
| `src/lib/assessment/warmup-content.ts` | Create | Hardcoded warmup vignette text, prompts, audio timing |
| `src/lib/assessment/warmup-reducer.ts` | Create | Warmup state machine (mirrors vignette-reducer pattern) |
| `src/components/assessment/WarmupExperience.tsx` | Rewrite | Use new reducer + shared components |
| `src/components/assessment/WarmupDevToolbar.tsx` | Modify | Update for new phase model (new phases like countdown, narrating, buffer_1, etc.) |
| `src/components/assessment/VignetteExperience.tsx` | Modify | Swap ProcessingBuffer/VideoRecorder for CountdownRing; use extracted CountdownDigit |
| `src/components/assessment/VignetteNarrator.tsx` | Modify | Generalize: accept `visiblePrompts` prop instead of importing exam Phase type |
| `src/components/assessment/ProcessingBuffer.tsx` | Delete | Replaced by CountdownRing |
| `src/components/assessment/VideoRecorder.tsx` | Delete | Replaced by CountdownRing |
| `public/audio/warmup-vignette.*` | Create | TTS audio file for warmup narration (deferred — timer fallback first) |

## Audio Asset Strategy

The warmup vignette needs a TTS audio file and word-level timing data. Options for initial implementation:
1. **Timer fallback mode:** `VignetteNarrator` already supports a timer-based fallback when no audio is available (distributes `estimatedNarrationSeconds` across words). Start with this — no audio file needed initially.
2. **Generate via pipeline:** Use the same TTS pipeline from `triarchic-databank` to generate the audio + timing.
3. **Manual recording:** Record and manually create timing data.

**Recommendation:** Start with timer fallback mode (option 1) to unblock development. Generate the real TTS audio as a follow-up task.

## Edge Cases & Error Handling

- **Audio load failure during warmup narration:** VignetteNarrator already handles this via `useAudioNarrator` hook — falls back to timer mode silently. Warmup uses the same hook and fallback behavior. No special handling needed.
- **Camera/mic stream loss during warmup recording:** Preserve the current `StreamErrorAlert` behavior (retry + "Return to Equipment Check" link). The rewritten warmup should keep this pattern from the existing implementation.
- **`beforeunload` warning:** Preserve the existing guard during recording phases to prevent accidental navigation.
- **AudioContext for countdown tone:** The 3-2-1 countdown uses Web Audio API (`playCountdownTone` from `countdown-tone.ts`). WarmupExperience must create an `AudioContext` ref, same as VignetteExperience does.

## Duration Changes (Intentional)

The current warmup uses variable durations per prompt (10s/30s, 15s/45s, 10s/30s). The new design standardizes all three to 10s buffer + 30s record. This is intentional — the warmup is a quick rehearsal of the flow, not a full-length practice.

## Testing

- Existing warmup tests will need updating for the new state machine
- CountdownRing should have unit tests for mode switching, dramatic thresholds, reduced motion
- Exam flow regression: verify VignetteExperience works identically with CountdownRing swap
- Manual QA: walk through both warmup and exam to confirm visual parity
