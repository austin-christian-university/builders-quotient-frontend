# Results Page Redesign — "Builder Profile"

**Date:** 2026-03-10
**Status:** Approved

## Problem

The current results page quantifies everything: BQ percentage, PI/CI headline scores, category percentages, cosine similarity percentages, stats grids. This creates two risks:
1. Over-inflated users quit their jobs thinking they'll be successful entrepreneurs
2. Under-performing users feel defeated by a number

The results should be **life-giving but realistic** — qualitative, identity-first, with honest strengths and growth areas grounded in real entrepreneur context.

## Design Philosophy

- **No numbers anywhere the user can see** — all quantitative data stays on the backend
- **Peer-relative shading** replaces explicit scales — faded entrepreneur corpus average polygon behind the student's polygon on all radar charts
- **Strengths & growth areas narratives** are the main vehicle for honesty — direct but encouraging, always tied to what real entrepreneurs with similar profiles did
- **Entrepreneur matches** provide hope and relatability — "people like you have succeeded"
- **Archetype + radar shape** = the shareable viral identity (like Enneagram types)

## Three Profile Domains

| Domain | Source | Categories | Radar Points | Strengths/Weaknesses | Entrepreneur Match | Runners-up |
|--------|--------|-----------|-------------|---------------------|-------------------|------------|
| **Intelligence** (PI + CI) | Vignette video responses scored against 200-move vectors | 12 per type (PI + CI) | 12-pt per type | Yes (PI + CI combined into one narrative) | Yes — reasoning vector similarity | Yes — 4 runners-up |
| **Communication Style** | Video response analysis (20-dim vector from `student_personality_profiles`) | 20 dimensions, grouped into 5 meta-categories for narrative | 20-pt | Yes | Yes — communication vector similarity | Yes — 4 runners-up |
| **Entrepreneur Personality** | Likert quiz (`personality_scores`) — admissions only | 8 facets (AM, RT, IN, AU, SE, ST, IL, GR) | 8-pt | Yes (lighter) | No — no entrepreneur comparison data | No |

**Note:** The backend table `student_personality_profiles` stores what the frontend calls "Communication Style." The naming difference is intentional — video analysis measures how someone presents and communicates, not their personality traits.

## Slide Flow

### Everyone (public + admissions)

| # | Slide | Description |
|---|-------|-------------|
| 1 | **Archetype Reveal** | Lead with identity. Large archetype name + tagline + brief description. No score. Based on strongest category across PI + CI. Background glow in domain color (blue=PI, gold=CI). This is the viral shareable hook. |
| 2 | **Reasoning Highlights** | Top 3–4 strongest intelligence categories with punchy one-liner taglines. Teaser/highlight reel before detailed radars. Text only, staggered entrance animation. |
| 3 | **Practical Intelligence Radar** | 12-point radar, blue accent. Student polygon + faded dashed corpus average polygon. Abbreviated category labels. No numbers. Eyebrow: "PRACTICAL INTELLIGENCE", Title: "Your Reasoning Profile". |
| 4 | **Creative Intelligence Radar** | Same structure as PI, gold accent. Eyebrow: "CREATIVE INTELLIGENCE", Title: "Your Thinking Profile". Its own 12 CI categories. |
| 5 | **Intelligence Strengths & Growth Areas** | Full narrative page. Strengths (top 3–4 categories): positive, concrete language about what it means in practice. Growth Areas (bottom 2–3 categories): honest but encouraging, tied to what entrepreneurs with similar profiles did about these gaps. Covers PI + CI combined. |
| 6 | **Reasoning Match + Runners-up** | "Your reasoning most resembles [Entrepreneur A]." Full entrepreneur card (name, bio, companies, industries). Dual radar overlay (student vs entrepreneur). Their strengths/weaknesses for relatability. Below: 4 runner-up entrepreneurs as tappable pills/mini-cards — tap to pop their full card in a modal with the same detail level. No similarity percentage. |
| 7 | **Communication Style Radar** | 20-point radar with peer-relative shading. Denser polygon = fingerprint-like quality. Teal accent (`#2dd4bf`). Eyebrow: "COMMUNICATION STYLE", Title: "How You Present & Connect". Labels handled carefully at 20 points (small or alternating). |
| 8 | **Communication Strengths & Growth Areas** | Same narrative pattern as intelligence. Narrative organized around the 5 meta-categories (Energy & Dynamism, Confidence & Authority, Warmth & Interpersonal, Communication Style, Self-Presentation) to keep it digestible even though radar shows all 20 dimensions. |
| 9 | **Communication Match + Runners-up** | "Your communication style most resembles [Entrepreneur B]." Could be a different person than reasoning match. Same card + dual radar + runners-up pattern as slide 6. |
| 10 | **Disclaimer** | Warm, honest framing. "This is a snapshot, not a verdict." Context about what assessment can/can't tell you. Encouragement: measures where you are now, not your ceiling. |
| 11 | **Share CTA** | Shareable card: archetype name + PI radar shape. "I'm The Diagnostician — discover your Builder Profile." Web Share API with clipboard fallback. Personality data NOT included in shareable card. |

### Admissions only (conditional — if personality quiz data exists in DB)

Inserted before the Disclaimer:

| # | Slide | Description |
|---|-------|-------------|
| 10a | **Entrepreneur Personality Radar** | 8-point radar with peer-relative shading. 8 facets: Ambition, Risk Tolerance, Innovativeness, Autonomy, Self-Efficacy, Stress Tolerance, Internal Locus of Control, Grit. Clean and readable. Brief contextual note: "Based on peer-reviewed research on traits correlated with entrepreneurial success." |
| 10b | **Personality Strengths & Growth Areas** | Lighter than intelligence/communication narratives — 2 strengths + 1–2 growth areas. Highly actionable facets. No entrepreneur match, no runners-up. |

And the Share CTA slide becomes **Share + Apply**:
- Shareable card (same as public — archetype + PI radar, no personality data)
- Personalized encouragement: "We've reviewed your results and we think you have the potential to be a high-performing builder. We'd love for you to apply."
- Apply to ACU CTA button

### Total slide counts
- **Public path:** 11 slides
- **Admissions with personality data:** 13 slides total (personality radar + personality strengths inserted before disclaimer; Share CTA becomes Share + Apply)

## Visual Design

### Radar Charts
- **12-point** for PI and CI (dodecagonal — distinctive profile shapes)
- **20-point** for Communication Style (near-circular, fingerprint-like)
- **8-point** for Entrepreneur Personality (clean octagonal)
- All use **peer-relative shading**: faded/dashed corpus average polygon behind the student's filled polygon
- No numerical labels, no scale tick marks, no axis values
- Concentric grid rings for visual reference (no labels on them)
- Student polygon: solid stroke + semi-transparent fill
- Corpus polygon: dashed stroke + very subtle fill

### Color Accents
- **PI:** Electric blue (`#4da3ff`)
- **CI:** Warm gold (`#e9b949`)
- **Communication Style:** Teal (`#2dd4bf`) — distinct from blue and gold, conveys connection/presence
- **Entrepreneur Personality:** Soft violet (`#a78bfa`) — distinct from all three above, conveys introspection/identity

### Entrepreneur Cards
- Glassmorphic card with entrepreneur name, bio snippet, companies, industries
- Dual radar overlay showing student vs. entrepreneur polygons
- Their strengths and weaknesses listed for relatability
- Runner-up pills/mini-cards below (4 additional matches)
- Tap runner-up → modal with full entrepreneur card

### Existing Patterns Retained
- Slideshow navigation (keyboard + arrows, mobile horizontal / desktop vertical)
- Framer Motion animations with `prefers-reduced-motion` support
- Glassmorphism, glow interactions, staggered entrances
- Progress indicator

## Data Requirements

### Already available
- `scoring_result.category_scores[]` — 12 category percentiles per vignette (PI + CI)
- `scoring_result.move_details[]` — 200 individual move statuses per vignette
- `student_personality_profiles.personality_vector` — 20-dim communication vector
- `personality_scores` — 8 facet scores from Likert quiz
- Entrepreneur matching with runners-up (existing query logic)
- Archetype derivation (existing, needs update for 12 categories)

### Needs backend work
- **Reasoning vector entrepreneur matching** — similarity between student's 200-move intelligence vector and entrepreneur reasoning vectors. May need scoring pipeline updates. Frontend data contract: a new `ReasoningMatch` type parallel to existing `EntrepreneurMatch`, containing `entrepreneurName`, `bioSnippet`, `companies[]`, `industries[]`, `studentCategoryScores[]` (12 PI categories), `entrepreneurCategoryScores[]` (12 PI categories), `topSharedStrengths[]`, `biggestDifferences[]`, `runnersUp[]` (4 entries with full card data). Until backend is ready, slide 6 is stubbed — show a placeholder card with "Reasoning match coming soon."
- **Corpus average polygons** — need aggregated category-level averages across the entrepreneur corpus for each domain (PI, CI, communication). Likely derivable from existing `situation_type_distributions.category_distributions` (which contain `mean` per category). If unavailable, render only the student polygon (no corpus overlay) as graceful degradation.
- **Runner-up full data** — current query only fetches name + similarity for runners-up; need full card data (bio, companies, vector) for the modal interaction. Fetch strategy: eager-load all 5 matches (primary + 4 runners-up) in the initial query to avoid modal loading states. If data is too heavy, lazy-load on tap with a skeleton card in the modal.

### Narrative generation strategy

Strengths/weaknesses narratives (slides 5, 8, 10b) are **templated client-side** from category score rank order:
- Sort categories by score descending
- Top 3–4 = strengths, bottom 2–3 = growth areas
- Each category has a pre-written template bank: one strength description and one growth-area description
- Template content lives in a `src/lib/assessment/narrative-templates.ts` file (new)
- Example: if "People & Stakeholders" is a top category, the strength template might read: "You instinctively read interpersonal dynamics and build coalitions — a hallmark of founders who scale through people, not just product."
- Growth area templates include entrepreneur context: "Entrepreneurs with lower [category] scores often compensate by [specific strategy]."
- Fallback: if no template exists for a category, show the category name without narrative text (just the radar carries the weight)

### Needs separate design pass
- **Archetype taxonomy** — the 12-category archetype mapping exists in `archetypes.ts` but the archetype names, taglines, and descriptions should be reviewed for quality and tone alignment with the new "life-giving" results philosophy.

## Out of Scope
- Social media sharing integration (future — Web Share API sufficient for now)
- BQ score or any numerical quantification on the frontend
- Combined/merged radar charts across domains (PI, CI, personality are categorically different)
- Rare moves slide (removed)
- Stats grid / "By the Numbers" slide (removed)
