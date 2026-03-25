# Changelog

All notable changes to the Builders Quotient frontend will be documented in this file.

## [0.2.5.2] - 2026-03-25

### Fixed
- Added `'unsafe-eval'` to CSP `script-src` in development mode only — eliminates React dev-mode eval() warning without weakening production CSP
- Added missing `sizes` prop to all `<Image fill>` components in splash screens — improves image optimization and eliminates Next.js warning

## [0.2.5.1] - 2026-03-25

### Fixed
- Fixed white flash on WebGL orb during loading and screen transitions — canvas now renders its first frame before entering the DOM, with transparent CSS fallback

## [0.2.5.0] - 2026-03-24

### For contributors
- Codebase is now fully lint-clean for React 19 — all 28 compiler warnings resolved across 20 files
- Removed dead code and unused variables for a cleaner, more maintainable codebase
- Cleaned up tracked `.gstack/` files (benchmark reports now fully gitignored)

## [0.2.4.5] - 2026-03-24

### Fixed
- Added PostHog asset domain (`https://*.i.posthog.com`) to CSP `script-src` — analytics scripts were blocked after v0.2.4.4 CSP hardening

## [0.2.4.4] - 2026-03-24

### Fixed
- Tighter Content Security Policy: removed `unsafe-eval` from script-src to harden XSS protections
- Review auth cookie now expires after 24 hours (was session-only, persisted indefinitely)
- Updated Next.js 16.1.6 → 16.2.1 to patch SSRF vulnerability (GHSA-qpjv-v59x-3qc4)
- Added rollup >=4.59.0 override to patch path traversal vulnerability (GHSA-mw96-cpmx-2vgc)

### For contributors
- Added missing `IP_HASH_SALT` and `REVIEW_PASSWORD` to `.env.example`

## [0.2.4.3] - 2026-03-24

### Added
- Students who skip the personality quiz can now complete it later via an email link (`/assess/resume?token=`) — restores their session and picks up where they left off

## [0.2.4.2] - 2026-03-24

### Fixed
- Orb no longer shifts vertically when subtitle text changes line count or when Begin is tapped on mobile
- Subtitle text expands downward within a fixed 3-line reservation instead of pushing the orb up
- Controls area uses fixed min-height (`min-h-44`) to prevent layout shift between idle and playing states
- Removed double horizontal padding on subtitle container for better text fit on narrow screens
- Orb positioned slightly higher on mobile (`-translate-y-6`) to accommodate subtitle space below

## [0.2.4.1] - 2026-03-24

### Changed
- Narrative text box expands to full height on mobile instead of internal scroll, eliminating double-scrollbar UX
- Floating timer pill positioned below progress bar on mobile (`top-[42px]`) to avoid overlap
- Floating timer "Done" button uses scale animation instead of width animation to prevent jerky loading

## [0.2.4.0] - 2026-03-24

### Added
- Cinematic floating subtitles below the WebGL orb during audio narration transitions
- Sentence-level subtitle cue groups with crossfade transitions synced to audio playback
- Word-level timing data for all 4 orb scripts (warmup intro, post-warmup, pre-exam, CI transition) extracted via OpenAI Whisper API
- `OrbSubtitles` component with `AnimatePresence` crossfade and linger effect
- `ActiveWord` component extracted from `VignetteNarrator` for shared per-character reveal animation
- `cue-groups` module: reconciles Whisper word timings with punctuated caption text, splits into sentence-level subtitle groups with orphan merging
- `extract-orb-timings.mjs` one-time script for extracting word timestamps from existing MP3 files
- 14 tests covering cue group reconciliation, sentence breaking, hyphenated words, and edge cases
- 5 new unit tests for `paragraphIndex` assignment in `calculateWordTiming`: single paragraph, double-newline split, multi-paragraph indices, triple+ newlines, and sentence tracking across paragraphs
- Visual test page at `/test/narration` for verifying paragraph rendering with dummy vignette text

### Changed
- Timer-mode narration renders paragraphs as flowing prose within `<p>` elements instead of one `<p>` per sentence, matching how text appears in Supabase (no artificial line breaks between sentences)
- Paragraph spacing in ScrollableTextBox increased from `space-y-3` (12px) to `space-y-4` (16px) for clearer visual separation
- Pre-exam caption punctuation: em dash replaced with semicolon for "think out loud; narrate your reasoning"
- Pre-exam caption: "real-world" split to "real world" for Whisper alignment compatibility

## [0.2.3.0] - 2026-03-23

### Changed
- Prompts 2 and 3 now fade-transition in place instead of stacking below prompt 1 and the narrative, keeping the timer and recording controls visible without scrolling
- Warmup experience uses the same fade-transition prompt reveal as the exam vignettes
- "I'm Done" button minimum recording time increased from 5s to 10s to match server schema validation
- Reduced vertical padding between timer and prompt card for tighter mobile layout

### Added
- Paragraph break support in vignette narratives via `\n\n` in database text
- `splitIntoParagraphs()` and `getParagraphBreakWordIndices()` utility functions for paragraph-aware text processing
- `paragraphIndex` field on `WordTiming` type for tracking paragraph boundaries during word-by-word reveal
- 16 new tests covering paragraph splitting, break index calculation, and cross-paragraph word timing
- Visual paragraph spacing in both audio mode and timer fallback mode of the teleprompter
- Floating timer badge appears in top-right corner when the inline countdown timer scrolls out of view (IntersectionObserver + createPortal)
- Floating badge includes mini countdown ring, time display, REC indicator, and compact "Done" button
- Audio stall watchdog (15s timeout) prevents deadlock if TTS audio buffers indefinitely during prompt narration
- Null prompt guard in VignetteExperience dispatches error state if follow-up prompts are missing
- Design spec for the fade-transition prompt reveal (`docs/superpowers/specs/`)
- 3 new CountdownRing tests covering floating badge visibility and Done button rendering

### Fixed
- Full-text flash before prompt word reveal starts (prompt text no longer visible until reveal begins)
- Narrative text stays visible during prompt transitions (only prompt cards fade, not the vignette narrative)

## [0.2.2.0] - 2026-03-23

### Changed
- Results page strengths and growth areas now show exactly 2 practical + 2 creative intelligence categories for balanced domain representation
- Reasoning Highlights slide picks top 2 from each domain instead of top 4 overall
- Intelligence Narrative slide displays up to 4 cards per column (was 3)
- "Done Thinking" button now appears during think/buffer phases in warmup and vignette flows (was recording-only)
- Phase 2 and 3 recording windows extended from 45s to 75s to match phase 1
- PI and CI radar charts now always render exactly 12 categories at fixed 30° intervals, regardless of how many categories the scoring pipeline detected
- Same category always appears at the same angular position across different students' charts
- Missing categories are interpolated from nearest scored neighbors (circular walk, averaged)

### Added
- Canonical 12-category arrays for PI and CI in `scoring-categories.ts`
- `interpolateFromNeighbors()` pure function with wrap-around neighbor interpolation
- 12 unit tests covering interpolation edge cases (consecutive missing, wrap-around, single/zero scored, category name consistency)

## [0.2.1.0] - 2026-03-19

### Changed
- Students no longer see a "Setting up your assessment" loading screen — the flow moves straight from consent to the pre-exam orb
- Session creation happens silently in the background during the orb narration

### Removed
- `uploading` phase from warmup state machine (14 phases, down from 15)
- `UPLOAD_COMPLETE` and `UPLOAD_RETRY` reducer actions

## [0.2.0.0] - 2026-03-19

### Added
- Warmup flow rewritten with exam-parity state machine (15-phase `warmupReducer` mirroring vignette-reducer)
- AI-narrated warmup vignette with ElevenLabs TTS and word-level timing for teleprompter reveal
- Unified `CountdownRing` component shared between warmup and exam flows (think mode + recording mode)
- Shared `CountdownDigit` component extracted from VignetteExperience
- 3-2-1 countdown with audio tones before warmup narration begins
- Progressive prompt reveal: prompt 1 via narration, prompts 2-3 as static text in buffer phases
- `WarmupDevToolbar` with phase-granular skip buttons for all 15 warmup phases
- Warmup vignette audio generation script (`scripts/generate-warmup-audio.mjs`)
- New test coverage for warmup-reducer, CountdownDigit, and CountdownRing

### Changed
- Migrated exam VignetteExperience from ProcessingBuffer/VideoRecorder to unified CountdownRing
- Generalized VignetteNarrator to accept `visiblePrompts` prop (decoupled from vignette-reducer Phase type)
- ConsentGate now supports `embedded` mode, custom eyebrow/heading/buttonText, and decline link
- Improved touch targets on "I'm Done" button (44px) and decline button (44px mobile)
- Added `text-wrap: balance` to consent heading

### Removed
- `ProcessingBuffer` component (replaced by CountdownRing think mode)
- `VideoRecorder` component (replaced by CountdownRing recording mode)
- Old single-phase warmup recording flow (replaced by 3-question exam-parity flow)
