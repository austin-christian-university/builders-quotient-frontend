# Builders Quotient — Master Roadmap

> The authoritative reference for what we're building, how it works, and the order we build it.

---

## 1. Product Vision

Builders Quotient (BQ) is a psychometric assessment tool for Austin Christian University that measures entrepreneurial intelligence and personality. It ships as two products from one codebase:

### Product A: Public BQ Assessment (Lead Generation)

A standalone, premium-feeling assessment at **bq.austinchristianu.org** where anyone can measure their entrepreneurial thinking. No account needed. Four video-recorded vignette responses (2 practical intelligence, 2 creative intelligence), scored against a corpus of 274 real entrepreneurs. Email-gated results delivered within 24 hours. Designed to drive organic sharing and funnel prospects into ACU programs.

### Product B: Applicant Assessment (Admissions)

The full admissions entrance exam. Includes everything in Product A plus:
- Entrepreneur personality profile (9 dimensions, ~121 Likert items)
- Standardized test score submission (ACT, SAT, etc.)
- Tied to an authenticated applicant identity (auth method TBD)

**Build order**: Product A first, standalone. Product B extends it.

---

## 2. Architecture

```
User Browser ──HTTPS──▶ Next.js 16 on Vercel (bq.austinchristianu.org)
                              │
                              ├── Server Components/Actions
                              │   └── SUPABASE_SERVICE_ROLE_KEY (never reaches client)
                              │
                              ├── Presigned upload URLs for video
                              │   └── Supabase Storage (or S3/R2 at scale)
                              │
                              ▼
                         Supabase (shared: triarchic-databank)
                              ▲
                              │
                    Python Pipeline (GitHub Actions cron)
                    ├── Speech-to-text (Whisper/Gemini) on video responses
                    ├── PI/CI move detection + scoring
                    └── Results email via Resend
```

**Core principles:**
- Supabase is the shared state layer between frontend and Python pipeline
- **No client-side Supabase access.** No anon key shipped. All DB access through Server Components/Actions using the service role key.
- Video files stored in Supabase Storage, referenced by path in the database
- Batch scoring (not real-time) keeps costs predictable and avoids LLM bottlenecks

---

## 3. The Video Response System

This is the defining UX of BQ. Responses are recorded via webcam video, not typed text.

### 3.1 Vignette Delivery: AI-Narrated Reveal

Each vignette is presented as an **AI-narrated experience**:

1. **Camera check** (before first vignette only): Permission prompt, preview of self, confirmation that camera/mic work. Hard block if camera is denied — video is mandatory.
2. **Narration phase** (~90–120s depending on vignette length): A pre-generated TTS voice reads the scenario aloud. Text appears on screen synchronized with the narration (teleprompter-style progressive reveal). The vignette cannot be skipped or replayed.
3. **Processing buffer** (30 seconds): Full vignette text remains visible. Countdown timer shows "Recording begins in 30s." User collects their thoughts.
4. **Recording phase** (3 minutes): Camera records automatically. Timer visible. User delivers their response. They can stop early but cannot restart. Vignette text remains visible during recording.
5. **Upload + transition**: Video uploads (progress indicator). On success, advance to next vignette. No going back.

### 3.2 Pre-Generated TTS Audio

Vignette audio is pre-generated (OpenAI TTS or ElevenLabs) and stored alongside the vignette in Supabase Storage. This ensures:
- Consistent, premium voice quality
- No client-side TTS variability
- Audio can be cached/preloaded for the next vignette during the current one
- Timing metadata (word timestamps) enables the synchronized text reveal

Each vignette record gets: `audio_url` (Storage path) and `audio_timing` (JSON word-level timestamps for text sync).

### 3.3 Video Storage & Processing

- **Format**: WebM (VP9 + Opus) via MediaRecorder API. Most browsers support this natively.
- **Quality**: 720p target. Bitrate ~1.5 Mbps. 3 min ≈ 30–35 MB per response.
- **Upload**: Server Action generates a presigned Supabase Storage URL. Client uploads directly. Server Action confirms upload and creates the `student_response` record.
- **Storage path**: `responses/{session_id}/{vignette_type}_{step}.webm`
- **Pipeline processing**: Python batch job runs Whisper/Gemini STT on each video, then feeds transcript into existing PI/CI scoring pipeline. Video preserved for future computer vision analysis.

### 3.4 Cost Modeling (Video)

| Component | Per response | Per session (4 responses) | 1000 sessions/day |
|---|---|---|---|
| Storage (30 MB × 4) | ~120 MB | ~120 MB | ~120 GB/day |
| STT (Whisper API, 3 min) | ~$0.018 | ~$0.072 | ~$72/day |
| LLM scoring (Gemini Flash) | ~$0.0005 | ~$0.002 | ~$2/day |
| TTS (pre-generated, amortized) | negligible | negligible | negligible |

Storage is the main cost driver. Plan for lifecycle policies (auto-delete raw video after scoring + archival period, keep transcripts permanently).

---

## 4. Anti-Cheating Architecture

### 4.1 Vignette Exposure Control

Once a vignette is revealed to an identity, it is **burned** for that identity forever.

- **`vignette_exposures` table**: Records every vignette shown to every session, with IP hash and browser fingerprint.
- **Assignment logic**: When creating a session, query exposures for this IP hash + fingerprint. Exclude previously seen vignettes from the assignment pool.
- **Progressive reveal**: The AI narration means the full text isn't in the DOM until narration completes — no view-source shortcut.
- **No replay**: Once narration finishes, the audio cannot be replayed. The text stays visible only through the recording phase, then is gone.

### 4.2 Timing Enforcement

All timing is enforced server-side:

- **`vignette_served_at`**: Timestamp recorded when the Server Component renders the vignette page.
- **`recording_started_at`**: Client sends this when recording begins (validated against served_at + expected narration duration + 30s buffer).
- **`response_submitted_at`**: Must be within 3 minutes of recording_started_at.
- **Responses outside the expected window are flagged**, not silently rejected (allows for network latency grace period).

### 4.3 Identity Tracking

| Signal | Purpose |
|---|---|
| IP hash (SHA-256, never stored raw) | Primary identity for rate limiting and exposure tracking |
| Browser fingerprint (canvas + WebGL + UA + screen) | Secondary signal, paired with IP for stronger identity |
| Session cookie (signed JWT, HttpOnly) | Prevents session hijacking, scoped to `/assess` path |

### 4.4 Rate Limits

| Layer | Limit |
|---|---|
| Session creation per identity | 1 per 30 days (IP hash + fingerprint) |
| Response submission per session | Exactly 4 (one per assigned vignette) |
| Camera permission denial | Block assessment start entirely |
| Narration skip attempt | Not possible (no skip control) |
| Tab visibility change during recording | Flag for review (don't block) |

### 4.5 Vignette Pool Constraint

Currently: 2 PI + 2 CI vignettes. This means:
- **Every session sees all vignettes.** Anti-cheating via exposure burning effectively caps each identity at 1 attempt.
- As the pipeline generates more vignettes (target: 8+ PI, 8+ CI), the system can assign random subsets and allow repeat assessments months apart with fresh vignettes.
- The system should be designed for pool expansion from day one, even though launch operates with the minimum pool.

---

## 5. Assessment Flow — Public BQ (Product A)

```
Landing Page (/)
  "How Do You Think Like an Entrepreneur?"
  Premium dark UI, animated hero, social proof
  [Take the Assessment] CTA
        │
        ▼
Camera Check (/assess/setup)
  • Request camera + mic permissions
  • Show preview of user's webcam feed
  • Confirm hardware works
  • If denied → hard block with explanation
  • [I'm Ready] button
        │
        ▼
Session Init (Server Action)
  • Rate-limit check (1 per 30 days per identity)
  • Create applicant record (email=null)
  • Assign 2 PI + 2 CI vignettes from active pool (excluding burned vignettes)
  • Record vignette exposures
  • Create assessment_session (status='assigned')
  • Capture UTM params, IP hash, fingerprint
  • Set encrypted HttpOnly session cookie (2hr TTL)
  • Redirect to /assess/1
        │
        ▼
Vignette 1: PI-1 (/assess/1)
  • AI narration + synchronized text reveal
  • 30s processing buffer
  • 3 min video recording
  • Upload → Server Action writes student_response
  • Redirect to /assess/2
        │
        ▼
Vignette 2: PI-2 (/assess/2)
  [Same pattern]
        │
        ▼
Vignette 3: CI-1 (/assess/3)
  [Same pattern]
        │
        ▼
Vignette 4: CI-2 (/assess/4)
  [Same pattern]
        │
        ▼
Email Capture (/assess/complete)
  • "Your responses are being analyzed by our AI."
  • "Enter your email to receive your Builders Quotient profile."
  • Email (required) + First Name (optional)
  • Server Action updates applicant, sets session status='completed'
  • Clear session cookie
  • Redirect to /assess/thank-you
        │
        ▼
Thank You (/assess/thank-you)
  • "Your personalized Builders Quotient profile is being prepared."
  • "Results will be emailed within 24 hours."
  • Bookmarkable results link: /results/{token}
  • CTA to learn about ACU programs
        │
        ▼
[Batch Scoring — Python cron every 6 hours]
  • STT: Transcribe video responses via Whisper/Gemini
  • Move detection: Run PI/CI scorers on transcripts
  • Score against entrepreneur baseline distributions
  • Write scoring results + headline percentiles
  • Email results via Resend with link to results page
        │
        ▼
Results Page (/results/{token})
  • Overall BQ percentile (0–100)
  • PI breakdown: 5 category bars (Diagnosing, Reasoning, Action, People, Meta)
  • CI breakdown: 5 category bars (Observing, Reframing, Articulating, Evaluating, Communicating)
  • Narrative strengths + growth areas
  • Dynamic OG image for social sharing
  • CTA: "Learn about ACU's entrepreneurship program"
```

---

## 6. Assessment Flow — Applicant Full (Product B, Phase 2)

Extends Product A. After the 4 vignettes:

```
[After vignette 4]
        │
        ▼
Personality Quiz (/assess/personality)
  • 121 Likert items across 9 dimensions
  • Like/dislike interaction pattern (not traditional 1-5 scale)
  • Randomized item order within blocks
  • Attention check items (AC facet) interspersed
  • Progress bar, ~15–20 minutes
  • Auto-save progress
        │
        ▼
Test Score Submission (/assess/scores)
  • ACT composite + subscores
  • SAT total + subscores
  • Other standardized tests as applicable
  • Self-reported with verification note
        │
        ▼
[Same email capture → results flow, but with expanded results]

Applicant Results include:
  • PI + CI percentiles (same as public)
  • Personality profile: 9 dimension scores with interpretive text
  • Composite BQ score (weighted blend of intelligence + personality)
  • Admissions recommendation narrative
```

**Auth for applicants**: TBD. Options include invite-only token links or Supabase Auth. Will design when Product A is stable.

---

## 7. Database Schema Plan

All changes are additive to the existing triarchic-databank schema.

### 7.1 Modifications to Existing Tables

```sql
-- applicants: add lead gen and identity fields
ALTER TABLE applicants
  ADD COLUMN IF NOT EXISTS results_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS results_emailed_at timestamptz,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS ip_hash text,
  ADD COLUMN IF NOT EXISTS browser_fingerprint text;

-- assessment_sessions: add type and scoring tracking
ALTER TABLE assessment_sessions
  ADD COLUMN IF NOT EXISTS assessment_type text DEFAULT 'public',  -- 'public' or 'applicant'
  ADD COLUMN IF NOT EXISTS scoring_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS scoring_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS scoring_error text;

-- student_responses: add video reference and timing
ALTER TABLE student_responses
  ADD COLUMN IF NOT EXISTS video_storage_path text,
  ADD COLUMN IF NOT EXISTS video_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS transcript_text text,  -- populated by STT in batch
  ADD COLUMN IF NOT EXISTS transcript_model text,
  ADD COLUMN IF NOT EXISTS vignette_served_at timestamptz,
  ADD COLUMN IF NOT EXISTS recording_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS response_submitted_at timestamptz;

-- pi_vignettes: add audio for narration
ALTER TABLE pi_vignettes
  ADD COLUMN IF NOT EXISTS audio_storage_path text,
  ADD COLUMN IF NOT EXISTS audio_timing jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS estimated_narration_seconds integer;

-- ci_vignettes: add audio for narration
ALTER TABLE ci_vignettes
  ADD COLUMN IF NOT EXISTS audio_storage_path text,
  ADD COLUMN IF NOT EXISTS audio_timing jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS estimated_narration_seconds integer;
```

### 7.2 New Tables

```sql
-- Anti-cheating: track which vignettes have been seen by which identities
CREATE TABLE vignette_exposures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES assessment_sessions(id),
  vignette_id uuid NOT NULL,
  vignette_type text NOT NULL,  -- 'practical' or 'creative'
  ip_hash text NOT NULL,
  browser_fingerprint text,
  exposed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vignette_exposures_identity
  ON vignette_exposures(ip_hash, vignette_id);

-- Rate limiting
CREATE TABLE rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  action text NOT NULL,  -- 'session_create', 'response_submit', etc.
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 1
);
CREATE INDEX idx_rate_limits_lookup
  ON rate_limits(ip_hash, action, window_start);

-- Personality responses (Product B)
CREATE TABLE personality_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES assessment_sessions(id),
  item_id text NOT NULL,       -- e.g. 'AM01', 'RT05'
  facet text NOT NULL,         -- e.g. 'AM', 'RT', 'IN', etc.
  response_value integer NOT NULL,  -- 1-5 Likert
  response_time_ms integer,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_personality_responses_session
  ON personality_responses(session_id);

-- Personality scores (computed from responses)
CREATE TABLE personality_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES assessment_sessions(id),
  facet text NOT NULL,
  raw_score numeric NOT NULL,
  normalized_score numeric,    -- 0-100 scale
  n_items integer NOT NULL,
  attention_check_passed boolean,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_personality_scores_session
  ON personality_scores(session_id);
```

### 7.3 RLS (Defense in Depth)

```sql
-- Enable RLS on all sensitive tables with no anon policies (deny all)
ALTER TABLE pi_vignettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ci_vignettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE creative_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrepreneur_reasoning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrepreneur_creative_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE situation_type_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_type_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vignette_exposures ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_responses ENABLE ROW LEVEL SECURITY;
```

---

## 8. Security Model

### 8.1 What the Client Can See

- Vignette text and narration audio (only during the assessment, via Server Components)
- Category names (e.g., "Diagnosing the Situation") — but NOT individual move names
- Scored results: percentiles, category bars, narrative summaries
- Their own video preview during recording

### 8.2 What the Client NEVER Sees

- `applicable_moves` — which moves are relevant (the answer key)
- `move_scoring_anchors` — rubrics
- `exemplar_quotes` / `exemplar_framings` — real entrepreneur examples
- `source_incident_ids` / `source_episode_ids` — links to real people
- `detected_moves` — specific move-level scoring detail
- Individual move names or keys
- Other users' responses, scores, or data
- The service role key (enforced by server-only import + no `NEXT_PUBLIC_` prefix)

### 8.3 Enforcement

- **No client-side Supabase client.** No anon key in the bundle.
- Server Components/Actions use explicit `SELECT` with only safe columns.
- RLS enabled on sensitive tables with zero anon policies as defense-in-depth.
- Video upload via presigned URL scoped to the session's storage path (write-only, no read/list).
- Session cookie: HttpOnly, Secure, SameSite=Lax, Path=/assess, 2hr Max-Age.

---

## 9. Lead Generation & Analytics

### 9.1 Funnel Design

| Stage | Gate | Data Captured |
|---|---|---|
| Landing page | None | Page view, UTM params, referrer |
| Camera setup | Camera permission | Device capability signal |
| Session start | Rate limit check | IP hash, fingerprint, timestamp |
| Vignettes 1–4 | None (sequential) | Video responses, timing data |
| Email capture | Email required | Email, optional name |
| Results delivery | Email received | Open rate, click-through |
| Share | None | Social shares, viral coefficient |

### 9.2 UTM Tracking

Captured at session creation from URL query params: `utm_source`, `utm_medium`, `utm_campaign`. Stored on the applicant record. Enables attribution reporting.

### 9.3 Analytics Events

Track via Vercel Analytics (or PostHog if richer funnels needed):
- `assessment_started` — clicked "Take the Assessment"
- `camera_granted` / `camera_denied`
- `vignette_completed` (with step number, response time)
- `assessment_completed` — all 4 vignettes done
- `email_captured`
- `results_viewed`
- `results_shared` (with platform)

### 9.4 Completion Rate Optimization

The AI narration UX is critical for completion. It creates a guided, almost meditative flow that keeps people engaged through all 4 vignettes. Key levers:
- First vignette is PI (more relatable scenario) to build confidence
- Progress indicator shows clear 1-of-4 framing
- No back button — forward momentum only
- Premium visual design signals "this is worth finishing"

---

## 10. Tech Stack

| Package | Purpose |
|---|---|
| Next.js 16 (App Router) | Server Components for security, Server Actions for mutations |
| React 19 | Concurrent features, use() hook |
| TypeScript (strict) | Type safety |
| Tailwind CSS v4 | Styling via `@theme` in globals.css |
| `@supabase/ssr` | Server-side Supabase client |
| `jose` | JWT session cookie signing |
| `nanoid` | URL-safe results tokens |
| `@vercel/og` | Dynamic OG share images |
| Framer Motion | Animations (narration reveal, transitions) |
| Zod | Schema validation |
| CVA + clsx + tailwind-merge | Component variant patterns |

**Browser APIs used:**
- `MediaRecorder` — video capture
- `getUserMedia` — camera/mic access
- `Web Audio API` — narration playback with timing sync
- `IntersectionObserver` — lazy loading on marketing pages
- `document.visibilityState` — detect tab switches during recording

---

## 11. Project Structure

```
src/
├── app/
│   ├── (marketing)/              # Landing page, about, etc.
│   │   ├── page.tsx              # Hero, social proof, CTA
│   │   └── layout.tsx
│   ├── (assessment)/
│   │   ├── layout.tsx            # Session context provider
│   │   ├── assess/
│   │   │   ├── setup/
│   │   │   │   └── page.tsx      # Camera check + permissions
│   │   │   ├── [step]/
│   │   │   │   └── page.tsx      # Vignette narration + video recording (1-4)
│   │   │   ├── complete/
│   │   │   │   └── page.tsx      # Email capture
│   │   │   └── thank-you/
│   │   │       └── page.tsx      # Confirmation + results link
│   │   ├── personality/          # Product B: Likert quiz
│   │   │   └── page.tsx
│   │   └── scores/               # Product B: Test score submission
│   │       └── page.tsx
│   ├── results/
│   │   └── [token]/
│   │       └── page.tsx          # Scored results display
│   └── api/
│       ├── og/
│       │   └── route.tsx         # Dynamic OG image generation
│       └── upload/
│           └── route.tsx         # Presigned upload URL generation
├── components/
│   ├── ui/                       # Primitives (button, card, input, progress, etc.)
│   ├── layout/                   # Header, footer, nav
│   ├── assessment/
│   │   ├── CameraCheck.tsx       # Camera permission + preview
│   │   ├── VignetteNarrator.tsx  # AI narration + synced text reveal
│   │   ├── VideoRecorder.tsx     # MediaRecorder wrapper + timer + upload
│   │   ├── ProgressBar.tsx       # Step indicator (1 of 4)
│   │   └── EmailCapture.tsx      # Post-assessment email form
│   ├── results/
│   │   ├── ScoreGauge.tsx        # Overall percentile display
│   │   ├── CategoryBars.tsx      # PI/CI category breakdown
│   │   ├── NarrativeSummary.tsx  # Strengths + growth areas
│   │   └── ShareCard.tsx         # Social sharing buttons
│   └── marketing/                # Landing page sections
└── lib/
    ├── supabase/
    │   ├── server.ts             # Service role client (server-only)
    │   └── storage.ts            # Presigned URL generation
    ├── actions/
    │   ├── session.ts            # createSession, getSessionData
    │   ├── response.ts           # submitVideoResponse, confirmUpload
    │   └── applicant.ts          # captureEmail
    ├── queries/
    │   ├── vignettes.ts          # Fetch assigned vignettes (safe columns only)
    │   └── results.ts            # Fetch scored results by token
    ├── schemas/
    │   ├── session.ts            # Session cookie payload schema
    │   ├── applicant.ts          # Email capture validation
    │   └── response.ts           # Response timing validation
    ├── assessment/
    │   ├── vignette-assignment.ts # Select vignettes excluding burned ones
    │   ├── rate-limiter.ts       # IP-based rate limiting via Supabase
    │   ├── fingerprint.ts        # Browser fingerprint generation
    │   └── session-cookie.ts     # JWT-signed HttpOnly cookie (jose)
    └── utils.ts                  # cn() helper, shared utilities
```

---

## 12. Implementation Phases

### Phase 1: Foundation
- Next.js project scaffolding (fonts, theme, globals, layout)
- Supabase server client setup (`@supabase/ssr`, service role only)
- Session cookie infrastructure (jose JWT, HttpOnly)
- Database migrations (new columns + new tables)
- Supabase Storage bucket creation for video responses
- Deploy skeleton to Vercel, configure custom domain
- Design system foundations (colors, typography, glass card, button primitives)

### Phase 2: Landing Page
- Marketing landing page (hero, how it works, social proof, FAQ)
- Dark glassmorphism aesthetic per design direction
- Mobile responsive, performant (static generation)
- UTM capture from URL params

### Phase 3: Assessment Core (The Big One)
- Camera check/permission flow
- Vignette assignment logic with exposure tracking
- VignetteNarrator component (audio playback + synced text reveal)
- VideoRecorder component (MediaRecorder, timer, upload)
- Presigned upload URL generation
- Server Actions for response submission + timing validation
- Step-by-step flow with progress indicator
- Anti-cheating: rate limiting, timing enforcement, fingerprinting

### Phase 4: Email Capture & Thank You
- Email capture form with validation
- Results token generation (nanoid)
- Session completion logic
- Thank you page with results link
- Assessment session status management

### Phase 5: TTS Audio Generation
- Generate narration audio for all vignettes (OpenAI TTS / ElevenLabs)
- Extract word-level timing metadata
- Upload audio files to Supabase Storage
- Populate audio_storage_path and audio_timing on vignette records

### Phase 6: Batch Scoring Pipeline (Python-side)
- Speech-to-text processor for video responses
- Integration with existing PI/CI scoring pipeline
- Results email template (Resend)
- GitHub Actions cron job
- End-to-end test with real video responses

### Phase 7: Results Page
- Score visualization (overall percentile gauge)
- PI + CI category breakdown bars
- Narrative strengths and growth areas
- Dynamic OG image generation for social sharing
- Share buttons (Twitter/X, LinkedIn, copy link)
- CTA to ACU program

### Phase 8: Hardening
- Edge middleware for bot detection
- Abuse testing (rate limits, timing, repeat attempts)
- Mobile polish (iOS Safari video recording quirks, dvh units)
- Accessibility audit (WCAG 2.2 compliance)
- Performance optimization (Core Web Vitals)
- Error states and edge cases (network failure during upload, session timeout, etc.)

### Phase 9: Product B — Personality & Applicant Path (Future)
- Personality quiz UI (like/dislike interaction pattern)
- Personality scoring logic
- Test score submission form
- Applicant authentication (TBD)
- Expanded results page with personality profile
- Database tables: personality_responses, personality_scores

---

## 13. Key Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Vignette pool too small (2+2) | Everyone sees same questions, limits repeat assessment | Launch as designed (1 attempt per identity). Prioritize pipeline vignette generation. |
| Video upload fails mid-assessment | User loses progress, bad experience | Auto-retry with exponential backoff. Save recording locally until upload confirmed. Show clear upload status. |
| iOS Safari MediaRecorder quirks | Recording may fail on some devices | Test extensively. Safari supports MediaRecorder since iOS 14.3 but with caveats (H.264 only, no VP9). Handle format negotiation. |
| Storage costs at scale | 120 GB/day at 1000 sessions | Implement lifecycle policies. Archive scored videos after 90 days. Consider R2/S3 migration at scale. |
| STT accuracy affects scoring | Bad transcripts → bad scores | Use Whisper large-v3 or Gemini Flash for STT. Keep video for human review of edge cases. |
| Cheating via screen recording/sharing vignettes | Undermines assessment validity | Progressive reveal + no replay limits screenshot utility. Vignette burning limits utility of shared answers. Accept some residual risk. |

---

## 14. Environment Variables

```
# Client (safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://pdvzwldlpnpuvepnoliq.supabase.co

# Server only (NEVER prefix with NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=[from Supabase dashboard]
SESSION_SECRET=[openssl rand -hex 32]
ASSESSMENT_ACTIVE=true
```

---

## 15. Open Decisions

- [ ] **Applicant auth method**: Invite token links vs. Supabase Auth (deferred to Product B)
- [ ] **TTS provider**: OpenAI TTS vs. ElevenLabs (evaluate voice quality + cost + word-level timing support)
- [ ] **Analytics platform**: Vercel Analytics (simple) vs. PostHog (richer funnels, self-hostable)
- [ ] **Video storage at scale**: Supabase Storage vs. S3/R2 (monitor costs post-launch)
- [ ] **Personality quiz interaction**: Traditional Likert (1–5 scale) vs. like/dislike swipe pattern from the-arena
- [ ] **STT provider**: Whisper API vs. Gemini Flash audio (cost/accuracy tradeoff)
