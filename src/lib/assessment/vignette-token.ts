import "server-only";

import { SignJWT, jwtVerify } from "jose";

/**
 * Vignette write token — a capability token that authorizes saving the
 * recordings for ONE vignette of ONE session.
 *
 * Why this exists: the session cookie is the only credential the recording
 * flow had, and a student who loses that cookie mid-vignette (expiry, a
 * privacy extension, a managed device clearing cookies) loses the recording
 * outright — reserveResponse throws "Session mismatch", the blob is never
 * handed to the upload queue, and the take cannot be repeated because the
 * recording is timed and one-shot.
 *
 * The token is minted during the /assess/[step] render, only after the
 * session cookie has already been validated, and it lives in JS memory for
 * the life of that page. It is strictly narrower than the cookie: it names
 * the session AND the vignette, so it can only authorize writes to the
 * vignette the student was legitimately served.
 */

const ISSUER = "bq:assess";
const AUDIENCE = "bq:vignette-write";

/**
 * Long enough to cover a full vignette (three recordings plus the buffers)
 * with slack for a slow upload retrying in the background.
 */
const MAX_AGE_SECONDS = 4 * 60 * 60;

export type VignetteTokenClaims = {
  sessionId: string;
  vignetteId: string;
};

/**
 * Resolved outside any try/catch so a missing secret is a loud configuration
 * failure rather than a silent "not authorized".
 */
function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET environment variable");
  }
  return new TextEncoder().encode(secret);
}

/** Signs a capability token for (session, vignette). */
export async function mintVignetteToken(
  sessionId: string,
  vignetteId: string
): Promise<string> {
  return new SignJWT({ sid: sessionId, vid: vignetteId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

/** Verifies a capability token. Returns its claims, or null if unusable. */
export async function verifyVignetteToken(
  token: string | undefined | null
): Promise<VignetteTokenClaims | null> {
  if (!token) return null;

  // Resolve the secret before the try so a config error propagates instead of
  // being reported as an invalid token.
  const secret = getSecret();

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
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
