"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { toBlob } from "html-to-image";

// Safari detection — stable for the session, no need for useSyncExternalStore
const isSafari =
  typeof navigator !== "undefined" &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/**
 * Generates a PNG blob from a card element, with Safari double-call workaround.
 * Images use inline data URLs (ACU_WORDMARK_DATA_URL), so no src-swapping needed.
 */
async function generateBlob(
  el: HTMLElement,
  pixelRatio: number
): Promise<Blob> {
  const captureOpts = {
    pixelRatio,
    style: { transform: "none" },
    skipFonts: false,
    filter: (node: HTMLElement) => {
      const style = node.style;
      if (style?.filter?.includes("blur")) return false;
      const cls = typeof node.className === "string" ? node.className : "";
      if (cls.includes("blur-")) return false;
      return true;
    },
  };

  // Safari returns blank on first toBlob() call — discard it
  if (isSafari) {
    await toBlob(el, captureOpts).catch(() => {});
  }
  const blob = await toBlob(el, captureOpts);
  if (!blob) throw new Error("Image capture returned empty");
  return blob;
}

interface UseShareCardCacheOptions {
  enabled: boolean;
}

interface UseShareCardCacheReturn {
  /** Returns cached blob or generates on demand */
  getBlob: () => Promise<Blob>;
  /** null while generating */
  cachedBlob: Blob | null;
  isGenerating: boolean;
}

/**
 * Pre-generates a share card PNG blob in the background.
 * When `cardId` changes and `enabled` is true, starts generating after a 300ms
 * debounce to avoid wasteful work during rapid carousel swiping.
 *
 * On mobile (coarse pointer), uses pixelRatio 2 instead of 4 for faster generation.
 */
export function useShareCardCache(
  cardRef: React.RefObject<HTMLElement | null>,
  cardId: string,
  options: UseShareCardCacheOptions
): UseShareCardCacheReturn {
  const [cache, setCache] = useState<{ blob: Blob; cardId: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Track the current cardId to discard stale results
  const currentCardIdRef = useRef(cardId);
  currentCardIdRef.current = cardId;

  // Derive cachedBlob only if it matches the current card
  const cachedBlob = cache?.cardId === cardId ? cache.blob : null;

  // Detect coarse pointer for pixelRatio optimization
  const isCoarseRef = useRef(false);
  useEffect(() => {
    isCoarseRef.current = window.matchMedia("(pointer: coarse)").matches;
  }, []);

  // Background generation with debounce
  useEffect(() => {
    if (!options.enabled) return;

    // Clear stale cache when card changes
    setCache(null);

    const debounceTimer = setTimeout(() => {
      const el = cardRef.current;
      if (!el) return;
      if (currentCardIdRef.current !== cardId) return;

      setIsGenerating(true);
      const pixelRatio = isCoarseRef.current ? 2 : 4;

      generateBlob(el, pixelRatio)
        .then((blob) => {
          // Only cache if this is still the active card
          if (currentCardIdRef.current === cardId) {
            setCache({ blob, cardId });
          }
        })
        .catch((err) => {
          console.warn("Share card pre-generation failed:", err);
        })
        .finally(() => {
          if (currentCardIdRef.current === cardId) {
            setIsGenerating(false);
          }
        });
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [cardId, options.enabled, cardRef]);

  const getBlob = useCallback(async (): Promise<Blob> => {
    // Return cached blob only if it was generated for the current card
    if (cache?.cardId === cardId) {
      return cache.blob;
    }

    // Generate on demand
    const el = cardRef.current;
    if (!el) throw new Error("Card element not available");

    const pixelRatio = isCoarseRef.current ? 2 : 4;
    return generateBlob(el, pixelRatio);
  }, [cache, cardId, cardRef]);

  return { getBlob, cachedBlob, isGenerating };
}
