# Design System — Builders Quotient

## Product Context
- **What this is:** A psychometric assessment measuring practical intelligence, creative reasoning, and entrepreneur personality
- **Who it's for:** Prospective students (public lead gen) and applicants (admissions) at Austin Christian University
- **Space/industry:** EdTech, psychometric assessment, university admissions (peers: 16Personalities, Gallup StrengthsFinder, CliftonStrengths)
- **Project type:** Web app (assessment flow + results dashboard + marketing landing page)

## Aesthetic Direction
- **Direction:** Dark Glassmorphism / Luxury-Tech
- **Decoration level:** Intentional — layered radial gradient orbs, subtle dot-grid/noise texture at near-zero opacity, glow bloom on hover. Decoration serves atmosphere, never competes with content.
- **Mood:** Premium, decisive, alive. The product should feel like a high-end psychometric tool, not a university form. ACU's institutional warmth rendered through an Apple-like dark-mode lens. The assessment experience should feel calm and focused; the results should feel celebratory and personal.

## Typography
- **Display/Hero:** Inter Tight (600/700) — geometric precision matches the data-driven assessment context. Tight tracking (`-0.01em` to `-0.04em`).
- **Body:** Inter (400/500) — highly legible at all sizes, excellent for long-form assessment content and descriptions.
- **Labels/Eyebrows:** Inter Tight (500), uppercase, wide tracking (`0.2em`–`0.4em`) — establishes hierarchy without needing larger sizes.
- **Data/Tables:** Inter with `font-variant-numeric: tabular-nums` — numbers align in columns and comparisons.
- **Code:** Geist Mono — for developer-facing or technical contexts.
- **Loading:** Google Fonts via `next/font` (Inter, Inter Tight). Geist Mono loaded on demand.
- **Scale:** Fluid `clamp()`-based sizing (no breakpoint jumps):

| Token | Min | Fluid | Max |
|-------|-----|-------|-----|
| xs | 0.75rem (12px) | `0.7rem + 0.25vw` | 0.875rem (14px) |
| sm | 0.875rem (14px) | `0.8rem + 0.375vw` | 1rem (16px) |
| base | 1rem (16px) | `0.925rem + 0.375vw` | 1.125rem (18px) |
| lg | 1.125rem (18px) | `1rem + 0.625vw` | 1.375rem (22px) |
| xl | 1.25rem (20px) | `1.05rem + 1vw` | 1.75rem (28px) |
| 2xl | 1.5rem (24px) | `1.15rem + 1.75vw` | 2.25rem (36px) |
| 3xl | 1.875rem (30px) | `1.35rem + 2.625vw` | 3rem (48px) |
| 4xl | 2.25rem (36px) | `1.5rem + 3.75vw` | 3.75rem (60px) |
| 5xl | 3rem (48px) | `2rem + 5vw` | 5rem (80px) |

## Color
- **Approach:** Restrained — two accent colors used sparingly for maximum impact. Color is rare and meaningful.
- **Primary:** `#4da3ff` (electric blue) — all interactive elements, CTAs, focus states, links. Hover: `#6bb4ff`.
- **Secondary:** `#e9b949` (warm gold/bronze) — progress indicators, achievements, celebration moments. Hover: `#f0ca6a`. Avoids pass/fail connotation; signals "something valuable."
- **Navy:** `#1f303e` — ACU brand connection, contextual depth in gradients. Supporting, not primary.
- **Backgrounds:** `#0a0a0c` (base, near-black with blue tint) → `#111113` (elevated, cards) → `#161618` (surface, tertiary)
- **Text:** `#f5f6fa` (primary, near-white) / `#9aa0ac` (secondary, cool grey)
- **Borders:** `#1f1f23` (solid, barely visible) / `rgb(255 255 255 / 0.1)` (glass, semi-transparent)
- **Semantic:**
  - Success: `#34d399` (emerald green) — completion states, upload confirmations
  - Warning: `#fbbf24` (amber) — permission issues, expiring sessions. Distinct from secondary gold.
  - Error: `#f87171` (soft red) — validation errors, upload failures
  - Info: `#60a5fa` (light blue) — informational notices. Distinct from primary blue.
- **Dark mode:** This is a dark-mode-only product. No light mode planned. If ever added, reduce saturation 10–20% and redesign surfaces.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — generous whitespace signals quality, reduces cognitive load during assessment
- **Scale:**

| Token | Size | Tailwind | Typical use |
|-------|------|----------|-------------|
| 2xs | 2px | `0.5` | Hairline gaps, icon-to-text micro-spacing |
| xs | 4px | `1` | Tight internal spacing |
| sm | 8px | `2` | Between related elements, icon gaps |
| md | 16px | `4` | Standard content gap, grid gutters |
| lg | 24px | `6` | Card padding, section gaps |
| xl | 32px | `8` | Between content groups |
| 2xl | 48px | `12` | Section padding |
| 3xl | 64px | `16` | Major section separation |
| 4xl | 96px | `24` | Section vertical padding (mobile `py-24`, desktop `py-32`) |

## Layout
- **Approach:** Hybrid — grid-disciplined for the assessment flow (predictable, calming), creative-editorial for marketing and results (engaging, memorable).
- **Grid:** Single column mobile, 2-col at 768px, 3-col at 1024px where content supports it.
- **Max content width:** 1280px (`max-w-7xl`), centered with `px-6` horizontal padding.
- **Border radius:** Hierarchical scale for visual hierarchy:

| Token | Size | Use |
|-------|------|-----|
| none | 0px | Data tables, code blocks |
| sm | 6px | Badges, tags, small pills |
| md | 8px | Inputs, small containers |
| lg | 12px | Medium containers, alerts |
| xl | 16px | Primary cards, modals (`rounded-2xl`) |
| full | 9999px | Buttons, avatars, orbs (`rounded-full`) |

Nested radius rule: child radius ≤ parent radius. Concentric corners maintain optical harmony.

## Shadows
- **Ambient:** `0 8px 32px rgb(0 0 0 / 0.3)` — always-on depth for elevated surfaces
- **Direct:** `0 2px 8px rgb(0 0 0 / 0.2)` — crisp near-shadow for lift
- **Combined (cards):** Ambient + Direct + Inset for full glassmorphic depth
- **Glow (primary):** `0 0 24px rgb(77 163 255 / 0.4)` — interactive hover bloom on primary actions
- **Glow (secondary):** `0 0 24px rgb(233 185 73 / 0.4)` — achievement/progress bloom
- **Inset highlight:** `inset 0 1px 1px rgba(255,255,255,0.05)` — glass top-edge catch light

No hard drop shadows. All shadows are soft and diffused.

## Glassmorphism
The primary surface pattern. Base recipe:
- Background: `bg-bg-elevated/60` (semi-transparent dark fill)
- Border: `border-border-glass` (`rgb(255 255 255 / 0.1)`)
- Blur: `backdrop-blur-xl` (20px)
- Shadows: Ambient + Direct + Inset
- Radius: `rounded-2xl` (16px) for cards
- Hover: `bg-white/[0.04]` + subtle lift (`-translate-y-1`)

## Motion
- **Approach:** Intentional — entrance animations, meaningful state transitions, ambient breathing. Never purely decorative.
- **Primary easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) — decisive, responsive, used for all entrances and major transitions. Defined as `--ease-out-expo`.
- **Duration scale:**

| Token | Duration | Use |
|-------|----------|-----|
| micro | 50–100ms | Button press feedback, toggles |
| short | 150–250ms | Hover states, focus transitions |
| medium | 300–400ms | Slide transitions, card entrances |
| long | 500–700ms | Page entrances, hero animations |

- **Entrance pattern:** Fade + translate (`opacity: 0, y: 20px` → `opacity: 1, y: 0`) with expo-out easing. Stagger children at 0.1–0.15s intervals.
- **Ambient pattern:** Infinite breathing (`scale: [1, 1.03–1.1, 1]` + `opacity: [0.4, 0.5–0.8, 0.4]`) at 4–8s duration, ease-in-out.
- **Interactive pattern:** Active press `scale(0.97)`. Hover reveals glow bloom, not hard color fill.
- **Reduced motion:** All animations collapse to simple opacity fade or instant. Enforced via `prefers-reduced-motion: reduce` in globals.css.

## Component Patterns

### Buttons
- Shape: `rounded-full` (pill) with gap-2 for icon+text
- Variants: primary (solid blue), secondary (solid gold), outline (transparent + glass border), ghost (no background)
- Sizes: sm (36px min-height), md (44px), lg (48px)
- Focus: `ring-2 ring-primary ring-offset-2 ring-offset-bg-base`
- Active: `scale(0.97)` for tactile feedback
- Hover glow: primary blue or secondary gold shadow bloom

### Cards
- Glassmorphic surface (see Glassmorphism section)
- Structure: Card wrapper → CardHeader → CardContent
- Hover: subtle lift + slight background opacity increase

### Inputs
- Rounded: `rounded-xl` (12px)
- Surface: glass-style (`bg-bg-elevated/60 backdrop-blur-sm`)
- Border: `border-border-glass`, focus: `border-primary` with 2px ring
- Error: `border-red-500/60` with ring
- Font size: minimum 16px (prevents iOS zoom)

### Alerts
- Background: semantic color at 8% opacity
- Border: semantic color at 20% opacity
- Text: semantic color at full saturation
- Icon: semantic color background at 20% opacity, rounded full

## Background Decoration
- **Ambient orbs:** Radial gradients with brand colors (`rgba(77,163,255,0.12)`, `rgba(233,185,73,0.06-0.08)`) fading to transparent at 60–70%. Position: offset from center, layered.
- **Texture:** Dot grid at `opacity-[0.04]`, noise overlay at `opacity-[0.03]`. Barely visible, adds grain.
- **Assessment mode:** Multiple layered orbs with subtle movement during phases. Reduced to static when `prefers-reduced-motion`.
- **Marketing mode:** Larger, more expressive orbs. Creative use of radial gradients for section atmosphere.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-19 | Initial design system formalized | Codified existing patterns from live codebase via /design-consultation. Filled gaps: semantic colors, spacing scale, radius hierarchy, shadow scale. |
| 2026-03-19 | Semantic colors: emerald/amber/red/light-blue | Chosen to be visually distinct from brand accents (primary blue, secondary gold) while maintaining coherence on dark backgrounds. |
| 2026-03-19 | 4px base spacing unit | Matches existing Tailwind usage patterns (p-6=24px, gap-4=16px). Comfortable density fits premium assessment context. |
| 2026-03-19 | Inter + Inter Tight retained as type system | Already implemented and well-suited. Inter Tight's geometric precision matches data-driven context. Common but correct choice over novelty. |
| 2026-03-19 | Dark-mode only | Assessment context benefits from focused, low-distraction dark environment. No light mode planned. |
