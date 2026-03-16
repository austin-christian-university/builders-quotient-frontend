"use client";

import { useState, useCallback, useRef } from "react";

/**
 * Tracks an element's content-box width via ResizeObserver.
 * Returns a ref callback (attach to the element) and the current width.
 * Returns 0 before first measurement (SSR-safe).
 */
export function useContainerWidth(): [
  refCallback: (node: HTMLElement | null) => void,
  width: number,
] {
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const refCallback = useCallback((node: HTMLElement | null) => {
    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node) return;

    // Read synchronously on attach to avoid one-frame flash
    setWidth(node.clientWidth);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w =
          entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
        setWidth(w);
      }
    });
    ro.observe(node);
    observerRef.current = ro;
  }, []);

  return [refCallback, width];
}
