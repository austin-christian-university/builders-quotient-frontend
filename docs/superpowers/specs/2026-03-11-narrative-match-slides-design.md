# Narrative Entrepreneur Match Slides — Design Spec

**Date:** 2026-03-11
**Status:** Approved

## Problem

The current reasoning match and communication match slides rely on radar chart overlays to show student–entrepreneur similarity. While mathematically valid, the visual comparison is often confusing — two polygons that don't look obviously similar even when cosine similarity is high. Users don't connect with abstract chart shapes.

Personality assessment products like Working Genius succeed because they tell stories: rich narrative blocks organized into tiers, substantial paragraphs explaining what each result means in practice, and honest strengths/frustrations framing. BQ should deliver the same experience through the lens of real entrepreneurs.

## Design Philosophy

- **Stories over charts** — replace radar chart overlays with narrative entrepreneur profiles
- **Same content pattern for both domains** — reasoning and communication match slides share identical layout, different accent colors and domain-specific content
- **Top 3 matches as interactive pills** — primary match highlighted, two runner-ups explorable via pill navigation with crossfade transitions (supersedes the 4-runner-up design in the 2026-03-10 results-redesign spec)
- **Honest framing** — each entrepreneur profile includes strengths AND blindspots, like Working Genius's genius/frustration duality
- **Graceful degradation** — if narrative content hasn't been generated yet, fall back to existing `matched_bio_snippet`

## Two Workstreams

This design spans two codebases:
1. **Frontend (this repo)** — schema changes, new match slide components, updated queries
2. **Python pipeline (triarchic-databank)** — research, LLM generation, judge review for ~274 entrepreneur narrative profiles

The Python pipeline is a separate project. Section 3 of this spec provides the full requirements for that work.

---

## Section 1: Data Model

### Shared content — `entrepreneurs` table (new column)

| Column | Type | Description |
|--------|------|-------------|
| `bio_narrative` | text | 2-3 paragraph origin story. Who they are, what they built, the defining arc. |

### Reasoning narratives — new `entrepreneur_reasoning_narratives` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `entrepreneur_id` | uuid FK → entrepreneurs(id) | UNIQUE constraint |
| `reasoning_style` | text | Paragraph describing how they approach problems, diagnose situations, make decisions |
| `signature_moves` | jsonb | Array of `{title, description}` — 2-3 real decisions/moments exemplifying their reasoning |
| `strengths` | text | Paragraph on what this reasoning style excels at |
| `blindspots` | text | Paragraph on where this style struggles |
| `source_urls` | jsonb | Array of research source URLs for auditability |
| `generated_at` | timestamptz | When content was generated |
| `generation_model` | text | LLM model used for generation |
| `judge_model` | text | LLM model used for quality review |
| `judge_pass_rate` | real | Fraction of judge checks passed |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### Communication narratives — new `entrepreneur_communication_narratives` table

Same schema as reasoning narratives, with `communication_style` instead of `reasoning_style`. Signature moves, strengths, and blindspots are communication-domain-specific.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid PK | |
| `entrepreneur_id` | uuid FK → entrepreneurs(id) | UNIQUE constraint |
| `communication_style` | text | Paragraph describing how they present, persuade, connect |
| `signature_moves` | jsonb | Array of `{title, description}` — communication-specific moments |
| `strengths` | text | Paragraph on communication strengths |
| `blindspots` | text | Paragraph on communication weaknesses |
| `source_urls` | jsonb | Array of research source URLs |
| `generated_at` | timestamptz | |
| `generation_model` | text | |
| `judge_model` | text | |
| `judge_pass_rate` | real | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Both narrative tables use RLS with deny-all for anon (service role bypasses), matching the pattern of other pipeline data tables.

### `signature_moves` JSONB shape

```json
[
  {
    "title": "The cereal milk pivot",
    "description": "When told nostalgic flavors couldn't work in fine dining, Tosi ran 40+ iterations until the texture was undeniable. She diagnosed the real constraint (texture, not taste) and reframed the problem entirely."
  },
  {
    "title": "Scaling through systems",
    "description": "Tosi built Milk Bar's expansion not on star chefs but on obsessively documented recipes any trained baker could replicate. She identified that consistency, not creativity, was the bottleneck to growth."
  }
]
```

### SQL migration

```sql
-- Add bio narrative to existing entrepreneurs table
ALTER TABLE entrepreneurs ADD COLUMN bio_narrative text;

-- Reasoning narratives
CREATE TABLE entrepreneur_reasoning_narratives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneur_id uuid NOT NULL REFERENCES entrepreneurs(id) ON DELETE CASCADE,
  reasoning_style text NOT NULL,
  signature_moves jsonb NOT NULL DEFAULT '[]',
  strengths text NOT NULL,
  blindspots text NOT NULL,
  source_urls jsonb DEFAULT '[]',
  generated_at timestamptz DEFAULT now(),
  generation_model text,
  judge_model text,
  judge_pass_rate real,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entrepreneur_id)
);

-- Communication narratives
CREATE TABLE entrepreneur_communication_narratives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneur_id uuid NOT NULL REFERENCES entrepreneurs(id) ON DELETE CASCADE,
  communication_style text NOT NULL,
  signature_moves jsonb NOT NULL DEFAULT '[]',
  strengths text NOT NULL,
  blindspots text NOT NULL,
  source_urls jsonb DEFAULT '[]',
  generated_at timestamptz DEFAULT now(),
  generation_model text,
  judge_model text,
  judge_pass_rate real,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entrepreneur_id)
);

-- RLS: same pattern as other pipeline tables — deny-all for anon, service role bypasses
ALTER TABLE entrepreneur_reasoning_narratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrepreneur_communication_narratives ENABLE ROW LEVEL SECURITY;
```

---

## Section 2: Match Slide UX

### Layout (shared by both reasoning and communication match slides)

Both match slides use identical layout with domain-specific content and accent colors.

**Fixed elements (don't scroll):**
- **Eyebrow**: "REASONING MATCH" or "COMMUNICATION MATCH" (uppercase, tracked)
- **Header**: Changes based on selected pill:
  - Primary match: "Your reasoning most resembles" / "Your communication style most resembles"
  - Runner-up: "You also reason like" / "You also communicate like"
- **3 match pills** (sticky at bottom of slide):
  - Primary match: highlighted with accent color border, glow shadow, white text
  - Runner-ups: muted border, gray text
  - Click swaps card content with crossfade transition
  - Pills fit single row on mobile

**Scrollable narrative card** (glassmorphic, scrolls vertically within the slide):
- Entrepreneur name (large, bold)
- Company pills (accent-colored) + industry pills (muted)
- Bio/origin story (`bio_narrative` from `entrepreneurs` table)
- Domain-specific style description:
  - Reasoning: section header "Reasoning Style" → `reasoning_style` paragraph
  - Communication: section header "Communication Style" → `communication_style` paragraph
- "Signature Moves" section header → 2-3 entries, each with bolded title + narrative description
- "Strengths" section header (accent color) → paragraph
- "Blindspots" section header (gold/amber accent) → paragraph

### Scroll behavior

The match slide uses a flex column layout within the full-viewport slide container: fixed eyebrow/header at top, fixed pill bar at bottom, and a `flex-1 overflow-y-auto` card region in the middle. The card region uses `overscroll-behavior: contain` to prevent scroll chaining into the slideshow navigation. On mobile, the slideshow detects horizontal swipes for slide navigation while vertical scroll stays captured within the card. On desktop, the slideshow uses up/down arrow keys and nav buttons (not scroll-based), so the inner scroll does not conflict.

### Transitions

- Clicking a different pill triggers a crossfade on the card content (opacity out → swap data → opacity in)
- Card scrolls back to top on pill switch
- Standard Framer Motion staggered entrance on initial slide entry

### Accent colors

- Reasoning match: electric blue (`#4da3ff`)
- Communication match: teal (`#2dd4bf`)

### Graceful degradation

If narrative content hasn't been generated for a matched entrepreneur:
- `bio_narrative` missing → fall back to `matched_bio_snippet` from `student_reasoning_profiles` or `student_personality_profiles`
- Domain narrative missing (no row in `entrepreneur_reasoning_narratives` / `entrepreneur_communication_narratives`) → hide Reasoning/Communication Style, Signature Moves, Strengths, and Blindspots sections. Show only name + pills + fallback bio.

---

## Section 3: Python Pipeline Spec (for triarchic-databank)

### Goal

Generate high-quality, factually accurate narrative profiles for all matchable entrepreneurs. Each entrepreneur gets a shared bio, a reasoning-domain narrative, and a communication-domain narrative.

### Content targets

- ~274 entrepreneurs get `bio_narrative` (shared)
- ~249 reasoning-matchable entrepreneurs get reasoning narratives (those with rows in `entrepreneur_reasoning_profiles`)
- ~261 communication-matchable entrepreneurs get communication narratives (those with rows in `entrepreneur_personality_profiles`)

### Pipeline stages

#### Stage 1 — Research & Source Collection

For each entrepreneur:
- Web search for biographical sources (Wikipedia, Forbes, interviews, founding stories, podcast transcripts)
- Collect 5-10 high-quality source URLs with key excerpts
- Prioritize primary sources (their own interviews/talks) over secondhand profiles
- Store raw research as intermediate artifacts (for auditability and re-generation)

#### Stage 2 — Draft Generation

Two separate LLM generation passes per entrepreneur:

**Pass A — Bio + Reasoning Narrative:**
- Input: research sources + entrepreneur's `reasoning_move_probabilities` from `entrepreneur_reasoning_profiles` (global situation_type) to ground the reasoning style description in their actual data
- Output:
  - `bio_narrative`: 2-3 paragraphs, narrative origin story. Tone: admiring but honest, like a well-written magazine profile. Real details, real decisions, real turning points — not generic.
  - `reasoning_style`: 1 paragraph describing how they approach problems, make decisions, diagnose situations. Grounded in their actual move profile data — if they score high on "Constraint Analysis" and "Risk Assessment", the narrative should reflect that pattern without using those technical category names.
  - `signature_moves`: 2-3 entries, each `{title, description}`. Real, researched moments that exemplify their reasoning style. Title is a punchy label ("The cereal milk pivot"), description is 2-3 sentences explaining what happened and what reasoning pattern it demonstrates.
  - `strengths`: 1 paragraph. What this reasoning style excels at in entrepreneurial contexts.
  - `blindspots`: 1 paragraph. Where this style struggles. Honest but not harsh — like Working Genius's "frustration" framing.

**Pass B — Communication Narrative:**
- Input: research sources + entrepreneur's `personality_vector` from `entrepreneur_personality_profiles` to ground the communication style in their actual data
- Output:
  - `communication_style`: 1 paragraph describing how they present, persuade, connect. Grounded in their personality vector — if they score high on "assertiveness" and "enthusiasm", the narrative should reflect that.
  - `signature_moves`: 2-3 entries, same `{title, description}` shape. Communication-specific moments — a famous pitch, a negotiation, a public speech, how they handled a crisis publicly.
  - `strengths`: 1 paragraph on communication strengths.
  - `blindspots`: 1 paragraph on communication weaknesses.

#### Stage 3 — Quality Review (LLM Judges)

Each generated narrative goes through 2-3 judge LLMs that evaluate:
- **Factual accuracy**: Are the biographical details and signature moves verifiable from the research sources? Flag any hallucinated events.
- **Grounding**: Does the reasoning/communication style description align with the entrepreneur's actual profile data (move probabilities / personality vector)?
- **Tone**: Is it admiring but honest? Does it avoid hagiography? Are blindspots genuinely useful, not backhanded compliments?
- **Specificity**: Does it use real details, or could this paragraph describe anyone? Reject generic content.
- **Length/quality**: Each field within target length? Prose quality high?

Judge output: pass/fail per field with specific feedback. Failed fields get re-generated (up to 3 attempts) with judge feedback injected into the prompt. After 3 failures, flag for human review.

#### Stage 4 — Write to Supabase

- `bio_narrative` → `entrepreneurs.bio_narrative` column
- Reasoning fields → `entrepreneur_reasoning_narratives` table
- Communication fields → `entrepreneur_communication_narratives` table
- Track generation metadata: `generated_at`, `source_urls`, `judge_pass_rate`, `generation_model`, `judge_model`

---

## Section 4: Frontend Changes

### Schema (`src/lib/schemas/results.ts`)

Replace the existing `reasoningMatchSchema` and `communicationMatchSchema` (which currently carry category scores and radar-oriented data) with narrative-driven schemas:

```typescript
// Shared shape for narrative content
const signatureMoveSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const entrepreneurNarrativeSchema = z.object({
  entrepreneurName: z.string(),
  entrepreneurId: z.string(),
  companies: z.array(z.string()),
  industries: z.array(z.string()),
  bioNarrative: z.string().nullable(),       // from entrepreneurs.bio_narrative
  fallbackBioSnippet: z.string().nullable(), // from matched_bio_snippet, used if bioNarrative is null
  domainStyle: z.string().nullable(),        // reasoning_style or communication_style
  signatureMoves: z.array(signatureMoveSchema),
  strengths: z.string().nullable(),
  blindspots: z.string().nullable(),
});

// Both match types use the same structure: primary + 2 runner-ups
const narrativeMatchSchema = z.object({
  primary: entrepreneurNarrativeSchema,
  runnersUp: z.array(entrepreneurNarrativeSchema).max(2),
});

// Reasoning and communication matches are both narrativeMatchSchema.
// They are separate fields on ResultsPageData because they match
// different entrepreneurs and carry different domain content.
const reasoningMatchSchema = narrativeMatchSchema;
const communicationMatchSchema = narrativeMatchSchema;
```

This replaces both the old `reasoningMatchSchema` (which had `studentCategoryScores`, `entrepreneurCategoryScores`, `topSharedStrengths`, `biggestDifferences`) and the old `communicationMatchSchema` / `entrepreneurMatchSchema` (which had `cosineSimilarity`, `studentProfile`, `entrepreneurProfile`, `topSharedTraits`).

### Query (`src/lib/queries/results.ts`)

**Reasoning match query pattern:**
1. Fetch `student_reasoning_profiles` row for the session → get `matched_entrepreneur_id`, `matched_entrepreneur_name`, `matched_bio_snippet`, `top_5_matches`
2. Collect all 3 entrepreneur IDs (primary + first 2 from `top_5_matches`)
3. Batch fetch with `IN` queries: `entrepreneurs` (name, companies, industries, bio_narrative) + `entrepreneur_reasoning_narratives` (reasoning_style, signature_moves, strengths, blindspots)
4. Assemble `entrepreneurNarrative` objects for each, using `matched_bio_snippet` as `fallbackBioSnippet` for the primary match (runner-ups get `fallbackBioSnippet: null`)
5. If a narrative row is missing for any entrepreneur, that match still shows with whatever data is available (graceful degradation)

**Communication match query pattern:**
Same pattern but using `student_personality_profiles` for match IDs and `entrepreneur_communication_narratives` for domain content.

**Code to remove:**
- `computeCategoryScoresFromMoveProbs` helper and move-to-category mapping logic
- Entrepreneur reasoning profile probability fetches (`entrepreneur_reasoning_profiles.reasoning_move_probabilities`)
- `averageByCategory` calls for communication match radar comparison
- All radar-oriented data assembly for both match types

Runner-ups go from 4 to 2 (top 3 total, down from top 5).

### Components

- `ReasoningMatchSlide.tsx` — rewrite to narrative card with pill navigation. Remove RadarChart. Add internal scroll, crossfade on pill switch, sticky pills.
- `CommunicationMatchSlide.tsx` — same rewrite, teal accent.
- `EntrepreneurCardModal.tsx` — remove (no more modals).
- `ResultsExperience.tsx` — update props passed to match slides.

### Graceful degradation

- Missing `bio_narrative` → use `matched_bio_snippet` from pipeline
- Missing narrative row entirely → show name + fallback bio + pills only, hide style/moves/strengths/blindspots
- All 3 matches missing narratives → still shows the slide with minimal content rather than "coming soon"

---

## Out of Scope

- Personalized match narratives (per student-entrepreneur pairing) — future layer on top of static profiles
- Runner-up detail beyond top 3 — keep it focused
- Radar chart overlays on match slides — removed entirely
- Changes to intelligence radar slides (3, 4) or communication radar slide (7) — those keep their existing charts
- Changes to strengths/growth narrative slides (5, 8) — those keep their current templated approach
