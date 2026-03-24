# Performance Benchmark Report

**Site:** https://bq.austinchristianu.org
**Date:** 2026-03-24
**Branch:** main (8e5ea1f)
**Grade:** B+

---

## Page Performance Summary

```
PERFORMANCE REPORT — bq.austinchristianu.org
══════════════════════════════════════════════

Page: / (Homepage) — COLD CACHE
─────────────────────────────────────────────────────
Metric              Value       Budget      Status
────────            ─────       ──────      ──────
TTFB                36ms        < 200ms     PASS
FCP                 418ms       < 1,800ms   PASS
DOM Ready           499ms       < 2,000ms   PASS
Full Load           700ms       < 3,000ms   PASS
Total Requests      39          < 50        PASS
Transfer Size       565KB       < 2,000KB   PASS
JS Transfer         438KB       < 500KB     WARNING (88%)
JS Decoded          1,327KB     < 1,500KB   WARNING (88%)
CSS Decoded         115KB       < 150KB     PASS
Font Transfer       92KB        < 150KB     PASS

Page: /assess/overview — WARM CACHE
─────────────────────────────────────────────────────
Metric              Value       Budget      Status
────────            ─────       ──────      ──────
TTFB                44ms        < 200ms     PASS
FCP                 397ms       < 1,800ms   PASS
Full Load           451ms       < 3,000ms   PASS
New Transfer        3KB         —           EXCELLENT

Page: /results/test-jordan-maker — WARM CACHE
─────────────────────────────────────────────────────
Metric              Value       Budget      Status
────────            ─────       ──────      ──────
TTFB                59ms        < 200ms     PASS
FCP                 1,267ms     < 1,800ms   PASS
Full Load           1,381ms     < 3,000ms   PASS
New JS Transfer     64KB        —           OK
HTML Payload        19KB/61KB   —           NOTABLE

Page: /privacy — WARM CACHE
─────────────────────────────────────────────────────
Metric              Value       Budget      Status
────────            ─────       ──────      ──────
TTFB                116ms       < 200ms     PASS
FCP                 352ms       < 1,800ms   PASS
Full Load           370ms       < 3,000ms   PASS
```

## Performance Budget Check

```
PERFORMANCE BUDGET — HOMEPAGE (cold cache)
════════════════════════════════════════════
Metric              Budget      Actual      Status
────────            ──────      ──────      ──────
FCP                 < 1.8s      0.42s       PASS
LCP                 < 2.5s      ~0.7s       PASS
Total JS (xfer)     < 500KB     438KB       WARNING (88%)
Total CSS           < 150KB     115KB       PASS
Total Transfer      < 2MB       565KB       PASS
HTTP Requests       < 50        39          PASS

Grade: B+ (6/6 passing, 1 approaching budget)
```

## Top 10 Slowest Resources (Homepage, cold cache)

```
#   Resource                          Type      Size(xfer)  Duration
─   ────────                          ────      ──────────  ────────
1   overview (fetch)                  fetch     1.2KB       1,047ms
2   overview (fetch)                  fetch     1.4KB       363ms
3   overview (fetch)                  fetch     1.2KB       337ms
4   overview (fetch)                  fetch     0.7KB       239ms
5   monitoring (fetch)                fetch     0.3KB       238ms
6   ab57efd...woff2 (Inter Tight)     font      44KB        219ms
7   2cbde1dac66ac6f2.js               script    44KB        216ms
8   3b2b9632e0b97334.js               script    14KB        215ms
9   83afe27...woff2 (Inter)           font      48KB        203ms
10  7ab2ef0244db2b4d.js               script    169KB       198ms
```

## JS Bundle Breakdown (Homepage)

```
JAVASCRIPT BUNDLES — 21 chunks, 438KB transfer / 1,327KB decoded
════════════════════════════════════════════════════════════════
#   Bundle                        Transfer    % of Total
─   ──────                        ────────    ──────────
1   7ab2ef0244db2b4d.js           169KB       38.5%      ← largest chunk
2   688116dbd32fb249.js           58KB        13.3%
3   2cbde1dac66ac6f2.js           44KB        10.1%
4   4c61d4deebc8a523.js           44KB        10.1%
5   307ea3e8f4df5be2.js           23KB        5.3%
6   9bb482c306bb967c.js           19KB        4.4%
7   3b2b9632e0b97334.js           14KB        3.2%
8   cdbd57ab33c68b2a.js           14KB        3.1%
9   f08d93387745b22d.js           9KB         2.0%
10  7725a571ce090649.js           8KB         1.8%
    (11 more chunks)              47KB        8.2%
```

## Network Request Breakdown (Homepage)

```
REQUEST TYPES
═════════════
Type        Count    Notes
────        ─────    ─────
script      21       JS chunks — could benefit from fewer, larger chunks
link        6        Fonts (2) + CSS (2) + preloads (2)
fetch       12       API/monitoring calls on page load
────────────────────
Total       39
```

## Key Findings

### Good

1. **TTFB is excellent** — 36-116ms across all pages. Server response is fast.
2. **Homepage loads in 700ms** — well under the 3s budget.
3. **Caching works well** — subsequent page navigations transfer almost nothing (3KB for assess/overview).
4. **Font strategy is solid** — 2 variable fonts (Inter + Inter Tight), ~92KB total, preloaded.

### Watch

1. **JS approaching budget** — 438KB transfer (88% of 500KB budget). The largest chunk (7ab2ef...js) alone is 169KB. One more large dependency pushes you over.
2. **12 fetch requests on homepage load** — Several "overview" fetches (Supabase?) and "monitoring" (PostHog/analytics?). Consider batching or deferring non-critical fetches.
3. **Results page FCP at 1.27s** — The slowest page. The 20KB HTML document (63KB decoded) is heavy SSR output. A 735ms monitoring fetch during load doesn't help.
4. **JS decoded size is 1.33MB** — Compression ratio is ~3x (438KB → 1.33MB). The raw JS is substantial. Watch for growth.
5. **21 JS chunks** — High chunk count means many HTTP requests. Consider Turbopack chunk merging config if this grows further.

### Recommendations

1. **Investigate the 169KB chunk** (7ab2ef0244db2b4d.js) — likely contains Framer Motion or a large dependency. Consider dynamic imports for animation-heavy components.
2. **Defer monitoring/analytics** — 5+ monitoring fetches happen before FCP. Load analytics after `requestIdleCallback` or after hydration.
3. **Lazy-load results page charts** — The results page is the heaviest. Radar charts and entrepreneur modals could load after initial paint.
4. **Consider streaming SSR for results** — The 63KB HTML payload could stream incrementally to improve FCP.

## Baseline Saved

This is the **first baseline**. Future `/benchmark` runs will compare against these numbers and flag regressions.

Baseline file: `.gstack/benchmark-reports/baselines/baseline.json`
