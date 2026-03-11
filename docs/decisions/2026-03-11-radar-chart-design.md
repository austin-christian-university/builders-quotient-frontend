# Radar Chart Design Decision

**Date:** 2026-03-11
**Status:** Decided

## Context

The intelligence radar charts (PI and CI) needed to show students how they approach problem-solving across 12 categories. The data comes from `move_details` in the scoring pipeline, giving us per-category scores for both the student and the entrepreneur corpus average.

## Options Explored

### Data source
- **Consensus-filtered (`track1_category_scores`):** Only includes moves above a 70% agreement threshold. Can't show bidirectional differences — student can never score above the entrepreneur line. Rejected.
- **Full move details (`move_details`):** Uses all moves. `studentScore = fraction demonstrated`, `entrepreneurScore = mean agreement_rate`. Student CAN score above entrepreneurs in categories where they demonstrate rarely-used moves. **Selected as data source.**

### Scaling approaches
1. **Raw 0–1 scale:** Both polygons plotted on a 0–1 axis. Problem: CI scores are naturally low (0.1–0.3), so both polygons huddle in the center with most of the chart unused. Looks broken.
2. **Single chart max:** The highest value across both polygons maps to the outer ring. Fills the space well, honest comparison. Works for PI where scores are spread out. Still clusters for CI when the max is low.
3. **Per-polygon normalization:** Each polygon scales to its own max independently. Both fill the chart, but you can't compare absolute positions between them — they're on different scales.
4. **Student-only, scaled to student max:** Drop the entrepreneur polygon entirely. Student's strongest category hits the outer ring, everything else is relative to that. The chart becomes a personal fingerprint, not a comparison.

### Grid styles
1. **Full grid (rings + axes):** Concentric rings at 25/50/75/100% imply quantitative measurement. Invites the question "what score did I get?"
2. **Axes only (no rings):** Spoke lines to each category, no rings. Removes the scale but still has the axis-to-center structure.
3. **Crosshair (center lines only):** Just vertical + horizontal lines to mark the center. Most minimal. Labels float around the shape.

### Entrepreneur overlay
- **Show both polygons:** Student sees where they are relative to entrepreneurs. Risk: students who score low relative to entrepreneurs may feel discouraged — the chart communicates "you're far from being an entrepreneur" rather than "here's how you think."
- **Student only:** The chart shows your personal shape — where you're strong and where you're less strong relative to yourself. No external comparison. Life-giving rather than deflating.

## Decision

**Student-only polygon, scaled to student max, full grid.**

- Data source: `move_details` (bidirectional, no consensus filter)
- Scaling: student's highest category = outer ring
- Grid: full (rings + axes)
- Entrepreneur overlay: hidden

### Why

The purpose of the results page is to help people understand themselves better — to feel seen, not ranked. Showing the entrepreneur average risks making the chart about distance from a benchmark rather than personal insight. A student who approaches problems through "Reading People" and "Following Your Compass" should feel affirmed in that, not shown that entrepreneurs score higher on "Seeing Possibilities."

The student-only approach turns the radar chart into a personal fingerprint: "this is how you think." The shape itself is the insight. The entrepreneur comparison data is still computed and available in the database for internal analysis — it's just not surfaced to the student on this slide.

The full grid (with rings) was kept because even though it implies scale, the action-verb labels and qualitative framing ("Your Reasoning Profile") steer interpretation toward shape rather than score. The rings help the eye read relative differences between categories without needing numbers.

## Implementation

- `RadarChart` component accepts `maxValue`, `gridStyle`, and renders accordingly
- `IntelligenceRadarSlide` accepts `hideCorpus` (hides entrepreneur polygon + legend)
- `scaleToMax` supports `"chart"`, `"perPolygon"`, or `false` for future flexibility
- `gridStyle` supports `"full"`, `"axesOnly"`, or `"crosshair"` for future flexibility
- Category labels use action verbs ("Reading the Room", "Seeing Possibilities") with tap/hover descriptions
- Visual floor at 8% prevents zero-score categories from collapsing the polygon to center
