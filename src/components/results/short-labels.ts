/**
 * Abbreviated radar labels — shared by IntelligenceRadarSlide and
 * ReasoningMatchSlide so the chart stays readable at any size.
 */
export const SHORT_LABELS: Record<string, string> = {
  // PI categories
  "Situation Diagnosis": "Diagnosis",
  "Information Gathering": "Info Gathering",
  "Constraint Analysis": "Constraints",
  "Option Generation": "Options",
  "Tradeoff Evaluation": "Tradeoffs",
  "Risk Assessment": "Risk",
  "Decision Architecture": "Decision",
  "Action Planning": "Action",
  "People & Stakeholders": "People",
  "Communication Strategy": "Communication",
  "Emotional & Values Reasoning": "Values",
  "Meta-Cognition": "Meta-Cognition",
  // CI categories
  "Pattern Recognition & Observation": "Patterns",
  "Information Seeking & Market Research": "Market Research",
  "Reframing & Category Innovation": "Reframing",
  "Cross-Domain Connection": "Cross-Domain",
  "Opportunity Articulation": "Opportunity",
  "Customer & Market Insight": "Customer Insight",
  "Timing & Context Assessment": "Timing",
  "Validation & Testing Strategy": "Validation",
  "Risk & Feasibility Evaluation": "Feasibility",
  "Vision Communication": "Vision",
  "Creative Confidence & Persistence": "Persistence",
  "Meta-Creative Thinking": "Meta-Creative",
};

export function getShortLabel(category: string): string {
  return SHORT_LABELS[category] ?? category;
}
