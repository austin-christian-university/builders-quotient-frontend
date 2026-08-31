import "server-only";

import {
  readSessionCookieDetails,
  refreshSessionCookie,
  createSessionCookie,
  SESSION_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/assessment/session-cookie";
import { verifyVignetteToken } from "@/lib/assessment/vignette-token";
import {
  getActiveSession,
  getSessionById,
  UNSCORED_STATUSES,
} from "@/lib/queries/session";

export type VignetteAuthFailure = "expired" | "mismatch" | "inactive";

/**
 * Thrown when a write against an assessment session cannot be authorized.
 *
 * `reason` separates cases the old code collapsed into a single
 * "Session mismatch":
 *   - "expired"  — no readable session cookie and no usable write token. The
 *                  student's credential went away; nothing they did is wrong.
 *   - "mismatch" — a credential exists but names a different session or
 *                  vignette. A genuine correctness/tampering signal.
 *   - "inactive" — the credential is valid but the session is finished or
 *                  abandoned, so it must not accept new responses.
 *
 * Callers surface `reason`, never `message`, to students — the messages here
 * are diagnostics for Sentry.
 */
export class VignetteAuthError extends Error {
  readonly reason: VignetteAuthFailure;

  constructor(reason: VignetteAuthFailure, message: string) {
    super(message);
    this.name = "VignetteAuthError";
    this.reason = reason;
  }
}

/**
 * Re-sign the cookie only when it is inside this much of its expiry. Sliding
 * it on every write looks harmless but is not: in Next 16 any cookie mutation
 * inside a Server Action marks the path revalidated, which forces a full RSC
 * re-render of /assess/[step] after the action — re-running its queries and
 * its recordVignetteServed write. Refreshing near the end of the window keeps
 * long assessments alive without paying that on every save.
 */
const REFRESH_WHEN_REMAINING_UNDER_SECONDS = SESSION_COOKIE_MAX_AGE_SECONDS / 2;

/**
 * Authorizes a write against one session, optionally scoped to one vignette.
 *
 * Accepts either credential:
 *   1. the session cookie, when it names the same session; or
 *   2. the vignette write token minted during the /assess/[step] render, when
 *      it names the same session — and, when `vignetteId` is supplied, the
 *      same vignette.
 *
 * The token is the fallback that keeps an already-captured recording saveable
 * when the cookie disappears mid-vignette. It is signed with SESSION_SECRET
 * and scoped more narrowly than the cookie it stands in for.
 *
 * Under the default `sessionState: "active"` the session must also still be
 * accepting responses: a completed or abandoned session takes no new ones,
 * which the page render enforces but a durable token would otherwise bypass.
 */
export async function authorizeSessionWrite(params: {
  sessionId: string;
  /** Omit for writes that are not tied to a single vignette (suspicion telemetry). */
  vignetteId?: string;
  writeToken?: string | null;
  /**
   * "active" (default) — the write starts a NEW response, so the session must
   * still be accepting them ("assigned" / "in_progress").
   * "unscored" — the write finalizes bookkeeping for a response that was already
   * accepted (upload confirmation, upload failure, telemetry). These legitimately
   * land AFTER the session is marked completed: reserveResponse completes the
   * session on step 4 phase 3, and that phase's upload confirms seconds later.
   * Requiring an active session there would leave the final vignette's video in
   * storage with needs_scoring never set. It still refuses "scored" and
   * "abandoned", so a durable token cannot reopen a graded submission.
   */
  sessionState?: "active" | "unscored";
}): Promise<void> {
  const {
    sessionId,
    vignetteId,
    writeToken,
    sessionState = "active",
  } = params;

  const requireSession = () => requireWritableSession(sessionId, sessionState);

  const cookie = await readSessionCookieDetails();

  if (cookie?.sessionId === sessionId) {
    await requireSession();
    if (cookie.expiresInSeconds < REFRESH_WHEN_REMAINING_UNDER_SECONDS) {
      await refreshSessionCookie(sessionId);
    }
    return;
  }

  const claims = await verifyVignetteToken(writeToken);
  if (claims) {
    const sessionMatches = claims.sessionId === sessionId;
    const vignetteMatches =
      vignetteId === undefined || claims.vignetteId === vignetteId;

    if (!sessionMatches || !vignetteMatches) {
      throw new VignetteAuthError(
        "mismatch",
        "Write token does not match the requested session or vignette"
      );
    }

    await requireSession();

    // The cookie is gone but the student holds a valid capability token for
    // this vignette. Re-issue a DEGRADED cookie so the next page render does
    // not bounce them to /assess/setup and strand the work we just saved.
    // Degraded, not full: the token is readable by page scripts, so a cookie
    // minted from it must not reach email capture or profile merge.
    if (cookie === null) {
      await createSessionCookie(sessionId, "degraded");
    }
    return;
  }

  if (cookie === null) {
    throw new VignetteAuthError(
      "expired",
      "No valid session cookie or vignette write token"
    );
  }

  throw new VignetteAuthError(
    "mismatch",
    "Session cookie names a different session"
  );
}

/** Vignette-scoped convenience wrapper — `vignetteId` is required here. */
export async function authorizeVignetteWrite(params: {
  sessionId: string;
  vignetteId: string;
  writeToken?: string | null;
  sessionState?: "active" | "unscored";
}): Promise<void> {
  return authorizeSessionWrite(params);
}

async function requireWritableSession(
  sessionId: string,
  sessionState: "active" | "unscored"
): Promise<void> {
  if (sessionState === "active") {
    if (!(await getActiveSession(sessionId))) {
      throw new VignetteAuthError(
        "inactive",
        "Session is not accepting responses"
      );
    }
    return;
  }

  const session = await getSessionById(sessionId);
  if (!session || !UNSCORED_STATUSES.includes(session.status as string)) {
    throw new VignetteAuthError(
      "inactive",
      "Session is scored or abandoned and cannot be modified"
    );
  }
}
