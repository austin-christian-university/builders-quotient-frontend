import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---
vi.mock("server-only", () => ({}));

const mockReadSessionCookie = vi.fn<() => Promise<string | null>>();
vi.mock("@/lib/assessment/session-cookie", () => ({
  readSessionCookie: (...args: unknown[]) => mockReadSessionCookie(...(args as [])),
}));

const mockGetSessionById = vi.fn<(id: string) => Promise<Record<string, unknown> | null>>();
vi.mock("@/lib/queries/session", () => ({
  getSessionById: (...args: unknown[]) => mockGetSessionById(...(args as [string])),
  UNSCORED_STATUSES: ["assigned", "in_progress", "completed"],
}));

const mockCreateSignedUploadUrl = vi.fn<(path: string) => Promise<{ signedUrl: string; token: string }>>();
vi.mock("@/lib/supabase/storage", () => ({
  createSignedUploadUrl: (...args: unknown[]) => mockCreateSignedUploadUrl(...(args as [string])),
}));

// Import after mocks are defined
import { POST } from "./route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const TEST_SESSION_ID = "550e8400-e29b-41d4-a716-446655440000";
const STEP1_VIGNETTE_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const STEP4_VIGNETTE_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430cb";
const TEST_SESSION = {
  id: TEST_SESSION_ID,
  status: "in_progress",
  practical_vignette_ids: [STEP1_VIGNETTE_ID, "6ba7b810-9dad-11d1-80b4-00c04fd430c9"],
  creative_vignette_ids: ["6ba7b810-9dad-11d1-80b4-00c04fd430ca", STEP4_VIGNETTE_ID],
};

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session cookie", async () => {
    mockReadSessionCookie.mockResolvedValue(null);

    const res = await POST(makeRequest({ vignetteType: "practical", step: 1 }) as never);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Not authenticated");
  });

  it("returns 401 when session not found", async () => {
    mockReadSessionCookie.mockResolvedValue(TEST_SESSION_ID);
    mockGetSessionById.mockResolvedValue(null);

    const res = await POST(makeRequest({ vignetteType: "practical", step: 1 }) as never);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Session not found");
  });

  it("returns 400 for invalid JSON body", async () => {
    mockReadSessionCookie.mockResolvedValue(TEST_SESSION_ID);
    mockGetSessionById.mockResolvedValue(TEST_SESSION);

    const req = new Request("http://localhost/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });

    const res = await POST(req as never);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid request body");
  });

  it("returns 400 for invalid vignetteType", async () => {
    mockReadSessionCookie.mockResolvedValue(TEST_SESSION_ID);
    mockGetSessionById.mockResolvedValue(TEST_SESSION);

    const res = await POST(makeRequest({ vignetteType: "invalid", step: 1 }) as never);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid parameters");
  });

  it("returns 400 for step out of range", async () => {
    mockReadSessionCookie.mockResolvedValue(TEST_SESSION_ID);
    mockGetSessionById.mockResolvedValue(TEST_SESSION);

    const res = await POST(makeRequest({ vignetteType: "practical", step: 5 }) as never);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid parameters");
  });

  it("returns 400 for step = 0", async () => {
    mockReadSessionCookie.mockResolvedValue(TEST_SESSION_ID);
    mockGetSessionById.mockResolvedValue(TEST_SESSION);

    const res = await POST(makeRequest({ vignetteType: "practical", step: 0 }) as never);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid parameters");
  });

  it("returns signed URL for valid practical request", async () => {
    mockReadSessionCookie.mockResolvedValue(TEST_SESSION_ID);
    mockGetSessionById.mockResolvedValue(TEST_SESSION);
    mockCreateSignedUploadUrl.mockResolvedValue({
      signedUrl: "https://storage.example.com/upload?token=abc",
      token: "abc",
    });

    const res = await POST(makeRequest({ vignetteType: "practical", step: 2 }) as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.uploadUrl).toBe("https://storage.example.com/upload?token=abc");
    expect(body.storagePath).toBe(`${TEST_SESSION_ID}/practical_2_phase1.webm`);
    expect(body.token).toBe("abc");
    expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith(`${TEST_SESSION_ID}/practical_2_phase1.webm`);
  });

  it("returns signed URL for valid creative request", async () => {
    mockReadSessionCookie.mockResolvedValue(TEST_SESSION_ID);
    mockGetSessionById.mockResolvedValue(TEST_SESSION);
    mockCreateSignedUploadUrl.mockResolvedValue({
      signedUrl: "https://storage.example.com/upload?token=def",
      token: "def",
    });

    const res = await POST(makeRequest({ vignetteType: "creative", step: 4 }) as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.storagePath).toBe(`${TEST_SESSION_ID}/creative_4_phase1.webm`);
  });

  it("returns 500 when storage URL creation fails", async () => {
    mockReadSessionCookie.mockResolvedValue(TEST_SESSION_ID);
    mockGetSessionById.mockResolvedValue(TEST_SESSION);
    mockCreateSignedUploadUrl.mockRejectedValue(new Error("Supabase error"));

    const res = await POST(makeRequest({ vignetteType: "practical", step: 1 }) as never);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to create upload URL");
  });
});


describe("POST /api/upload — write token fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.SESSION_SECRET = "a".repeat(64);
    mockReadSessionCookie.mockResolvedValue(null);
    mockGetSessionById.mockResolvedValue(TEST_SESSION);
    mockCreateSignedUploadUrl.mockResolvedValue({
      signedUrl: "https://storage/upload",
      token: "tok",
    });
  });

  async function mint(vignetteId: string, sessionId = TEST_SESSION_ID) {
    const { mintVignetteToken } = await import("@/lib/assessment/vignette-token");
    return mintVignetteToken(sessionId, vignetteId);
  }

  it("mints a signed URL from the write token when the cookie is gone", async () => {
    const writeToken = await mint(STEP1_VIGNETTE_ID);

    const res = await POST(
      makeRequest({ vignetteType: "practical", step: 1, responsePhase: 1, writeToken }) as never
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.storagePath).toBe(`${TEST_SESSION_ID}/practical_1_phase1.webm`);
  });

  /**
   * Signed URLs are minted with `upsert: true`, so an unscoped token would let
   * a step-1 credential overwrite an already-submitted recording from step 4.
   */
  it("refuses to presign a step the token was not minted for", async () => {
    const writeToken = await mint(STEP1_VIGNETTE_ID);

    const res = await POST(
      makeRequest({ vignetteType: "creative", step: 4, responsePhase: 3, writeToken }) as never
    );

    expect(res.status).toBe(403);
    expect(mockCreateSignedUploadUrl).not.toHaveBeenCalled();
  });

  it("refuses to presign a warmup upload on a write token", async () => {
    const writeToken = await mint(STEP1_VIGNETTE_ID);

    const res = await POST(makeRequest({ warmupIndex: 1, writeToken }) as never);

    expect(res.status).toBe(403);
    expect(mockCreateSignedUploadUrl).not.toHaveBeenCalled();
  });

  it("refuses when the body names a session the credential does not cover", async () => {
    const TOKEN_SESSION_ID = "550e8400-e29b-41d4-a716-446655440099";
    const writeToken = await mint(STEP1_VIGNETTE_ID, TOKEN_SESSION_ID);

    const res = await POST(
      makeRequest({
        // A caller cannot steer the write: the signed path follows the
        // credential, and a body that disagrees with it is refused outright.
        sessionId: TEST_SESSION_ID,
        vignetteType: "practical",
        step: 1,
        responsePhase: 1,
        writeToken,
      }) as never
    );

    expect(res.status).toBe(403);
    expect(mockCreateSignedUploadUrl).not.toHaveBeenCalled();
  });

  /**
   * A student with a second tab can hold a cookie for session B while a queued
   * job belongs to session A. Signing under B while confirmUpload records A
   * would orphan the recording in storage.
   */
  it("uses the job's write token when the cookie names a different session", async () => {
    const JOB_SESSION_ID = "550e8400-e29b-41d4-a716-446655440077";
    mockReadSessionCookie.mockResolvedValue(TEST_SESSION_ID);
    mockGetSessionById.mockResolvedValue({ ...TEST_SESSION, id: JOB_SESSION_ID });
    const writeToken = await mint(STEP1_VIGNETTE_ID, JOB_SESSION_ID);

    const res = await POST(
      makeRequest({
        sessionId: JOB_SESSION_ID,
        vignetteType: "practical",
        step: 1,
        responsePhase: 1,
        writeToken,
      }) as never
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.storagePath).toBe(`${JOB_SESSION_ID}/practical_1_phase1.webm`);
  });

  it("refuses to presign for a session that has already been scored", async () => {
    mockGetSessionById.mockResolvedValue({ ...TEST_SESSION, status: "scored" });
    const writeToken = await mint(STEP1_VIGNETTE_ID);

    const res = await POST(
      makeRequest({
        sessionId: TEST_SESSION_ID,
        vignetteType: "practical",
        step: 1,
        responsePhase: 1,
        writeToken,
      }) as never
    );

    // upsert:true means a signed URL for a scored session could overwrite a
    // graded recording.
    expect(res.status).toBe(403);
    expect(mockCreateSignedUploadUrl).not.toHaveBeenCalled();
  });

  it("rejects a token signed with a foreign secret", async () => {
    const { SignJWT } = await import("jose");
    const forged = await new SignJWT({ sid: TEST_SESSION_ID, vid: STEP1_VIGNETTE_ID })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("bq:assess")
      .setAudience("bq:vignette-write")
      .setExpirationTime("45m")
      .sign(new TextEncoder().encode("b".repeat(64)));

    const res = await POST(
      makeRequest({ vignetteType: "practical", step: 1, writeToken: forged }) as never
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Not authenticated");
  });
});
