/**
 * Detect whether the current device is mobile based on pointer and viewport.
 *
 * - Phone: coarse pointer + narrow viewport → true
 * - Tablet without keyboard: coarse pointer + no fine pointer → true
 * - iPad with Magic Keyboard: has fine pointer → false
 * - Narrow desktop window: fine pointer → false
 */
export function isMobileDevice(): boolean {
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const isNarrowViewport = window.matchMedia("(max-width: 768px)").matches;
  const hasNoFinePointer = !window.matchMedia("(any-pointer: fine)").matches;
  return isCoarsePointer && (isNarrowViewport || hasNoFinePointer);
}
