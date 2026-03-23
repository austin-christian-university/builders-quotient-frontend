# Changelog

All notable changes to the Builders Quotient frontend will be documented in this file.

## [0.2.2.0] - 2026-03-23

### Changed
- Results page strengths and growth areas now show exactly 2 practical + 2 creative intelligence categories for balanced domain representation
- Reasoning Highlights slide picks top 2 from each domain instead of top 4 overall
- Intelligence Narrative slide displays up to 4 cards per column (was 3)
- "Done Thinking" button now appears during think/buffer phases in warmup and vignette flows (was recording-only)
- Phase 2 and 3 recording windows extended from 45s to 75s to match phase 1

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
