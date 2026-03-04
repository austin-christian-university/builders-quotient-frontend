"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Phase } from "./vignette-reducer";

export type SuspicionEvent = {
  type:
    | "copy_attempt"
    | "cut_attempt"
    | "context_menu"
    | "keyboard_shortcut"
    | "tab_hidden"
    | "tab_visible";
  timestamp: string;
  phase: Phase;
};

/**
 * Blocks copy/paste/selection keyboard shortcuts and right-click context menu
 * during active assessment phases. Tracks all attempts plus tab visibility
 * changes as suspicion events for anti-cheat review.
 *
 * Events accumulate in a ref (no re-renders). Use `getEvents()` to snapshot.
 */
export function useContentProtection(
  active: boolean,
  phase: Phase
): {
  getEvents: () => SuspicionEvent[];
  clearEvents: () => void;
} {
  const eventsRef = useRef<SuspicionEvent[]>([]);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const push = useCallback(
    (type: SuspicionEvent["type"]) => {
      eventsRef.current.push({
        type,
        timestamp: new Date().toISOString(),
        phase: phaseRef.current,
      });
    },
    []
  );

  useEffect(() => {
    if (!active) return;

    const onCopy = (e: Event) => {
      e.preventDefault();
      push("copy_attempt");
    };

    const onCut = (e: Event) => {
      e.preventDefault();
      push("cut_attempt");
    };

    const onContextMenu = (e: Event) => {
      e.preventDefault();
      push("context_menu");
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const key = e.key.toLowerCase();
      if (key === "c" || key === "a" || key === "x") {
        e.preventDefault();
        push("keyboard_shortcut");
      }
    };

    const onVisibilityChange = () => {
      push(document.hidden ? "tab_hidden" : "tab_visible");
    };

    document.addEventListener("copy", onCopy, { capture: true });
    document.addEventListener("cut", onCut, { capture: true });
    document.addEventListener("contextmenu", onContextMenu, { capture: true });
    document.addEventListener("keydown", onKeyDown, { capture: true });
    document.addEventListener("visibilitychange", onVisibilityChange, {
      capture: true,
    });

    return () => {
      document.removeEventListener("copy", onCopy, { capture: true });
      document.removeEventListener("cut", onCut, { capture: true });
      document.removeEventListener("contextmenu", onContextMenu, {
        capture: true,
      });
      document.removeEventListener("keydown", onKeyDown, { capture: true });
      document.removeEventListener("visibilitychange", onVisibilityChange, {
        capture: true,
      });
    };
  }, [active, push]);

  const getEvents = useCallback(() => [...eventsRef.current], []);

  const clearEvents = useCallback(() => {
    eventsRef.current = [];
  }, []);

  return { getEvents, clearEvents };
}
