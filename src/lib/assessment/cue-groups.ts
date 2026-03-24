import type { AudioWordTiming } from "./narration-timer";
import type { OrbCaption } from "./orb-scripts";

export type CueGroup = {
  words: AudioWordTiming[];
  startTime: number;
  endTime: number;
};

const MAX_WORDS = 30;
const MAX_DURATION_SECONDS = 8;
const ORPHAN_THRESHOLD = 3;
const SENTENCE_END_PATTERN = /[.!?][\u201D\u2019"')\]]*$/;

/**
 * Restores punctuation to Whisper-generated word timings by matching them
 * against the original caption text (which has full punctuation).
 *
 * Whisper often strips periods, commas, and other punctuation from words.
 * This walks both arrays in parallel, matching by lowercase word stem,
 * and replaces each timing's `word` with the punctuated version from captions.
 */
export function reconcileWithCaptions(
  timings: AudioWordTiming[],
  captions: OrbCaption[],
): AudioWordTiming[] {
  // Join all caption text, split hyphenated words, and filter standalone punctuation
  const captionText = captions.map((c) => c.text).join(" ");
  const captionWords = captionText
    .split(/\s+/)
    .flatMap(splitHyphenated)
    .filter((w) => stripPunctuation(w).length > 0);

  const result: AudioWordTiming[] = [];
  let captionIdx = 0;

  for (const timing of timings) {
    const timingStripped = stripPunctuation(timing.word).toLowerCase();

    // Try to find a matching caption word near the current position
    let matched = false;
    for (let offset = 0; offset < 5 && captionIdx + offset < captionWords.length; offset++) {
      const candidateStripped = stripPunctuation(captionWords[captionIdx + offset]).toLowerCase();
      if (candidateStripped === timingStripped) {
        result.push({ ...timing, word: captionWords[captionIdx + offset] });
        captionIdx += offset + 1;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // No match found — keep original word
      result.push(timing);
      // Still advance caption index if we can loosely match
      if (captionIdx < captionWords.length) captionIdx++;
    }
  }

  return result;
}

function stripPunctuation(word: string): string {
  return word.replace(/[.,;:!?"'\u2014\u2013\u2019\u201C\u201D()\[\]]/g, "");
}

/**
 * Splits hyphenated words so they can match Whisper output which treats
 * them as separate words. Trailing punctuation sticks to the last part.
 * e.g. "real-world" → ["real", "world"]
 *      "real-world." → ["real", "world."]
 */
function splitHyphenated(word: string): string[] {
  if (!word.includes("-")) return [word];
  return word.split("-");
}

/**
 * Splits word timings into subtitle-style cue groups, breaking at sentence
 * endings (periods, !, ?). Each cue group represents one "subtitle card"
 * that is fully laid out before words begin revealing.
 *
 * Algorithm:
 * - Accumulate words into the current cue group.
 * - Break when hitting a sentence-ending word (ends with . ! ?).
 * - Force-break at MAX_WORDS or MAX_DURATION_SECONDS if no sentence end found.
 */
export function buildCueGroups(
  timings: AudioWordTiming[],
  captions?: OrbCaption[],
): CueGroup[] {
  const words = captions
    ? reconcileWithCaptions(timings, captions)
    : timings;

  if (words.length === 0) return [];

  const groups: CueGroup[] = [];
  let currentWords: AudioWordTiming[] = [];

  for (let i = 0; i < words.length; i++) {
    currentWords.push(words[i]);

    const cueDuration =
      currentWords[currentWords.length - 1].end - currentWords[0].start;
    const wordCount = currentWords.length;
    const atSentenceEnd = SENTENCE_END_PATTERN.test(words[i].word);

    const shouldBreak =
      wordCount >= MAX_WORDS ||
      cueDuration >= MAX_DURATION_SECONDS ||
      atSentenceEnd;

    if (shouldBreak) {
      groups.push({
        words: currentWords,
        startTime: currentWords[0].start,
        endTime: currentWords[currentWords.length - 1].end,
      });
      currentWords = [];
    }
  }

  // Flush remaining words
  if (currentWords.length > 0) {
    // Merge orphan tails (≤3 words) into the previous group
    if (currentWords.length <= ORPHAN_THRESHOLD && groups.length > 0) {
      const prev = groups[groups.length - 1];
      prev.words = [...prev.words, ...currentWords];
      prev.endTime = currentWords[currentWords.length - 1].end;
    } else {
      groups.push({
        words: currentWords,
        startTime: currentWords[0].start,
        endTime: currentWords[currentWords.length - 1].end,
      });
    }
  }

  return groups;
}
