export type Phase =
  | "narrating"
  | "buffer"
  | "recording"
  | "uploading"
  | "transitioning"
  | "error";

export type Action =
  | { type: "NARRATION_COMPLETE" }
  | { type: "BUFFER_COMPLETE" }
  | { type: "RECORDING_STOPPED" }
  | { type: "UPLOAD_COMPLETE" }
  | { type: "ERROR"; message: string }
  | { type: "RETRY" };

export type State = {
  phase: Phase;
  errorMessage: string | null;
  retryCount: number;
};

export function reducer(state: State, action: Action): State {
  switch (action.type) {
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
        ? { ...state, phase: "uploading" }
        : state;
    case "UPLOAD_COMPLETE":
      return state.phase === "uploading"
        ? { ...state, phase: "transitioning" }
        : state;
    case "ERROR":
      return { ...state, phase: "error", errorMessage: action.message };
    case "RETRY":
      return { phase: "uploading", errorMessage: null, retryCount: state.retryCount + 1 };
    default:
      return state;
  }
}
