# AI Orb Guide — Design Spec

## Problem

The assessment entrance is too abrupt. The current overview page presents all exam details as a long text wall that users likely skim or skip. The transition between practical intelligence (PI) and creative intelligence (CI) sections has no guidance, even though the two require fundamentally different mindsets.

## Solution

A talking AI orb — a luminous floating sphere with a warm mentor voice — delivers exam briefings at two key moments. Pre-recorded TTS audio plays while sentence-by-sentence captions sync below the orb. This replaces the dense text with an engaging, human-feeling introduction. The current overview page is trimmed to a minimal glance screen.

## Touchpoints

### Touchpoint 1: Pre-Exam Briefing

- **When**: After setup (consent + equipment check), before vignette 1
- **Route**: `/assess/briefing`
- **Duration**: ~60–90 seconds
- **Blocking**: Full-screen, must listen or explicitly skip. Continue button disabled until audio completes or Skip is pressed. Replay option available after audio finishes.
- **Gate**: Server-side — requires active session with status `assigned` (post-setup). Redirects to setup if no session, or to step 1 if briefing already completed.
- **Completion tracking**: On continue/skip, a server action sets `briefing_completed_at` timestamp on the `assessment_sessions` row, then redirects to `/assess/1`. Session resumption logic checks: if no steps completed and `briefing_completed_at` is null, redirect to `/assess/briefing`; if `briefing_completed_at` is set but no steps completed, redirect to `/assess/1`.
- **Metadata**: `{ title: "Assessment Briefing" }`

**Script content (warm mentor tone):**

1. **Welcome + big picture**: "Hey, welcome! Let me walk you through what's coming up. You're about to step into four real business scenarios drawn from the lives of actual entrepreneurs."
2. **Format overview**: "Each scenario follows the same rhythm: you'll hear the story narrated to you, then respond in three phases — understand, analyze, and communicate. You get a thinking window before each one."
3. **Scoring philosophy**: "There are no right answers here. We're looking at how you think, not what you know. A thoughtful wrong answer beats a lucky right one every time."
4. **PI-specific prep**: "Your first two scenarios are about practical intelligence — real problems these entrepreneurs actually faced. Your job is to reason through them like you're in the room. Ask questions, challenge assumptions, think out loud."
5. **Tips**: "Narrate your thinking as it happens. If you're unsure, say so. If you'd want more info, tell us what and why. The more you externalize your process, the richer your profile."
6. **Handoff**: "Alright, you're ready. Let's go."

### Touchpoint 2: CI Transition Briefing

- **When**: After vignette 2 completes, before vignette 3 begins
- **Route**: None — renders inline on the `/assess/3` page before the vignette loads
- **Duration**: ~30–45 seconds
- **Blocking**: Same interaction model — must listen or skip, replay available
- **Gate**: Client-side wrapper component with `sessionStorage` flag (`ci_briefing_seen`). If flag absent, render OrbGuide first. On continue/skip, set the flag and swap to VignetteExperience. The server-side `vignette_served_at` timestamp is recorded only after the briefing is dismissed (the step page defers vignette data fetching to after the gate clears). On page refresh, `sessionStorage` persists within the tab — if lost (new tab), user sees the briefing again, which is acceptable since it's only ~30s.

**Script content:**

1. **Acknowledgment**: "Nice work on those first two. Take a breath."
2. **The shift**: "Your next two scenarios are going to feel different. They're about creative intelligence — and the mindset is completely different from what you just did."
3. **What's different**: "Instead of problems to solve, you'll hear about real market situations. Your job isn't to fix anything — it's to spot opportunities. Think like an entrepreneur scanning for what's possible, not what's broken."
4. **Reframe**: "Brainstorm freely. Connect dots across industries. The wilder the idea, the better — as long as you can explain your reasoning."
5. **Handoff**: "Alright, two more to go. Let's see how you think when the canvas is blank."

## OrbGuide Component

### Visual Design

- **Full-screen dark overlay** with ambient radial gradients matching BQ aesthetic (`#0a0a0c` base)
- **Luminous orb**: Center-screen, ~120–150px diameter. Built with `radial-gradient` for the sphere body, inner highlight for depth, `box-shadow` for glow aura. Color: electric blue (`#4da3ff`) base with white inner highlights.
- **Idle animation**: Gentle breathing pulse — subtle scale oscillation (1.0 → 1.03) and glow intensity variation. CSS `@keyframes`, ~4s cycle.
- **Speaking animation**: More active pulse — slightly larger scale range (1.0 → 1.06), brighter glow. Toggled via `data-speaking` attribute on the orb element when audio is playing.
- **Respects `prefers-reduced-motion`**: Static glow, no orb animation, no caption fade transitions (instant display).

### Caption Area

- Below the orb, centered, max-width ~500px
- Displays the current caption sentence, fading in as each segment's `startTime` is reached
- Sentence-by-sentence (not word-by-word — distinct from vignette teleprompter)
- Text style: `text-text-primary`, body size, `leading-relaxed`
- Caption container uses `aria-live="polite"` for screen reader announcements

### Controls

- **Bottom of screen**, centered, pill-style buttons
- **Skip** (ghost button): Always visible. Ends audio, enables Continue immediately. Does not navigate — user still clicks Continue. The parent can distinguish skip vs. full-listen for analytics via the callback.
- **Continue** (primary pill): Disabled (dimmed) while audio plays. Enables when audio ends or Skip is pressed. Fires `onContinue` callback.
- **Replay** (text link): Appears after audio completes, above/beside Continue. Restarts audio from beginning, re-disables Continue.

### Props

```ts
type OrbScript = {
  audioUrl: string
  captions: { startTime: number; endTime: number; text: string }[]
}

type OrbGuideProps = {
  script: OrbScript
  onContinue: () => void
  onSkip: () => void
}
```

### Audio

- Pre-recorded MP3 files generated via ElevenLabs
- Warm mentor voice — to be selected during implementation
- Two files: one for pre-exam briefing (~60–90s), one for CI transition (~30–45s)
- Storage: Static files in `public/audio/` — these are fixed assets, not user content, so no need for Supabase Storage or signed URLs. The `audioUrl` in `OrbScript` is a simple static path (e.g., `/audio/briefing-pre-exam.mp3`).
- Playback via native `<audio>` element, `timeupdate` event drives caption sync
- Caption timing arrays are hardcoded constants co-authored with the audio files

## Overview Page Changes

**Current** (6 scrollable sections): Hero → Three Phases → Scoring Philosophy → Tips → At a Glance → CTA

**New** (single screen, no scroll):
- **Hero**: Keep title "What to Expect", shorten subtitle to one sentence
- **At a Glance**: "~20 min · 4 scenarios · Camera required"
- **CTA**: "Continue to Setup" button

**Remove**: Three Phases cards, Scoring Philosophy section, Tips cards. All of this content is now delivered by the orb.

## Updated Assessment Flow

```
/assess/overview     → Trimmed: hero + stats + CTA
/assess/setup        → Consent + equipment check (unchanged)
/assess/briefing     → NEW: OrbGuide pre-exam briefing
/assess/1            → PI vignette 1
/assess/2            → PI vignette 2
                     → NEW: OrbGuide CI transition (inline on step 3 page)
/assess/3            → CI vignette 3
/assess/4            → CI vignette 4
/assess/complete     → Email capture (unchanged)
```

## New Files

| File | Purpose |
|------|---------|
| `src/components/assessment/OrbGuide.tsx` | Reusable client component: orb visual, audio playback, caption sync, controls |
| `src/app/(assessment)/assess/briefing/page.tsx` | Server page: session gate + renders OrbGuide with pre-exam script |
| `src/lib/assessment/orb-scripts.ts` | Script constants: `PRE_EXAM_SCRIPT` and `CI_TRANSITION_SCRIPT` (audioUrl + captions array) |

## Modified Files

| File | Change |
|------|--------|
| `src/app/(assessment)/assess/overview/overview-content.tsx` | Trim to hero + stats + CTA |
| `src/app/(assessment)/assess/[step]/page.tsx` | When step=3, render CI briefing gate wrapper before vignette |
| `src/lib/actions/session.ts` | Redirect to `/assess/briefing` instead of `/assess/1` on session creation; update resumption logic to route through briefing if `briefing_completed_at` is null |

## Database Changes

One new column on `assessment_sessions`:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `briefing_completed_at` | `timestamptz` | `null` | Tracks whether the pre-exam briefing has been seen. Set by a server action when the user continues/skips the briefing. |

## Error Handling

**Audio fails to load** (network error, 404): Show all captions as static text (full script visible), enable the Continue button immediately, and display a subtle "Audio unavailable" indicator near the orb. The briefing still functions as a readable screen.

**Browser autoplay blocked**: The briefing page has a "Begin" button before audio starts (similar to the vignette "Begin Scenario" button), ensuring user interaction precedes playback. This satisfies autoplay policies.

**No audio output on device**: Captions serve as the primary content channel. Audio is enhancement, not the sole delivery mechanism.

## Audio Production Workflow

1. Finalize script text (in this spec)
2. Select ElevenLabs voice during implementation
3. Generate two MP3 files from finalized scripts
4. Manually author caption timing arrays by listening to audio and noting segment timestamps
5. Store audio files and hardcode timing constants
