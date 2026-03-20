#!/usr/bin/env node

/**
 * Generates warmup vignette audio via ElevenLabs TTS with word-level timestamps.
 * Mirrors the triarchic-databank audio_generator.py pipeline: builds composite text
 * from narrative + prompts (joined with " ... "), calls the with-timestamps endpoint,
 * converts character-level alignment to word-level timing with section tags.
 *
 * Outputs:
 *   - public/audio/warmup-vignette.mp3
 *   - src/lib/assessment/warmup-audio-timing.ts  (AudioWordTiming[] export)
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk-... node scripts/generate-warmup-audio.mjs
 *
 * Options:
 *   --voice-id <id>   ElevenLabs voice ID (default: pNInz6obpgDQGcFmaJgB = "Adam")
 *   --dry-run         Print timing data without writing files
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("Error: ELEVENLABS_API_KEY environment variable is required");
  process.exit(1);
}

const args = process.argv.slice(2);
const VOICE_ID =
  args[args.indexOf("--voice-id") + 1] || "pNInz6obpgDQGcFmaJgB";
const DRY_RUN = args.includes("--dry-run");

// ─── Warmup vignette text (must match warmup-content.ts) ─────────────

const NARRATIVE = `Every great company started with someone noticing something others missed. A frustration that everyone else accepted. A gap that nobody thought to fill. The founders who built the companies you use every day weren't born with some special gene for business — they just paid attention differently. They asked "why does it have to be this way?" when everyone else asked "where do I sign up?" Today, you're going to practice thinking like they do. You'll hear a short scenario, then answer three questions about it. There are no wrong answers — we're just interested in how you think.`;

const PROMPTS = [
  "What's something you've built or created that you're proud of?",
  "If you could start any business tomorrow, what would it be?",
  "What's one thing about you that most people wouldn't guess?",
];

const SECTION_SEPARATOR = " ... ";

// Build composite text and track section boundaries
const sections = [
  { name: "narrative", text: NARRATIVE },
  { name: "phase_1_prompt", text: PROMPTS[0] },
  { name: "phase_2_prompt", text: PROMPTS[1] },
  { name: "phase_3_prompt", text: PROMPTS[2] },
];

const compositeText = sections.map((s) => s.text).join(SECTION_SEPARATOR);

// ─── ElevenLabs API ─────────────────────────────────────────────────

async function generateWithTimestamps(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        speed: 1.0,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ElevenLabs API error ${res.status}: ${body}`);
  }

  return res.json();
}

// ─── Character → word timing (mirrors triarchic-databank) ───────────

function charsToWordTimings(alignment) {
  const {
    characters,
    character_start_times_seconds,
    character_end_times_seconds,
  } = alignment;

  const words = [];
  let currentWord = "";
  let wordStart = null;
  let prevEnd = null;

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    const start = character_start_times_seconds[i];
    const end = character_end_times_seconds[i];

    if (char === " ") {
      if (currentWord) {
        words.push({
          word: currentWord,
          start: Math.round(wordStart * 1000) / 1000,
          end: Math.round(prevEnd * 1000) / 1000,
        });
        currentWord = "";
        wordStart = null;
      }
    } else {
      if (!currentWord) wordStart = start;
      currentWord += char;
      prevEnd = end;
    }
  }

  if (currentWord && wordStart !== null) {
    words.push({
      word: currentWord,
      start: Math.round(wordStart * 1000) / 1000,
      end: Math.round(prevEnd * 1000) / 1000,
    });
  }

  return words;
}

// ─── Section tagging (mirrors triarchic-databank _tag_sections) ─────

function tagSections(wordTimings) {
  // Build character boundaries for each section in composite text
  const boundaries = [];
  let pos = 0;
  for (const { name, text } of sections) {
    const start = compositeText.indexOf(text, pos);
    const end = start + text.length;
    boundaries.push({ name, start, end });
    pos = end;
  }

  // Walk through words, tracking position in composite text
  let charCursor = 0;
  let sectionIdx = 0;

  for (const entry of wordTimings) {
    const wordStart = compositeText.indexOf(entry.word, charCursor);
    if (wordStart === -1) {
      // Fallback: keep current section
      entry.section = boundaries[sectionIdx].name;
      continue;
    }

    // Advance section if word starts past current section boundary
    while (
      sectionIdx < boundaries.length - 1 &&
      wordStart >= boundaries[sectionIdx].end
    ) {
      sectionIdx++;
    }

    entry.section = boundaries[sectionIdx].name;
    charCursor = wordStart + entry.word.length;
  }

  return wordTimings;
}

// ─── Main ───────────────────────────────────────────────────────────

const rootDir = resolve(import.meta.dirname, "..");
const audioOutPath = resolve(rootDir, "public/audio/warmup-vignette.mp3");
const timingOutPath = resolve(
  rootDir,
  "src/lib/assessment/warmup-audio-timing.ts"
);

console.log("Generating warmup vignette audio with timestamps...");
console.log(`Composite text: ${compositeText.length} chars`);
console.log(`Sections: ${sections.map((s) => s.name).join(", ")}`);

const response = await generateWithTimestamps(compositeText);

// Decode audio
const audioBytes = Buffer.from(response.audio_base64, "base64");
console.log(`Audio: ${(audioBytes.length / 1024).toFixed(1)} KB`);

// Build word timing with section tags
let wordTimings = charsToWordTimings(response.alignment);
wordTimings = tagSections(wordTimings);

const duration = wordTimings.at(-1)?.end ?? 0;
console.log(`Words: ${wordTimings.length}, Duration: ${duration.toFixed(2)}s`);

// Print section breakdown
for (const { name } of sections) {
  const sectionWords = wordTimings.filter((w) => w.section === name);
  const first = sectionWords[0];
  const last = sectionWords.at(-1);
  if (first && last) {
    console.log(
      `  ${name}: ${sectionWords.length} words, ${first.start.toFixed(2)}s - ${last.end.toFixed(2)}s`
    );
  }
}

if (!DRY_RUN) {
  // Write MP3
  writeFileSync(audioOutPath, audioBytes);
  console.log(`\nWrote audio: ${audioOutPath}`);

  // Write TypeScript timing file
  const tsContent = `// Auto-generated by scripts/generate-warmup-audio.mjs — do not edit manually.
// Regenerate: ELEVENLABS_API_KEY=sk-... node scripts/generate-warmup-audio.mjs

import type { AudioWordTiming } from "./narration-timer";

/** Word-level timing for the warmup vignette narration (narrative + 3 prompts). */
export const WARMUP_AUDIO_TIMING: AudioWordTiming[] = ${JSON.stringify(wordTimings, null, 2)};

/** Total audio duration in seconds. */
export const WARMUP_AUDIO_DURATION = ${duration.toFixed(3)};
`;

  writeFileSync(timingOutPath, tsContent);
  console.log(`Wrote timing: ${timingOutPath}`);
}

console.log("\nDone!");
