import type { AudioWordTiming } from "./narration-timer";

export type OrbCaption = {
  startTime: number;
  endTime: number;
  text: string;
};

export type OrbScript = {
  audioUrl: string;
  captions: OrbCaption[];
  /** Per-word timing for precise text reveal sync (if available). */
  wordTimings?: AudioWordTiming[];
};

/**
 * Generates proportional word-level timing estimates from caption boundaries.
 * Character-weighted with punctuation pauses — usable as a stopgap until
 * real ElevenLabs timestamps are generated via `scripts/generate-briefing-timestamps.mjs`.
 */
function deriveWordTimings(captions: OrbCaption[]): AudioWordTiming[] {
  const timings: AudioWordTiming[] = [];

  for (const caption of captions) {
    const words = caption.text.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    const duration = caption.endTime - caption.startTime;

    // Weight each word by character count + punctuation pause
    const weights = words.map((w) => {
      let weight = w.length;
      if (/[.!?][\u201D\u2019"']*$/.test(w)) weight += 3; // sentence end
      else if (/[,;:\u2014][\u201D\u2019"']*$/.test(w)) weight += 1.5; // clause break
      return weight;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let elapsed = caption.startTime;

    for (let i = 0; i < words.length; i++) {
      const wordDuration = (weights[i] / totalWeight) * duration;
      timings.push({
        word: words[i],
        start: Math.round(elapsed * 1000) / 1000,
        end: Math.round((elapsed + wordDuration) * 1000) / 1000,
      });
      elapsed += wordDuration;
    }
  }

  return timings;
}

// ─── Pre-exam briefing ──────────────────────────────────────────────

const PRE_EXAM_CAPTIONS: OrbCaption[] = [
  {
    startTime: 0,
    endTime: 16.3,
    text: "Hey, welcome! Before you dive in, let\u2019s give you a walkthrough of what\u2019s about to happen. You\u2019re about to hear four scenarios drawn from the lives of real entrepreneurs. The first two will be about problem solving, the second two will be about seeing opportunities!",
  },
  {
    startTime: 17.41,
    endTime: 29.28,
    text: "Each scenario follows the same rhythm: you\u2019ll hear the story narrated to you, then respond in three phases \u2014 understand, analyze, and communicate. You\u2019ll also get some time to think before each response!",
  },
  {
    startTime: 30.58,
    endTime: 38.76,
    text: "There are no right answers here. We\u2019re looking at how you think, not what you know. A thoughtful wrong answer beats a lucky right one every time.",
  },
  {
    startTime: 39.36,
    endTime: 50.96,
    text: "These first two are for practical intelligence \u2014 your ability to tackle big problems! Your job is to reason through them like you\u2019re in the room. Ask questions, challenge assumptions, think out loud.",
  },
  {
    startTime: 51.34,
    endTime: 60.48,
    text: "Narrate your thinking as it happens. If you\u2019re unsure, say so. If you\u2019d want more info, tell us what and why. The more you externalize your process, the richer your profile.",
  },
  {
    startTime: 60.5,
    endTime: 62.14,
    text: "Alright, you\u2019re ready. Let\u2019s go.",
  },
];

/**
 * Pre-exam briefing script (~62s).
 * Played after setup, before vignette 1.
 *
 * Word timing is derived proportionally from caption boundaries.
 * Run `node scripts/generate-briefing-timestamps.mjs` to replace with
 * real ElevenLabs word-level alignment.
 */
export const PRE_EXAM_SCRIPT: OrbScript = {
  audioUrl: "/audio/briefing-pre-exam.mp3",
  captions: PRE_EXAM_CAPTIONS,
  wordTimings: deriveWordTimings(PRE_EXAM_CAPTIONS),
};

// ─── CI transition briefing ─────────────────────────────────────────

const CI_TRANSITION_CAPTIONS: OrbCaption[] = [
  {
    startTime: 0,
    endTime: 3.59,
    text: "Nice work on those first two. Take a breath.",
  },
  {
    startTime: 3.91,
    endTime: 24.46,
    text: "Your next two scenarios are going to feel different! They\u2019re about creative intelligence \u2014 which is all about seeing opportunities in the world. Instead of problems to solve, you\u2019ll hear about real market situations. Your job isn\u2019t to fix anything \u2014 it\u2019s to spot opportunities. Think like an entrepreneur scanning for what\u2019s possible, not what\u2019s broken.",
  },
  {
    startTime: 25.07,
    endTime: 34.67,
    text: "So brainstorm and say out loud whatever comes to mind! You should be trying to connect dots and finding ways to win the market. The wilder the idea, the better \u2014 as long as you can explain your reasoning.",
  },
  {
    startTime: 35.97,
    endTime: 40.82,
    text: "Alright, two more to go. Let\u2019s see how you think when the canvas is blank. Are you ready?",
  },
];

/**
 * CI transition briefing script (~41s).
 * Played after vignette 2, before vignette 3.
 */
export const CI_TRANSITION_SCRIPT: OrbScript = {
  audioUrl: "/audio/briefing-ci-transition.mp3",
  captions: CI_TRANSITION_CAPTIONS,
  wordTimings: deriveWordTimings(CI_TRANSITION_CAPTIONS),
};
