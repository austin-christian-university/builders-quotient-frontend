/** Canonical URL for this site (used in metadata, sitemap, etc.) */
export const SITE_URL = "https://bq.austinchristianu.org";

/** External ACU links used across assessment completion pages */
export const ACU_URLS = {
  home: "https://austinchristianu.org",
  apply: "https://www.austinchristianuniversity.org/apply",
  curriculum: "https://austinchristianu.org/curriculum",
  startups: "https://www.austinchristianuniversity.org/startups",
} as const;

/**
 * The optional personality quiz, offered after the intelligence assessment. Archived
 * 2026-11-02: about 1 in 5 finishers took it and none since September. Code, research
 * and stored results are kept; set to true to offer it again. People who already
 * completed it still see their personality slides on results.
 */
export const PERSONALITY_QUIZ_ENABLED = false;
