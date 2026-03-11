# Share Cards Redesign

## Problem

The current share carousel has three issues:
1. **SuperpowerCard shows percentile numbers** — violates the "no quantitative data" design intent
2. **FounderMatchCard is text-heavy or empty** — when narrative data exists it's a wall of text; when missing, the card is blank
3. **ACU logo too small** — barely readable across all cards

## Design Direction

Optimize for **curiosity/viral sharing** — "I want to take this too" — not status or identity.

## New Card Lineup

Five cards in the share carousel (cards 1–2 conditional on data):

### Card 1: Reasoning Match (conditional)
- **Layout:** "You ↔ Founder" matchup style
- **Top half:** Viewer's name + archetype label (gold accent)
- **Connector:** Horizontal line with bidirectional arrow icon
- **Bottom half:** Matched entrepreneur name (large, bold) + company (blue uppercase)
- **Footer:** `bq.austinchristianu.org` + "Find your match" + ACU logo
- **Accent:** Blue (`#4da3ff`)
- **Data source:** `data.reasoningMatch.primary`
- **Only renders if** `reasoningMatch?.primary` exists

### Card 2: Communication Match (conditional)
- Same matchup layout as Card 1
- **Accent:** Gold (`#e9b949`)
- **Data source:** `data.communicationMatch.primary`
- **Only renders if** `communicationMatch?.primary` exists

### Card 3: Practical Intelligence Radar
- **Eyebrow:** "Builder DNA"
- **Subtitle:** "Practical Intelligence"
- **Content:** Reuse `RadarChart` component with:
  - `hideCorpus: true` (student shape only)
  - `studentScores` from `data.piRadar` (relative-scaled so max = 100%)
  - Short labels from `short-labels.ts`
  - `accentColor: "#4da3ff"`
  - Small size, no interactivity (no hover/tap handlers)
  - `gridStyle: "full"` or `"axesOnly"` — whichever reads better at small size
- **Footer:** Archetype name + BQ label + ACU logo
- **Only renders if** `data.piRadar.length > 0`

### Card 4: Creative Intelligence Radar
- Same layout as Card 3
- **Accent:** Gold (`#e9b949`)
- **Data source:** `data.ciRadar`
- **Only renders if** `data.ciRadar.length > 0`

### Card 5: Archetype (existing)
- Keep current design unchanged
- Only update: bigger ACU logo

## Cross-Card Changes

### ACU Logo
- Bump from `h-6` to `h-10` across all cards
- Keep `opacity-60` styling

### Removed
- `SuperpowerCard` component — delete entirely (was showing percentile numbers)

## Data Requirements

No new data needed. All data already exists in `ResultsPageData`:
- `reasoningMatch.primary` — entrepreneur name, companies
- `communicationMatch.primary` — entrepreneur name, companies
- `piRadar` / `ciRadar` — radar category data
- `archetype` — name, tagline
- `applicant.displayName` — viewer's name for matchup cards

## Component Changes

### `ShareApplySlide.tsx`
- Remove `SuperpowerCard`
- Add `ReasoningMatchCard` and `CommunicationMatchCard` (matchup layout)
- Add `PIRadarCard` and `CIRadarCard` (reusing `RadarChart`)
- Update card array to conditionally include match cards
- Bump logo size on all cards

### `RadarChart.tsx`
- No changes needed — already supports all required props

## Fallback Behavior

- If no reasoning match: card 1 skipped
- If no communication match: card 2 skipped
- If no PI radar data: card 3 skipped
- If no CI radar data: card 4 skipped
- Archetype card always present (guaranteed data)
- Minimum carousel: 1 card (archetype only)
