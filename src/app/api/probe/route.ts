import { NextResponse } from "next/server";

/**
 * Connection speed probe endpoint.
 * Accepts a POST with a ~256 KB body, discards it, returns { ok: true }.
 * The client measures upload throughput from this round-trip.
 *
 * No auth required — this runs on the setup page before a session cookie
 * exists, and it only discards the payload (no data is stored).
 */
export async function POST() {
  return NextResponse.json({ ok: true });
}
