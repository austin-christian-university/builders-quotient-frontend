import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours

const COOKIE_NAME = "bq-session";
const ISSUER = "bq:assess";
const AUDIENCE = "bq:assess";
const MAX_AGE_SECONDS = 7200; // 2 hours

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing SESSION_SECRET environment variable");
  }
  return new TextEncoder().encode(secret);
}

/** Signs a JWT containing the session ID and sets it as an httpOnly cookie. */
export async function createSessionCookie(sessionId: string) {
  const token = await new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Reads and verifies the session cookie. Returns the session ID or null. */
export async function readSessionCookie(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  // Resolve the secret before the try. getSecret() throws when SESSION_SECRET
  // is unset, and inside the try that config failure would be swallowed and
  // reported as "no session" — indistinguishable from a logged-out student.
  const secret = getSecret();

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return (payload.sid as string) ?? null;
  } catch {
    return null;
  }
}

/** Re-issues the JWT with a fresh TTL using the same session ID. */
export async function refreshSessionCookie(sessionId: string) {
  await createSessionCookie(sessionId);
}

/** Deletes the session cookie. */
export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete({
    name: COOKIE_NAME,
    path: "/",
  });
}
