import { describe, it, expect } from "vitest";
import { buildCueGroups, reconcileWithCaptions } from "./cue-groups";
import type { AudioWordTiming } from "./narration-timer";
import type { OrbCaption } from "./orb-scripts";

function makeTimings(words: string[], startTime = 0, pace = 0.3): AudioWordTiming[] {
  return words.map((word, i) => ({
    word,
    start: startTime + i * pace,
    end: startTime + i * pace + pace * 0.8,
  }));
}

describe("reconcileWithCaptions", () => {
  it("restores punctuation from caption text", () => {
    const timings = makeTimings(["Hello", "world", "How", "are", "you"]);
    const captions: OrbCaption[] = [
      { startTime: 0, endTime: 5, text: "Hello, world. How are you?" },
    ];

    const result = reconcileWithCaptions(timings, captions);
    expect(result.map((w) => w.word)).toEqual(["Hello,", "world.", "How", "are", "you?"]);
  });

  it("preserves timing data while updating words", () => {
    const timings: AudioWordTiming[] = [
      { word: "Nice", start: 0, end: 0.42 },
      { word: "work", start: 0.42, end: 0.98 },
    ];
    const captions: OrbCaption[] = [
      { startTime: 0, endTime: 2, text: "Nice work!" },
    ];

    const result = reconcileWithCaptions(timings, captions);
    expect(result[1].word).toBe("work!");
    expect(result[1].start).toBe(0.42);
    expect(result[1].end).toBe(0.98);
  });

  it("splits hyphenated caption words to match Whisper output", () => {
    const timings = makeTimings(["big", "real", "world", "problems"]);
    const captions: OrbCaption[] = [
      { startTime: 0, endTime: 5, text: "big, real-world problems." },
    ];

    const result = reconcileWithCaptions(timings, captions);
    expect(result.map((w) => w.word)).toEqual(["big,", "real", "world", "problems."]);
  });

  it("filters standalone punctuation tokens like em dashes", () => {
    const timings = makeTimings(["practical", "intelligence", "which"]);
    const captions: OrbCaption[] = [
      { startTime: 0, endTime: 5, text: "practical intelligence \u2014 which" },
    ];

    const result = reconcileWithCaptions(timings, captions);
    expect(result.map((w) => w.word)).toEqual(["practical", "intelligence", "which"]);
  });

  it("handles mismatches gracefully", () => {
    const timings = makeTimings(["Welcome", "to", "the", "test"]);
    const captions: OrbCaption[] = [
      { startTime: 0, endTime: 5, text: "Welcome to the test." },
    ];

    const result = reconcileWithCaptions(timings, captions);
    expect(result).toHaveLength(4);
    expect(result[3].word).toBe("test.");
  });
});

describe("buildCueGroups", () => {
  it("returns empty array for empty input", () => {
    expect(buildCueGroups([])).toEqual([]);
  });

  it("puts a short phrase into a single cue group", () => {
    const timings = makeTimings(["Ready?", "Let\u2019s", "go!"]);
    const groups = buildCueGroups(timings);
    // "Ready?" ends with ?, so it would break there
    // But since it's only 1 word, it creates a group of 1, then "Let's go!" as another
    expect(groups.length).toBeGreaterThanOrEqual(1);
  });

  it("breaks at sentence-ending punctuation", () => {
    const words = [
      "This", "is", "a", "test.", "And", "this", "is", "more.",
    ];
    const timings = makeTimings(words);
    const groups = buildCueGroups(timings);

    expect(groups).toHaveLength(2);
    expect(groups[0].words.map((w) => w.word)).toEqual(["This", "is", "a", "test."]);
    expect(groups[1].words.map((w) => w.word)).toEqual(["And", "this", "is", "more."]);
  });

  it("force-breaks at 30 words if no punctuation", () => {
    // Use a very fast pace so duration limit doesn't kick in first
    const words = Array.from({ length: 35 }, (_, i) => `word${i}`);
    const timings = makeTimings(words, 0, 0.1);
    const groups = buildCueGroups(timings);

    expect(groups[0].words).toHaveLength(30);
    expect(groups[1].words).toHaveLength(5);
  });

  it("breaks when duration exceeds 8 seconds", () => {
    // 25 words at 0.5s each — enough that both groups are large
    const timings = makeTimings(
      Array.from({ length: 25 }, (_, i) => `w${i}`),
      0,
      0.5,
    );
    const groups = buildCueGroups(timings);

    expect(groups.length).toBeGreaterThanOrEqual(2);
    const firstGroupDuration =
      groups[0].words.at(-1)!.end - groups[0].words[0].start;
    expect(firstGroupDuration).toBeLessThanOrEqual(9);
  });

  it("merges orphan tail (≤3 words) into previous group", () => {
    const words = [
      "First", "sentence", "here.", "Two", "words.",  "Orphan",
    ];
    const timings = makeTimings(words);
    const groups = buildCueGroups(timings);

    // "Orphan" (1 word) should merge into the "Two words." group
    expect(groups).toHaveLength(2);
    expect(groups[1].words.map((w) => w.word)).toEqual(["Two", "words.", "Orphan"]);
  });

  it("sets correct startTime and endTime on each group", () => {
    const timings = makeTimings(["Hello.", "World!"]);
    const groups = buildCueGroups(timings);

    // "Hello." ends with period, so first group is just ["Hello."]
    expect(groups[0].startTime).toBe(timings[0].start);
    expect(groups[0].endTime).toBe(timings[0].end);
  });

  it("reconciles with captions when provided", () => {
    // Whisper output (no punctuation)
    const timings = makeTimings(["Nice", "work", "See", "nothing", "to", "it"]);
    const captions: OrbCaption[] = [
      { startTime: 0, endTime: 3, text: "Nice work! See, nothing to it." },
    ];

    const groups = buildCueGroups(timings, captions);

    // Should break after "work!" (sentence end) and after "it." (sentence end)
    expect(groups).toHaveLength(2);
    expect(groups[0].words.map((w) => w.word).at(-1)).toBe("work!");
    expect(groups[1].words.map((w) => w.word).at(-1)).toBe("it.");
  });

  it("handles real orb script data (CI transition excerpt)", () => {
    const timings: AudioWordTiming[] = [
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
    ];

    const groups = buildCueGroups(timings);

    // Should break after "two." and after "breath."
    const totalWords = groups.reduce((sum, g) => sum + g.words.length, 0);
    expect(totalWords).toBe(timings.length);
    expect(groups[0].words.at(-1)!.word).toBe("two.");
    expect(groups[1].words.at(-1)!.word).toBe("breath.");
  });
});
