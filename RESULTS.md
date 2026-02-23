# BQ Wrapped — Results Page Master Plan

> The single source of truth for designing and building the BQ results experience.
> Companion to `ROADMAP.md`. Referenced across multiple implementation sessions.

---

## 1. Vision & UX Concept

The results page is the payoff moment for the entire BQ assessment -- the link users receive via email ~24 hours after taking the assessment. It needs to be a visually stunning, "Spotify Wrapped"-style scroll experience that makes users want to share their results.

### Core Metaphor

**BQ Wrapped**: A full-screen vertical scroll journey, one concept per viewport. Each section has a dramatic reveal animation triggered by scroll position. The experience is designed to be consumed on mobile first (this is what gets shared in iMessage / WhatsApp / Instagram), but scales beautifully to desktop.

### Design Decisions

- **Full-screen snap scroll**: `scroll-snap-type: y mandatory` with physics-based section transitions. Each section locks to viewport like Spotify Wrapped.
- **Dark glassmorphism** aesthetic consistent with the rest of the app.
- **~14 sections**, ~2-3 minutes to scroll through.
- **No auth required**: Token-based access at `/results/{token}`.
- **Mobile-first**: Designed for portrait phone screens, enhanced for desktop.

---

## 2. Data Architecture

### 2.1 Query Pipeline

```
GET /results/{token}
  -> applicants WHERE results_token = {token}
    -> assessment_sessions WHERE applicant_id = {id} AND status IN ('completed', 'scored')
      -> student_responses WHERE session_id = {id} AND scoring_result IS NOT NULL
        -> Extract from scoring_result JSONB:
           - headline_percentile
           - category_scores[]
           - move_details[] (server-side only -- filtered before client)
           - summary_text
```

### 2.2 Upstream Scoring Schema (Python Pipeline)

The `scoring_result` JSONB column stores the output of the Python pipeline's scorers. The two types share the same shape:

**PI `ScoringResult`:**
```
{
  vignette_id: string | null,
  situation_type: string,
  headline_percentile: float,        // avg of category percentiles
  category_scores: CategoryScore[],  // 5 items
  move_details: MoveDetail[],        // up to 26 items
  moves_present_total: int,
  moves_applicable_total: int,
  n_entrepreneur_incidents: int,     // corpus size (274)
  summary_text: string               // AI-generated narrative
}
```

**`CategoryScore`:**
```
{
  category: string,          // e.g. "Diagnosing the Situation"
  moves_present: int,        // how many moves the student demonstrated
  moves_applicable: int,     // how many were relevant to this vignette
  percentile: float,         // 0-100
  entrepreneur_mean: float,  // avg moves entrepreneurs exhibit
  entrepreneur_std: float
}
```

**`MoveDetail`:**
```
{
  move_key: string,               // e.g. "move_01", "ci_move_05"
  move_name: string,              // e.g. "Identified the real problem vs. surface symptom"
  category: string,
  present: bool,
  applicable: bool,
  entrepreneur_frequency: float,  // 0-1: fraction of entrepreneurs who exhibit this
  status: string                  // "impressive" | "expected" | "gap" | "typical_miss" | "not_applicable"
}
```

CI uses identical shapes (`CIScoringResult`, `CICategoryScore`, `CIMoveDetail`) with `episode_type` instead of `situation_type` and `n_entrepreneur_episodes` instead of `n_entrepreneur_incidents`.

**Status classification rules:**
- `present=true` + `entrepreneur_frequency < 0.3` -> `"impressive"` (rare and demonstrated)
- `present=true` + `entrepreneur_frequency >= 0.3` -> `"expected"` (common and demonstrated)
- `present=false` + `entrepreneur_frequency >= 0.6` -> `"gap"` (common but missed)
- `present=false` + `entrepreneur_frequency < 0.6` -> `"typical_miss"` (rare and missed)
- `applicable=false` -> `"not_applicable"`

**Move counts:**
- PI: 26 moves across 5 categories (Diagnosing 6, Reasoning 7, Acting 6, People 4, Meta 3)
- CI: 24 moves across 5 categories (Observing 5, Reframing 5, Articulating 5, Evaluating 5, Communicating 4)

### 2.3 Server-Side Security Filtering

The server component reads the full `scoring_result` JSONB but filters before passing to the client.

**Safe to expose (pass to client):**
- Category names and percentiles
- Category-level stats (moves_present count, moves_applicable count)
- Entrepreneur comparison stats (mean, std, corpus size)
- Summary narrative text
- Headline percentiles
- Archetype derivation (computed server-side from category percentiles)
- Entrepreneur match data (name, companies, industries, category, similarity score)

**Never expose (stays on server):**
- Individual move keys (`move_01`, `ci_move_05`, etc.)
- Move-level present/absent booleans (raw)
- Move-level entrepreneur frequencies (raw)
- Move status labels (impressive/gap/etc.)
- Detected moves vector
- Scoring anchors, exemplar quotes

**The twist:** Several sections (Signature Moves, Rarest Thing, Growth Edge) need move-level data. The server component pre-computes these into safe, displayable formats using the human-readable move names stripped of their keys:

- **Signature Moves** -> server extracts `status === "impressive"` moves, returns: `{ description: string, rarityPercent: number, categoryName: string }[]`
- **Growth Edge** -> server extracts `status === "gap"` moves, returns: `{ description: string, categoryName: string }[]`
- **Rarest Thing** -> server picks the single lowest-frequency `present === true` move, returns: `{ description: string, rarityFraction: string, categoryName: string }`

This is acceptable because knowing move names (which are just descriptive phrases like "Named what they don't know") doesn't help game the assessment -- the value is in spontaneously demonstrating them on video.

### 2.4 Aggregation Logic

Students answer 2 PI + 2 CI vignettes. The server must aggregate across responses:

- **PI headline**: average of 2 PI `headline_percentile` values
- **CI headline**: average of 2 CI `headline_percentile` values
- **Overall BQ**: weighted average (50% PI, 50% CI for public; different weights for admissions)
- **Per-category**: average percentiles across the 2 responses per type
- **Moves**: union of move details across responses (a move is "present" if demonstrated in *either* response)

### 2.5 Zod Schemas

New file: `src/lib/schemas/results.ts`

```typescript
import { z } from "zod";

// --- Sub-schemas ---

const categoryScoreSchema = z.object({
  category: z.string(),
  percentile: z.number().min(0).max(100),
  movesPresent: z.number().int().min(0),
  movesApplicable: z.number().int().min(0),
  entrepreneurMean: z.number(),
  entrepreneurStd: z.number(),
});

const archetypeSchema = z.object({
  name: z.string(),           // e.g. "The Diagnostician"
  tagline: z.string(),        // e.g. "You see the real problem before anyone else does"
  basedOnCategory: z.string(),
  variant: z.enum(["pi", "ci"]),
});

const signatureMoveSchema = z.object({
  description: z.string(),    // human-readable move name, no key
  rarityPercent: z.number(),  // entrepreneur_frequency * 100
  categoryName: z.string(),
});

const rarestMoveSchema = z.object({
  description: z.string(),
  rarityFraction: z.string(), // e.g. "1 in 8"
  categoryName: z.string(),
});

const growthEdgeSchema = z.object({
  description: z.string(),
  categoryName: z.string(),
});

const entrepreneurMatchSchema = z.object({
  name: z.string(),
  companies: z.array(z.string()),
  industries: z.array(z.string()),
  matchCategory: z.string(),
  similarityScore: z.number(),
  bioExcerpt: z.string(),
});

const industryAlignmentSchema = z.object({
  category: z.string(),       // e.g. "Tech Innovator"
  displayName: z.string(),
  description: z.string(),
  similarityScore: z.number(),
});

const statsSchema = z.object({
  piCategoriesAboveAvg: z.number().int(),
  ciCategoriesAboveAvg: z.number().int(),
  strongestCategory: z.object({
    name: z.string(),
    percentile: z.number(),
  }),
  biggestGap: z.number(),     // difference between strongest and weakest
  corpusSize: z.number().int(),
});

// --- Main schema ---

const resultsPageDataSchema = z.object({
  applicant: z.object({
    displayName: z.string().nullable(),
    assessmentType: z.enum(["public", "admissions"]),
  }),
  overall: z.object({
    bqPercentile: z.number(),
    piHeadlinePercentile: z.number(),
    ciHeadlinePercentile: z.number(),
  }),
  piCategories: z.array(categoryScoreSchema), // 5 items
  ciCategories: z.array(categoryScoreSchema), // 5 items
  archetype: archetypeSchema,
  signatureMoves: z.array(signatureMoveSchema),
  rarestMove: rarestMoveSchema.nullable(),
  growthEdges: z.array(growthEdgeSchema),
  entrepreneurMatch: entrepreneurMatchSchema.nullable(),
  industryAlignment: z.array(industryAlignmentSchema),
  stats: statsSchema,
  narrative: z.object({
    piSummary: z.string(),
    ciSummary: z.string(),
  }),
  // Future: personality, videoAnalysis
});

export type ResultsPageData = z.infer<typeof resultsPageDataSchema>;
export type CategoryScore = z.infer<typeof categoryScoreSchema>;
// ... etc
```

### 2.6 New Query File

`src/lib/queries/results.ts` -- follows the exact pattern from `vignettes.ts`:
- `import "server-only"`
- `createServiceClient()` per call
- Explicit column selection
- Returns typed result or null

---

## 3. Section-by-Section Specification

Each section is a full-viewport component (`min-h-[100svh]`) with `scroll-snap-align: start`.

### Section 1: The Reveal

- **Data**: `applicant.displayName`, `overall.bqPercentile`
- **Visual**: Name fades in -> "Your Builder's Quotient" -> number counts up from 0 with glow effect -> contextual tagline
- **Component**: `ResultsReveal.tsx`
- **Animation**: Staggered entrance (name -> title -> number -> tagline). Number uses spring physics for the count-up.
- **Edge case**: If `displayName` is null, skip to "Your Builder's Quotient" without name.
- **Responsive**: Number scales from `text-fluid-5xl` (mobile) to larger on desktop.

### Section 2: Your Archetype

- **Data**: `archetype` (derived server-side from strongest category across PI + CI)
- **Visual**: Bold archetype name, icon/illustration, one-liner description, the category it's based on.
- **Component**: `ArchetypeReveal.tsx`

**Archetype system** (10 base archetypes, one per category):

| Strongest Category | Archetype | Tagline |
|---|---|---|
| Diagnosing the Situation | The Diagnostician | You see the real problem before anyone else does |
| Reasoning Through Options | The Systems Thinker | You map every path before choosing one |
| Taking Action | The Operator | You move while others are still planning |
| People & Relationships | The People Reader | You understand what drives the people around you |
| Meta-Reasoning | The Philosopher | You think about how you think |
| Observing and Noticing | The Pattern Spotter | You see what everyone else overlooks |
| Reframing and Connecting | The Reframer | You find opportunity where others see obstacles |
| Articulating the Opportunity | The Opportunity Architect | You define the future in concrete terms |
| Evaluating and Stress-Testing | The Stress Tester | You find the fatal flaw before it finds you |
| Communicating the Vision | The Storyteller | You make people believe in what doesn't exist yet |

**Tie-breaking**: If multiple categories tie, prefer PI categories (more grounded in the assessment), then by order listed above.

**Hybrid archetypes** (future): When top-2 categories are within 5 percentile points, combine labels (e.g., "The Diagnostic Operator").

**Edge case**: If all categories are within 10 points of each other, use "The Renaissance Builder" -- evenly balanced.

### Section 3: Practical Intelligence Radar

- **Data**: `piCategories` (5 items with percentiles + entrepreneur comparison stats)
- **Visual**: Animated radar/spider chart -- student profile in electric blue overlaid on entrepreneur average in muted grey. Each axis labeled.
- **Component**: `IntelligenceRadar.tsx` (shared between PI and CI with different props/colors)
- **Animation**: Chart draws from center outward on scroll-into-view. Entrepreneur baseline appears first (subtle), then student profile grows over it.
- **Interaction**: Tap/hover a category vertex to see percentile number + "Top X%" callout.
- **Responsive**: Chart fills ~70% viewport on mobile, sits alongside descriptive text on desktop.
- **Accessibility**: Fallback table with the same data for screen readers, hidden visually.
- **Library**: Build with SVG + Framer Motion (no charting library dependency). Keep it minimal.

### Section 4: Creative Intelligence Radar

- **Data**: `ciCategories`
- **Visual**: Same radar component, gold/bronze accent instead of blue.
- **Component**: Reuses `IntelligenceRadar.tsx` with `variant="creative"` prop.
- **Desktop layout**: Side-by-side with PI radar for comparison. Mobile: stacked, CI below PI.

### Section 5: Your Signature Moves

- **Data**: `signatureMoves[]` (pre-filtered server-side, no move keys exposed)
- **Visual**: Horizontal scrollable card stack. Each card: move description, category tag pill, rarity stat ("Only 18% of entrepreneurs do this").
- **Component**: `SignatureMoves.tsx`
- **Animation**: Cards stagger in from the right.
- **Edge cases**:
  - 0 signature moves -> section hidden entirely
  - 1 move -> single spotlight card (no scroll)
  - 6+ moves -> cap at 5 most impressive
- **Responsive**: Horizontal scroll on mobile, grid on desktop.

### Section 6: The Rarest Thing You Did

- **Data**: `rarestMove` (single item, pre-computed server-side)
- **Visual**: Full-screen dramatic spotlight. Big fraction stat ("1 in 8 entrepreneurs think this way"), the description, why it matters.
- **Component**: `RarestMove.tsx`
- **Animation**: Number counts up, text reveals word-by-word.
- **Edge case**: If null (no present moves at all -- theoretically impossible but guard against it), skip section.

### Section 7: Your Growth Edge

- **Data**: `growthEdges[]` (pre-filtered, max 3)
- **Visual**: Cards with growth-oriented framing. Header: "Your Next Unlock". Each card: description + category name + "Most entrepreneurs (X%) demonstrate this".
- **Component**: `GrowthEdge.tsx`
- **Animation**: Cards fade up in sequence.
- **Edge case**: If 0 gaps, show a congratulatory message instead ("You covered all the bases").
- **Tone**: Encouraging, not critical. "Here's where the edge is" not "Here's what you got wrong".

### Section 8: The Comparison Grid

- **Data**: `overall`, `piCategories`, `ciCategories`
- **Visual**: Two-column layout: "You" vs "274 Entrepreneurs". Animated horizontal bars for PI headline, CI headline, and each category. Numbers animate on scroll.
- **Component**: `ComparisonGrid.tsx`
- **Animation**: Bars grow from left simultaneously, with slight stagger.
- **Callouts**: Auto-generate 1-2 highlight lines ("Your people instincts are sharper than 87% of the entrepreneurs we studied").
- **Responsive**: Full-width bars on mobile, two-column stat pairs on desktop.

### Section 9: Entrepreneur Match

- **Data**: `entrepreneurMatch` (name, companies, industries, category, similarity score, bio excerpt)
- **Visual**: "You think most like..." with entrepreneur card. Their name large, companies below, industry pills, category badge, similarity percentage, brief bio.
- **Component**: `EntrepreneurMatch.tsx`
- **Algorithm** (to be built in Python pipeline): Cosine similarity between student's 10-category percentile vector (5 PI + 5 CI) and each entrepreneur's profile vector. Return top match.
- **No photos**: Use a stylized initial/monogram or category-specific abstract icon instead.
- **Edge case**: If matching pipeline hasn't run yet, skip this section entirely. Show "Coming soon" in a future version.
- **Future**: Show top 3 matches with #1 featured.

### Section 10: Profile Shape

- **Data**: `piCategories`, `ciCategories` (the 10 category percentile values)
- **Visual**: A visual "fingerprint" -- 10 vertical bars or a circular radial chart representing category strengths. Color-coded by PI (blue) and CI (gold). Creates a unique visual pattern per person.
- **Component**: `ProfileShape.tsx`
- **Animation**: Bars/segments grow from zero on scroll.
- **Tagline**: "No two profiles look the same".
- **Responsive**: Horizontal bar chart on mobile, radial/circular on desktop.

### Section 11: Industry Alignment

- **Data**: `industryAlignment[]` (8 entrepreneur categories ranked by similarity)
- **Visual**: Ranked list/pills showing which entrepreneur categories the student's profile most resembles. Top 2-3 highlighted with descriptions.
- **Component**: `IndustryAlignment.tsx`

**Category descriptions** (hardcoded display names + one-liners):

| Category | Description |
|---|---|
| Tech Innovator | Builders who solve problems with technology |
| Consumer Brand Builder | Creators of products people love |
| Small Business | The backbone of local economies |
| Social Entrepreneur | Mission-driven change makers |
| Faith-Driven | Purpose-led builders |
| Venture Investor | The ones who spot potential in others |
| AI/ML Founder | Pushing the frontier of intelligence |
| International Entrepreneur | Building across borders and cultures |

- **Edge case**: If alignment pipeline hasn't run, skip section.

### Section 12: By the Numbers

- **Data**: `stats` (pre-computed server-side)
- **Visual**: Masonry grid of stat cards. Each card: big number + descriptive line.
- **Component**: `QuickStats.tsx`
- **Stats**:
  - Total PI categories above entrepreneur average (e.g., "4 of 5 PI categories above average")
  - Total CI categories above entrepreneur average
  - Strongest category name + percentile
  - Biggest gap between strongest and weakest
  - Corpus size comparison ("Compared against 274 real entrepreneurs")
- **Animation**: Numbers count up, cards stagger in.
- **Responsive**: 1-col on mobile, 2-col on tablet, 3-col on desktop.

### Section 13: Strengths Narrative

- **Data**: `narrative.piSummary`, `narrative.ciSummary`
- **Visual**: AI-generated summary text, typeset beautifully. Pull-quote style with key phrases highlighted in accent color. Separated into PI and CI sections.
- **Component**: `NarrativeSummary.tsx`
- **Animation**: Text fades in paragraph by paragraph.
- **Edge case**: If summary is empty/null, skip section.
- **Styling**: `max-w-2xl mx-auto`, generous line-height, `font-display` for pull quotes.

### Section 14: Share Card + CTA

- **Data**: `applicant.displayName`, `overall.bqPercentile`, `archetype`
- **Visual**: Preview of the OG share card. Share buttons (Copy link, X/Twitter, LinkedIn). Primary CTA: "Learn about ACU's entrepreneurship program". Secondary: "Challenge a friend".
- **Component**: `ShareSection.tsx`
- **Share mechanics**:
  - Copy link: `navigator.clipboard.writeText()` with toast confirmation
  - Twitter/X: `https://twitter.com/intent/tweet?text=...&url=...`
  - LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=...`
  - Native share (mobile): `navigator.share()` if available, fallback to buttons
- **OG image**: Generated at `/api/og/results/[token]/route.tsx` using `@vercel/og`. Shows: archetype name, BQ percentile, mini radar chart, ACU branding.

---

## 4. Dynamic OG Image

- **Route**: `src/app/api/og/results/[token]/route.tsx`
- **Tech**: `@vercel/og` (ImageResponse)
- **Content**: 1200x630 image with dark background, applicant name (if available), BQ percentile, archetype name + tagline, simplified radar silhouette, ACU logo.
- **Caching**: `Cache-Control: public, max-age=86400` (24h -- scores don't change).
- **Fallback**: If token is invalid, return a generic BQ branded image.

---

## 5. Loading & Performance Strategy

### 5.1 Route Structure

```
src/app/results/[token]/
  |-- page.tsx          # Server component: fetch + filter + compute
  |-- loading.tsx       # Streaming fallback (skeleton)
  |-- not-found.tsx     # Invalid token
  |-- error.tsx         # Runtime error boundary
```

### 5.2 Server Component Data Flow

`page.tsx` is an async server component that:
1. Validates the token format
2. Queries applicant by `results_token`
3. Queries session + responses with `scoring_result IS NOT NULL`
4. Extracts and aggregates scoring data (averaging across 2 PI + 2 CI responses)
5. Computes archetype, signature moves, growth edges, stats (all server-side)
6. Security-filters the data (strips move keys, raw frequencies, etc.)
7. Passes a single `ResultsPageData` prop to the client component

### 5.3 Client Component

A single `ResultsExperience.tsx` client component that receives all data as props. No client-side fetching. This is pure presentation + animation.

### 5.4 Performance

- **Scroll snap**: `scroll-snap-type: y mandatory` on the container, `scroll-snap-align: start` on each section.
- **Lazy sections**: Only the first 3 sections render immediately. Remaining sections use intersection-based lazy mounting.
- **SVG radar charts**: No charting library -- pure SVG + Framer Motion. Keeps bundle tiny.
- **Font optimization**: Already using `next/font` with Inter + Inter Tight.
- **Image optimization**: OG card is the only image -- generated on-demand, cached.
- **Bundle**: Target <50kB additional JS for the results page (Framer Motion is already loaded site-wide).
- **Streaming**: `loading.tsx` shows a branded skeleton while the server component fetches data.

### 5.5 Skeleton State

A beautiful loading state with:
- Pulsing BQ logo or wordmark
- Subtle animated gradient background
- "Preparing your results..." text
- Same dark aesthetic as the real page

---

## 6. Dummy Data Strategy

Create `src/lib/assessment/dummy-results.ts` with realistic fake data:

- A `generateDummyResults()` function that returns a complete `ResultsPageData` object
- Realistic percentile distributions (not all 50s or all 99s)
- 2-3 signature moves, 1-2 growth edges
- A real entrepreneur name from the corpus for the match
- Plausible narrative text

**Development workflow:**
1. Build all components against dummy data
2. Wire up the real query pipeline later
3. Toggle via environment variable: `NEXT_PUBLIC_USE_DUMMY_RESULTS=true`
4. Or more simply: if `scoring_result` is null on responses, fall back to dummy data in development only

---

## 7. Implementation Phases

### Phase A: Foundation (build first)

- [x] Create `RESULTS.md` document (this file)
- [ ] Create `src/lib/schemas/results.ts` with all Zod schemas
- [ ] Create `src/lib/assessment/dummy-results.ts` with fake data generator
- [ ] Create route skeleton: `src/app/results/[token]/page.tsx` (server component with dummy data)
- [ ] Create `ResultsExperience.tsx` shell (client component, scroll-snap container)
- [ ] Create `loading.tsx`, `not-found.tsx`, `error.tsx`

### Phase B: Core Sections

- [ ] Section 1: `ResultsReveal.tsx` (score counter animation)
- [ ] Section 2: `ArchetypeReveal.tsx` (archetype system + display)
- [ ] Sections 3 + 4: `IntelligenceRadar.tsx` (SVG radar chart, shared for PI/CI)
- [ ] Section 14: `ShareSection.tsx` (share buttons + CTA)

### Phase C: Detail Sections

- [ ] Section 5: `SignatureMoves.tsx` (horizontal card scroll)
- [ ] Section 6: `RarestMove.tsx` (spotlight)
- [ ] Section 7: `GrowthEdge.tsx` (growth cards)
- [ ] Section 8: `ComparisonGrid.tsx` (animated bars)

### Phase D: Data Sections

- [ ] Section 9: `EntrepreneurMatch.tsx` (needs Python pipeline work)
- [ ] Section 10: `ProfileShape.tsx` (visual fingerprint)
- [ ] Section 11: `IndustryAlignment.tsx` (needs matching pipeline)
- [ ] Section 12: `QuickStats.tsx` (stat cards)
- [ ] Section 13: `NarrativeSummary.tsx` (styled text)

### Phase E: Polish & Infrastructure

- [ ] Dynamic OG image generation (`@vercel/og`)
- [ ] Real query pipeline (`src/lib/queries/results.ts`)
- [ ] Swap dummy data for real data
- [ ] Scroll performance tuning
- [ ] Mobile polish (safe areas, viewport units, touch interactions)
- [ ] Accessibility audit (screen reader flow, reduced motion, contrast)

### Phase F: Future Extensions

- [ ] Personality radar (7 dimensions + Grit)
- [ ] Composite BQ score (intelligence + personality blend)
- [ ] Video presence analysis results
- [ ] Personality-based entrepreneur match
- [ ] "Challenge a friend" viral sharing flow

---

## 8. File Inventory

### New files to create

| File | Purpose |
|---|---|
| `src/app/results/[token]/page.tsx` | Server component: data fetch + filter |
| `src/app/results/[token]/loading.tsx` | Streaming skeleton |
| `src/app/results/[token]/not-found.tsx` | Invalid/expired token |
| `src/app/results/[token]/error.tsx` | Runtime error boundary |
| `src/app/api/og/results/[token]/route.tsx` | Dynamic OG image |
| `src/components/results/ResultsExperience.tsx` | Client shell (scroll container) |
| `src/components/results/ResultsReveal.tsx` | Section 1: score reveal |
| `src/components/results/ArchetypeReveal.tsx` | Section 2: archetype |
| `src/components/results/IntelligenceRadar.tsx` | Sections 3+4: radar chart |
| `src/components/results/SignatureMoves.tsx` | Section 5: rare moves |
| `src/components/results/RarestMove.tsx` | Section 6: spotlight |
| `src/components/results/GrowthEdge.tsx` | Section 7: growth areas |
| `src/components/results/ComparisonGrid.tsx` | Section 8: you vs entrepreneurs |
| `src/components/results/EntrepreneurMatch.tsx` | Section 9: most similar |
| `src/components/results/ProfileShape.tsx` | Section 10: visual fingerprint |
| `src/components/results/IndustryAlignment.tsx` | Section 11: category ranking |
| `src/components/results/QuickStats.tsx` | Section 12: stat cards |
| `src/components/results/NarrativeSummary.tsx` | Section 13: AI narrative |
| `src/components/results/ShareSection.tsx` | Section 14: share + CTA |
| `src/lib/schemas/results.ts` | Zod schemas for results data |
| `src/lib/queries/results.ts` | Server-only query functions |
| `src/lib/assessment/dummy-results.ts` | Fake data for development |
| `src/lib/assessment/archetypes.ts` | Archetype derivation logic |

### Existing files to modify

| File | Change |
|---|---|
| `src/app/layout.tsx` | Add OG metadata for results pages |
| `package.json` | Add `@vercel/og` dependency |

---

## 9. Verification Checklist

**After creating this document:**
- [x] Comprehensive enough to start building from
- [x] Section data requirements cross-referenced against Python `ScoringResult` schema
- [x] Security filtering rules match ROADMAP section 8 constraints
- [x] Dummy data strategy allows independent frontend development
- [ ] `npm run build` passes (document-only change)

**When implementation begins (Phase A):**
- [ ] `npm run build` passes with the new route
- [ ] `/results/test-token` renders the dummy data experience
- [ ] All 14 sections scroll correctly with snap behavior
- [ ] `prefers-reduced-motion` disables animations
- [ ] Mobile viewport renders correctly (test at 375px width)
