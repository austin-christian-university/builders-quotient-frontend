export type OrbCaption = {
  startTime: number;
  endTime: number;
  text: string;
};

export type OrbScript = {
  audioUrl: string;
  captions: OrbCaption[];
};

/**
 * Pre-exam briefing script (~60-90s).
 * Played after setup, before vignette 1.
 *
 * IMPORTANT: Caption timing is placeholder until audio is produced.
 * After generating the ElevenLabs audio, update startTime/endTime
 * values by listening to the audio and noting segment boundaries.
 */
export const PRE_EXAM_SCRIPT: OrbScript = {
  audioUrl: "/audio/briefing-pre-exam.mp3",
  captions: [
    {
      startTime: 0,
      endTime: 12,
      text: "Hey, welcome! Let me walk you through what\u2019s coming up. You\u2019re about to step into four real business scenarios drawn from the lives of actual entrepreneurs.",
    },
    {
      startTime: 12,
      endTime: 26,
      text: "Each scenario follows the same rhythm: you\u2019ll hear the story narrated to you, then respond in three phases \u2014 understand, analyze, and communicate. You get a thinking window before each one.",
    },
    {
      startTime: 26,
      endTime: 38,
      text: "There are no right answers here. We\u2019re looking at how you think, not what you know. A thoughtful wrong answer beats a lucky right one every time.",
    },
    {
      startTime: 38,
      endTime: 56,
      text: "Your first two scenarios are about practical intelligence \u2014 real problems these entrepreneurs actually faced. Your job is to reason through them like you\u2019re in the room. Ask questions, challenge assumptions, think out loud.",
    },
    {
      startTime: 56,
      endTime: 72,
      text: "Narrate your thinking as it happens. If you\u2019re unsure, say so. If you\u2019d want more info, tell us what and why. The more you externalize your process, the richer your profile.",
    },
    {
      startTime: 72,
      endTime: 78,
      text: "Alright, you\u2019re ready. Let\u2019s go.",
    },
  ],
};

/**
 * CI transition briefing script (~30-45s).
 * Played after vignette 2, before vignette 3.
 *
 * IMPORTANT: Caption timing is placeholder until audio is produced.
 */
export const CI_TRANSITION_SCRIPT: OrbScript = {
  audioUrl: "/audio/briefing-ci-transition.mp3",
  captions: [
    {
      startTime: 0,
      endTime: 5,
      text: "Nice work on those first two. Take a breath.",
    },
    {
      startTime: 5,
      endTime: 16,
      text: "Your next two scenarios are going to feel different. They\u2019re about creative intelligence \u2014 and the mindset is completely different from what you just did.",
    },
    {
      startTime: 16,
      endTime: 28,
      text: "Instead of problems to solve, you\u2019ll hear about real market situations. Your job isn\u2019t to fix anything \u2014 it\u2019s to spot opportunities. Think like an entrepreneur scanning for what\u2019s possible, not what\u2019s broken.",
    },
    {
      startTime: 28,
      endTime: 37,
      text: "Brainstorm freely. Connect dots across industries. The wilder the idea, the better \u2014 as long as you can explain your reasoning.",
    },
    {
      startTime: 37,
      endTime: 43,
      text: "Alright, two more to go. Let\u2019s see how you think when the canvas is blank.",
    },
  ],
};
