"use client";

import { Mesh, Program, Renderer, Triangle, Vec3 } from "ogl";
import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Reuse existing Web Audio connections — createMediaElementSource
 * can only be called once per audio element.
 */
const audioAnalysers = new WeakMap<HTMLAudioElement, AnalyserNode>();

type AudioOrbProps = {
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  prefersReducedMotion?: boolean;
};

const VERT = /* glsl */ `
  precision highp float;
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform float iTime;
  uniform vec3 iResolution;
  uniform float hover;
  uniform float rot;
  uniform float hoverIntensity;
  uniform vec3 backgroundColor;
  varying vec2 vUv;

  vec3 hash33(vec3 p3) {
    p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
    p3 += dot(p3, p3.yxz + 19.19);
    return -1.0 + 2.0 * fract(vec3(
      p3.x + p3.y, p3.x + p3.z, p3.y + p3.z
    ) * p3.zyx);
  }

  float snoise3(vec3 p) {
    const float K1 = 0.333333333;
    const float K2 = 0.166666667;
    vec3 i = floor(p + (p.x + p.y + p.z) * K1);
    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
    vec3 e = step(vec3(0.0), d0 - d0.yzx);
    vec3 i1 = e * (1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy * (1.0 - e);
    vec3 d1 = d0 - (i1 - K2);
    vec3 d2 = d0 - (i2 - K1);
    vec3 d3 = d0 - 0.5;
    vec4 h = max(0.6 - vec4(
      dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)
    ), 0.0);
    vec4 n = h * h * h * h * vec4(
      dot(d0, hash33(i)),
      dot(d1, hash33(i + i1)),
      dot(d2, hash33(i + i2)),
      dot(d3, hash33(i + 1.0))
    );
    return dot(vec4(31.316), n);
  }

  vec4 extractAlpha(vec3 colorIn) {
    float a = max(max(colorIn.r, colorIn.g), colorIn.b);
    return vec4(colorIn.rgb / (a + 1e-5), a);
  }

  // Brand palette
  const vec3 baseColor1 = vec3(0.302, 0.639, 1.0);    // Electric blue #4da3ff
  const vec3 baseColor2 = vec3(0.42, 0.82, 0.98);      // Light cyan
  const vec3 baseColor3 = vec3(0.122, 0.188, 0.243);   // Navy #1F303E

  const float innerRadius = 0.6;
  const float noiseScale = 0.65;

  float light1(float intensity, float attenuation, float dist) {
    return intensity / (1.0 + dist * attenuation);
  }
  float light2(float intensity, float attenuation, float dist) {
    return intensity / (1.0 + dist * dist * attenuation);
  }

  vec4 draw(vec2 uv) {
    float ang = atan(uv.y, uv.x);
    float len = length(uv);
    float invLen = len > 0.0 ? 1.0 / len : 0.0;
    float bgLuminance = dot(backgroundColor, vec3(0.299, 0.587, 0.114));

    float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
    float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
    float d0 = distance(uv, (r0 * invLen) * uv);
    float v0 = light1(1.0, 10.0, d0);

    v0 *= smoothstep(r0 * 1.05, r0, len);
    float innerFade = smoothstep(r0 * 0.8, r0 * 0.95, len);
    v0 *= mix(innerFade, 1.0, bgLuminance * 0.7);
    float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;

    float a = iTime * -1.0;
    vec2 pos = vec2(cos(a), sin(a)) * r0;
    float d = distance(uv, pos);
    float v1 = light2(1.5, 5.0, d);
    v1 *= light1(1.0, 50.0, d0);

    float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
    float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);

    vec3 colBase = mix(baseColor1, baseColor2, cl);
    float fadeAmount = mix(1.0, 0.1, bgLuminance);

    vec3 darkCol = mix(baseColor3, colBase, v0);
    darkCol = (darkCol + v1) * v2 * v3;
    darkCol = clamp(darkCol, 0.0, 1.0);

    vec3 lightCol = (colBase + v1) * mix(1.0, v2 * v3, fadeAmount);
    lightCol = mix(backgroundColor, lightCol, v0);
    lightCol = clamp(lightCol, 0.0, 1.0);

    vec3 finalCol = mix(darkCol, lightCol, bgLuminance);
    return extractAlpha(finalCol);
  }

  void main() {
    vec2 center = iResolution.xy * 0.5;
    float size = min(iResolution.x, iResolution.y);
    vec2 uv = (vUv * iResolution.xy - center) / size * 2.0;

    float angle = rot;
    float s = sin(angle);
    float c = cos(angle);
    uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);

    uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
    uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);

    vec4 col = draw(uv);
    gl_FragColor = vec4(col.rgb * col.a, col.a);
  }
`;

export function AudioOrb({
  audioRef,
  isPlaying,
  prefersReducedMotion = false,
}: AudioOrbProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Connect audio element to Web Audio API for frequency analysis
  useEffect(() => {
    if (!isPlaying) return;
    const audio = audioRef.current;
    if (!audio) return;

    // Reuse existing analyser if already connected
    const existing = audioAnalysers.get(audio);
    if (existing) {
      analyserRef.current = existing;
      dataArrayRef.current = new Uint8Array(existing.frequencyBinCount);
      return;
    }

    try {
      const ctx = new AudioContext();
      ctx.resume();

      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      source.connect(analyser);
      analyser.connect(ctx.destination);

      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      audioAnalysers.set(audio, analyser);
    } catch {
      // Web Audio unavailable — orb animates without audio reactivity
    }
  }, [isPlaying, audioRef]);

  // WebGL render loop
  useEffect(() => {
    if (prefersReducedMotion) return;

    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({ alpha: true, premultipliedAlpha: false });
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronizing with WebGL availability
      setWebglFailed(true);
      return;
    }

    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);

    // Prevent white flash: ensure canvas is transparent before it enters the DOM
    gl.canvas.style.background = "transparent";

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Vec3(gl.canvas.width, gl.canvas.height, 1),
        },
        hover: { value: 0 },
        rot: { value: 0 },
        hoverIntensity: { value: 1.0 },
        backgroundColor: { value: new Vec3(0.039, 0.039, 0.047) }, // #0a0a0c
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      if (!container) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width * dpr, height * dpr);
      gl.canvas.style.width = width + "px";
      gl.canvas.style.height = height + "px";
      program.uniforms.iResolution.value.set(
        gl.canvas.width,
        gl.canvas.height,
        1
      );
    }
    window.addEventListener("resize", resize);
    resize();

    // Render first frame synchronously before adding canvas to DOM.
    // This eliminates the white flash caused by the uninitialized WebGL
    // buffer being visible between appendChild and the first rAF callback.
    gl.clear(gl.COLOR_BUFFER_BIT);
    renderer.render({ scene: mesh });
    container.appendChild(gl.canvas);

    let lastTime = 0;
    let currentRot = 0;
    let rafId: number;

    const update = (t: number) => {
      rafId = requestAnimationFrame(update);
      const dt = Math.min((t - lastTime) * 0.001, 0.1);
      lastTime = t;
      program.uniforms.iTime.value = t * 0.001;

      // Read audio frequency data
      let amplitude = 0;
      const analyser = analyserRef.current;
      const dataArray = dataArrayRef.current;
      if (analyser && dataArray && isPlayingRef.current) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        amplitude = sum / (dataArray.length * 255);
      }

      // Subtle idle breathing; strong response during audio
      const baseBreathing =
        (Math.sin(t * 0.002) * 0.5 + 0.5) * 0.08;
      const audioTarget = amplitude * 2;
      const targetHover = isPlayingRef.current
        ? Math.max(audioTarget, baseBreathing)
        : baseBreathing;
      program.uniforms.hover.value +=
        (targetHover - program.uniforms.hover.value) * 0.15;

      // Gentle rotation, faster when louder
      if (isPlayingRef.current) {
        currentRot += dt * (0.1 + amplitude * 0.5);
      }
      program.uniforms.rot.value = currentRot;

      renderer.render({ scene: mesh });
    };

    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      if (container.contains(gl.canvas)) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion || webglFailed) {
    return (
      <div
        className="h-[180px] w-[180px] rounded-full md:h-[220px] md:w-[220px] bg-[radial-gradient(circle_at_35%_35%,rgba(77,163,255,0.6),rgba(77,163,255,0.15)_60%,rgba(77,163,255,0.05))] shadow-[0_0_60px_rgba(77,163,255,0.3),0_0_120px_rgba(77,163,255,0.1)]"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[200px] w-[200px] md:h-[250px] md:w-[250px]"
      aria-hidden="true"
    />
  );
}
