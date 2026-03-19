import { describe, it, expect } from "vitest";
import {
  PRE_EXAM_SCRIPT,
  CI_TRANSITION_SCRIPT,
  type OrbScript,
} from "./orb-scripts";

function validateScript(script: OrbScript) {
  expect(script.audioUrl).toBeTruthy();
  expect(script.captions.length).toBeGreaterThan(0);

  for (const caption of script.captions) {
    expect(caption.text.trim().length).toBeGreaterThan(0);
    expect(caption.endTime).toBeGreaterThan(caption.startTime);
    expect(caption.startTime).toBeGreaterThanOrEqual(0);
  }

  // Captions should be in chronological order
  for (let i = 1; i < script.captions.length; i++) {
    expect(script.captions[i].startTime).toBeGreaterThanOrEqual(
      script.captions[i - 1].startTime
    );
  }
}

describe("orb scripts", () => {
  it("PRE_EXAM_SCRIPT has valid structure", () => {
    validateScript(PRE_EXAM_SCRIPT);
  });

  it("CI_TRANSITION_SCRIPT has valid structure", () => {
    validateScript(CI_TRANSITION_SCRIPT);
  });

  it("PRE_EXAM_SCRIPT has 3 caption segments", () => {
    expect(PRE_EXAM_SCRIPT.captions).toHaveLength(3);
  });

  it("CI_TRANSITION_SCRIPT has 6 caption segments", () => {
    expect(CI_TRANSITION_SCRIPT.captions).toHaveLength(6);
  });
});
