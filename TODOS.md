# TODOS

Deferred work items tracked from plan reviews and implementation.

---

## Active

### Entrepreneur explorer follow-ups (pre-landing review, 2026-04-24)

From the pre-landing code review of PR #26 (entrepreneur explorer). All non-blocking NITs that we chose to ship without to avoid delaying the feature.

- [ ] **Replace hardcoded corpus counts with live values.** `src/app/(marketing)/entrepreneurs/page.tsx:15-16,147` and `archetype/[archetype_key]/page.tsx:100` bake in `"248+ entrepreneurs"` / `"220 industries"` strings. Every new entrepreneur the pipeline adds makes those copy strings more wrong. Thread `stats.totalEntrepreneurs` / `stats.totalIndustries` through the rendered copy.
- [ ] **Derive or constantize `topDifferentiator`.** `src/lib/queries/entrepreneurs.ts:104` hardcodes `topDifferentiator: "People & Stakeholders"`, but the overview page labels it "#1 differentiator" as if it were data-derived. Either compute it from corpus deltas or move to a named constant with a comment explaining why it is fixed.
- [ ] **Extract `ENTREPRENEUR_SUMMARY_COLUMNS` constant.** `src/lib/queries/entrepreneurs.ts:46,162,220` duplicate the full `SELECT` column list three times. A constant prevents drift when the schema grows.
- [ ] **Belt-and-suspenders Zod parsing on entrepreneur lists.** `src/lib/queries/entrepreneurs.ts:56,167` cast Supabase results with `as EntrepreneurSummary[]` instead of `safeParse`. Current pipeline is trusted, but mirroring the communication-narrative pattern at `:247` would harden against schema drift.
- [ ] **Use stable keys in signature moves list.** `src/components/entrepreneurs/CommunicationStyleSection.tsx:166` uses array index as React key. Low risk (moves do not reorder), but `key={move.title}` is cleaner.
- [ ] **Pass `null` or filter empty-string pills in ScatterPlot.** `src/app/(marketing)/entrepreneurs/[id]/EntrepreneurProfileVisuals.tsx:44,131` passes `name: ""` for background dots; hitting one via tap would render an empty pill at `ScatterPlot.tsx:281`. Filter empty names out of the pill render path.
- [ ] **Replace cast with `currentTarget` in DirectoryList.** `src/app/(marketing)/entrepreneurs/directory/DirectoryList.tsx:34` uses `(e.target as HTMLInputElement).blur()`; `e.currentTarget.blur()` is type-safe without the assertion.
- [ ] **Drop the redundant `as ArchetypeRef` cast.** `src/lib/queries/entrepreneurs.ts:143` casts the result of `ARCHETYPES.find(...)` to `ArchetypeRef | undefined`, but `find` already returns that union type. The cast is noise.
- [ ] **Add division-by-zero comment to averaging helpers.** `src/lib/queries/entrepreneurs-helpers.ts:54,81` do `sums[cat] / counts[cat]` safely (both are keyed off the same iteration), but a short comment or `counts[cat] || 1` would make it obvious to future editors.
- [ ] **Replace `Math.min(...values)` spread in `computeTraitStats`.** `src/lib/queries/entrepreneurs-helpers.ts:116-129` spreads arrays into `Math.min` / `Math.max`. Fine at 274 entrepreneurs, would break past ~100k. Only worth fixing if the corpus is projected to grow that far.

## Completed

*(none yet)*
