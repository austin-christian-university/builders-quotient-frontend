import "server-only";

/**
 * Shared signing material for every assessment JWT (session cookie and
 * vignette write token). Both live under the same secret, so they belong in
 * one place rather than being restated per module.
 */

export const JWT_ALG = "HS256";
export const JWT_ISSUER = "bq:assess";

/**
 * Throws when SESSION_SECRET is unset. Callers must resolve this OUTSIDE any
 * try/catch wrapping jwtVerify — otherwise a configuration outage is caught by
 * the "invalid token" handler and every student looks logged out instead.
 */
export function getJwtSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET environment variable");
  }
  return new TextEncoder().encode(secret);
}
