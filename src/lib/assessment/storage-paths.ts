/**
 * Storage paths for student recordings.
 *
 * Derived, never client-supplied. /api/upload signs an object at this path and
 * confirmUpload records it, so both must compute it the same way — if a caller
 * could hand either side an arbitrary string, a response could be pointed at
 * another student's recording.
 */

export function responseStoragePath(params: {
  sessionId: string;
  vignetteType: "practical" | "creative";
  step: number;
  responsePhase: number;
}): string {
  const { sessionId, vignetteType, step, responsePhase } = params;
  return `${sessionId}/${vignetteType}_${step}_phase${responsePhase}.webm`;
}

export function warmupStoragePath(sessionId: string, warmupIndex: number): string {
  return `${sessionId}/warmup_${warmupIndex}.webm`;
}
