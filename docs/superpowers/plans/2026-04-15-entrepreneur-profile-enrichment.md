<!-- /autoplan restore point: /Users/larsostevold/.gstack/projects/austin-christian-university-builders-quotient-frontend/Lars-Ostervold-entrepreneur-dashboard-autoplan-restore-20260415-073328.md -->
# Entrepreneur Profile Enrichment: Communication Style + Page Restructure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the entrepreneur profile page (`/entrepreneurs/[id]`) with communication style data (20-dim personality vector radar chart + narrative insights from `entrepreneur_communication_narratives`), and restructure the page to separate PI and CI into distinct sections with CTAs between them.

**Architecture:** Extend existing `getEntrepreneurProfile()` query to join `entrepreneur_personality_profiles` and `entrepreneur_communication_narratives`. Add new client components for the communication radar and narrative display. Restructure the page layout into distinct scrollable sections.

**Tech Stack:** Same as existing -- Next.js 16 App Router, TypeScript strict, Tailwind CSS v4, Framer Motion, existing `RadarChart` SVG component, Supabase service client (server-only)

**Design spec:** Follows DESIGN.md (dark glassmorphism). Communication radar reuses `CommunicationRadarSlide` patterns (sector colors, 20-point chart). Narrative sections use card-based layout matching existing profile aesthetic.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/schemas/entrepreneurs.ts` | Modify | Add types for personality profile + communication narrative |
| `src/lib/queries/entrepreneurs.ts` | Modify | Extend `getEntrepreneurProfile()` to fetch personality + narrative data |
| `src/components/entrepreneurs/CommunicationStyleSection.tsx` | Create | 20-dim radar chart + narrative insights (client component) |
| `src/app/(marketing)/entrepreneurs/[id]/EntrepreneurProfileVisuals.tsx` | Modify | Split into PI-only and CI-only sections, remove combined layout |
| `src/app/(marketing)/entrepreneurs/[id]/page.tsx` | Modify | Restructure page: Hero -> PI -> CTA -> CI -> CTA -> Communication -> CTA |

---

## Chunk 1: Data Layer Extension

### Task 1: Extend schemas with personality + communication types

**Files:**
- Modify: `src/lib/schemas/entrepreneurs.ts`

- [ ] **Step 1: Add Zod schemas and types for the new data**

Add these types to `src/lib/schemas/entrepreneurs.ts`:

```typescript
// --- Communication / Personality types ---

export const signatureMoveSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const communicationNarrativeSchema = z.object({
  communication_style: z.string(),
  signature_moves: z.array(signatureMoveSchema),
  strengths: z.string(),
  blindspots: z.string(),
});

export type CommunicationNarrative = z.infer<typeof communicationNarrativeSchema>;

export type PersonalityVector = Record<string, number>; // pv_01 through pv_20, values 0-1

export type EntrepreneurProfileData = {
  entrepreneur: EntrepreneurDetail;
  archetypeAvgPiScores: Record<string, number>;
  archetypeAvgCiScores: Record<string, number>;
  corpusMax: CorpusMaxScores;
  allEntrepreneurs: { id: string; pi_d1_score: number; pi_d2_score: number; ci_d1_score: number; ci_d2_score: number }[];
  // NEW: communication style data
  personalityVector: PersonalityVector | null;
  corpusAvgPersonalityVector: PersonalityVector | null;
  communicationNarrative: CommunicationNarrative | null;
};
```

Note: The existing `EntrepreneurProfileData` type in the same file must be REPLACED with this extended version (not duplicated).

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/schemas/entrepreneurs.ts
git commit -m "feat(entrepreneurs): add communication style types to schemas"
```

---

### Task 2: Extend `getEntrepreneurProfile()` query

**Files:**
- Modify: `src/lib/queries/entrepreneurs.ts`

- [ ] **Step 1: Add personality vector + narrative fetching**

Inside `getEntrepreneurProfile()`, after the existing queries, add:

```typescript
// Fetch personality vector for this entrepreneur
const { data: personalityProfile } = await supabase
  .from("entrepreneur_personality_profiles")
  .select("personality_vector")
  .eq("entrepreneur_id", id)
  .single();

// Fetch communication narrative for this entrepreneur
const { data: commNarrative } = await supabase
  .from("entrepreneur_communication_narratives")
  .select("communication_style, signature_moves, strengths, blindspots")
  .eq("entrepreneur_id", id)
  .single();

// Compute corpus average personality vector from all entrepreneurs
const { data: allPersonalityProfiles } = await supabase
  .from("entrepreneur_personality_profiles")
  .select("personality_vector");

const corpusAvgPersonalityVector = computeAvgPersonalityVector(
  (allPersonalityProfiles ?? []) as { personality_vector: Record<string, number> }[]
);
```

- [ ] **Step 2: Add `computeAvgPersonalityVector` helper**

Add near the top of the file with the other helpers:

```typescript
/** Average personality vectors across all entrepreneurs for corpus comparison. */
function computeAvgPersonalityVector(
  profiles: { personality_vector: Record<string, number> }[]
): Record<string, number> | null {
  if (profiles.length === 0) return null;

  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const profile of profiles) {
    if (!profile.personality_vector) continue;
    for (const [key, val] of Object.entries(profile.personality_vector)) {
      sums[key] = (sums[key] ?? 0) + val;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }

  const avg: Record<string, number> = {};
  for (const key of Object.keys(sums)) {
    avg[key] = sums[key] / counts[key];
  }
  return avg;
}
```

- [ ] **Step 3: Update the return value**

Update the return object in `getEntrepreneurProfile()` to include the new fields:

```typescript
return {
  entrepreneur: entrepreneur as EntrepreneurDetail,
  archetypeAvgPiScores,
  archetypeAvgCiScores,
  corpusMax,
  allEntrepreneurs: allEnts.map((e) => ({
    id: e.id,
    pi_d1_score: e.pi_d1_score,
    pi_d2_score: e.pi_d2_score,
    ci_d1_score: e.ci_d1_score,
    ci_d2_score: e.ci_d2_score,
  })),
  personalityVector: personalityProfile?.personality_vector ?? null,
  corpusAvgPersonalityVector,
  communicationNarrative: commNarrative
    ? {
        communication_style: commNarrative.communication_style,
        signature_moves: commNarrative.signature_moves as { title: string; description: string }[],
        strengths: commNarrative.strengths,
        blindspots: commNarrative.blindspots,
      }
    : null,
};
```

- [ ] **Step 4: Verify no type errors**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/entrepreneurs.ts
git commit -m "feat(entrepreneurs): fetch personality vector and communication narratives"
```

---

## Chunk 2: Communication Style Section Component

### Task 3: Create `CommunicationStyleSection` component

**Files:**
- Create: `src/components/entrepreneurs/CommunicationStyleSection.tsx`

This is a client component that renders:
1. A 20-point radar chart (reusing `RadarChart` with sector groups, same as `CommunicationRadarSlide`)
2. The communication narrative insights (style overview, signature moves, strengths, blindspots)

- [ ] **Step 1: Create the component**

The component should:
- Accept `personalityVector`, `corpusAvgPersonalityVector`, `communicationNarrative`, and `entrepreneurName` as props
- Render a section header "Communication Style"
- Render the 20-point RadarChart with sector groups (reuse SECTOR_COLORS and PERSONALITY_DIMENSION_* from existing code)
- Below the radar, render the narrative content in card-based layout:
  - Communication style paragraph (styled as a pull quote or lead paragraph)
  - Signature moves as expandable cards (title + description)
  - Strengths and blindspots side by side in glassmorphic cards
- All values should gracefully handle null (show nothing if no data)
- Follow DESIGN.md aesthetic: dark glassmorphism, Inter Tight headings, #4da3ff primary

Key implementation notes:
- Radar chart uses `#2dd4bf` (teal) as accent, matching the student results communication radar
- Sector groups: Energy (#2dd4bf), Confidence (#63b3ed), Warmth (#f87171), Style (#a78bfa), Presentation (#fbbf24)
- Scores are 0-1 range, multiply by 100 for the RadarChart (same as CommunicationRadarSlide)
- Corpus average is the comparison trace (same pattern as archetype average in PI/CI radars)

- [ ] **Step 2: Verify it builds**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/entrepreneurs/CommunicationStyleSection.tsx
git commit -m "feat(entrepreneurs): add CommunicationStyleSection component"
```

---

## Chunk 3: Restructure Entrepreneur Profile Page

### Task 4: Split EntrepreneurProfileVisuals into PI and CI sections

**Files:**
- Modify: `src/app/(marketing)/entrepreneurs/[id]/EntrepreneurProfileVisuals.tsx`

Currently this component renders PI radar + CI radar + scatter plots all together. We need to split it so the page can interleave CTAs between sections.

- [ ] **Step 1: Refactor into separate exported sections**

Option A (preferred): Export two components from the same file:
- `PracticalIntelligenceSection` -- PI radar + PI scatter plot
- `CreativeIntelligenceSection` -- CI radar + CI scatter plot

Each section is self-contained with its own container refs and state. The scatter plot for each section shows ONLY that domain's quadrant (PI or CI).

Option B: Keep one component but accept a `domain` prop. Less preferred because it duplicates props.

Go with Option A.

- [ ] **Step 2: Verify no type errors**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(marketing)/entrepreneurs/[id]/EntrepreneurProfileVisuals.tsx
git commit -m "refactor(entrepreneurs): split profile visuals into PI and CI sections"
```

---

### Task 5: Restructure the profile page layout

**Files:**
- Modify: `src/app/(marketing)/entrepreneurs/[id]/page.tsx`

- [ ] **Step 1: Update the page layout**

New page structure:

```
Hero (name, industries, archetype badge, bio)
  |
Practical Intelligence Section (PI radar + scatter)
  |
CTA: "See how you compare" -> assessment signup
  |
Creative Intelligence Section (CI radar + scatter)  
  |
CTA: "Discover your creative style" -> assessment signup
  |
Communication Style Section (20-dim radar + narratives)
  -- only rendered if personalityVector exists
  |
Final CTA: "Begin Assessment" (existing bottom CTA with glow effect)
```

- Pass the new data from `getEntrepreneurProfile()` down to components
- Import `CommunicationStyleSection` and conditionally render it
- Import the split `PracticalIntelligenceSection` and `CreativeIntelligenceSection`
- Each intermediate CTA is a compact section (similar to existing bottom CTA but smaller)

- [ ] **Step 2: Add intermediate CTA helper**

Create a small inline CTA component (doesn't need its own file -- just a local function in the page):

```typescript
function SectionCTA({ heading, subtext }: { heading: string; subtext: string }) {
  return (
    <section className="relative px-6 py-16 md:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgb(77_163_255/0.04),transparent)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-xl font-bold tracking-tight bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent pb-1" style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}>
          {heading}
        </h2>
        <p className="mt-2 text-sm text-text-secondary/90 font-light">{subtext}</p>
        <div className="mt-6">
          <Button as={Link} href="/assess/overview" size="md" variant="outline" className="rounded-full">
            Take the Assessment
          </Button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify the full page builds and renders**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(marketing)/entrepreneurs/[id]/page.tsx src/app/(marketing)/entrepreneurs/[id]/EntrepreneurProfileVisuals.tsx src/components/entrepreneurs/CommunicationStyleSection.tsx
git commit -m "feat(entrepreneurs): add communication style + restructure profile page"
```

---

## Chunk 4: Polish + Edge Cases

### Task 6: Handle missing data gracefully

- [ ] **Step 1: Test with an entrepreneur that has no personality profile**

Not all 273 entrepreneurs have personality data (261 do, 249 have narratives). The communication section should simply not render if `personalityVector` is null.

- [ ] **Step 2: Test with an entrepreneur that has a personality profile but no narrative**

12 entrepreneurs have personality vectors but no communication narratives. The radar chart should still render; the narrative cards should be hidden.

- [ ] **Step 3: Verify the page still works for entrepreneurs with full data**

Pick an entrepreneur ID that has all data and verify the full page renders correctly.

- [ ] **Step 4: Final commit if any fixes needed**

---

## Data Dependencies

| Table | Columns Used | Join Key | Coverage |
|-------|-------------|----------|----------|
| `entrepreneurs` | All existing columns | `id` (primary) | 248 with archetype |
| `entrepreneur_personality_profiles` | `personality_vector` | `entrepreneur_id` | 261 rows |
| `entrepreneur_communication_narratives` | `communication_style`, `signature_moves`, `strengths`, `blindspots` | `entrepreneur_id` | 249 rows |

## Performance Notes

- The corpus average personality vector query fetches all 261 personality profiles. This is small (261 rows x 20 floats) and can be cached/computed server-side.
- Consider caching this with `unstable_cache` if it becomes a bottleneck, but for a marketing page with light traffic this is fine as-is.
- All data fetching is server-side only (service role client).
- **[REVIEW FIX]** Parallelize independent queries with `Promise.all` after the initial entrepreneur lookup (personality profile, narrative, all personality profiles, all entrepreneurs can run concurrently).

---

## Review Amendments (from /autoplan)

### Data Validation Fixes (from Eng review)

1. **Parse `signature_moves` through Zod** instead of type-casting. The pipeline could write a different shape. Use `communicationNarrativeSchema.safeParse()` and fall back to null on failure.
2. **Whitelist `pv_01`-`pv_20` keys** in personality vector before passing to chart. Filter unknown keys. Clamp values to 0-1 range. Replace null/NaN with 0.
3. **Both vectors (individual + corpus avg) must be multiplied by 100** for the RadarChart. The plan only mentions it for the individual vector.

### UI Fixes (from Design review)

4. **Add orienting captions** (1-2 sentences) above each radar chart section explaining what PI, CI, and Communication Style mean for a cold visitor.
5. **Add `min-h-[300px]` to chart containers** to prevent CLS from `useContainerWidth` starting at 0.
6. **Fix `Button as={Link}`** -- the actual Button API uses `asChild` via Radix, not an `as` prop. Use `<Button asChild><Link href="...">...</Link></Button>` pattern.
7. **Show all 4 signature moves expanded** by default (no accordion). This is a marketing page -- visitors should see the content without interaction.
8. **Empty string guards**: Check `communication_style`, `strengths`, `blindspots` for empty strings (not just null) before rendering their cards.

### Refactor Safety (from Eng review)

9. **In Task 4 (split EntrepreneurProfileVisuals)**: Each new component MUST create its own `useContainerWidth` hook and attach the ref to its own container div. Failing to reconnect refs after the split causes a silent 0px rendering bug (not a build error).

### Test Task (from Eng review)

Add a new Task 7 after Task 6:

- [ ] Unit test `computeAvgPersonalityVector` with: empty input, all-null vectors, partial keys
- [ ] Unit test `communicationNarrativeSchema` parse with malformed signature_moves
- [ ] Render test `CommunicationStyleSection` with: null vector, vector+no-narrative, full data

---

## NOT in scope (deferred)

- Reasoning narratives (`entrepreneur_reasoning_narratives`) -- same shape, add later
- PostHog instrumentation for entrepreneur page sections (flagged by CEO review)
- "You vs. Entrepreneur" comparison feature (conversion-first alternative)
- Data quality audit of LLM narratives (spot-check recommended before shipping)
- `unstable_cache` for corpus aggregates (add if traffic grows)

---

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|---------------|-----------|-----------|----------|
| 1 | CEO | Proceed with plan as user-directed | Mechanical | P6 action | User explicitly requested this enrichment | Lighter alternatives |
| 2 | CEO | SELECTIVE EXPANSION mode | Mechanical | P3 pragmatic | Scope matches request | Full expansion |
| 3 | CEO | Defer reasoning narratives | Mechanical | P6 action | User asked for communication, not reasoning | Adding reasoning now |
| 4 | Design | Add orienting captions above radars | Mechanical | P1 completeness | Cold visitors need context | No captions |
| 5 | Design | Add min-h to chart containers | Mechanical | P5 explicit | Prevent CLS | No height reservation |
| 6 | Design | Fix Button API (asChild not as) | Mechanical | P5 explicit | Runtime error prevention | Keep incorrect API |
| 7 | Design | Show signature moves expanded | Mechanical | P5 explicit | Marketing page, no interaction needed | Accordion |
| 8 | Design | CTA count (2 intermediate + 1 final) | Taste | -- | User requested CTAs between sections; both voices say dilutive | Single CTA |
| 9 | Design | Scatter plot split into separate sections | Taste | -- | User requested creative section below CTA; both voices say loses paired meaning | Keep 2-up layout |
| 10 | Eng | Parallelize queries with Promise.all | Mechanical | P3 pragmatic | 5 sequential round-trips unnecessary | Sequential queries |
| 11 | Eng | Zod parse signature_moves | Mechanical | P1 completeness | Pipeline shape mismatch = render blow-up | Type casting |
| 12 | Eng | Whitelist pv_01-pv_20 keys | Mechanical | P5 explicit | Unknown keys break chart | Accept all keys |
| 13 | Eng | Add test task | Mechanical | P1 completeness | No tests in original plan | No tests |
| 14 | Eng | Note useContainerWidth ref reconnect | Mechanical | P5 explicit | Silent 0px bug | No note |

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | clean | 0 unresolved, SELECTIVE_EXPANSION |
| Eng Review | `/plan-eng-review` | Architecture & tests | 1 | clean | 5 issues found, 0 unresolved |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | clean | 2 taste decisions surfaced |
| CEO Voices | `autoplan-voices` | Dual model consensus | 1 | clean | 5/6 confirmed, 1 disagree |
| Design Voices | `autoplan-voices` | Dual model consensus | 1 | clean | 6/6 confirmed |
| Eng Voices | `autoplan-voices` | Dual model consensus | 1 | clean | 6/6 confirmed |

**VERDICT:** APPROVED — all reviews clean. 2 taste decisions accepted as user-directed. Plan amended with 14 auto-decisions. Ready to implement.
