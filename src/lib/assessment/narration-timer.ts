/** Per-word timing from ElevenLabs TTS alignment, stored in the DB. */
export type AudioWordTiming = {
  word: string;
  start: number; // seconds
  end: number;   // seconds
  section?: AudioSection;
};

export type AudioSection = "narrative" | "phase_1_prompt" | "phase_2_prompt" | "phase_3_prompt";

/** Boundary info for a section within the audio timing array. */
export type SectionBoundary = {
  section: AudioSection;
  startIdx: number;
  endIdx: number; // inclusive
  audioStart: number;
  audioEnd: number;
};

/**
 * Groups AudioWordTiming entries by their `section` field and returns
 * the index range and time range for each section found.
 */
export function getSectionBoundaries(
  timings: AudioWordTiming[]
): SectionBoundary[] {
  if (timings.length === 0) return [];

  const boundaries: SectionBoundary[] = [];
  let currentSection = timings[0].section ?? "narrative";
  let startIdx = 0;

  for (let i = 1; i <= timings.length; i++) {
    const section = i < timings.length ? (timings[i].section ?? "narrative") : null;
    if (section !== currentSection) {
      boundaries.push({
        section: currentSection,
        startIdx,
        endIdx: i - 1,
        audioStart: timings[startIdx].start,
        audioEnd: timings[i - 1].end,
      });
      if (section !== null) {
        currentSection = section;
        startIdx = i;
      }
    }
  }

  return boundaries;
}

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
  paragraphIndex: number;
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
  const paragraphs = splitIntoParagraphs(text);
  if (paragraphs.length === 0) {
    return { words: [], totalDuration: 0, sentenceCount: 0 };
  }

  // Build sentences with paragraph tracking
  const allSentences: { text: string; paragraphIndex: number }[] = [];
  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    for (const s of splitIntoSentences(paragraphs[pIdx])) {
      allSentences.push({ text: s, paragraphIndex: pIdx });
    }
  }

  if (allSentences.length === 0) {
    return { words: [], totalDuration: 0, sentenceCount: 0 };
  }

  const sentenceWords = allSentences.map((s) => splitIntoWords(s.text));
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
        paragraphIndex: allSentences[sentenceIndex].paragraphIndex,
        isFirstInSentence: wordIndex === 0,
        isLastInSentence: wordIndex === ws.length - 1,
      });
      globalIndex++;
    });
  });

  return { words, totalDuration, sentenceCount: allSentences.length };
}

/**
 * Binary search: given sorted AudioWordTiming[], returns how many words
 * have a `start` time <= `currentTime`.  O(log n).
 */
export function findRevealedCount(
  timings: AudioWordTiming[],
  currentTime: number
): number {
  if (timings.length === 0 || currentTime < 0) return 0;

  let lo = 0;
  let hi = timings.length - 1;
  let count = 0;

  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (timings[mid].start <= currentTime) {
      count = mid + 1;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return count;
}

/**
 * Splits text into paragraphs on double-newline boundaries.
 * Single newlines are preserved within paragraphs.
 * Text without double newlines returns as a single paragraph.
 */
export function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Returns a Set of word indices (0-based within a flat word list) where
 * a new paragraph begins. Used in audio mode to insert visual paragraph breaks.
 * Words are counted by whitespace splitting, matching how audio timing entries
 * correspond to the source text.
 */
export function getParagraphBreakWordIndices(text: string): Set<number> {
  const paragraphs = splitIntoParagraphs(text);
  if (paragraphs.length <= 1) return new Set();

  const breaks = new Set<number>();
  let wordCount = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    if (i > 0) breaks.add(wordCount);
    wordCount += paragraphs[i].split(/\s+/).filter(Boolean).length;
  }
  return breaks;
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
 *
 * Handles edge cases where a period is NOT a sentence boundary:
 * - Decimal numbers: $1.4, 3.5%, 0.8s
 * - Abbreviations: U.S., e.g., i.e., Dr., Mr., etc.
 * - Quoted endings: "back to basics." keeps the closing quote with the sentence
 */
function splitIntoSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Protect patterns where a period is NOT a sentence boundary
  const PLACEHOLDER = "\u0000";
  const protected_ = trimmed
    // Decimal numbers: digit.digit
    .replace(/(\d)\.(\d)/g, `$1${PLACEHOLDER}$2`)
    // Common abbreviations: single uppercase letter followed by period (U.S., U.K.)
    .replace(/\b([A-Z])\.([A-Z])\./g, `$1${PLACEHOLDER}$2${PLACEHOLDER}`)
    // Common short abbreviations: e.g., i.e., vs., etc., Dr., Mr., Mrs., Ms., Jr., Sr.
    .replace(
      /\b(e\.g|i\.e|vs|etc|[DdMm]rs?|[Jj]r|[Ss]r)\./g,
      (match) => match.replace(/\./g, PLACEHOLDER)
    );

  // Split on sentence-ending punctuation, consuming any trailing closing
  // quotes/brackets (e.g. "basics." or 'basics!') so they stay with the sentence.
  const CLOSING_QUOTES = `["'\u201D\u2019)\\]]*`;
  const raw = protected_.match(
    new RegExp(`[^.!?]*[.!?]+${CLOSING_QUOTES}[\\s]?|[^.!?]+$`, "g")
  );
  if (!raw) return [trimmed].filter(Boolean);

  return raw
    .map((s) => s.replace(/\u0000/g, ".").trim())
    .filter(Boolean);
}
