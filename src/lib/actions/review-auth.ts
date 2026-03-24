"use server";

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "review_auth";
const HMAC_PAYLOAD = "bq-review-access";

function computeToken(password: string): string {
  return createHmac("sha256", password).update(HMAC_PAYLOAD).digest("hex");
}

export async function verifyReviewPassword(
  password: string
): Promise<{ success: boolean; error?: string }> {
  const expected = process.env.REVIEW_PASSWORD;
  if (!expected) {
    return { success: false, error: "Review access is not configured." };
  }

  if (password !== expected) {
    return { success: false, error: "Incorrect password." };
  }

  const token = computeToken(expected);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/review",
    maxAge: 86400,
  });

  return { success: true };
}

export async function isReviewAuthenticated(): Promise<boolean> {
  const expected = process.env.REVIEW_PASSWORD;
  if (!expected) return false;

  const jar = await cookies();
  const cookie = jar.get(COOKIE_NAME);
  if (!cookie?.value) return false;

  const expectedToken = computeToken(expected);

  try {
    const a = Buffer.from(cookie.value, "hex");
    const b = Buffer.from(expectedToken, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
