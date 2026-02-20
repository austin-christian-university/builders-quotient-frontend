/** Per-word timing from ElevenLabs TTS alignment, stored in the DB. */
export type AudioWordTiming = {
  word: string;
  start: number; // seconds
  end: number;   // seconds
};

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

export type WordTiming = {
  text: string;
  startTime: number;
  sentenceIndex: number;
  isFirstInSentence: boolean;
  isLastInSentence: boolean;
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
 * Calculates per-word timing as a continuous stream with no pauses between
 * sentences. Words are evenly spaced across the total duration.
 * Target pace: ~1.6 words/second (~96 WPM) for a calm reading cadence.
 */
const WORDS_PER_SECOND = 1.6;

export function calculateWordTiming(
  text: string,
  overrideDurationSeconds?: number | null
): { words: WordTiming[]; totalDuration: number; sentenceCount: number } {
  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) {
    return { words: [], totalDuration: 0, sentenceCount: 0 };
  }

  const sentenceWords = sentences.map((s) => splitIntoWords(s));
  const totalWords = sentenceWords.reduce((sum, ws) => sum + ws.length, 0);

  const totalDuration =
    overrideDurationSeconds != null && overrideDurationSeconds > 0
      ? overrideDurationSeconds
      : totalWords / WORDS_PER_SECOND;

  // Flatten all words into one continuous sequence
  const words: WordTiming[] = [];
  let globalIndex = 0;

  sentenceWords.forEach((ws, sentenceIndex) => {
    ws.forEach((word, wordIndex) => {
      words.push({
        text: word,
        startTime: totalWords > 1 ? (globalIndex / (totalWords - 1)) * totalDuration : 0,
        sentenceIndex,
        isFirstInSentence: wordIndex === 0,
        isLastInSentence: wordIndex === ws.length - 1,
      });
      globalIndex++;
    });
  });

  return { words, totalDuration, sentenceCount: sentences.length };
}

/**
 * Splits a sentence into words, preserving punctuation attached to words.
 */
function splitIntoWords(sentence: string): string[] {
  return sentence.split(/\s+/).filter(Boolean);
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
