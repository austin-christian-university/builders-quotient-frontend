import { useCallback, useEffect, useRef } from "react";

type UseSwipeNavigationOptions = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  enabled: boolean;
};

const SWIPE_THRESHOLD_PX = 50;
const VELOCITY_THRESHOLD = 0.3; // px/ms
const LOCK_THRESHOLD_PX = 10;

/**
 * Returns a ref callback that attaches touch listeners for horizontal swipe
 * navigation. Vertical scrolling passes through untouched.
 */
export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  enabled,
}: UseSwipeNavigationOptions): React.RefCallback<HTMLElement> {
  const stateRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    directionLocked: "horizontal" | "vertical" | null;
  } | null>(null);

  const callbacksRef = useRef({ onSwipeLeft, onSwipeRight, enabled });
  useEffect(() => {
    callbacksRef.current = { onSwipeLeft, onSwipeRight, enabled };
  });

  const cleanupRef = useRef<(() => void) | null>(null);

  return useCallback((node: HTMLElement | null) => {
    // Remove previous listeners (handles Strict Mode double-mount)
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (!node) return;

    function handleTouchStart(e: TouchEvent) {
      if (!callbacksRef.current.enabled) return;
      const touch = e.touches[0];
      stateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        directionLocked: null,
      };
    }

    function handleTouchMove(e: TouchEvent) {
      const state = stateRef.current;
      if (!state || !callbacksRef.current.enabled) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;

      if (state.directionLocked === null) {
        const totalMovement = Math.abs(deltaX) + Math.abs(deltaY);
        if (totalMovement < LOCK_THRESHOLD_PX) return;

        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          state.directionLocked = "vertical";
        } else {
          state.directionLocked = "horizontal";
        }
      }

      if (state.directionLocked === "horizontal") {
        e.preventDefault();
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      const state = stateRef.current;
      if (!state || !callbacksRef.current.enabled) return;

      if (state.directionLocked !== "horizontal") {
        stateRef.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - state.startX;
      const elapsed = Date.now() - state.startTime;
      const velocity = Math.abs(deltaX) / Math.max(elapsed, 1);

      if (
        Math.abs(deltaX) >= SWIPE_THRESHOLD_PX ||
        velocity >= VELOCITY_THRESHOLD
      ) {
        if (deltaX < 0) {
          callbacksRef.current.onSwipeLeft();
        } else {
          callbacksRef.current.onSwipeRight();
        }
      }

      stateRef.current = null;
    }

    node.addEventListener("touchstart", handleTouchStart, { passive: true });
    node.addEventListener("touchmove", handleTouchMove, { passive: false });
    node.addEventListener("touchend", handleTouchEnd, { passive: true });

    cleanupRef.current = () => {
      node.removeEventListener("touchstart", handleTouchStart);
      node.removeEventListener("touchmove", handleTouchMove);
      node.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);
}
