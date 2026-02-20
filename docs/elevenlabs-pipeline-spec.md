# ElevenLabs Audio Narration Pipeline Spec

> Handoff spec for the `triarchic-databank` Python pipeline.
> Generates TTS audio + word-level timing for vignette narration.

## Supabase Storage Bucket

Create a **`vignette-audio`** bucket in Supabase (private, signed URLs for access). The frontend generates signed download URLs server-side.

## Pipeline Logic

```
For each row in pi_vignettes and ci_vignettes
  WHERE audio_storage_path IS NULL:

1. Call ElevenLabs non-streaming with-timestamps endpoint:
   POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps
   Body: {
     "text": row.vignette_text,
     "model_id": "eleven_multilingual_v2",
     "output_format": "mp3_44100_128",
     "voice_settings": {
       "stability": 0.5,
       "similarity_boost": 0.75,
       "style": 0.0,
       "speed": 1.0
     }
   }

2. Response contains:
   - audio_base64: base64-encoded MP3 bytes
   - alignment: {
       characters: string[],
       character_start_times_seconds: number[],
       character_end_times_seconds: number[]
     }

3. Decode audio: audio_bytes = base64.b64decode(response.audio_base64)

4. Convert character alignment to word timing:
   Group characters between spaces into words.
   Each word gets: { "word": str, "start": float, "end": float }
   where start = first char's start time, end = last char's end time.
   Result is a JSON array: [{"word":"Born","start":0.0,"end":0.35}, ...]

5. Upload audio to Supabase Storage:
   Bucket: "vignette-audio"
   Path: "pi/{vignette_id}.mp3" or "ci/{vignette_id}.mp3"

6. Update the vignette row:
   SET audio_storage_path = storage path from step 5,
       audio_timing = JSON array from step 4,
       estimated_narration_seconds = last word's end time
```

## Python Pseudocode

```python
from elevenlabs import ElevenLabs
import base64, json
from supabase import create_client

VOICE_ID = "..."  # choose a calm, authoritative narrator voice
elevenlabs = ElevenLabs(api_key=ELEVENLABS_API_KEY)
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def process_vignette(table: str, row):
    # 1. Generate TTS with timestamps
    response = elevenlabs.text_to_speech.convert_with_timestamps(
        voice_id=VOICE_ID,
        text=row["vignette_text"],
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128",
        voice_settings={
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.0,
            "speed": 1.0,
        },
    )

    # 2. Decode audio
    audio_bytes = base64.b64decode(response.audio_base64)

    # 3. Convert character timing -> word timing
    word_timing = chars_to_words(response.alignment)

    # 4. Upload audio to Supabase Storage
    prefix = "pi" if table == "pi_vignettes" else "ci"
    storage_path = f"{prefix}/{row['id']}.mp3"
    supabase.storage.from_("vignette-audio").upload(
        storage_path, audio_bytes,
        {"content-type": "audio/mpeg"}
    )

    # 5. Update vignette row
    duration = word_timing[-1]["end"] if word_timing else 0
    supabase.table(table).update({
        "audio_storage_path": storage_path,
        "audio_timing": word_timing,
        "estimated_narration_seconds": round(duration, 2),
    }).eq("id", row["id"]).execute()


def chars_to_words(alignment) -> list[dict]:
    chars = alignment.characters
    starts = alignment.character_start_times_seconds
    ends = alignment.character_end_times_seconds

    words = []
    current_word = ""
    word_start = None
    prev_end = None

    for char, start, end in zip(chars, starts, ends):
        if char == " ":
            if current_word:
                words.append({
                    "word": current_word,
                    "start": round(word_start, 3),
                    "end": round(prev_end, 3),
                })
                current_word = ""
                word_start = None
        else:
            if not current_word:
                word_start = start
            current_word += char
            prev_end = end

    if current_word:
        words.append({
            "word": current_word,
            "start": round(word_start, 3),
            "end": round(prev_end, 3),
        })

    return words


# Main: process all unprocessed vignettes
for table in ["pi_vignettes", "ci_vignettes"]:
    rows = supabase.table(table)\
        .select("id, vignette_text")\
        .is_("audio_storage_path", "null")\
        .execute().data

    for row in rows:
        process_vignette(table, row)
```

## Expected `audio_timing` Shape in DB

```json
[
  {"word": "Marcus", "start": 0.000, "end": 0.465},
  {"word": "had", "start": 0.511, "end": 0.674},
  {"word": "always", "start": 0.720, "end": 1.023},
  {"word": "been", "start": 1.069, "end": 1.255}
]
```

## Frontend TypeScript Type

The frontend expects this shape (defined in `src/lib/assessment/narration-timer.ts`):

```ts
type AudioWordTiming = {
  word: string;
  start: number; // seconds
  end: number;   // seconds
};
```

The `audio_timing` column is `jsonb` and should contain an array of these objects.
