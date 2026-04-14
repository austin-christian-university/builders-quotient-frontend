# Entrepreneur Archetype Explorer

## Purpose

A public-facing, top-of-funnel marketing tool. Visitors browse 16 entrepreneur archetypes, explore real entrepreneur cognitive profiles, and get curious enough to take the BQ assessment themselves. The conversion goal: browse archetypes/entrepreneurs -> want to know their own type -> sign up.

Think "Which entrepreneur thinks like you?" -- but backed by real data from 248 analyzed entrepreneurs across 220 industries.

## Data Source

The `entrepreneurs` table has been backfilled with archetype classifications for every entrepreneur (~248 of ~280) who has both PI and CI global profiles.

### New columns on `entrepreneurs`

| Column | Type | Description |
|--------|------|-------------|
| `archetype_key` | text | Machine-readable key, e.g. `analytical_exploratory__insight_market` |
| `archetype_name` | text | Human-readable name, e.g. "The Pathfinder" |
| `archetype_tagline` | text | One-line hook, e.g. "Sees what others miss and knows where it leads" |
| `archetype_description` | text | 2-3 sentence description |
| `pi_style` | text | PI quadrant label, e.g. `analytical_exploratory` |
| `ci_style` | text | CI quadrant label, e.g. `insight_market` |
| `pi_d1_score` | float | Analytical(+) vs Interpersonal(-) dimension score |
| `pi_d2_score` | float | Exploratory(+) vs Decisive(-) dimension score |
| `ci_d1_score` | float | Insight(+) vs Validation(-) dimension score |
| `ci_d2_score` | float | Market(+) vs Process(-) dimension score |
| `pi_category_scores` | jsonb | 12-category PI scores (for radar charts) |
| `ci_category_scores` | jsonb | 12-category CI scores (for radar charts) |
| `archetype_variant` | text | Always "balanced" -- ignore in UI |
| `archetype_assigned_at` | timestamptz | When assignment was made |

### Classification system

Each domain (PI and CI) is reduced to 2 bipolar dimensions from 12 category scores:

**PI dimensions:**
- D1: Analytical (+) vs Interpersonal (-) -- Situation Diagnosis, Constraint Analysis vs People & Stakeholders, Communication Strategy
- D2: Exploratory (+) vs Decisive (-) -- Information Gathering, Option Generation vs Decision Architecture, Action Planning

**CI dimensions:**
- D1: Insight (+) vs Validation (-) -- Pattern Recognition, Reframing vs Validation & Testing, Risk & Feasibility
- D2: Market (+) vs Process (-) -- Market Research, Customer Insight vs Creative Confidence, Meta-Creative Thinking

Each dimension >= 0 maps to the positive pole, < 0 to the negative. 2x2 per domain = 4 PI styles x 4 CI styles = 16 archetypes.

### The 16 archetypes

| Name | Tagline | PI Style | CI Style |
|------|---------|----------|----------|
| The Pathfinder | Sees what others miss and knows where it leads | Analytical-Exploratory | Insight-Market |
| The Theorist | Maps the invisible structures behind breakthroughs | Analytical-Exploratory | Insight-Process |
| The Cartographer | Charts new territory with evidence in hand | Analytical-Exploratory | Validation-Market |
| The Prospector | Digs deep, tests everything, finds real gold | Analytical-Exploratory | Validation-Process |
| The Strategist | Turns sharp insight into decisive market moves | Analytical-Decisive | Insight-Market |
| The Catalyst | Applies analytical precision to ignite creative change | Analytical-Decisive | Insight-Process |
| The Optimizer | Finds the highest-leverage path and executes it | Analytical-Decisive | Validation-Market |
| The Sentinel | Guards quality with analytical rigor and disciplined execution | Analytical-Decisive | Validation-Process |
| The Luminary | Inspires new possibilities by illuminating what people need | Interpersonal-Exploratory | Insight-Market |
| The Weaver | Connects people and ideas into unexpected combinations | Interpersonal-Exploratory | Insight-Process |
| The Navigator | Guides ventures forward by reading people and markets | Interpersonal-Exploratory | Validation-Market |
| The Steward | Nurtures ideas through careful cultivation and testing | Interpersonal-Exploratory | Validation-Process |
| The Torchbearer | Champions bold visions with the conviction to rally others | Interpersonal-Decisive | Insight-Market |
| The Alchemist | Transforms creative intuition into tangible results through people | Interpersonal-Decisive | Insight-Process |
| The Builder | Constructs lasting ventures by understanding people and validating markets | Interpersonal-Decisive | Validation-Market |
| The Anchor | Grounds teams in reality with steadfast judgment and proven methods | Interpersonal-Decisive | Validation-Process |

### Current distribution (from data analysis)

| Archetype | Count | % |
|-----------|-------|---|
| The Pathfinder | 122 | 49.2% |
| The Luminary | 72 | 29.0% |
| The Strategist | 25 | 10.1% |
| The Torchbearer | 16 | 6.5% |
| The Weaver | 3 | 1.2% |
| The Theorist | 3 | 1.2% |
| The Catalyst | 3 | 1.2% |
| The Navigator | 2 | 0.8% |
| The Optimizer | 1 | 0.4% |
| The Builder | 1 | 0.4% |
| The Cartographer | 0 | 0% |
| The Prospector | 0 | 0% |
| The Sentinel | 0 | 0% |
| The Steward | 0 | 0% |
| The Alchemist | 0 | 0% |
| The Anchor | 0 | 0% |

6 of 16 archetypes have zero entrepreneurs. This is a feature, not a bug -- it's a storytelling opportunity.

### Key data insights (for hero stats)

- **98.4% are insight-driven creators** (CI D1 >= 0). Almost no successful entrepreneur defaults to "test first" creativity.
- **81.5% are exploratory problem-solvers** (PI D2 >= 0). Entrepreneurs overwhelmingly prefer keeping options open.
- **People & Stakeholders is the #1 differentiator** among entrepreneurs -- highest coefficient of variation (0.226) of any PI category. Some are deeply people-oriented, others barely register it.
- **49% are Pathfinders** -- nearly half of all entrepreneurs share the same cognitive archetype.
- **Situation Diagnosis is table stakes** -- highest average score (0.59) and lowest variance. Every entrepreneur does this well.
- **220 industries** represented across the corpus.

### Category score JSON shape

`pi_category_scores` -- 12 keys:
```json
{
  "Situation Diagnosis": 0.087,
  "Information Gathering": 0.112,
  "Constraint Analysis": 0.065,
  "Option Generation": 0.094,
  "Tradeoff Evaluation": 0.078,
  "Risk Assessment": 0.103,
  "Decision Architecture": 0.055,
  "Action Planning": 0.071,
  "People & Stakeholders": 0.091,
  "Communication Strategy": 0.068,
  "Emotional & Values Reasoning": 0.082,
  "Meta-Cognition": 0.094
}
```

`ci_category_scores` -- 12 keys: Pattern Recognition & Observation, Information Seeking & Market Research, Customer & Market Insight, Reframing & Category Innovation, Cross-Domain Connection, Opportunity Articulation, Validation & Testing Strategy, Risk & Feasibility Evaluation, Timing & Context Assessment, Creative Confidence & Persistence, Vision Communication, Meta-Creative Thinking.

### Radar chart scaling

Values are raw probabilities (typically 0.03-0.15). Scale to corpus max -- query all entrepreneurs, find the max value per category, use that as the ceiling. Do NOT use a fixed 0-1 scale or charts will be flat and unreadable.

---

## Routes

All routes live under `src/app/(marketing)/`:

- `/entrepreneurs` -- Archetype Explorer (landing/overview)
- `/entrepreneurs/archetype/[archetype_key]` -- Archetype Detail page
- `/entrepreneurs/[id]` -- Individual Entrepreneur Profile

---

## Page 1: Archetype Explorer (`/entrepreneurs`)

### Hero section

- **Headline:** "How do the world's top entrepreneurs think?"
- **Subhead:** Framing the corpus -- "We analyzed 248 entrepreneurs across 220 industries to map how they reason and create."
- **Stat callouts:** 3-4 glassmorphic cards with key findings:
  - "98% are insight-driven creators" -- entrepreneurs lead with intuition, not validation
  - "People skills are the #1 differentiator" -- the category with the most variance
  - "49% are Pathfinders" -- nearly half share one archetype
  - "6 archetypes have zero entrepreneurs" -- teaser for the grid
- **CTA button:** "Discover your archetype" -> assessment signup

### 4x4 Archetype Grid

A visual 4x4 grid showing all 16 archetypes.

- **Rows** = PI styles: Analytical-Exploratory, Analytical-Decisive, Interpersonal-Exploratory, Interpersonal-Decisive
- **Columns** = CI styles: Insight-Market, Insight-Process, Validation-Market, Validation-Process
- **Populated cells** (10): archetype name, tagline, entrepreneur count. Subtle glow intensity proportional to count (Pathfinder glows brightest). Clicking navigates to `/entrepreneurs/archetype/[key]`.
- **Empty cells** (6): dimmed/ghosted treatment. Label like "No entrepreneurs found with this profile." Leans into the narrative -- "What kind of entrepreneur is almost unheard of?" These are not clickable.
- Row and column headers use plain-language labels (e.g., "Analytical & Exploratory" not `analytical_exploratory`).

### Scatter Plots

Two side-by-side 2x2 scatter plots below the grid:

- **PI plot:** X-axis = D1 (Analytical <-> Interpersonal), Y-axis = D2 (Exploratory <-> Decisive). All ~248 entrepreneurs as dots.
- **CI plot:** X-axis = D1 (Insight <-> Validation), Y-axis = D2 (Market <-> Process).
- Dots colored by archetype (use a palette derived from the primary blue and secondary gold, ensuring color-blind friendliness).
- Hover shows entrepreneur name. Click navigates to `/entrepreneurs/[id]`.
- Quadrant labels explain axes in plain language.
- These serve as credibility signals -- "this is real data." They should look polished.
- Client components using SVG, same approach as existing `RadarChart`.

### Bottom CTA

"Which archetype are you?" -> assessment signup.

---

## Page 2: Archetype Detail (`/entrepreneurs/archetype/[archetype_key]`)

### Header

- **Archetype name** (large): "The Pathfinder"
- **Tagline:** "Sees what others miss and knows where it leads"
- **Description paragraph** from `archetype_description`
- **Two badges:** PI style in plain language ("Analytical & Exploratory thinker") + CI style ("Insight & Market-driven creator")
- **Count:** "122 entrepreneurs share this archetype"

### Average Radar Charts

Two radar charts side by side: PI (12 categories) and CI (12 categories).

- **Primary polygon** = average `pi_category_scores` / `ci_category_scores` across all entrepreneurs with this `archetype_key`
- **Corpus polygon** (dashed) = average across all 248 entrepreneurs -- shows what makes this type different
- Scaled to corpus max per category
- Reuses existing `RadarChart` component with `corpusScores` prop
- Brief narrative below explaining what the radar shape reveals -- computed from which categories are notably above or below corpus average

### Entrepreneur Grid

Card grid of entrepreneurs in this archetype:

- Each card: entrepreneur name, industries (as small tags)
- Clickable -> `/entrepreneurs/[id]`

### CTA

"Are you a Pathfinder? Take the assessment to find out." -> assessment signup.

---

## Page 3: Entrepreneur Profile (`/entrepreneurs/[id]`)

Single long-scroll page. No slide navigation.

### Hero Header

- Entrepreneur name (large display text)
- Industries as subtle tags
- Bio narrative (from `bio_narrative`) if available
- **Archetype badge:** "The Pathfinder" -- clickable, links back to archetype detail page
- Archetype tagline underneath

### Cognitive Profile -- Radar Charts

Two radar charts, **stacked vertically** (large enough to read on the scroll page):

- **PI radar** (12 categories): this entrepreneur's scores as primary polygon
- **CI radar** (12 categories): same treatment
- Optional overlay: archetype average as a comparison trace (dashed)
- Scaled to corpus max
- Reuses existing `RadarChart` component

### Quadrant Position

Two small 2x2 scatter plots showing where this entrepreneur sits relative to all others:

- **PI plot:** all entrepreneurs as small dots, this entrepreneur as a larger glowing dot
- **CI plot:** same treatment
- Axes labeled in plain language (Analytical <-> Interpersonal, etc.)
- Coordinates from `pi_d1_score`/`pi_d2_score` and `ci_d1_score`/`ci_d2_score` (continuous floats centered around 0, typically -0.03 to +0.03)

### CTA Footer

"See how you compare -- take the Builder's Quotient assessment" -> signup.

---

## Data Access Patterns

```sql
-- All entrepreneurs with archetypes (explorer page: grid, scatter, stats, corpus max)
SELECT id, name, archetype_key, archetype_name, archetype_tagline,
       pi_style, ci_style, pi_d1_score, pi_d2_score, ci_d1_score, ci_d2_score,
       pi_category_scores, ci_category_scores, industries
FROM entrepreneurs
WHERE archetype_key IS NOT NULL

-- Distribution counts (grid cell counts)
SELECT archetype_key, archetype_name, archetype_tagline, pi_style, ci_style, COUNT(*) as count
FROM entrepreneurs
WHERE archetype_key IS NOT NULL
GROUP BY archetype_key, archetype_name, archetype_tagline, pi_style, ci_style

-- Entrepreneurs for a specific archetype
SELECT id, name, industries, bio_narrative, archetype_name, archetype_tagline,
       pi_category_scores, ci_category_scores
FROM entrepreneurs
WHERE archetype_key = :archetype_key

-- Single entrepreneur detail
SELECT id, name, industries, bio_narrative, archetype_key, archetype_name,
       archetype_tagline, archetype_description, pi_style, ci_style,
       pi_d1_score, pi_d2_score, ci_d1_score, ci_d2_score,
       pi_category_scores, ci_category_scores
FROM entrepreneurs
WHERE id = :id
```

For radar chart corpus-max scaling: fetch all `pi_category_scores` and `ci_category_scores`, compute the max value per category across all entrepreneurs, use those as axis ceilings.

---

## Component Architecture

### New components (`src/components/entrepreneurs/`)

| Component | Type | Purpose |
|-----------|------|---------|
| `ArchetypeGrid.tsx` | Client | 4x4 interactive grid with populated/empty cell states |
| `ScatterPlot.tsx` | Client | 2x2 quadrant scatter plot, SVG-based, hover/click interaction |
| `StatCard.tsx` | Server or Client | Glassmorphic stat callout card for hero section |
| `EntrepreneurCard.tsx` | Server | Card for entrepreneur grids on archetype detail pages |
| `ArchetypeBadge.tsx` | Server | Reusable archetype name + tagline badge |

### New data layer (`src/lib/queries/entrepreneurs.ts`)

Server-only module using `createServiceClient()`, following the pattern of `src/lib/queries/results.ts`:

- `getArchetypeExplorerData()` -- all entrepreneurs with archetypes + computed stats + corpus max scores
- `getArchetypeDetail(archetypeKey)` -- entrepreneurs in that archetype + averaged category scores + corpus averages
- `getEntrepreneurProfile(id)` -- single entrepreneur with full data + corpus max + archetype averages
- `getCorpusMaxScores()` -- shared helper computing per-category max across all entrepreneurs

### Reused components

- `RadarChart` from `src/components/results/RadarChart.tsx` -- already supports `corpusScores`, `maxValue`, `gridStyle`, `dotColors` props. Works as-is.
- `Footer` and marketing `layout.tsx`

### No new dependencies

Scatter plots and archetype grid use vanilla SVG + Framer Motion for transitions, matching the existing RadarChart approach.

---

## Styling

Follows DESIGN.md:

- Dark glassmorphism aesthetic: `#0a0a0c` base background, `#111113` elevated surfaces
- Primary accent: `#4da3ff` (blue) for interactive elements, CTAs
- Secondary accent: `#e9b949` (gold) for highlights, achievement moments
- Cards: `rounded-2xl` (16px radius), semi-transparent borders
- Typography: Inter Tight for display/headings, Inter for body
- Motion: expo-out easing `cubic-bezier(0.16, 1, 0.3, 1)`, honor `prefers-reduced-motion`
- Max content width: 1280px (`max-w-7xl`)
- Stat cards: glassmorphic treatment with subtle backdrop blur and border glow

---

## Edge Cases

- ~25 entrepreneurs without archetypes: excluded from all views. No error states needed.
- 6 empty archetypes: shown in grid with dimmed treatment, not clickable.
- Missing `bio_narrative`: hide the bio section on the profile page. Name and archetype always present.
- Missing `industries`: hide the tags row.
- Archetype detail page for an empty archetype: return 404 (these are not navigable from the grid since empty cells are not linked).
- Invalid entrepreneur ID: return 404.
- Invalid archetype key: return 404.

---

## Future Considerations (out of scope)

- Student-to-entrepreneur comparison: "You're a Pathfinder, just like Sara Blakely." (Students get classified into the same 16 archetypes via `assessment_sessions`.)
- Search/filter on the explorer page.
- `archetype_variant` field (always "balanced" for now).
- Entrepreneur photos (not currently in the database).
