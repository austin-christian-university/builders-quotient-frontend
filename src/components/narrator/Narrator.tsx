"use client";

import { useEffect, useRef, type RefObject } from "react";
import { tapElement, type AnalyserTap } from "./audio-graph";
import {
  STATE_PARAMETERS,
  STATE_SENTENCE,
  STRANDS,
  advancePose,
  bandsFromSpectrum,
  frameRate,
  inkTone,
  onsetPulse,
  pointCount,
  restingPose,
  smooth,
  strandPoints,
  toneToCss,
  type NarratorParameters,
  type NarratorPoint,
  type NarratorState,
} from "./narrator-geometry";

/**
 * Unify's narrator (unify-app `web/src/components/narrator/Narrator.tsx`), ported in
 * its ink form: six strands woven round a hollow ring, drawn as a fine pen line on
 * paper rather than as light. The voice moves the strands. Unify's homepage figures,
 * scripted gestures and microphone listening are left out — BQ's narrator only speaks.
 */

const DEPTH_LAYERS = 8;

export interface NarratorProps {
  state: NarratorState;
  size?: number;
  /** The narration's `<audio>` element, read when the ring starts or the state changes. */
  audioRef?: RefObject<HTMLAudioElement | null>;
  label?: string;
  className?: string;
}

export function Narrator({ state, size = 220, audioRef, label, className }: NarratorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<NarratorState>(state);
  const retapRef = useRef<(() => void) | null>(null);

  // The loop eases toward the state every frame, so the state lives in a ref:
  // re-running the effect would restart the canvas and jump the pose.
  useEffect(() => {
    stateRef.current = state;
    retapRef.current?.();
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvasSize = size * 1.5;
    canvas.width = Math.round(canvasSize * dpr);
    canvas.height = Math.round(canvasSize * dpr);
    const points = pointCount(size, reduced);
    const w = Math.max(0.5, size / 300);

    const current: NarratorParameters = { ...STATE_PARAMETERS[stateRef.current] };
    const pose = restingPose();
    const voices = new Array<number>(STRANDS).fill(0);
    let level = 0;
    let average = 0;
    let pulse = 0;

    const draw = () => {
      const p = current;
      const drawn: NarratorParameters = { ...p, braid: p.braid * (1 + 0.55 * level) };
      const half = canvasSize / 2;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, canvasSize, canvasSize);
      context.save();
      context.translate(half, half);
      context.lineCap = "round";
      context.lineJoin = "round";

      const lines: NarratorPoint[][] = [];
      for (let strand = 0; strand < STRANDS; strand += 1) {
        lines.push(
          strandPoints(drawn, pose, {
            size,
            strand,
            points,
            voice: voices[strand] ?? 0,
            pulse: 0.014 * pulse * drawn.soundResponse,
          }),
        );
      }

      // The weave — eight depth layers drawn back to front; nearer is darker.
      const layers: [NarratorPoint, NarratorPoint][][] = Array.from({ length: DEPTH_LAYERS }, () => []);
      for (const line of lines) {
        for (let i = 0; i < line.length; i += 1) {
          const a = line[i]!;
          const b = line[(i + 1) % line.length]!;
          const mean = (a.depth + b.depth) / 2;
          const index = Math.min(DEPTH_LAYERS - 1, Math.max(0, Math.round(((mean + 1) / 2) * (DEPTH_LAYERS - 1))));
          layers[index]!.push([a, b]);
        }
      }
      for (let layer = 0; layer < DEPTH_LAYERS; layer += 1) {
        const segments = layers[layer]!;
        if (segments.length === 0) continue;
        const t = layer / (DEPTH_LAYERS - 1);
        const tone = inkTone(t * 2 - 1, drawn.desaturation);
        context.lineWidth = w * (0.8 + 2.1 * t * t);
        context.strokeStyle = toneToCss(tone, Math.min(1, tone.alpha * 1.02));
        context.beginPath();
        for (const [a, b] of segments) {
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
        }
        context.stroke();
      }
      context.restore();
    };

    if (reduced) {
      draw();
      return;
    }
    draw();

    let tap: AnalyserTap | null = null;
    let frequency: Uint8Array<ArrayBuffer> | null = null;
    const release = () => {
      tap?.release();
      tap = null;
      frequency = null;
    };
    const attach = () => {
      release();
      const audio = audioRef?.current;
      if (!audio) return;
      tap = tapElement(audio, 512);
      if (tap) frequency = new Uint8Array(new ArrayBuffer(tap.analyser.frequencyBinCount));
    };

    let raf = 0;
    let last = 0;
    let running = false;

    const frame = (now: number) => {
      const dt = last === 0 ? 0.016 : Math.min(0.1, (now - last) / 1000);
      last = now;

      const target = STATE_PARAMETERS[stateRef.current];
      const rate = frameRate(dt, 0.06);
      for (const key of Object.keys(current) as (keyof NarratorParameters)[]) {
        current[key] += (target[key] - current[key]) * rate;
      }

      if (current.soundResponse >= 0.02 && tap && frequency) {
        tap.analyser.getByteFrequencyData(frequency);
        const bands = bandsFromSpectrum(frequency, STRANDS);
        const mean = bands.reduce((total, band) => total + band, 0) / STRANDS;
        const heard = Math.min(1, mean * 2.4);
        for (let i = 0; i < STRANDS; i += 1) {
          voices[i] = smooth(voices[i] ?? 0, (bands[i] ?? 0) * current.soundResponse);
        }
        const next = smooth(level, heard * Math.min(1, current.soundResponse + 0.2));
        average += (next - average) * Math.min(1, 3 * dt);
        pulse = onsetPulse({ level: next, average, previous: pulse, dt });
        level = next;
      } else {
        level = smooth(level, 0);
        pulse = onsetPulse({ level: 0, average, previous: pulse, dt });
        for (let i = 0; i < STRANDS; i += 1) voices[i] = smooth(voices[i] ?? 0, 0);
      }

      advancePose(pose, current, dt, 1.1 * level * current.soundResponse);
      draw();
      raf = window.requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = 0;
      attach();
      raf = window.requestAnimationFrame(frame);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      window.cancelAnimationFrame(raf);
      release();
    };

    let onScreen = true;
    const observer = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting);
        if (onScreen && !document.hidden) start();
        else stop();
      },
      { threshold: 0 },
    );
    observer.observe(canvas);
    const onVisibility = () => (!document.hidden && onScreen ? start() : stop());
    document.addEventListener("visibilitychange", onVisibility);
    // The audio element can appear or change source after the ring starts.
    retapRef.current = () => {
      if (running) attach();
    };

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      retapRef.current = null;
      stop();
    };
  }, [size, audioRef]);

  return (
    <div className={className} style={{ width: size * 1.5, height: size * 1.5 }}>
      <canvas ref={canvasRef} aria-hidden className="block" style={{ width: size * 1.5, height: size * 1.5 }} />
      <span className="sr-only" role="status" aria-live="polite">
        {label ?? STATE_SENTENCE[state]}
      </span>
    </div>
  );
}
