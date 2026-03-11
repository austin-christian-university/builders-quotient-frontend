# Share Cards Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the share carousel's percentile-showing SuperpowerCard and text-heavy FounderMatchCard with curiosity-optimized matchup cards and radar chart cards.

**Architecture:** All changes are in `ShareApplySlide.tsx`. Two new card components (MatchupCard, RadarShareCard) replace the old FounderMatchCard and SuperpowerCard. The existing `RadarChart` component is reused as-is for the radar cards. The card array is rebuilt to conditionally include up to 5 cards.

**Tech Stack:** React, Framer Motion, existing RadarChart SVG component, html-to-image for export.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/results/slides/ShareApplySlide.tsx` | Modify | Replace card components, update card array, bump logo sizes |

No new files. `RadarChart.tsx` and `short-labels.ts` are consumed but not modified.

---

## Chunk 1: Share Cards Redesign

### Task 1: Replace FounderMatchCard with MatchupCard

**Files:**
- Modify: `src/components/results/slides/ShareApplySlide.tsx:41-104`

- [ ] **Step 1: Delete FounderMatchCard, write MatchupCard**

Delete the `FounderMatchCard` function (lines 41–104) and replace with `MatchupCard`. This component renders two variants (reasoning/communication) using the same "You ↔ Founder" matchup layout from the brainstorm mockup (Option C).

```tsx
interface MatchupCardProps {
    data: ResultsPageData;
    matchType: "reasoning" | "communication";
    isExporting: boolean;
}

function MatchupCard({ data, matchType, isExporting }: MatchupCardProps) {
    const match = matchType === "reasoning" ? data.reasoningMatch : data.communicationMatch;
    const primary = match?.primary;
    if (!primary) return null;

    const accentColor = matchType === "reasoning" ? "#4da3ff" : "#e9b949";
    const label = matchType === "reasoning" ? "Reasoning Match" : "Communication Match";
    const displayName = data.applicant.displayName || "You";

    return (
        <div className="flex flex-col h-full bg-[#0a0a0c] p-6 relative overflow-hidden" style={{ transform: isExporting ? "translateZ(0)" : "none" }}>
            {/* Glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-[60px] pointer-events-none"
                style={{ background: `${accentColor}18` }}
            />

            <div className="relative z-10 flex flex-col h-full">
                {/* Eyebrow */}
                <span className="uppercase tracking-[0.2em] text-[9px] text-white/40 font-semibold mb-auto">
                    {label}
                </span>

                {/* Match area */}
                <div className="flex flex-col items-center gap-3 my-auto text-center">
                    {/* You */}
                    <div>
                        <p className="text-[8px] uppercase tracking-[0.2em] text-white/35 font-semibold mb-1">You</p>
                        <p className="font-display text-lg font-bold text-white leading-tight">{displayName}</p>
                        <p className="text-[10px] font-semibold mt-1" style={{ color: accentColor }}>
                            {data.archetype.name}
                        </p>
                    </div>

                    {/* Connector */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-px bg-white/12" />
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
                            <path d="M8 3l4 4-4 4" /><path d="M16 21l-4-4 4-4" /><line x1="12" y1="7" x2="12" y2="17" />
                        </svg>
                        <div className="w-8 h-px bg-white/12" />
                    </div>

                    {/* Founder */}
                    <div>
                        <p className="text-[8px] uppercase tracking-[0.2em] text-white/35 font-semibold mb-1">Thinks Like</p>
                        <p className="font-display text-2xl font-extrabold text-white leading-tight">
                            {primary.entrepreneurName}
                        </p>
                        {primary.companies && primary.companies.length > 0 && (
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mt-1" style={{ color: `${accentColor}CC` }}>
                                {primary.companies.join(", ")}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto">
                    <div className="h-px w-full bg-gradient-to-r from-white/15 to-transparent mb-3" />
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="font-bold text-white text-xs leading-tight">bq.austinchristianu.org</p>
                            <p className="text-[8px] text-white/35 uppercase tracking-[0.15em] mt-0.5 font-semibold">Find your match</p>
                        </div>
                        <div className="h-10 opacity-60">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/white_crest_and_wordmark.png" alt="ACU" className="h-full w-auto object-contain" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to ShareApplySlide

### Task 2: Replace SuperpowerCard with RadarShareCard

**Files:**
- Modify: `src/components/results/slides/ShareApplySlide.tsx:106-157` (old SuperpowerCard location)

- [ ] **Step 1: Delete SuperpowerCard, write RadarShareCard**

Delete the `SuperpowerCard` function and replace with `RadarShareCard`. This component imports and reuses `RadarChart` from `@/components/results/RadarChart` and `getShortLabel` from `@/components/results/short-labels`.

Add these imports at the top of the file:
```tsx
import { RadarChart } from "@/components/results/RadarChart";
import { getShortLabel } from "@/components/results/short-labels";
```

Then the component:

```tsx
interface RadarShareCardProps {
    data: ResultsPageData;
    variant: "pi" | "ci";
    isExporting: boolean;
}

function RadarShareCard({ data, variant, isExporting }: RadarShareCardProps) {
    const radar = variant === "pi" ? data.piRadar : data.ciRadar;
    if (radar.length === 0) return null;

    const accentColor = variant === "pi" ? "#4da3ff" : "#e9b949";
    const subtitle = variant === "pi" ? "Practical Intelligence" : "Creative Intelligence";

    const categories = radar.map((c) => getShortLabel(c.category));
    const rawScores = radar.map((c) => c.studentScore);
    const maxScore = Math.max(...rawScores) || 1;
    const studentScores = rawScores.map((s) => (s / maxScore) * 100);

    return (
        <div className="flex flex-col h-full bg-[#0a0a0c] p-5 relative overflow-hidden text-center" style={{ transform: isExporting ? "translateZ(0)" : "none" }}>
            {/* Glow */}
            <div
                className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-[50px] pointer-events-none"
                style={{ background: `${accentColor}20` }}
            />

            <div className="relative z-10 flex flex-col h-full">
                {/* Eyebrow + subtitle */}
                <div className="mb-2">
                    <span className="uppercase tracking-[0.2em] text-[9px] text-white/40 font-semibold">Builder DNA</span>
                    <p className="text-[10px] font-semibold mt-1" style={{ color: `${accentColor}AA` }}>
                        {subtitle}
                    </p>
                </div>

                {/* Radar */}
                <div className="flex-1 flex items-center justify-center min-h-0">
                    <RadarChart
                        categories={categories}
                        studentScores={studentScores}
                        accentColor={accentColor}
                        size={320}
                        maxValue={100}
                        gridStyle="axesOnly"
                    />
                </div>

                {/* Footer */}
                <div className="mt-auto">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent mb-3" />
                    <div className="flex items-end justify-between">
                        <div className="text-left">
                            <p className="font-bold text-white text-xs leading-tight">{data.archetype.name}</p>
                            <p className="text-[8px] text-white/35 uppercase tracking-[0.15em] mt-0.5 font-semibold">Builder&rsquo;s Quotient</p>
                        </div>
                        <div className="h-10 opacity-60">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/white_crest_and_wordmark.png" alt="ACU" className="h-full w-auto object-contain" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

### Task 3: Update ArchetypeCard logo size

**Files:**
- Modify: `src/components/results/slides/ShareApplySlide.tsx` (ArchetypeCard function)

- [ ] **Step 1: Bump ACU logo from h-6 to h-10 in ArchetypeCard**

In the `ArchetypeCard` function, change:
```tsx
<div className="h-6 opacity-60">
```
to:
```tsx
<div className="h-10 opacity-60">
```

### Task 4: Update card array to use new components

**Files:**
- Modify: `src/components/results/slides/ShareApplySlide.tsx` (inside `ShareApplySlide` function, card array building)

- [ ] **Step 1: Replace card array logic**

Replace the existing card array building block (lines ~301–308):
```tsx
const cards: { id: string; component: React.ElementType<{ data: ResultsPageData, isExporting: boolean }> }[] = [];
if (data.reasoningMatch?.primary || data.communicationMatch?.primary) {
    cards.push({ id: 'founder', component: FounderMatchCard });
}
if (data.piCategories.length > 0 || data.ciCategories.length > 0) {
    cards.push({ id: 'superpower', component: SuperpowerCard });
}
cards.push({ id: 'archetype', component: ArchetypeCard });
```

With this new logic that conditionally adds each card type:
```tsx
const cards: { id: string; render: (isExporting: boolean) => React.ReactNode }[] = [];

if (data.reasoningMatch?.primary) {
    cards.push({
        id: "reasoning-match",
        render: (isExporting) => <MatchupCard data={data} matchType="reasoning" isExporting={isExporting} />,
    });
}
if (data.communicationMatch?.primary) {
    cards.push({
        id: "communication-match",
        render: (isExporting) => <MatchupCard data={data} matchType="communication" isExporting={isExporting} />,
    });
}
if (data.piRadar.length > 0) {
    cards.push({
        id: "pi-radar",
        render: (isExporting) => <RadarShareCard data={data} variant="pi" isExporting={isExporting} />,
    });
}
if (data.ciRadar.length > 0) {
    cards.push({
        id: "ci-radar",
        render: (isExporting) => <RadarShareCard data={data} variant="ci" isExporting={isExporting} />,
    });
}
cards.push({
    id: "archetype",
    render: (isExporting) => <ArchetypeCard data={data} isExporting={isExporting} />,
});
```

- [ ] **Step 2: Update card rendering in JSX**

The current rendering uses `CurrentCardComponent`:
```tsx
const CurrentCardComponent = cards[currentIndex].component;
// ...
<CurrentCardComponent data={data} isExporting={isExporting} />
```

Replace with render function call:
```tsx
// Delete the CurrentCardComponent line entirely
// In the JSX, replace:
//   <CurrentCardComponent data={data} isExporting={isExporting} />
// With:
{cards[currentIndex].render(isExporting)}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

### Task 5: Visual verification

- [ ] **Step 1: Check the dev server**

Run: `npm run dev` (if not already running)
Navigate to `http://localhost:3000/results/bwpl0vkAlF0bDNV--NkBl`
Arrow to the last slide (Share). Verify:
1. First card shows "You ↔ Founder" matchup layout (reasoning match)
2. Carousel arrows cycle through communication match, PI radar, CI radar, archetype
3. ACU logo is visibly larger on all cards
4. No percentile numbers anywhere
5. "Save to Camera Roll" export still works

- [ ] **Step 2: Commit**

```bash
git add src/components/results/slides/ShareApplySlide.tsx
git commit -m "Replace share cards with matchup + radar designs

Remove SuperpowerCard (showed percentile numbers) and text-heavy
FounderMatchCard. Replace with curiosity-optimized matchup cards
(You ↔ Founder layout) and Builder DNA radar cards reusing the
existing RadarChart component. Bump ACU logo size across all cards."
```
