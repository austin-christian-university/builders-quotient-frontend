import type { NarrativeBlock, CategoryScore, PersonalityFacetScore } from "@/lib/schemas/results";
import { averageByCategory } from "@/lib/assessment/personality-dimensions";
import type { PersonalityVector } from "@/lib/assessment/personality-dimensions";

// ---------------------------------------------------------------------------
// Template type
// ---------------------------------------------------------------------------

type NarrativeTemplate = { strength: string; growth: string };

// ---------------------------------------------------------------------------
// PI Templates — 12 Practical Intelligence categories
// ---------------------------------------------------------------------------

export const PI_TEMPLATES: Record<string, NarrativeTemplate> = {
  "Situation Diagnosis": {
    strength:
      "You quickly size up complex situations and identify the real problem beneath surface symptoms — a skill that separates founders who act decisively from those who waste cycles solving the wrong thing.",
    growth:
      "Developing stronger situation diagnosis means pausing before jumping to solutions. Entrepreneurs who build this skill often use structured problem framing — writing out what they think the problem is, then pressure-testing that assumption with two or three alternative explanations before committing.",
  },
  "Information Gathering": {
    strength:
      "You instinctively seek out the right information before making moves, asking sharp questions and triangulating sources. This is the research discipline that keeps founders grounded in reality rather than assumptions.",
    growth:
      "Strengthening your information gathering means becoming more deliberate about what you don't know. Try building a habit of listing your three biggest unknowns before any major decision and identifying exactly who or what could fill each gap.",
  },
  "Constraint Analysis": {
    strength:
      "You have a clear-eyed view of boundaries — budgets, timelines, regulations, team capacity. Founders who see constraints clearly build ventures that are ambitious and achievable, not just one or the other.",
    growth:
      "Entrepreneurs who develop constraint awareness often start by mapping real limits before brainstorming. When you feel stuck, listing the non-negotiable constraints explicitly can reveal which ones are genuine and which are assumptions you can challenge.",
  },
  "Option Generation": {
    strength:
      "You naturally generate multiple paths forward rather than locking onto the first idea. This breadth of thinking is what allows founders to find non-obvious solutions that competitors miss entirely.",
    growth:
      "Expanding your option generation means resisting the pull of the first reasonable idea. A practical technique: before committing to any solution, force yourself to articulate at least three distinct approaches, even if one seems obviously best.",
  },
  "Tradeoff Evaluation": {
    strength:
      "You weigh competing priorities with clarity, understanding that every yes is a no to something else. This is the strategic muscle that lets founders allocate scarce resources — time, money, attention — where they matter most.",
    growth:
      "Building stronger tradeoff evaluation starts with making the costs explicit. When facing a decision, write down what you gain and what you give up with each option. Entrepreneurs who do this consistently make fewer regret-driven pivots.",
  },
  "Risk Assessment": {
    strength:
      "You have a calibrated sense of what could go wrong and how likely it is. This isn't about avoiding risk — it's about seeing it accurately, which is the foundation of every sound entrepreneurial bet.",
    growth:
      "Improving risk assessment means getting specific about probability and impact rather than relying on gut feelings. Try rating each risk on a simple severity scale and asking yourself what evidence would change your estimate.",
  },
  "Decision Architecture": {
    strength:
      "You structure decisions well — knowing when to decide fast, when to gather more data, and how to sequence choices so earlier decisions don't box you in. This is the operating system behind consistent entrepreneurial judgment.",
    growth:
      "Developing decision architecture means becoming more intentional about how you decide, not just what you decide. Experiment with setting explicit decision criteria before evaluating options — it reduces bias and speeds up future choices.",
  },
  "Action Planning": {
    strength:
      "You translate strategy into concrete next steps with clear ownership and timelines. This execution discipline is what turns good ideas into shipped products and real traction.",
    growth:
      "Strengthening your action planning means breaking ambitious goals into smaller, time-bound milestones. Entrepreneurs who struggle here often find that writing down their next three concrete actions — with deadlines — dramatically increases follow-through.",
  },
  "People & Stakeholders": {
    strength:
      "You instinctively read interpersonal dynamics and build coalitions — a hallmark of founders who scale through people, not just product. You understand that the right conversation with the right person often matters more than the right feature.",
    growth:
      "Entrepreneurs who develop stakeholder awareness often start by mapping who their decisions affect before announcing them. Building a habit of asking 'who else needs to be involved or informed?' before acting can prevent costly misalignments.",
  },
  "Communication Strategy": {
    strength:
      "You tailor your message to your audience and choose the right channel and timing for maximum impact. This communication precision is what turns founders into effective leaders who align teams and close deals.",
    growth:
      "Developing your communication strategy means being more deliberate about framing. Before important conversations, consider: what does this person already believe, what do they care about, and what is the single clearest way to connect your message to their priorities?",
  },
  "Emotional & Values Reasoning": {
    strength:
      "You factor emotions, values, and human motivations into your reasoning rather than treating decisions as purely logical exercises. This emotional intelligence is what builds the trust and loyalty that sustain ventures through hard times.",
    growth:
      "Entrepreneurs who strengthen emotional reasoning often benefit from explicitly naming the emotional stakes in a decision — for themselves and others. Ask: who might feel threatened, excited, or confused by this choice, and how does that change my approach?",
  },
  "Meta-Cognition": {
    strength:
      "You think about your own thinking — noticing when you're biased, when your confidence is outpacing your evidence, or when a decision framework isn't working. This self-awareness is rare and invaluable in founders navigating uncertainty.",
    growth:
      "Entrepreneurs with lower meta-cognition scores often develop structured reflection practices after key decisions — brief post-mortems that ask not just 'what happened?' but 'what did I assume, and where was my thinking off?' This turns experience into systematic learning.",
  },
};

// ---------------------------------------------------------------------------
// CI Templates — 12 Creative Intelligence categories
// ---------------------------------------------------------------------------

export const CI_TEMPLATES: Record<string, NarrativeTemplate> = {
  "Pattern Recognition & Observation": {
    strength:
      "You notice signals others miss — emerging trends, unspoken needs, subtle shifts in behavior or markets. This perceptive quality is what lets founders spot opportunities before they become obvious to everyone else.",
    growth:
      "Building pattern recognition means exposing yourself to more diverse inputs. Try consuming content well outside your domain — different industries, cultures, disciplines — and deliberately asking 'what is this similar to that I already know?'",
  },
  "Information Seeking & Market Research": {
    strength:
      "You dig into markets with real curiosity, seeking out data and perspectives that challenge your assumptions. This research rigor is what separates founders who build for real demand from those building for imagined demand.",
    growth:
      "Strengthening your market research means going beyond surface-level data. Challenge yourself to talk to actual users or customers before finalizing any product decision, and to quantify the opportunity rather than relying on anecdotal excitement.",
  },
  "Reframing & Category Innovation": {
    strength:
      "You naturally redefine problems and categories rather than accepting them as given. This reframing ability is the creative engine behind ventures that create new markets instead of competing in crowded ones.",
    growth:
      "Developing reframing skill means practicing the habit of asking 'what if the opposite were true?' or 'what would this look like in a completely different context?' Entrepreneurs who reframe well often set aside dedicated time to challenge their own framing of a problem.",
  },
  "Cross-Domain Connection": {
    strength:
      "You draw connections between unrelated fields and ideas, combining insights from different worlds in ways that produce genuinely novel approaches. This is the combinatorial creativity that defines breakthrough ventures.",
    growth:
      "Building cross-domain thinking means deliberately cultivating breadth. Seek out conversations, books, or experiences in fields unrelated to your work, and practice asking 'what principle from that world could apply here?'",
  },
  "Opportunity Articulation": {
    strength:
      "You can clearly articulate why an opportunity exists — what gap it fills, who it serves, and why now is the right moment. This clarity is what makes the difference between a vague idea and a compelling venture thesis.",
    growth:
      "Improving opportunity articulation means practicing the discipline of writing out your thesis in one clear paragraph. Ask yourself: what specific problem exists, for whom, and what has changed to make this solvable now? If you can't answer all three crisply, keep refining.",
  },
  "Customer & Market Insight": {
    strength:
      "You understand your target customers deeply — their pains, motivations, behaviors, and the jobs they're trying to get done. This empathy-driven insight is what allows founders to build products people actually want.",
    growth:
      "Strengthening customer insight means spending more time in direct contact with the people you aim to serve. Build a regular cadence of customer conversations, and resist the temptation to lead with your solution — instead, listen for what they struggle with most.",
  },
  "Timing & Context Assessment": {
    strength:
      "You have a strong sense of timing — when a market is ready, when technology has matured enough, when cultural conditions are right for a new idea. This contextual awareness is what separates well-timed ventures from premature ones.",
    growth:
      "Developing timing awareness means studying why past ventures succeeded or failed relative to their moment. Before launching, explicitly ask: what needs to be true in the world for this to work now, and is that actually true today?",
  },
  "Validation & Testing Strategy": {
    strength:
      "You test ideas before committing fully, designing experiments that reveal whether assumptions hold up. This validation discipline protects founders from building elaborate solutions to problems that don't exist.",
    growth:
      "Improving your validation approach means getting comfortable with cheap, fast tests before expensive commitments. Try identifying the single riskiest assumption in your plan and designing the smallest possible experiment to challenge it.",
  },
  "Risk & Feasibility Evaluation": {
    strength:
      "You evaluate creative ideas with a practical lens — asking not just 'is this exciting?' but 'can this actually work given real-world constraints?' This balance of creativity and realism is essential for ventures that ship, not just inspire.",
    growth:
      "Strengthening feasibility evaluation means asking the hard questions earlier. Before falling in love with an idea, identify the top three reasons it might fail and honestly assess whether each can be mitigated. This isn't pessimism — it's what makes optimism productive.",
  },
  "Vision Communication": {
    strength:
      "You paint a compelling picture of the future that enrolls others in your mission — investors, team members, customers. This narrative power is what turns a strategy into a movement.",
    growth:
      "Developing vision communication means practicing clarity and specificity. Instead of describing what you want to build, describe the world as it will be different because of what you build. Ground your vision in concrete details that make it feel real, not abstract.",
  },
  "Creative Confidence & Persistence": {
    strength:
      "You push creative ideas forward even when they meet resistance, maintaining conviction through ambiguity and setbacks. This creative persistence is what lets founders bring genuinely new things into the world.",
    growth:
      "Building creative confidence means reframing setbacks as data rather than verdicts. Track your creative bets — what you tried, what happened, what you learned — and review them periodically. Seeing your own track record of learning-through-failure builds genuine resilience.",
  },
  "Meta-Creative Thinking": {
    strength:
      "You reflect on your own creative process — noticing what conditions produce your best ideas, when your thinking is fresh versus stale, and how to deliberately enter creative modes. This meta-awareness multiplies your creative output over time.",
    growth:
      "Developing meta-creative thinking means paying attention to your creative patterns. Start noticing when and where your best ideas happen, what kinds of input spark them, and what blocks them. Entrepreneurs who manage their creative process like a system consistently outperform those who rely on inspiration.",
  },
};

// ---------------------------------------------------------------------------
// Communication Templates — 5 meta-categories from personality vector
// ---------------------------------------------------------------------------

export const COMMUNICATION_TEMPLATES: Record<string, NarrativeTemplate> = {
  "Energy & Dynamism": {
    strength:
      "You bring palpable energy to interactions — your pace, expressiveness, and vocal dynamism naturally draw attention and create momentum. Founders with this trait energize teams and make stakeholders feel the urgency behind the mission.",
    growth:
      "Developing your energy and dynamism means finding ways to project more engagement in high-stakes moments. Experiment with pacing, vocal variety, and physical expressiveness — even small increases in animation can significantly shift how others perceive your conviction and leadership presence.",
  },
  "Confidence & Authority": {
    strength:
      "You project confidence and composure that puts others at ease, even in uncertain situations. This presence signals competence and decisiveness — the qualities investors and teams look for in someone who will lead through ambiguity.",
    growth:
      "Building projected confidence is a learnable skill. Practice speaking with more declarative sentences, reducing hedging language, and holding pauses rather than filling them. Founders who work on this often find that external confidence eventually generates genuine internal confidence.",
  },
  "Warmth & Interpersonal": {
    strength:
      "You communicate with genuine warmth — your tone, expressiveness, and empathy come through naturally when you talk through problems. Founders with this quality build teams that stay loyal through hard stretches and customer relationships that drive organic growth.",
    growth:
      "Developing interpersonal warmth means letting more of your personality come through when you communicate your reasoning. Lean into approachability — a conversational tone, moments of humor or empathy, and language that acknowledges the human side of a problem. Entrepreneurs who cultivate warmth often find it unlocks trust that no amount of competence alone can build.",
  },
  "Communication Style": {
    strength:
      "You communicate with a distinctive blend of storytelling, analytical precision, and passion that makes your message both compelling and credible. This communication versatility is what lets founders persuade diverse audiences — from technical teams to non-technical investors.",
    growth:
      "Strengthening your communication style means becoming more intentional about matching your approach to your audience. Practice shifting between storytelling mode and analytical mode depending on who you're addressing. Record yourself in practice pitches and listen for where you lose clarity or conviction.",
  },
  "Self-Presentation": {
    strength:
      "You present yourself with an authentic blend of professionalism and vulnerability that builds trust. This self-presentation instinct lets you adapt your formality and tone to different contexts while remaining recognizably you — a quality that defines memorable founders.",
    growth:
      "Developing self-presentation means calibrating how much formality, vulnerability, and intensity you bring to different contexts. Seek feedback on how you come across in different settings, and experiment with showing slightly more range — founders who can adjust their register without losing authenticity build broader networks.",
  },
};

// ---------------------------------------------------------------------------
// Personality Templates — 8 entrepreneurial facets (excludes Attention Checks)
// ---------------------------------------------------------------------------

export const PERSONALITY_TEMPLATES: Record<string, NarrativeTemplate> = {
  Ambition: {
    strength:
      "You set high goals and pursue them relentlessly, driven by an internal standard that pushes you beyond what others consider enough. This ambition is the engine that propels founders through the long, unglamorous middle of building a venture.",
    growth:
      "Building ambition as a skill means setting stretch goals that excite rather than overwhelm you. Start by identifying one outcome that would genuinely change your trajectory and working backward to the first concrete step. Entrepreneurs who develop ambition strategically avoid burnout while still aiming high.",
  },
  "Risk Tolerance": {
    strength:
      "You're comfortable with calculated uncertainty — willing to bet on yourself and your ideas when the evidence is promising but the outcome isn't guaranteed. This risk tolerance is what separates people who think about starting ventures from people who actually do.",
    growth:
      "Developing risk tolerance doesn't mean becoming reckless — it means getting more comfortable with uncertainty through practice. Start with smaller, reversible bets where the downside is manageable. Over time, your comfort zone expands because you have evidence that you can handle things not going as planned.",
  },
  Innovativeness: {
    strength:
      "You naturally gravitate toward novel approaches and unconventional solutions, finding existing methods insufficient when better ones could exist. This innovative orientation is what drives founders to build things the world hasn't seen yet.",
    growth:
      "Cultivating innovativeness means deliberately exposing yourself to new perspectives and challenging your default approaches. Set aside time each week to explore ideas outside your domain, and practice asking 'what if we did this completely differently?' even when current methods seem adequate.",
  },
  Autonomy: {
    strength:
      "You thrive with self-direction, taking ownership of your path rather than waiting for someone else to set it. This autonomy drive is fundamental to entrepreneurship — no one assigns a founder their tasks or validates their roadmap.",
    growth:
      "Developing autonomy means gradually taking on more self-directed work where you define both the problem and the solution. Volunteer for ambiguous projects, resist the urge to wait for detailed instructions, and practice making decisions with incomplete information. The muscle builds with use.",
  },
  "Self-Efficacy": {
    strength:
      "You believe in your ability to figure things out and make things happen, even when facing unfamiliar challenges. This self-efficacy is the confidence that lets founders persist when everyone else assumes the problem is unsolvable.",
    growth:
      "Building self-efficacy comes from accumulating evidence of your own competence. Track your wins — even small ones — and review them when doubt creeps in. Entrepreneurs who deliberately build self-efficacy often start by succeeding at progressively harder challenges, creating a track record they can trust.",
  },
  "Stress Tolerance": {
    strength:
      "You maintain your composure and decision-making quality under pressure, absorbing stress without letting it derail your performance. This resilience is critical for founders, whose ventures regularly deliver more uncertainty and intensity than conventional careers.",
    growth:
      "Improving stress tolerance is about building better recovery systems, not about feeling less stress. Develop consistent practices — exercise, sleep discipline, boundary-setting — that let you recharge. Entrepreneurs who manage stress well don't avoid it; they build the infrastructure to absorb it without breaking down.",
  },
  "Internal Locus of Control": {
    strength:
      "You believe your outcomes are primarily shaped by your own choices and actions, not luck or external circumstances. This internal locus of control is what drives founders to take initiative rather than wait for conditions to improve.",
    growth:
      "Strengthening your internal locus of control means shifting your default narrative from 'things happened to me' to 'I chose and here's what resulted.' After setbacks, practice identifying the specific decisions that were within your control and what you'd do differently — this builds the agency mindset that entrepreneurship demands.",
  },
  Grit: {
    strength:
      "You persist through difficulty with sustained focus, sticking with important goals even when progress is slow and the work is unglamorous. This grit is what separates founders who build lasting ventures from those who abandon them at the first trough.",
    growth:
      "Developing grit means connecting your daily effort to a larger purpose that sustains you through boring or frustrating stretches. Identify what you care about enough to endure discomfort for, and practice staying with hard tasks slightly longer than feels comfortable. Grit grows incrementally, one extended effort at a time.",
  },
};

// ---------------------------------------------------------------------------
// Selection functions
// ---------------------------------------------------------------------------

/**
 * Pick top 2 PI + top 2 CI as strengths and bottom 2 from each as growth,
 * ensuring balanced representation across both intelligence domains.
 * Skips categories without template entries.
 */
export function getIntelligenceNarrative(
  piCategories: CategoryScore[],
  ciCategories: CategoryScore[],
): NarrativeBlock[] {
  // Sort each domain independently by score desc, filtering to those with templates
  const piSorted = piCategories
    .filter((c) => PI_TEMPLATES[c.category] !== undefined)
    .sort((a, b) => b.score - a.score);

  const ciSorted = ciCategories
    .filter((c) => CI_TEMPLATES[c.category] !== undefined)
    .sort((a, b) => b.score - a.score);

  if (piSorted.length === 0 && ciSorted.length === 0) return [];

  const blocks: NarrativeBlock[] = [];

  // Top 2 from each domain = strengths
  for (const cat of piSorted.slice(0, 2)) {
    blocks.push({
      category: cat.category,
      type: "strength",
      text: PI_TEMPLATES[cat.category].strength,
    });
  }
  for (const cat of ciSorted.slice(0, 2)) {
    blocks.push({
      category: cat.category,
      type: "strength",
      text: CI_TEMPLATES[cat.category].strength,
    });
  }

  // Bottom 2 from each domain = growth areas
  for (const cat of piSorted.slice(-Math.min(2, piSorted.length)).reverse()) {
    // Skip if already used as a strength (small dataset edge case)
    if (blocks.some((b) => b.category === cat.category)) continue;
    blocks.push({
      category: cat.category,
      type: "growth",
      text: PI_TEMPLATES[cat.category].growth,
    });
  }
  for (const cat of ciSorted.slice(-Math.min(2, ciSorted.length)).reverse()) {
    if (blocks.some((b) => b.category === cat.category)) continue;
    blocks.push({
      category: cat.category,
      type: "growth",
      text: CI_TEMPLATES[cat.category].growth,
    });
  }

  return blocks;
}

/**
 * Takes a raw 20-dimension personality profile array (pv_01..pv_20),
 * groups into 5 meta-categories via averageByCategory(),
 * then picks top 2 as strengths and bottom 1-2 as growth.
 */
export function getCommunicationNarrative(
  profile: { category: string; value: number }[],
): NarrativeBlock[] {
  if (profile.length === 0) return [];

  // Convert array format to PersonalityVector Record for averageByCategory
  const vector: PersonalityVector = {};
  for (const dim of profile) {
    vector[dim.category] = dim.value;
  }

  const metaCategories = averageByCategory(vector);

  // Filter to categories with templates, sort desc by value
  const withTemplates = metaCategories
    .filter((c) => COMMUNICATION_TEMPLATES[c.category] !== undefined)
    .sort((a, b) => b.value - a.value);

  if (withTemplates.length === 0) return [];

  const strengthCount = Math.min(2, withTemplates.length);
  const growthCount = Math.min(
    withTemplates.length <= 3 ? 1 : 2,
    withTemplates.length - strengthCount,
  );

  const blocks: NarrativeBlock[] = [];

  for (let i = 0; i < strengthCount; i++) {
    const cat = withTemplates[i];
    blocks.push({
      category: cat.category,
      type: "strength",
      text: COMMUNICATION_TEMPLATES[cat.category].strength,
    });
  }

  for (let i = withTemplates.length - growthCount; i < withTemplates.length; i++) {
    const cat = withTemplates[i];
    blocks.push({
      category: cat.category,
      type: "growth",
      text: COMMUNICATION_TEMPLATES[cat.category].growth,
    });
  }

  return blocks;
}

/**
 * Takes 8 personality facet scores (Likert-based), picks top 2 as
 * strengths and bottom 1-2 as growth. Skips Attention Checks and
 * facets without template entries.
 */
export function getPersonalityNarrative(
  facetScores: PersonalityFacetScore[],
): NarrativeBlock[] {
  if (facetScores.length === 0) return [];

  // Filter out Attention Checks and facets without templates, sort desc by rescaledScore
  const withTemplates = facetScores
    .filter((f) => PERSONALITY_TEMPLATES[f.label] !== undefined)
    .sort((a, b) => b.rescaledScore - a.rescaledScore);

  if (withTemplates.length === 0) return [];

  // Reserve at least 1 slot for growth when possible
  const strengthCount = withTemplates.length <= 2
    ? 1
    : Math.min(2, withTemplates.length);
  const growthCount = Math.min(
    withTemplates.length <= 3 ? 1 : 2,
    withTemplates.length - strengthCount,
  );

  const blocks: NarrativeBlock[] = [];

  for (let i = 0; i < strengthCount; i++) {
    const f = withTemplates[i];
    blocks.push({
      category: f.label,
      type: "strength",
      text: PERSONALITY_TEMPLATES[f.label].strength,
    });
  }

  for (let i = withTemplates.length - growthCount; i < withTemplates.length; i++) {
    const f = withTemplates[i];
    blocks.push({
      category: f.label,
      type: "growth",
      text: PERSONALITY_TEMPLATES[f.label].growth,
    });
  }

  return blocks;
}
