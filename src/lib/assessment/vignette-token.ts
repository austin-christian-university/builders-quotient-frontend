import "server-only";

import { SignJWT, jwtVerify } from "jose";

import { getJwtSecret, JWT_ALG, JWT_ISSUER } from "@/lib/assessment/jwt-secret";

/**
 * Vignette write token — a capability token that authorizes saving the
 * recordings for ONE vignette of ONE session.
 *
 * Why this exists: the session cookie was the only credential the recording
 * flow had, and a student who loses that cookie mid-vignette (expiry, a
 * privacy extension, a managed device clearing cookies) loses the recording
 * outright — the take is timed and one-shot, so there is nothing to retry.
 *
 * The token is minted during the /assess/[step] render, only after the
 * session cookie has already been validated, and it lives in JS memory for
 * the life of that page. It is strictly narrower than the cookie: it names
 * the session AND the vignette, so it can only authorize writes to the
 * vignette the student was legitimately served.
 *
 * It is a bearer credential readable by any script on the page, so treat it
 * accordingly: every surface that accepts it MUST check the `vid` claim, and
 * it can only ever mint a degraded session cookie (see session-cookie.ts).
 */

const AUDIENCE = "bq:vignette-write";

/**
 * Deliberately shorter than SESSION_COOKIE_MAX_AGE_SECONDS (2h). A vignette is
 * three recordings plus buffers — minutes, not hours — and the slack here is
 * for a slow background upload retrying, nothing more. Keeping it under the
 * cookie's lifetime stops the token from becoming a way to renew a session
 * past the point the cookie would have expired.
 */
export const VIGNETTE_TOKEN_MAX_AGE_SECONDS = 45 * 60;

export type VignetteTokenClaims = {
  sessionId: string;
  vignetteId: string;
};

/** Signs a capability token for (session, vignette). */
export async function mintVignetteToken(
  sessionId: string,
  vignetteId: string
): Promise<string> {
  return new SignJWT({ sid: sessionId, vid: vignetteId })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${VIGNETTE_TOKEN_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

/** Verifies a capability token. Returns its claims, or null if unusable. */
export async function verifyVignetteToken(
  token: string | undefined | null
): Promise<VignetteTokenClaims | null> {
  if (!token) return null;

  // Resolve the secret before the try so a config error propagates instead of
  // being reported as an invalid token.
  const secret = getJwtSecret();

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: AUDIENCE,
      algorithms: [JWT_ALG],
    });

    const sessionId = payload.sid;
    const vignetteId = payload.vid;
    if (typeof sessionId !== "string" || typeof vignetteId !== "string") {
      return null;
    }

    return { sessionId, vignetteId };
  } catch {
    return null;
  }
}
