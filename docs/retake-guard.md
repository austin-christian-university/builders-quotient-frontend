# Retake Guard & Duplicate Handling

## Philosophy

Speed bump, not a wall. The httpOnly session cookie prevents casual instant retakes (can't be cleared via DevTools). Incognito or clearing all site data bypasses it — that's acceptable. No IP or fingerprint blocking (false positives on shared WiFi). Email/phone duplicate detection is the durable server-side layer that catches repeat takers regardless of client-side guards.

## Session State Machine

Every assessment session has one of three statuses:

```
assigned  -->  in_progress  -->  completed
   |               |                |
   v               v                v
 (fresh)      (mid-exam)      (done, cooldown)
```

## Entry Point Behavior

Both entry points — `SetupPage` (server component) and `createAssessmentSession` (server action) — read the session cookie and branch on status:

### No cookie / invalid cookie
- Setup page renders normally (consent + start flow)
- User begins a fresh assessment

### Status: `assigned` or `in_progress`
- Computes the next incomplete step via `getCompletedSteps` + `findNextIncomplete`
- Redirects to `/assess/{nextStep}?resume=true`
- The **ResumeBanner** component (dismissible) renders at the top of the vignette experience:
  > "Welcome back! We noticed you were in the middle of your assessment. Even if you feel unsure about your responses so far, keep going — finish this attempt and you can retake it tomorrow with a fresh start."

### Status: `completed`
- Computes cooldown expiry: `session.completed_at + 2 hours`
- Checks whether the applicant has already captured their email:
  - **Email captured**: Redirects to `/assess/thank-you?path={student|general}&cooldown=true&until={ISO}`
  - **No email**: Redirects to `/assess/complete?cooldown=true&until={ISO}`
- The **CooldownBanner** component renders a live countdown:
  > "You recently completed this assessment. You can retake it in **1h 30m**."
- Countdown ticks every 60s (or every 1s when < 5 min remain)
- Auto-hides when countdown reaches zero

## Cookie & Cooldown Coordination

| Mechanism | Duration | Purpose |
|-----------|----------|---------|
| Session cookie (`bq-session`) | 2 hours | httpOnly JWT, prevents casual re-entry |
| Cooldown (`completed_at + 2h`) | 2 hours | Visible countdown shown to user |

Both expire at roughly the same time. Once the cookie expires, the user sees a fresh setup page. The cooldown banner is purely informational — it tells the user *why* they can't start a new assessment yet, and *when* they can.

## Email/Phone Duplicate Detection

When a user submits the email capture form after completing their assessment, the server checks for existing applicants with the same email or phone (excluding the current anonymous applicant).

### Two-step confirmation flow

**Step 1 — Initial submit (no match):**
Normal flow. Applicant is updated with email/phone, a `results_token` is generated, and the user redirects to the thank-you page.

**Step 1 — Initial submit (match found):**
Returns `{ duplicateFound: true, duplicateEmail, duplicatePhone, existingApplicantId }` to the client. The form re-renders with:
- An info banner: "We found an existing profile with this email/phone. Submitting will link this assessment to your existing profile."
- Hidden inputs: `confirmDuplicate=true`, `existingApplicantId={id}`
- Button changes to "Confirm & Link Results"

**Step 2 — User confirms:**
Server re-verifies the match (in case the user changed their email between submits). If the `existingApplicantId` still matches:
1. Re-points `assessment_sessions.applicant_id` to the existing applicant
2. Re-points `consent_records.applicant_id` to the existing applicant
3. Updates the existing applicant with new info (display_name, lead_type, marketing consents) — does **not** overwrite email, phone, or results_token
4. Deletes the orphaned anonymous applicant (guarded: only where `email IS NULL`)
5. Redirects to thank-you page

### Match priority
- Email match takes priority over phone match (stronger identity signal)
- If email and phone point to the same applicant: single merge target
- If email and phone point to different applicants: email match wins

### Safety guards
- Orphan deletion uses `.is("email", null)` to prevent accidental deletion of real applicants
- `student_responses` reference `session_id` (not `applicant_id`), so re-pointing the session doesn't affect response data
- If the user changes their email after seeing the duplicate notice, the server re-runs the duplicate check fresh and presents the correct notice

## Files

| File | Role |
|------|------|
| `src/app/(assessment)/assess/setup/page.tsx` | Entry point: session status routing |
| `src/lib/actions/session.ts` | `createAssessmentSession`: same routing in server action |
| `src/components/assessment/CooldownBanner.tsx` | Client component: live countdown from URL params |
| `src/components/assessment/ResumeBanner.tsx` | Client component: dismissible resume encouragement |
| `src/components/assessment/VignetteExperience.tsx` | Renders ResumeBanner at top of assessment view |
| `src/app/(assessment)/assess/complete/page.tsx` | Renders CooldownBanner above EmailCapture |
| `src/app/(assessment)/assess/thank-you/thank-you-content.tsx` | Renders CooldownBanner above thank-you content |
| `src/lib/schemas/applicant.ts` | `CaptureEmailResult` type with duplicate variant |
| `src/lib/actions/applicant.ts` | `captureEmail`: duplicate check, merge, normal flow |
| `src/components/assessment/EmailCapture.tsx` | Duplicate notice UI, hidden fields, button state |

## Verification

1. **Cookie guard**: Complete assessment, visit `/assess/setup` — redirects to complete/thank-you with cooldown
2. **Cookie expiry**: Wait 2h (or clear cookies) — setup renders fresh
3. **In-progress resume**: Start assessment, leave, return to setup — redirects to correct step with "Welcome back" banner
4. **Duplicate email**: Complete two assessments, enter same email — see notice, confirm, verify DB merge
5. **Changed input**: See duplicate notice, change email, submit — re-runs fresh check
6. **Build**: `npm run build` passes clean
7. **Tests**: `npx vitest run` — 215 tests, all passing
