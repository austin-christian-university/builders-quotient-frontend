# Student Thank-You Page Redesign

## Problem

The current post-submission flow for prospective students is dishonest and unfocused:

1. A fake splash sequence ("Analyzing your intelligence profile...") implies real-time processing that isn't happening — scoring runs as a batch cron job
2. The transition from "we're processing" to "take this personality test" is jarring
3. The personality CTA lacks clear incentives for why to do it *now*

## Design

Replace the current student thank-you variant with a two-phase flow: a brief honest splash, then a thank-you page with a compact confirmation block and a prominent personality CTA.

### Phase 1: Brief Honest Splash (~3 seconds)

Replace the current three-step splash:

```
"Securing your responses..."
"Analyzing your intelligence profile..."
"Preparing your personalized results..."
```

With a single honest step:

```
"Submitting your responses..."
```

Same `SplashSequence` component, same brain icon, same animation mechanics. Just one step instead of three — fast and truthful.

### Phase 2: Thank-You Page Content

Three sections, staggered fade-in animation:

#### Section A: Confirmation (compact, settled)

- Gold checkmark icon in circle (existing style)
- Eyebrow: `ASSESSMENT COMPLETE`
- Heading: **You're All Set**
- Body: "Your intelligence responses have been submitted. Our algorithms will process your results and deliver your personalized Builders Quotient profile via email and text within the next 24 hours."

Visually compact — not a huge hero. Settles the user quickly so the eye moves down.

#### Section B: Personality CTA (the star)

A large glassmorphic card (rounded-3xl, glass border, backdrop blur, glow on hover). Visual centerpiece of the page.

- Brain/sparkles icon
- Eyebrow: `GO DEEPER`
- Heading: **Your Entrepreneur Personality Profile**
- Body: "Beyond intelligence, the most successful entrepreneurs share a unique blend of personality traits — grit, risk tolerance, innovativeness, and more. Our personality profile measures 9 key dimensions that define great founders."
- Carrots (emphasized): "Complete it now and you'll **see your personality scores instantly**. Plus, if you finish before we process your intelligence results overnight, we'll **include personality matching in your full BQ score**."
- Primary button: **Start Personality Profile**
- Subtext: "Takes about 5 minutes"
- Ghost link: **Skip for now** (no action, just scrolls past — cards below are always visible)

#### Section C: Explore Cards (secondary, below the fold)

Keep existing ACU explore cards (Discover ACU, Explore Curriculum) but pushed down below the personality CTA. Always visible, not gated behind "skip." Provides a soft landing for users who aren't ready for personality.

#### Footer

"Back to Home" ghost button (same as current).

## Files to Modify

1. **`src/app/(assessment)/assess/thank-you/thank-you-content.tsx`** — Main changes. Rewrite `StudentVariant` component with the new two-section layout. Update `intelligenceLoadingSteps` to a single honest step.
2. **`src/components/assessment/SplashSequence.tsx`** — No changes needed; it already supports variable step counts.

## What Stays the Same

- `GeneralVariant` and `DefaultVariant` — unchanged
- `SplashSequence` component — reused as-is
- `CooldownBanner` — still rendered
- Page-level server component (`page.tsx`) — unchanged
- Animation utilities (fadeUp, stagger, transition) — reused

## Scope Boundary

This design covers only the student thank-you page content and copy. It does not cover:

- The personality quiz itself
- Instant personality scoring display
- Changes to the general/default variants
- Backend changes to BQ score composition
