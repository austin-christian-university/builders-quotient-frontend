# Builders Quotient (BQ)

Psychometric assessment frontend for Austin Christian University. Live at **[bq.austinchristianu.org](https://bq.austinchristianu.org)**.

Students record webcam responses to real entrepreneur dilemmas. A Python pipeline transcribes and scores them against a corpus of 274 real founders. Results come back as an archetype, two intelligence radars, and a communication-style profile — not a test score.

## Two products, one codebase

**Public BQ — lead gen.** Anyone can take the assessment at `bq.austinchristianu.org`. Flow: intake → warmup (3 practice questions) → 4 video vignettes (2 Practical Intelligence, 2 Creative Intelligence) → email capture. Results are delivered by email with a token-gated link.

**Admissions entrance exam.** Same intelligence assessment, plus a 121-item Likert personality quiz and standardized-test-score intake. Used by ACU as part of the application.

**[`/entrepreneurs`](https://bq.austinchristianu.org/entrepreneurs) explorer.** A public browsable view of the 274-entrepreneur corpus. 4×4 archetype matrix, PI/CI scatter plots, per-founder profiles, communication-style radars. See [docs/superpowers/plans/2026-04-14-entrepreneur-explorer.md](docs/superpowers/plans/2026-04-14-entrepreneur-explorer.md) for the implementation plan.

## How we measure

Two independent intelligence domains (Sternberg's triarchic model), plus personality.

**Practical Intelligence (PI)** — how entrepreneurs reason through concrete business dilemmas. 200-move binary vector across 12 categories (Situation Diagnosis, Information Gathering, Constraint Analysis, Option Generation, Tradeoff Evaluation, Risk Assessment, Decision Architecture, Action Planning, People & Stakeholders, Communication Strategy, Emotional & Values Reasoning, Meta-Cognition).

**Creative Intelligence (CI)** — how they spot opportunities and reframe problems. 200-move vector across 12 parallel categories (Pattern Recognition, Information Seeking, Reframing, Cross-Domain Connection, Opportunity Articulation, Customer Insight, Timing Assessment, Validation Strategy, Risk Evaluation, Vision Communication, Creative Confidence, Meta-Creative Thinking).

Scoring is frequency-weighted proportional CDF against the entrepreneur corpus, with a 70% consensus threshold for move inclusion. No rubrics, no LLM-in-the-loop scoring. The canonical 12-category arrays are in [`src/lib/assessment/scoring-categories.ts`](src/lib/assessment/scoring-categories.ts).

**Communication Style** — a 20-dimension vector (Composure, Formality, Vulnerability, Humor, Conciseness, etc.) derived from video analysis of the response itself. Shown on results as "Communication Style", not "Personality".

**Personality quiz** — 9 entrepreneur dimensions (Ambition, Risk Tolerance, Innovativeness, Autonomy, Self-Efficacy, Stress Tolerance, Internal Locus, Grit, Attention Checks) via like/dislike Likert items. Admissions path only.

Full methodology: [`../triarchic-databank/docs/assessment_methodology.md`](../triarchic-databank/docs/assessment_methodology.md).

## Architecture — two repos, one database

This repo owns the **student-facing experience**: intake, vignette playback, webcam recording, video upload, results delivery, public explorer.

[**triarchic-databank**](../triarchic-databank/) (Python) owns the **data pipeline**: scraping entrepreneur interviews from YouTube, transcribing with speaker diarization, extracting PI/CI moves, building per-entrepreneur reasoning profiles and corpus distributions, scoring student responses in batch.

Both repos share a single Supabase instance (`pdvzwldlpnpuvepnoliq`). The frontend writes `assessment_sessions` and `student_responses` (with video paths and timestamps); the pipeline writes scoring results back onto the same rows. All DB access from this frontend is **server-only** via the service-role key — there is no client-side Supabase, no anon key exposure.

Scoring is not real-time. Student videos are uploaded to Supabase Storage, and a scheduled Python job transcribes and scores them. Results arrive by email within ~24 hours.

## Tech stack

- **Next.js 16** (App Router, server components, server actions) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** — theme tokens in `src/app/globals.css` via `@theme`, no `tailwind.config.js`
- **Supabase SSR** (`@supabase/ssr`) — service-role only, see [`src/lib/supabase/server.ts`](src/lib/supabase/server.ts)
- **Zod** for validation, **jose** for signed JWT session cookies, **Framer Motion** for narration
- **Vitest** + Testing Library for tests
- **Vercel** for hosting, **Sentry** for errors, **PostHog** for analytics

## Getting started

```bash
npm install
cp .env.example .env.local      # then fill in the values
npm run dev                     # http://localhost:3000
```

**Required env vars** (see [`.env.example`](.env.example)):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Shared Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Never expose to client. |
| `SESSION_SECRET` | JWT signing. Generate: `openssl rand -hex 32` |
| `IP_HASH_SALT` | IP hashing for privacy. Generate: `openssl rand -hex 32` |

Optional: `REVIEW_PASSWORD` (gates `/review`), `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`.

**Scripts:**

```bash
npm run dev              # dev server
npm run build            # production build
npm run start            # production server
npm run lint             # eslint
npm test                 # vitest, watch mode
npm run test:run         # vitest, single pass
npm run test:coverage    # coverage report
```

## Project layout

See [CLAUDE.md](CLAUDE.md) for the authoritative tree and coding conventions. The short version:

- `src/app/(marketing)/` — public landing, `/entrepreneurs` explorer, contact
- `src/app/(assessment)/` — warmup, PI/CI vignettes, personality quiz, results flow
- `src/lib/queries/` — server-only data fetching (`entrepreneurs.ts`, `vignettes.ts`, `results.ts`)
- `src/lib/assessment/` — scoring categories, warmup/vignette reducers, fingerprinting, content protection
- `src/lib/actions/` — server actions (session creation, response submission)
- `src/components/entrepreneurs/` — archetype grid, scatter, cards, communication radar
- `src/components/assessment/` — vignette player, camera check, orb guide, countdown ring
- `src/components/results/` — radar charts, narrative slides, share cards

## Further reading

| File | What it covers |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Repo guidelines, project structure, stack, coding style, React useEffect rules |
| [DESIGN.md](DESIGN.md) | Visual system: dark glassmorphism, color tokens, typography, motion |
| [ROADMAP.md](ROADMAP.md) | What ships when; public launch, admissions, future work |
| [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md) | Pre-production readiness criteria |
| [RESULTS.md](RESULTS.md) | Results page design and rationale |
| [CHANGELOG.md](CHANGELOG.md) | Every shipped version |
| [TODOS.md](TODOS.md) | Deferred work from reviews and implementation |
| [../triarchic-databank/README.md](../triarchic-databank/README.md) | Python pipeline overview |
| [../triarchic-databank/docs/assessment_methodology.md](../triarchic-databank/docs/assessment_methodology.md) | Why corpus-derived scoring beats rubrics |

## Related repos

- **[triarchic-databank](../triarchic-databank/)** — Python pipeline. Interview scraping, transcription, move extraction, scoring. Populates this repo's Supabase tables. Reference `src/models/` for schema definitions and `docs/` for methodology.
- **[the-arena](../the-arena/)** — earlier prototype. Contains the original Likert personality quiz (121 items, 9 facets) that we're integrating as Product B.
