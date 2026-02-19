---
name: design-system
description: Visual design system, color tokens, typography, and component styling patterns. Use when creating UI components, styling pages, or making design decisions.
user-invocable: false
---

# Design System — Builders Quotient

## Design Philosophy

Premium dark-mode tech aesthetic that feels like it belongs in the ACU ecosystem while signaling cutting-edge capability. Think Apple's design language applied to a university assessment tool. Every surface should feel intentional, every interaction polished.

## Color Tokens (Tailwind v4 — defined in globals.css via @theme)

### Backgrounds
| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#0a0a0c` | Page base (near-black, slight blue tint) |
| `--bg-alt` | `#111113` | Elevated surfaces, cards |
| `--bg-card` | `rgba(17, 17, 19, 0.65)` | Semi-transparent card fill |

### Text
| Token | Value | Use |
|-------|-------|-----|
| `--text` | `#f5f6fa` | Primary text (near-white) |
| `--muted` | `#9aa0ac` | Secondary/label text (cool grey) |

### Accents
| Token | Value | Use |
|-------|-------|-----|
| `--accent` | `#4da3ff` | Primary CTA, links, focus, interactive glows |
| `--accent-soft` | `rgba(77, 163, 255, 0.25)` | Blue tint for halos/glows |
| `--accent-alt` | `#e9b949` | Warm gold — progress, achievements, highlights |

### Brand Connection
| Token | Value | Use |
|-------|-------|-----|
| `--navy` | `#1F303E` | ACU navy — contextual depth, secondary backgrounds |
| `--bronze` | `#976230` | ACU bronze — warm accent moments |

### Structural
| Token | Value | Use |
|-------|-------|-----|
| `--border` | `#1f1f23` | Barely visible borders |
| `--radius-base` | `16px` | Default border radius |
| `--radius-lg` | `24px` | Cards, prominent surfaces |

## Typography

### Fonts
- **Display/headings**: Inter Tight (`--font-display`) — weights 400–700
- **Body**: Inter (`--font-sans`) — weights 400–600

### Type Scale Patterns
| Role | Classes |
|------|---------|
| Hero H1 | `font-display text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight tracking-[-0.01em]` |
| Section H2 | `font-display text-3xl font-semibold tracking-[-0.01em]` |
| Card heading | `font-display text-2xl font-semibold tracking-[-0.01em]` |
| Body large | `text-lg md:text-xl text-muted` |
| Labels/eyebrows | `text-xs uppercase tracking-[0.3em] text-muted` |

## Component Patterns

### Glass Card
```
rounded-[var(--radius-lg)]
border border-border/60
bg-bg-card/80
backdrop-blur-xl
shadow-[0_16px_40px_rgba(0,0,0,0.4)]
```

### Primary Button (Pill)
```
rounded-full
bg-accent/90 text-white
shadow-[0_12px_30px_rgba(77,163,255,0.35)]
hover:shadow-[0_16px_40px_rgba(77,163,255,0.45)]
transition-all duration-300
```

### Ghost Button
```
rounded-full
border border-border/70
hover:border-accent/70
transition-colors duration-300
```

### Hover Interactions
- **Glow**: Reveal radial color bloom above/behind element on hover
- **Border reveal**: Subtle accent-tinted border fades in
- **Scale**: `hover:scale-[1.02]` for interactive elements
- **No hard fills**: Use opacity/glow transitions, not abrupt color swaps

## Motion

### Easing
- Standard: `cubic-bezier(0.16, 1, 0.3, 1)` — fast in, gentle settle (Apple-like spring)
- For Framer Motion: `ease: [0.16, 1, 0.3, 1]`

### Patterns
- **Stagger children**: `staggerChildren: 0.08` for grid/list entry
- **Fade up**: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`
- **Always**: Honor `prefers-reduced-motion` with `useReducedMotion()`

## Background System

Layer these for depth (all `pointer-events-none`, behind content):
1. Base: `bg-[#0a0a0c]`
2. Subtle radial gradients at corners (blue top-left, gold top-right, very low opacity ~5%)
3. Optional: dot grid or noise texture overlay at ~5-7% opacity

## Relationship to ACU Brand

Navy and bronze appear as supporting colors, not primaries. The warmth and quality standard carries through, but expressed in a dark, tech-forward lens. Use navy for contextual depth (e.g., section backgrounds that need to feel warmer). Use bronze/gold sparingly for achievement moments and progress indicators.
