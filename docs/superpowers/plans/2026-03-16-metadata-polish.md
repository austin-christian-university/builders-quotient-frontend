# Metadata Polish Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace generic favicon with ACU monogram, create a premium dark-theme OG image with constellation SVG, update metadata descriptions, and clean up placeholder files.

**Architecture:** Static favicon/apple-icon PNGs auto-discovered by Next.js, build-time OG image via `opengraph-image.tsx` using Satori/ImageResponse, metadata updates in root layout.

**Tech Stack:** Next.js 16 App Router metadata API, `next/og` ImageResponse, `sips` (macOS) for image resizing

**Spec:** `docs/superpowers/specs/2026-03-16-metadata-polish-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/icon.png` | Create | 512x512 favicon (ACU monogram) |
| `src/app/apple-icon.png` | Create | 180x180 apple touch icon (ACU monogram) |
| `src/app/favicon.ico` | Delete | Superseded by icon.png |
| `src/app/opengraph-image.tsx` | Create | Build-time OG image (1200x630, constellation + text) |
| `src/app/layout.tsx` | Modify | Update metadata descriptions, remove manual image refs |
| `public/og-image.jpg` | Delete | Superseded by opengraph-image.tsx |
| `public/file.svg` | Delete | Next.js template placeholder |
| `public/globe.svg` | Delete | Next.js template placeholder |
| `public/next.svg` | Delete | Next.js template placeholder |
| `public/window.svg` | Delete | Next.js template placeholder |
| `public/vercel.svg` | Delete | Next.js template placeholder |

---

## Chunk 1: Favicon, Cleanup & Metadata

### Task 1: Copy and resize ACU favicon

**Files:**
- Create: `src/app/icon.png`
- Create: `src/app/apple-icon.png`
- Delete: `src/app/favicon.ico`

- [ ] **Step 1: Copy and resize to 512x512 for icon.png**

```bash
sips -z 512 512 /Users/larsostevold/projects/acu-website/app/icon.png --out src/app/icon.png
```

- [ ] **Step 2: Copy and resize to 180x180 for apple-icon.png**

```bash
sips -z 180 180 /Users/larsostevold/projects/acu-website/app/icon.png --out src/app/apple-icon.png
```

- [ ] **Step 3: Delete old favicon.ico**

```bash
rm src/app/favicon.ico
```

- [ ] **Step 4: Verify files exist at correct sizes**

```bash
sips -g pixelHeight -g pixelWidth src/app/icon.png src/app/apple-icon.png
```

Expected: icon.png is 512x512, apple-icon.png is 180x180.

- [ ] **Step 5: Commit**

```bash
git add src/app/icon.png src/app/apple-icon.png
git rm src/app/favicon.ico
git commit -m "Replace generic favicon with ACU monogram"
```

---

### Task 2: Delete placeholder files

**Files:**
- Delete: `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/window.svg`, `public/vercel.svg`, `public/og-image.jpg`

- [ ] **Step 1: Verify no code references to placeholder SVGs**

```bash
grep -r "file\.svg\|globe\.svg\|next\.svg\|window\.svg\|vercel\.svg" src/ --include="*.tsx" --include="*.ts"
```

Expected: No matches (these are unused template files).

- [ ] **Step 2: Delete all placeholder files and commit**

```bash
git rm public/file.svg public/globe.svg public/next.svg public/window.svg public/vercel.svg public/og-image.jpg
git commit -m "Remove placeholder SVGs and old OG image"
```

---

### Task 3: Update layout.tsx metadata

**Files:**
- Modify: `src/app/layout.tsx:21-51`

- [ ] **Step 1: Update metadata export**

Replace the entire `metadata` export with:

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
  },
  twitter: {
    card: "summary_large_image",
    title: "Builders Quotient | Austin Christian University",
    description: "Discover your Builder DNA.",
  },
};
```

Key changes:
- Description updated to lead with "Discover your Builder DNA"
- Removed manual `images` arrays (auto-discovered from `opengraph-image.tsx`)
- OG/Twitter descriptions shortened to tagline only

- [ ] **Step 2: Verify no remaining references to og-image.jpg**

```bash
grep -r "og-image" src/ --include="*.tsx" --include="*.ts"
```

Expected: No matches.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "Update metadata descriptions and remove manual OG image refs"
```

---

## Chunk 2: OG Image Generation

### Task 4: Create opengraph-image.tsx

**Files:**
- Create: `src/app/opengraph-image.tsx`

This is the most complex task. The file uses Next.js `ImageResponse` (Satori) to render a 1200x630 PNG at build time.

**Satori CSS limitations to observe:**
- No SVG elements — use divs with `border-radius: 50%` for circles
- No `text-transform` — write uppercase text literally in JSX
- No `z-index` — stacking order is DOM order (later = on top)
- No reliable `radial-gradient` — use a solid semi-transparent circle as fallback for center glow
- Use `backgroundImage` (not `background`) for gradients
- Sub-pixel dimensions may be rounded — acceptable
- `overflow: "hidden"` may not clip absolutely-positioned children — acceptable
- No wrapper divs around absolutely-positioned children — render all nodes as flat siblings of the root container
- Sub-pixel border widths (e.g., `0.7px`) may not render — use `1px` minimum
- Font files must be fetched separately (not available from `next/font/google`)

- [ ] **Step 1: Create opengraph-image.tsx with exports and font loading**

```tsx
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const alt = "Builders Quotient — Discover your Builder DNA";
export const contentType = "image/png";

// Font loading for Satori
async function loadFonts() {
  const [interTightBold, interSemiBold, interRegular] = await Promise.all([
    fetch(
      "https://fonts.gstatic.com/s/intertight/v7/NGSnv5HMAFg6IuGlBNMjxLsC66ZMtb8hyW62x0xCHi5XgqoUPvi5.ttf"
    ).then((res) => res.arrayBuffer()),
    fetch(
      "https://fonts.gstatic.com/s/inter/v18/UcCm3FwrK3iLTcviYwYZ90OhXoYF0kREdby07yPnCu5fMZs.ttf"
    ).then((res) => res.arrayBuffer()),
    fetch(
      "https://fonts.gstatic.com/s/inter/v18/UcCm3FwrK3iLTcviYwYZ90OhXoYF2EREdby07yPnCu5fMZs.ttf"
    ).then((res) => res.arrayBuffer()),
  ]);

  return [
    { name: "Inter Tight", data: interTightBold, weight: 700 as const, style: "normal" as const },
    { name: "Inter", data: interSemiBold, weight: 600 as const, style: "normal" as const },
    { name: "Inter", data: interRegular, weight: 400 as const, style: "normal" as const },
  ];
}
```

Note on font URLs: These are direct TTF URLs from Google Fonts. If they change, update by visiting `https://fonts.googleapis.com/css2?family=Inter+Tight:wght@700` and `https://fonts.googleapis.com/css2?family=Inter:wght@400;600` with a browser user-agent that requests TTF (e.g., older Android), and extracting the `url()` values.

- [ ] **Step 2: Add constellation data and line helper**

Define node positions and a helper to calculate line rotation/length. Add this below the font loading:

```tsx
// Constellation node definitions
// Coordinates are in the 1200x630 space
interface Node {
  x: number;
  y: number;
  r: number;
  opacity: number;
  ring?: number;      // glow ring radius
  ringOpacity?: number;
  halo?: number;      // soft halo radius
}

const primaryNodes: Node[] = [
  { x: 150, y: 100, r: 5, opacity: 1, ring: 11, ringOpacity: 0.4, halo: 20 },
  { x: 350, y: 180, r: 6, opacity: 1, ring: 13, ringOpacity: 0.45, halo: 22 },
  { x: 500, y: 120, r: 4.5, opacity: 0.95, ring: 10, ringOpacity: 0.35, halo: 18 },
  { x: 700, y: 200, r: 5.5, opacity: 1, ring: 12, ringOpacity: 0.4, halo: 20 },
  { x: 850, y: 150, r: 5, opacity: 0.95, ring: 11, ringOpacity: 0.35, halo: 18 },
  { x: 1050, y: 220, r: 5.5, opacity: 1, ring: 12, ringOpacity: 0.4, halo: 20 },
  { x: 200, y: 350, r: 4.5, opacity: 0.95, ring: 10, ringOpacity: 0.35, halo: 18 },
  { x: 400, y: 420, r: 5.5, opacity: 1, ring: 12, ringOpacity: 0.4, halo: 20 },
  { x: 600, y: 380, r: 6, opacity: 1, ring: 13, ringOpacity: 0.45, halo: 22 },
  { x: 800, y: 450, r: 5, opacity: 0.95, ring: 11, ringOpacity: 0.35, halo: 18 },
  { x: 1000, y: 400, r: 5.5, opacity: 1, ring: 12, ringOpacity: 0.4, halo: 20 },
];

const satelliteNodes: Node[] = [
  { x: 80, y: 250, r: 3, opacity: 0.7, ring: 8, ringOpacity: 0.25 },
  { x: 450, y: 280, r: 3.5, opacity: 0.75, ring: 9, ringOpacity: 0.25 },
  { x: 750, y: 320, r: 3.5, opacity: 0.75, ring: 9, ringOpacity: 0.25 },
  { x: 1120, y: 340, r: 3, opacity: 0.7, ring: 8, ringOpacity: 0.25 },
];

const ambientDots: Node[] = [
  { x: 250, y: 530, r: 2.5, opacity: 0.55 },
  { x: 550, y: 60, r: 2.5, opacity: 0.5 },
  { x: 900, y: 550, r: 2.5, opacity: 0.55 },
  { x: 1100, y: 100, r: 2.5, opacity: 0.5 },
  { x: 50, y: 450, r: 2, opacity: 0.45 },
  { x: 300, y: 60, r: 2, opacity: 0.4 },
  { x: 650, y: 550, r: 2, opacity: 0.45 },
  { x: 950, y: 80, r: 2, opacity: 0.4 },
  { x: 1150, y: 500, r: 2, opacity: 0.45 },
];

const starSpecks: Node[] = [
  { x: 120, y: 180, r: 1.2, opacity: 0.6 },
  { x: 280, y: 280, r: 1.2, opacity: 0.5 },
  { x: 520, y: 480, r: 1.2, opacity: 0.5 },
  { x: 680, y: 80, r: 1.2, opacity: 0.55 },
  { x: 920, y: 300, r: 1.2, opacity: 0.5 },
  { x: 1080, y: 480, r: 1.2, opacity: 0.55 },
  { x: 180, y: 480, r: 1, opacity: 0.45 },
  { x: 430, y: 80, r: 1, opacity: 0.4 },
  { x: 770, y: 560, r: 1, opacity: 0.45 },
  { x: 960, y: 180, r: 1, opacity: 0.4 },
];

// Connection lines: [fromIndex, toIndex, opacity, width]
// Indices reference primaryNodes array
const connections: [number, number, number, number][] = [
  // Primary connections
  [0, 1, 0.4, 1], [1, 2, 0.35, 1], [2, 3, 0.3, 0.9],
  [3, 4, 0.4, 1], [4, 5, 0.35, 1],
  [6, 7, 0.35, 1], [7, 8, 0.4, 1], [8, 9, 0.3, 0.9],
  [9, 10, 0.4, 1],
  // Cross connections
  [1, 7, 0.2, 0.8], [3, 8, 0.2, 0.8], [4, 9, 0.18, 0.7],
  [2, 7, 0.14, 0.6], [0, 6, 0.18, 0.7], [5, 10, 0.18, 0.7],
  // Additional depth
  [0, 2, 0.1, 0.5], [3, 5, 0.1, 0.5], [6, 8, 0.1, 0.5],
  [9, 5, 0.08, 0.5], [1, 8, 0.08, 0.5],
];

// Helper: calculate line geometry between two points
function lineProps(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  return { length, angle, cx, cy };
}
```

- [ ] **Step 3: Add the default export with the full image render**

```tsx
export default async function OGImage() {
  const fonts = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          backgroundColor: "#0a0a0c",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Center glow — solid semi-transparent circle (radial-gradient unreliable in Satori) */}
        <div
          style={{
            position: "absolute",
            top: "115px",
            left: "250px",
            width: "700px",
            height: "450px",
            borderRadius: "50%",
            backgroundColor: "rgba(77,163,255,0.05)",
          }}
        />

        {/* Connection lines */}
        {connections.map(([fromIdx, toIdx, opacity, width], i) => {
          const from = primaryNodes[fromIdx];
          const to = primaryNodes[toIdx];
          const { length, angle, cx, cy } = lineProps(from.x, from.y, to.x, to.y);
          return (
            <div
              key={`line-${i}`}
              style={{
                position: "absolute",
                left: `${cx - length / 2}px`,
                top: `${cy}px`,
                width: `${length}px`,
                height: `${width}px`,
                backgroundColor: `rgba(77,163,255,${opacity})`,
                transform: `rotate(${angle}deg)`,
                transformOrigin: "center center",
              }}
            />
          );
        })}

        {/* Satellite connection lines */}
        {[
          { sat: 0, pri: 6, opacity: 0.12 },
          { sat: 1, pri: 1, opacity: 0.1 },
          { sat: 1, pri: 8, opacity: 0.1 },
          { sat: 2, pri: 3, opacity: 0.1 },
          { sat: 2, pri: 9, opacity: 0.1 },
          { sat: 3, pri: 5, opacity: 0.12 },
          { sat: 3, pri: 10, opacity: 0.1 },
        ].map(({ sat, pri, opacity }, i) => {
          const from = satelliteNodes[sat];
          const to = primaryNodes[pri];
          const { length, angle, cx, cy } = lineProps(from.x, from.y, to.x, to.y);
          return (
            <div
              key={`sat-line-${i}`}
              style={{
                position: "absolute",
                left: `${cx - length / 2}px`,
                top: `${cy}px`,
                width: `${length}px`,
                height: "0.5px",
                backgroundColor: `rgba(77,163,255,${opacity})`,
                transform: `rotate(${angle}deg)`,
                transformOrigin: "center center",
              }}
            />
          );
        })}

        {/* Primary node halos (flat — no wrapper divs in Satori) */}
        {primaryNodes.map((node, i) =>
          node.halo ? (
            <div
              key={`halo-${i}`}
              style={{
                position: "absolute",
                left: `${node.x - node.halo}px`,
                top: `${node.y - node.halo}px`,
                width: `${node.halo * 2}px`,
                height: `${node.halo * 2}px`,
                borderRadius: "50%",
                backgroundColor: "rgba(77,163,255,0.06)",
              }}
            />
          ) : null
        )}

        {/* Primary node glow rings */}
        {primaryNodes.map((node, i) =>
          node.ring ? (
            <div
              key={`ring-${i}`}
              style={{
                position: "absolute",
                left: `${node.x - node.ring}px`,
                top: `${node.y - node.ring}px`,
                width: `${node.ring * 2}px`,
                height: `${node.ring * 2}px`,
                borderRadius: "50%",
                border: `1px solid rgba(77,163,255,${node.ringOpacity})`,
              }}
            />
          ) : null
        )}

        {/* Primary node cores */}
        {primaryNodes.map((node, i) => (
          <div
            key={`primary-${i}`}
            style={{
              position: "absolute",
              left: `${node.x - node.r}px`,
              top: `${node.y - node.r}px`,
              width: `${node.r * 2}px`,
              height: `${node.r * 2}px`,
              borderRadius: "50%",
              backgroundColor: "#4da3ff",
              opacity: node.opacity,
            }}
          />
        ))}

        {/* Satellite node glow rings */}
        {satelliteNodes.map((node, i) =>
          node.ring ? (
            <div
              key={`sat-ring-${i}`}
              style={{
                position: "absolute",
                left: `${node.x - node.ring}px`,
                top: `${node.y - node.ring}px`,
                width: `${node.ring * 2}px`,
                height: `${node.ring * 2}px`,
                borderRadius: "50%",
                border: `1px solid rgba(77,163,255,${node.ringOpacity})`,
              }}
            />
          ) : null
        )}

        {/* Satellite node cores */}
        {satelliteNodes.map((node, i) => (
          <div
            key={`satellite-${i}`}
            style={{
              position: "absolute",
              left: `${node.x - node.r}px`,
              top: `${node.y - node.r}px`,
              width: `${node.r * 2}px`,
              height: `${node.r * 2}px`,
              borderRadius: "50%",
              backgroundColor: "#4da3ff",
              opacity: node.opacity,
            }}
          />
        ))}

        {/* Ambient dots */}
        {ambientDots.map((node, i) => (
          <div
            key={`ambient-${i}`}
            style={{
              position: "absolute",
              left: `${node.x - node.r}px`,
              top: `${node.y - node.r}px`,
              width: `${node.r * 2}px`,
              height: `${node.r * 2}px`,
              borderRadius: "50%",
              backgroundColor: "#4da3ff",
              opacity: node.opacity,
            }}
          />
        ))}

        {/* Star specks */}
        {starSpecks.map((node, i) => (
          <div
            key={`speck-${i}`}
            style={{
              position: "absolute",
              left: `${node.x - node.r}px`,
              top: `${node.y - node.r}px`,
              width: `${node.r * 2}px`,
              height: `${node.r * 2}px`,
              borderRadius: "50%",
              backgroundColor: "#4da3ff",
              opacity: node.opacity,
            }}
          />
        ))}

        {/* Centered text stack (last in DOM = renders on top, no z-index in Satori) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          {/* Eyebrow — uppercase written literally (Satori has no textTransform) */}
          <div
            style={{
              fontFamily: "Inter",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.3em",
              color: "rgba(233,185,73,0.9)",
              marginBottom: "20px",
            }}
          >
            AUSTIN CHRISTIAN UNIVERSITY
          </div>

          {/* Title */}
          <div
            style={{
              fontFamily: "Inter Tight",
              fontSize: "48px",
              fontWeight: 700,
              color: "#f5f6fa",
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
            }}
          >
            Builders Quotient
          </div>

          {/* Gradient divider — use backgroundImage (not background) for Satori */}
          <div
            style={{
              width: "60px",
              height: "2px",
              backgroundImage: "linear-gradient(90deg, #4da3ff, rgba(233,185,73,0.7))",
              marginTop: "20px",
              marginBottom: "20px",
              borderRadius: "1px",
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontFamily: "Inter",
              fontSize: "17px",
              fontWeight: 400,
              color: "#9aa0ac",
              lineHeight: 1.5,
            }}
          >
            Discover your Builder DNA
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
    }
  );
}
```

- [ ] **Step 4: Build and verify**

```bash
npm run build
```

Expected: Build succeeds with no errors. The OG image is generated at build time.

- [ ] **Step 5: Start dev server and verify OG image renders**

```bash
npm run dev
# Then visit http://localhost:3000/opengraph-image in browser
```

Expected: A 1200x630 PNG renders showing the dark constellation design with centered text.

- [ ] **Step 6: Verify meta tags in HTML source**

Visit `http://localhost:3000` and view page source. Confirm these meta tags exist:
- `<meta property="og:image" content="...opengraph-image...">`
- `<meta property="og:image:width" content="1200">`
- `<meta property="og:image:height" content="630">`
- `<meta property="og:image:alt" content="Builders Quotient — Discover your Builder DNA">`
- `<meta name="twitter:image" content="...opengraph-image...">`

- [ ] **Step 7: Commit**

```bash
git add src/app/opengraph-image.tsx
git commit -m "Add build-time OG image with constellation design"
```

---

## Chunk 3: Final Verification

### Task 5: End-to-end verification

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: Clean build, no warnings about missing files or broken imports.

- [ ] **Step 2: Verify no stale references**

```bash
grep -r "og-image\|file\.svg\|globe\.svg\|next\.svg\|window\.svg\|vercel\.svg\|favicon\.ico" src/ --include="*.tsx" --include="*.ts"
```

Expected: No matches.

- [ ] **Step 3: Verify favicon in browser**

Start dev server, open browser, confirm the ACU monogram appears in the browser tab.

- [ ] **Step 4: Verify OG image in browser**

Navigate to `http://localhost:3000/opengraph-image` and confirm the constellation card renders correctly.
