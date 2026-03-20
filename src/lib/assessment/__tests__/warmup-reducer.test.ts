import { describe, it, expect } from "vitest";
import { warmupReducer, type WarmupState } from "../warmup-reducer";

function createState(overrides: Partial<WarmupState> = {}): WarmupState {
  return { phase: "intro_orb", ...overrides };
}

describe("warmupReducer", () => {
  it("transitions from intro_orb to countdown on BEGIN", () => {
    const state = warmupReducer(createState(), { type: "BEGIN" });
    expect(state.phase).toBe("countdown");
  });

  it("transitions from countdown to narrating on COUNTDOWN_COMPLETE", () => {
    const state = warmupReducer(createState({ phase: "countdown" }), { type: "COUNTDOWN_COMPLETE" });
    expect(state.phase).toBe("narrating");
  });

  it("transitions from narrating to buffer_1 on NARRATION_COMPLETE", () => {
    const state = warmupReducer(createState({ phase: "narrating" }), { type: "NARRATION_COMPLETE" });
    expect(state.phase).toBe("buffer_1");
  });

  it("transitions through buffer -> recording -> buffer cycle", () => {
    let state = createState({ phase: "buffer_1" });
    state = warmupReducer(state, { type: "BUFFER_1_COMPLETE" });
    expect(state.phase).toBe("recording_1");
    state = warmupReducer(state, { type: "RECORDING_1_COMPLETE" });
    expect(state.phase).toBe("buffer_2");
    state = warmupReducer(state, { type: "BUFFER_2_COMPLETE" });
    expect(state.phase).toBe("recording_2");
    state = warmupReducer(state, { type: "RECORDING_2_COMPLETE" });
    expect(state.phase).toBe("buffer_3");
    state = warmupReducer(state, { type: "BUFFER_3_COMPLETE" });
    expect(state.phase).toBe("recording_3");
    state = warmupReducer(state, { type: "RECORDING_3_COMPLETE" });
    expect(state.phase).toBe("transition_orb");
  });

  it("transitions through post-recording phases", () => {
    let state = createState({ phase: "transition_orb" });
    state = warmupReducer(state, { type: "TRANSITION_COMPLETE" });
    expect(state.phase).toBe("consent");
    state = warmupReducer(state, { type: "CONSENT_ACCEPTED" });
    expect(state.phase).toBe("uploading");
    state = warmupReducer(state, { type: "UPLOAD_COMPLETE" });
    expect(state.phase).toBe("pre_exam_orb");
    state = warmupReducer(state, { type: "PRE_EXAM_COMPLETE" });
    expect(state.phase).toBe("done");
  });

  it("transitions to declined on CONSENT_DECLINED", () => {
    const state = warmupReducer(createState({ phase: "consent" }), { type: "CONSENT_DECLINED" });
    expect(state.phase).toBe("declined");
  });

  it("supports DEV_SET_PHASE for dev toolbar", () => {
    const state = warmupReducer(createState(), { type: "DEV_SET_PHASE", phase: "buffer_2" });
    expect(state.phase).toBe("buffer_2");
  });

  it("transitions from uploading back to consent on UPLOAD_RETRY", () => {
    const state = warmupReducer(createState({ phase: "uploading" }), { type: "UPLOAD_RETRY" });
    expect(state.phase).toBe("consent");
  });

  it("returns current state for invalid transitions", () => {
    const state = createState({ phase: "intro_orb" });
    const result = warmupReducer(state, { type: "NARRATION_COMPLETE" });
    expect(result).toBe(state);
  });
});
