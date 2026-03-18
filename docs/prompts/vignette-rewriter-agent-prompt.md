# Task: Build a Vignette Rewriter Script

## Objective

Create a Python script that rewrites psychometric assessment vignettes to reduce **construct-irrelevant variance**. The vignettes describe real business scenarios that test problem-solving ability. The current language is too dense — students spend cognitive effort parsing the text instead of reasoning about the problem. The rewritten versions must be **linguistically simple but conceptually unchanged**.

The target is NYT-style prose: 5th-grade reading level vocabulary and sentence structure, but the business situations, stakeholders, tradeoffs, and ambiguity remain fully intact.

## What This Script Does

1. Connects to a Supabase database and reads vignette records from `pi_vignettes` and `ci_vignettes` tables
2. For each vignette, sends the `vignette_text`, `phase_1_prompt`, `phase_2_prompt`, and `phase_3_prompt` to Claude API for rewriting
3. Validates the rewrite against readability metrics (Flesch-Kincaid grade level ≤ 6.0)
4. Writes the rewritten versions to a local JSON output file for human review (does NOT write back to the database)

## Environment

- Python 3.11+
- Dependencies: `anthropic`, `supabase`, `textstat` (for readability scoring)
- Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
- Output: `rewritten_vignettes.json` containing original and rewritten text side-by-side, plus readability scores for both versions

## Database Schema (Read-Only)

```sql
-- pi_vignettes (Practical Intelligence)
id              UUID PRIMARY KEY
vignette_text   TEXT        -- The main scenario narrative (THIS IS WHAT GETS REWRITTEN)
phase_1_prompt  TEXT        -- First response question
phase_2_prompt  TEXT        -- Second response question (nullable)
phase_3_prompt  TEXT        -- Third response question (nullable)
situation_type  TEXT        -- e.g., "Market Entry", "Team Conflict"
active          BOOLEAN

-- ci_vignettes (Creative Intelligence) — same structure
-- except situation_type is called episode_type
```

## The Core Rewriting Prompt (use this as the system/user prompt sent to Claude API)

This is the most critical part of the script. Use this prompt verbatim as the foundation, adapting only the mechanical parts (inserting the vignette text):

```
You are rewriting a psychometric assessment vignette. Your goal is to make the LANGUAGE simple while keeping the SITUATION complex.

## Why This Matters

This vignette is read aloud to a student over 90 seconds. They then have 75 seconds to respond on camera. If they waste mental energy decoding dense sentences, we measure their reading ability — not their problem-solving ability. That is a measurement error called construct-irrelevant variance.

## Rules — Follow ALL of These

### Language Rules
1. Target a Flesch-Kincaid grade level of 5.0–6.0
2. Sentences: 8–15 words average. Maximum 20 words. No exceptions.
3. One idea per sentence. Never stack clauses with semicolons or em-dashes.
4. Use common, concrete words. Replace any word a 10-year-old wouldn't know.
5. Active voice only. Never use passive constructions.
6. No nominalization — use verbs, not noun forms of verbs (say "decide" not "make a decision", say "grow" not "achieve growth")
7. No jargon, business-speak, or academic language unless a simpler word genuinely doesn't exist. When domain terms are necessary (like "supplier" or "patent"), use them — but only if a plain English alternative would be less clear.
8. Contractions are fine and encouraged. "They'd" > "They would". "Isn't" > "Is not".
9. Cut filler: remove "however", "moreover", "furthermore", "in addition", "essentially", "ultimately", "fundamentally", "it is worth noting that", "it should be noted", "the fact that".

### Content Rules (What MUST Stay the Same)
10. Same number of people/characters. Same names. Same roles.
11. Same core conflict, tension, or decision point.
12. Same stakeholders who are affected.
13. Same constraints (money, time, people, legal, etc.)
14. Same ambiguity — do NOT resolve tensions or make the "right answer" more obvious.
15. Same scale of the problem (don't shrink a company-wide crisis to a team issue).
16. If the original mentions specific numbers ($500K, 6 months, 40 employees), keep them exactly.
17. Keep the same chronological structure and information ordering.

### Structural Rules
18. The rewrite must be SHORTER than the original. Cut 15–30% of the word count.
19. Front-load the situation. The reader should understand "who, what, and why it's hard" within the first 3 sentences.
20. Each paragraph should be 2–4 sentences maximum.
21. End on the open tension — the thing the student must respond to.

## Examples

### BEFORE (too dense):
"Having recently transitioned from a regional distribution model to direct-to-consumer e-commerce, Priya's company was experiencing significant operational challenges. The fulfillment infrastructure, which had been designed to handle bulk wholesale shipments, was fundamentally ill-suited for the high volume of individual customer orders that the new model demanded. Customer complaints regarding delayed deliveries were escalating, and the company's Net Promoter Score had declined by 23 points over the preceding quarter."

### AFTER (simplified, same situation):
"Priya's company used to ship big orders to stores. Six months ago, they switched to selling straight to customers online. But their warehouse was built for bulk shipping, not thousands of small packages. Deliveries started showing up late. Customers were angry. Their satisfaction score dropped 23 points in three months."

### Why the AFTER version works:
- Same facts: company pivot, warehouse mismatch, customer impact, 23-point drop
- Shorter sentences (avg 11 words vs 28)
- No jargon: "direct-to-consumer e-commerce" → "selling straight to customers online"
- No nominalization: "experiencing significant operational challenges" → specific concrete problems
- The problem is equally hard to solve — language simplicity didn't simplify the dilemma

### ANTI-EXAMPLE — Too simplified (DON'T do this):
"Priya's company changed how they ship things. Now customers are upset. She needs to fix it."

### Why this fails:
- Lost the warehouse-mismatch constraint (critical for reasoning)
- Lost the quantified impact (23 points)
- Lost the transition context (regional → DTC)
- Made the problem feel trivially simple, not just simply stated

### ANTI-EXAMPLE — Still too dense (DON'T do this):
"Having transitioned to a direct-to-consumer model, Priya found that her legacy fulfillment infrastructure was creating operational bottlenecks, resulting in customer satisfaction erosion."

### Why this fails:
- "legacy fulfillment infrastructure" — jargon
- "operational bottlenecks" — vague abstraction
- "customer satisfaction erosion" — nominalization
- Still one overloaded sentence doing too much work

## Prompt-Specific Rules

For `phase_1_prompt`, `phase_2_prompt`, `phase_3_prompt`:
- These are questions asked to the student. Keep them to 1-2 sentences max.
- Be direct: "What would you do first?" not "Given the circumstances described above, what initial course of action would you recommend pursuing?"
- The question must not hint at a correct answer or framework.

## Output Format

Return ONLY a JSON object with these keys:
{
  "vignette_text": "rewritten scenario text",
  "phase_1_prompt": "rewritten question or null if original is null",
  "phase_2_prompt": "rewritten question or null if original is null",
  "phase_3_prompt": "rewritten question or null if original is null",
  "changelog": ["list of specific changes you made and why"]
}
```

## Script Structure

```
vignette_rewriter/
├── rewrite.py          # Main script — CLI entry point
├── prompts.py          # Contains the rewriting prompt template above
├── readability.py      # Flesch-Kincaid validation using textstat
└── rewritten_vignettes.json  # Output (generated)
```

### `rewrite.py` Behavior

1. Parse CLI args: `--dry-run` (default, print but don't write file), `--output rewritten_vignettes.json`
2. Connect to Supabase, fetch all active vignettes from both tables
3. For each vignette:
   a. Send to Claude API (claude-sonnet-4-6, temperature 0.3) with the rewriting prompt
   b. Parse the JSON response
   c. Run Flesch-Kincaid on the rewritten `vignette_text`
   d. If FK grade > 6.0, retry once with an additional instruction: "The grade level is {score}. Simplify further while keeping all facts."
   e. Store result with: original text, rewritten text, original FK score, rewritten FK score, changelog
4. Write all results to JSON output file
5. Print a summary table to stdout: vignette ID, type (PI/CI), original word count, new word count, % reduction, original FK grade, new FK grade, pass/fail

### `readability.py`

Use the `textstat` library. Expose two functions:
- `flesch_kincaid_grade(text: str) -> float`
- `validate_readability(text: str, max_grade: float = 6.0) -> tuple[bool, float]`

### Output JSON Format

```json
[
  {
    "id": "uuid",
    "table": "pi_vignettes",
    "situation_type": "Market Entry",
    "original": {
      "vignette_text": "...",
      "phase_1_prompt": "...",
      "phase_2_prompt": "...",
      "phase_3_prompt": null,
      "flesch_kincaid_grade": 11.2,
      "word_count": 245
    },
    "rewritten": {
      "vignette_text": "...",
      "phase_1_prompt": "...",
      "phase_2_prompt": "...",
      "phase_3_prompt": null,
      "flesch_kincaid_grade": 5.4,
      "word_count": 178,
      "changelog": ["..."]
    },
    "validation": {
      "readability_pass": true,
      "word_count_reduction_pct": 27.3
    }
  }
]
```

## Constraints

- Do NOT write back to the database. This is a review-first workflow. Output is JSON only.
- Use `claude-sonnet-4-6` (model ID: `claude-sonnet-4-6`) for the rewriting calls. It's sufficient for this editorial task and cheaper than Opus.
- Set `max_tokens: 4096` on API calls.
- Add a 1-second delay between API calls to avoid rate limiting.
- Use the Anthropic Python SDK (`anthropic` package), not raw HTTP.
- The script should be idempotent — running it twice produces the same output file (overwritten, not appended).
- Include error handling: if a vignette fails to rewrite or validate, log the error and continue to the next one. Don't crash the whole run.
- Print progress to stdout as each vignette is processed.
