/**
 * Generates a short sine-wave countdown tone using the Web Audio API.
 * No audio files needed — pure synthesis.
 */
export function playCountdownTone(
  ctx: AudioContext,
  frequency = 440,
  duration = 0.12
): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  // Quick fade-out envelope to avoid click artifacts
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}
