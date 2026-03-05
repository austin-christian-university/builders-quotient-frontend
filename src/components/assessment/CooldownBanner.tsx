"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function getTimeRemaining(until: string): number {
  return Math.max(0, new Date(until).getTime() - Date.now());
}

function formatRemaining(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

export function CooldownBanner() {
  const searchParams = useSearchParams();
  const cooldown = searchParams.get("cooldown") === "true";
  const until = searchParams.get("until");

  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!cooldown || !until) return;

    const ms = getTimeRemaining(until);
    setRemaining(ms);

    if (ms <= 0) return;

    const tick = ms < 5 * 60_000 ? 1_000 : 60_000;
    const id = setInterval(() => {
      const next = getTimeRemaining(until);
      setRemaining(next);
      if (next <= 0) clearInterval(id);
    }, tick);

    return () => clearInterval(id);
  }, [cooldown, until]);

  if (!cooldown || !until || remaining === null || remaining <= 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto mb-8 w-full max-w-lg rounded-xl border border-secondary/30 bg-secondary/10 px-5 py-4 text-center text-[length:var(--text-fluid-sm)] leading-relaxed text-secondary"
    >
      You recently completed this assessment. You can retake it in{" "}
      <strong className="font-semibold">{formatRemaining(remaining)}</strong>.
    </div>
  );
}
