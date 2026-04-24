export const BEE_SWARM_WIDTH = 860;
export const BEE_SWARM_HEIGHT = 360;
export const BEE_SWARM_MARGIN = { top: 32, right: 78, bottom: 44, left: 120 };
export const X_MIN = BEE_SWARM_MARGIN.left;
export const X_MAX = BEE_SWARM_WIDTH - BEE_SWARM_MARGIN.right;
export const X_RANGE = X_MAX - X_MIN;
export const JITTER_RANGE = 14;

export const MOBILE_STRIP_VIEWBOX_W = 320;
export const MOBILE_STRIP_VIEWBOX_H = 64;
export const MOBILE_STRIP_PAD_X = 6;

/** Map a 0–1 value to the desktop x-coordinate. Clamps out-of-range values. */
export function valueToX(value: number): number {
  return X_MIN + Math.max(0, Math.min(1, value)) * X_RANGE;
}

/** Map a 0–1 value to the mobile strip x-coordinate. Clamps out-of-range values. */
export function mobileValueToX(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return MOBILE_STRIP_PAD_X + clamped * (MOBILE_STRIP_VIEWBOX_W - MOBILE_STRIP_PAD_X * 2);
}

/** Deterministic pseudo-random jitter in [-range, range], stable across renders. */
export function deterministicJitter(
  index: number,
  value: number,
  range: number = JITTER_RANGE
): number {
  const seed = Math.sin(index * 78.233 + value * 437.1) * 43758.5453;
  const raw = ((seed - Math.floor(seed)) * 2 - 1) * range;
  return Math.round(raw * 1000) / 1000;
}

/** Format a 0–1 range as a percentage en-dash string (e.g. "15–72%"). */
export function formatRange(min: number, max: number): string {
  return `${Math.round(min * 100)}\u2013${Math.round(max * 100)}%`;
}
