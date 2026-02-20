import { describe, it, expect } from "vitest";
import { calculateNarrationTiming } from "./narration-timer";

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
