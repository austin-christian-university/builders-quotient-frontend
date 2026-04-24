# Entrepreneur Archetype Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public-facing entrepreneur archetype explorer with three pages: an overview grid with scatter plots, archetype detail pages, and individual entrepreneur profiles — all driven by real cognitive data from 248 analyzed entrepreneurs.

**Architecture:** Three server-rendered pages under `src/app/(marketing)/entrepreneurs/`. Data fetched server-side via `createServiceClient()` in a new `src/lib/queries/entrepreneurs.ts`. Client components for interactive visualizations (archetype grid, scatter plots). Reuses existing `RadarChart` component for radar charts on detail/profile pages.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Tailwind CSS v4, Framer Motion, existing `RadarChart` SVG component, Supabase service client (server-only)

**Spec:** `docs/superpowers/specs/2026-04-14-entrepreneur-explorer-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/queries/entrepreneurs.ts` | Create | Server-only data fetching for all three pages |
| `src/lib/schemas/entrepreneurs.ts` | Create | Zod schemas and TypeScript types for entrepreneur data |
| `src/components/entrepreneurs/ArchetypeGrid.tsx` | Create | 4x4 interactive archetype grid (client) |
| `src/components/entrepreneurs/ScatterPlot.tsx` | Create | 2x2 quadrant scatter plot (client, SVG) |
| `src/components/entrepreneurs/StatCard.tsx` | Create | Glassmorphic stat callout for hero |
| `src/components/entrepreneurs/EntrepreneurCard.tsx` | Create | Card for entrepreneur grids |
| `src/components/entrepreneurs/ArchetypeBadge.tsx` | Create | Reusable archetype badge |
| `src/app/(marketing)/entrepreneurs/page.tsx` | Create | Archetype Explorer page (overview) |
| `src/app/(marketing)/entrepreneurs/archetype/[archetype_key]/page.tsx` | Create | Archetype Detail page |
| `src/app/(marketing)/entrepreneurs/[id]/page.tsx` | Create | Entrepreneur Profile page |

---

## Chunk 1: Data Layer

### Task 1: Define Zod schemas and types

**Files:**
- Create: `src/lib/schemas/entrepreneurs.ts`

- [ ] **Step 1: Create the schemas file**

```typescript
import { z } from "zod";

// --- Archetype reference (all 16, including empty ones) ---

export const ARCHETYPES = [
  { key: "analytical_exploratory__insight_market", name: "The Pathfinder", tagline: "Sees what others miss and knows where it leads", piStyle: "analytical_exploratory", ciStyle: "insight_market" },
  { key: "analytical_exploratory__insight_process", name: "The Theorist", tagline: "Maps the invisible structures behind breakthroughs", piStyle: "analytical_exploratory", ciStyle: "insight_process" },
  { key: "analytical_exploratory__validation_market", name: "The Cartographer", tagline: "Charts new territory with evidence in hand", piStyle: "analytical_exploratory", ciStyle: "validation_market" },
  { key: "analytical_exploratory__validation_process", name: "The Prospector", tagline: "Digs deep, tests everything, finds real gold", piStyle: "analytical_exploratory", ciStyle: "validation_process" },
  { key: "analytical_decisive__insight_market", name: "The Strategist", tagline: "Turns sharp insight into decisive market moves", piStyle: "analytical_decisive", ciStyle: "insight_market" },
  { key: "analytical_decisive__insight_process", name: "The Catalyst", tagline: "Applies analytical precision to ignite creative change", piStyle: "analytical_decisive", ciStyle: "insight_process" },
  { key: "analytical_decisive__validation_market", name: "The Optimizer", tagline: "Finds the highest-leverage path and executes it", piStyle: "analytical_decisive", ciStyle: "validation_market" },
  { key: "analytical_decisive__validation_process", name: "The Sentinel", tagline: "Guards quality with analytical rigor and disciplined execution", piStyle: "analytical_decisive", ciStyle: "validation_process" },
  { key: "interpersonal_exploratory__insight_market", name: "The Luminary", tagline: "Inspires new possibilities by illuminating what people need", piStyle: "interpersonal_exploratory", ciStyle: "insight_market" },
  { key: "interpersonal_exploratory__insight_process", name: "The Weaver", tagline: "Connects people and ideas into unexpected combinations", piStyle: "interpersonal_exploratory", ciStyle: "insight_process" },
  { key: "interpersonal_exploratory__validation_market", name: "The Navigator", tagline: "Guides ventures forward by reading people and markets", piStyle: "interpersonal_exploratory", ciStyle: "validation_market" },
  { key: "interpersonal_exploratory__validation_process", name: "The Steward", tagline: "Nurtures ideas through careful cultivation and testing", piStyle: "interpersonal_exploratory", ciStyle: "validation_process" },
  { key: "interpersonal_decisive__insight_market", name: "The Torchbearer", tagline: "Champions bold visions with the conviction to rally others", piStyle: "interpersonal_decisive", ciStyle: "insight_market" },
  { key: "interpersonal_decisive__insight_process", name: "The Alchemist", tagline: "Transforms creative intuition into tangible results through people", piStyle: "interpersonal_decisive", ciStyle: "insight_process" },
  { key: "interpersonal_decisive__validation_market", name: "The Builder", tagline: "Constructs lasting ventures by understanding people and validating markets", piStyle: "interpersonal_decisive", ciStyle: "validation_market" },
  { key: "interpersonal_decisive__validation_process", name: "The Anchor", tagline: "Grounds teams in reality with steadfast judgment and proven methods", piStyle: "interpersonal_decisive", ciStyle: "validation_process" },
] as const;

export type ArchetypeRef = (typeof ARCHETYPES)[number];

// --- Grid layout constants ---

export const PI_STYLES = [
  { key: "analytical_exploratory", label: "Analytical & Exploratory" },
  { key: "analytical_decisive", label: "Analytical & Decisive" },
  { key: "interpersonal_exploratory", label: "Interpersonal & Exploratory" },
  { key: "interpersonal_decisive", label: "Interpersonal & Decisive" },
] as const;

export const CI_STYLES = [
  { key: "insight_market", label: "Insight & Market" },
  { key: "insight_process", label: "Insight & Process" },
  { key: "validation_market", label: "Validation & Market" },
  { key: "validation_process", label: "Validation & Process" },
] as const;

// --- Schemas for data from Supabase ---

export const entrepreneurSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  archetype_key: z.string(),
  archetype_name: z.string(),
  archetype_tagline: z.string(),
  pi_style: z.string(),
  ci_style: z.string(),
  pi_d1_score: z.number(),
  pi_d2_score: z.number(),
  ci_d1_score: z.number(),
  ci_d2_score: z.number(),
  pi_category_scores: z.record(z.string(), z.number()),
  ci_category_scores: z.record(z.string(), z.number()),
  industries: z.array(z.string()).nullable(),
});

export type EntrepreneurSummary = z.infer<typeof entrepreneurSummarySchema>;

export const entrepreneurDetailSchema = entrepreneurSummarySchema.extend({
  archetype_description: z.string().nullable(),
  bio_narrative: z.string().nullable(),
});

export type EntrepreneurDetail = z.infer<typeof entrepreneurDetailSchema>;

// --- Computed types for pages ---

export type ArchetypeGridCell = {
  archetype: ArchetypeRef;
  count: number;
};

export type CorpusMaxScores = {
  pi: Record<string, number>;
  ci: Record<string, number>;
};

export type ExplorerStats = {
  totalEntrepreneurs: number;
  totalIndustries: number;
  pctInsightDriven: number;
  pctExploratory: number;
  topDifferentiator: string;
  dominantArchetype: { name: string; pct: number };
  emptyArchetypeCount: number;
};

export type ArchetypeDetailData = {
  archetype: ArchetypeRef;
  description: string;
  entrepreneurs: EntrepreneurSummary[];
  avgPiScores: Record<string, number>;
  avgCiScores: Record<string, number>;
  corpusAvgPiScores: Record<string, number>;
  corpusAvgCiScores: Record<string, number>;
  corpusMax: CorpusMaxScores;
};

export type EntrepreneurProfileData = {
  entrepreneur: EntrepreneurDetail;
  archetypeAvgPiScores: Record<string, number>;
  archetypeAvgCiScores: Record<string, number>;
  corpusMax: CorpusMaxScores;
  allEntrepreneurs: { id: string; pi_d1_score: number; pi_d2_score: number; ci_d1_score: number; ci_d2_score: number }[];
};
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit src/lib/schemas/entrepreneurs.ts`

If there's no easy way to typecheck a single file, run:
```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/schemas/entrepreneurs.ts
git commit -m "feat(entrepreneurs): add Zod schemas and types for archetype explorer"
```

---

### Task 2: Create data fetching queries

**Files:**
- Create: `src/lib/queries/entrepreneurs.ts`

This follows the same pattern as `src/lib/queries/results.ts` — server-only, uses `createServiceClient()`.

- [ ] **Step 1: Create the queries file**

```typescript
import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import {
  ARCHETYPES,
  type EntrepreneurSummary,
  type EntrepreneurDetail,
  type ArchetypeGridCell,
  type CorpusMaxScores,
  type ExplorerStats,
  type ArchetypeDetailData,
  type EntrepreneurProfileData,
  type ArchetypeRef,
} from "@/lib/schemas/entrepreneurs";
import {
  PI_CANONICAL_CATEGORIES,
  CI_CANONICAL_CATEGORIES,
} from "@/lib/assessment/scoring-categories";

// --- Helpers ---

/** Compute per-category max across all entrepreneurs for radar chart scaling. */
function computeCorpusMax(entrepreneurs: EntrepreneurSummary[]): CorpusMaxScores {
  const piMax: Record<string, number> = {};
  const ciMax: Record<string, number> = {};

  for (const cat of PI_CANONICAL_CATEGORIES) {
    piMax[cat] = 0;
  }
  for (const cat of CI_CANONICAL_CATEGORIES) {
    ciMax[cat] = 0;
  }

  for (const e of entrepreneurs) {
    if (e.pi_category_scores) {
      for (const [cat, val] of Object.entries(e.pi_category_scores)) {
        if (val > (piMax[cat] ?? 0)) piMax[cat] = val;
      }
    }
    if (e.ci_category_scores) {
      for (const [cat, val] of Object.entries(e.ci_category_scores)) {
        if (val > (ciMax[cat] ?? 0)) ciMax[cat] = val;
      }
    }
  }

  return { pi: piMax, ci: ciMax };
}

/** Average category scores across a set of entrepreneurs. */
function averageScores(
  entrepreneurs: EntrepreneurSummary[],
  field: "pi_category_scores" | "ci_category_scores"
): Record<string, number> {
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const e of entrepreneurs) {
    const scores = e[field];
    if (!scores) continue;
    for (const [cat, val] of Object.entries(scores)) {
      sums[cat] = (sums[cat] ?? 0) + val;
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
  }

  const avg: Record<string, number> = {};
  for (const cat of Object.keys(sums)) {
    avg[cat] = sums[cat] / counts[cat];
  }
  return avg;
}

/** Count distinct values from an array-of-arrays. */
function countDistinct(arrays: (string[] | null)[]): number {
  const set = new Set<string>();
  for (const arr of arrays) {
    if (!arr) continue;
    for (const v of arr) set.add(v);
  }
  return set.size;
}

// --- Main queries ---

/**
 * Fetches all data needed for the Archetype Explorer overview page.
 * Returns null if no entrepreneurs have archetypes.
 */
export async function getExplorerData(): Promise<{
  entrepreneurs: EntrepreneurSummary[];
  gridCells: ArchetypeGridCell[];
  stats: ExplorerStats;
  corpusMax: CorpusMaxScores;
} | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("entrepreneurs")
    .select(
      "id, name, archetype_key, archetype_name, archetype_tagline, pi_style, ci_style, pi_d1_score, pi_d2_score, ci_d1_score, ci_d2_score, pi_category_scores, ci_category_scores, industries"
    )
    .not("archetype_key", "is", null);

  if (error || !data || data.length === 0) return null;

  const entrepreneurs = data as EntrepreneurSummary[];
  const corpusMax = computeCorpusMax(entrepreneurs);

  // Build grid cells — one per archetype (all 16)
  const countsByKey = new Map<string, number>();
  for (const e of entrepreneurs) {
    countsByKey.set(e.archetype_key, (countsByKey.get(e.archetype_key) ?? 0) + 1);
  }

  const gridCells: ArchetypeGridCell[] = ARCHETYPES.map((archetype) => ({
    archetype,
    count: countsByKey.get(archetype.key) ?? 0,
  }));

  // Compute stats
  const totalEntrepreneurs = entrepreneurs.length;
  const totalIndustries = countDistinct(entrepreneurs.map((e) => e.industries));
  const pctInsightDriven =
    Math.round(
      (entrepreneurs.filter((e) => e.ci_d1_score >= 0).length / totalEntrepreneurs) * 1000
    ) / 10;
  const pctExploratory =
    Math.round(
      (entrepreneurs.filter((e) => e.pi_d2_score >= 0).length / totalEntrepreneurs) * 1000
    ) / 10;

  // Find the archetype with the highest count
  let dominantKey = "";
  let dominantCount = 0;
  for (const [key, count] of countsByKey) {
    if (count > dominantCount) {
      dominantKey = key;
      dominantCount = count;
    }
  }
  const dominantArchetypeRef = ARCHETYPES.find((a) => a.key === dominantKey);
  const dominantArchetype = {
    name: dominantArchetypeRef?.name ?? "Unknown",
    pct: Math.round((dominantCount / totalEntrepreneurs) * 1000) / 10,
  };

  const emptyArchetypeCount = gridCells.filter((c) => c.count === 0).length;

  const stats: ExplorerStats = {
    totalEntrepreneurs,
    totalIndustries,
    pctInsightDriven,
    pctExploratory,
    topDifferentiator: "People & Stakeholders",
    dominantArchetype,
    emptyArchetypeCount,
  };

  return { entrepreneurs, gridCells, stats, corpusMax };
}

/**
 * Fetches data for an archetype detail page.
 * Returns null if the archetype key doesn't match any known archetype.
 */
export async function getArchetypeDetail(
  archetypeKey: string
): Promise<ArchetypeDetailData | null> {
  // Validate key against known archetypes
  const archetypeRef = ARCHETYPES.find((a) => a.key === archetypeKey) as ArchetypeRef | undefined;
  if (!archetypeRef) return null;

  const supabase = createServiceClient();

  // Fetch entrepreneurs for this archetype
  const { data: archetypeEntrepreneurs, error: archetypeError } = await supabase
    .from("entrepreneurs")
    .select(
      "id, name, archetype_key, archetype_name, archetype_tagline, archetype_description, pi_style, ci_style, pi_d1_score, pi_d2_score, ci_d1_score, ci_d2_score, pi_category_scores, ci_category_scores, industries"
    )
    .eq("archetype_key", archetypeKey);

  if (archetypeError || !archetypeEntrepreneurs || archetypeEntrepreneurs.length === 0) return null;

  // Fetch all entrepreneurs for corpus averages and max scaling
  const { data: allEntrepreneurs } = await supabase
    .from("entrepreneurs")
    .select(
      "id, name, archetype_key, archetype_name, archetype_tagline, pi_style, ci_style, pi_d1_score, pi_d2_score, ci_d1_score, ci_d2_score, pi_category_scores, ci_category_scores, industries"
    )
    .not("archetype_key", "is", null);

  const allEnts = (allEntrepreneurs ?? []) as EntrepreneurSummary[];
  const archetypeEnts = archetypeEntrepreneurs as EntrepreneurSummary[];

  const corpusMax = computeCorpusMax(allEnts);
  const avgPiScores = averageScores(archetypeEnts, "pi_category_scores");
  const avgCiScores = averageScores(archetypeEnts, "ci_category_scores");
  const corpusAvgPiScores = averageScores(allEnts, "pi_category_scores");
  const corpusAvgCiScores = averageScores(allEnts, "ci_category_scores");

  const description = (archetypeEntrepreneurs[0] as { archetype_description?: string | null })
    .archetype_description ?? "";

  return {
    archetype: archetypeRef,
    description,
    entrepreneurs: archetypeEnts,
    avgPiScores,
    avgCiScores,
    corpusAvgPiScores,
    corpusAvgCiScores,
    corpusMax,
  };
}

/**
 * Fetches data for an individual entrepreneur profile page.
 * Returns null if the entrepreneur is not found or has no archetype.
 */
export async function getEntrepreneurProfile(
  id: string
): Promise<EntrepreneurProfileData | null> {
  const supabase = createServiceClient();

  const { data: entrepreneur, error } = await supabase
    .from("entrepreneurs")
    .select(
      "id, name, archetype_key, archetype_name, archetype_tagline, archetype_description, pi_style, ci_style, pi_d1_score, pi_d2_score, ci_d1_score, ci_d2_score, pi_category_scores, ci_category_scores, industries, bio_narrative"
    )
    .eq("id", id)
    .not("archetype_key", "is", null)
    .single();

  if (error || !entrepreneur) return null;

  // Fetch all entrepreneurs for corpus max + scatter plot positions
  const { data: allEntrepreneurs } = await supabase
    .from("entrepreneurs")
    .select(
      "id, name, archetype_key, archetype_name, archetype_tagline, pi_style, ci_style, pi_d1_score, pi_d2_score, ci_d1_score, ci_d2_score, pi_category_scores, ci_category_scores, industries"
    )
    .not("archetype_key", "is", null);

  const allEnts = (allEntrepreneurs ?? []) as EntrepreneurSummary[];
  const corpusMax = computeCorpusMax(allEnts);

  // Archetype average for comparison trace
  const sameArchetype = allEnts.filter((e) => e.archetype_key === entrepreneur.archetype_key);
  const archetypeAvgPiScores = averageScores(sameArchetype, "pi_category_scores");
  const archetypeAvgCiScores = averageScores(sameArchetype, "ci_category_scores");

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
  };
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/entrepreneurs.ts
git commit -m "feat(entrepreneurs): add server-only data queries for explorer pages"
```

---

## Chunk 2: Shared Components

### Task 3: Create ArchetypeBadge component

**Files:**
- Create: `src/components/entrepreneurs/ArchetypeBadge.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Link from "next/link";

interface ArchetypeBadgeProps {
  archetypeKey: string;
  name: string;
  tagline?: string;
  linked?: boolean;
  className?: string;
}

export function ArchetypeBadge({
  archetypeKey,
  name,
  tagline,
  linked = false,
  className = "",
}: ArchetypeBadgeProps) {
  const content = (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-border-glass bg-white/5 px-4 py-1.5 backdrop-blur-sm ${className}`}
    >
      <span
        className="text-sm font-semibold text-text-primary"
        style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
      >
        {name}
      </span>
      {tagline && (
        <span className="text-xs text-text-secondary hidden sm:inline">
          {tagline}
        </span>
      )}
    </span>
  );

  if (linked) {
    return (
      <Link
        href={`/entrepreneurs/archetype/${archetypeKey}`}
        className="transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base rounded-full"
      >
        {content}
      </Link>
    );
  }

  return content;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/entrepreneurs/ArchetypeBadge.tsx
git commit -m "feat(entrepreneurs): add ArchetypeBadge component"
```

---

### Task 4: Create StatCard component

**Files:**
- Create: `src/components/entrepreneurs/StatCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
interface StatCardProps {
  value: string;
  label: string;
  sublabel?: string;
}

export function StatCard({ value, label, sublabel }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border-glass bg-white/[0.03] px-6 py-5 backdrop-blur-md">
      <p
        className="text-2xl font-bold text-text-primary"
        style={{
          fontFamily: "'Inter Tight', Inter, sans-serif",
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-text-secondary">{label}</p>
      {sublabel && (
        <p className="mt-0.5 text-xs text-text-secondary/60">{sublabel}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/entrepreneurs/StatCard.tsx
git commit -m "feat(entrepreneurs): add StatCard component"
```

---

### Task 5: Create EntrepreneurCard component

**Files:**
- Create: `src/components/entrepreneurs/EntrepreneurCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Link from "next/link";

interface EntrepreneurCardProps {
  id: string;
  name: string;
  industries: string[] | null;
  archetypeName?: string;
}

export function EntrepreneurCard({
  id,
  name,
  industries,
  archetypeName,
}: EntrepreneurCardProps) {
  return (
    <Link
      href={`/entrepreneurs/${id}`}
      className="group rounded-2xl border border-border-glass bg-bg-elevated p-5 transition-all duration-300 ease-[var(--ease-out-expo)] hover:bg-bg-surface hover:border-white/20 hover:shadow-[0_0_24px_rgb(77_163_255/0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
    >
      <p
        className="text-base font-semibold text-text-primary group-hover:text-white transition-colors"
        style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
      >
        {name}
      </p>
      {archetypeName && (
        <p className="mt-1 text-xs text-primary/80">{archetypeName}</p>
      )}
      {industries && industries.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {industries.slice(0, 4).map((industry) => (
            <span
              key={industry}
              className="rounded-sm bg-white/5 px-2 py-0.5 text-xs text-text-secondary"
            >
              {industry}
            </span>
          ))}
          {industries.length > 4 && (
            <span className="px-1 py-0.5 text-xs text-text-secondary/50">
              +{industries.length - 4}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/entrepreneurs/EntrepreneurCard.tsx
git commit -m "feat(entrepreneurs): add EntrepreneurCard component"
```

---

## Chunk 3: Interactive Visualizations

### Task 6: Create ScatterPlot component

**Files:**
- Create: `src/components/entrepreneurs/ScatterPlot.tsx`

This is an SVG-based 2x2 quadrant scatter plot. Client component with hover/click interaction.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";

interface ScatterDot {
  id: string;
  name: string;
  x: number; // d1 score
  y: number; // d2 score
  archetypeKey: string;
}

interface ScatterPlotProps {
  dots: ScatterDot[];
  xLabelNegative: string;
  xLabelPositive: string;
  yLabelNegative: string;
  yLabelPositive: string;
  title: string;
  /** Highlight a specific entrepreneur by ID */
  highlightId?: string;
  className?: string;
}

const SIZE = 400;
const PADDING = 48;
const PLOT_SIZE = SIZE - PADDING * 2;

// Archetype key -> color mapping (derived from primary blue + secondary gold)
const ARCHETYPE_COLORS: Record<string, string> = {
  analytical_exploratory__insight_market: "#4da3ff",
  analytical_exploratory__insight_process: "#6bb4ff",
  analytical_exploratory__validation_market: "#3d8edf",
  analytical_exploratory__validation_process: "#2d79bf",
  analytical_decisive__insight_market: "#e9b949",
  analytical_decisive__insight_process: "#f0ca6a",
  analytical_decisive__validation_market: "#d4a63e",
  analytical_decisive__validation_process: "#bf9333",
  interpersonal_exploratory__insight_market: "#34d399",
  interpersonal_exploratory__insight_process: "#5de0b3",
  interpersonal_exploratory__validation_market: "#2ab885",
  interpersonal_exploratory__validation_process: "#209d6e",
  interpersonal_decisive__insight_market: "#f87171",
  interpersonal_decisive__insight_process: "#fb9a9a",
  interpersonal_decisive__validation_market: "#e05555",
  interpersonal_decisive__validation_process: "#c94040",
};

function getColor(archetypeKey: string): string {
  return ARCHETYPE_COLORS[archetypeKey] ?? "#4da3ff";
}

export function ScatterPlot({
  dots,
  xLabelNegative,
  xLabelPositive,
  yLabelNegative,
  yLabelPositive,
  title,
  highlightId,
  className,
}: ScatterPlotProps) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Compute scale from data range
  const { scaleX, scaleY } = useMemo(() => {
    if (dots.length === 0) return { scaleX: 1, scaleY: 1 };
    const xVals = dots.map((d) => Math.abs(d.x));
    const yVals = dots.map((d) => Math.abs(d.y));
    const maxX = Math.max(...xVals, 0.001);
    const maxY = Math.max(...yVals, 0.001);
    // Add 20% padding
    return { scaleX: maxX * 1.2, scaleY: maxY * 1.2 };
  }, [dots]);

  const toSvgX = useCallback(
    (x: number) => PADDING + ((x + scaleX) / (2 * scaleX)) * PLOT_SIZE,
    [scaleX]
  );

  const toSvgY = useCallback(
    (y: number) => PADDING + ((scaleY - y) / (2 * scaleY)) * PLOT_SIZE,
    [scaleY]
  );

  const cx = SIZE / 2;
  const cy = SIZE / 2;

  return (
    <div className={className}>
      <p
        className="text-xs uppercase tracking-[0.2em] text-text-secondary/60 mb-2 text-center"
        style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
      >
        {title}
      </p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full h-auto"
        style={{ maxWidth: 400 }}
      >
        {/* Quadrant background */}
        <rect
          x={PADDING}
          y={PADDING}
          width={PLOT_SIZE}
          height={PLOT_SIZE}
          fill="rgba(255,255,255,0.02)"
          rx={8}
        />

        {/* Axis lines */}
        <line
          x1={cx}
          y1={PADDING}
          x2={cx}
          y2={SIZE - PADDING}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
        <line
          x1={PADDING}
          y1={cy}
          x2={SIZE - PADDING}
          y2={cy}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />

        {/* Axis labels */}
        <text x={PADDING + 4} y={cy - 6} fontSize={10} fill="#9aa0ac" opacity={0.6}>
          {xLabelNegative}
        </text>
        <text
          x={SIZE - PADDING - 4}
          y={cy - 6}
          fontSize={10}
          fill="#9aa0ac"
          opacity={0.6}
          textAnchor="end"
        >
          {xLabelPositive}
        </text>
        <text
          x={cx + 6}
          y={PADDING + 14}
          fontSize={10}
          fill="#9aa0ac"
          opacity={0.6}
        >
          {yLabelPositive}
        </text>
        <text
          x={cx + 6}
          y={SIZE - PADDING - 6}
          fontSize={10}
          fill="#9aa0ac"
          opacity={0.6}
        >
          {yLabelNegative}
        </text>

        {/* Dots */}
        {dots.map((dot) => {
          const sx = toSvgX(dot.x);
          const sy = toSvgY(dot.y);
          const isHighlighted = dot.id === highlightId;
          const isHovered = dot.id === hoveredId;
          const color = getColor(dot.archetypeKey);

          return (
            <g key={dot.id}>
              {(isHighlighted || isHovered) && (
                <circle cx={sx} cy={sy} r={12} fill={color} opacity={0.2} />
              )}
              <circle
                cx={sx}
                cy={sy}
                r={isHighlighted ? 6 : isHovered ? 5 : 3.5}
                fill={color}
                stroke={isHighlighted ? "#fff" : "none"}
                strokeWidth={isHighlighted ? 2 : 0}
                opacity={isHighlighted || isHovered ? 1 : 0.6}
                style={{ cursor: "pointer", transition: "r 0.15s ease, opacity 0.15s ease" }}
                onMouseEnter={() => setHoveredId(dot.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => router.push(`/entrepreneurs/${dot.id}`)}
                role="link"
                aria-label={`View profile for ${dot.name}`}
              />
            </g>
          );
        })}

        {/* Tooltip */}
        {hoveredId && (() => {
          const dot = dots.find((d) => d.id === hoveredId);
          if (!dot) return null;
          const sx = toSvgX(dot.x);
          const sy = toSvgY(dot.y);
          const tooltipY = sy - 18;
          return (
            <g style={{ pointerEvents: "none" }}>
              <rect
                x={sx - 60}
                y={tooltipY - 10}
                width={120}
                height={20}
                rx={10}
                fill="rgba(10,10,12,0.92)"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
              />
              <text
                x={sx}
                y={tooltipY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fill="#f5f6fa"
                fontWeight={500}
                fontFamily="Inter, sans-serif"
              >
                {dot.name.length > 18 ? dot.name.slice(0, 16) + "\u2026" : dot.name}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/entrepreneurs/ScatterPlot.tsx
git commit -m "feat(entrepreneurs): add ScatterPlot component"
```

---

### Task 7: Create ArchetypeGrid component

**Files:**
- Create: `src/components/entrepreneurs/ArchetypeGrid.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { PI_STYLES, CI_STYLES, type ArchetypeGridCell } from "@/lib/schemas/entrepreneurs";

interface ArchetypeGridProps {
  cells: ArchetypeGridCell[];
  maxCount: number;
}

export function ArchetypeGrid({ cells, maxCount }: ArchetypeGridProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Build a lookup: piStyle__ciStyle -> cell
  const cellMap = new Map<string, ArchetypeGridCell>();
  for (const cell of cells) {
    const key = `${cell.archetype.piStyle}__${cell.archetype.ciStyle}`;
    cellMap.set(key, cell);
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Column headers */}
        <div className="grid grid-cols-[140px_repeat(4,1fr)] gap-2 mb-2">
          <div /> {/* Empty corner cell */}
          {CI_STYLES.map((ci) => (
            <div
              key={ci.key}
              className="text-center text-xs uppercase tracking-[0.15em] text-text-secondary/50 px-2 py-2"
              style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
            >
              {ci.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        {PI_STYLES.map((pi, rowIdx) => (
          <div key={pi.key} className="grid grid-cols-[140px_repeat(4,1fr)] gap-2 mb-2">
            {/* Row header */}
            <div
              className="flex items-center text-xs uppercase tracking-[0.15em] text-text-secondary/50 pr-2"
              style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
            >
              {pi.label}
            </div>

            {/* Cells */}
            {CI_STYLES.map((ci, colIdx) => {
              const key = `${pi.key}__${ci.key}`;
              const cell = cellMap.get(key);
              if (!cell) return <div key={key} />;

              const isEmpty = cell.count === 0;
              const glowIntensity = isEmpty ? 0 : Math.max(0.03, (cell.count / maxCount) * 0.12);
              const delay = prefersReducedMotion ? 0 : (rowIdx * 4 + colIdx) * 0.04;

              if (isEmpty) {
                return (
                  <motion.div
                    key={key}
                    initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
                    className="rounded-2xl border border-border/50 bg-white/[0.01] p-4 flex flex-col justify-center items-center text-center opacity-40"
                  >
                    <p
                      className="text-sm font-semibold text-text-secondary/40"
                      style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
                    >
                      {cell.archetype.name}
                    </p>
                    <p className="mt-1 text-[10px] text-text-secondary/25 leading-tight">
                      No entrepreneurs found
                    </p>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={key}
                  initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={`/entrepreneurs/archetype/${cell.archetype.key}`}
                    className="block rounded-2xl border border-border-glass bg-bg-elevated p-4 transition-all duration-300 ease-[var(--ease-out-expo)] hover:bg-bg-surface hover:border-white/20 hover:shadow-[0_0_24px_rgb(77_163_255/0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base h-full"
                    style={{
                      boxShadow: `inset 0 0 60px rgba(77,163,255,${glowIntensity})`,
                    }}
                  >
                    <p
                      className="text-sm font-semibold text-text-primary"
                      style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
                    >
                      {cell.archetype.name}
                    </p>
                    <p className="mt-1 text-[11px] text-text-secondary/70 leading-snug line-clamp-2">
                      {cell.archetype.tagline}
                    </p>
                    <p
                      className="mt-2 text-xs text-primary/70"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {cell.count} entrepreneur{cell.count !== 1 ? "s" : ""}
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/entrepreneurs/ArchetypeGrid.tsx
git commit -m "feat(entrepreneurs): add ArchetypeGrid component"
```

---

## Chunk 4: Pages

### Task 8: Create Archetype Explorer page

**Files:**
- Create: `src/app/(marketing)/entrepreneurs/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getExplorerData } from "@/lib/queries/entrepreneurs";
import { StatCard } from "@/components/entrepreneurs/StatCard";
import { ArchetypeGrid } from "@/components/entrepreneurs/ArchetypeGrid";
import { ExplorerScatterPlots } from "./ExplorerScatterPlots";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How Do Entrepreneurs Think? | Builder's Quotient",
  description:
    "Explore 16 entrepreneur archetypes derived from real cognitive data. See how 248+ entrepreneurs across 220 industries reason and create.",
};

export default async function EntrepreneurExplorerPage() {
  const data = await getExplorerData();
  if (!data) notFound();

  const { gridCells, stats, entrepreneurs, corpusMax } = data;
  const maxCount = Math.max(...gridCells.map((c) => c.count));

  // Prepare scatter plot dots
  const scatterDots = entrepreneurs.map((e) => ({
    id: e.id,
    name: e.name,
    piD1: e.pi_d1_score,
    piD2: e.pi_d2_score,
    ciD1: e.ci_d1_score,
    ciD2: e.ci_d2_score,
    archetypeKey: e.archetype_key,
  }));

  return (
    <main className="relative min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative px-6 pt-24 pb-16 md:pt-32 md:pb-24">
        {/* Background glow */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgb(77_163_255/0.08),transparent)]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-text-secondary/60 mb-4">
            Builder&apos;s Quotient Research
          </p>
          <h1
            className="text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.1] tracking-tight bg-gradient-to-br from-white via-neutral-100 to-neutral-500/80 bg-clip-text text-transparent pb-2"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            How do the world&apos;s top entrepreneurs think?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary/90 font-light leading-relaxed">
            We analyzed {stats.totalEntrepreneurs} entrepreneurs across{" "}
            {stats.totalIndustries} industries to map how they reason and
            create.
          </p>

          {/* Stat cards */}
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              value={`${stats.pctInsightDriven}%`}
              label="are insight-driven creators"
              sublabel="Lead with intuition, not validation"
            />
            <StatCard
              value="#1 differentiator"
              label={stats.topDifferentiator}
              sublabel="The skill that separates entrepreneurs most"
            />
            <StatCard
              value={`${stats.dominantArchetype.pct}%`}
              label={`are ${stats.dominantArchetype.name}s`}
              sublabel="Nearly half share one archetype"
            />
            <StatCard
              value={`${stats.emptyArchetypeCount} archetypes`}
              label="have zero entrepreneurs"
              sublabel="What kind is almost unheard of?"
            />
          </div>

          {/* CTA */}
          <div className="mt-10">
            <Button as={Link} href="/assess/overview" size="lg" variant="outline" className="rounded-full">
              Discover your archetype
            </Button>
          </div>
        </div>
      </section>

      {/* 4x4 Grid */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <h2
            className="text-2xl font-bold text-text-primary mb-2 text-center"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            16 Archetypes
          </h2>
          <p className="text-text-secondary/70 text-center mb-10 max-w-xl mx-auto">
            Every entrepreneur falls into one of 16 cognitive archetypes based on how
            they solve problems and create opportunities.
          </p>
          <ArchetypeGrid cells={gridCells} maxCount={maxCount} />
        </div>
      </section>

      {/* Scatter Plots */}
      <section className="px-6 py-16 md:py-24 border-t border-border/50">
        <div className="mx-auto max-w-7xl">
          <h2
            className="text-2xl font-bold text-text-primary mb-2 text-center"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            The Data Behind the Archetypes
          </h2>
          <p className="text-text-secondary/70 text-center mb-10 max-w-xl mx-auto">
            Each dot is a real entrepreneur. Hover to see who they are, click
            to explore their profile.
          </p>
          <ExplorerScatterPlots dots={scatterDots} />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative px-6 py-24 md:py-32">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_60%,rgb(77_163_255/0.08),transparent)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2
            className="text-[clamp(1.875rem,4vw,3rem)] font-bold tracking-tight bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent pb-1"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            Which archetype are you?
          </h2>
          <p className="mt-4 text-lg text-text-secondary/90 font-light">
            Take the Builder&apos;s Quotient assessment and find out.
          </p>
          <div className="mt-10 group relative inline-flex items-center justify-center">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            <Button
              as={Link}
              href="/assess/overview"
              size="lg"
              className="relative rounded-full border border-white/10 bg-white/5 px-12 py-6 text-lg uppercase tracking-widest text-text-primary backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:scale-105 active:scale-95"
            >
              Begin Assessment
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Create the ExplorerScatterPlots client wrapper**

This is a small client component that wraps the two scatter plots side by side. Create it in the same route directory since it's page-specific.

Create `src/app/(marketing)/entrepreneurs/ExplorerScatterPlots.tsx`:

```tsx
"use client";

import { ScatterPlot } from "@/components/entrepreneurs/ScatterPlot";

interface Dot {
  id: string;
  name: string;
  piD1: number;
  piD2: number;
  ciD1: number;
  ciD2: number;
  archetypeKey: string;
}

interface ExplorerScatterPlotsProps {
  dots: Dot[];
}

export function ExplorerScatterPlots({ dots }: ExplorerScatterPlotsProps) {
  const piDots = dots.map((d) => ({
    id: d.id,
    name: d.name,
    x: d.piD1,
    y: d.piD2,
    archetypeKey: d.archetypeKey,
  }));

  const ciDots = dots.map((d) => ({
    id: d.id,
    name: d.name,
    x: d.ciD1,
    y: d.ciD2,
    archetypeKey: d.archetypeKey,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
      <ScatterPlot
        dots={piDots}
        title="Practical Intelligence"
        xLabelNegative="Interpersonal"
        xLabelPositive="Analytical"
        yLabelNegative="Decisive"
        yLabelPositive="Exploratory"
      />
      <ScatterPlot
        dots={ciDots}
        title="Creative Intelligence"
        xLabelNegative="Validation"
        xLabelPositive="Insight"
        yLabelNegative="Process"
        yLabelPositive="Market"
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify the page builds**

```bash
npm run build 2>&1 | tail -30
```

Expected: build succeeds, `/entrepreneurs` route appears in output.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(marketing\)/entrepreneurs/page.tsx src/app/\(marketing\)/entrepreneurs/ExplorerScatterPlots.tsx
git commit -m "feat(entrepreneurs): add Archetype Explorer overview page"
```

---

### Task 9: Create Archetype Detail page

**Files:**
- Create: `src/app/(marketing)/entrepreneurs/archetype/[archetype_key]/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getArchetypeDetail } from "@/lib/queries/entrepreneurs";
import { ARCHETYPES, PI_STYLES, CI_STYLES } from "@/lib/schemas/entrepreneurs";
import { EntrepreneurCard } from "@/components/entrepreneurs/EntrepreneurCard";
import { Button } from "@/components/ui/button";
import { ArchetypeDetailRadars } from "./ArchetypeDetailRadars";

interface PageProps {
  params: Promise<{ archetype_key: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { archetype_key } = await params;
  const ref = ARCHETYPES.find((a) => a.key === archetype_key);
  if (!ref) return { title: "Archetype Not Found" };

  return {
    title: `${ref.name} — ${ref.tagline} | Builder's Quotient`,
    description: `Explore the ${ref.name} entrepreneur archetype. ${ref.tagline}`,
  };
}

export async function generateStaticParams() {
  // Only generate pages for archetypes that could have entrepreneurs
  // All 16 are valid route params, but empty ones return notFound()
  return ARCHETYPES.map((a) => ({ archetype_key: a.key }));
}

export default async function ArchetypeDetailPage({ params }: PageProps) {
  const { archetype_key } = await params;
  const data = await getArchetypeDetail(archetype_key);
  if (!data) notFound();

  const { archetype, description, entrepreneurs, avgPiScores, avgCiScores, corpusAvgPiScores, corpusAvgCiScores, corpusMax } = data;

  const piStyleLabel = PI_STYLES.find((s) => s.key === archetype.piStyle)?.label ?? archetype.piStyle;
  const ciStyleLabel = CI_STYLES.find((s) => s.key === archetype.ciStyle)?.label ?? archetype.ciStyle;

  return (
    <main className="relative min-h-screen bg-bg-base">
      {/* Header */}
      <section className="relative px-6 pt-24 pb-12 md:pt-32 md:pb-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgb(77_163_255/0.06),transparent)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <Link
            href="/entrepreneurs"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.3em] text-text-secondary/60 hover:text-text-secondary transition-colors mb-6"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            All Archetypes
          </Link>

          <h1
            className="text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.1] tracking-tight text-text-primary"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            {archetype.name}
          </h1>
          <p className="mt-3 text-xl text-text-secondary/90 font-light italic">
            &ldquo;{archetype.tagline}&rdquo;
          </p>

          {description && (
            <p className="mx-auto mt-6 max-w-2xl text-base text-text-secondary leading-relaxed">
              {description}
            </p>
          )}

          {/* Style badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              {piStyleLabel} thinker
            </span>
            <span className="rounded-full border border-secondary/30 bg-secondary/5 px-4 py-1.5 text-sm text-secondary">
              {ciStyleLabel} creator
            </span>
          </div>

          <p className="mt-4 text-sm text-text-secondary/50" style={{ fontVariantNumeric: "tabular-nums" }}>
            {entrepreneurs.length} entrepreneur{entrepreneurs.length !== 1 ? "s" : ""} share{entrepreneurs.length === 1 ? "s" : ""} this archetype
          </p>
        </div>
      </section>

      {/* Radar Charts */}
      <section className="px-6 py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-xl font-bold text-text-primary mb-2 text-center"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            What makes {archetype.name}s distinct
          </h2>
          <p className="text-text-secondary/60 text-sm text-center mb-8">
            Compared to the average across all {entrepreneurs.length > 1 ? "248" : "all"} entrepreneurs
          </p>
          <ArchetypeDetailRadars
            avgPiScores={avgPiScores}
            avgCiScores={avgCiScores}
            corpusAvgPiScores={corpusAvgPiScores}
            corpusAvgCiScores={corpusAvgCiScores}
            corpusMax={corpusMax}
          />
        </div>
      </section>

      {/* Entrepreneur Grid */}
      <section className="px-6 py-12 md:py-16 border-t border-border/50">
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-xl font-bold text-text-primary mb-8 text-center"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            {archetype.name}s
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entrepreneurs.map((e) => (
              <EntrepreneurCard
                key={e.id}
                id={e.id}
                name={e.name}
                industries={e.industries}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 py-24 md:py-32">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_60%,rgb(77_163_255/0.06),transparent)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2
            className="text-2xl font-bold tracking-tight bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent pb-1"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            Are you {archetype.name === "The Anchor" || archetype.name === "The Alchemist" || archetype.name === "The Optimizer" ? "an" : "a"} {archetype.name}?
          </h2>
          <p className="mt-3 text-base text-text-secondary/90 font-light">
            Take the assessment to find out.
          </p>
          <div className="mt-8">
            <Button as={Link} href="/assess/overview" size="lg" variant="outline" className="rounded-full">
              Discover your archetype
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Create ArchetypeDetailRadars client component**

Create `src/app/(marketing)/entrepreneurs/archetype/[archetype_key]/ArchetypeDetailRadars.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import { RadarChart } from "@/components/results/RadarChart";
import { getShortLabel } from "@/components/results/short-labels";
import { useContainerWidth } from "@/lib/hooks/use-container-width";
import {
  PI_CANONICAL_CATEGORIES,
  CI_CANONICAL_CATEGORIES,
} from "@/lib/assessment/scoring-categories";
import type { CorpusMaxScores } from "@/lib/schemas/entrepreneurs";

interface ArchetypeDetailRadarsProps {
  avgPiScores: Record<string, number>;
  avgCiScores: Record<string, number>;
  corpusAvgPiScores: Record<string, number>;
  corpusAvgCiScores: Record<string, number>;
  corpusMax: CorpusMaxScores;
}

export function ArchetypeDetailRadars({
  avgPiScores,
  avgCiScores,
  corpusAvgPiScores,
  corpusAvgCiScores,
  corpusMax,
}: ArchetypeDetailRadarsProps) {
  const [piContainerRef, piContainerWidth] = useContainerWidth();
  const [ciContainerRef, ciContainerWidth] = useContainerWidth();
  const [piActiveIndex, setPiActiveIndex] = useState<number | null>(null);
  const [ciActiveIndex, setCiActiveIndex] = useState<number | null>(null);

  const piLabels = PI_CANONICAL_CATEGORIES.map(getShortLabel);
  const ciLabels = CI_CANONICAL_CATEGORIES.map(getShortLabel);

  const piStudent = PI_CANONICAL_CATEGORIES.map((c) => avgPiScores[c] ?? 0);
  const piCorpus = PI_CANONICAL_CATEGORIES.map((c) => corpusAvgPiScores[c] ?? 0);
  const piMax = PI_CANONICAL_CATEGORIES.map((c) => corpusMax.pi[c] ?? 1);
  const piChartMax = Math.max(...piMax);

  const ciStudent = CI_CANONICAL_CATEGORIES.map((c) => avgCiScores[c] ?? 0);
  const ciCorpus = CI_CANONICAL_CATEGORIES.map((c) => corpusAvgCiScores[c] ?? 0);
  const ciMax = CI_CANONICAL_CATEGORIES.map((c) => corpusMax.ci[c] ?? 1);
  const ciChartMax = Math.max(...ciMax);

  const handlePiHover = useCallback((idx: number | null) => setPiActiveIndex(idx), []);
  const handleCiHover = useCallback((idx: number | null) => setCiActiveIndex(idx), []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* PI Radar */}
      <div>
        <p
          className="text-xs uppercase tracking-[0.2em] text-text-secondary/60 mb-4 text-center"
          style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
        >
          Practical Intelligence
        </p>
        <div ref={piContainerRef} className="w-full max-w-md mx-auto">
          <RadarChart
            categories={piLabels}
            studentScores={piStudent}
            corpusScores={piCorpus}
            maxValue={piChartMax}
            accentColor="#4da3ff"
            onCategoryHover={handlePiHover}
            activeCategoryIndex={piActiveIndex}
            containerWidth={piContainerWidth}
          />
        </div>
        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary" aria-hidden="true" />
            <span className="text-xs text-text-secondary">This Archetype</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border border-white/30 bg-white/5" aria-hidden="true" />
            <span className="text-xs text-text-secondary">All Entrepreneurs</span>
          </div>
        </div>
      </div>

      {/* CI Radar */}
      <div>
        <p
          className="text-xs uppercase tracking-[0.2em] text-text-secondary/60 mb-4 text-center"
          style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
        >
          Creative Intelligence
        </p>
        <div ref={ciContainerRef} className="w-full max-w-md mx-auto">
          <RadarChart
            categories={ciLabels}
            studentScores={ciStudent}
            corpusScores={ciCorpus}
            maxValue={ciChartMax}
            accentColor="#e9b949"
            onCategoryHover={handleCiHover}
            activeCategoryIndex={ciActiveIndex}
            containerWidth={ciContainerWidth}
          />
        </div>
        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-secondary" aria-hidden="true" />
            <span className="text-xs text-text-secondary">This Archetype</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border border-white/30 bg-white/5" aria-hidden="true" />
            <span className="text-xs text-text-secondary">All Entrepreneurs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify the page builds**

```bash
npm run build 2>&1 | tail -30
```

Expected: build succeeds, `/entrepreneurs/archetype/[archetype_key]` route appears.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(marketing)/entrepreneurs/archetype/"
git commit -m "feat(entrepreneurs): add Archetype Detail page"
```

---

### Task 10: Create Entrepreneur Profile page

**Files:**
- Create: `src/app/(marketing)/entrepreneurs/[id]/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getEntrepreneurProfile } from "@/lib/queries/entrepreneurs";
import { PI_STYLES, CI_STYLES } from "@/lib/schemas/entrepreneurs";
import { ArchetypeBadge } from "@/components/entrepreneurs/ArchetypeBadge";
import { Button } from "@/components/ui/button";
import { EntrepreneurProfileVisuals } from "./EntrepreneurProfileVisuals";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getEntrepreneurProfile(id);
  if (!data) return { title: "Entrepreneur Not Found" };

  return {
    title: `${data.entrepreneur.name} — ${data.entrepreneur.archetype_name} | Builder's Quotient`,
    description: `Explore ${data.entrepreneur.name}'s cognitive profile. ${data.entrepreneur.archetype_tagline}`,
  };
}

export default async function EntrepreneurProfilePage({ params }: PageProps) {
  const { id } = await params;
  const data = await getEntrepreneurProfile(id);
  if (!data) notFound();

  const { entrepreneur, archetypeAvgPiScores, archetypeAvgCiScores, corpusMax, allEntrepreneurs } = data;

  const piStyleLabel = PI_STYLES.find((s) => s.key === entrepreneur.pi_style)?.label ?? entrepreneur.pi_style;
  const ciStyleLabel = CI_STYLES.find((s) => s.key === entrepreneur.ci_style)?.label ?? entrepreneur.ci_style;

  return (
    <main className="relative min-h-screen bg-bg-base">
      {/* Hero Header */}
      <section className="relative px-6 pt-24 pb-12 md:pt-32 md:pb-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgb(77_163_255/0.06),transparent)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <Link
            href={`/entrepreneurs/archetype/${entrepreneur.archetype_key}`}
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.3em] text-text-secondary/60 hover:text-text-secondary transition-colors mb-6"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {entrepreneur.archetype_name}
          </Link>

          <h1
            className="text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.1] tracking-tight text-text-primary"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            {entrepreneur.name}
          </h1>

          {/* Industries */}
          {entrepreneur.industries && entrepreneur.industries.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {entrepreneur.industries.map((industry) => (
                <span
                  key={industry}
                  className="rounded-sm bg-white/5 px-2.5 py-1 text-xs text-text-secondary"
                >
                  {industry}
                </span>
              ))}
            </div>
          )}

          {/* Archetype badge */}
          <div className="mt-6">
            <ArchetypeBadge
              archetypeKey={entrepreneur.archetype_key}
              name={entrepreneur.archetype_name}
              tagline={entrepreneur.archetype_tagline}
              linked
            />
          </div>

          {/* Style badges */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-primary/70">{piStyleLabel} thinker</span>
            <span className="text-text-secondary/30">&middot;</span>
            <span className="text-sm text-secondary/70">{ciStyleLabel} creator</span>
          </div>

          {/* Bio */}
          {entrepreneur.bio_narrative && (
            <p className="mx-auto mt-8 max-w-2xl text-base text-text-secondary leading-relaxed">
              {entrepreneur.bio_narrative}
            </p>
          )}
        </div>
      </section>

      {/* Visualizations (client component) */}
      <EntrepreneurProfileVisuals
        piScores={entrepreneur.pi_category_scores}
        ciScores={entrepreneur.ci_category_scores}
        archetypeAvgPiScores={archetypeAvgPiScores}
        archetypeAvgCiScores={archetypeAvgCiScores}
        corpusMax={corpusMax}
        entrepreneurId={entrepreneur.id}
        piD1={entrepreneur.pi_d1_score}
        piD2={entrepreneur.pi_d2_score}
        ciD1={entrepreneur.ci_d1_score}
        ciD2={entrepreneur.ci_d2_score}
        allEntrepreneurs={allEntrepreneurs}
        archetypeName={entrepreneur.archetype_name}
      />

      {/* CTA */}
      <section className="relative px-6 py-24 md:py-32">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_60%,rgb(77_163_255/0.06),transparent)]"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2
            className="text-2xl font-bold tracking-tight bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent pb-1"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            See how you compare
          </h2>
          <p className="mt-3 text-base text-text-secondary/90 font-light">
            Take the Builder&apos;s Quotient assessment and discover your own
            cognitive&nbsp;profile.
          </p>
          <div className="mt-8">
            <Button as={Link} href="/assess/overview" size="lg" variant="outline" className="rounded-full">
              Begin Assessment
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Create EntrepreneurProfileVisuals client component**

Create `src/app/(marketing)/entrepreneurs/[id]/EntrepreneurProfileVisuals.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import { RadarChart } from "@/components/results/RadarChart";
import { ScatterPlot } from "@/components/entrepreneurs/ScatterPlot";
import { getShortLabel } from "@/components/results/short-labels";
import { useContainerWidth } from "@/lib/hooks/use-container-width";
import {
  PI_CANONICAL_CATEGORIES,
  CI_CANONICAL_CATEGORIES,
} from "@/lib/assessment/scoring-categories";
import type { CorpusMaxScores } from "@/lib/schemas/entrepreneurs";

interface EntrepreneurProfileVisualsProps {
  piScores: Record<string, number>;
  ciScores: Record<string, number>;
  archetypeAvgPiScores: Record<string, number>;
  archetypeAvgCiScores: Record<string, number>;
  corpusMax: CorpusMaxScores;
  entrepreneurId: string;
  piD1: number;
  piD2: number;
  ciD1: number;
  ciD2: number;
  allEntrepreneurs: { id: string; pi_d1_score: number; pi_d2_score: number; ci_d1_score: number; ci_d2_score: number }[];
  archetypeName: string;
}

export function EntrepreneurProfileVisuals({
  piScores,
  ciScores,
  archetypeAvgPiScores,
  archetypeAvgCiScores,
  corpusMax,
  entrepreneurId,
  piD1,
  piD2,
  ciD1,
  ciD2,
  allEntrepreneurs,
  archetypeName,
}: EntrepreneurProfileVisualsProps) {
  const [piContainerRef, piContainerWidth] = useContainerWidth();
  const [ciContainerRef, ciContainerWidth] = useContainerWidth();
  const [piActiveIndex, setPiActiveIndex] = useState<number | null>(null);
  const [ciActiveIndex, setCiActiveIndex] = useState<number | null>(null);

  const piLabels = PI_CANONICAL_CATEGORIES.map(getShortLabel);
  const ciLabels = CI_CANONICAL_CATEGORIES.map(getShortLabel);

  const piStudent = PI_CANONICAL_CATEGORIES.map((c) => piScores[c] ?? 0);
  const piCorpus = PI_CANONICAL_CATEGORIES.map((c) => archetypeAvgPiScores[c] ?? 0);
  const piChartMax = Math.max(...PI_CANONICAL_CATEGORIES.map((c) => corpusMax.pi[c] ?? 0), 0.001);

  const ciStudent = CI_CANONICAL_CATEGORIES.map((c) => ciScores[c] ?? 0);
  const ciCorpus = CI_CANONICAL_CATEGORIES.map((c) => archetypeAvgCiScores[c] ?? 0);
  const ciChartMax = Math.max(...CI_CANONICAL_CATEGORIES.map((c) => corpusMax.ci[c] ?? 0), 0.001);

  const handlePiHover = useCallback((idx: number | null) => setPiActiveIndex(idx), []);
  const handleCiHover = useCallback((idx: number | null) => setCiActiveIndex(idx), []);

  // Scatter plot dots
  const piScatterDots = allEntrepreneurs.map((e) => ({
    id: e.id,
    name: "",
    x: e.pi_d1_score,
    y: e.pi_d2_score,
    archetypeKey: "",
  }));

  const ciScatterDots = allEntrepreneurs.map((e) => ({
    id: e.id,
    name: "",
    x: e.ci_d1_score,
    y: e.ci_d2_score,
    archetypeKey: "",
  }));

  return (
    <>
      {/* Radar Charts - stacked vertically */}
      <section className="px-6 py-12 md:py-16">
        <div className="mx-auto max-w-4xl space-y-16">
          {/* PI Radar */}
          <div>
            <p
              className="text-xs uppercase tracking-[0.2em] text-text-secondary/60 mb-4 text-center"
              style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
            >
              Practical Intelligence
            </p>
            <div ref={piContainerRef} className="w-full max-w-lg mx-auto">
              <RadarChart
                categories={piLabels}
                studentScores={piStudent}
                corpusScores={piCorpus}
                maxValue={piChartMax}
                accentColor="#4da3ff"
                onCategoryHover={handlePiHover}
                activeCategoryIndex={piActiveIndex}
                containerWidth={piContainerWidth}
              />
            </div>
            <div className="flex items-center justify-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary" aria-hidden="true" />
                <span className="text-xs text-text-secondary">This Entrepreneur</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border border-white/30 bg-white/5" aria-hidden="true" />
                <span className="text-xs text-text-secondary">{archetypeName} Average</span>
              </div>
            </div>
          </div>

          {/* CI Radar */}
          <div>
            <p
              className="text-xs uppercase tracking-[0.2em] text-text-secondary/60 mb-4 text-center"
              style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
            >
              Creative Intelligence
            </p>
            <div ref={ciContainerRef} className="w-full max-w-lg mx-auto">
              <RadarChart
                categories={ciLabels}
                studentScores={ciStudent}
                corpusScores={ciCorpus}
                maxValue={ciChartMax}
                accentColor="#e9b949"
                onCategoryHover={handleCiHover}
                activeCategoryIndex={ciActiveIndex}
                containerWidth={ciContainerWidth}
              />
            </div>
            <div className="flex items-center justify-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary" aria-hidden="true" />
                <span className="text-xs text-text-secondary">This Entrepreneur</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border border-white/30 bg-white/5" aria-hidden="true" />
                <span className="text-xs text-text-secondary">{archetypeName} Average</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quadrant Position */}
      <section className="px-6 py-12 md:py-16 border-t border-border/50">
        <div className="mx-auto max-w-4xl">
          <h2
            className="text-xl font-bold text-text-primary mb-2 text-center"
            style={{ fontFamily: "'Inter Tight', Inter, sans-serif" }}
          >
            Position Among Peers
          </h2>
          <p className="text-text-secondary/60 text-sm text-center mb-8">
            Where this entrepreneur sits relative to all others
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <ScatterPlot
              dots={piScatterDots}
              title="Practical Intelligence"
              xLabelNegative="Interpersonal"
              xLabelPositive="Analytical"
              yLabelNegative="Decisive"
              yLabelPositive="Exploratory"
              highlightId={entrepreneurId}
            />
            <ScatterPlot
              dots={ciScatterDots}
              title="Creative Intelligence"
              xLabelNegative="Validation"
              xLabelPositive="Insight"
              yLabelNegative="Process"
              yLabelPositive="Market"
              highlightId={entrepreneurId}
            />
          </div>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 3: Verify the page builds**

```bash
npm run build 2>&1 | tail -30
```

Expected: build succeeds, `/entrepreneurs/[id]` route appears.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(marketing)/entrepreneurs/[id]/"
git commit -m "feat(entrepreneurs): add Entrepreneur Profile page"
```

---

## Chunk 5: Build Verification & Polish

### Task 11: Full build verification and smoke test

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: clean build with all three new routes showing in output.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: no new lint errors.

- [ ] **Step 3: Run existing tests to ensure no regressions**

```bash
npm run test:run
```

Expected: same pass/fail counts as before (5 pre-existing failures are known).

- [ ] **Step 4: Start dev server and verify pages render**

```bash
npm run dev
```

Manually verify:
- `/entrepreneurs` loads with hero, stat cards, grid, scatter plots, and CTA
- Click a populated grid cell -> archetype detail page loads with radars and entrepreneur cards
- Click an entrepreneur card -> profile page loads with radars and quadrant scatter plots
- Back navigation works correctly
- Empty grid cells are styled but not clickable

- [ ] **Step 5: Fix any issues found**

Address any build errors, rendering issues, or type errors discovered during smoke testing.

- [ ] **Step 6: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(entrepreneurs): address build/render issues from smoke test"
```
