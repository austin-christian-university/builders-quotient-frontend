"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe hook that tracks the user's `prefers-reduced-motion` media query.
 * Initializes as `false` on the server, then syncs in an effect to avoid
 * hydration mismatches.
 */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);

    function onChange(e: MediaQueryListEvent) {
      setReduced(e.matches);
    }

    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
