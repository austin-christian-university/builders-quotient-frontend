import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Supabase mock: chainable builder whose terminal .eq() resolves.
let lastUpdate: Record<string, unknown> | null = null;
function createQueryBuilder() {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = chain;
  builder.insert = chain;
  builder.upsert = chain;
  builder.update = (values: Record<string, unknown>) => {
    lastUpdate = values;
    return builder;
  };
  builder.eq = chain;
  // Awaiting the chain resolves to a Supabase-shaped result.
  builder.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve({ error: null }).then(resolve);
  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({ from: () => createQueryBuilder() }),
}));

const TEST_SECRET = "a".repeat(64);
const SESSION_ID = "550e8400-e29b-41d4-a716-446655440000";
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

describe("reserveResponse authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    lastUpdate = null;
    process.env.SESSION_SECRET = TEST_SECRET;
    mockCookieStore.get.mockReturnValue(undefined);
  });

  /**
   * Regression for the 2026-08-29 incident (Sentry 7706eb50…): a student's
   * session cookie disappeared ~3 minutes into vignette 1. reserveResponse
   * threw "Session mismatch", so VignetteExperience never handed the blob to
   * the upload queue and the recording was lost. The take is timed and
   * one-shot, so "please try again" was not something the student could act on.
   */
  it("saves the response when the cookie is gone but the write token is valid", async () => {
    const { mintVignetteToken } = await import(
      "@/lib/assessment/vignette-token"
    );
    const writeToken = await mintVignetteToken(SESSION_ID, VIGNETTE_ID);
    const { reserveResponse } = await import("./response-upload");

    await expect(
      reserveResponse({ ...RESERVE_INPUT, writeToken })
    ).resolves.toEqual({ success: true });

    expect(lastUpdate).toMatchObject({
      video_duration_seconds: 75,
      upload_status: "pending",
    });
    expect(lastUpdate?.response_submitted_at).toBeTruthy();
  });

  it("still refuses when there is no cookie and no token", async () => {
    const { reserveResponse } = await import("./response-upload");

    await expect(reserveResponse(RESERVE_INPUT)).rejects.toThrow(
      /session cookie or vignette write token/i
    );
    expect(lastUpdate).toBeNull();
  });

  it("refuses a token minted for another session", async () => {
    const { mintVignetteToken } = await import(
      "@/lib/assessment/vignette-token"
    );
    const writeToken = await mintVignetteToken(
      "550e8400-e29b-41d4-a716-446655440009",
      VIGNETTE_ID
    );
    const { reserveResponse } = await import("./response-upload");

    await expect(
      reserveResponse({ ...RESERVE_INPUT, writeToken })
    ).rejects.toThrow(/does not match/i);
    expect(lastUpdate).toBeNull();
  });
});
