import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---
vi.mock("server-only", () => ({}));

const mockReadSessionCookie = vi.fn<() => Promise<string | null>>();
vi.mock("@/lib/assessment/session-cookie", () => ({
  readSessionCookie: (...args: unknown[]) => mockReadSessionCookie(...(args as [])),
}));

const mockGetActiveSession = vi.fn<(id: string) => Promise<Record<string, unknown> | null>>();
vi.mock("@/lib/queries/session", () => ({
  getActiveSession: (...args: unknown[]) => mockGetActiveSession(...(args as [string])),
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
const TEST_SESSION = { id: TEST_SESSION_ID, status: "in_progress" };

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

  it("returns 401 when session is not active", async () => {
    mockReadSessionCookie.mockResolvedValue(TEST_SESSION_ID);
    mockGetActiveSession.mockResolvedValue(null);

    const res = await POST(makeRequest({ vignetteType: "practical", step: 1 }) as never);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("No active session");
  });

  it("returns 400 for invalid JSON body", async () => {
    mockReadSessionCookie.mockResolvedValue(TEST_SESSION_ID);
    mockGetActiveSession.mockResolvedValue(TEST_SESSION);

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
    mockGetActiveSession.mockResolvedValue(TEST_SESSION);

    const res = await POST(makeRequest({ vignetteType: "invalid", step: 1 }) as never);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid parameters");
  });

  it("returns 400 for step out of range", async () => {
    mockReadSessionCookie.mockResolvedValue(TEST_SESSION_ID);
    mockGetActiveSession.mockResolvedValue(TEST_SESSION);

    const res = await POST(makeRequest({ vignetteType: "practical", step: 5 }) as never);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid parameters");
  });

  it("returns 400 for step = 0", async () => {
    mockReadSessionCookie.mockResolvedValue(TEST_SESSION_ID);
    mockGetActiveSession.mockResolvedValue(TEST_SESSION);

    const res = await POST(makeRequest({ vignetteType: "practical", step: 0 }) as never);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Invalid parameters");
  });

  it("returns signed URL for valid practical request", async () => {
    mockReadSessionCookie.mockResolvedValue(TEST_SESSION_ID);
    mockGetActiveSession.mockResolvedValue(TEST_SESSION);
    mockCreateSignedUploadUrl.mockResolvedValue({
      signedUrl: "https://storage.example.com/upload?token=abc",
      token: "abc",
    });

    const res = await POST(makeRequest({ vignetteType: "practical", step: 2 }) as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.uploadUrl).toBe("https://storage.example.com/upload?token=abc");
    expect(body.storagePath).toBe(`${TEST_SESSION_ID}/practical_2.webm`);
    expect(body.token).toBe("abc");
    expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith(`${TEST_SESSION_ID}/practical_2.webm`);
  });

  it("returns signed URL for valid creative request", async () => {
    mockReadSessionCookie.mockResolvedValue(TEST_SESSION_ID);
    mockGetActiveSession.mockResolvedValue(TEST_SESSION);
    mockCreateSignedUploadUrl.mockResolvedValue({
      signedUrl: "https://storage.example.com/upload?token=def",
      token: "def",
    });

    const res = await POST(makeRequest({ vignetteType: "creative", step: 4 }) as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.storagePath).toBe(`${TEST_SESSION_ID}/creative_4.webm`);
  });

  it("returns 500 when storage URL creation fails", async () => {
    mockReadSessionCookie.mockResolvedValue(TEST_SESSION_ID);
    mockGetActiveSession.mockResolvedValue(TEST_SESSION);
    mockCreateSignedUploadUrl.mockRejectedValue(new Error("Supabase error"));

    const res = await POST(makeRequest({ vignetteType: "practical", step: 1 }) as never);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to create upload URL");
  });
});
