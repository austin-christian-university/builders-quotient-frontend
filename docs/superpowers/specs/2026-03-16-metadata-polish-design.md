# Metadata Polish — Favicon, OG Image & Cleanup

**Date:** 2026-03-16
**Status:** Approved

## Problem

The current metadata setup has several issues:
- Favicon is a generic `.ico` file with no clear brand connection
- OG image is a 1200x800 group photo that gets cropped unpredictably on social platforms and doesn't match the BQ product aesthetic
- OG description says "Measure your entrepreneurial intelligence" — functional but not compelling
- Placeholder SVGs from the Next.js template (`file.svg`, `globe.svg`, `next.svg`, `window.svg`, `vercel.svg`) are still in `public/`
- No `apple-icon.png` for iOS home screen bookmarks

## Design Decisions

### Favicon & Apple Icon

Copy the ACU interlocking monogram (`icon.png` from `../acu-website/app/icon.png`) into:
- `src/app/icon.png` — Next.js auto-discovers this for `<link rel="icon">`
- `src/app/apple-icon.png` — Next.js auto-discovers this for `<link rel="apple-touch-icon">`

Remove `src/app/favicon.ico` (superseded by `icon.png`).

### OG Image

Replace `public/og-image.jpg` (group photo, 1200x800) with a build-time generated image using Next.js `opengraph-image.tsx` in `src/app/`.

**Dimensions:** 1200x630 (standard OG/Twitter card size, fixes current cropping)

**Visual design (Concept B v2):**
- Background: `#0a0a0c` (BQ near-black)
- Full-bleed constellation network: blue (`#4da3ff`) nodes with glow rings and connecting lines spread across entire card
  - ~11 primary nodes (r=5-6px, full opacity, with glow ring r=11-13px at 35-45% opacity, and soft halo r=18-22px at 5-7% opacity)
  - ~4 medium satellite nodes (r=3-3.5px, 70-75% opacity, with smaller glow rings)
  - ~9 small ambient dots (r=2-2.5px, 40-55% opacity)
  - ~10 tiny star specks (r=1-1.2px, 40-60% opacity)
  - Connection lines between primary nodes at 30-40% opacity, cross-connections at 10-20%
  - Faint lines from satellites to nearest primary nodes
- Center radial glow: elliptical, `rgba(77,163,255,0.08)`, 700x450px
- Centered text stack:
  1. Eyebrow: "AUSTIN CHRISTIAN UNIVERSITY" — 11px, weight 600, letter-spacing 0.3em, uppercase, gold `rgba(233,185,73,0.9)`
  2. Title: "Builders Quotient" — 48px, weight 700, `#f5f6fa`, tracking -0.01em
  3. Divider: 60x2px gradient bar, `#4da3ff` to `rgba(233,185,73,0.7)`, centered, 20px margin
  4. Tagline: "Discover your Builder DNA" — 17px, `#9aa0ac`

**Implementation:** Use Next.js `ImageResponse` API in `src/app/opengraph-image.tsx`. This generates the image at build time (static route, not dynamic). The constellation is drawn using absolute-positioned div elements with border-radius (since `ImageResponse` doesn't support SVG elements directly). Delete `public/og-image.jpg` after.

### Metadata Updates in `layout.tsx`

```typescript
export const metadata: Metadata = {
  title: {
    default: "Builders Quotient | Austin Christian University",
    template: "%s | Builders Quotient",
  },
  description:
    "Discover your Builder DNA. A psychometric assessment of practical thinking, creative reasoning, and entrepreneur personality.",
  openGraph: {
    title: "Builders Quotient | Austin Christian University",
    description: "Discover your Builder DNA.",
    siteName: "Builders Quotient",
    type: "website",
    url: SITE_URL,
    // Image auto-discovered from opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "Builders Quotient | Austin Christian University",
    description: "Discover your Builder DNA.",
    // Image auto-discovered from opengraph-image.tsx
  },
};
```

When using `opengraph-image.tsx`, Next.js automatically injects the correct `<meta property="og:image">` and `<meta name="twitter:image">` tags. Remove the manual `images` arrays from the metadata export.

### Cleanup

Delete from `public/`:
- `file.svg`
- `globe.svg`
- `next.svg`
- `window.svg`
- `vercel.svg`
- `og-image.jpg`

## Files Changed

| File | Action |
|------|--------|
| `src/app/icon.png` | Add (copy from ACU) |
| `src/app/apple-icon.png` | Add (copy from ACU) |
| `src/app/favicon.ico` | Delete |
| `src/app/opengraph-image.tsx` | Create (build-time OG image generation) |
| `src/app/layout.tsx` | Update metadata export |
| `public/og-image.jpg` | Delete |
| `public/file.svg` | Delete |
| `public/globe.svg` | Delete |
| `public/next.svg` | Delete |
| `public/window.svg` | Delete |
| `public/vercel.svg` | Delete |

## Verification

1. `npm run build` succeeds
2. Dev server shows new favicon in browser tab
3. OG image renders at `/_next/static/media/opengraph-image.*` (or test with og-image debugger)
4. Social card preview tools (Twitter Card Validator, Facebook Sharing Debugger) show correct 1200x630 image
5. No references to deleted files remain in codebase
