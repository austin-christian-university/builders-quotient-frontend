/**
 * Action-oriented radar labels + one-line descriptions.
 * Shared by IntelligenceRadarSlide and ReasoningMatchSlide.
 */

type CategoryMeta = {
  label: string;
  description: string;
};

const CATEGORY_META: Record<string, CategoryMeta> = {
  // PI categories
  "Situation Diagnosis": {
    label: "Reading the Room",
    description: "You quickly assess what's really happening in a situation",
  },
  "Information Gathering": {
    label: "Digging Deeper",
    description: "You seek out the facts and context others might miss",
  },
  "Constraint Analysis": {
    label: "Mapping Limits",
    description: "You identify what's possible given real-world constraints",
  },
  "Option Generation": {
    label: "Seeing Possibilities",
    description: "You naturally generate multiple paths forward",
  },
  "Tradeoff Evaluation": {
    label: "Weighing Tradeoffs",
    description: "You compare options by what you'd gain and give up",
  },
  "Risk Assessment": {
    label: "Gauging Risk",
    description: "You anticipate what could go wrong and how likely it is",
  },
  "Decision Architecture": {
    label: "Structuring Decisions",
    description:
      "You break complex choices into clear, manageable steps",
  },
  "Action Planning": {
    label: "Planning Next Steps",
    description: "You translate decisions into concrete action plans",
  },
  "People & Stakeholders": {
    label: "Reading People",
    description:
      "You consider who's affected and how to bring them along",
  },
  "Communication Strategy": {
    label: "Getting Buy-In",
    description:
      "You frame ideas so others understand and support them",
  },
  "Emotional & Values Reasoning": {
    label: "Following Your Compass",
    description:
      "You weigh decisions against what feels right, not just what's logical",
  },
  "Meta-Cognition": {
    label: "Checking Your Thinking",
    description: "You step back to examine your own reasoning process",
  },

  // CI categories
  "Pattern Recognition & Observation": {
    label: "Spotting Patterns",
    description: "You notice signals and trends others overlook",
  },
  "Information Seeking & Market Research": {
    label: "Researching Markets",
    description:
      "You dig into markets and industries to find opportunities",
  },
  "Reframing & Category Innovation": {
    label: "Reframing Problems",
    description: "You see familiar challenges from entirely new angles",
  },
  "Cross-Domain Connection": {
    label: "Connecting Dots",
    description: "You borrow ideas across industries and disciplines",
  },
  "Opportunity Articulation": {
    label: "Naming Opportunities",
    description:
      "You clearly define the gap or opening you've spotted",
  },
  "Customer & Market Insight": {
    label: "Understanding Customers",
    description: "You empathize with what people actually need",
  },
  "Timing & Context Assessment": {
    label: "Reading the Moment",
    description: "You sense when the timing is right to act",
  },
  "Validation & Testing Strategy": {
    label: "Testing Ideas",
    description:
      "You find fast ways to validate before going all in",
  },
  "Risk & Feasibility Evaluation": {
    label: "Judging Feasibility",
    description:
      "You assess whether a creative idea can actually work",
  },
  "Vision Communication": {
    label: "Painting the Vision",
    description:
      "You inspire others with a compelling picture of what could be",
  },
  "Creative Confidence & Persistence": {
    label: "Staying the Course",
    description:
      "You push through doubt and setbacks on creative bets",
  },
  "Meta-Creative Thinking": {
    label: "Reflecting on Creativity",
    description: "You examine and refine your own creative process",
  },
};

export function getShortLabel(category: string): string {
  return CATEGORY_META[category]?.label ?? category;
}

export function getCategoryDescription(category: string): string {
  return CATEGORY_META[category]?.description ?? "";
}

export function getCategoryMeta(
  category: string
): CategoryMeta | undefined {
  return CATEGORY_META[category];
}
