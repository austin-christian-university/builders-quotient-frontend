# Repository Guidelines

## Project Overview

Builders Quotient (BQ) is a psychometric assessment frontend for Austin Christian University. It measures two domains: **intelligence** (practical, creative, and analytical, based on Sternberg's triarchic theory) and **entrepreneur personality** (9 dimensions). The app serves dual purposes as an admissions entrance exam and a public-facing lead generation tool. The backend is a shared Supabase instance also used by the `triarchic-databank` pipeline, which populates vignettes, scoring distributions, and entrepreneur profiles.

## Project Structure & Module Organization

This is a standalone Next.js 16 app using the App Router with `src/app/`. Shared UI primitives live in `src/components/ui/`, feature components in `src/components/[feature]/`, and layout shells in `src/components/layout/`. Business logic lives in `src/lib/`: queries in `src/lib/queries/`, server actions in `src/lib/actions/`, Zod schemas in `src/lib/schemas/`, Supabase clients in `src/lib/supabase/`, and scoring/utility code in `src/lib/assessment/`. The path alias `@/` maps to `src/`.

```
src/
├── app/                    # Routes (App Router)
│   ├── (marketing)/        # Public landing / lead-gen pages
│   ├── (assessment)/       # Assessment flow (intelligence → personality)
│   │   ├── layout.tsx      # Assessment session provider
│   │   ├── start/          # Intake form
│   │   ├── intelligence/   # PI + CI vignette sections
│   │   └── personality/    # 9-dimension like/dislike quiz
│   └── api/                # Route handlers
├── components/
│   ├── ui/                 # Base primitives (button, card, input, etc.)
│   ├── layout/             # Header, footer, nav
│   ├── assessment/         # Assessment-specific components
│   └── marketing/          # Landing page sections
└── lib/
    ├── supabase/           # Server + browser client factories
    ├── actions/            # Server Actions (mutations)
    ├── queries/            # Data fetching functions
    ├── schemas/            # Zod schemas and inferred types
    ├── assessment/         # Scoring logic, personality bank, fingerprinting
    └── utils.ts            # cn() helper, shared utilities
```

## Build, Test, and Development Commands

Install with `npm install`, run dev server with `npm run dev`, build with `npm run build`, lint with `npm run lint`. No test framework is set up yet; when added, use Vitest with `npm test`.

## Tech Stack

Next.js 16 with React 19, TypeScript in strict mode, Tailwind CSS v4 (config in `globals.css` via `@theme`, no `tailwind.config.js`). Supabase for database, auth, and storage via `@supabase/ssr`. Zod for validation. Framer Motion for animation. The project will use shadcn/ui-style component patterns with CVA + clsx + tailwind-merge.

## Coding Style & Naming Conventions

TypeScript strict mode; avoid `any`. Components and folders use `PascalCase` for component files, `kebab-case` for route segments and utility files, `camelCase` for hooks and utilities. Named exports preferred. Use `cn()` from `@/lib/utils` for conditional class merging.

## React useEffect Guidelines

**Before using useEffect, read:** [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)

Common cases where useEffect is NOT needed:

- Transforming data for rendering (use variables or useMemo instead)
- Handling user events (use event handlers instead)
- Resetting state when props change (use key prop or calculate during render)
- Updating state based on props/state changes (calculate during render)

Only use useEffect for:

- Synchronizing with external systems (APIs, DOM, third-party libraries)
- Cleanup that must happen when component unmounts

## Environment & Configuration

Environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the client, plus server-side keys as needed. Prefix client-exposed vars with `NEXT_PUBLIC_`. Never commit `.env` files.

## Assessment Domain Context

The assessment flow goes: intake → practical intelligence → creative intelligence → personality quiz. **Practical Intelligence (PI)** uses vignettes extracted from real entrepreneur interviews; students respond in free text, scored against 26 reasoning moves across 5 categories (diagnosing, reasoning, acting, people, meta-reasoning). **Creative Intelligence (CI)** uses episode-based vignettes; scored against 24 thinking moves across 5 categories (observing, reframing, articulating, evaluating, communicating). **Personality** measures 9 entrepreneur dimensions (Ambition, Risk Tolerance, Innovativeness, Autonomy, Self-Efficacy, Stress Tolerance, Internal Locus of Control, Grit, plus Attention Checks) via a like/dislike interaction pattern. All data persists to the shared Supabase instance (tables: `applicants`, `assessment_sessions`, `student_responses`, `personality_responses`, `personality_scores`, `pi_vignettes`, `ci_vignettes`, etc.).

## Related Projects

- **triarchic-databank** (`../triarchic-databank/`): Python backend pipeline that scrapes, transcribes, and extracts PI/CI data from entrepreneur interviews. Populates the Supabase database with vignettes, scoring distributions, and entrepreneur profiles. Reference its `src/models/` for schema definitions and `docs/` for methodology.
- **the-arena** (`../the-arena/`): Earlier assessment prototype with a working personality quiz (Likert-based, 121 items, 9 facets). Reference `app/assessment/` for flow patterns and `lib/assessment/` for scoring logic.

## Design Direction

The visual identity blends ACU's institutional palette with a modern dark-mode tech aesthetic. Think ACU's DNA (navy, bronze, warmth) rendered through an Apple-like lens (dark glassmorphism, clean typography, generous whitespace, glow-based interactions). This is a departmental product from ACU's more tech-forward programs, so it should feel like premium software, not a university form.

### Color System
- **Background**: Near-black with subtle blue tint (`#0a0a0c` base, `#111113` elevated surfaces)
- **Primary accent**: Electric blue (`#4da3ff`) for CTAs, links, focus states, and interactive glows
- **Secondary accent**: Warm gold/bronze (`#e9b949`) for highlights, progress indicators, and achievement moments
- **Navy**: ACU navy (`#1F303E`) for contextual depth and brand connection
- **Text**: Near-white (`#f5f6fa`) primary, cool grey (`#9aa0ac`) for muted/secondary
- **Borders**: Barely visible (`#1f1f23`), glass-style `border-white/10`

### Typography
- **Display/headings**: Inter Tight (semibold/bold, tight tracking `tracking-[-0.01em]`)
- **Body**: Inter (regular/medium)
- **Labels/eyebrows**: Uppercase, wide tracking (`tracking-[0.3em]`), small size
- **Scale**: Fluid `clamp()`-based sizing for responsive typography

### Design Patterns
- **Glassmorphism**: `backdrop-blur-xl` + semi-transparent dark fills + subtle borders
- **Glow interactions**: Hover states reveal radial color blooms, not hard color fills
- **Pill buttons**: `rounded-full` with accent glow shadows
- **Cards**: `rounded-2xl`, glass surface, deep soft shadows
- **Motion**: Physics-aware easing `[0.16, 1, 0.3, 1]`, staggered entry animations, always honor `prefers-reduced-motion`
- **Layered backgrounds**: Base color + subtle radial gradients + optional dot grid/noise for texture

### Relationship to ACU Brand
The navy and bronze from ACU's palette appear as supporting colors rather than primaries. The overall warmth and quality standard carries over, but expressed through a dark, tech-forward lens. The result should feel like it belongs in the ACU ecosystem while clearly signaling "this department builds cutting-edge tools."

## Commit & Pull Request Guidelines

Keep commits concise, sentence-case, under ~72 characters. Feature branches for all work. PRs should explain the problem and solution, list verification commands, and attach UI evidence when relevant.

---

Concise rules for building accessible, fast, delightful UIs. Use MUST/SHOULD/NEVER to guide decisions.

## Interactions

- Keyboard
  - MUST: Full keyboard support per [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/)
  - MUST: Visible focus rings (`:focus-visible`; group with `:focus-within`)
  - MUST: Manage focus (trap, move, and return) per APG patterns
- Targets & input
  - MUST: Hit target ≥24px (mobile ≥44px). If visual <24px, expand hit area
  - MUST: Mobile `<input>` font-size ≥16px or set viewport `maximum-scale=1`
  - NEVER: Disable browser zoom
  - MUST: `touch-action: manipulation` to prevent double-tap zoom; set `-webkit-tap-highlight-color` to match design
- Inputs & forms (behavior)
  - MUST: Hydration-safe inputs (no lost focus/value)
  - NEVER: Block paste in `<input>/<textarea>`
  - MUST: Loading buttons show spinner and keep original label
  - MUST: Enter submits focused text input. In `<textarea>`, ⌘/Ctrl+Enter submits; Enter adds newline
  - MUST: Keep submit enabled until request starts; then disable, show spinner, use idempotency key
  - MUST: Don't block typing; accept free text and validate after
  - MUST: Allow submitting incomplete forms to surface validation
  - MUST: Errors inline next to fields; on submit, focus first error
  - MUST: `autocomplete` + meaningful `name`; correct `type` and `inputmode`
  - SHOULD: Disable spellcheck for emails/codes/usernames
  - SHOULD: Placeholders end with ellipsis and show example pattern (e.g., `+1 (123) 456-7890`, `sk-012345…`)
  - MUST: Warn on unsaved changes before navigation
  - MUST: Compatible with password managers & 2FA; allow pasting one-time codes
  - MUST: Trim values to handle text expansion trailing spaces
  - MUST: No dead zones on checkboxes/radios; label+control share one generous hit target
- State & navigation
  - MUST: URL reflects state (deep-link filters/tabs/pagination/expanded panels). Prefer libs like [nuqs](https://nuqs.dev)
  - MUST: Back/Forward restores scroll
  - MUST: Links are links—use `<a>/<Link>` for navigation (support Cmd/Ctrl/middle-click)
- Feedback
  - SHOULD: Optimistic UI; reconcile on response; on failure show error and rollback or offer Undo
  - MUST: Confirm destructive actions or provide Undo window
  - MUST: Use polite `aria-live` for toasts/inline validation
  - SHOULD: Ellipsis (`…`) for options that open follow-ups (e.g., "Rename…")
- Touch/drag/scroll
  - MUST: Design forgiving interactions (generous targets, clear affordances; avoid finickiness)
  - MUST: Delay first tooltip in a group; subsequent peers no delay
  - MUST: Intentional `overscroll-behavior: contain` in modals/drawers
  - MUST: During drag, disable text selection and set `inert` on dragged element/containers
  - MUST: No "dead-looking" interactive zones—if it looks clickable, it is
- Autofocus
  - SHOULD: Autofocus on desktop when there's a single primary input; rarely on mobile (to avoid layout shift)

## Animation

- MUST: Honor `prefers-reduced-motion` (provide reduced variant)
- SHOULD: Prefer CSS > Web Animations API > JS libraries
- MUST: Animate compositor-friendly props (`transform`, `opacity`); avoid layout/repaint props (`top/left/width/height`)
- SHOULD: Animate only to clarify cause/effect or add deliberate delight
- SHOULD: Choose easing to match the change (size/distance/trigger)
- MUST: Animations are interruptible and input-driven (avoid autoplay)
- MUST: Correct `transform-origin` (motion starts where it "physically" should)

## Layout

- SHOULD: Optical alignment; adjust by ±1px when perception beats geometry
- MUST: Deliberate alignment to grid/baseline/edges/optical centers—no accidental placement
- SHOULD: Balance icon/text lockups (stroke/weight/size/spacing/color)
- MUST: Verify mobile, laptop, ultra-wide (simulate ultra-wide at 50% zoom)
- MUST: Respect safe areas (use `env(safe-area-inset-*)`)
- MUST: Avoid unwanted scrollbars; fix overflows

## Content & Accessibility

- SHOULD: Inline help first; tooltips last resort
- MUST: Skeletons mirror final content to avoid layout shift
- MUST: `<title>` matches current context
- MUST: No dead ends; always offer next step/recovery
- MUST: Design empty/sparse/dense/error states
- SHOULD: Curly quotes (" "); avoid widows/orphans
- MUST: Tabular numbers for comparisons (`font-variant-numeric: tabular-nums` or a mono like Geist Mono)
- MUST: Redundant status cues (not color-only); icons have text labels
- MUST: Don't ship the schema—visuals may omit labels but accessible names still exist
- MUST: Use the ellipsis character `…` (not `...`)
- MUST: `scroll-margin-top` on headings for anchored links; include a "Skip to content" link; hierarchical `<h1–h6>`
- MUST: Resilient to user-generated content (short/avg/very long)
- MUST: Locale-aware dates/times/numbers/currency
- MUST: Accurate names (`aria-label`), decorative elements `aria-hidden`, verify in the Accessibility Tree
- MUST: Icon-only buttons have descriptive `aria-label`
- MUST: Prefer native semantics (`button`, `a`, `label`, `table`) before ARIA
- SHOULD: Right-clicking the nav logo surfaces brand assets
- MUST: Use non-breaking spaces to glue terms: `10&nbsp;MB`, `⌘&nbsp;+&nbsp;K`, `Vercel&nbsp;SDK`

## Performance

- SHOULD: Test iOS Low Power Mode and macOS Safari
- MUST: Measure reliably (disable extensions that skew runtime)
- MUST: Track and minimize re-renders (React DevTools/React Scan)
- MUST: Profile with CPU/network throttling
- MUST: Batch layout reads/writes; avoid unnecessary reflows/repaints
- MUST: Mutations (`POST/PATCH/DELETE`) target <500 ms
- SHOULD: Prefer uncontrolled inputs; make controlled loops cheap (keystroke cost)
- MUST: Virtualize large lists (e.g., `virtua`)
- MUST: Preload only above-the-fold images; lazy-load the rest
- MUST: Prevent CLS from images (explicit dimensions or reserved space)

## Design

- SHOULD: Layered shadows (ambient + direct)
- SHOULD: Crisp edges via semi-transparent borders + shadows
- SHOULD: Nested radii: child ≤ parent; concentric
- SHOULD: Hue consistency: tint borders/shadows/text toward bg hue
- MUST: Accessible charts (color-blind-friendly palettes)
- MUST: Meet contrast—prefer [APCA](https://apcacontrast.com/) over WCAG 2
- MUST: Increase contrast on `:hover/:active/:focus`
- SHOULD: Match browser UI to bg
- SHOULD: Avoid gradient banding (use masks when needed)
