/**
 * One shared AudioContext for the page, resumed on the first user gesture (§8.3).
 * One cached source node per element or stream — a second `createMediaElementSource`
 * on the same element throws — and its own analyser per consumer.
 *
 * Nothing is stored or inferred from any audio. Only loudness per frequency band is
 * read, and the microphone is read for loudness only, never as a biometric or
 * emotional signal.
 */

type AnyAudioContext = AudioContext;

let context: AnyAudioContext | null = null;
const elementSources = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();
const streamSources = new WeakMap<MediaStream, MediaStreamAudioSourceNode>();

export function audioContext(): AnyAudioContext | null {
  if (typeof window === "undefined") return null;
  if (context) return context;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    context = new Ctor();
    return context;
  } catch {
    return null;
  }
}

export async function resumeAudio(): Promise<void> {
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      // A refused resume simply means no sound tracking; it never blocks anything.
    }
  }
}

export interface AnalyserTap {
  analyser: AnalyserNode;
  release: () => void;
}

export function tapElement(element: HTMLMediaElement, fftSize = 512): AnalyserTap | null {
  const ctx = audioContext();
  if (!ctx) return null;
  try {
    let source = elementSources.get(element);
    if (!source) {
      source = ctx.createMediaElementSource(element);
      // Connected to the destination exactly once, or the page goes silent.
      source.connect(ctx.destination);
      elementSources.set(element, source);
    }
    const analyser = ctx.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = 0.72;
    source.connect(analyser);
    return {
      analyser,
      release: () => {
        try {
          source?.disconnect(analyser);
        } catch {
          // Already torn down.
        }
      },
    };
  } catch {
    return null;
  }
}

export function tapStream(stream: MediaStream, fftSize = 1024): AnalyserTap | null {
  const ctx = audioContext();
  if (!ctx) return null;
  try {
    let source = streamSources.get(stream);
    if (!source) {
      source = ctx.createMediaStreamSource(stream);
      streamSources.set(stream, source);
    }
    const analyser = ctx.createAnalyser();
    analyser.fftSize = fftSize;
    source.connect(analyser);
    return {
      analyser,
      release: () => {
        try {
          source?.disconnect(analyser);
        } catch {
          // Already torn down.
        }
      },
    };
  } catch {
    return null;
  }
}

/**
 * 0.1 s of silence, so later lines may autoplay after the visitor's first click.
 *
 * A `Blob` URL rather than a `data:` URI: the site's Content Security Policy allows
 * `media-src 'self' blob:`, and the `data:` clip it replaces was refused before it
 * played — so priming silently did nothing, on exactly the browsers that need it.
 */
let silentClipUrl: string | null = null;

function silentClip(): string | null {
  if (silentClipUrl) return silentClipUrl;
  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return null;
  const sampleRate = 8000;
  const samples = sampleRate / 10;
  const bytes = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(bytes);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, samples * 2, true);
  silentClipUrl = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
  return silentClipUrl;
}

/**
 * Everything a browser lets a page do with sound only inside a person's click, done
 * **synchronously** — no `await` before any of it (§8.6).
 *
 * Chrome, Edge and Firefox remember a click for a while (sticky activation). Safari
 * does not: a `play()` or an `AudioContext.resume()` that runs after an `await` has
 * left the click and is refused, and iOS also ignores `speechSynthesis.speak` until
 * one has been made inside a gesture. So this resumes the shared context, starts
 * the silent clip on the page's one `<audio>` element and speaks an empty
 * utterance, all before the caller's first `await`. What each returns is left to
 * settle on its own; nothing here can block anything.
 */
export function primeInsideGesture(element: HTMLAudioElement | null): void {
  const ctx = audioContext();
  if (ctx && ctx.state === "suspended") {
    try {
      void ctx.resume().catch(() => undefined);
    } catch {
      // A refused resume simply means no sound tracking.
    }
  }

  if (element) {
    const clip = silentClip();
    if (clip) {
      try {
        element.src = clip;
        void Promise.resolve(element.play())
          .then(() => {
            element.pause();
            element.currentTime = 0;
          })
          .catch(() => undefined);
      } catch {
        // Priming failed: the browser voice path still works, and captions always do.
      }
    }
  }

  const synthesis = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (synthesis && typeof SpeechSynthesisUtterance !== "undefined") {
    try {
      const empty = new SpeechSynthesisUtterance("");
      empty.volume = 0;
      synthesis.speak(empty);
    } catch {
      // No browser voice: a recording or the captions carry the line.
    }
  }
}

/** For a caller that wants to know when priming has settled (the rehearsal page). */
export async function primeAudioElement(element: HTMLAudioElement): Promise<void> {
  primeInsideGesture(element);
  await resumeAudio();
}
