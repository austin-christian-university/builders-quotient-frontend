/**
 * The narrator's shape, as pure maths (§8.2). No DOM, no canvas, no React: the
 * component, the rehearsal page and the tests all compute from here.
 *
 * A hollow ring woven from six lines of white light that wind over and under one
 * another around the ring's tube, like the strands of a rope. Nothing fills the
 * middle. Six lines because that is the idea: many voices, one understanding.
 */

export const STRANDS = 6;
/** Times a line winds round the tube per turn of the ring. */
const WINDING = 3;
const RIPPLE_CRESTS = 11;
const VOICE_RIPPLE = 0.03;
const PERSPECTIVE = 3.4;
/** Outer edge at rest, as a fraction of size: where an outside line should stop. */
export const NARRATOR_RIM = 0.39;

export type NarratorState = "idle" | "listening" | "thinking" | "speaking" | "error";

/** All lengths are fractions of `size`; `flow`, `spin`, `drift` in rad/s. */
export interface NarratorParameters {
  radius: number;
  braid: number;
  /** 1 = six evenly round the tube, 0 = one line. */
  spread: number;
  flow: number;
  spin: number;
  /** Radians. 0 faces the viewer. */
  tilt: number;
  breath: number;
  /** Breaths per second. */
  breathRate: number;
  organic: number;
  drift: number;
  ripple: number;
  soundResponse: number;
  glow: number;
  desaturation: number;
}

export const STATE_PARAMETERS: Record<NarratorState, NarratorParameters> = {
  idle: {
    radius: 0.325,
    braid: 0.056,
    spread: 1,
    flow: 0.34,
    spin: 0.045,
    tilt: 0.3,
    breath: 0.022,
    breathRate: 0.13,
    organic: 0.03,
    drift: 0.08,
    ripple: 0.004,
    soundResponse: 0,
    glow: 0.4,
    desaturation: 0,
  },
  listening: {
    radius: 0.34,
    braid: 0.06,
    spread: 1,
    flow: 0.5,
    spin: 0.035,
    tilt: 0.2,
    breath: 0.028,
    breathRate: 0.2,
    organic: 0.034,
    drift: 0.12,
    ripple: 0.006,
    soundResponse: 0.6,
    glow: 0.55,
    desaturation: 0,
  },
  thinking: {
    radius: 0.305,
    braid: 0.048,
    spread: 1,
    // Motion that changes character, never a spinner: the lines pour round the tube.
    flow: 2.6,
    spin: 0.3,
    tilt: 0.34,
    breath: 0.014,
    breathRate: 0.3,
    organic: 0.028,
    drift: 0.35,
    ripple: 0.003,
    soundResponse: 0,
    glow: 0.46,
    desaturation: 0.08,
  },
  speaking: {
    radius: 0.33,
    braid: 0.06,
    spread: 1,
    flow: 0.8,
    spin: 0.07,
    tilt: 0.26,
    breath: 0.024,
    breathRate: 0.32,
    organic: 0.03,
    drift: 0.14,
    ripple: 0.006,
    soundResponse: 1,
    glow: 0.75,
    desaturation: 0,
  },
  error: {
    radius: 0.32,
    braid: 0.034,
    spread: 1,
    flow: 0.1,
    spin: 0.01,
    tilt: 0.32,
    breath: 0.01,
    breathRate: 0.08,
    organic: 0.02,
    drift: 0.02,
    ripple: 0.002,
    soundResponse: 0,
    glow: 0.14,
    desaturation: 0.75,
  },
};

export const STATE_SENTENCE: Record<NarratorState, string> = {
  idle: "Unify is waiting.",
  listening: "Unify is listening.",
  thinking: "Unify is thinking about what you said.",
  speaking: "Unify is speaking.",
  error: "The connection to Unify is interrupted.",
};

/**
 * The pose is integrated frame by frame, never `time × rate`, so easing between
 * rates changes speed without jumping position.
 */
export interface Pose {
  spin: number;
  flow: number;
  breath: number;
  drift: number;
  travel: number;
}

export function restingPose(): Pose {
  return { spin: 0, flow: 0.6, breath: 0, drift: 0, travel: 0 };
}

export function advancePose(pose: Pose, p: NarratorParameters, dt: number, push = 0): Pose {
  pose.spin += p.spin * dt;
  pose.flow += (p.flow + push) * dt;
  pose.breath += p.breathRate * 2 * Math.PI * dt;
  pose.drift += p.drift * dt;
  pose.travel += (1.6 + p.flow * 0.5 + push) * dt;
  return pose;
}

/** Same inputs, same pose: what makes film frames and tests repeatable. */
export function poseAt(seconds: number, p: NarratorParameters): Pose {
  return advancePose(restingPose(), p, seconds);
}

export interface NarratorPoint {
  x: number;
  y: number;
  /** −1 back … 1 front. What lets the lines pass over and under each other. */
  depth: number;
}

interface Harmonic {
  f: number;
  a: number;
  ph: number;
}

/** The ring is never quite a circle. */
const ORGANIC: readonly Harmonic[] = [
  { f: 1, a: 0.5, ph: 1.1 },
  { f: 2, a: 1.0, ph: 0.6 },
  { f: 3, a: 0.55, ph: 2.3 },
];

/** The rope is never uniform. */
const THICKNESS: readonly Harmonic[] = [
  { f: 2, a: 1.0, ph: 0.3 },
  { f: 3, a: 0.6, ph: 1.9 },
];

function mean(harmonics: readonly Harmonic[], theta: number, phase: number): number {
  let total = 0;
  for (const h of harmonics) total += h.a * Math.sin(h.f * theta + h.ph + phase);
  return total / harmonics.length;
}

export function clamp(value: number, low: number, high: number): number {
  return value < low ? low : value > high ? high : value;
}

export function pointCount(size: number, reducedMotion = false): number {
  if (reducedMotion) return 240;
  if (size < 90) return 120;
  return size < 200 ? 200 : 280;
}

export interface StrandOptions {
  size: number;
  strand: number;
  points: number;
  /** This line's share of the voice, 0–1. */
  voice?: number;
  /** A whole-ring swell, as a fraction of size. */
  pulse?: number;
}

export function strandPoints(
  p: NarratorParameters,
  pose: Pose,
  { size, strand, points, voice = 0, pulse = 0 }: StrandOptions,
): NarratorPoint[] {
  const out: NarratorPoint[] = new Array(points);
  const tilt = p.tilt;
  const sinTilt = Math.sin(tilt);
  const cosTilt = Math.cos(tilt);
  const depthScale = size * (p.braid + p.radius * Math.abs(sinTilt) * 0.3);

  for (let i = 0; i < points; i += 1) {
    const theta = (i / points) * 2 * Math.PI;
    const bend = mean(ORGANIC, theta, pose.drift);
    const thickness = mean(THICKNESS, theta, -0.7 * pose.drift);

    const ring =
      size * p.radius * (1 + Math.sin(pose.breath) * p.breath) * (1 + bend * p.organic) + size * pulse;
    const tube = size * p.braid * (1 + 0.22 * thickness);

    const wind = WINDING * theta + pose.flow + p.spread * ((2 * Math.PI) / STRANDS) * strand;
    const wave = Math.sin(RIPPLE_CRESTS * theta + pose.travel * (1 + 0.13 * strand) + 1.7 * strand);

    const across = tube * Math.cos(wind) + size * (p.ripple + voice * VOICE_RIPPLE) * wave;
    const near = tube * Math.sin(wind);

    const a = theta + pose.spin;
    const x = (ring + across) * Math.cos(a);
    const y = (ring + across) * Math.sin(a);

    const leanedY = y * cosTilt - near * sinTilt;
    const leanedZ = y * sinTilt + near * cosTilt;
    const s = 1 + leanedZ / (size * PERSPECTIVE);

    out[i] = {
      x: x * s,
      y: leanedY * s,
      depth: depthScale === 0 ? 0 : clamp((y * sinTilt * 0.3 + near * cosTilt) / depthScale, -1, 1),
    };
  }
  return out;
}

export function allStrands(
  p: NarratorParameters,
  pose: Pose,
  options: { size: number; points: number; voices?: readonly number[]; pulse?: number },
): NarratorPoint[][] {
  const lines: NarratorPoint[][] = [];
  for (let strand = 0; strand < STRANDS; strand += 1) {
    lines.push(
      strandPoints(p, pose, {
        size: options.size,
        strand,
        points: options.points,
        voice: options.voices?.[strand] ?? 0,
        pulse: options.pulse ?? 0,
      }),
    );
  }
  return lines;
}

// ── Sound ───────────────────────────────────────────────────────────────────

/** Asymmetric: quick to rise with the voice, slower to let go. */
export function smooth(prev: number, target: number, attack = 0.35, release = 0.12): number {
  const rate = target > prev ? attack : release;
  return prev + (target - prev) * rate;
}

/**
 * Six bands from the lowest 55% of the FFT, spaced so low frequencies get their
 * own line: line 0 carries the bottom of the voice.
 */
export function bandsFromSpectrum(spectrum: ArrayLike<number>, bands = STRANDS): number[] {
  const usable = Math.max(1, Math.floor(spectrum.length * 0.55));
  const out: number[] = [];
  for (let i = 0; i < bands; i += 1) {
    const from = Math.floor(usable * Math.pow(i / bands, 1.7));
    const to = Math.max(from + 1, Math.floor(usable * Math.pow((i + 1) / bands, 1.7)));
    let total = 0;
    for (let bin = from; bin < to && bin < spectrum.length; bin += 1) total += spectrum[bin] ?? 0;
    out.push(total / (to - from) / 255);
  }
  return out;
}

export interface OnsetInput {
  level: number;
  average: number;
  previous: number;
  dt: number;
}

/** A pulse per syllable: the rise above the running average, decaying quickly. */
export function onsetPulse({ level, average, previous, dt }: OnsetInput): number {
  const decayed = previous * Math.exp(-dt / 0.16);
  const rise = level - average;
  if (rise > 0.1 && level > 0.12) return Math.max(decayed, Math.min(1, 3 * rise));
  return decayed;
}

export function loudness(timeDomain: ArrayLike<number>, gain = 1): number {
  let peak = 0;
  for (let i = 0; i < timeDomain.length; i += 1) {
    const value = Math.abs((timeDomain[i] ?? 128) - 128) / 128;
    if (value > peak) peak = value;
  }
  return Math.min(1, Math.sqrt(peak) * gain);
}

// ── Colour ──────────────────────────────────────────────────────────────────

/**
 * The brand kit has one light and it is white (its interview card draws the voice as a
 * white line): the far side of the weave is Smoke, the middle a soft white, the nearest
 * Paper. Literals, because a canvas has no cascade.
 */
const RIM_COLOR = "#e9e8e6";
const DEEP_COLOR = "#6f6e6e";
const GREY: readonly [number, number, number] = [135, 134, 134];

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mixRgb(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

const BACK = hexToRgb(DEEP_COLOR);
const MIDDLE = hexToRgb(RIM_COLOR);
const FRONT = hexToRgb("#ffffff");

export interface Tone {
  r: number;
  g: number;
  b: number;
  alpha: number;
}

/** Nearer segments are paler and brighter: that is what reads as woven. */
export function depthTone(depth: number, desaturation = 0): Tone {
  const t = (clamp(depth, -1, 1) + 1) / 2;
  const base = t < 0.5 ? mixRgb(BACK, MIDDLE, t * 2) : mixRgb(MIDDLE, FRONT, (t - 0.5) * 2);
  const [r, g, b] = desaturation > 0 ? mixRgb(base, GREY, desaturation) : base;
  return { r, g, b, alpha: 0.22 + 0.76 * Math.pow(t, 1.3) };
}

export function toneToCss({ r, g, b }: Tone, alpha: number): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha.toFixed(3)})`;
}

export function mixTowardGrey(hex: string, desaturation: number): [number, number, number] {
  return mixRgb(hexToRgb(hex), GREY, clamp(desaturation, 0, 1));
}

/** Per-frame smoothing constants are written for 60 Hz; scale them by dt × 60. */
export function frameRate(dt: number, perFrame: number): number {
  return 1 - Math.pow(1 - perFrame, Math.max(0.0001, dt * 60));
}

// ── The ink line (§7.8) ─────────────────────────────────────────────────────

/**
 * On a pale ground the narrator is drawn as a fine ink line rather than as light: white
 * light over white is not there at all. These are the kit's greys and Onyx as literals,
 * for the same reason the light's constants above are literals — a canvas has no
 * cascade. (The kit's landscape colours are photography and the grade, never a fill on
 * the interface, so the line is not drawn in them.) The interview draws the light: it
 * stands on the photograph.
 *
 * Nearer is *darker* here, the opposite of light on dark: that is what reads as
 * a pen bearing down rather than as something glowing.
 */
const INK_BACK = hexToRgb("#b9b7b6");
const INK_MIDDLE = hexToRgb("#878686");
const INK_FRONT = hexToRgb("#0f0d0d");

export function inkTone(depth: number, desaturation = 0): Tone {
  const t = (clamp(depth, -1, 1) + 1) / 2;
  const base = t < 0.5 ? mixRgb(INK_BACK, INK_MIDDLE, t * 2) : mixRgb(INK_MIDDLE, INK_FRONT, (t - 0.5) * 2);
  const [r, g, b] = desaturation > 0 ? mixRgb(base, GREY, desaturation) : base;
  return { r, g, b, alpha: 0.26 + 0.62 * Math.pow(t, 1.2) };
}

/** Crossing from the dark into the light: light becomes line, over the fold. */
export function mixTone(a: Tone, b: Tone, t: number): Tone {
  const k = clamp(t, 0, 1);
  return {
    r: lerp(a.r, b.r, k),
    g: lerp(a.g, b.g, k),
    b: lerp(a.b, b.b, k),
    alpha: lerp(a.alpha, b.alpha, k),
  };
}
