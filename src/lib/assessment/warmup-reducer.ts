export type WarmupPhase =
  | "intro_orb"
  | "countdown"
  | "narrating"
  | "buffer_1"
  | "recording_1"
  | "buffer_2"
  | "recording_2"
  | "buffer_3"
  | "recording_3"
  | "transition_orb"
  | "consent"
  | "uploading"
  | "pre_exam_orb"
  | "done"
  | "declined";

export type WarmupAction =
  | { type: "BEGIN" }
  | { type: "COUNTDOWN_COMPLETE" }
  | { type: "NARRATION_COMPLETE" }
  | { type: "BUFFER_1_COMPLETE" }
  | { type: "RECORDING_1_COMPLETE" }
  | { type: "BUFFER_2_COMPLETE" }
  | { type: "RECORDING_2_COMPLETE" }
  | { type: "BUFFER_3_COMPLETE" }
  | { type: "RECORDING_3_COMPLETE" }
  | { type: "TRANSITION_COMPLETE" }
  | { type: "CONSENT_ACCEPTED" }
  | { type: "CONSENT_DECLINED" }
  | { type: "UPLOAD_COMPLETE" }
  | { type: "PRE_EXAM_COMPLETE" }
  | { type: "DEV_SET_PHASE"; phase: WarmupPhase };

export type WarmupState = {
  phase: WarmupPhase;
};

const TRANSITIONS: Partial<Record<WarmupPhase, Partial<Record<WarmupAction["type"], WarmupPhase>>>> = {
  intro_orb: { BEGIN: "countdown" },
  countdown: { COUNTDOWN_COMPLETE: "narrating" },
  narrating: { NARRATION_COMPLETE: "buffer_1" },
  buffer_1: { BUFFER_1_COMPLETE: "recording_1" },
  recording_1: { RECORDING_1_COMPLETE: "buffer_2" },
  buffer_2: { BUFFER_2_COMPLETE: "recording_2" },
  recording_2: { RECORDING_2_COMPLETE: "buffer_3" },
  buffer_3: { BUFFER_3_COMPLETE: "recording_3" },
  recording_3: { RECORDING_3_COMPLETE: "transition_orb" },
  transition_orb: { TRANSITION_COMPLETE: "consent" },
  consent: {
    CONSENT_ACCEPTED: "uploading",
    CONSENT_DECLINED: "declined",
  },
  uploading: { UPLOAD_COMPLETE: "pre_exam_orb" },
  pre_exam_orb: { PRE_EXAM_COMPLETE: "done" },
};

export function warmupReducer(state: WarmupState, action: WarmupAction): WarmupState {
  if (action.type === "DEV_SET_PHASE") {
    if (process.env.NODE_ENV === "production") return state;
    return { ...state, phase: action.phase };
  }

  const nextPhase = TRANSITIONS[state.phase]?.[action.type];
  if (nextPhase) {
    return { ...state, phase: nextPhase };
  }

  return state;
}

export const INITIAL_WARMUP_STATE: WarmupState = { phase: "intro_orb" };
