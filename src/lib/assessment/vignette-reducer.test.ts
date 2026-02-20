import { describe, it, expect } from "vitest";
import { reducer, type State } from "./vignette-reducer";

function makeState(phase: State["phase"], errorMessage: string | null = null): State {
  return { phase, errorMessage };
}

describe("vignette reducer", () => {
  // --- Happy-path transitions ---
  it("narrating + NARRATION_COMPLETE → buffer", () => {
    const result = reducer(makeState("narrating"), { type: "NARRATION_COMPLETE" });
    expect(result.phase).toBe("buffer");
  });

  it("buffer + BUFFER_COMPLETE → recording", () => {
    const result = reducer(makeState("buffer"), { type: "BUFFER_COMPLETE" });
    expect(result.phase).toBe("recording");
  });

  it("recording + RECORDING_STOPPED → uploading", () => {
    const result = reducer(makeState("recording"), { type: "RECORDING_STOPPED" });
    expect(result.phase).toBe("uploading");
  });

  it("uploading + UPLOAD_COMPLETE → transitioning", () => {
    const result = reducer(makeState("uploading"), { type: "UPLOAD_COMPLETE" });
    expect(result.phase).toBe("transitioning");
  });

  // --- Guard tests (wrong phase → no change) ---
  it("buffer + NARRATION_COMPLETE → stays buffer", () => {
    const state = makeState("buffer");
    const result = reducer(state, { type: "NARRATION_COMPLETE" });
    expect(result).toBe(state);
  });

  it("narrating + BUFFER_COMPLETE → stays narrating", () => {
    const state = makeState("narrating");
    const result = reducer(state, { type: "BUFFER_COMPLETE" });
    expect(result).toBe(state);
  });

  it("uploading + RECORDING_STOPPED → stays uploading", () => {
    const state = makeState("uploading");
    const result = reducer(state, { type: "RECORDING_STOPPED" });
    expect(result).toBe(state);
  });

  // --- Error + retry ---
  it("any phase + ERROR → error with message", () => {
    const phases = ["narrating", "buffer", "recording", "uploading", "transitioning"] as const;
    for (const phase of phases) {
      const result = reducer(makeState(phase), {
        type: "ERROR",
        message: "Something went wrong",
      });
      expect(result.phase).toBe("error");
      expect(result.errorMessage).toBe("Something went wrong");
    }
  });

  it("error + RETRY → uploading with errorMessage cleared", () => {
    const result = reducer(makeState("error", "Previous error"), { type: "RETRY" });
    expect(result.phase).toBe("uploading");
    expect(result.errorMessage).toBeNull();
  });
});
