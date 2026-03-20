import type { AudioWordTiming } from "./narration-timer";

export type OrbCaption = {
  startTime: number;
  endTime: number;
  text: string;
};

export type OrbScript = {
  audioUrl: string;
  captions: OrbCaption[];
  /** Per-word timing from ElevenLabs alignment for precise text reveal. */
  wordTimings?: AudioWordTiming[];
};

// ─── Pre-exam briefing ──────────────────────────────────────────────

const PRE_EXAM_CAPTIONS: OrbCaption[] = [
  {
    startTime: 0,
    endTime: 12,
    text: "Great, you\u2019re all set! Now we\u2019re ready to begin the fun part! A couple of important reminders: there are NO right answers here. We\u2019re looking at HOW you think, NOT what you know.",
  },
  {
    startTime: 13,
    endTime: 28,
    text: "Your job is just to think out loud \u2014 narrate your reasoning as it happens. If you\u2019re unsure, say so. If you\u2019d want more information, tell us what and why. The more you externally process, the better insight we\u2019ll have into how that mind of yours works.",
  },
  {
    startTime: 29,
    endTime: 38,
    text: "These first two scenarios are about practical intelligence \u2014 which is your ability to tackle big, messy, real-world problems. When you\u2019re ready to get started, click continue.",
  },
];

/**
 * Pre-exam briefing script.
 * Played after consent, before vignette 1.
 * Word timings will be added after ElevenLabs recording.
 */
export const PRE_EXAM_SCRIPT: OrbScript = {
  audioUrl: "/audio/briefing-pre-exam.mp3",
  captions: PRE_EXAM_CAPTIONS,
};

// ─── CI transition briefing (~62s) ──────────────────────────────────

const CI_TRANSITION_CAPTIONS: OrbCaption[] = [
  {
    startTime: 0,
    endTime: 2.88,
    text: "Nice work on those first two. Now take a breath.",
  },
  {
    startTime: 3.6,
    endTime: 10.84,
    text: "The next two questions are designed to test your \u201ccreative intelligence\u201d, which is your ability to connect dots and come up with new ideas.",
  },
  {
    startTime: 11.86,
    endTime: 30.66,
    text: "Before we jump in, let me tell you a quick story. A guy named Brian Chesky was having issues making his rent when he noticed an upcoming conference had every hotel in San Francisco booked solid. So he threw air mattresses on his living room floor and charged strangers to sleep there. And that\u2019s how Airbnb started.",
  },
  {
    startTime: 31.44,
    endTime: 46.32,
    text: "That\u2019s the type of brainstorming we\u2019ll need from you in this next section! We\u2019ll drop you into real situations where entrepreneurs spotted opportunities others missed. Your job is to brainstorm \u2014 what would you build? What do you see that nobody else does?",
  },
  {
    startTime: 47.22,
    endTime: 59.46,
    text: "Think out loud, connect dots, get wild with it \u2014 as long as you can back up your reasoning. Again, it\u2019s best if you say everything you\u2019re thinking out loud to give us insight into how that beautiful mind of yours works!",
  },
  {
    startTime: 60.26,
    endTime: 61.74,
    text: "Ready? Let\u2019s go!",
  },
];

const CI_TRANSITION_WORD_TIMINGS: AudioWordTiming[] = [
  // Chunk 1: Nice work
  { word: "Nice", start: 0.0, end: 0.32 },
  { word: "work", start: 0.32, end: 0.62 },
  { word: "on", start: 0.62, end: 0.76 },
  { word: "those", start: 0.76, end: 0.9 },
  { word: "first", start: 0.9, end: 1.14 },
  { word: "two.", start: 1.14, end: 1.58 },
  { word: "Now", start: 2.36, end: 2.42 },
  { word: "take", start: 2.42, end: 2.6 },
  { word: "a", start: 2.6, end: 2.68 },
  { word: "breath.", start: 2.68, end: 2.88 },
  // Chunk 2: Creative intelligence intro
  { word: "The", start: 3.6, end: 3.7 },
  { word: "next", start: 3.7, end: 3.94 },
  { word: "two", start: 3.94, end: 4.16 },
  { word: "questions", start: 4.16, end: 4.6 },
  { word: "are", start: 4.6, end: 4.8 },
  { word: "designed", start: 4.8, end: 5.14 },
  { word: "to", start: 5.14, end: 5.34 },
  { word: "test", start: 5.34, end: 5.64 },
  { word: "your", start: 5.64, end: 5.84 },
  { word: "\u201ccreative", start: 5.84, end: 6.48 },
  { word: "intelligence\u201d,", start: 6.48, end: 7.14 },
  { word: "which", start: 7.54, end: 7.82 },
  { word: "is", start: 7.82, end: 7.92 },
  { word: "your", start: 7.92, end: 8.06 },
  { word: "ability", start: 8.06, end: 8.46 },
  { word: "to", start: 8.46, end: 8.7 },
  { word: "connect", start: 8.7, end: 8.98 },
  { word: "dots", start: 8.98, end: 9.32 },
  { word: "and", start: 9.32, end: 9.78 },
  { word: "come", start: 9.78, end: 9.96 },
  { word: "up", start: 9.96, end: 10.14 },
  { word: "with", start: 10.14, end: 10.26 },
  { word: "new", start: 10.26, end: 10.4 },
  { word: "ideas.", start: 10.4, end: 10.84 },
  // Chunk 3: Airbnb story
  { word: "Before", start: 11.86, end: 12.1 },
  { word: "we", start: 12.1, end: 12.3 },
  { word: "jump", start: 12.3, end: 12.44 },
  { word: "in,", start: 12.44, end: 12.72 },
  { word: "let", start: 12.84, end: 12.88 },
  { word: "me", start: 12.88, end: 12.98 },
  { word: "tell", start: 12.98, end: 13.14 },
  { word: "you", start: 13.14, end: 13.28 },
  { word: "a", start: 13.28, end: 13.38 },
  { word: "quick", start: 13.38, end: 13.5 },
  { word: "story.", start: 13.5, end: 13.88 },
  { word: "A", start: 14.94, end: 15.06 },
  { word: "guy", start: 15.06, end: 15.22 },
  { word: "named", start: 15.22, end: 15.5 },
  { word: "Brian", start: 15.5, end: 15.8 },
  { word: "Chesky", start: 15.8, end: 16.28 },
  { word: "was", start: 16.28, end: 16.48 },
  { word: "having", start: 16.48, end: 16.72 },
  { word: "issues", start: 16.72, end: 17.12 },
  { word: "making", start: 17.12, end: 17.42 },
  { word: "his", start: 17.42, end: 17.74 },
  { word: "rent", start: 17.74, end: 18.0 },
  { word: "when", start: 18.0, end: 18.52 },
  { word: "he", start: 18.52, end: 18.66 },
  { word: "noticed", start: 18.66, end: 19.0 },
  { word: "an", start: 19.0, end: 19.22 },
  { word: "upcoming", start: 19.22, end: 19.48 },
  { word: "conference", start: 19.48, end: 20.08 },
  { word: "had", start: 20.08, end: 20.32 },
  { word: "every", start: 20.32, end: 20.76 },
  { word: "hotel", start: 20.76, end: 21.06 },
  { word: "in", start: 21.06, end: 21.34 },
  { word: "San", start: 21.34, end: 21.5 },
  { word: "Francisco", start: 21.5, end: 21.98 },
  { word: "booked", start: 21.98, end: 22.36 },
  { word: "solid.", start: 22.36, end: 22.98 },
  { word: "So", start: 23.52, end: 23.86 },
  { word: "he", start: 23.86, end: 24.0 },
  { word: "threw", start: 24.0, end: 24.22 },
  { word: "air", start: 24.22, end: 24.44 },
  { word: "mattresses", start: 24.44, end: 24.96 },
  { word: "on", start: 24.96, end: 25.12 },
  { word: "his", start: 25.12, end: 25.24 },
  { word: "living", start: 25.24, end: 25.44 },
  { word: "room", start: 25.44, end: 25.68 },
  { word: "floor", start: 25.68, end: 26.06 },
  { word: "and", start: 26.06, end: 26.54 },
  { word: "charged", start: 26.54, end: 27.12 },
  { word: "strangers", start: 27.12, end: 27.66 },
  { word: "to", start: 27.66, end: 27.88 },
  { word: "sleep", start: 27.88, end: 28.16 },
  { word: "there.", start: 28.16, end: 28.4 },
  { word: "And", start: 28.4, end: 29.28 },
  { word: "that\u2019s", start: 29.28, end: 29.6 },
  { word: "how", start: 29.6, end: 29.68 },
  { word: "Airbnb", start: 29.68, end: 30.02 },
  { word: "started.", start: 30.02, end: 30.66 },
  // Chunk 4: Brainstorming
  { word: "That\u2019s", start: 31.44, end: 31.96 },
  { word: "the", start: 31.96, end: 32.06 },
  { word: "type", start: 32.06, end: 32.22 },
  { word: "of", start: 32.22, end: 32.38 },
  { word: "brainstorming", start: 32.38, end: 33.04 },
  { word: "we\u2019ll", start: 33.04, end: 33.14 },
  { word: "need", start: 33.14, end: 33.28 },
  { word: "from", start: 33.28, end: 33.46 },
  { word: "you", start: 33.46, end: 33.68 },
  { word: "in", start: 33.68, end: 33.8 },
  { word: "this", start: 33.8, end: 33.94 },
  { word: "next", start: 33.94, end: 34.12 },
  { word: "section!", start: 34.12, end: 34.58 },
  { word: "We\u2019ll", start: 35.16, end: 35.34 },
  { word: "drop", start: 35.34, end: 35.58 },
  { word: "you", start: 35.58, end: 35.8 },
  { word: "into", start: 35.8, end: 35.98 },
  { word: "real", start: 35.98, end: 36.28 },
  { word: "situations", start: 36.28, end: 36.94 },
  { word: "where", start: 36.94, end: 37.22 },
  { word: "entrepreneurs", start: 37.22, end: 37.74 },
  { word: "spotted", start: 37.74, end: 38.2 },
  { word: "opportunities", start: 38.2, end: 38.9 },
  { word: "others", start: 38.9, end: 39.34 },
  { word: "missed.", start: 39.34, end: 39.84 },
  { word: "Your", start: 40.66, end: 40.82 },
  { word: "job", start: 40.82, end: 41.2 },
  { word: "is", start: 41.2, end: 41.38 },
  { word: "to", start: 41.38, end: 41.48 },
  { word: "brainstorm", start: 41.48, end: 41.9 },
  { word: "\u2014", start: 41.9, end: 42.3 },
  { word: "what", start: 42.66, end: 42.86 },
  { word: "would", start: 42.86, end: 43.0 },
  { word: "you", start: 43.0, end: 43.12 },
  { word: "build?", start: 43.12, end: 43.4 },
  { word: "What", start: 44.12, end: 44.38 },
  { word: "do", start: 44.38, end: 44.54 },
  { word: "you", start: 44.54, end: 44.64 },
  { word: "see", start: 44.64, end: 44.96 },
  { word: "that", start: 44.96, end: 45.2 },
  { word: "nobody", start: 45.2, end: 45.56 },
  { word: "else", start: 45.56, end: 45.9 },
  { word: "does?", start: 45.9, end: 46.32 },
  // Chunk 5: Think out loud
  { word: "Think", start: 47.22, end: 47.44 },
  { word: "out", start: 47.44, end: 47.68 },
  { word: "loud,", start: 47.68, end: 47.94 },
  { word: "connect", start: 48.34, end: 48.64 },
  { word: "dots,", start: 48.64, end: 49.04 },
  { word: "get", start: 49.52, end: 49.74 },
  { word: "wild", start: 49.74, end: 50.04 },
  { word: "with", start: 50.04, end: 50.32 },
  { word: "it", start: 50.32, end: 50.56 },
  { word: "\u2014", start: 50.56, end: 50.78 },
  { word: "as", start: 50.78, end: 51.04 },
  { word: "long", start: 51.04, end: 51.22 },
  { word: "as", start: 51.22, end: 51.44 },
  { word: "you", start: 51.44, end: 51.52 },
  { word: "can", start: 51.52, end: 51.64 },
  { word: "back", start: 51.64, end: 51.86 },
  { word: "up", start: 51.86, end: 52.04 },
  { word: "your", start: 52.04, end: 52.18 },
  { word: "reasoning.", start: 52.18, end: 52.56 },
  { word: "Again,", start: 53.42, end: 53.82 },
  { word: "it\u2019s", start: 53.98, end: 54.12 },
  { word: "best", start: 54.12, end: 54.3 },
  { word: "if", start: 54.3, end: 54.5 },
  { word: "you", start: 54.5, end: 54.6 },
  { word: "say", start: 54.6, end: 54.78 },
  { word: "everything", start: 54.78, end: 55.22 },
  { word: "you\u2019re", start: 55.22, end: 55.48 },
  { word: "thinking", start: 55.48, end: 55.76 },
  { word: "out", start: 55.76, end: 56.12 },
  { word: "loud", start: 56.12, end: 56.5 },
  { word: "to", start: 56.5, end: 56.64 },
  { word: "give", start: 56.64, end: 56.78 },
  { word: "us", start: 56.78, end: 56.96 },
  { word: "insight", start: 56.96, end: 57.4 },
  { word: "into", start: 57.4, end: 57.64 },
  { word: "how", start: 57.64, end: 57.82 },
  { word: "that", start: 57.82, end: 57.98 },
  { word: "beautiful", start: 57.98, end: 58.34 },
  { word: "mind", start: 58.34, end: 58.72 },
  { word: "of", start: 58.72, end: 58.88 },
  { word: "yours", start: 58.88, end: 59.06 },
  { word: "works!", start: 59.06, end: 59.46 },
  // Chunk 6: Let's go
  { word: "Ready?", start: 60.26, end: 60.56 },
  { word: "Let\u2019s", start: 61.18, end: 61.6 },
  { word: "go!", start: 61.6, end: 61.74 },
];

/**
 * CI transition briefing script (~62s).
 * Played after vignette 2, before vignette 3.
 * Word timing from Whisper transcription of ElevenLabs audio.
 */
export const CI_TRANSITION_SCRIPT: OrbScript = {
  audioUrl: "/audio/briefing-ci-transition.mp3",
  captions: CI_TRANSITION_CAPTIONS,
  wordTimings: CI_TRANSITION_WORD_TIMINGS,
};

// ─── Warmup intro (~28s) ────────────────────────────────────────────

const WARMUP_INTRO_CAPTIONS: OrbCaption[] = [
  {
    startTime: 0,
    endTime: 18,
    text: "Welcome to the Builder\u2019s Quotient! First off, take a deep breath. Nothing about this is designed to stress you out or be intimidating. The only purpose of this assessment is to get a sense of how you think by comparing your answers to some successful entrepreneurs. There is no right or wrong here \u2014 there\u2019s just the unique combination of traits that make you, you. That\u2019s exciting stuff!",
  },
  {
    startTime: 19,
    endTime: 34,
    text: "Here\u2019s what\u2019s about to happen. You\u2019re going to hear four scenarios drawn from the lives of real entrepreneurs. The first two will be about problem solving. The second two will be about seeing opportunities. Each scenario follows the same rhythm: you\u2019ll hear the story narrated to you, then respond to three questions on camera. You\u2019ll get some time to think before each response.",
  },
  {
    startTime: 35,
    endTime: 48,
    text: "But before we dive into any of that, we\u2019re going to do a quick practice round to get you comfortable with the flow. Just three casual questions \u2014 totally unscored, totally ungraded. Just talk naturally, like you\u2019re chatting with a friend. You\u2019ll see each question, get a few seconds to think, and then record your answer. Simple as that. Ready?",
  },
];

/**
 * Warmup intro script (~48s).
 * Gives assessment overview, then transitions to warmup practice round.
 * Word timings will be added after ElevenLabs recording.
 */
export const WARMUP_INTRO_SCRIPT: OrbScript = {
  audioUrl: "/audio/warmup-intro.mp3",
  captions: WARMUP_INTRO_CAPTIONS,
};

// ─── Post-warmup transition (~14s) ──────────────────────────────────

const POST_WARMUP_CAPTIONS: OrbCaption[] = [
  {
    startTime: 0,
    endTime: 7,
    text: "Nice work! See, nothing to it. You\u2019re a natural on camera.",
  },
  {
    startTime: 7,
    endTime: 14,
    text: "Now, before we start the real assessment, you need to review a few quick details. Take a moment to read through the information on the next page and check the boxes when you\u2019re ready.",
  },
];

/**
 * Post-warmup transition script (~14s).
 * Played after warmup questions, before the consent/details screen.
 * Word timings will be added after ElevenLabs recording.
 */
export const POST_WARMUP_SCRIPT: OrbScript = {
  audioUrl: "/audio/warmup-transition.mp3",
  captions: POST_WARMUP_CAPTIONS,
};
