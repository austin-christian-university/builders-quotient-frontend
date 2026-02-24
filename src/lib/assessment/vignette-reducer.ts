export type Phase =
  | "ready"
  | "countdown"
  | "narrating"
  | "buffer_1"
  | "recording_1"
  | "buffer_2"
  | "recording_2"
  | "submitting"
  | "transitioning"
  | "error";

export type Action =
  | { type: "BEGIN" }
  | { type: "BEGIN_COUNTDOWN" }
  | { type: "COUNTDOWN_COMPLETE" }
  | { type: "NARRATION_COMPLETE" }
  | { type: "BUFFER_1_COMPLETE" }
  | { type: "RECORDING_1_COMPLETE" }
  | { type: "BUFFER_2_COMPLETE" }
  | { type: "RECORDING_2_COMPLETE" }
  | { type: "SUBMIT_COMPLETE" }
  | { type: "ERROR"; message: string }
  | { type: "DEV_SET_PHASE"; phase: Phase; errorMessage?: string };

export type State = {
  phase: Phase;
  errorMessage: string | null;
  retryCount: number;
};

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "BEGIN":
      return state.phase === "ready"
        ? { ...state, phase: "narrating" }
        : state;
    case "BEGIN_COUNTDOWN":
      return state.phase === "ready"
        ? { ...state, phase: "countdown" }
        : state;
    case "COUNTDOWN_COMPLETE":
      return state.phase === "countdown"
        ? { ...state, phase: "narrating" }
        : state;
    case "NARRATION_COMPLETE":
      return state.phase === "narrating"
        ? { ...state, phase: "buffer_1" }
        : state;
    case "BUFFER_1_COMPLETE":
      return state.phase === "buffer_1"
        ? { ...state, phase: "recording_1" }
        : state;
    case "RECORDING_1_COMPLETE":
      return state.phase === "recording_1"
        ? { ...state, phase: "buffer_2" }
        : state;
    case "BUFFER_2_COMPLETE":
      return state.phase === "buffer_2"
        ? { ...state, phase: "recording_2" }
        : state;
    case "RECORDING_2_COMPLETE":
      return state.phase === "recording_2"
        ? { ...state, phase: "submitting" }
        : state;
    case "SUBMIT_COMPLETE":
      return state.phase === "submitting"
        ? { ...state, phase: "transitioning" }
        : state;
    case "ERROR":
      return { ...state, phase: "error", errorMessage: action.message };
    case "DEV_SET_PHASE":
      if (process.env.NODE_ENV !== "development") return state;
      return {
        phase: action.phase,
        errorMessage: action.phase === "error" ? (action.errorMessage ?? "Dev test error") : null,
        retryCount: 0,
      };
    default:
      return state;
  }
}
