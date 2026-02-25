import { describe, it, expect, vi } from "vitest";
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

  it("ready + BEGIN_COUNTDOWN -> countdown", () => {
    const result = reducer(makeState("ready"), { type: "BEGIN_COUNTDOWN" });
    expect(result.phase).toBe("countdown");
  });

  it("countdown + COUNTDOWN_COMPLETE -> narrating", () => {
    const result = reducer(makeState("countdown"), { type: "COUNTDOWN_COMPLETE" });
    expect(result.phase).toBe("narrating");
  });

  it("narrating + NARRATION_COMPLETE -> buffer_1", () => {
    const result = reducer(makeState("narrating"), { type: "NARRATION_COMPLETE" });
    expect(result.phase).toBe("buffer_1");
  });

  it("buffer_1 + BUFFER_1_COMPLETE -> recording_1", () => {
    const result = reducer(makeState("buffer_1"), { type: "BUFFER_1_COMPLETE" });
    expect(result.phase).toBe("recording_1");
  });

  it("recording_1 + RECORDING_1_COMPLETE -> buffer_2", () => {
    const result = reducer(makeState("recording_1"), { type: "RECORDING_1_COMPLETE" });
    expect(result.phase).toBe("buffer_2");
  });

  it("buffer_2 + BUFFER_2_COMPLETE -> recording_2", () => {
    const result = reducer(makeState("buffer_2"), { type: "BUFFER_2_COMPLETE" });
    expect(result.phase).toBe("recording_2");
  });

  it("recording_2 + RECORDING_2_COMPLETE -> buffer_3", () => {
    const result = reducer(makeState("recording_2"), { type: "RECORDING_2_COMPLETE" });
    expect(result.phase).toBe("buffer_3");
  });

  it("buffer_3 + BUFFER_3_COMPLETE -> recording_3", () => {
    const result = reducer(makeState("buffer_3"), { type: "BUFFER_3_COMPLETE" });
    expect(result.phase).toBe("recording_3");
  });

  it("recording_3 + RECORDING_3_COMPLETE -> submitting", () => {
    const result = reducer(makeState("recording_3"), { type: "RECORDING_3_COMPLETE" });
    expect(result.phase).toBe("submitting");
  });

  it("submitting + SUBMIT_COMPLETE -> transitioning", () => {
    const result = reducer(makeState("submitting"), { type: "SUBMIT_COMPLETE" });
    expect(result.phase).toBe("transitioning");
  });

  // --- Full happy path ---
  it("full sequence: ready -> ... -> transitioning", () => {
    let state = makeState("ready");
    state = reducer(state, { type: "BEGIN_COUNTDOWN" });
    expect(state.phase).toBe("countdown");
    state = reducer(state, { type: "COUNTDOWN_COMPLETE" });
    expect(state.phase).toBe("narrating");
    state = reducer(state, { type: "NARRATION_COMPLETE" });
    expect(state.phase).toBe("buffer_1");
    state = reducer(state, { type: "BUFFER_1_COMPLETE" });
    expect(state.phase).toBe("recording_1");
    state = reducer(state, { type: "RECORDING_1_COMPLETE" });
    expect(state.phase).toBe("buffer_2");
    state = reducer(state, { type: "BUFFER_2_COMPLETE" });
    expect(state.phase).toBe("recording_2");
    state = reducer(state, { type: "RECORDING_2_COMPLETE" });
    expect(state.phase).toBe("buffer_3");
    state = reducer(state, { type: "BUFFER_3_COMPLETE" });
    expect(state.phase).toBe("recording_3");
    state = reducer(state, { type: "RECORDING_3_COMPLETE" });
    expect(state.phase).toBe("submitting");
    state = reducer(state, { type: "SUBMIT_COMPLETE" });
    expect(state.phase).toBe("transitioning");
  });

  // --- Guard tests (wrong phase -> no change) ---
  it("narrating + BEGIN -> stays narrating", () => {
    const state = makeState("narrating");
    const result = reducer(state, { type: "BEGIN" });
    expect(result).toBe(state);
  });

  it("buffer_1 + NARRATION_COMPLETE -> stays buffer_1", () => {
    const state = makeState("buffer_1");
    const result = reducer(state, { type: "NARRATION_COMPLETE" });
    expect(result).toBe(state);
  });

  it("narrating + BUFFER_1_COMPLETE -> stays narrating", () => {
    const state = makeState("narrating");
    const result = reducer(state, { type: "BUFFER_1_COMPLETE" });
    expect(result).toBe(state);
  });

  it("submitting + RECORDING_3_COMPLETE -> stays submitting", () => {
    const state = makeState("submitting");
    const result = reducer(state, { type: "RECORDING_3_COMPLETE" });
    expect(result).toBe(state);
  });

  it("recording_1 + BUFFER_3_COMPLETE -> stays recording_1", () => {
    const state = makeState("recording_1");
    const result = reducer(state, { type: "BUFFER_3_COMPLETE" });
    expect(result).toBe(state);
  });

  it("buffer_2 + RECORDING_3_COMPLETE -> stays buffer_2", () => {
    const state = makeState("buffer_2");
    const result = reducer(state, { type: "RECORDING_3_COMPLETE" });
    expect(result).toBe(state);
  });

  it("recording_2 + BUFFER_3_COMPLETE -> stays recording_2", () => {
    const state = makeState("recording_2");
    const result = reducer(state, { type: "BUFFER_3_COMPLETE" });
    expect(result).toBe(state);
  });

  // --- Error ---
  it("any phase + ERROR -> error with message", () => {
    const phases = [
      "ready", "countdown", "narrating",
      "buffer_1", "recording_1", "buffer_2", "recording_2",
      "buffer_3", "recording_3",
      "submitting", "transitioning",
    ] as const;
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
    vi.stubEnv("NODE_ENV", "development");
    const result = reducer(makeState("ready"), { type: "DEV_SET_PHASE", phase: "recording_3" });
    expect(result.phase).toBe("recording_3");
    expect(result.errorMessage).toBeNull();
    vi.unstubAllEnvs();
  });

  it("DEV_SET_PHASE is a no-op in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const state = makeState("ready");
    const result = reducer(state, { type: "DEV_SET_PHASE", phase: "recording_3" });
    expect(result).toBe(state);
    vi.unstubAllEnvs();
  });

  it("DEV_SET_PHASE to error sets default error message", () => {
    vi.stubEnv("NODE_ENV", "development");
    const result = reducer(makeState("ready"), { type: "DEV_SET_PHASE", phase: "error" });
    expect(result.phase).toBe("error");
    expect(result.errorMessage).toBe("Dev test error");
    vi.unstubAllEnvs();
  });

  it("DEV_SET_PHASE to buffer_3 works", () => {
    vi.stubEnv("NODE_ENV", "development");
    const result = reducer(makeState("ready"), { type: "DEV_SET_PHASE", phase: "buffer_3" });
    expect(result.phase).toBe("buffer_3");
    vi.unstubAllEnvs();
  });
});
