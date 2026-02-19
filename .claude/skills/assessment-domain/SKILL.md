---
name: assessment-domain
description: Assessment domain model and scoring logic. Use when working with the assessment flow, vignettes, personality quiz, scoring, or any assessment-related business logic.
user-invocable: false
---

# Assessment Domain Model

## Assessment Flow Order

```
Intake → Practical Intelligence → Creative Intelligence → Personality → Results
```

Intelligence assessments come first (more cognitively demanding), personality last.

## Practical Intelligence (PI)

**What it measures**: How students navigate real-world ambiguity, execute under constraints, and learn from experience — the way experienced founders do.

**Assessment format**: Students read vignettes (scenarios extracted from real entrepreneur interviews) and respond in free text. Responses are scored against 26 reasoning moves.

### 26 PI Reasoning Moves (5 Categories)

| Category | Moves | Description |
|----------|-------|-------------|
| Diagnosing the Situation | move_01–move_06 | Reading context, identifying constraints, recognizing patterns |
| Reasoning Through Options | move_07–move_13 | Generating alternatives, weighing trade-offs, considering consequences |
| Taking Action | move_14–move_19 | Committing under uncertainty, iterating, timing decisions |
| People and Relationships | move_20–move_23 | Leveraging networks, managing stakeholders, building trust |
| Meta-Reasoning | move_24–move_26 | Reflecting on one's own thinking, updating beliefs, learning from outcomes |

### PI Scoring

Each response produces a binary move vector (present/not-present for each applicable move). Category scores are computed as the ratio of exhibited moves to applicable moves, then placed as a percentile against the entrepreneur corpus distribution for that situation type. The headline score is the average of 5 category percentiles.

## Creative Intelligence (CI)

**What it measures**: The ability to discover, frame, and articulate business opportunities in ambiguous space.

**Assessment format**: Episode-based vignettes following the arc: observation → tension → reframing → opportunity. Students respond describing what they see and how they'd frame the opportunity.

### 24 CI Thinking Moves (5 Categories)

| Category | Moves | Description |
|----------|-------|-------------|
| Observing and Noticing | ci_move_01–ci_move_05 | Noticing signals others miss |
| Reframing and Connecting | ci_move_06–ci_move_10 | Synthesizing observations into new frames |
| Articulating the Opportunity | ci_move_11–ci_move_15 | Translating insight into concrete opportunity |
| Evaluating and Stress-Testing | ci_move_16–ci_move_20 | Critically examining creative ideas |
| Communicating the Vision | ci_move_21–ci_move_24 | Making creative vision legible to others |

### CI Scoring

Same architecture as PI: category percentiles vs. entrepreneur corpus distribution.

## Personality Assessment (9 Dimensions)

**Assessment format**: Like/dislike interaction pattern across items from 9 facets.

### The Nine Facets

| Code | Name | Description |
|------|------|-------------|
| AM | Ambition / Achievement Drive | Goal-setting, persistence, excellence standards |
| RT | Risk Tolerance | Comfort with uncertainty, calculated risk-taking |
| IN | Innovativeness | Creative problem-solving, openness to change |
| AU | Autonomy | Self-direction, independent decision-making |
| SE | Self-Efficacy | Confidence in abilities, resourcefulness |
| ST | Stress Tolerance | Performing under pressure, resilience |
| IL | Internal Locus of Control | Belief that effort determines outcomes |
| GR | Grit | Long-term perseverance, consistency of interest |
| AC | Attention/Infrequency Checks | Data quality flags (not scored) |

### Personality Scoring

- **Global Entrepreneurial Index**: Mean of 7 facet means (AM, RT, IN, AU, SE, ST, IL), rescaled 0–100
- **Grit**: Scored separately
- **Quality flags**: Attention check, infrequency check, straight-line detection

## Key Supabase Tables

| Table | Read/Write | Purpose |
|-------|-----------|---------|
| `applicants` | Write | Test-taker records |
| `assessment_sessions` | Write | Session tracking with assigned vignettes |
| `pi_vignettes` | Read | PI assessment items (populated by triarchic-databank) |
| `ci_vignettes` | Read | CI assessment items (populated by triarchic-databank) |
| `student_responses` | Write | Free-text responses + move vectors + scores |
| `personality_responses` | Write | Per-item responses |
| `personality_scores` | Write | Computed facet and global scores |
| `situation_type_distributions` | Read | PI percentile distributions |
| `episode_type_distributions` | Read | CI percentile distributions |

## Reference Material

- PI methodology: `../triarchic-databank/docs/assessment_methodology.md`
- CI master plan: `../triarchic-databank/docs/creative_intelligence_plan.md`
- Pydantic models (PI): `../triarchic-databank/src/models/assessment_schemas.py`
- Pydantic models (CI): `../triarchic-databank/src/models/ci_assessment_schemas.py`
- Existing personality bank: `../the-arena/lib/assessment/personality-bank.ts`
- Existing personality scoring: `../the-arena/lib/assessment/personality-score.ts`
