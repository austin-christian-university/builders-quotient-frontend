import { describe, it, expect } from "vitest";
import { reducer, type State } from "./vignette-reducer";

function makeState(phase: State["phase"], errorMessage: string | null = null, retryCount = 0): State {
  return { phase, errorMessage, retryCount };
}

describe("vignette reducer", () => {
  // --- Happy-path transitions ---
  it("ready + BEGIN -> narrating", () => {
    const result = reducer(makeState("ready"), { type: "BEGIN" });
    expect(result.phase).toBe("narrating");
  });

  it("narrating + NARRATION_COMPLETE -> buffer", () => {
    const result = reducer(makeState("narrating"), { type: "NARRATION_COMPLETE" });
    expect(result.phase).toBe("buffer");
  });

  it("buffer + BUFFER_COMPLETE -> recording", () => {
    const result = reducer(makeState("buffer"), { type: "BUFFER_COMPLETE" });
    expect(result.phase).toBe("recording");
  });

  it("recording + RECORDING_STOPPED -> submitting", () => {
    const result = reducer(makeState("recording"), { type: "RECORDING_STOPPED" });
    expect(result.phase).toBe("submitting");
  });

  it("submitting + SUBMIT_COMPLETE -> transitioning", () => {
    const result = reducer(makeState("submitting"), { type: "SUBMIT_COMPLETE" });
    expect(result.phase).toBe("transitioning");
  });

  // --- Guard tests (wrong phase -> no change) ---
  it("narrating + BEGIN -> stays narrating", () => {
    const state = makeState("narrating");
    const result = reducer(state, { type: "BEGIN" });
    expect(result).toBe(state);
  });

  it("buffer + NARRATION_COMPLETE -> stays buffer", () => {
    const state = makeState("buffer");
    const result = reducer(state, { type: "NARRATION_COMPLETE" });
    expect(result).toBe(state);
  });

  it("narrating + BUFFER_COMPLETE -> stays narrating", () => {
    const state = makeState("narrating");
    const result = reducer(state, { type: "BUFFER_COMPLETE" });
    expect(result).toBe(state);
  });

  it("submitting + RECORDING_STOPPED -> stays submitting", () => {
    const state = makeState("submitting");
    const result = reducer(state, { type: "RECORDING_STOPPED" });
    expect(result).toBe(state);
  });

  // --- Error ---
  it("any phase + ERROR -> error with message", () => {
    const phases = ["ready", "narrating", "buffer", "recording", "submitting", "transitioning"] as const;
    for (const phase of phases) {
      const result = reducer(makeState(phase), {
        type: "ERROR",
        message: "Something went wrong",
      });
      expect(result.phase).toBe("error");
      expect(result.errorMessage).toBe("Something went wrong");
    }
  });

  // --- DEV_SET_PHASE ---
  it("DEV_SET_PHASE sets phase in development", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const result = reducer(makeState("ready"), { type: "DEV_SET_PHASE", phase: "recording" });
    expect(result.phase).toBe("recording");
    expect(result.errorMessage).toBeNull();
    process.env.NODE_ENV = originalEnv;
  });

  it("DEV_SET_PHASE is a no-op in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const state = makeState("ready");
    const result = reducer(state, { type: "DEV_SET_PHASE", phase: "recording" });
    expect(result).toBe(state);
    process.env.NODE_ENV = originalEnv;
  });

  it("DEV_SET_PHASE to error sets default error message", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const result = reducer(makeState("ready"), { type: "DEV_SET_PHASE", phase: "error" });
    expect(result.phase).toBe("error");
    expect(result.errorMessage).toBe("Dev test error");
    process.env.NODE_ENV = originalEnv;
  });
});
