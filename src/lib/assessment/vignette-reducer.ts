export type Phase =
  | "ready"
  | "narrating"
  | "buffer"
  | "recording"
  | "submitting"
  | "transitioning"
  | "error";

export type Action =
  | { type: "BEGIN" }
  | { type: "NARRATION_COMPLETE" }
  | { type: "BUFFER_COMPLETE" }
  | { type: "RECORDING_STOPPED" }
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
    case "NARRATION_COMPLETE":
      return state.phase === "narrating"
        ? { ...state, phase: "buffer" }
        : state;
    case "BUFFER_COMPLETE":
      return state.phase === "buffer"
        ? { ...state, phase: "recording" }
        : state;
    case "RECORDING_STOPPED":
      return state.phase === "recording"
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
