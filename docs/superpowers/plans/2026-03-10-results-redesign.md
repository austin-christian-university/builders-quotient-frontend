# Results Redesign — "Builder Profile" Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the quantified results page with a qualitative, identity-first "Builder Profile" experience — no numbers shown to users, peer-relative radar charts, narrative strengths/growth areas, and entrepreneur matching across intelligence and communication domains.

**Architecture:** Slideshow-based results page with 11–13 slides. Data flows from `getResultsByToken()` server query → `ResultsExperience` client container → individual slide components. New narrative templates provide strengths/growth text. Radar charts use a shared `RadarChart` SVG component with optional corpus overlay polygon.

**Tech Stack:** Next.js 16 / React 19, TypeScript strict, Framer Motion, Zod, Supabase (server-only via service role key), Vitest for tests.

**Spec:** `docs/superpowers/specs/2026-03-10-results-redesign-design.md`

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `src/lib/assessment/narrative-templates.ts` | Strength + growth-area template text for all categories across PI, CI, communication, and personality domains |
| `src/components/results/RadarChart.tsx` | Reusable SVG radar chart component — supports any point count, peer-relative corpus overlay, configurable accent color |
| `src/components/results/slides/ReasoningHighlightsSlide.tsx` | Top 3–4 strongest intelligence categories with taglines |
| `src/components/results/slides/IntelligenceRadarSlide.tsx` | 12-point radar for PI or CI with corpus overlay (replaces old `IntelligenceSlide`) |
| `src/components/results/slides/IntelligenceNarrativeSlide.tsx` | Strengths & growth areas for PI + CI combined |
| `src/components/results/slides/ReasoningMatchSlide.tsx` | Reasoning entrepreneur match + 4 runners-up |
| `src/components/results/slides/CommunicationRadarSlide.tsx` | 20-point radar for communication style |
| `src/components/results/slides/CommunicationNarrativeSlide.tsx` | Strengths & growth areas for communication |
| `src/components/results/slides/CommunicationMatchSlide.tsx` | Communication entrepreneur match + 4 runners-up |
| `src/components/results/slides/PersonalityRadarSlide.tsx` | 8-point radar for entrepreneur personality (conditional) |
| `src/components/results/slides/PersonalityNarrativeSlide.tsx` | Strengths & growth areas for personality (conditional, lighter) |
| `src/components/results/slides/ShareApplySlide.tsx` | Replaces old `ShareSlide` — public gets Share, admissions gets Share + Apply |
| `src/components/results/EntrepreneurCardModal.tsx` | Modal for runner-up entrepreneur cards (tapped from match slides) |
| `src/lib/assessment/narrative-templates.test.ts` | Tests for narrative template selection logic |
| `src/components/results/RadarChart.test.tsx` | Tests for radar chart SVG generation |

### Modified files
| File | Changes |
|------|---------|
| `src/lib/schemas/results.ts` | Add new types: `ReasoningMatch`, `CommunicationMatch`, `CorpusAverage`, `NarrativeBlock`, update `ResultsPageData` |
| `src/lib/queries/results.ts` | Add corpus average fetching, restructure entrepreneur match data, add reasoning match stub, eager-load runner-up full data |
| `src/components/results/ResultsExperience.tsx` | New slide ordering (13 slides), conditional rendering for personality section |
| `src/components/results/slides/ArchetypeSlide.tsx` | Remove score references, ensure it works with new data shape |
| `src/components/results/slides/DisclaimerSlide.tsx` | Update copy for new "snapshot not verdict" tone |
| `src/components/results/slides/ShareSlide.tsx` | Rename/replace with `ShareApplySlide` — add Apply CTA variant |
| `src/app/results/[token]/page.tsx` | Update OG metadata to use archetype instead of BQ score |

### Deleted files
| File | Reason |
|------|--------|
| `src/components/results/slides/RevealSlide.tsx` | BQ score reveal removed — archetype leads instead |
| `src/components/results/slides/IntelligenceSlide.tsx` | Replaced by `IntelligenceRadarSlide` (radar, no numbers) |
| `src/components/results/slides/StatsSlide.tsx` | "By the Numbers" grid removed per spec |
| `src/components/results/slides/RadarSlide.tsx` | Combined 10-point radar removed (mixing domains) |
| `src/components/results/slides/HighlightSlide.tsx` | Signature/rarest moves replaced by `ReasoningHighlightsSlide` |
| `src/components/results/slides/ShareSlide.tsx` | Replaced by `ShareApplySlide` |
| `src/components/results/slides/EntrepreneurMatchSlide.tsx` | Replaced by `CommunicationMatchSlide` |
| `src/components/results/slides/EntrepreneurComparisonSlide.tsx` | Merged into `CommunicationMatchSlide` (dual radar + trait comparison in one slide) |
| `src/components/results/slides/PersonalitySlide.tsx` | Replaced by `PersonalityRadarSlide` |

---

## Chunk 1: Foundation — Types, Templates, and Reusable Radar

### Task 1: Update Zod schemas for new data model

**Files:**
- Modify: `src/lib/schemas/results.ts`

- [ ] **Step 1: Read current schemas file**

Read `src/lib/schemas/results.ts` to understand all existing types.

- [ ] **Step 2: Write test for new schema types**

Create `src/lib/schemas/results.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  narrativeBlockSchema,
  corpusAverageSchema,
  reasoningMatchSchema,
  communicationMatchSchema,
  resultsPageDataSchema,
} from "./results";

describe("narrativeBlockSchema", () => {
  it("validates a strength block", () => {
    const block = {
      category: "People & Stakeholders",
      type: "strength",
      text: "You instinctively read interpersonal dynamics.",
    };
    expect(narrativeBlockSchema.parse(block)).toEqual(block);
  });

  it("validates a growth block", () => {
    const block = {
      category: "Meta-Cognition",
      type: "growth",
      text: "Entrepreneurs with your profile often develop reflection habits.",
    };
    expect(narrativeBlockSchema.parse(block)).toEqual(block);
  });
});

describe("corpusAverageSchema", () => {
  it("validates corpus average with category scores", () => {
    const avg = {
      categories: [
        { category: "Situation Diagnosis", averageScore: 65 },
        { category: "Information Gathering", averageScore: 60 },
      ],
    };
    expect(corpusAverageSchema.parse(avg)).toEqual(avg);
  });
});

describe("reasoningMatchSchema", () => {
  it("validates a reasoning match with runners-up", () => {
    const match = {
      entrepreneurName: "Sara Blakely",
      bioSnippet: "Founder of Spanx",
      companies: ["Spanx"],
      industries: ["Fashion"],
      studentCategoryScores: [{ category: "Situation Diagnosis", score: 78 }],
      entrepreneurCategoryScores: [{ category: "Situation Diagnosis", score: 82 }],
      topSharedStrengths: [{ name: "Situation Diagnosis", value: 80 }],
      biggestDifferences: [{ name: "Meta-Cognition", studentValue: 38, entrepreneurValue: 72 }],
      runnersUp: [
        {
          entrepreneurName: "Mark Cuban",
          bioSnippet: "Owner of Dallas Mavericks",
          companies: ["Broadcast.com", "Dallas Mavericks"],
          industries: ["Media", "Sports"],
          categoryScores: [{ category: "Situation Diagnosis", score: 75 }],
        },
      ],
    };
    expect(reasoningMatchSchema.parse(match)).toBeDefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/schemas/results.test.ts`
Expected: FAIL — new schema exports don't exist yet.

- [ ] **Step 4: Add new schema definitions to results.ts**

Add these schemas to `src/lib/schemas/results.ts`:

```typescript
// Narrative block for strengths/growth areas
export const narrativeBlockSchema = z.object({
  category: z.string(),
  type: z.enum(["strength", "growth"]),
  text: z.string(),
});
export type NarrativeBlock = z.infer<typeof narrativeBlockSchema>;

// Corpus average for peer-relative shading
export const corpusAverageCategorySchema = z.object({
  category: z.string(),
  averageScore: z.number().min(0).max(100),
});
export const corpusAverageSchema = z.object({
  categories: z.array(corpusAverageCategorySchema),
});
export type CorpusAverage = z.infer<typeof corpusAverageSchema>;

// Runner-up with full card data (for modal)
export const matchRunnerUpSchema = z.object({
  entrepreneurName: z.string(),
  bioSnippet: z.string().nullable(),
  companies: z.array(z.string()),
  industries: z.array(z.string()),
  categoryScores: z.array(z.object({
    category: z.string(),
    score: z.number(),
  })),
});
export type MatchRunnerUp = z.infer<typeof matchRunnerUpSchema>;

// Reasoning match (intelligence domain)
export const reasoningMatchSchema = z.object({
  entrepreneurName: z.string(),
  bioSnippet: z.string().nullable(),
  companies: z.array(z.string()),
  industries: z.array(z.string()),
  studentCategoryScores: z.array(z.object({
    category: z.string(),
    score: z.number(),
  })),
  entrepreneurCategoryScores: z.array(z.object({
    category: z.string(),
    score: z.number(),
  })),
  topSharedStrengths: z.array(sharedTraitSchema),
  biggestDifferences: z.array(traitDifferenceSchema),
  runnersUp: z.array(matchRunnerUpSchema),
});
export type ReasoningMatch = z.infer<typeof reasoningMatchSchema>;

// Communication match (reuses existing entrepreneur match structure but renamed for clarity)
export const communicationMatchSchema = entrepreneurMatchSchema;
export type CommunicationMatch = z.infer<typeof communicationMatchSchema>;
```

Update `resultsPageDataSchema` — replace old fields with new structure:

```typescript
export const resultsPageDataSchema = z.object({
  applicant: z.object({
    displayName: z.string().nullable(),
    assessmentType: z.enum(["public", "admissions"]),
  }),
  // Intelligence domain
  piCategories: z.array(categoryScoreSchema),
  ciCategories: z.array(categoryScoreSchema),
  piCorpusAverage: corpusAverageSchema.nullable(),
  ciCorpusAverage: corpusAverageSchema.nullable(),
  archetype: archetypeSchema,
  intelligenceNarrative: z.array(narrativeBlockSchema),
  reasoningMatch: reasoningMatchSchema.nullable(),
  // Communication domain
  communicationProfile: z.array(z.object({
    category: z.string(),
    value: z.number(),
  })).nullable(),
  communicationCorpusAverage: corpusAverageSchema.nullable(),
  communicationNarrative: z.array(narrativeBlockSchema),
  communicationMatch: communicationMatchSchema.nullable(),
  // Personality domain (conditional — admissions only)
  personality: personalityDataSchema.nullable(),
  personalityNarrative: z.array(narrativeBlockSchema),
  // Narratives from pipeline (kept for reference)
  narrative: z.object({
    piSummaries: z.array(z.string()),
    ciSummaries: z.array(z.string()),
  }),
});
export type ResultsPageData = z.infer<typeof resultsPageDataSchema>;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/schemas/results.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/schemas/results.ts src/lib/schemas/results.test.ts
git commit -m "Update results schemas for Builder Profile redesign"
```

---

### Task 2: Create narrative templates

**Files:**
- Create: `src/lib/assessment/narrative-templates.ts`
- Create: `src/lib/assessment/narrative-templates.test.ts`

- [ ] **Step 1: Write test for template selection logic**

Create `src/lib/assessment/narrative-templates.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  getIntelligenceNarrative,
  getCommunicationNarrative,
  getPersonalityNarrative,
  PI_TEMPLATES,
  CI_TEMPLATES,
} from "./narrative-templates";
import type { CategoryScore } from "@/lib/schemas/results";

describe("getIntelligenceNarrative", () => {
  it("returns top 3 strengths and bottom 2 growth areas from combined PI+CI", () => {
    const piCategories: CategoryScore[] = [
      { category: "People & Stakeholders", score: 88, movesMatched: 5, movesScored: 6, movesMissed: 1, movesExcluded: 0 },
      { category: "Situation Diagnosis", score: 78, movesMatched: 4, movesScored: 5, movesMissed: 1, movesExcluded: 0 },
      { category: "Meta-Cognition", score: 35, movesMatched: 2, movesScored: 5, movesMissed: 3, movesExcluded: 0 },
    ];
    const ciCategories: CategoryScore[] = [
      { category: "Cross-Domain Connection", score: 85, movesMatched: 5, movesScored: 6, movesMissed: 1, movesExcluded: 0 },
      { category: "Meta-Creative Thinking", score: 30, movesMatched: 1, movesScored: 5, movesMissed: 4, movesExcluded: 0 },
    ];

    const result = getIntelligenceNarrative(piCategories, ciCategories);
    const strengths = result.filter((b) => b.type === "strength");
    const growth = result.filter((b) => b.type === "growth");

    expect(strengths.length).toBeLessThanOrEqual(4);
    expect(strengths.length).toBeGreaterThanOrEqual(1);
    expect(growth.length).toBeLessThanOrEqual(3);
    expect(growth.length).toBeGreaterThanOrEqual(1);

    // Highest score should be a strength
    expect(strengths[0].category).toBe("People & Stakeholders");
    // Lowest score should be a growth area
    expect(growth[growth.length - 1].category).toBe("Meta-Creative Thinking");
  });

  it("returns empty array if no categories provided", () => {
    expect(getIntelligenceNarrative([], [])).toEqual([]);
  });
});

describe("getCommunicationNarrative", () => {
  it("returns strengths and growth for communication meta-categories", () => {
    const profile = [
      { category: "Energy & Dynamism", value: 80 },
      { category: "Confidence & Authority", value: 75 },
      { category: "Warmth & Interpersonal", value: 40 },
      { category: "Communication Style", value: 65 },
      { category: "Self-Presentation", value: 55 },
    ];
    const result = getCommunicationNarrative(profile);
    const strengths = result.filter((b) => b.type === "strength");
    const growth = result.filter((b) => b.type === "growth");

    expect(strengths.length).toBeGreaterThanOrEqual(1);
    expect(growth.length).toBeGreaterThanOrEqual(1);
    expect(strengths[0].category).toBe("Energy & Dynamism");
  });
});

describe("getPersonalityNarrative", () => {
  it("returns 2 strengths and 1-2 growth areas for personality facets", () => {
    const facetScores = [
      { facet: "AM", label: "Ambition", rescaledScore: 90, itemCount: 15 },
      { facet: "GR", label: "Grit", rescaledScore: 85, itemCount: 15 },
      { facet: "RT", label: "Risk Tolerance", rescaledScore: 30, itemCount: 15 },
      { facet: "IN", label: "Innovativeness", rescaledScore: 60, itemCount: 15 },
      { facet: "AU", label: "Autonomy", rescaledScore: 55, itemCount: 15 },
      { facet: "SE", label: "Self-Efficacy", rescaledScore: 70, itemCount: 15 },
      { facet: "ST", label: "Stress Tolerance", rescaledScore: 50, itemCount: 15 },
      { facet: "IL", label: "Internal Locus of Control", rescaledScore: 65, itemCount: 15 },
    ];
    const result = getPersonalityNarrative(facetScores);
    const strengths = result.filter((b) => b.type === "strength");
    const growth = result.filter((b) => b.type === "growth");

    expect(strengths.length).toBe(2);
    expect(growth.length).toBeGreaterThanOrEqual(1);
    expect(growth.length).toBeLessThanOrEqual(2);
  });
});

describe("template coverage", () => {
  it("PI_TEMPLATES has entries for all 12 PI categories", () => {
    const piCategories = [
      "Situation Diagnosis", "Information Gathering", "Constraint Analysis",
      "Option Generation", "Tradeoff Evaluation", "Risk Assessment",
      "Decision Architecture", "Action Planning", "People & Stakeholders",
      "Communication Strategy", "Emotional & Values Reasoning", "Meta-Cognition",
    ];
    for (const cat of piCategories) {
      expect(PI_TEMPLATES[cat]).toBeDefined();
      expect(PI_TEMPLATES[cat].strength).toBeTruthy();
      expect(PI_TEMPLATES[cat].growth).toBeTruthy();
    }
  });

  it("CI_TEMPLATES has entries for all 12 CI categories", () => {
    const ciCategories = [
      "Pattern Recognition & Observation", "Information Seeking & Market Research",
      "Reframing & Category Innovation", "Cross-Domain Connection",
      "Opportunity Articulation", "Customer & Market Insight",
      "Timing & Context Assessment", "Validation & Testing Strategy",
      "Risk & Feasibility Evaluation", "Vision Communication",
      "Creative Confidence & Persistence", "Meta-Creative Thinking",
    ];
    for (const cat of ciCategories) {
      expect(CI_TEMPLATES[cat]).toBeDefined();
      expect(CI_TEMPLATES[cat].strength).toBeTruthy();
      expect(CI_TEMPLATES[cat].growth).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/assessment/narrative-templates.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Create the narrative templates file**

Create `src/lib/assessment/narrative-templates.ts`. This file contains:

1. **Template records** — `PI_TEMPLATES`, `CI_TEMPLATES`, `COMMUNICATION_TEMPLATES`, `PERSONALITY_TEMPLATES`, each a `Record<string, { strength: string; growth: string }>` mapping category names to narrative text.

2. **Selection functions** — `getIntelligenceNarrative(piCategories, ciCategories)`, `getCommunicationNarrative(profile)`, `getPersonalityNarrative(facetScores)` that sort by score, pick top N as strengths and bottom N as growth areas, and return `NarrativeBlock[]`.

Template content should be written in second person ("You..."), concrete and actionable. Strengths are positive ("You instinctively read interpersonal dynamics and build coalitions"). Growth areas include entrepreneur context ("Entrepreneurs with lower meta-cognition scores often develop structured reflection practices after key decisions").

Key implementation details:
- `getIntelligenceNarrative`: Combine PI + CI categories, sort by score desc, top 3–4 = strengths, bottom 2–3 = growth. If total categories < 5, take top half as strengths, bottom half as growth.
- `getCommunicationNarrative`: Takes the raw 20-dimension profile array (`{ category: string; value: number }[]`) and internally groups dimensions into 5 meta-categories using `averageByCategory()` from `personality-dimensions.ts`. Then sorts the 5 meta-categories by average value, top 2 = strengths, bottom 1–2 = growth.
- `getPersonalityNarrative`: Takes 8 facet scores, top 2 = strengths, bottom 1–2 = growth.
- If a category has no template entry, skip it (graceful degradation per spec).

All 12 PI categories need templates:
- Situation Diagnosis, Information Gathering, Constraint Analysis, Option Generation, Tradeoff Evaluation, Risk Assessment, Decision Architecture, Action Planning, People & Stakeholders, Communication Strategy, Emotional & Values Reasoning, Meta-Cognition

All 12 CI categories need templates:
- Pattern Recognition & Observation, Information Seeking & Market Research, Reframing & Category Innovation, Cross-Domain Connection, Opportunity Articulation, Customer & Market Insight, Timing & Context Assessment, Validation & Testing Strategy, Risk & Feasibility Evaluation, Vision Communication, Creative Confidence & Persistence, Meta-Creative Thinking

5 communication meta-categories need templates:
- Energy & Dynamism, Confidence & Authority, Warmth & Interpersonal, Communication Style, Self-Presentation

8 personality facets need templates:
- Ambition, Risk Tolerance, Innovativeness, Autonomy, Self-Efficacy, Stress Tolerance, Internal Locus of Control, Grit

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/assessment/narrative-templates.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/assessment/narrative-templates.ts src/lib/assessment/narrative-templates.test.ts
git commit -m "Add narrative templates for strengths and growth areas"
```

---

### Task 3: Create reusable RadarChart component

**Files:**
- Create: `src/components/results/RadarChart.tsx`
- Create: `src/components/results/RadarChart.test.tsx`

- [ ] **Step 1: Write test for RadarChart SVG output**

Create `src/components/results/RadarChart.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RadarChart } from "./RadarChart";

describe("RadarChart", () => {
  const defaultProps = {
    categories: ["A", "B", "C", "D", "E"],
    studentScores: [80, 60, 70, 50, 90],
    accentColor: "#4da3ff",
  };

  it("renders an SVG with the correct number of axis lines", () => {
    const { container } = render(<RadarChart {...defaultProps} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    // 5 categories = 5 axis lines
    const lines = svg!.querySelectorAll("line");
    expect(lines.length).toBe(5);
  });

  it("renders student polygon", () => {
    const { container } = render(<RadarChart {...defaultProps} />);
    const polygons = container.querySelectorAll("polygon");
    // 4 grid rings + 1 student polygon = 5
    expect(polygons.length).toBe(5);
  });

  it("renders corpus polygon when corpusScores provided", () => {
    const { container } = render(
      <RadarChart {...defaultProps} corpusScores={[65, 60, 58, 55, 62]} />
    );
    const polygons = container.querySelectorAll("polygon");
    // 4 grid rings + 1 corpus polygon + 1 student polygon = 6
    expect(polygons.length).toBe(6);
  });

  it("renders category labels", () => {
    const { container } = render(<RadarChart {...defaultProps} />);
    const texts = container.querySelectorAll("text");
    expect(texts.length).toBe(5);
    expect(texts[0].textContent).toBe("A");
  });

  it("handles 12-point radar", () => {
    const categories = Array.from({ length: 12 }, (_, i) => `Cat ${i + 1}`);
    const scores = Array.from({ length: 12 }, () => 50);
    const { container } = render(
      <RadarChart categories={categories} studentScores={scores} accentColor="#4da3ff" />
    );
    const lines = container.querySelectorAll("line");
    expect(lines.length).toBe(12);
  });

  it("handles 20-point radar", () => {
    const categories = Array.from({ length: 20 }, (_, i) => `Dim ${i + 1}`);
    const scores = Array.from({ length: 20 }, () => 50);
    const { container } = render(
      <RadarChart categories={categories} studentScores={scores} accentColor="#2dd4bf" />
    );
    const lines = container.querySelectorAll("line");
    expect(lines.length).toBe(20);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/results/RadarChart.test.tsx`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement RadarChart component**

Create `src/components/results/RadarChart.tsx`:

Props interface:
```typescript
interface RadarChartProps {
  categories: string[];           // Label for each axis
  studentScores: number[];        // 0–100 per axis
  corpusScores?: number[];        // 0–100 per axis (optional peer-relative overlay)
  accentColor: string;            // e.g., "#4da3ff"
  size?: number;                  // SVG viewBox size, default 480
  className?: string;
}
```

Implementation details:
- Pure SVG, no external chart library.
- `polarToCartesian(cx, cy, radius, angleDeg)` helper for coordinate math.
- 4 concentric grid ring polygons at 25%, 50%, 75%, 100% radius (stroke: `rgba(255,255,255,0.06)`).
- Axis lines from center to each vertex (same subtle stroke).
- Corpus polygon (if `corpusScores` provided): dashed stroke `rgba(255,255,255,0.15)`, very subtle fill `rgba(255,255,255,0.04)`.
- Student polygon: solid stroke in `accentColor`, semi-transparent fill (`${accentColor}1F`).
- Student dots at each vertex: filled circles in `accentColor` with dark stroke.
- Category labels positioned outward from vertices, auto-aligned (`text-anchor` based on position relative to center).
- For 20-point charts, use smaller font size (9px vs 10px) and consider showing abbreviated labels or every other label.
- Responsive: `viewBox` based, `max-width: 100%`, `height: auto`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/results/RadarChart.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/results/RadarChart.tsx src/components/results/RadarChart.test.tsx
git commit -m "Add reusable RadarChart component with peer-relative overlay"
```

---

## Chunk 2: Update Data Query and Create New Slide Components

### Task 4: Update results query for new data model

**Files:**
- Modify: `src/lib/queries/results.ts`

This is the most complex change. The query needs to:
1. Remove: `bqScore`, `overall` object, `signatureMoves`, `rarestMove`, `growthEdges`, `stats`
2. Add: corpus averages for PI/CI/communication, narrative blocks, restructure entrepreneur match as `communicationMatch`
3. Stub: `reasoningMatch` as `null` until backend pipeline adds reasoning vector matching
4. Add: full runner-up data (bio, companies, category scores) instead of just name + similarity

- [ ] **Step 1: Read current query file thoroughly**

Read `src/lib/queries/results.ts` in full.

- [ ] **Step 2: Remove deprecated data extraction**

Remove these functions and their usage:
- `extractSignatureMoves()` (lines ~154–164)
- `extractRarestMove()` (lines ~167–180)
- `extractGrowthEdges()` (lines ~183–192)

Remove from the return object:
- `overall` (bqScore, piHeadlineScore, ciHeadlineScore)
- `signatureMoves`
- `rarestMove`
- `growthEdges`
- `stats`

- [ ] **Step 3: Add corpus average fetching**

**Important:** The current `RawCategoryScore` type does NOT include an `entrepreneur_mean` field. Check the actual JSONB content in `scoring_result.category_scores[]` — the Python pipeline's `ScoringResult` model stores `entrepreneur_mean` and `entrepreneur_std` per category in the JSONB, but the frontend `RawCategoryScore` type doesn't declare these fields. First, add `entrepreneur_mean?: number` to the `RawCategoryScore` interface, then extract it during aggregation.

If the field is not present in the JSONB (e.g., older scored responses), set corpus average to `null` (graceful degradation — render student polygon only, no corpus overlay).

Build `piCorpusAverage` and `ciCorpusAverage` by averaging the `entrepreneur_mean` values across responses per category.

For communication corpus average: set `communicationCorpusAverage: null`. The `student_personality_profiles` table does not store a reference corpus average. This is expected — the communication radar will show the student polygon only until corpus data is available.

- [ ] **Step 4: Generate narrative blocks**

Import and call `getIntelligenceNarrative(piCategories, ciCategories)`, `getCommunicationNarrative(communicationProfile)`, and `getPersonalityNarrative(facetScores)` from the narrative templates module. Add results to the return object.

- [ ] **Step 5: Restructure entrepreneur match as communicationMatch**

Rename the existing `entrepreneurMatch` field to `communicationMatch` in the return object. The underlying data is the same — it's the communication/personality vector match from `student_personality_profiles`.

- [ ] **Step 6: Expand runner-up data**

Modify the runner-up query to fetch full entrepreneur data (bio, companies, industries, category scores) for all 4 runners-up, not just name + similarity. This enables the modal interaction without lazy loading.

Update the Supabase query for runners-up: join against the `entrepreneurs` table to get `bio_snippet`, `companies`, `industries`, AND query `entrepreneur_personality_profiles` for each runner-up's personality vector (needed for dual radar overlay in the modal). Without the runner-up's personality vector, the `EntrepreneurCardModal` dual radar cannot render.

Fetch strategy: eager-load all 5 matches (primary + 4 runners-up) with full data in the initial query. The data volume is small (5 entrepreneur records with 20-dim vectors).

- [ ] **Step 7: Add reasoningMatch stub**

Add `reasoningMatch: null` to the return object. This will be populated once the backend pipeline adds intelligence vector matching.

- [ ] **Step 8: Update the return object to match new ResultsPageData schema**

Ensure the returned object matches the updated `resultsPageDataSchema` from Task 1.

- [ ] **Step 9: Run build to verify types**

Run: `npx tsc --noEmit`
Expected: No type errors related to results.

- [ ] **Step 10: Commit**

```bash
git add src/lib/queries/results.ts
git commit -m "Update results query for Builder Profile data model"
```

---

### Task 5: Create ArchetypeSlide (update existing)

**Files:**
- Modify: `src/components/results/slides/ArchetypeSlide.tsx`

- [ ] **Step 1: Read current ArchetypeSlide**

Read `src/components/results/slides/ArchetypeSlide.tsx` in full.

- [ ] **Step 2: Update to be the lead slide**

The archetype slide is already close to what we need. Changes:
- Ensure it works as slide 1 (currently slide 2, after the score reveal).
- Keep: archetype name, tagline, glassmorphic card, rotateX entrance, glow gradient.
- Remove: any references to BQ score or numerical data.
- Add: brief 1–2 sentence description below the tagline. Add a `description` field to each entry in `ARCHETYPE_MAP` in `src/lib/assessment/archetypes.ts` and update the `archetypeSchema` in `src/lib/schemas/results.ts` to include `description: z.string()`. Each archetype should have a 1–2 sentence description of what this reasoning style means in entrepreneurial context.
- Domain color glow: blue background glow if `variant === "pi"`, gold if `variant === "ci"`.

- [ ] **Step 3: Commit**

```bash
git add src/components/results/slides/ArchetypeSlide.tsx
git commit -m "Update ArchetypeSlide as identity-first lead slide"
```

---

### Task 6: Create ReasoningHighlightsSlide

**Files:**
- Create: `src/components/results/slides/ReasoningHighlightsSlide.tsx`

- [ ] **Step 1: Define props and implement component**

Props:
```typescript
interface ReasoningHighlightsSlideProps {
  data: {
    highlights: {
      category: string;
      tagline: string;
      variant: "pi" | "ci";
    }[];
  };
}
```

The highlights are the top 3–4 strongest categories from combined PI + CI, each with a tagline pulled from the narrative template's `strength` text (first sentence only, or a dedicated short tagline).

Implementation:
- Eyebrow: "YOUR STRENGTHS"
- Each highlight: category name + tagline text, staggered entrance animation.
- Alternate blue/gold accent based on whether the category is PI or CI.
- Simple text-only layout — no bars, no charts, no numbers.
- Framer Motion staggered children (delay: 500ms + index * 400ms).

- [ ] **Step 2: Commit**

```bash
git add src/components/results/slides/ReasoningHighlightsSlide.tsx
git commit -m "Add ReasoningHighlightsSlide for top category taglines"
```

---

### Task 7: Create IntelligenceRadarSlide

**Files:**
- Create: `src/components/results/slides/IntelligenceRadarSlide.tsx`

- [ ] **Step 1: Define props and implement component**

Props:
```typescript
interface IntelligenceRadarSlideProps {
  data: {
    categories: CategoryScore[];
    corpusAverage: CorpusAverage | null;
  };
  title: string;        // "Your Reasoning Profile" or "Your Thinking Profile"
  eyebrow: string;      // "PRACTICAL INTELLIGENCE" or "CREATIVE INTELLIGENCE"
  variant: "pi" | "ci";
}
```

Implementation:
- Uses the `RadarChart` component from Task 3.
- Extracts category names and scores from `data.categories`.
- Extracts corpus scores from `data.corpusAverage.categories` (matched by category name). If null, passes no `corpusScores` (student polygon only).
- Accent color: `#4da3ff` for PI, `#e9b949` for CI.
- Abbreviated category labels for the radar (e.g., "Situation Diagnosis" → "Diagnosis", "Information Gathering" → "Info Gathering"). Create a `SHORT_LABELS` map.
- Legend below radar: "Your Profile" dot + "Entrepreneur Average" dot.
- Framer Motion entrance: scale from 0.8 + fade.

- [ ] **Step 2: Commit**

```bash
git add src/components/results/slides/IntelligenceRadarSlide.tsx
git commit -m "Add IntelligenceRadarSlide with 12-point radar and corpus overlay"
```

---

### Task 8: Create IntelligenceNarrativeSlide

**Files:**
- Create: `src/components/results/slides/IntelligenceNarrativeSlide.tsx`

- [ ] **Step 1: Define props and implement component**

Props:
```typescript
interface IntelligenceNarrativeSlideProps {
  data: {
    narrative: NarrativeBlock[];
  };
}
```

Implementation:
- Eyebrow: "YOUR INTELLIGENCE PROFILE"
- Title: "Strengths & Growth Areas"
- Split into two sections:
  - **Strengths** (filter `type === "strength"`): Each block shows category name as a small label, then the narrative text. Blue accent on category label.
  - **Growth Areas** (filter `type === "growth"`): Same layout, gold accent. Framed encouragingly — growth, not weakness.
- Staggered entrance animation per block.
- Mobile: single column. Desktop: two-column grid (strengths left, growth right).

- [ ] **Step 2: Commit**

```bash
git add src/components/results/slides/IntelligenceNarrativeSlide.tsx
git commit -m "Add IntelligenceNarrativeSlide for strengths and growth areas"
```

---

### Task 9: Create ReasoningMatchSlide

**Files:**
- Create: `src/components/results/slides/ReasoningMatchSlide.tsx`
- Create: `src/components/results/EntrepreneurCardModal.tsx`

- [ ] **Step 1: Create EntrepreneurCardModal component**

This is a reusable modal for displaying an entrepreneur's full card when a runner-up is tapped. Used by both ReasoningMatchSlide and CommunicationMatchSlide.

Props:
```typescript
interface EntrepreneurCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  entrepreneur: {
    entrepreneurName: string;
    bioSnippet: string | null;
    companies: string[];
    industries: string[];
    categoryScores: { category: string; score: number }[];
  };
  studentCategoryScores: { category: string; score: number }[];
  accentColor: string;
  categories: string[];
}
```

Implementation:
- Glassmorphic overlay (backdrop-blur + dark semi-transparent background).
- Card with entrepreneur name, bio, company pills, industry pills.
- Dual `RadarChart` overlay (student vs entrepreneur) inside the card.
- Close button (X) + click-outside-to-close + Escape key.
- Framer Motion: fade in backdrop, scale-up card.
- `inert` on content behind modal per accessibility guidelines.

- [ ] **Step 2: Create ReasoningMatchSlide component**

Props:
```typescript
interface ReasoningMatchSlideProps {
  data: ReasoningMatch | null;
  studentPiCategories: CategoryScore[];
}
```

Implementation:
- If `data` is null: show placeholder card — "Reasoning match coming soon" with subtle messaging.
- If `data` exists:
  - Eyebrow: "REASONING MATCH"
  - Title: "Your reasoning most resembles"
  - Large entrepreneur name.
  - Entrepreneur card: bio, companies, industries.
  - Dual radar overlay (student PI categories vs entrepreneur PI categories) using `RadarChart`.
  - Entrepreneur's strengths/weaknesses text.
  - Below: 4 runner-up pills (entrepreneur name, tappable).
  - On tap: open `EntrepreneurCardModal` with that runner-up's full data.

- [ ] **Step 3: Commit**

```bash
git add src/components/results/slides/ReasoningMatchSlide.tsx src/components/results/EntrepreneurCardModal.tsx
git commit -m "Add ReasoningMatchSlide with entrepreneur cards and runner-up modals"
```

---

### Task 10: Create Communication domain slides

**Files:**
- Create: `src/components/results/slides/CommunicationRadarSlide.tsx`
- Create: `src/components/results/slides/CommunicationNarrativeSlide.tsx`
- Create: `src/components/results/slides/CommunicationMatchSlide.tsx`

- [ ] **Step 1: Create CommunicationRadarSlide**

Props:
```typescript
interface CommunicationRadarSlideProps {
  data: {
    profile: { category: string; value: number }[];
    corpusAverage: CorpusAverage | null;
  };
}
```

Implementation:
- Uses `RadarChart` with 20 points, teal accent (`#2dd4bf`).
- Eyebrow: "COMMUNICATION STYLE"
- Title: "How You Present & Connect"
- For 20-point label density: use the 20 dimension names from `personality-dimensions.ts`, displayed at smaller font size. Alternatively, show only the 5 meta-category names at their midpoint positions and suppress individual labels.
- Legend: "Your Profile" + "Entrepreneur Average".

- [ ] **Step 2: Create CommunicationNarrativeSlide**

Props:
```typescript
interface CommunicationNarrativeSlideProps {
  data: {
    narrative: NarrativeBlock[];
  };
}
```

Implementation:
- Same layout pattern as `IntelligenceNarrativeSlide` but with teal accent.
- Eyebrow: "COMMUNICATION STYLE"
- Title: "Strengths & Growth Areas"

- [ ] **Step 3: Create CommunicationMatchSlide**

Props:
```typescript
interface CommunicationMatchSlideProps {
  data: CommunicationMatch;
  studentProfile: { category: string; value: number }[];
}
```

Implementation:
- Same pattern as `ReasoningMatchSlide` but for communication domain.
- Eyebrow: "COMMUNICATION MATCH"
- Title: "Your communication style most resembles"
- Uses the existing `EntrepreneurMatch` data (renamed to `CommunicationMatch`).
- **Dual radar scale:** Both student and entrepreneur profiles must use the same scale. The existing `EntrepreneurMatch` stores `studentProfile` and `entrepreneurProfile` as 5-point meta-category averages (from `averageByCategory()`). Use these 5-point averages for BOTH polygons in the dual radar (not the raw 20 dimensions). The communication radar slide (slide 7) shows the full 20-point radar, but the match comparison slide uses 5-point for cleaner visual comparison.
- 4 runner-up pills with modal on tap (reuses `EntrepreneurCardModal`). Runner-up modals also use 5-point meta-category comparison.

- [ ] **Step 4: Commit**

```bash
git add src/components/results/slides/CommunicationRadarSlide.tsx src/components/results/slides/CommunicationNarrativeSlide.tsx src/components/results/slides/CommunicationMatchSlide.tsx
git commit -m "Add Communication Style slides: radar, narrative, and entrepreneur match"
```

---

### Task 11: Create Personality domain slides (conditional)

**Files:**
- Create: `src/components/results/slides/PersonalityRadarSlide.tsx`
- Create: `src/components/results/slides/PersonalityNarrativeSlide.tsx`

- [ ] **Step 1: Create PersonalityRadarSlide**

Props:
```typescript
interface PersonalityRadarSlideProps {
  data: PersonalityData;
}
```

Implementation:
- Uses `RadarChart` with 8 points, violet accent (`#a78bfa`).
- Eyebrow: "ENTREPRENEUR PERSONALITY"
- Title: "Your Entrepreneurial Traits"
- Subtitle: "Based on peer-reviewed research on traits correlated with entrepreneurial success"
- Categories: 8 facet labels (Ambition, Risk Tolerance, Innovativeness, Autonomy, Self-Efficacy, Stress Tolerance, Internal Locus of Control, Grit).
- Scores: from `facetScores[].rescaledScore`.
- Corpus average: null for now (not enough quiz-taker data). Student polygon only.

- [ ] **Step 2: Create PersonalityNarrativeSlide**

Props:
```typescript
interface PersonalityNarrativeSlideProps {
  data: {
    narrative: NarrativeBlock[];
  };
}
```

Implementation:
- Lighter than intelligence/communication — 2 strengths + 1–2 growth areas.
- Violet accent.
- Eyebrow: "ENTREPRENEUR PERSONALITY"
- Title: "Strengths & Growth Areas"
- Same layout pattern as other narrative slides.

- [ ] **Step 3: Commit**

```bash
git add src/components/results/slides/PersonalityRadarSlide.tsx src/components/results/slides/PersonalityNarrativeSlide.tsx
git commit -m "Add Personality slides: radar and narrative (admissions only)"
```

---

## Chunk 3: Wire Everything Together

### Task 12: Create ShareApplySlide (replace ShareSlide)

**Files:**
- Create: `src/components/results/slides/ShareApplySlide.tsx`

- [ ] **Step 1: Read current ShareSlide**

Read `src/components/results/slides/ShareSlide.tsx` to understand existing share logic.

- [ ] **Step 2: Create ShareApplySlide**

Props:
```typescript
interface ShareApplySlideProps {
  data: {
    displayName: string | null;
    archetype: Archetype;
    piCategories: CategoryScore[];
    assessmentType: "public" | "admissions";
    hasPersonalityData: boolean;
  };
}
```

Implementation:
- Shareable card mockup: archetype name + small PI radar thumbnail (using `RadarChart` at small size). No personality data in the card.
- Share text: "I'm The [Archetype] — discover your Builder Profile"
- Web Share API with clipboard fallback (reuse existing pattern from `ShareSlide`).
- **Public variant** (`assessmentType === "public"`): Just the share button.
- **Admissions variant** (`assessmentType === "admissions"` AND `hasPersonalityData === true`):
  - Personalized encouragement message above: "We've reviewed your results and we think you have the potential to be a high-performing builder. We'd love for you to apply."
  - Share button + "Apply to ACU" CTA button (links to application URL).

- [ ] **Step 3: Commit**

```bash
git add src/components/results/slides/ShareApplySlide.tsx
git commit -m "Add ShareApplySlide with public share and admissions Apply CTA"
```

---

### Task 13: Update DisclaimerSlide copy

**Files:**
- Modify: `src/components/results/slides/DisclaimerSlide.tsx`

- [ ] **Step 1: Read current DisclaimerSlide**

Read `src/components/results/slides/DisclaimerSlide.tsx`.

- [ ] **Step 2: Update copy**

Update the disclaimer text to match the new tone:
- "This is a snapshot, not a verdict."
- "This assessment captures how you reason and communicate right now — not your ceiling."
- "Many successful entrepreneurs developed their strongest skills over time, through practice and intentional growth."
- Warm, encouraging, honest.
- Remove any references to beta or specific scoring methodology.

- [ ] **Step 3: Commit**

```bash
git add src/components/results/slides/DisclaimerSlide.tsx
git commit -m "Update DisclaimerSlide copy for life-giving tone"
```

---

### Task 14: Rewire ResultsExperience with new slide ordering

**Files:**
- Modify: `src/components/results/ResultsExperience.tsx`

- [ ] **Step 1: Read current ResultsExperience**

Read `src/components/results/ResultsExperience.tsx` in full.

- [ ] **Step 2: Update imports**

Remove imports for deprecated slides: `RevealSlide`, `IntelligenceSlide`, `HighlightSlide`, `RadarSlide`, `StatsSlide`, `ShareSlide`, `EntrepreneurMatchSlide`, `EntrepreneurComparisonSlide`, `PersonalitySlide`.

Add imports for new slides: `ReasoningHighlightsSlide`, `IntelligenceRadarSlide`, `IntelligenceNarrativeSlide`, `ReasoningMatchSlide`, `CommunicationRadarSlide`, `CommunicationNarrativeSlide`, `CommunicationMatchSlide`, `PersonalityRadarSlide`, `PersonalityNarrativeSlide`, `ShareApplySlide`.

- [ ] **Step 3: Build new sections array**

Replace the current `sections` array with the new slide flow:

```typescript
const sections = [
  // 1. Archetype Reveal
  <ArchetypeSlide key="archetype" data={data.archetype} />,

  // 2. Reasoning Highlights
  <ReasoningHighlightsSlide key="highlights" data={{
    highlights: buildHighlights(data.piCategories, data.ciCategories)
  }} />,

  // 3. Practical Intelligence Radar
  <IntelligenceRadarSlide key="pi-radar" data={{
    categories: data.piCategories,
    corpusAverage: data.piCorpusAverage,
  }} title="Your Reasoning Profile" eyebrow="PRACTICAL INTELLIGENCE" variant="pi" />,

  // 4. Creative Intelligence Radar
  <IntelligenceRadarSlide key="ci-radar" data={{
    categories: data.ciCategories,
    corpusAverage: data.ciCorpusAverage,
  }} title="Your Thinking Profile" eyebrow="CREATIVE INTELLIGENCE" variant="ci" />,

  // 5. Intelligence Strengths & Growth Areas
  <IntelligenceNarrativeSlide key="intel-narrative" data={{
    narrative: data.intelligenceNarrative,
  }} />,

  // 6. Reasoning Match (stubbed if null)
  <ReasoningMatchSlide key="reasoning-match"
    data={data.reasoningMatch}
    studentPiCategories={data.piCategories}
  />,

  // 7. Communication Style Radar (conditional — if communication data exists)
  ...(data.communicationProfile ? [
    <CommunicationRadarSlide key="comm-radar" data={{
      profile: data.communicationProfile,
      corpusAverage: data.communicationCorpusAverage,
    }} />,

    // 8. Communication Strengths & Growth Areas
    <CommunicationNarrativeSlide key="comm-narrative" data={{
      narrative: data.communicationNarrative,
    }} />,

    // 9. Communication Match (conditional — if match exists)
    ...(data.communicationMatch ? [
      <CommunicationMatchSlide key="comm-match"
        data={data.communicationMatch}
        studentProfile={data.communicationProfile}
      />,
    ] : []),
  ] : []),

  // 10-11. Personality (conditional — if quiz data exists)
  ...(data.personality ? [
    <PersonalityRadarSlide key="personality-radar" data={data.personality} />,
    <PersonalityNarrativeSlide key="personality-narrative" data={{
      narrative: data.personalityNarrative,
    }} />,
  ] : []),

  // 12. Disclaimer
  <DisclaimerSlide key="disclaimer" />,

  // 13. Share / Apply CTA
  <ShareApplySlide key="share" data={{
    displayName: data.applicant.displayName,
    archetype: data.archetype,
    piCategories: data.piCategories,
    assessmentType: data.applicant.assessmentType,
    hasPersonalityData: data.personality !== null,
  }} />,
];
```

- [ ] **Step 4: Add buildHighlights helper**

Create a helper function in `ResultsExperience.tsx` (or extract to a utility):

```typescript
function buildHighlights(
  piCategories: CategoryScore[],
  ciCategories: CategoryScore[]
): { category: string; tagline: string; variant: "pi" | "ci" }[] {
  const combined = [
    ...piCategories.map((c) => ({ ...c, variant: "pi" as const })),
    ...ciCategories.map((c) => ({ ...c, variant: "ci" as const })),
  ];
  combined.sort((a, b) => b.score - a.score);
  return combined.slice(0, 4).map((c) => ({
    category: c.category,
    tagline: truncateToFirstSentence(
      PI_TEMPLATES[c.category]?.strength ?? CI_TEMPLATES[c.category]?.strength ?? ""
    ),
    variant: c.variant,
  }));
}

/** Extract first sentence from template text for use as a punchy tagline */
function truncateToFirstSentence(text: string): string {
  const match = text.match(/^[^.!]+[.!]/);
  return match ? match[0] : text;
}
```

- [ ] **Step 5: Run build to verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/results/ResultsExperience.tsx
git commit -m "Rewire ResultsExperience with new Builder Profile slide flow"
```

---

### Task 15: Update page.tsx OG metadata

**Files:**
- Modify: `src/app/results/[token]/page.tsx`

- [ ] **Step 1: Read current page.tsx**

Read `src/app/results/[token]/page.tsx`.

- [ ] **Step 2: Update metadata generation**

Change `generateMetadata()` to use archetype instead of BQ score:
- Title: `"[Name]'s Builder Profile — [Archetype Name]"` (or `"Builder Profile — [Archetype Name]"` if no name)
- Description: archetype tagline
- Remove any BQ score references from OG tags.

- [ ] **Step 3: Commit**

```bash
git add src/app/results/[token]/page.tsx
git commit -m "Update OG metadata to use archetype instead of BQ score"
```

---

### Task 16: Delete deprecated slide components

**Files:**
- Delete: `src/components/results/slides/RevealSlide.tsx`
- Delete: `src/components/results/slides/IntelligenceSlide.tsx`
- Delete: `src/components/results/slides/StatsSlide.tsx`
- Delete: `src/components/results/slides/RadarSlide.tsx`
- Delete: `src/components/results/slides/HighlightSlide.tsx`
- Delete: `src/components/results/slides/ShareSlide.tsx`
- Delete: `src/components/results/slides/EntrepreneurMatchSlide.tsx`
- Delete: `src/components/results/slides/EntrepreneurComparisonSlide.tsx`
- Delete: `src/components/results/slides/PersonalitySlide.tsx`

- [ ] **Step 1: Verify no remaining imports**

Run: `grep -r "RevealSlide\|StatsSlide\|RadarSlide\|HighlightSlide\|IntelligenceSlide\|ShareSlide\|EntrepreneurMatchSlide\|EntrepreneurComparisonSlide\|PersonalitySlide" src/ --include="*.tsx" --include="*.ts"`

Ensure no files still import these components (ResultsExperience should have been updated in Task 14).

- [ ] **Step 2: Delete the files**

```bash
rm src/components/results/slides/RevealSlide.tsx
rm src/components/results/slides/IntelligenceSlide.tsx
rm src/components/results/slides/StatsSlide.tsx
rm src/components/results/slides/RadarSlide.tsx
rm src/components/results/slides/HighlightSlide.tsx
rm src/components/results/slides/ShareSlide.tsx
rm src/components/results/slides/EntrepreneurMatchSlide.tsx
rm src/components/results/slides/EntrepreneurComparisonSlide.tsx
rm src/components/results/slides/PersonalitySlide.tsx
```

- [ ] **Step 3: Remove deprecated types from schemas**

Remove from `src/lib/schemas/results.ts`:
- `signatureMoveSchema` / `SignatureMove`
- `rarestMoveSchema` / `RarestMove`
- `growthEdgeSchema` / `GrowthEdge`
- `statsSchema` / `ResultsStats`
- `runnerUpSchema` (replaced by `matchRunnerUpSchema`)

Keep `entrepreneurMatchSchema` (reused as `communicationMatchSchema`).

- [ ] **Step 4: Run build to verify nothing breaks**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Remove deprecated slides and types from old results page"
```

---

### Task 17: Final integration test

- [ ] **Step 1: Run full test suite**

Run: `npm run test:run`
Expected: All tests pass.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Clean build, no errors.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No lint errors.

- [ ] **Step 4: Manual smoke test**

Start dev server: `npm run dev`
Navigate to a results page with a valid token. Verify:
- Archetype slide appears first (no BQ score)
- Reasoning highlights show top categories
- PI radar shows 12-point chart with abbreviated labels
- CI radar shows 12-point chart in gold
- Intelligence narrative shows strengths and growth areas
- Reasoning match shows placeholder (until backend is ready)
- Communication radar shows 20-point chart (if data exists)
- Communication narrative and match work (if data exists)
- Personality section appears only if quiz data exists
- Disclaimer has updated copy
- Share slide works for public path
- No numbers visible anywhere in the UI

- [ ] **Step 5: Commit any fixes from smoke test**

```bash
git add -A
git commit -m "Fix issues found during integration smoke test"
```

---

## Dependency Graph

```
Task 1 (schemas) ─────────────────────┐
                                       ├──► Task 4 (query update) ──► Task 14 (wire slides)
Task 2 (narrative templates) ─────────┤                                      │
                                       │                                      ▼
Task 3 (RadarChart component) ────────┤                              Task 15 (OG metadata)
                                       │                                      │
                                       ├──► Task 5 (ArchetypeSlide)           ▼
                                       ├──► Task 6 (ReasoningHighlights)  Task 16 (delete old)
                                       ├──► Task 7 (IntelligenceRadar)        │
                                       ├──► Task 8 (IntelligenceNarrative)    ▼
                                       ├──► Task 9 (ReasoningMatch + Modal) Task 17 (integration)
                                       │         │
                                       │         └──► Task 10 (Communication slides)
                                       │              (depends on EntrepreneurCardModal from Task 9)
                                       ├──► Task 11 (Personality slides)
                                       ├──► Task 12 (ShareApplySlide)
                                       └──► Task 13 (DisclaimerSlide)
```

**Parallelizable groups:**
- Tasks 1, 2, 3 can run in parallel (no dependencies)
- Tasks 5, 6, 7, 8, 9, 11, 12, 13 can run in parallel once Tasks 1–3 complete
- Task 10 (Communication slides) depends on Task 9 (needs `EntrepreneurCardModal` created in Task 9)
- Task 4 depends on Tasks 1 + 2
- Task 14 depends on Task 4 + all slide components (5–13)
- Tasks 15, 16 depend on Task 14
- Task 17 depends on everything
