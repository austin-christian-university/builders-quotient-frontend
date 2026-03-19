import { WarmupClient } from "./warmup-client";

export const metadata = {
  title: "Warmup",
};

/**
 * Warmup page — no session validation needed.
 * The warmup is purely client-side (no session exists yet).
 * Session is created AFTER the student accepts consent at the end of warmup.
 */
export default function WarmupPage() {
  return <WarmupClient />;
}
