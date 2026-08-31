import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const mockGetActiveSession =
  vi.fn<(id: string) => Promise<Record<string, unknown> | null>>();
const mockGetSessionById =
  vi.fn<(id: string) => Promise<Record<string, unknown> | null>>();
vi.mock("@/lib/queries/session", () => ({
  getActiveSession: (...args: unknown[]) =>
    mockGetActiveSession(...(args as [string])),
  getSessionById: (...args: unknown[]) =>
    mockGetSessionById(...(args as [string])),
  UNSCORED_STATUSES: ["assigned", "in_progress", "completed"],
}));

// Supabase mock. Records the table, the update payload, and every .eq() filter,
// so a query that forgot to scope itself to this session cannot pass silently.
type Call = {
  table: string;
  update: Record<string, unknown> | null;
  eq: [string, unknown][];
  neq: [string, unknown][];
};
let calls: Call[] = [];
/** The student_responses row the actions read before writing. null = missing. */
let existingRow: Record<string, unknown> | null = {
  upload_status: "pending",
  response_submitted_at: null,
};
/** Rows returned by an update ... .select("id"). Empty = "matched nothing". */
let updatedRows: { id: string }[] = [{ id: "row-1" }];
let updateError: unknown = null;
const rpc = vi.fn().mockResolvedValue({ error: null });

function createQueryBuilder(table: string) {
  const call: Call = { table, update: null, eq: [], neq: [] };
  calls.push(call);
  const builder: Record<string, unknown> = {};
  let isUpdate = false;
  const chain = () => builder;
  builder.select = chain;
  builder.insert = chain;
  builder.upsert = chain;
  builder.update = (values: Record<string, unknown>) => {
    isUpdate = true;
    call.update = values;
    return builder;
  };
  builder.eq = (col: string, val: unknown) => {
    call.eq.push([col, val]);
    return builder;
  };
  builder.neq = (col: string, val: unknown) => {
    call.neq.push([col, val]);
    return builder;
  };
  builder.is = chain;
  // Read path: .select(...).maybeSingle()
  builder.maybeSingle = () =>
    Promise.resolve({ data: existingRow, error: null });
  builder.single = () => Promise.resolve({ data: existingRow, error: null });
  // Write path: awaiting the chain (with or without a trailing .select("id"))
  builder.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(
      isUpdate
        ? { data: updateError ? null : updatedRows, error: updateError }
        : { data: existingRow, error: null }
    ).then(resolve);
  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    from: (table: string) => createQueryBuilder(table),
    rpc,
  }),
}));

const TEST_SECRET = "a".repeat(64);
const SESSION_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_SESSION_ID = "550e8400-e29b-41d4-a716-446655440009";
const VIGNETTE_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

const RESERVE_INPUT = {
  sessionId: SESSION_ID,
  vignetteId: VIGNETTE_ID,
  vignetteType: "practical" as const,
  step: 1,
  responsePhase: 1,
  videoDurationSeconds: 75,
  recordingStartedAt: new Date("2026-08-29T02:16:30.000Z").toISOString(),
};

async function token(sid = SESSION_ID, vid = VIGNETTE_ID) {
  const { mintVignetteToken } = await import("@/lib/assessment/vignette-token");
  return mintVignetteToken(sid, vid);
}

const responseCalls = () => calls.filter((c) => c.table === "student_responses");

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  calls = [];
  existingRow = { upload_status: "pending", response_submitted_at: null };
  updatedRows = [{ id: "row-1" }];
  updateError = null;
  process.env.SESSION_SECRET = TEST_SECRET;
  mockCookieStore.get.mockReturnValue(undefined);
  mockGetActiveSession.mockResolvedValue({ id: SESSION_ID, status: "in_progress" });
  mockGetSessionById.mockResolvedValue({ id: SESSION_ID, status: "in_progress" });
});

describe("reserveResponse", () => {
  /**
   * Regression for the 2026-08-29 incident (Sentry 7706eb50…): a student's
   * session cookie disappeared ~3 minutes into vignette 1. reserveResponse
   * threw "Session mismatch" and the recording — timed and one-shot — was lost.
   */
  it("saves the response when the cookie is gone but the write token is valid", async () => {
    const writeToken = await token();
    const { reserveResponse } = await import("./response-upload");

    await expect(
      reserveResponse({ ...RESERVE_INPUT, writeToken })
    ).resolves.toEqual({ success: true });

    const [timing, uploadState] = responseCalls()
      .filter((c) => c.update !== null)
      .map((c) => c.update!);
    expect(timing).toMatchObject({ video_duration_seconds: 75 });
    expect(timing.response_submitted_at).toBeTruthy();
    expect(uploadState).toMatchObject({ upload_status: "pending" });
  });

  it("scopes the update to this session, vignette and phase", async () => {
    const writeToken = await token();
    const { reserveResponse } = await import("./response-upload");

    await reserveResponse({ ...RESERVE_INPUT, writeToken });

    expect(responseCalls().find((c) => c.update !== null)!.eq).toEqual([
      ["session_id", SESSION_ID],
      ["vignette_id", VIGNETTE_ID],
      ["response_phase", 1],
    ]);
  });

  it("throws when the underlying update fails", async () => {
    const writeToken = await token();
    updateError = { message: "boom" };
    const { reserveResponse } = await import("./response-upload");

    await expect(
      reserveResponse({ ...RESERVE_INPUT, writeToken })
    ).rejects.toThrow("Failed to reserve response");
  });

  it("refuses when there is no cookie and no token", async () => {
    const { reserveResponse } = await import("./response-upload");

    // What a stale client from before this deploy sends: no token at all.
    await expect(
      reserveResponse({ ...RESERVE_INPUT, writeToken: "" })
    ).rejects.toThrow(/session cookie or vignette write token/i);
    expect(responseCalls().filter((c) => c.update !== null)).toHaveLength(0);
  });

  it("refuses a token minted for another session", async () => {
    const writeToken = await token(OTHER_SESSION_ID);
    const { reserveResponse } = await import("./response-upload");

    await expect(
      reserveResponse({ ...RESERVE_INPUT, writeToken })
    ).rejects.toThrow(/does not match/i);
    expect(responseCalls().filter((c) => c.update !== null)).toHaveLength(0);
  });

  /**
   * The client enqueues the blob regardless of how reserve goes, so a fast
   * upload can confirm BEFORE a slow/retried reserve write lands. Resetting
   * upload_status unconditionally would flip a confirmed upload back to pending
   * and leave the video in storage, never scored.
   */
  it("guards the upload-state reset in the database, not in a prior read", async () => {
    const writeToken = await token();
    const { reserveResponse } = await import("./response-upload");

    await reserveResponse({ ...RESERVE_INPUT, writeToken });

    const updates = responseCalls().filter((c) => c.update !== null);
    // Timing is unconditional; the upload-state reset carries its own
    // `upload_status <> 'uploaded'` filter so a confirmUpload that landed first
    // cannot be downgraded by a read-then-write race.
    expect(updates[0].update).toMatchObject({ video_duration_seconds: 75 });
    expect(updates[0].update).not.toHaveProperty("upload_status");
    expect(updates[1].update).toMatchObject({
      upload_status: "pending",
      needs_scoring: false,
    });
    expect(updates[1].neq).toEqual([["upload_status", "uploaded"]]);
  });

  it("throws when the update matches no rows", async () => {
    updatedRows = [];
    const writeToken = await token();
    const { reserveResponse } = await import("./response-upload");

    await expect(
      reserveResponse({ ...RESERVE_INPUT, writeToken })
    ).rejects.toThrow(/no rows matched/i);
  });

  it("refuses to accept a new response into a finished session", async () => {
    const writeToken = await token();
    mockGetActiveSession.mockResolvedValue(null);
    const { reserveResponse } = await import("./response-upload");

    await expect(
      reserveResponse({ ...RESERVE_INPUT, writeToken })
    ).rejects.toThrow(/not accepting responses/i);
    expect(responseCalls().filter((c) => c.update !== null)).toHaveLength(0);
  });
});

describe("confirmUpload", () => {
  const INPUT = {
    sessionId: SESSION_ID,
    vignetteId: VIGNETTE_ID,
    vignetteType: "practical" as const,
    step: 1,
    responsePhase: 1,
  };

  it("flags the response for scoring on the write token alone", async () => {
    const writeToken = await token();
    const { confirmUpload } = await import("./response-upload");

    await expect(confirmUpload({ ...INPUT, writeToken })).resolves.toEqual({
      success: true,
    });
    // The path is derived server-side, never taken from the caller.
    expect(responseCalls().at(-1)?.update).toMatchObject({
      video_storage_path: `${SESSION_ID}/practical_1_phase1.webm`,
      upload_status: "uploaded",
      needs_scoring: true,
    });
  });

  /**
   * reserveResponse marks the session completed on step 4 phase 3; that phase's
   * upload confirms seconds later. If this required an active session the final
   * video would sit in storage with needs_scoring never set.
   */
  it("still confirms after the session has been completed", async () => {
    const writeToken = await token();
    mockGetActiveSession.mockResolvedValue(null);
    const { confirmUpload } = await import("./response-upload");

    await expect(confirmUpload({ ...INPUT, writeToken })).resolves.toEqual({
      success: true,
    });
  });

  /**
   * If reserveResponse never landed, getCompletedSteps would treat the step as
   * incomplete and send the student back to re-record a one-shot take whose
   * video is already in storage.
   */
  it("backfills response_submitted_at when the reserve never landed", async () => {
    existingRow = { upload_status: "pending", response_submitted_at: null };
    const writeToken = await token();
    const { confirmUpload } = await import("./response-upload");

    await confirmUpload({ ...INPUT, writeToken });

    expect(
      responseCalls().find((c) => c.update !== null)!.update!.response_submitted_at
    ).toBeTruthy();
  });

  it("leaves an existing response_submitted_at alone", async () => {
    existingRow = {
      upload_status: "pending",
      response_submitted_at: "2026-08-29T02:19:00.000Z",
    };
    const writeToken = await token();
    const { confirmUpload } = await import("./response-upload");

    await confirmUpload({ ...INPUT, writeToken });

    expect(
      responseCalls().find((c) => c.update !== null)!.update
    ).not.toHaveProperty("response_submitted_at");
  });

  it("refuses once the session has been scored", async () => {
    mockGetSessionById.mockResolvedValue({ id: SESSION_ID, status: "scored" });
    const writeToken = await token();
    const { confirmUpload } = await import("./response-upload");

    await expect(confirmUpload({ ...INPUT, writeToken })).rejects.toThrow(
      /scored or abandoned/i
    );
  });

  it("refuses a token minted for another session", async () => {
    const writeToken = await token(OTHER_SESSION_ID);
    const { confirmUpload } = await import("./response-upload");

    await expect(confirmUpload({ ...INPUT, writeToken })).rejects.toThrow(
      /does not match/i
    );
    expect(responseCalls().filter((c) => c.update !== null)).toHaveLength(0);
  });
});

describe("reportUploadFailure", () => {
  const INPUT = {
    sessionId: SESSION_ID,
    vignetteId: VIGNETTE_ID,
    responsePhase: 2,
  };

  it("marks the row failed on the write token alone", async () => {
    const writeToken = await token();
    const { reportUploadFailure } = await import("./response-upload");

    await expect(
      reportUploadFailure({ ...INPUT, writeToken })
    ).resolves.toEqual({ success: true });
    expect(responseCalls().find((c) => c.update !== null)!.update).toMatchObject({
      upload_status: "failed",
    });
  });

  it("refuses a token minted for another session", async () => {
    const writeToken = await token(OTHER_SESSION_ID);
    const { reportUploadFailure } = await import("./response-upload");

    await expect(
      reportUploadFailure({ ...INPUT, writeToken })
    ).rejects.toThrow(/does not match/i);
    expect(responseCalls().filter((c) => c.update !== null)).toHaveLength(0);
  });
});

describe("reportSuspicionEvents", () => {
  const EVENTS = [
    { type: "copy", timestamp: new Date("2026-08-29T02:17:00Z").toISOString(), phase: "phase_1" },
  ];

  it("appends events on the write token alone", async () => {
    const writeToken = await token();
    const { reportSuspicionEvents } = await import("./response-upload");

    await reportSuspicionEvents({ sessionId: SESSION_ID, events: EVENTS, writeToken });

    expect(rpc).toHaveBeenCalledWith(
      "append_suspicion_flags",
      expect.objectContaining({ p_session_id: SESSION_ID })
    );
  });

  it("refuses a token minted for another session", async () => {
    const writeToken = await token(OTHER_SESSION_ID);
    const { reportSuspicionEvents } = await import("./response-upload");

    await expect(
      reportSuspicionEvents({ sessionId: SESSION_ID, events: EVENTS, writeToken })
    ).rejects.toThrow(/does not match/i);
    expect(rpc).not.toHaveBeenCalled();
  });
});
