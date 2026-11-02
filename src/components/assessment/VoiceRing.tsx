"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * The narrator's voice ring, ported from Unify's interview ring (AiVoiceRing): one
 * fine ink outline whose radius is pushed by the mirrored spectrum of the narration.
 * A presence beside the words, not a light show — no WebGL, no glow.
 */

const BANDS = 6;

type RingParameters = {
  radius: number;
  /** How far a band may push the outline, as a fraction of size. */
  response: number;
  /** Breaths per second. */
  breathRate: number;
  breath: number;
  spin: number;
  weight: number;
};

const IDLE: RingParameters = { radius: 0.33, response: 0, breathRate: 0.14, breath: 0.02, spin: 0.03, weight: 0.35 };
const SPEAKING: RingParameters = { radius: 0.34, response: 1, breathRate: 0.3, breath: 0.022, spin: 0.05, weight: 0.7 };

/**
 * One cached source per element: a second `createMediaElementSource` on the same
 * element throws. The source feeds the speakers once and an analyser per ring.
 */
const sources = new WeakMap<HTMLAudioElement, { ctx: AudioContext; source: MediaElementAudioSourceNode }>();

function tapElement(audio: HTMLAudioElement): { analyser: AnalyserNode; release: () => void } | null {
  try {
    let entry = sources.get(audio);
    if (!entry) {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audio);
      source.connect(ctx.destination);
      entry = { ctx, source };
      sources.set(audio, entry);
    }
    void entry.ctx.resume().catch(() => undefined);
    const analyser = entry.ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.72;
    entry.source.connect(analyser);
    const { source } = entry;
    return {
      analyser,
      release: () => {
        try {
          source.disconnect(analyser);
        } catch {
          // Already torn down.
        }
      },
    };
  } catch {
    // Web Audio unavailable — the ring still breathes, it just does not follow the voice.
    return null;
  }
}

/** Six bands from the lowest 55% of the FFT, spaced so the bottom of the voice gets its own. */
function bandsFromSpectrum(spectrum: Uint8Array): number[] {
  const usable = Math.max(1, Math.floor(spectrum.length * 0.55));
  const out: number[] = [];
  for (let i = 0; i < BANDS; i += 1) {
    const from = Math.floor(usable * Math.pow(i / BANDS, 1.7));
    const to = Math.max(from + 1, Math.floor(usable * Math.pow((i + 1) / BANDS, 1.7)));
    let total = 0;
    for (let bin = from; bin < to && bin < spectrum.length; bin += 1) total += spectrum[bin] ?? 0;
    out.push(total / (to - from) / 255);
  }
  return out;
}

function bandAt(bands: readonly number[], position: number): number {
  const scaled = Math.min(Math.max(position, 0), 0.9999) * bands.length;
  const index = Math.floor(scaled);
  const next = Math.min(bands.length - 1, index + 1);
  const t = scaled - index;
  return (bands[index] ?? 0) * (1 - t) + (bands[next] ?? 0) * t;
}

type VoiceRingProps = {
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  prefersReducedMotion?: boolean;
  size?: number;
};

export function VoiceRing({ audioRef, isPlaying, prefersReducedMotion = false, size = 180 }: VoiceRingProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playingRef = useRef(isPlaying);

  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const box = size * 1.4;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(box * dpr);
    canvas.height = Math.round(box * dpr);

    const points = prefersReducedMotion ? 180 : size < 110 ? 120 : 180;
    const bands = new Array<number>(BANDS).fill(0);
    const current = { ...(playingRef.current ? SPEAKING : IDLE) };
    const ink = (alpha: number) => `rgba(17, 17, 17, ${alpha.toFixed(3)})`;

    const draw = (time: number) => {
      const p = current;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, box, box);
      context.save();
      context.translate(box / 2, box / 2);

      const base = size * p.radius * (1 + Math.sin(time * p.breathRate * 2 * Math.PI) * p.breath);
      context.beginPath();
      for (let i = 0; i < points; i += 1) {
        const theta = (i / points) * 2 * Math.PI + time * p.spin;
        // Mirrored across the vertical axis, so the shape is never lopsided.
        const band = bandAt(bands, Math.abs(Math.sin(theta)));
        const radius = base * (1 + band * p.response * 0.16);
        const angle = (i / points) * 2 * Math.PI;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      context.lineJoin = "round";
      context.lineWidth = Math.max(3, size / 22);
      context.strokeStyle = ink(0.08 * p.weight);
      context.stroke();
      context.lineWidth = Math.max(1.25, size / 90);
      context.strokeStyle = ink(0.5 + 0.45 * p.weight);
      context.stroke();
      context.restore();
    };

    if (prefersReducedMotion) {
      draw(0);
      return;
    }

    let tap: ReturnType<typeof tapElement> = null;
    let spectrum: Uint8Array<ArrayBuffer> | null = null;
    let raf = 0;
    let last = 0;
    let elapsed = 0;

    const frame = (now: number) => {
      const dt = last === 0 ? 0.016 : Math.min(0.1, (now - last) / 1000);
      last = now;
      elapsed += dt;

      const playing = playingRef.current;
      if (playing && !tap && audioRef.current) {
        tap = tapElement(audioRef.current);
        if (tap) spectrum = new Uint8Array(new ArrayBuffer(tap.analyser.frequencyBinCount));
      }

      const target = playing ? SPEAKING : IDLE;
      const rate = 1 - Math.pow(1 - 0.07, Math.max(0.0001, dt * 60));
      for (const key of Object.keys(current) as (keyof RingParameters)[]) {
        current[key] += (target[key] - current[key]) * rate;
      }

      const heard = playing && tap && spectrum ? (tap.analyser.getByteFrequencyData(spectrum), bandsFromSpectrum(spectrum)) : null;
      for (let i = 0; i < BANDS; i += 1) {
        const goal = heard?.[i] ?? 0;
        bands[i] += (goal - bands[i]) * (goal > bands[i] ? 0.35 : 0.12);
      }

      draw(elapsed);
      raf = window.requestAnimationFrame(frame);
    };

    raf = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(raf);
      tap?.release();
    };
  }, [size, prefersReducedMotion, audioRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="block"
      style={{ width: size * 1.4, height: size * 1.4 }}
    />
  );
}
