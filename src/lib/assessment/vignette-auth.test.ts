import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SignJWT, jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

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

const TEST_SECRET = "a".repeat(64);
const SESSION_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_SESSION_ID = "550e8400-e29b-41d4-a716-446655440001";
const VIGNETTE_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const OTHER_VIGNETTE_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c9";

const COOKIE_MAX_AGE = 7200;

function secret() {
  return new TextEncoder().encode(TEST_SECRET);
}

/** Mirrors createSessionCookie's signing so we can seed a cookie value. */
async function signSessionCookie(
  sid: string,
  { expiresIn = `${COOKIE_MAX_AGE}s`, trust = "full" } = {}
) {
  return new SignJWT({ sid, trust })
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

/** Reads back the JWT the code under test wrote via cookies().set(). */
async function readSetCookiePayload() {
  const [name, value] = mockCookieStore.set.mock.calls[0];
  expect(name).toBe("bq-session");
  const { payload } = await jwtVerify(value, secret(), {
    issuer: "bq:assess",
    audience: "bq:assess",
    algorithms: ["HS256"],
  });
  return payload;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  process.env.SESSION_SECRET = TEST_SECRET;
  mockGetActiveSession.mockResolvedValue({ id: SESSION_ID, status: "in_progress" });
  mockGetSessionById.mockResolvedValue({ id: SESSION_ID, status: "in_progress" });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("authorizeVignetteWrite", () => {
  it("authorizes on a matching cookie without re-signing while TTL is healthy", async () => {
    setCookie(await signSessionCookie(SESSION_ID));
    const { authorizeVignetteWrite } = await import("./vignette-auth");

    await expect(
      authorizeVignetteWrite({ sessionId: SESSION_ID, vignetteId: VIGNETTE_ID })
    ).resolves.toBeUndefined();

    // In Next 16 a cookie write inside a Server Action forces a full RSC
    // re-render of the page. Refreshing on every save made that the cost of
    // every response.
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  it("slides the TTL once the cookie is past halfway, preserving its trust", async () => {
    setCookie(await signSessionCookie(SESSION_ID, { expiresIn: "600s" }));
    const { authorizeVignetteWrite } = await import("./vignette-auth");

    await authorizeVignetteWrite({ sessionId: SESSION_ID, vignetteId: VIGNETTE_ID });

    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const payload = await readSetCookiePayload();
    expect(payload.sid).toBe(SESSION_ID);
    expect(payload.trust).toBe("full");
    expect(mockCookieStore.set.mock.calls[0][2]).toMatchObject({
      httpOnly: true,
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
  });

  it("does not promote a degraded cookie to full when sliding its TTL", async () => {
    setCookie(
      await signSessionCookie(SESSION_ID, { expiresIn: "600s", trust: "degraded" })
    );
    const { authorizeVignetteWrite } = await import("./vignette-auth");

    await authorizeVignetteWrite({ sessionId: SESSION_ID, vignetteId: VIGNETTE_ID });

    expect((await readSetCookiePayload()).trust).toBe("degraded");
  });

  /**
   * The regression this whole change exists for: on 2026-08-29 a student's
   * cookie went away ~3 minutes into vignette 1. reserveResponse threw
   * "Session mismatch" and the recording — timed and one-shot — was destroyed.
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

  it("re-issues only a DEGRADED cookie when authorizing on the token", async () => {
    setCookie(undefined);
    const { mintVignetteToken } = await import("./vignette-token");
    const writeToken = await mintVignetteToken(SESSION_ID, VIGNETTE_ID);
    const { authorizeVignetteWrite } = await import("./vignette-auth");

    await authorizeVignetteWrite({
      sessionId: SESSION_ID,
      vignetteId: VIGNETTE_ID,
      writeToken,
    });

    // Re-issued so the next render doesn't bounce the student to /assess/setup
    // and strand the work. Degraded because the token is readable by any script
    // on the page — a full cookie minted from it would defeat httpOnly.
    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const payload = await readSetCookiePayload();
    expect(payload.sid).toBe(SESSION_ID);
    expect(payload.trust).toBe("degraded");
  });

  it("does not touch a cookie that names another session", async () => {
    setCookie(await signSessionCookie(OTHER_SESSION_ID));
    const { mintVignetteToken } = await import("./vignette-token");
    const writeToken = await mintVignetteToken(SESSION_ID, VIGNETTE_ID);
    const { authorizeVignetteWrite } = await import("./vignette-auth");

    await authorizeVignetteWrite({
      sessionId: SESSION_ID,
      vignetteId: VIGNETTE_ID,
      writeToken,
    });

    expect(mockCookieStore.set).not.toHaveBeenCalled();
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
    const { authorizeVignetteWrite } = await import("./vignette-auth");

    const err = await authorizeVignetteWrite({
      sessionId: SESSION_ID,
      vignetteId: VIGNETTE_ID,
      writeToken,
    }).catch((e) => e);

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
  });

  it("rejects a token signed with a different secret", async () => {
    setCookie(undefined);
    const forged = await new SignJWT({ sid: SESSION_ID, vid: VIGNETTE_ID })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("bq:assess")
      .setAudience("bq:vignette-write")
      .setExpirationTime("45m")
      .sign(new TextEncoder().encode("b".repeat(64)));

    const { authorizeVignetteWrite } = await import("./vignette-auth");

    const err = await authorizeVignetteWrite({
      sessionId: SESSION_ID,
      vignetteId: VIGNETTE_ID,
      writeToken: forged,
    }).catch((e) => e);

    expect(err.reason).toBe("expired");
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

  it("rejects a cookie that names a different session", async () => {
    setCookie(await signSessionCookie(OTHER_SESSION_ID));
    const { authorizeVignetteWrite } = await import("./vignette-auth");

    const err = await authorizeVignetteWrite({
      sessionId: SESSION_ID,
      vignetteId: VIGNETTE_ID,
    }).catch((e) => e);

    expect(err.reason).toBe("mismatch");
  });

  describe("session state", () => {
    it("refuses a new response once the session is no longer active", async () => {
      setCookie(await signSessionCookie(SESSION_ID));
      mockGetActiveSession.mockResolvedValue(null);
      const { authorizeVignetteWrite } = await import("./vignette-auth");

      const err = await authorizeVignetteWrite({
        sessionId: SESSION_ID,
        vignetteId: VIGNETTE_ID,
      }).catch((e) => e);

      expect(err.reason).toBe("inactive");
    });

    it("refuses a token-authorized write to an inactive session", async () => {
      setCookie(undefined);
      mockGetActiveSession.mockResolvedValue(null);
      const { mintVignetteToken } = await import("./vignette-token");
      const writeToken = await mintVignetteToken(SESSION_ID, VIGNETTE_ID);
      const { authorizeVignetteWrite } = await import("./vignette-auth");

      const err = await authorizeVignetteWrite({
        sessionId: SESSION_ID,
        vignetteId: VIGNETTE_ID,
        writeToken,
      }).catch((e) => e);

      expect(err.reason).toBe("inactive");
      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    /**
     * reserveResponse marks the session completed on step 4 phase 3, and that
     * phase's upload confirms seconds later. Gating confirmUpload on an active
     * session would leave the final video in storage, never flagged for scoring.
     */
    it("still allows finalization writes after the session completes", async () => {
      setCookie(await signSessionCookie(SESSION_ID));
      mockGetActiveSession.mockResolvedValue(null);
      mockGetSessionById.mockResolvedValue({ id: SESSION_ID, status: "completed" });
      const { authorizeVignetteWrite } = await import("./vignette-auth");

      await expect(
        authorizeVignetteWrite({
          sessionId: SESSION_ID,
          vignetteId: VIGNETTE_ID,
          sessionState: "unscored",
        })
      ).resolves.toBeUndefined();
      expect(mockGetActiveSession).not.toHaveBeenCalled();
    });

    /** A durable token must not be able to reopen a graded submission. */
    it("refuses finalization writes once the session is scored", async () => {
      setCookie(await signSessionCookie(SESSION_ID));
      mockGetSessionById.mockResolvedValue({ id: SESSION_ID, status: "scored" });
      const { authorizeVignetteWrite } = await import("./vignette-auth");

      const err = await authorizeVignetteWrite({
        sessionId: SESSION_ID,
        vignetteId: VIGNETTE_ID,
        sessionState: "unscored",
      }).catch((e) => e);

      expect(err.reason).toBe("inactive");
    });
  });
});

describe("authorizeSessionWrite", () => {
  it("accepts a vignette token for the same session without a vignette scope", async () => {
    setCookie(undefined);
    const { mintVignetteToken } = await import("./vignette-token");
    const writeToken = await mintVignetteToken(SESSION_ID, VIGNETTE_ID);
    const { authorizeSessionWrite } = await import("./vignette-auth");

    await expect(
      authorizeSessionWrite({ sessionId: SESSION_ID, writeToken })
    ).resolves.toBeUndefined();
    expect((await readSetCookiePayload()).trust).toBe("degraded");
  });

  it("rejects a token for another session with reason=mismatch", async () => {
    setCookie(undefined);
    const { mintVignetteToken } = await import("./vignette-token");
    const foreign = await mintVignetteToken(OTHER_SESSION_ID, VIGNETTE_ID);
    const { authorizeSessionWrite } = await import("./vignette-auth");

    const err = await authorizeSessionWrite({
      sessionId: SESSION_ID,
      writeToken: foreign,
    }).catch((e) => e);

    expect(err.reason).toBe("mismatch");
    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  it("reports reason=expired with no credential at all", async () => {
    setCookie(undefined);
    const { authorizeSessionWrite } = await import("./vignette-auth");

    const err = await authorizeSessionWrite({ sessionId: SESSION_ID }).catch(
      (e) => e
    );
    expect(err.reason).toBe("expired");
  });
});

describe("vignette-token", () => {
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

  it("expires, and expires strictly before the session cookie would", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-29T00:00:00Z"));

    const { mintVignetteToken, verifyVignetteToken, VIGNETTE_TOKEN_MAX_AGE_SECONDS } =
      await import("./vignette-token");
    const { SESSION_COOKIE_MAX_AGE_SECONDS } = await import("./session-cookie");

    // A longer-lived token than the cookie would let a holder renew a session
    // past the point the cookie alone would have ended it.
    expect(VIGNETTE_TOKEN_MAX_AGE_SECONDS).toBeLessThan(
      SESSION_COOKIE_MAX_AGE_SECONDS
    );

    const token = await mintVignetteToken(SESSION_ID, VIGNETTE_ID);
    await expect(verifyVignetteToken(token)).resolves.not.toBeNull();

    vi.setSystemTime(
      new Date(Date.now() + (VIGNETTE_TOKEN_MAX_AGE_SECONDS + 5) * 1000)
    );
    await expect(verifyVignetteToken(token)).resolves.toBeNull();
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
