import { describe, expect, it } from "vitest";
import {
  NARRATOR_RIM,
  STATE_PARAMETERS,
  STRANDS,
  advancePose,
  allStrands,
  bandsFromSpectrum,
  depthTone,
  loudness,
  onsetPulse,
  pointCount,
  poseAt,
  restingPose,
  strandPoints,
} from "./narrator-geometry";

const SIZE = 300;
const POINTS = 200;

function restingLines(state: keyof typeof STATE_PARAMETERS = "idle") {
  const p = STATE_PARAMETERS[state];
  return allStrands(p, restingPose(), { size: SIZE, points: POINTS });
}

describe("narrator geometry", () => {
  it("draws six lines", () => {
    expect(restingLines()).toHaveLength(STRANDS);
    expect(STRANDS).toBe(6);
  });

  it("closes every loop", () => {
    const p = STATE_PARAMETERS.speaking;
    const pose = poseAt(3.2, p);
    for (let strand = 0; strand < STRANDS; strand += 1) {
      const atZero = strandPoints(p, pose, { size: SIZE, strand, points: 1 })[0];
      // θ = 2π is the same place as θ = 0 for every term in the formula.
      const wrapped = strandPoints(p, pose, { size: SIZE, strand, points: POINTS })[0];
      expect(atZero).toBeDefined();
      expect(wrapped?.x).toBeCloseTo(atZero?.x ?? NaN, 9);
      expect(wrapped?.y).toBeCloseTo(atZero?.y ?? NaN, 9);
    }
  });

  it("keeps the middle hollow", () => {
    for (const state of ["idle", "listening", "thinking", "speaking", "error"] as const) {
      for (const line of restingLines(state)) {
        for (const point of line) {
          const distance = Math.hypot(point.x, point.y);
          expect(distance, `${state} has a point at ${distance.toFixed(1)}`).toBeGreaterThan(0.2 * SIZE);
        }
      }
    }
  });

  it("collapses all six onto one path when spread is 0", () => {
    // Spread is what holds the six lines apart around the tube. At 0 the braid
    // paths coincide exactly; the surface ripple is a separate, much smaller
    // modulation that still carries a per-line phase.
    const p = { ...STATE_PARAMETERS.idle, spread: 0, ripple: 0 };
    const lines = allStrands(p, restingPose(), { size: SIZE, points: 64 });
    const first = lines[0];
    expect(first).toBeDefined();
    for (const line of lines.slice(1)) {
      for (let i = 0; i < line.length; i += 1) {
        expect(line[i]?.x).toBeCloseTo(first?.[i]?.x ?? NaN, 9);
        expect(line[i]?.y).toBeCloseTo(first?.[i]?.y ?? NaN, 9);
      }
    }
  });

  it("reads as one line when spread is 0 even with the ripple running", () => {
    const p = { ...STATE_PARAMETERS.idle, spread: 0 };
    const lines = allStrands(p, poseAt(4.1, p), { size: SIZE, points: 64 });
    const first = lines[0];
    let furthest = 0;
    for (const line of lines.slice(1)) {
      for (let i = 0; i < line.length; i += 1) {
        furthest = Math.max(
          furthest,
          Math.hypot((line[i]?.x ?? 0) - (first?.[i]?.x ?? 0), (line[i]?.y ?? 0) - (first?.[i]?.y ?? 0)),
        );
      }
    }
    expect(furthest / SIZE).toBeLessThan(0.015);
  });

  it("keeps depth inside [-1, 1]", () => {
    for (const state of ["idle", "listening", "thinking", "speaking", "error"] as const) {
      const p = STATE_PARAMETERS[state];
      const lines = allStrands(p, poseAt(7.7, p), { size: SIZE, points: 128, voices: [1, 1, 1, 1, 1, 1] });
      for (const line of lines) {
        for (const point of line) {
          expect(point.depth).toBeGreaterThanOrEqual(-1);
          expect(point.depth).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("is deterministic: poseAt is the resting pose advanced once", () => {
    const p = STATE_PARAMETERS.thinking;
    const a = poseAt(2.5, p);
    const b = poseAt(2.5, p);
    expect(a).toEqual(b);
    expect(a).toEqual(advancePose(restingPose(), p, 2.5));
    expect(restingPose()).toEqual({ spin: 0, flow: 0.6, breath: 0, drift: 0, travel: 0 });
  });

  it("puts the rim at about 0.39 of size", () => {
    expect(NARRATOR_RIM).toBeCloseTo(0.39, 5);
    const p = STATE_PARAMETERS.idle;
    let furthest = 0;
    for (const line of allStrands(p, restingPose(), { size: SIZE, points: 360 })) {
      for (const point of line) furthest = Math.max(furthest, Math.hypot(point.x, point.y));
    }
    expect(furthest / SIZE).toBeGreaterThan(0.33);
    expect(furthest / SIZE).toBeLessThan(0.45);
  });

  it("chooses a point count by size and reduced motion", () => {
    expect(pointCount(80)).toBe(120);
    expect(pointCount(150)).toBe(200);
    expect(pointCount(330)).toBe(280);
    expect(pointCount(330, true)).toBe(240);
  });

  it("pulses on an onset and decays otherwise", () => {
    const quiet = onsetPulse({ level: 0.05, average: 0.05, previous: 1, dt: 0.16 });
    expect(quiet).toBeCloseTo(Math.exp(-1), 3);
    const onset = onsetPulse({ level: 0.5, average: 0.2, previous: 0, dt: 0.016 });
    expect(onset).toBeCloseTo(0.9, 5);
    const belowFloor = onsetPulse({ level: 0.11, average: 0, previous: 0, dt: 0.016 });
    expect(belowFloor).toBe(0);
  });

  it("folds a spectrum into six bands, low frequencies first", () => {
    const spectrum = new Uint8Array(256);
    for (let i = 0; i < 20; i += 1) spectrum[i] = 255;
    const bands = bandsFromSpectrum(spectrum);
    expect(bands).toHaveLength(6);
    expect(bands[0]).toBeGreaterThan(0.5);
    expect(bands[5]).toBeLessThan(0.2);
    // Only the lowest 55% of bins are read at all.
    const high = new Uint8Array(256);
    for (let i = 200; i < 256; i += 1) high[i] = 255;
    expect(bandsFromSpectrum(high).every((band) => band === 0)).toBe(true);
  });

  it("reads loudness as a gained peak", () => {
    const silence = new Uint8Array(64).fill(128);
    expect(loudness(silence)).toBe(0);
    const loud = new Uint8Array(64).fill(255);
    expect(loudness(loud)).toBeCloseTo(1, 2);
  });

  it("makes nearer segments paler and more opaque", () => {
    const back = depthTone(-1);
    const front = depthTone(1);
    expect(front.alpha).toBeGreaterThan(back.alpha);
    expect(front.r + front.g + front.b).toBeGreaterThan(back.r + back.g + back.b);
    const greyed = depthTone(1, 1);
    expect(Math.abs(greyed.r - greyed.g)).toBeLessThan(20);
  });
});
