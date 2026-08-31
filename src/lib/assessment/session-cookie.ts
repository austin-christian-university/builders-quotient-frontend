import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { getJwtSecret, JWT_ALG, JWT_ISSUER } from "@/lib/assessment/jwt-secret";

export const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours

const COOKIE_NAME = "bq-session";
const AUDIENCE = "bq:assess";
export const SESSION_COOKIE_MAX_AGE_SECONDS = 7200; // 2 hours

/**
 * How the holder proved they own this session.
 *
 * - "full"     — the student went through consent/setup, or resumed via a
 *                results token. This is the only trust level allowed to reach
 *                identity-bearing surfaces (email capture, profile merge).
 * - "degraded" — the cookie was reconstructed from a vignette write token
 *                (see vignette-token.ts) after the original cookie was lost
 *                mid-assessment. Enough to finish and submit the assessment;
 *                deliberately NOT enough to attach the session to a person.
 *
 * The write token ships to the browser in the RSC payload, so it is readable
 * by any script on the page. Minting a full-trust httpOnly cookie from it
 * would hand XSS everything httpOnly exists to protect.
 */
export type SessionTrust = "full" | "degraded";

export type SessionCookie = {
  sessionId: string;
  trust: SessionTrust;
  /** Seconds until this cookie expires. Negative values never occur (verify rejects). */
  expiresInSeconds: number;
};

/** Signs a JWT containing the session ID and sets it as an httpOnly cookie. */
export async function createSessionCookie(
  sessionId: string,
  trust: SessionTrust = "full"
) {
  const token = await new SignJWT({ sid: sessionId, trust })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${SESSION_COOKIE_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  });
}

/**
 * Reads and verifies the session cookie, returning the session id, its trust
 * level, and how long it has left.
 */
export async function readSessionCookieDetails(): Promise<SessionCookie | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  // Resolve the secret before the try. getJwtSecret() throws when
  // SESSION_SECRET is unset, and inside the try that config failure would be
  // swallowed and reported as "no session" — indistinguishable from a
  // logged-out student.
  const secret = getJwtSecret();

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: AUDIENCE,
      algorithms: [JWT_ALG],
    });

    const sessionId = payload.sid;
    if (typeof sessionId !== "string") return null;

    // Cookies minted before trust levels existed carry no `trust` claim. They
    // predate the write-token path, so they can only have come from the normal
    // consent flow — treat them as full.
    const trust: SessionTrust = payload.trust === "degraded" ? "degraded" : "full";

    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiresInSeconds =
      typeof payload.exp === "number" ? payload.exp - nowSeconds : 0;

    return { sessionId, trust, expiresInSeconds };
  } catch {
    return null;
  }
}

/** Reads and verifies the session cookie. Returns the session ID or null. */
export async function readSessionCookie(): Promise<string | null> {
  const details = await readSessionCookieDetails();
  return details?.sessionId ?? null;
}

/**
 * Returns the session ID only when the cookie carries full trust.
 *
 * Use this on any surface that attaches the session to a real person or
 * releases their data. A degraded cookie (rebuilt from a write token) must
 * not be able to merge profiles or capture contact details.
 */
export async function readTrustedSessionCookie(): Promise<string | null> {
  const details = await readSessionCookieDetails();
  return details?.trust === "full" ? details.sessionId : null;
}

/**
 * Re-issues the JWT with a fresh TTL using the same session ID.
 *
 * Trust is PRESERVED from the cookie being refreshed, never assumed. Defaulting
 * to "full" here would quietly launder a degraded cookie into a full one at any
 * call site that just wants to extend the TTL, which is the whole boundary.
 */
export async function refreshSessionCookie(sessionId: string) {
  const current = await readSessionCookieDetails();
  const trust: SessionTrust =
    current?.sessionId === sessionId ? current.trust : "degraded";
  await createSessionCookie(sessionId, trust);
}

/** Deletes the session cookie. */
export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete({
    name: COOKIE_NAME,
    path: "/",
  });
}
