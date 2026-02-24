export type PersonalityFacet =
  | "AM"
  | "RT"
  | "IN"
  | "AU"
  | "SE"
  | "ST"
  | "IL"
  | "GR"
  | "AC";

export type LikertValue = 1 | 2 | 3 | 4 | 5;

export const PERSONALITY_FACETS: PersonalityFacet[] = [
  "AM",
  "RT",
  "IN",
  "AU",
  "SE",
  "ST",
  "IL",
  "GR",
  "AC",
];

export const ENTREPRENEURIAL_FACETS: PersonalityFacet[] = [
  "AM",
  "RT",
  "IN",
  "AU",
  "SE",
  "ST",
  "IL",
];

export interface PersonalityItem {
  id: string;
  facet: PersonalityFacet;
  text: string;
  reverse: boolean;
}

export const FACET_LABELS: Record<PersonalityFacet, string> = {
  AM: "Ambition",
  RT: "Risk Tolerance",
  IN: "Innovativeness",
  AU: "Autonomy",
  SE: "Self-Efficacy",
  ST: "Stress Tolerance",
  IL: "Internal Locus of Control",
  GR: "Grit",
  AC: "Attention Checks",
};

export const QUESTIONS_PER_PAGE = 6;

export const PERSONALITY_ITEMS: PersonalityItem[] = [
  { id: "AM01", facet: "AM", text: "I push myself to finish goals even when it gets hard.", reverse: false },
  { id: "AM02", facet: "AM", text: "I set challenging targets for myself and try hard to reach them.", reverse: false },
  { id: "AM03", facet: "AM", text: "I often finish things I start even if they become boring.", reverse: false },
  { id: "AM04", facet: "AM", text: "I feel proud when I complete difficult tasks.", reverse: false },
  { id: "AM05", facet: "AM", text: "I work extra on projects to make them better than expected.", reverse: false },
  { id: "AM06", facet: "AM", text: "I prefer tasks where I can see clear progress.", reverse: false },
  { id: "AM07", facet: "AM", text: "I am motivated by achieving personal standards of excellence.", reverse: false },
  { id: "AM08", facet: "AM", text: "I get discouraged easily if I\u2019m not making fast progress.", reverse: true },
  { id: "AM09", facet: "AM", text: "I frequently review my goals and change my plan to reach them.", reverse: false },
  { id: "AM10", facet: "AM", text: "I prefer not to set goals because they add pressure.", reverse: true },
  { id: "AM11", facet: "AM", text: "I seek feedback so I can improve my work.", reverse: false },
  { id: "AM12", facet: "AM", text: "I push myself to beat my own previous performance.", reverse: false },
  { id: "RT01", facet: "RT", text: "I\u2019m willing to try plans that others say are risky.", reverse: false },
  { id: "RT02", facet: "RT", text: "I will trade short-term comfort for a chance at a big future payoff.", reverse: false },
  { id: "RT03", facet: "RT", text: "I take calculated risks when the potential gains outweigh the losses.", reverse: false },
  { id: "RT04", facet: "RT", text: "I avoid taking chances that might lead to big problems.", reverse: true },
  { id: "RT05", facet: "RT", text: "I feel comfortable making decisions without complete information.", reverse: false },
  { id: "RT06", facet: "RT", text: "I tend to stick with safe choices rather than experimenting.", reverse: true },
  { id: "RT07", facet: "RT", text: "I will invest time or resources in new ideas even if success is uncertain.", reverse: false },
  { id: "RT08", facet: "RT", text: "I worry too much about the downside of new choices.", reverse: true },
  { id: "RT09", facet: "RT", text: "If I believe in an idea, I\u2019ll act on it even when others advise caution.", reverse: false },
  { id: "RT10", facet: "RT", text: "I prefer low-risk options when stakes are high.", reverse: true },
  { id: "RT11", facet: "RT", text: "I\u2019ve taken a risk that paid off and learned from risks that didn\u2019t.", reverse: false },
  { id: "RT12", facet: "RT", text: "I try to reduce uncertainty by gathering information before deciding.", reverse: false },
  { id: "IN01", facet: "IN", text: "I look for new ways to solve old problems.", reverse: false },
  { id: "IN02", facet: "IN", text: "I like experimenting with unusual ideas in projects.", reverse: false },
  { id: "IN03", facet: "IN", text: "I often suggest improvements that others hadn\u2019t thought of.", reverse: false },
  { id: "IN04", facet: "IN", text: "I prefer standard approaches over untested ones.", reverse: true },
  { id: "IN05", facet: "IN", text: "I keep up with new ideas or technology in areas I care about.", reverse: false },
  { id: "IN06", facet: "IN", text: "I\u2019m comfortable changing plans when a better idea appears.", reverse: false },
  { id: "IN07", facet: "IN", text: "I enjoy brainstorming novel solutions with others.", reverse: false },
  { id: "IN08", facet: "IN", text: "I find it hard to come up with new ideas on my own.", reverse: true },
  { id: "IN09", facet: "IN", text: "I notice small problems and try to fix them creatively.", reverse: false },
  { id: "IN10", facet: "IN", text: "I feel energized by unconventional approaches.", reverse: false },
  { id: "IN11", facet: "IN", text: "I like trying features or products that haven\u2019t been widely used yet.", reverse: false },
  { id: "IN12", facet: "IN", text: "I prefer known solutions that already work.", reverse: true },
  { id: "AU01", facet: "AU", text: "I prefer organizing my own time rather than following another\u2019s schedule.", reverse: false },
  { id: "AU02", facet: "AU", text: "I like to make my own decisions about how to do work.", reverse: false },
  { id: "AU03", facet: "AU", text: "I often take the lead on projects because I want control over them.", reverse: false },
  { id: "AU04", facet: "AU", text: "I feel comfortable following someone else\u2019s instructions all the time.", reverse: true },
  { id: "AU05", facet: "AU", text: "I enjoy making choices without asking for permission.", reverse: false },
  { id: "AU06", facet: "AU", text: "I feel stifled when others tell me exactly how to do something.", reverse: false },
  { id: "AU07", facet: "AU", text: "I prefer having autonomy rather than detailed supervision.", reverse: false },
  { id: "AU08", facet: "AU", text: "I like working as part of a team where someone else sets all the rules.", reverse: true },
  { id: "AU09", facet: "AU", text: "I take responsibility for my decisions and their outcomes.", reverse: false },
  { id: "AU10", facet: "AU", text: "I often look for opportunities where I can work independently.", reverse: false },
  { id: "AU11", facet: "AU", text: "I change plans when I think a different route is better, even if I\u2019m accountable.", reverse: false },
  { id: "AU12", facet: "AU", text: "I prefer being told my tasks rather than deciding priorities myself.", reverse: true },
  { id: "SE01", facet: "SE", text: "I feel confident I can handle unexpected problems that arise.", reverse: false },
  { id: "SE02", facet: "SE", text: "When faced with a challenge, I believe I can figure it out.", reverse: false },
  { id: "SE03", facet: "SE", text: "I can find resources I need to finish a difficult task.", reverse: false },
  { id: "SE04", facet: "SE", text: "I doubt my ability to deal with complex situations.", reverse: true },
  { id: "SE05", facet: "SE", text: "I trust my skills to complete tasks successfully.", reverse: false },
  { id: "SE06", facet: "SE", text: "Even in new situations, I adapt well and perform my best.", reverse: false },
  { id: "SE07", facet: "SE", text: "I can stay calm and keep working when things are unclear.", reverse: false },
  { id: "SE08", facet: "SE", text: "I worry I\u2019ll fail at tasks that require unfamiliar skills.", reverse: true },
  { id: "SE09", facet: "SE", text: "I can learn new tools or techniques quickly when I need them.", reverse: false },
  { id: "SE10", facet: "SE", text: "I often take on unfamiliar tasks because I expect to succeed.", reverse: false },
  { id: "SE11", facet: "SE", text: "I believe I have what it takes to create something valuable.", reverse: false },
  { id: "SE12", facet: "SE", text: "I have confidence in my ability to solve problems by myself.", reverse: false },
  { id: "ST01", facet: "ST", text: "I stay focused on the task even when I\u2019m under pressure.", reverse: false },
  { id: "ST02", facet: "ST", text: "I recover quickly after setbacks or criticism.", reverse: false },
  { id: "ST03", facet: "ST", text: "I sleep poorly when I worry about a project.", reverse: true },
  { id: "ST04", facet: "ST", text: "I handle busy, hectic periods without getting overwhelmed.", reverse: false },
  { id: "ST05", facet: "ST", text: "I can keep a clear head when multiple things demand my attention.", reverse: false },
  { id: "ST06", facet: "ST", text: "I get easily flustered by tight deadlines.", reverse: true },
  { id: "ST07", facet: "ST", text: "I use routines or habits to manage stress when work becomes heavy.", reverse: false },
  { id: "ST08", facet: "ST", text: "I find it hard to concentrate when there\u2019s a lot of pressure.", reverse: true },
  { id: "ST09", facet: "ST", text: "I stay calm when unexpected problems crop up.", reverse: false },
  { id: "ST10", facet: "ST", text: "I can balance school/work and personal life during busy periods.", reverse: false },
  { id: "ST11", facet: "ST", text: "I use coping strategies (breaks, planning) to reduce stress.", reverse: false },
  { id: "ST12", facet: "ST", text: "I remain productive even when the situation is stressful.", reverse: false },
  { id: "IL01", facet: "IL", text: "I believe my actions largely determine what happens to me.", reverse: false },
  { id: "IL02", facet: "IL", text: "When things go wrong, I usually think about what I could have done differently.", reverse: false },
  { id: "IL03", facet: "IL", text: "I often blame luck or others when outcomes are bad.", reverse: true },
  { id: "IL04", facet: "IL", text: "I feel in control of my life choices and their results.", reverse: false },
  { id: "IL05", facet: "IL", text: "I believe effort usually leads to better outcomes.", reverse: false },
  { id: "IL06", facet: "IL", text: "I believe people\u2019s success is mostly due to outside circumstances.", reverse: true },
  { id: "IL07", facet: "IL", text: "I plan my steps because I think planning affects outcomes.", reverse: false },
  { id: "IL08", facet: "IL", text: "I accept responsibility for the results of my decisions.", reverse: false },
  { id: "IL09", facet: "IL", text: "I think success is mainly about being in the right place at the right time.", reverse: true },
  { id: "IL10", facet: "IL", text: "I make changes when I think they will improve my chances of success.", reverse: false },
  { id: "IL11", facet: "IL", text: "I try to shape events rather than waiting for them to happen.", reverse: false },
  { id: "IL12", facet: "IL", text: "I believe my persistence affects whether I succeed.", reverse: false },
  { id: "GR01", facet: "GR", text: "I finish whatever I begin.", reverse: false },
  { id: "GR02", facet: "GR", text: "I am diligent and work hard even when progress is slow.", reverse: false },
  { id: "GR03", facet: "GR", text: "I have overcome setbacks to conquer an important challenge.", reverse: false },
  { id: "GR04", facet: "GR", text: "I often switch between different projects with no plan.", reverse: true },
  { id: "GR05", facet: "GR", text: "I stay focused on goals that take a long time to complete.", reverse: false },
  { id: "GR06", facet: "GR", text: "My interests change from year to year.", reverse: true },
  { id: "GR07", facet: "GR", text: "I persist even when an effort takes months or years to pay off.", reverse: false },
  { id: "GR08", facet: "GR", text: "I am more interested in short-term variety than long-term goals.", reverse: true },
  { id: "GR09", facet: "GR", text: "I keep working toward long-term goals even if progress is unexciting.", reverse: false },
  { id: "GR10", facet: "GR", text: "I am willing to work on the same goal for months or years.", reverse: false },
  { id: "AC01", facet: "AC", text: "Please select \u2018Agree\u2019 for this item.", reverse: false },
  { id: "AC02", facet: "AC", text: "I have never used a computer before.", reverse: false },
];

export const TOTAL_PERSONALITY_ITEMS = PERSONALITY_ITEMS.length;
