import "server-only";

import {
  readSessionCookie,
  refreshSessionCookie,
  createSessionCookie,
} from "@/lib/assessment/session-cookie";
import { verifyVignetteToken } from "@/lib/assessment/vignette-token";

export type VignetteAuthFailure = "expired" | "mismatch";

/**
 * Thrown when a vignette write cannot be authorized.
 *
 * `reason` separates the two cases the old code collapsed into a single
 * "Session mismatch":
 *   - "expired"  — no readable session cookie and no usable write token. The
 *                  student's credential went away; nothing they did is wrong.
 *   - "mismatch" — a credential exists but names a different session or
 *                  vignette. That is a genuine correctness/tampering signal.
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
 * Authorizes a write against one vignette of one session.
 *
 * Accepts either credential:
 *   1. the session cookie, when it names the same session; or
 *   2. the vignette write token minted during the /assess/[step] render,
 *      when it names the same session AND the same vignette.
 *
 * The token is the fallback that keeps an already-captured recording
 * saveable when the cookie disappears mid-vignette. It is not a privilege
 * escalation: it is signed with SESSION_SECRET and is scoped more narrowly
 * than the cookie it stands in for.
 *
 * On a successful cookie authorization the cookie TTL is extended, so a long
 * run through four vignettes cannot age out mid-assessment. (The personality
 * quiz already did this; the vignette flow — the longer half — did not.)
 */
export async function authorizeVignetteWrite(params: {
  sessionId: string;
  vignetteId: string;
  writeToken?: string | null;
}): Promise<void> {
  const { sessionId, vignetteId, writeToken } = params;

  const cookieSessionId = await readSessionCookie();
  if (cookieSessionId === sessionId) {
    await refreshSessionCookie(sessionId);
    return;
  }

  const claims = await verifyVignetteToken(writeToken);
  if (claims) {
    if (claims.sessionId === sessionId && claims.vignetteId === vignetteId) {
      // The cookie is gone but the student holds a valid capability token for
      // this vignette. Re-issue the cookie so the next page render doesn't
      // bounce them to /assess/setup and strand the work we just saved.
      if (cookieSessionId === null) {
        await createSessionCookie(sessionId);
      }
      return;
    }
    throw new VignetteAuthError(
      "mismatch",
      "Vignette write token does not match the requested session or vignette"
    );
  }

  if (cookieSessionId === null) {
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

/**
 * Session-scoped variant for writes that are not tied to a single vignette
 * (currently suspicion telemetry).
 */
export async function authorizeSessionWrite(params: {
  sessionId: string;
  writeToken?: string | null;
}): Promise<void> {
  const { sessionId, writeToken } = params;

  const cookieSessionId = await readSessionCookie();
  if (cookieSessionId === sessionId) {
    await refreshSessionCookie(sessionId);
    return;
  }

  const claims = await verifyVignetteToken(writeToken);
  if (claims?.sessionId === sessionId) {
    if (cookieSessionId === null) {
      await createSessionCookie(sessionId);
    }
    return;
  }

  throw new VignetteAuthError(
    cookieSessionId === null && !claims ? "expired" : "mismatch",
    "Not authorized for this session"
  );
}
