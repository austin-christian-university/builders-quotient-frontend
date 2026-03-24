#!/usr/bin/env node

/**
 * Extracts word-level timestamps from existing orb briefing MP3 files
 * using the OpenAI Whisper API. Outputs AudioWordTiming[] arrays
 * to paste into src/lib/assessment/orb-scripts.ts.
 *
 * This is a one-time script — results are checked into source.
 * It does NOT regenerate audio; it only transcribes existing files.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/extract-orb-timings.mjs
 *
 * Options:
 *   --file <name>   Process only one file (e.g., --file warmup-intro.mp3)
 *   --dry-run       Print raw API response without formatting
 */

import { readFileSync } from "node:fs";
import { resolve, basename } from "node:path";

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("Error: OPENAI_API_KEY environment variable is required");
  process.exit(1);
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const fileFilter = args.includes("--file")
  ? args[args.indexOf("--file") + 1]
  : null;

// ─── Files to process ────────────────────────────────────────────────
// CI_TRANSITION already has word timings from ElevenLabs — skip it.

const AUDIO_FILES = [
  {
    filename: "warmup-intro.mp3",
    constName: "WARMUP_INTRO_WORD_TIMINGS",
  },
  {
    filename: "warmup-transition.mp3",
    constName: "POST_WARMUP_WORD_TIMINGS",
  },
  {
    filename: "briefing-pre-exam.mp3",
    constName: "PRE_EXAM_WORD_TIMINGS",
  },
];

const publicAudioDir = resolve(import.meta.dirname, "../public/audio");

// ─── Whisper API ─────────────────────────────────────────────────────

async function transcribeWithTimestamps(filePath) {
  const fileBuffer = readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: "audio/mpeg" });

  const formData = new FormData();
  formData.append("file", blob, basename(filePath));
  formData.append("model", "whisper-1");
  formData.append("response_format", "verbose_json");
  formData.append("timestamp_granularities[]", "word");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Whisper API error ${res.status}: ${body}`);
  }

  return res.json();
}

// ─── Main ────────────────────────────────────────────────────────────

const filesToProcess = fileFilter
  ? AUDIO_FILES.filter((f) => f.filename === fileFilter)
  : AUDIO_FILES;

if (filesToProcess.length === 0) {
  console.error(`No matching file found for: ${fileFilter}`);
  console.error(`Available: ${AUDIO_FILES.map((f) => f.filename).join(", ")}`);
  process.exit(1);
}

for (const file of filesToProcess) {
  const filePath = resolve(publicAudioDir, file.filename);
  console.log(`\n--- ${file.constName} ---`);
  console.log(`Transcribing ${filePath}...`);

  const response = await transcribeWithTimestamps(filePath);

  if (DRY_RUN) {
    console.log(JSON.stringify(response, null, 2));
    continue;
  }

  const words = response.words;
  if (!words || words.length === 0) {
    console.error(`No word-level timestamps returned for ${file.filename}`);
    continue;
  }

  const duration = words.at(-1)?.end ?? 0;
  console.log(`Words: ${words.length}, Duration: ${duration.toFixed(2)}s`);

  // Print TypeScript-ready word timing array
  console.log(
    `\n// ${file.constName} (${words.length} words, ${duration.toFixed(2)}s)`
  );
  console.log(
    `// Paste into orb-scripts.ts`
  );
  console.log(`const ${file.constName}: AudioWordTiming[] = [`);
  for (const w of words) {
    const start = Math.round(w.start * 1000) / 1000;
    const end = Math.round(w.end * 1000) / 1000;
    console.log(
      `  { word: ${JSON.stringify(w.word)}, start: ${start}, end: ${end} },`
    );
  }
  console.log(`];`);

  // Rate limit between files
  if (filesToProcess.indexOf(file) < filesToProcess.length - 1) {
    console.log("\nWaiting 1s for rate limit...");
    await new Promise((r) => setTimeout(r, 1000));
  }
}

console.log(
  "\nDone! Paste the word timing arrays into src/lib/assessment/orb-scripts.ts."
);
