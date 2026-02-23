"use client";

import { useCallback, useState } from "react";

export type SpeedTier = "fast" | "moderate" | "slow" | "very-slow";

type ProbeResult = {
  tier: SpeedTier;
  mbps: number;
};

type UseConnectionProbeReturn = {
  result: ProbeResult | null;
  isProbing: boolean;
  error: string | null;
  runProbe: () => void;
};

const PROBE_SIZE_BYTES = 256 * 1024; // 256 KB

function classifySpeed(mbps: number): SpeedTier {
  if (mbps > 5) return "fast";
  if (mbps > 2) return "moderate";
  if (mbps > 0.5) return "slow";
  return "very-slow";
}

export function useConnectionProbe(): UseConnectionProbeReturn {
  const [result, setResult] = useState<ProbeResult | null>(null);
  const [isProbing, setIsProbing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runProbe = useCallback(async () => {
    if (isProbing) return;
    setIsProbing(true);
    setError(null);

    try {
      // Generate random payload
      const payload = new Uint8Array(PROBE_SIZE_BYTES);
      crypto.getRandomValues(payload);

      const start = performance.now();

      const res = await fetch("/api/probe", {
        method: "POST",
        body: payload,
      });

      const elapsed = performance.now() - start;

      if (!res.ok) {
        throw new Error(`Probe failed: ${res.status}`);
      }

      // Calculate throughput in Mbps
      // elapsed is in ms, convert to seconds
      const seconds = elapsed / 1000;
      const bits = PROBE_SIZE_BYTES * 8;
      const mbps = bits / seconds / 1_000_000;

      const tier = classifySpeed(mbps);
      setResult({ tier, mbps });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection test failed");
    } finally {
      setIsProbing(false);
    }
  }, [isProbing]);

  return { result, isProbing, error, runProbe };
}
