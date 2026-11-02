# Design System — Builders Quotient: Swiss Ink

Builders Quotient is a psychometric assessment (practical intelligence, creative reasoning,
entrepreneur personality) for prospective students and applicants of Austin Christian University.
It is designed as **Swiss Ink**: paper, ink and one vermilion; flush-left type on a hard grid;
hairline rules instead of boxes. It should read like a well-set printed report, not a tech product.

Reference implementations: `src/components/marketing/SwissLanding.tsx` (+ `.module.css`),
`src/components/swiss/Swiss.tsx`, `src/app/(assessment)/assess/overview/overview-content.tsx`.

## Palette

Tokens live in `src/app/globals.css` (`@theme`). Use the Tailwind names, not raw hex, where one exists.

| Token | Value | Use |
|---|---|---|
| `paper` / `bg-base` | `#F4F1EA` | Page ground. Light only; there is no dark theme. |
| `bg-elevated` | `#FBFAF6` | Inputs, the rare raised surface. |
| `bg-surface` | `#ECE8DF` | Quiet fills (table stripes, empty states). |
| `ink` / `text-primary` | `#111111` | Text, rules, the ink end band, secondary buttons. |
| `vermilion` / `primary` | `#E8452C` | The one accent. Hover `primary-hover` `#D93D25`. |
| `text-secondary` | `#6B6963` | Secondary copy, captions. |
| `border` | `#D9D5CB` | Light rules between rows; chart gridlines. |
| — | `#8C8A84` | Small grey labels (section labels, eyebrows, meta). |
| — | `#3D3C39` | Long-form body/lede on paper. |
| — | `#BDBAB2` | Body copy on the ink band. |

Rules:
- **Vermilion appears once per view**: the primary action, or one key highlight (the student's
  score, the Q's tail). Never decoration, backgrounds, borders or body text. Two vermilion things
  on one screen means one of them is wrong.
- On vermilion, text is **ink**, not white (`text-ink` on `bg-primary`).
- Errors use vermilion text; there is no separate green/amber/blue semantic palette. Success is
  said in words, not colour.
- `secondary`, `navy` and `border-glass` are legacy aliases that resolve to ink tones so old class
  names still render. Do not use them in new code.

## Type

- **One family: Inter Tight**, a variable font via `next/font` (`--font-inter-tight-sans`). Both
  `font-sans` and `font-display` map to it. (Inter is still loaded as `--font-inter-sans`; nothing
  should rely on it.)
- Weights: 600 for display and emphasis, 500 for small emphasis, 400 for body. Nothing heavier.
- Tracking tightens with size: display `-0.055em`, section titles `-0.045em`, sub-heads
  `-0.02em`/`-0.03em`, body `0`. Never positive tracking.
- Line-height: display `0.9`, section titles `0.98`, lede `1.45`, body `1.5`.
- Numbers: `tabular-nums` (the landing sets `font-feature-settings: "tnum"`).
- Sentence case everywhere. **No uppercase-tracked eyebrows.** A label is `text-sm text-[#8c8a84]`.

| Role | Size |
|---|---|
| Hero / page title | `clamp(44px, 8vw, 120px)` (landing hero up to 172px) |
| Section title | `clamp(34px, 5vw, 64px)` |
| Lede | `clamp(18px, 1.6vw, 21px)`, max ~44ch |
| Section body | `clamp(17px, 1.4vw, 19px)`, max ~56ch |
| Body | 15–17px |
| Label / meta | 14px (`text-sm`) |

The `--text-fluid-*` variables (xs → 5xl) remain for app screens that need a step scale.
Keep reading measure at 44–68ch.

## Layout

- **Wrap**: `max-w-[1240px]`, centred, fluid gutter `px-[clamp(20px,4vw,48px)]` (20px at 375px).
  Use `<Wrap>` from `components/swiss/Swiss.tsx`.
- **Grid**: 12 columns from `md` (gap 24px), 4 columns below (gap 16px).
- **Numbered label column**: each section opens on a 1px ink rule (`border-t border-ink pt-6`);
  the first 3 columns hold the label (`<b>01</b> Label` — number ink, label grey), content takes
  the other 9. On mobile the label stacks above. Use `<Section n label title lede>`.
- **Page header**: `<PageHeader eyebrow title lede>` — flush left, never centred.
- **End band**: `<EndCta>` — full-bleed ink band, paper type, the one vermilion button.
- Rhythm: sections `pb-[clamp(64px,9vw,112px)]`, headers `pt-[clamp(48px,8vw,104px)]`.
- Must work at 375px with no horizontal scroll. Long names use `[overflow-wrap:anywhere]`.

## Components

Primitives in `src/components/ui` and `src/components/swiss`. Square corners (`rounded-none`),
no shadows.

- **Button** (`ui/button.tsx`, cva): `primary` vermilion fill + ink text; `secondary` ink fill +
  paper text; `outline` ink hairline that fills ink on hover; `ghost` grey text. Sizes `sm` 36px,
  `md` 44px (default — use on mobile), `lg` 48px. Polymorphic: `<Button as={Link} href>`.
  Toggles/filters: `secondary` when selected, `outline` when not, with `aria-pressed`.
- **Input** (`ui/input.tsx`): square, `border-ink/40` on `bg-elevated`, ink border + ring on
  focus, ≥16px text (no iOS zoom).
- **Checkbox** (`ui/checkbox.tsx`): square ink hairline, vermilion when checked.
- **Card** (`ui/card.tsx`): 1px ink border on `bg-elevated`. Prefer an ink top rule over a box;
  use Card only when something genuinely needs containing.
- **SiteNav / SiteFooter** (`swiss/`): mark + wordmark left, text links that underline on hover,
  a small ink "Begin" button (the page's own primary action keeps the vermilion).
- **Fact lists**: ruled rows (`border-t border-border`), label left, value right — not tiles.
- **Category markers**: a small square (`h-2.5 w-2.5`), filled ink vs. outlined, not coloured pills.
- **Quoted / secondary text blocks**: left ink hairline (`border-l border-ink pl-4`), not a tinted box.
- **Icons**: simple line SVGs in `currentColor`, square caps and joins. No emoji.

## The mark

`src/components/brand/BqMark.tsx` — the **Grid Q**: a square Q cut on a 4×4 grid
(`viewBox 0 0 64 64`), body in `currentColor`, tail the single vermilion stroke (`BQ_VERMILION`).
- Ink on paper, paper on the ink band; the tail stays vermilion on both.
- Lockup: mark + "Builder's Quotient" in Inter Tight 600, tracking `-0.025em`/`-0.03em`.
- Pass `title` when it stands alone (it becomes `role="img"`); otherwise it is `aria-hidden`.
- Never recolour the tail, round it, add effects, or put it in a container.

## Motion

Minimal. Content appears; it does not perform.
- Allowed: short entrance fades/rises (`opacity 0→1`, `y 20→0`, ~0.6–0.8s, `ease-out-expo` or
  `easeOut`) and 150ms colour transitions on hover. Via `motion/react`, gated on
  `usePrefersReducedMotion()`.
- No hover lifts, press scaling, glows, breathing, parallax or looping decoration.
- `globals.css` collapses all animation under `prefers-reduced-motion: reduce`.

### The narrator — the one animated presence

`src/components/narrator/` is Unify's narrator ported in ink: six strands woven round a hollow
ring, drawn as a fine pen line on `<canvas>`. Geometry and per-state parameters live in
`narrator-geometry.ts` (unit-tested); `audio-graph.ts` taps the narration `<audio>` so the voice
moves the strands. BQ only uses `idle` and `speaking` — it speaks, never listens.
- Use it through `components/assessment/VoiceRing.tsx` (`<VoiceRing audioRef isPlaying size>`).
- It is the only continuously moving thing in the product; nothing else on its screen animates.
- Reduced motion draws one still frame with fewer points.
- Keep it ink on paper — no tint, glow or coloured disc behind it.

## Charts

`src/components/results/RadarChart.tsx` and the radar slides.
- Ink, vermilion and greys only. The student's shape is vermilion (or ink when set against a
  vermilion reference); comparison/corpus shapes are ink or a dashed `#8C8A84` line.
- Fills are the accent at ~12% (`${accent}1F`). Gridlines 1px `#D9D5CB`; the outer ring may be ink.
- Labels `#6B6963`, active label `#111111`. Butt caps.
- No gradients, shadows, 3D or rainbow category palettes. A third series gets a grey or a dash.

## Share cards

`src/components/results/slides/ShareApplySlide.tsx`.
- 9:16 poster on paper, sized in container units (`@container`, `cqw`) so proportions hold at any
  width; a 2px ink frame lives on `CardFrame` (the captured node) so it is in every exported PNG.
- Header: mark lockup + optional grey label over a 2px ink rule. Body: grey label, then a large
  Inter Tight 600 result with tight tracking. Footer: ink band with the CTA,
  `bq.austinchristianu.org`, "Austin Christian University", and a large paper mark.
- One vermilion element per card (the reasoning marker / the Q tail).

## Don't

- Glassmorphism: `backdrop-blur`, translucent panels, glass borders.
- Glow, bloom, coloured `box-shadow`, any drop shadow.
- Orbs, radial-gradient blobs, dot grids, noise, any background decoration.
- Gradients of any kind — backgrounds, text, borders, chart fills.
- Rounded corners and pills (`rounded-full`, `rounded-xl`), including buttons, badges, spinners.
- Uppercase wide-tracked eyebrows (`uppercase tracking-[0.2em]`). Use a grey sentence-case label.
- Emoji as icons.
- Bento grids / stat tiles — boxed numbers in a card grid. Use ruled rows or one big number.
- Centred hero layouts; type sits flush left on the grid.
- More than one vermilion element per view, or vermilion as a background wash.
- Any value from the old dark theme: electric blue `#4DA3FF`, gold `#E9B949`, navy `#1F303E`,
  near-black `#0A0A0C`, white-alpha borders.
