/**
 * Splits text into sentences and calculates reveal timing.
 * Target pace: ~150 WPM (2.5 words/second).
 * Each sentence gets a start time and duration proportional to its word count.
 */
export type NarrationSegment = {
  text: string;
  startTime: number;
  duration: number;
};

export function calculateNarrationTiming(
  text: string,
  overrideDurationSeconds?: number | null
): { segments: NarrationSegment[]; totalDuration: number } {
  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) {
    return { segments: [], totalDuration: 0 };
  }

  const wordCounts = sentences.map(
    (s) => s.split(/\s+/).filter(Boolean).length
  );
  const totalWords = wordCounts.reduce((a, b) => a + b, 0);

  // Use override if provided, otherwise calculate from word count
  const totalDuration =
    overrideDurationSeconds != null && overrideDurationSeconds > 0
      ? overrideDurationSeconds
      : totalWords / 2.5;

  let elapsed = 0;
  const segments: NarrationSegment[] = sentences.map((text, i) => {
    const proportion = totalWords > 0 ? wordCounts[i] / totalWords : 1 / sentences.length;
    const duration = totalDuration * proportion;
    const segment: NarrationSegment = {
      text,
      startTime: elapsed,
      duration,
    };
    elapsed += duration;
    return segment;
  });

  return { segments, totalDuration };
}

/**
 * Splits text into sentences on period, question mark, or exclamation mark
 * followed by a space or end of string. Preserves the punctuation with the sentence.
 */
function splitIntoSentences(text: string): string[] {
  const raw = text.match(/[^.!?]*[.!?]+[\s]?|[^.!?]+$/g);
  if (!raw) return [text.trim()].filter(Boolean);
  return raw.map((s) => s.trim()).filter(Boolean);
}
