import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const TEST_SECRET = "a".repeat(64);
const SESSION_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_SESSION_ID = "550e8400-e29b-41d4-a716-446655440001";
const VIGNETTE_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const OTHER_VIGNETTE_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c9";

function secret() {
  return new TextEncoder().encode(TEST_SECRET);
}

/** Mirrors createSessionCookie's signing so we can seed a cookie value. */
async function signSessionCookie(sid: string, expiresIn = "2h") {
  return new SignJWT({ sid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("bq:assess")
    .setAudience("bq:assess")
    .setExpirationTime(expiresIn)
    .sign(secret());
}

function setCookie(token: string | undefined) {
  mockCookieStore.get.mockReturnValue(token ? { value: token } : undefined);
}

describe("authorizeVignetteWrite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.SESSION_SECRET = TEST_SECRET;
  });

  it("authorizes and slides the TTL when the cookie names the session", async () => {
    setCookie(await signSessionCookie(SESSION_ID));
    const { authorizeVignetteWrite } = await import("./vignette-auth");

    await expect(
      authorizeVignetteWrite({ sessionId: SESSION_ID, vignetteId: VIGNETTE_ID })
    ).resolves.toBeUndefined();

    // TTL refreshed so a long four-vignette run cannot age out mid-assessment.
    expect(mockCookieStore.set).toHaveBeenCalledOnce();
  });

  /**
   * The regression this whole change exists for: on 2026-08-29 a student's
   * cookie went away ~3 minutes into vignette 1. reserveResponse threw
   * "Session mismatch", the blob was never enqueued, and the recording — which
   * is timed and cannot be repeated — was destroyed.
   */
  it("authorizes on the write token alone when the cookie is gone", async () => {
    setCookie(undefined);
    const { mintVignetteToken } = await import("./vignette-token");
    const writeToken = await mintVignetteToken(SESSION_ID, VIGNETTE_ID);
    const { authorizeVignetteWrite } = await import("./vignette-auth");

    await expect(
      authorizeVignetteWrite({
        sessionId: SESSION_ID,
        vignetteId: VIGNETTE_ID,
        writeToken,
      })
    ).resolves.toBeUndefined();
  });

  it("re-issues the session cookie when authorizing on the token", async () => {
    setCookie(undefined);
    const { mintVignetteToken } = await import("./vignette-token");
    const writeToken = await mintVignetteToken(SESSION_ID, VIGNETTE_ID);
    const { authorizeVignetteWrite } = await import("./vignette-auth");

    await authorizeVignetteWrite({
      sessionId: SESSION_ID,
      vignetteId: VIGNETTE_ID,
      writeToken,
    });

    // Without this the next render bounces the student to /assess/setup and
    // strands the response we just saved.
    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    expect(mockCookieStore.set.mock.calls[0][0]).toBe("bq-session");
  });

  it("rejects with reason=expired when neither credential is usable", async () => {
    setCookie(undefined);
    const { authorizeVignetteWrite, VignetteAuthError } = await import(
      "./vignette-auth"
    );

    const err = await authorizeVignetteWrite({
      sessionId: SESSION_ID,
      vignetteId: VIGNETTE_ID,
    }).catch((e) => e);

    expect(err).toBeInstanceOf(VignetteAuthError);
    expect(err.reason).toBe("expired");
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  it("rejects a token minted for a different vignette", async () => {
    setCookie(undefined);
    const { mintVignetteToken } = await import("./vignette-token");
    const writeToken = await mintVignetteToken(SESSION_ID, OTHER_VIGNETTE_ID);
    const { authorizeVignetteWrite, VignetteAuthError } = await import(
      "./vignette-auth"
    );

    const err = await authorizeVignetteWrite({
      sessionId: SESSION_ID,
      vignetteId: VIGNETTE_ID,
      writeToken,
    }).catch((e) => e);

    expect(err).toBeInstanceOf(VignetteAuthError);
    expect(err.reason).toBe("mismatch");
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  it("rejects a token minted for a different session", async () => {
    setCookie(undefined);
    const { mintVignetteToken } = await import("./vignette-token");
    const writeToken = await mintVignetteToken(OTHER_SESSION_ID, VIGNETTE_ID);
    const { authorizeVignetteWrite } = await import("./vignette-auth");

    const err = await authorizeVignetteWrite({
      sessionId: SESSION_ID,
      vignetteId: VIGNETTE_ID,
      writeToken,
    }).catch((e) => e);

    expect(err.reason).toBe("mismatch");
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  it("rejects a token signed with a different secret", async () => {
    setCookie(undefined);
    const forged = await new SignJWT({ sid: SESSION_ID, vid: VIGNETTE_ID })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("bq:assess")
      .setAudience("bq:vignette-write")
      .setExpirationTime("4h")
      .sign(new TextEncoder().encode("b".repeat(64)));

    const { authorizeVignetteWrite } = await import("./vignette-auth");

    const err = await authorizeVignetteWrite({
      sessionId: SESSION_ID,
      vignetteId: VIGNETTE_ID,
      writeToken: forged,
    }).catch((e) => e);

    expect(err.reason).toBe("expired");
  });

  it("rejects a session cookie that names a different session", async () => {
    setCookie(await signSessionCookie(OTHER_SESSION_ID));
    const { authorizeVignetteWrite } = await import("./vignette-auth");

    const err = await authorizeVignetteWrite({
      sessionId: SESSION_ID,
      vignetteId: VIGNETTE_ID,
    }).catch((e) => e);

    expect(err.reason).toBe("mismatch");
  });

  it("does not accept a session cookie as a write token", async () => {
    setCookie(undefined);
    const sessionJwt = await signSessionCookie(SESSION_ID);
    const { authorizeVignetteWrite } = await import("./vignette-auth");

    // Different audience — a session cookie must not stand in for a
    // vignette-scoped capability.
    const err = await authorizeVignetteWrite({
      sessionId: SESSION_ID,
      vignetteId: VIGNETTE_ID,
      writeToken: sessionJwt,
    }).catch((e) => e);

    expect(err.reason).toBe("expired");
  });
});

describe("vignette-token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.SESSION_SECRET = TEST_SECRET;
  });

  it("round-trips its claims", async () => {
    const { mintVignetteToken, verifyVignetteToken } = await import(
      "./vignette-token"
    );
    const token = await mintVignetteToken(SESSION_ID, VIGNETTE_ID);

    await expect(verifyVignetteToken(token)).resolves.toEqual({
      sessionId: SESSION_ID,
      vignetteId: VIGNETTE_ID,
    });
  });

  it("returns null for a missing token", async () => {
    const { verifyVignetteToken } = await import("./vignette-token");
    await expect(verifyVignetteToken(undefined)).resolves.toBeNull();
    await expect(verifyVignetteToken("")).resolves.toBeNull();
  });

  it("throws rather than returning null when SESSION_SECRET is unset", async () => {
    const { mintVignetteToken } = await import("./vignette-token");
    const token = await mintVignetteToken(SESSION_ID, VIGNETTE_ID);

    delete process.env.SESSION_SECRET;
    vi.resetModules();
    const { verifyVignetteToken } = await import("./vignette-token");

    // A config failure must be loud, not reported as "not authorized".
    await expect(verifyVignetteToken(token)).rejects.toThrow(
      "Missing SESSION_SECRET"
    );
  });
});
