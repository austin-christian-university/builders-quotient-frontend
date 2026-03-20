# Changelog

All notable changes to the Builders Quotient frontend will be documented in this file.

## [0.2.1.0] - 2026-03-19

### Changed
- Removed "Setting up your assessment" loading screen between consent and pre-exam orb
- Session creation now runs in background during pre-exam orb narration (awaited before navigation)

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
