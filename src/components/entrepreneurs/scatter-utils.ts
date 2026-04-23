/** Find the nearest point index within a pixel threshold. Returns null when no dot is within range. */
export function findNearestDot(
  mouseX: number,
  mouseY: number,
  dotPositions: { x: number; y: number }[],
  threshold: number
): number | null {
  let bestIdx: number | null = null;
  let bestDist = Infinity;
  for (let i = 0; i < dotPositions.length; i++) {
    const dx = mouseX - dotPositions[i].x;
    const dy = mouseY - dotPositions[i].y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bestDist && dist <= threshold) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}
