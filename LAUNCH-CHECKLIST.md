# Launch Checklist

Remaining frontend work before opening to real students. Items ordered by priority.

---

## 1. Error Boundaries on Assessment Routes
**Priority: Must-fix**
**Status: Complete**

Add `error.tsx` files so crashes during the exam show a recovery UI instead of a white screen.

- [x] `/src/app/(assessment)/error.tsx` — catches errors across all assessment routes
- [x] `/src/app/error.tsx` — root-level fallback for anything else
- [x] `/src/app/not-found.tsx` — custom 404 page
- [x] Verify error boundaries render the design system (dark theme, not default Next.js error)
- [x] Include "try again" and "go home" actions

---

## 2. Security Headers via Middleware
**Priority: Must-fix**
**Status: Complete**

Create `middleware.ts` at project root to set response headers on all routes.

- [x] Content-Security-Policy (script-src, style-src, connect-src, media-src, frame-ancestors)
- [x] X-Frame-Options: DENY
- [x] X-Content-Type-Options: nosniff
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Permissions-Policy (camera, microphone — allow self only)
- [x] `poweredByHeader: false` in next.config.ts
- [x] Test that CSP doesn't break Supabase connections, Google Fonts, or video recording

---

## 3. Assessment Form Fallback
**Priority: Must-fix**
**Status: Complete**

If the `assessment_forms` table has no active rows, session creation crashes with an unhandled error.

- [x] Add graceful error handling in `selectAssessmentForm()` or its caller
- [x] Show a user-friendly "assessment unavailable" page instead of crashing
- [x] Log the error server-side so we know it happened

---

## 4. External Link Security
**Priority: Should-fix**
**Status: Complete**

Links with `target="_blank"` need `rel="noopener noreferrer"` to prevent window.opener access.

- [x] Fix in `ConsentGate.tsx` (privacy, terms, biometric policy links)
- [x] Fix in `PersonalityCompleteContent.tsx` (ACU URLs) — already had `rel` set
- [x] Audit all other components for `target="_blank"` without proper `rel`

---

## 5. OG Image and Social Meta
**Priority: Should-fix**
**Status: Complete**

Social shares currently have no preview image.

- [x] Design/source an OG image (1200x800) — reused ACU website photo, resized to 235 KB
- [x] Place in `/public/og-image.jpg`
- [x] Add `og:image` and `twitter:image` to root layout metadata
- [x] Add `og:url` (canonical)
- [ ] Add `twitter:site` handle if ACU has one
- [ ] Test with https://opengraph.xyz or Twitter card validator after deploy

---

## 6. Error Tracking (Sentry)
**Priority: Should-fix**
**Status: Not started**

Zero visibility into production errors right now.

- [ ] Install `@sentry/nextjs`
- [ ] Configure `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
- [ ] Add Sentry DSN to environment variables
- [ ] Wire into error boundaries (automatic with SDK)
- [ ] Add source maps upload to build
- [ ] Test that errors are captured in Sentry dashboard

---

## 7. Analytics
**Priority: Should-fix**
**Status: Not started**

No data on completion rates, drop-off points, or traffic.

- [ ] Install Vercel Analytics (`@vercel/analytics`) — or Plausible/Posthog if preferred
- [ ] Add `<Analytics />` component to root layout
- [ ] Track key funnel events: assessment started, each vignette completed, personality started, personality completed, results viewed
- [ ] Decide if custom events need a separate solution (Posthog, Mixpanel)

---

## 8. Robots.txt and Sitemap
**Priority: Nice-to-have**
**Status: Complete**

- [x] Add `/public/robots.txt` (allow marketing pages, disallow /assess/*, /results/*, /review/*, /api/*)
- [x] Add sitemap via `app/sitemap.ts` (home, privacy, terms, biometric-policy, contact)
- [x] Verify assessment routes have `robots: { index: false }` in metadata (already done for assessment layout)

---

## 9. Hardcoded Values Cleanup
**Priority: Nice-to-have**
**Status: Not started**

- [ ] Move ACU URLs in `PersonalityCompleteContent.tsx` to a constants file or env vars
- [ ] Hash the review password instead of plaintext comparison
- [ ] Review any other hardcoded values that should be configurable

---

## 10. Session Cookie Refresh
**Priority: Nice-to-have**
**Status: Not started**

The session cookie has a 2-hour TTL from creation. Long assessments could timeout.

- [ ] Evaluate whether to refresh the cookie TTL on each server action
- [ ] If yes, call `refreshSessionCookie()` in key actions (upload, personality submit)
- [ ] Test that refresh doesn't break the cooldown logic

---

## Progress Log

| # | Item | Date Started | Date Completed |
|---|------|-------------|----------------|
| 1 | Error Boundaries | | |
| 2 | Security Headers | | |
| 3 | Assessment Form Fallback | | |
| 4 | External Link Security | | |
| 5 | OG Image and Social Meta | | |
| 6 | Error Tracking (Sentry) | | |
| 7 | Analytics | | |
| 8 | Robots.txt and Sitemap | | |
| 9 | Hardcoded Values Cleanup | | |
| 10 | Session Cookie Refresh | | |
