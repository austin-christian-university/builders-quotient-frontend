# Narrative Match Slides Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace radar-chart-overlay match slides with narrative-driven entrepreneur profile cards for both reasoning and communication matches.

**Architecture:** New DB tables for entrepreneur narratives (reasoning + communication), updated Zod schemas replacing category-score types with narrative types, rewritten match slide components using scrollable narrative cards with pill-based tab navigation instead of radar charts and modals.

**Tech Stack:** Supabase (migration), Zod (schemas), React 19 + Framer Motion (components), TypeScript strict mode

**Spec:** `docs/superpowers/specs/2026-03-11-narrative-match-slides-design.md`

---

## Chunk 1: Database Migration + Schema

### Task 1: Apply Supabase migration

**Files:**
- Create: `supabase/migrations/20260311_entrepreneur_narratives.sql`

- [ ] **Step 1: Create the migration file**

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

-- RLS: deny-all for anon, service role bypasses
ALTER TABLE entrepreneur_reasoning_narratives ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrepreneur_communication_narratives ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Run the SQL above via `mcp__plugin_supabase_supabase__apply_migration` against project `pdvzwldlpnpuvepnoliq`.

- [ ] **Step 3: Verify tables exist**

Run: `SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'entrepreneur_%_narratives' ORDER BY table_name;`
Expected: Two rows — `entrepreneur_communication_narratives` and `entrepreneur_reasoning_narratives`.

Also verify: `SELECT column_name FROM information_schema.columns WHERE table_name = 'entrepreneurs' AND column_name = 'bio_narrative';`
Expected: One row.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260311_entrepreneur_narratives.sql
git commit -m "Add entrepreneur narrative tables for reasoning and communication"
```

---

### Task 2: Update Zod schemas

**Files:**
- Modify: `src/lib/schemas/results.ts`
- Modify: `src/lib/schemas/results.test.ts`

- [ ] **Step 1: Write failing tests for new narrative schemas**

Replace the existing `matchRunnerUpSchema`, `reasoningMatchSchema`, and `communicationMatchSchema` test blocks in `src/lib/schemas/results.test.ts` with tests for the new narrative shapes. Keep existing passing tests for `narrativeBlockSchema`, `corpusAverageSchema`, etc. untouched.

Replace these imports at top of test file:

```typescript
import {
  narrativeBlockSchema,
  corpusAverageCategorySchema,
  corpusAverageSchema,
  signatureMoveSchema,
  entrepreneurNarrativeSchema,
  narrativeMatchSchema,
  resultsPageDataSchema,
} from "./results";
```

Replace the `matchRunnerUpSchema`, `reasoningMatchSchema`, `communicationMatchSchema` test blocks with:

```typescript
// --- signatureMoveSchema ---

describe("signatureMoveSchema", () => {
  it("validates a valid signature move", () => {
    const result = signatureMoveSchema.safeParse({
      title: "The cereal milk pivot",
      description: "Tosi ran 40+ iterations until the texture was undeniable.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = signatureMoveSchema.safeParse({
      description: "Some description.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing description", () => {
    const result = signatureMoveSchema.safeParse({
      title: "Some title",
    });
    expect(result.success).toBe(false);
  });
});

// --- entrepreneurNarrativeSchema ---

describe("entrepreneurNarrativeSchema", () => {
  const validNarrative = {
    entrepreneurName: "Christina Tosi",
    entrepreneurId: "f6f61ac5-48b9-4ef2-a9bb-f5a35a0a64a5",
    companies: ["Milk Bar"],
    industries: ["Food", "Bakery"],
    bioNarrative: "Christina Tosi transformed nostalgic childhood flavors into a global dessert empire.",
    fallbackBioSnippet: "You think like Christina Tosi, the culinary rebel.",
    domainStyle: "Solves problems through relentless experimentation.",
    signatureMoves: [
      { title: "The cereal milk pivot", description: "Ran 40+ iterations." },
    ],
    strengths: "Exceptional at reframing constraints as creative fuel.",
    blindspots: "Can over-index on experimentation when decisive action is needed.",
  };

  it("validates a full narrative", () => {
    const result = entrepreneurNarrativeSchema.safeParse(validNarrative);
    expect(result.success).toBe(true);
  });

  it("validates with all nullable fields null", () => {
    const result = entrepreneurNarrativeSchema.safeParse({
      ...validNarrative,
      bioNarrative: null,
      fallbackBioSnippet: null,
      domainStyle: null,
      strengths: null,
      blindspots: null,
    });
    expect(result.success).toBe(true);
  });

  it("validates with empty signatureMoves", () => {
    const result = entrepreneurNarrativeSchema.safeParse({
      ...validNarrative,
      signatureMoves: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing entrepreneurName", () => {
    const { entrepreneurName: _, ...rest } = validNarrative;
    const result = entrepreneurNarrativeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects missing entrepreneurId", () => {
    const { entrepreneurId: _, ...rest } = validNarrative;
    const result = entrepreneurNarrativeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// --- narrativeMatchSchema ---

describe("narrativeMatchSchema", () => {
  const validNarrative = {
    entrepreneurName: "Christina Tosi",
    entrepreneurId: "f6f61ac5-48b9-4ef2-a9bb-f5a35a0a64a5",
    companies: ["Milk Bar"],
    industries: ["Food"],
    bioNarrative: "Origin story.",
    fallbackBioSnippet: null,
    domainStyle: "Reasoning style paragraph.",
    signatureMoves: [],
    strengths: "Strengths paragraph.",
    blindspots: "Blindspots paragraph.",
  };

  const validMatch = {
    primary: validNarrative,
    runnersUp: [
      { ...validNarrative, entrepreneurName: "Michael Bloomberg", entrepreneurId: "e38d03f9" },
      { ...validNarrative, entrepreneurName: "Stewart Butterfield", entrepreneurId: "183fb731" },
    ],
  };

  it("validates a full match with primary + 2 runner-ups", () => {
    const result = narrativeMatchSchema.safeParse(validMatch);
    expect(result.success).toBe(true);
  });

  it("validates with empty runner-ups", () => {
    const result = narrativeMatchSchema.safeParse({
      primary: validNarrative,
      runnersUp: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 2 runner-ups", () => {
    const result = narrativeMatchSchema.safeParse({
      primary: validNarrative,
      runnersUp: [
        { ...validNarrative, entrepreneurName: "A", entrepreneurId: "1" },
        { ...validNarrative, entrepreneurName: "B", entrepreneurId: "2" },
        { ...validNarrative, entrepreneurName: "C", entrepreneurId: "3" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing primary", () => {
    const result = narrativeMatchSchema.safeParse({
      runnersUp: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing runnersUp", () => {
    const result = narrativeMatchSchema.safeParse({
      primary: validNarrative,
    });
    expect(result.success).toBe(false);
  });
});
```

Also update the `resultsPageDataSchema` test's `minimalValidData` — the `reasoningMatch` and `communicationMatch` fields change shape. Update these tests:

```typescript
describe("resultsPageDataSchema", () => {
  // ... keep existing baseApplicant, baseCategoryScore, baseArchetype,
  // baseNarrativeBlock, baseRadarCategory definitions ...

  const minimalValidData = {
    applicant: baseApplicant,
    piCategories: [baseCategoryScore],
    ciCategories: [baseCategoryScore],
    piRadar: [baseRadarCategory],
    ciRadar: [baseRadarCategory],
    piCorpusAverage: null,
    ciCorpusAverage: null,
    archetype: baseArchetype,
    intelligenceNarrative: [baseNarrativeBlock],
    reasoningMatch: null,
    communicationProfile: null,
    communicationCorpusAverage: null,
    communicationNarrative: [],
    communicationMatch: null,
    personality: null,
    personalityNarrative: [],
    narrative: { piSummaries: ["PI summary."], ciSummaries: ["CI summary."] },
  };

  // ... keep all existing tests for minimalValidData ...
  // They should still pass since reasoningMatch and communicationMatch are nullable
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/schemas/results.test.ts`
Expected: New `signatureMoveSchema`, `entrepreneurNarrativeSchema`, `narrativeMatchSchema` tests FAIL (schemas don't exist yet). Existing tests may also fail due to import changes.

- [ ] **Step 3: Update the schema file**

In `src/lib/schemas/results.ts`, replace the old match-related schemas. Keep everything above the `// --- New match schemas ---` comment. Replace from that comment through the end of the file:

```typescript
// --- Narrative match schemas (replaces old radar-based match schemas) ---

export const signatureMoveSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const entrepreneurNarrativeSchema = z.object({
  entrepreneurName: z.string(),
  entrepreneurId: z.string(),
  companies: z.array(z.string()),
  industries: z.array(z.string()),
  bioNarrative: z.string().nullable(),
  fallbackBioSnippet: z.string().nullable(),
  domainStyle: z.string().nullable(),
  signatureMoves: z.array(signatureMoveSchema),
  strengths: z.string().nullable(),
  blindspots: z.string().nullable(),
});

export const narrativeMatchSchema = z.object({
  primary: entrepreneurNarrativeSchema,
  runnersUp: z.array(entrepreneurNarrativeSchema).max(2),
});

// Both reasoning and communication matches use the same narrative structure
export const reasoningMatchSchema = narrativeMatchSchema;
export const communicationMatchSchema = narrativeMatchSchema;

// --- Main schema ---

export const resultsPageDataSchema = z.object({
  applicant: z.object({
    displayName: z.string().nullable(),
    assessmentType: z.enum(["public", "admissions"]),
  }),
  piCategories: z.array(categoryScoreSchema),
  ciCategories: z.array(categoryScoreSchema),
  piRadar: z.array(radarCategorySchema),
  ciRadar: z.array(radarCategorySchema),
  piCorpusAverage: corpusAverageSchema.nullable(),
  ciCorpusAverage: corpusAverageSchema.nullable(),
  archetype: archetypeSchema,
  intelligenceNarrative: z.array(narrativeBlockSchema),
  reasoningMatch: narrativeMatchSchema.nullable(),
  communicationProfile: z
    .array(z.object({ category: z.string(), value: z.number() }))
    .nullable(),
  communicationCorpusAverage: corpusAverageSchema.nullable(),
  communicationNarrative: z.array(narrativeBlockSchema),
  communicationMatch: narrativeMatchSchema.nullable(),
  personality: personalityDataSchema.nullable(),
  personalityNarrative: z.array(narrativeBlockSchema),
  narrative: z.object({
    piSummaries: z.array(z.string()),
    ciSummaries: z.array(z.string()),
  }),
});

// --- Exported types ---

export type ResultsPageData = z.infer<typeof resultsPageDataSchema>;
export type CategoryScore = z.infer<typeof categoryScoreSchema>;
export type Archetype = z.infer<typeof archetypeSchema>;
export type PersonalityFacetScore = z.infer<typeof personalityFacetScoreSchema>;
export type PersonalityData = z.infer<typeof personalityDataSchema>;
export type NarrativeBlock = z.infer<typeof narrativeBlockSchema>;
export type CorpusAverageCategory = z.infer<typeof corpusAverageCategorySchema>;
export type CorpusAverage = z.infer<typeof corpusAverageSchema>;
export type RadarCategory = z.infer<typeof radarCategorySchema>;
export type SignatureMove = z.infer<typeof signatureMoveSchema>;
export type EntrepreneurNarrative = z.infer<typeof entrepreneurNarrativeSchema>;
export type NarrativeMatch = z.infer<typeof narrativeMatchSchema>;
```

This removes the old exports: `EntrepreneurMatch`, `MatchRunnerUp`, `ReasoningMatch`, `CommunicationMatch`, `matchRunnerUpSchema`, `entrepreneurMatchSchema`, `categoryProfilePointSchema`, `sharedTraitSchema`, `traitDifferenceSchema`, `runnerUpSchema`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/schemas/results.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: Type errors in `results.ts` query file and match slide components (they reference old types). This is expected — we fix those in the next tasks.

- [ ] **Step 6: Commit**

```bash
git add src/lib/schemas/results.ts src/lib/schemas/results.test.ts
git commit -m "Replace radar-based match schemas with narrative match schemas"
```

---

## Chunk 2: Query Layer

### Task 3: Rewrite reasoning match query

**Files:**
- Modify: `src/lib/queries/results.ts`

- [ ] **Step 1: Update imports**

Replace the type imports at top of file. Remove `EntrepreneurMatch`, `MatchRunnerUp`, `ReasoningMatch`. The file should import:

```typescript
import type {
  ResultsPageData,
  CategoryScore,
  PersonalityData,
  EntrepreneurNarrative,
  NarrativeMatch,
  NarrativeBlock,
  CorpusAverage,
  RadarCategory,
} from "@/lib/schemas/results";
```

- [ ] **Step 2: Add helper to build EntrepreneurNarrative from DB rows**

Add this helper function above `getResultsByToken`:

```typescript
/** Build an EntrepreneurNarrative from DB row data. */
function buildEntrepreneurNarrative(
  entrepreneurId: string,
  entrepreneurName: string,
  entrepreneur: { companies: unknown; industries: unknown; bio_narrative: string | null } | null,
  narrativeRow: {
    reasoning_style?: string;
    communication_style?: string;
    signature_moves: unknown;
    strengths: string;
    blindspots: string;
  } | null,
  fallbackBioSnippet: string | null,
  domain: "reasoning" | "communication"
): EntrepreneurNarrative {
  return {
    entrepreneurName,
    entrepreneurId,
    companies: (entrepreneur?.companies as string[]) ?? [],
    industries: (entrepreneur?.industries as string[]) ?? [],
    bioNarrative: entrepreneur?.bio_narrative ?? null,
    fallbackBioSnippet,
    domainStyle: domain === "reasoning"
      ? narrativeRow?.reasoning_style ?? null
      : narrativeRow?.communication_style ?? null,
    signatureMoves: Array.isArray(narrativeRow?.signature_moves)
      ? (narrativeRow.signature_moves as { title: string; description: string }[])
      : [],
    strengths: narrativeRow?.strengths ?? null,
    blindspots: narrativeRow?.blindspots ?? null,
  };
}
```

- [ ] **Step 3: Replace reasoning match block (step 12)**

Replace the entire reasoning match block (the `// 12. Reasoning match` section through the closing `}` before the return statement) with:

```typescript
  // 12. Reasoning match (narrative-based entrepreneur matching)
  let reasoningMatch: NarrativeMatch | null = null;

  const { data: reasoningProfile } = await supabase
    .from("student_reasoning_profiles")
    .select(
      "matched_entrepreneur_id, matched_entrepreneur_name, matched_bio_snippet, top_5_matches"
    )
    .eq("session_id", session.id)
    .single();

  if (reasoningProfile?.matched_entrepreneur_id) {
    // Collect all 3 entrepreneur IDs (primary + first 2 from top_5)
    const top5Reasoning =
      (reasoningProfile.top_5_matches as
        | { entrepreneur_id: string; name: string }[]
        | null) ?? [];
    const runnerUpEntries = top5Reasoning.slice(1, 3);
    const allReasoningIds = [
      reasoningProfile.matched_entrepreneur_id,
      ...runnerUpEntries.map((e) => e.entrepreneur_id),
    ];

    // Batch fetch entrepreneur details + reasoning narratives
    const [{ data: reasoningEntrepreneurs }, { data: reasoningNarratives }] =
      await Promise.all([
        supabase
          .from("entrepreneurs")
          .select("id, name, companies, industries, bio_narrative")
          .in("id", allReasoningIds),
        supabase
          .from("entrepreneur_reasoning_narratives")
          .select(
            "entrepreneur_id, reasoning_style, signature_moves, strengths, blindspots"
          )
          .in("entrepreneur_id", allReasoningIds),
      ]);

    const findEntrepreneur = (id: string) =>
      reasoningEntrepreneurs?.find((e) => e.id === id) ?? null;
    const findNarrative = (id: string) =>
      reasoningNarratives?.find((n) => n.entrepreneur_id === id) ?? null;

    const primary = buildEntrepreneurNarrative(
      reasoningProfile.matched_entrepreneur_id,
      reasoningProfile.matched_entrepreneur_name,
      findEntrepreneur(reasoningProfile.matched_entrepreneur_id),
      findNarrative(reasoningProfile.matched_entrepreneur_id),
      reasoningProfile.matched_bio_snippet ?? null,
      "reasoning"
    );

    const runnersUp = runnerUpEntries.map((entry) =>
      buildEntrepreneurNarrative(
        entry.entrepreneur_id,
        entry.name,
        findEntrepreneur(entry.entrepreneur_id),
        findNarrative(entry.entrepreneur_id),
        null,
        "reasoning"
      )
    );

    reasoningMatch = { primary, runnersUp };
  }
```

- [ ] **Step 4: Replace communication match block (step 11)**

Replace the entire `// 11. Communication match` section. The new version fetches narrative data instead of personality vectors. Replace from `// 11. Communication match (was entrepreneurMatch)` through the closing `}` of `if (studentProfile?.matched_entrepreneur_id)`:

```typescript
  // 11. Communication match (narrative-based entrepreneur matching)
  let communicationMatch: NarrativeMatch | null = null;

  // Keep existing communication profile + corpus average logic (steps 11a-11d)
  // but replace the match assembly at the end

  const { data: studentProfile } = await supabase
    .from("student_personality_profiles")
    .select(
      "matched_entrepreneur_id, matched_entrepreneur_name, matched_cosine_similarity, matched_bio_snippet, top_5_matches, personality_vector"
    )
    .eq("session_id", session.id)
    .single();

  if (studentProfile?.matched_entrepreneur_id) {
    // --- Communication profile + corpus average (kept from old code) ---
    const studentVector =
      (studentProfile.personality_vector as PersonalityVector | null) ?? {};

    communicationProfile = PERSONALITY_DIMENSION_KEYS
      .filter((k) => studentVector[k] != null)
      .map((k) => ({
        category: k,
        value: studentVector[k],
      }));

    if (communicationProfile.length === 0) {
      communicationProfile = null;
    }

    if (communicationProfile) {
      communicationNarrative = getCommunicationNarrative(communicationProfile);
    }

    if (communicationProfile) {
      const { data: allProfiles } = await supabase
        .from("entrepreneur_personality_profiles")
        .select("personality_vector")
        .not("personality_vector", "is", null);

      if (allProfiles && allProfiles.length > 0) {
        const dimSums = new Map<string, { sum: number; count: number }>();

        for (const row of allProfiles) {
          const vec = row.personality_vector as PersonalityVector | null;
          if (!vec) continue;
          for (const k of PERSONALITY_DIMENSION_KEYS) {
            if (vec[k] == null) continue;
            const existing = dimSums.get(k);
            if (existing) {
              existing.sum += vec[k];
              existing.count += 1;
            } else {
              dimSums.set(k, { sum: vec[k], count: 1 });
            }
          }
        }

        const corpusCategories = communicationProfile
          .filter((p) => dimSums.has(p.category))
          .map((p) => {
            const a = dimSums.get(p.category)!;
            return {
              category: p.category,
              averageScore: Math.round((a.sum / a.count) * 100 * 10) / 10,
            };
          });

        if (corpusCategories.length > 0) {
          communicationCorpusAverage = { categories: corpusCategories };
        }
      }
    }

    // --- Communication match (narrative-based) ---
    const top5Comm =
      (studentProfile.top_5_matches as
        | { entrepreneur_id: string; name: string; cosine_similarity: number }[]
        | null) ?? [];
    const commRunnerUpEntries = top5Comm.slice(1, 3);
    const allCommIds = [
      studentProfile.matched_entrepreneur_id,
      ...commRunnerUpEntries.map((e) => e.entrepreneur_id),
    ];

    const [{ data: commEntrepreneurs }, { data: commNarratives }] =
      await Promise.all([
        supabase
          .from("entrepreneurs")
          .select("id, name, companies, industries, bio_narrative")
          .in("id", allCommIds),
        supabase
          .from("entrepreneur_communication_narratives")
          .select(
            "entrepreneur_id, communication_style, signature_moves, strengths, blindspots"
          )
          .in("entrepreneur_id", allCommIds),
      ]);

    const findCommEntrepreneur = (id: string) =>
      commEntrepreneurs?.find((e) => e.id === id) ?? null;
    const findCommNarrative = (id: string) =>
      commNarratives?.find((n) => n.entrepreneur_id === id) ?? null;

    const commPrimary = buildEntrepreneurNarrative(
      studentProfile.matched_entrepreneur_id,
      studentProfile.matched_entrepreneur_name,
      findCommEntrepreneur(studentProfile.matched_entrepreneur_id),
      findCommNarrative(studentProfile.matched_entrepreneur_id),
      studentProfile.matched_bio_snippet ?? null,
      "communication"
    );

    const commRunnersUp = commRunnerUpEntries.map((entry) =>
      buildEntrepreneurNarrative(
        entry.entrepreneur_id,
        entry.name,
        findCommEntrepreneur(entry.entrepreneur_id),
        findCommNarrative(entry.entrepreneur_id),
        null,
        "communication"
      )
    );

    communicationMatch = { primary: commPrimary, runnersUp: commRunnersUp };
  }
```

- [ ] **Step 5: Clean up removed code**

Remove from the query file:
- The `computeCategoryScoresFromMoveProbs` helper (it was inside the old reasoning match block)
- The `moveToCategoryMap` construction
- All `entrepreneur_reasoning_profiles.reasoning_move_probabilities` fetches
- All `averageByCategory` calls and radar-comparison logic from the old communication match
- All imports that are no longer used (`averageByCategory`, `PERSONALITY_DIMENSION_NAMES`, `PERSONALITY_DIMENSION_KEYS` — check if still needed for communication profile/corpus average before removing)

**Important:** Keep the `communicationProfile`, `communicationCorpusAverage`, and `communicationNarrative` computation — those feed the Communication Radar slide (slide 7) which is NOT changing. Only the match assembly changes.

Check that `PERSONALITY_DIMENSION_KEYS` is still imported (needed for communication profile). `PERSONALITY_DIMENSION_NAMES` and `averageByCategory` can be removed if no longer used.

- [ ] **Step 6: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: Errors only in component files (match slides still reference old types). Query file should be clean.

- [ ] **Step 7: Commit**

```bash
git add src/lib/queries/results.ts
git commit -m "Rewrite match queries to fetch narrative content instead of radar data"
```

---

## Chunk 3: Match Slide Components

### Task 4: Create shared NarrativeMatchCard component

**Files:**
- Create: `src/components/results/NarrativeMatchCard.tsx`

This is the scrollable narrative card content that both match slides share. It receives a single `EntrepreneurNarrative` and renders the full story.

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { motion } from "motion/react";
import type { EntrepreneurNarrative } from "@/lib/schemas/results";

interface NarrativeMatchCardProps {
  data: EntrepreneurNarrative;
  accentColor: string;
  domainLabel: string; // "Reasoning Style" or "Communication Style"
}

export function NarrativeMatchCard({ data, accentColor, domainLabel }: NarrativeMatchCardProps) {
  const bio = data.bioNarrative ?? data.fallbackBioSnippet;

  return (
    <div className="relative rounded-2xl border overflow-hidden" style={{
      background: "rgba(255,255,255,0.04)",
      borderColor: "rgba(255,255,255,0.1)",
      backdropFilter: "blur(20px)",
    }}>
      {/* Accent glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at top left, ${accentColor}14 0%, transparent 55%)`,
        }}
      />

      <div className="relative z-10 p-6">
        {/* Entrepreneur name */}
        <h3
          className="text-2xl font-bold mb-2"
          style={{
            color: "#ffffff",
            fontFamily: "'Inter Tight', Inter, sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          {data.entrepreneurName}
        </h3>

        {/* Company pills */}
        {data.companies.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {data.companies.slice(0, 5).map((company) => (
              <span
                key={company}
                className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                style={{
                  borderColor: `${accentColor}40`,
                  backgroundColor: `${accentColor}12`,
                  color: accentColor,
                }}
              >
                {company}
              </span>
            ))}
          </div>
        )}

        {/* Industry pills */}
        {data.industries.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-1.5">
            {data.industries.slice(0, 4).map((industry) => (
              <span
                key={industry}
                className="rounded-full border px-2.5 py-0.5 text-xs"
                style={{
                  borderColor: "rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  color: "#9aa0ac",
                }}
              >
                {industry}
              </span>
            ))}
          </div>
        )}

        {/* Bio */}
        {bio && (
          <p className="mb-6 text-sm leading-relaxed" style={{ color: "rgba(245,246,250,0.7)" }}>
            {bio}
          </p>
        )}

        {/* Domain style */}
        {data.domainStyle && (
          <div className="mb-6">
            <p
              className="mb-2 text-xs uppercase tracking-[0.25em] font-semibold"
              style={{ color: accentColor }}
            >
              {domainLabel}
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(245,246,250,0.7)" }}>
              {data.domainStyle}
            </p>
          </div>
        )}

        {/* Signature Moves */}
        {data.signatureMoves.length > 0 && (
          <div className="mb-6">
            <p
              className="mb-3 text-xs uppercase tracking-[0.25em] font-semibold"
              style={{ color: accentColor }}
            >
              Signature Moves
            </p>
            <div className="space-y-4">
              {data.signatureMoves.map((move, i) => (
                <motion.div
                  key={move.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="text-sm font-semibold mb-1" style={{ color: "rgba(245,246,250,0.9)" }}>
                    {move.title}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(245,246,250,0.6)" }}>
                    {move.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {data.strengths && (
          <div className="mb-6">
            <p
              className="mb-2 text-xs uppercase tracking-[0.25em] font-semibold"
              style={{ color: accentColor }}
            >
              Strengths
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(245,246,250,0.7)" }}>
              {data.strengths}
            </p>
          </div>
        )}

        {/* Blindspots */}
        {data.blindspots && (
          <div>
            <p
              className="mb-2 text-xs uppercase tracking-[0.25em] font-semibold"
              style={{ color: "#e9b949" }}
            >
              Blindspots
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(245,246,250,0.7)" }}>
              {data.blindspots}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit 2>&1 | grep NarrativeMatchCard`
Expected: No errors for this file.

- [ ] **Step 3: Commit**

```bash
git add src/components/results/NarrativeMatchCard.tsx
git commit -m "Add NarrativeMatchCard component for narrative match slides"
```

---

### Task 5: Rewrite ReasoningMatchSlide

**Files:**
- Modify: `src/components/results/slides/ReasoningMatchSlide.tsx`

- [ ] **Step 1: Rewrite the component**

Replace the entire file content:

```tsx
"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { NarrativeMatch } from "@/lib/schemas/results";
import { NarrativeMatchCard } from "@/components/results/NarrativeMatchCard";

interface ReasoningMatchSlideProps {
  data: NarrativeMatch | null;
}

const ACCENT_COLOR = "#4da3ff";

export function ReasoningMatchSlide({ data }: ReasoningMatchSlideProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!data) {
    return (
      <section className="flex h-full items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md rounded-2xl border p-8 text-center"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
          }}
        >
          <p className="mb-3 text-xs uppercase tracking-[0.3em]" style={{ color: "#9aa0ac" }}>
            Reasoning Match
          </p>
          <h2
            className="mb-3 text-xl font-semibold"
            style={{
              color: "#f5f6fa",
              fontFamily: "'Inter Tight', Inter, sans-serif",
              letterSpacing: "-0.01em",
            }}
          >
            Reasoning match coming soon
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#9aa0ac" }}>
            We&rsquo;re building intelligence-based entrepreneur matching. Check back soon.
          </p>
        </motion.div>
      </section>
    );
  }

  const allMatches = [data.primary, ...data.runnersUp];
  const current = allMatches[selectedIndex];
  const isPrimary = selectedIndex === 0;

  function handlePillClick(index: number) {
    if (index === selectedIndex) return;
    setSelectedIndex(index);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="flex h-full flex-col px-6 py-12">
      {/* Fixed header */}
      <div className="mb-4 shrink-0 text-center">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-2 text-xs uppercase tracking-[0.3em]"
          style={{ color: "#9aa0ac" }}
        >
          Reasoning Match
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl font-semibold"
          style={{
            color: "#f5f6fa",
            fontFamily: "'Inter Tight', Inter, sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          {isPrimary ? "Your reasoning most resembles" : "You also reason like"}
        </motion.h2>
      </div>

      {/* Scrollable card area */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto"
        style={{ overscrollBehavior: "contain" }}
      >
        <div className="mx-auto w-full max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.entrepreneurId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <NarrativeMatchCard data={current} accentColor={ACCENT_COLOR} domainLabel="Reasoning Style" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed pill bar */}
      <div className="mt-4 flex shrink-0 justify-center gap-2">
        {allMatches.map((match, i) => {
          const isActive = i === selectedIndex;
          return (
            <button
              key={match.entrepreneurId}
              type="button"
              onClick={() => handlePillClick(i)}
              className="rounded-full border px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2"
              style={{
                borderColor: isActive ? `${ACCENT_COLOR}80` : "rgba(255,255,255,0.12)",
                backgroundColor: isActive ? `${ACCENT_COLOR}20` : "rgba(255,255,255,0.05)",
                color: isActive ? "#fff" : "#9aa0ac",
                boxShadow: isActive ? `0 0 12px ${ACCENT_COLOR}30` : "none",
              }}
              aria-label={`View match: ${match.entrepreneurName}`}
              aria-pressed={isActive}
            >
              {match.entrepreneurName}
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit 2>&1 | grep ReasoningMatchSlide`
Expected: No errors for this file. May still see errors in `ResultsExperience.tsx` (old props).

- [ ] **Step 3: Commit**

```bash
git add src/components/results/slides/ReasoningMatchSlide.tsx
git commit -m "Rewrite ReasoningMatchSlide with narrative card and pill navigation"
```

---

### Task 6: Rewrite CommunicationMatchSlide

**Files:**
- Modify: `src/components/results/slides/CommunicationMatchSlide.tsx`

- [ ] **Step 1: Rewrite the component**

Same pattern as ReasoningMatchSlide but with teal accent and communication-specific copy. Replace entire file:

```tsx
"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { NarrativeMatch } from "@/lib/schemas/results";
import { NarrativeMatchCard } from "@/components/results/NarrativeMatchCard";

interface CommunicationMatchSlideProps {
  data: NarrativeMatch | null;
}

const ACCENT_COLOR = "#2dd4bf";

export function CommunicationMatchSlide({ data }: CommunicationMatchSlideProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!data) {
    return (
      <section className="flex h-full items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md rounded-2xl border p-8 text-center"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
          }}
        >
          <p className="mb-3 text-xs uppercase tracking-[0.3em]" style={{ color: "#9aa0ac" }}>
            Communication Match
          </p>
          <h2
            className="mb-3 text-xl font-semibold"
            style={{
              color: "#f5f6fa",
              fontFamily: "'Inter Tight', Inter, sans-serif",
              letterSpacing: "-0.01em",
            }}
          >
            Communication match coming soon
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#9aa0ac" }}>
            We&rsquo;re building communication-based entrepreneur matching. Check back soon.
          </p>
        </motion.div>
      </section>
    );
  }

  const allMatches = [data.primary, ...data.runnersUp];
  const current = allMatches[selectedIndex];
  const isPrimary = selectedIndex === 0;

  function handlePillClick(index: number) {
    if (index === selectedIndex) return;
    setSelectedIndex(index);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="flex h-full flex-col px-6 py-12">
      {/* Fixed header */}
      <div className="mb-4 shrink-0 text-center">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-2 text-xs uppercase tracking-[0.3em]"
          style={{ color: "#9aa0ac" }}
        >
          Communication Match
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl font-semibold"
          style={{
            color: "#f5f6fa",
            fontFamily: "'Inter Tight', Inter, sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          {isPrimary
            ? "Your communication style most resembles"
            : "You also communicate like"}
        </motion.h2>
      </div>

      {/* Scrollable card area */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto"
        style={{ overscrollBehavior: "contain" }}
      >
        <div className="mx-auto w-full max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.entrepreneurId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <NarrativeMatchCard data={current} accentColor={ACCENT_COLOR} domainLabel="Communication Style" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed pill bar */}
      <div className="mt-4 flex shrink-0 justify-center gap-2">
        {allMatches.map((match, i) => {
          const isActive = i === selectedIndex;
          return (
            <button
              key={match.entrepreneurId}
              type="button"
              onClick={() => handlePillClick(i)}
              className="rounded-full border px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2"
              style={{
                borderColor: isActive ? `${ACCENT_COLOR}80` : "rgba(255,255,255,0.12)",
                backgroundColor: isActive ? `${ACCENT_COLOR}20` : "rgba(255,255,255,0.05)",
                color: isActive ? "#fff" : "#9aa0ac",
                boxShadow: isActive ? `0 0 12px ${ACCENT_COLOR}30` : "none",
              }}
              aria-label={`View match: ${match.entrepreneurName}`}
              aria-pressed={isActive}
            >
              {match.entrepreneurName}
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit 2>&1 | grep CommunicationMatchSlide`
Expected: No errors for this file.

- [ ] **Step 3: Commit**

```bash
git add src/components/results/slides/CommunicationMatchSlide.tsx
git commit -m "Rewrite CommunicationMatchSlide with narrative card and pill navigation"
```

---

### Task 7: Update ResultsExperience and remove EntrepreneurCardModal

**Files:**
- Modify: `src/components/results/ResultsExperience.tsx`
- Delete: `src/components/results/EntrepreneurCardModal.tsx`

- [ ] **Step 1: Update ResultsExperience**

In `src/components/results/ResultsExperience.tsx`:

1. Remove the `import type { CategoryScore }` — check if it's still needed (used in `buildHighlights` return type and the component). Actually `CategoryScore` is still used by `buildHighlights` and the PI categories, so keep it.

2. Update the ReasoningMatchSlide usage. Change:
```tsx
<ReasoningMatchSlide
  key="reasoning-match"
  data={data.reasoningMatch}
  studentPiCategories={data.piCategories}
/>,
```
To:
```tsx
<ReasoningMatchSlide
  key="reasoning-match"
  data={data.reasoningMatch}
/>,
```

3. Update the CommunicationMatchSlide usage. Change:
```tsx
if (data.communicationMatch) {
  s.push(
    <CommunicationMatchSlide
      key="comm-match"
      data={data.communicationMatch}
      studentProfile={data.communicationMatch.studentProfile}
    />,
  );
}
```
To:
```tsx
if (data.communicationMatch) {
  s.push(
    <CommunicationMatchSlide
      key="comm-match"
      data={data.communicationMatch}
    />,
  );
}
```

- [ ] **Step 2: Delete EntrepreneurCardModal**

```bash
rm src/components/results/EntrepreneurCardModal.tsx
```

Verify nothing else imports it:

Run: `grep -r "EntrepreneurCardModal" src/`
Expected: No matches (old ReasoningMatchSlide import was already removed in Task 5).

- [ ] **Step 3: Run full typecheck**

Run: `npx tsc --noEmit`
Expected: Clean — no type errors anywhere.

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 5: Build check**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/results/ResultsExperience.tsx
git rm src/components/results/EntrepreneurCardModal.tsx
git commit -m "Update ResultsExperience props and remove EntrepreneurCardModal"
```
