#!/usr/bin/env node

/**
 * Generates briefing audio via ElevenLabs TTS with word-level timestamps.
 * Outputs MP3 files to public/audio/ and prints AudioWordTiming[] arrays
 * to paste into src/lib/assessment/orb-scripts.ts.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk-... node scripts/generate-briefing-timestamps.mjs
 *
 * Options:
 *   --voice-id <id>   ElevenLabs voice ID (default: pNInz6obpgDQGcFmaJgB = "Adam")
 *   --dry-run         Print timing data without writing audio files
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

// ─── Briefing scripts (must match orb-scripts.ts captions) ──────────

const SCRIPTS = [
  {
    name: "PRE_EXAM",
    filename: "briefing-pre-exam.mp3",
    text: [
      "Hey, welcome! Before you dive in, let\u2019s give you a walkthrough of what\u2019s about to happen. You\u2019re about to hear four scenarios drawn from the lives of real entrepreneurs. The first two will be about problem solving, the second two will be about seeing opportunities!",
      "Each scenario follows the same rhythm: you\u2019ll hear the story narrated to you, then respond in three phases \u2014 understand, analyze, and communicate. You\u2019ll also get some time to think before each response!",
      "There are no right answers here. We\u2019re looking at how you think, not what you know. A thoughtful wrong answer beats a lucky right one every time.",
      "These first two are for practical intelligence \u2014 your ability to tackle big problems! Your job is to reason through them like you\u2019re in the room. Ask questions, challenge assumptions, think out loud.",
      "Narrate your thinking as it happens. If you\u2019re unsure, say so. If you\u2019d want more info, tell us what and why. The more you externalize your process, the richer your profile.",
      "Alright, you\u2019re ready. Let\u2019s go.",
    ].join(" "),
  },
  {
    name: "CI_TRANSITION",
    filename: "briefing-ci-transition.mp3",
    text: [
      "Nice work on those first two. Take a breath.",
      "Your next two scenarios are going to feel different! They\u2019re about creative intelligence \u2014 which is all about seeing opportunities in the world. Instead of problems to solve, you\u2019ll hear about real market situations. Your job isn\u2019t to fix anything \u2014 it\u2019s to spot opportunities. Think like an entrepreneur scanning for what\u2019s possible, not what\u2019s broken.",
      "So brainstorm and say out loud whatever comes to mind! You should be trying to connect dots and finding ways to win the market. The wilder the idea, the better \u2014 as long as you can explain your reasoning.",
      "Alright, two more to go. Let\u2019s see how you think when the canvas is blank. Are you ready?",
    ].join(" "),
  },
];

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

// ─── Character → word timing (mirrors triarchic-databank logic) ─────

function charsToWordTimings(alignment) {
  const { characters, character_start_times_seconds, character_end_times_seconds } =
    alignment;

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

  if (currentWord) {
    words.push({
      word: currentWord,
      start: Math.round(wordStart * 1000) / 1000,
      end: Math.round(prevEnd * 1000) / 1000,
    });
  }

  return words;
}

// ─── Main ───────────────────────────────────────────────────────────

const publicAudioDir = resolve(import.meta.dirname, "../public/audio");

for (const script of SCRIPTS) {
  console.log(`\n--- ${script.name} ---`);
  console.log(`Generating audio with timestamps for ${script.filename}...`);

  const response = await generateWithTimestamps(script.text);

  // Decode audio
  const audioBytes = Buffer.from(response.audio_base64, "base64");
  console.log(`Audio: ${(audioBytes.length / 1024).toFixed(1)} KB`);

  // Extract word timing
  const wordTimings = charsToWordTimings(response.alignment);
  const duration = wordTimings.at(-1)?.end ?? 0;
  console.log(`Words: ${wordTimings.length}, Duration: ${duration.toFixed(2)}s`);

  // Write audio file
  if (!DRY_RUN) {
    const outPath = resolve(publicAudioDir, script.filename);
    writeFileSync(outPath, audioBytes);
    console.log(`Wrote: ${outPath}`);
  }

  // Print TypeScript-ready word timing array
  console.log(`\n// ${script.name} wordTimings (${wordTimings.length} words, ${duration.toFixed(2)}s)`);
  console.log(`// Paste into orb-scripts.ts to replace deriveWordTimings() call`);
  console.log(`const ${script.name}_WORD_TIMINGS: AudioWordTiming[] = [`);
  for (const w of wordTimings) {
    console.log(
      `  { word: ${JSON.stringify(w.word)}, start: ${w.start}, end: ${w.end} },`
    );
  }
  console.log(`];`);

  // Also print caption boundaries for updating orb-scripts.ts
  console.log(`\n// Suggested caption boundaries (listen to audio to verify):`);
  let captionStart = 0;
  const sentences = script.text.split(/(?<=[.!?])\s+/);
  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).filter(Boolean);
    const firstWord = wordTimings.find((w) => w.word === sentenceWords[0] && w.start >= captionStart - 0.1);
    const lastWordText = sentenceWords.at(-1);
    const lastWord = wordTimings.findLast((w) => w.word === lastWordText && w.start >= captionStart - 0.1);
    if (firstWord && lastWord) {
      console.log(
        `//   { startTime: ${firstWord.start}, endTime: ${lastWord.end}, text: "${sentence.substring(0, 60)}..." }`
      );
      captionStart = lastWord.end;
    }
  }

  // Rate limit
  if (SCRIPTS.indexOf(script) < SCRIPTS.length - 1) {
    console.log("\nWaiting 1s for rate limit...");
    await new Promise((r) => setTimeout(r, 1000));
  }
}

console.log("\nDone! Update orb-scripts.ts with the word timing arrays above.");
