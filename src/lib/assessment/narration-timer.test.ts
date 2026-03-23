import { describe, it, expect } from "vitest";
import {
  calculateNarrationTiming,
  calculateWordTiming,
  findRevealedCount,
  getParagraphBreakWordIndices,
  splitIntoParagraphs,
  type AudioWordTiming,
} from "./narration-timer";

describe("calculateNarrationTiming", () => {
  it("returns empty segments and zero duration for empty string", () => {
    const result = calculateNarrationTiming("");
    expect(result).toEqual({ segments: [], totalDuration: 0 });
  });

  it("returns a single segment for a single sentence", () => {
    const result = calculateNarrationTiming("Hello world.");
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].startTime).toBe(0);
    expect(result.segments[0].text).toBe("Hello world.");
  });

  it("returns correct count for multi-sentence text", () => {
    const result = calculateNarrationTiming(
      "First sentence. Second sentence. Third sentence."
    );
    expect(result.segments).toHaveLength(3);
  });

  it("produces contiguous timing across segments", () => {
    const result = calculateNarrationTiming(
      "First sentence. Second sentence. Third sentence."
    );
    for (let i = 1; i < result.segments.length; i++) {
      const prev = result.segments[i - 1];
      expect(result.segments[i].startTime).toBeCloseTo(
        prev.startTime + prev.duration,
        10
      );
    }
  });

  it("distributes duration proportionally to word count", () => {
    // "One." = 1 word, "Two three four." = 3 words → 1:3 ratio
    const result = calculateNarrationTiming("One. Two three four.");
    const [short, long] = result.segments;
    expect(long.duration / short.duration).toBeCloseTo(3, 5);
  });

  it("uses override duration when provided", () => {
    const result = calculateNarrationTiming("Hello world.", 10);
    expect(result.totalDuration).toBe(10);
  });

  it("maintains proportions when override is provided", () => {
    const result = calculateNarrationTiming("One. Two three four.", 8);
    expect(result.totalDuration).toBe(8);
    const [short, long] = result.segments;
    expect(long.duration / short.duration).toBeCloseTo(3, 5);
  });

  it("falls back to WPM calculation when override is null", () => {
    const result = calculateNarrationTiming("Hello world.", null);
    // 2 words / 2.5 WPS = 0.8s
    expect(result.totalDuration).toBeCloseTo(0.8, 5);
  });

  it("falls back to WPM calculation when override is 0", () => {
    const result = calculateNarrationTiming("Hello world.", 0);
    expect(result.totalDuration).toBeCloseTo(0.8, 5);
  });

  it("splits on period, question mark, and exclamation mark", () => {
    const result = calculateNarrationTiming(
      "Statement. Question? Exclamation!"
    );
    expect(result.segments).toHaveLength(3);
    expect(result.segments[0].text).toContain(".");
    expect(result.segments[1].text).toContain("?");
    expect(result.segments[2].text).toContain("!");
  });

  it("captures trailing text without punctuation", () => {
    const result = calculateNarrationTiming("A sentence. Trailing text");
    expect(result.segments).toHaveLength(2);
    expect(result.segments[1].text).toBe("Trailing text");
  });

  it("does not split on decimal numbers", () => {
    const result = calculateNarrationTiming(
      "Revenue was $1.4 million. That was below projections."
    );
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].text).toContain("$1.4 million");
  });

  it("keeps multiple decimals in the same sentence", () => {
    const result = calculateNarrationTiming(
      "Growth dropped from 3.5% to 1.2% this quarter. We need to act."
    );
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].text).toContain("3.5%");
    expect(result.segments[0].text).toContain("1.2%");
  });

  it("does not split on U.S. abbreviation", () => {
    const result = calculateNarrationTiming(
      "The U.S. market is competitive. We expanded to Europe."
    );
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].text).toContain("U.S.");
  });

  it("does not split on common abbreviations like e.g. and etc.", () => {
    const result = calculateNarrationTiming(
      "Use tools e.g. spreadsheets etc. for tracking. This helps a lot."
    );
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].text).toContain("e.g.");
    expect(result.segments[0].text).toContain("etc.");
  });

  it("keeps closing quotes with the sentence", () => {
    const result = calculateNarrationTiming(
      'He said "back to basics." Then they refocused.'
    );
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].text).toBe('He said "back to basics."');
    expect(result.segments[1].text).toBe("Then they refocused.");
  });

  it("keeps curly closing quotes with the sentence", () => {
    const result = calculateNarrationTiming(
      "She told them \u201Cstop immediately.\u201D The room went silent."
    );
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].text).toContain("\u201D");
    expect(result.segments[1].text).toMatch(/^The room/);
  });

  it("handles exclamation inside quotes", () => {
    const result = calculateNarrationTiming(
      'She yelled "stop!" Everyone froze.'
    );
    expect(result.segments).toHaveLength(2);
    expect(result.segments[0].text).toBe('She yelled "stop!"');
  });

  it("handles a single word", () => {
    const result = calculateNarrationTiming("Hello");
    expect(result.segments).toHaveLength(1);
    // 1 word / 2.5 WPS = 0.4s
    expect(result.totalDuration).toBeCloseTo(0.4, 5);
  });

  it("ensures segment durations sum to totalDuration", () => {
    const result = calculateNarrationTiming(
      "The quick brown fox jumps. Over the lazy dog. And runs away fast!"
    );
    const sumDurations = result.segments.reduce(
      (sum, s) => sum + s.duration,
      0
    );
    expect(sumDurations).toBeCloseTo(result.totalDuration, 10);
  });
});

// ---------------------------------------------------------------------------
// calculateWordTiming
// ---------------------------------------------------------------------------

describe("calculateWordTiming", () => {
  it("returns empty result for empty string", () => {
    const result = calculateWordTiming("");
    expect(result).toEqual({ words: [], totalDuration: 0, sentenceCount: 0 });
  });

  it("returns empty result for whitespace-only string", () => {
    const result = calculateWordTiming("   ");
    expect(result).toEqual({ words: [], totalDuration: 0, sentenceCount: 0 });
  });

  it("returns correct structure for a single word", () => {
    const result = calculateWordTiming("Hello");
    expect(result.words).toHaveLength(1);
    expect(result.words[0].text).toBe("Hello");
    expect(result.words[0].startTime).toBe(0);
    expect(result.words[0].sentenceIndex).toBe(0);
    expect(result.words[0].isFirstInSentence).toBe(true);
    expect(result.words[0].isLastInSentence).toBe(true);
  });

  it("produces correct word count for multi-word single sentence", () => {
    const result = calculateWordTiming("The quick brown fox.");
    expect(result.words).toHaveLength(4);
    expect(result.words.map((w) => w.text)).toEqual([
      "The",
      "quick",
      "brown",
      "fox.",
    ]);
  });

  it("assigns correct sentenceCount for multi-sentence text", () => {
    const result = calculateWordTiming("First sentence. Second sentence.");
    expect(result.sentenceCount).toBe(2);
  });

  it("increments sentenceIndex across sentences", () => {
    const result = calculateWordTiming("One. Two. Three.");
    const indices = result.words.map((w) => w.sentenceIndex);
    expect(indices).toEqual([0, 1, 2]);
  });

  it("marks sentence boundary flags correctly", () => {
    const result = calculateWordTiming("Hello world. Goodbye moon.");
    // First sentence: Hello(first), world.(last)
    expect(result.words[0].isFirstInSentence).toBe(true);
    expect(result.words[0].isLastInSentence).toBe(false);
    expect(result.words[1].isFirstInSentence).toBe(false);
    expect(result.words[1].isLastInSentence).toBe(true);
    // Second sentence: Goodbye(first), moon.(last)
    expect(result.words[2].isFirstInSentence).toBe(true);
    expect(result.words[2].isLastInSentence).toBe(false);
    expect(result.words[3].isFirstInSentence).toBe(false);
    expect(result.words[3].isLastInSentence).toBe(true);
  });

  it("produces monotonically increasing startTime", () => {
    const result = calculateWordTiming(
      "The quick brown fox. Jumps over the lazy dog."
    );
    for (let i = 1; i < result.words.length; i++) {
      expect(result.words[i].startTime).toBeGreaterThanOrEqual(
        result.words[i - 1].startTime
      );
    }
  });

  it("starts first word at time 0", () => {
    const result = calculateWordTiming("Any text here.");
    expect(result.words[0].startTime).toBe(0);
  });

  it("calculates default duration from WPS (1.6)", () => {
    // 2 words / 1.6 WPS = 1.25s
    const result = calculateWordTiming("Hello world");
    expect(result.totalDuration).toBeCloseTo(1.25, 5);
  });

  it("uses override duration when provided", () => {
    const result = calculateWordTiming("Hello world.", 5);
    expect(result.totalDuration).toBe(5);
  });

  it("falls back to WPS when override is null", () => {
    const result = calculateWordTiming("Hello world", null);
    expect(result.totalDuration).toBeCloseTo(1.25, 5);
  });

  it("falls back to WPS when override is 0", () => {
    const result = calculateWordTiming("Hello world", 0);
    expect(result.totalDuration).toBeCloseTo(1.25, 5);
  });

  it("handles a realistic paragraph", () => {
    const paragraph =
      "Sarah noticed the supplier was late again. She decided to call them directly. " +
      "After a brief conversation, she negotiated a discount for the inconvenience.";
    const result = calculateWordTiming(paragraph);
    const wordCount = paragraph.split(/\s+/).filter(Boolean).length;
    expect(result.words).toHaveLength(wordCount);
    expect(result.sentenceCount).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// findRevealedCount
// ---------------------------------------------------------------------------

/** Helper to build AudioWordTiming entries. */
function timing(start: number, end: number, word = "w"): AudioWordTiming {
  return { word, start, end };
}

describe("findRevealedCount", () => {
  it("returns 0 for empty timings array", () => {
    expect(findRevealedCount([], 1)).toBe(0);
  });

  it("returns 0 when currentTime is before first word", () => {
    const t = [timing(0.5, 1)];
    expect(findRevealedCount(t, 0.3)).toBe(0);
  });

  it("returns count at exact word boundary", () => {
    const t = [timing(0, 0.5), timing(0.5, 1), timing(1, 1.5)];
    // currentTime === 0.5 means words[0] and words[1] are both revealed
    expect(findRevealedCount(t, 0.5)).toBe(2);
  });

  it("returns correct partial count between words", () => {
    const t = [timing(0, 0.4), timing(0.5, 0.9), timing(1.0, 1.4)];
    // 0.7 is between word[1].start (0.5) and word[2].start (1.0)
    expect(findRevealedCount(t, 0.7)).toBe(2);
  });

  it("returns total count when past all words", () => {
    const t = [timing(0, 0.3), timing(0.5, 0.8), timing(1, 1.3)];
    expect(findRevealedCount(t, 99)).toBe(3);
  });

  it("returns 0 for negative currentTime", () => {
    const t = [timing(0, 0.5)];
    expect(findRevealedCount(t, -1)).toBe(0);
  });

  it("returns total count when currentTime equals last start", () => {
    const t = [timing(0, 0.3), timing(0.5, 0.8), timing(1, 1.3)];
    expect(findRevealedCount(t, 1)).toBe(3);
  });

  it("handles degenerate case where all words start at 0", () => {
    const t = [timing(0, 0.3), timing(0, 0.6), timing(0, 0.9)];
    expect(findRevealedCount(t, 0)).toBe(3);
  });

  it("returns 1 when currentTime equals exactly the first start", () => {
    const t = [timing(0, 0.5), timing(1, 1.5)];
    expect(findRevealedCount(t, 0)).toBe(1);
  });

  it("handles single-element array at boundary", () => {
    const t = [timing(0.5, 1)];
    expect(findRevealedCount(t, 0.5)).toBe(1);
    expect(findRevealedCount(t, 0.4)).toBe(0);
  });

  it("matches linear scan for a large array (100 words)", () => {
    const t: AudioWordTiming[] = Array.from({ length: 100 }, (_, i) =>
      timing(i * 0.1, i * 0.1 + 0.08)
    );

    for (const probe of [0, 0.05, 0.1, 2.55, 5.0, 9.9, 10.5]) {
      const expected = t.filter((w) => w.start <= probe).length;
      expect(findRevealedCount(t, probe)).toBe(expected);
    }
  });

  it("validates real-world timing data sample", () => {
    // Simulated ElevenLabs timing: "Sarah noticed the supplier"
    const t: AudioWordTiming[] = [
      { word: "Sarah", start: 0.0, end: 0.38 },
      { word: "noticed", start: 0.38, end: 0.75 },
      { word: "the", start: 0.75, end: 0.88 },
      { word: "supplier", start: 0.88, end: 1.35 },
    ];

    expect(findRevealedCount(t, 0)).toBe(1);    // "Sarah" revealed
    expect(findRevealedCount(t, 0.5)).toBe(2);   // + "noticed"
    expect(findRevealedCount(t, 0.87)).toBe(3);  // + "the"
    expect(findRevealedCount(t, 1.0)).toBe(4);   // + "supplier"
  });
});

// ---------------------------------------------------------------------------
// splitIntoParagraphs
// ---------------------------------------------------------------------------

describe("splitIntoParagraphs", () => {
  it("returns single paragraph for text without double newlines", () => {
    expect(splitIntoParagraphs("Hello world. This is a test.")).toEqual([
      "Hello world. This is a test.",
    ]);
  });

  it("splits on double newlines", () => {
    expect(splitIntoParagraphs("First paragraph.\n\nSecond paragraph.")).toEqual([
      "First paragraph.",
      "Second paragraph.",
    ]);
  });

  it("does not split on single newlines", () => {
    expect(splitIntoParagraphs("Line one.\nLine two.")).toEqual([
      "Line one.\nLine two.",
    ]);
  });

  it("handles triple+ newlines as a single break", () => {
    expect(splitIntoParagraphs("Para one.\n\n\nPara two.")).toEqual([
      "Para one.",
      "Para two.",
    ]);
  });

  it("trims whitespace from each paragraph", () => {
    expect(splitIntoParagraphs("  First.  \n\n  Second.  ")).toEqual([
      "First.",
      "Second.",
    ]);
  });

  it("returns empty array for empty/whitespace input", () => {
    expect(splitIntoParagraphs("")).toEqual([]);
    expect(splitIntoParagraphs("   ")).toEqual([]);
  });

  it("handles newline with spaces between as paragraph break", () => {
    expect(splitIntoParagraphs("A.\n  \nB.")).toEqual(["A.", "B."]);
  });
});

// ---------------------------------------------------------------------------
// getParagraphBreakWordIndices
// ---------------------------------------------------------------------------

describe("getParagraphBreakWordIndices", () => {
  it("returns empty set for single-paragraph text", () => {
    expect(getParagraphBreakWordIndices("Hello world.")).toEqual(new Set());
  });

  it("returns correct break index for two paragraphs", () => {
    // "Hello world." = 2 words, "Goodbye moon." = 2 words
    // Break at index 2 (start of second paragraph)
    expect(getParagraphBreakWordIndices("Hello world.\n\nGoodbye moon.")).toEqual(
      new Set([2])
    );
  });

  it("returns correct break indices for three paragraphs", () => {
    // "One two." = 2 words → break at 2
    // "Three four five." = 3 words → break at 5
    expect(
      getParagraphBreakWordIndices("One two.\n\nThree four five.\n\nSix.")
    ).toEqual(new Set([2, 5]));
  });

  it("returns empty set for empty text", () => {
    expect(getParagraphBreakWordIndices("")).toEqual(new Set());
  });
});

// ---------------------------------------------------------------------------
// calculateWordTiming — paragraph support
// ---------------------------------------------------------------------------

describe("calculateWordTiming — paragraphs", () => {
  it("assigns paragraphIndex 0 to all words in single-paragraph text", () => {
    const result = calculateWordTiming("Hello world. Goodbye.");
    expect(result.words.every((w) => w.paragraphIndex === 0)).toBe(true);
  });

  it("assigns correct paragraphIndex across paragraphs", () => {
    const result = calculateWordTiming("Hello world.\n\nGoodbye moon.");
    const indices = result.words.map((w) => w.paragraphIndex);
    // "Hello" "world." = paragraph 0, "Goodbye" "moon." = paragraph 1
    expect(indices).toEqual([0, 0, 1, 1]);
  });

  it("preserves sentence count across paragraphs", () => {
    const result = calculateWordTiming(
      "First. Second.\n\nThird. Fourth."
    );
    expect(result.sentenceCount).toBe(4);
  });

  it("maintains monotonic startTimes across paragraph boundaries", () => {
    const result = calculateWordTiming(
      "Para one sentence.\n\nPara two sentence."
    );
    for (let i = 1; i < result.words.length; i++) {
      expect(result.words[i].startTime).toBeGreaterThanOrEqual(
        result.words[i - 1].startTime
      );
    }
  });

  it("word count matches text regardless of paragraph breaks", () => {
    const text = "One two three.\n\nFour five.\n\nSix.";
    const result = calculateWordTiming(text);
    const expectedCount = text
      .replace(/\n/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;
    expect(result.words).toHaveLength(expectedCount);
  });
});
