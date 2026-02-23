import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";

// Mock server-only (throws at import in non-server environments)
vi.mock("server-only", () => ({}));

// Mock next/headers cookies
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const TEST_SECRET = "a".repeat(64); // 64-char hex string
const TEST_SESSION_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("session-cookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = TEST_SECRET;
  });

  describe("createSessionCookie", () => {
    it("signs a JWT and sets an httpOnly cookie", async () => {
      const { createSessionCookie } = await import("./session-cookie");

      await createSessionCookie(TEST_SESSION_ID);

      expect(mockCookieStore.set).toHaveBeenCalledOnce();
      const [name, token, options] = mockCookieStore.set.mock.calls[0];

      expect(name).toBe("bq-session");
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // valid JWT structure
      expect(options).toMatchObject({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 7200,
      });
    });

    it("throws when SESSION_SECRET is missing", async () => {
      delete process.env.SESSION_SECRET;
      // Re-import to get fresh module
      vi.resetModules();
      vi.mock("server-only", () => ({}));
      vi.mock("next/headers", () => ({
        cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
      }));

      const { createSessionCookie } = await import("./session-cookie");

      await expect(createSessionCookie(TEST_SESSION_ID)).rejects.toThrow(
        "Missing SESSION_SECRET"
      );
    });
  });

  describe("readSessionCookie", () => {
    it("returns session ID from a valid JWT", async () => {
      const { createSessionCookie, readSessionCookie } = await import(
        "./session-cookie"
      );

      // Create a cookie first to capture the token
      await createSessionCookie(TEST_SESSION_ID);
      const token = mockCookieStore.set.mock.calls[0][1];

      // Mock reading that token back
      mockCookieStore.get.mockReturnValue({ value: token });

      const result = await readSessionCookie();
      expect(result).toBe(TEST_SESSION_ID);
    });

    it("returns null when no cookie exists", async () => {
      const { readSessionCookie } = await import("./session-cookie");

      mockCookieStore.get.mockReturnValue(undefined);

      const result = await readSessionCookie();
      expect(result).toBeNull();
    });

    it("returns null for a tampered token", async () => {
      const { readSessionCookie } = await import("./session-cookie");

      // Create a JWT signed with a different secret
      const wrongSecret = new TextEncoder().encode("b".repeat(64));
      const tamperedToken = await new SignJWT({ sid: TEST_SESSION_ID })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setIssuer("bq:assess")
        .setAudience("bq:assess")
        .setExpirationTime("2h")
        .sign(wrongSecret);

      mockCookieStore.get.mockReturnValue({ value: tamperedToken });

      const result = await readSessionCookie();
      expect(result).toBeNull();
    });

    it("returns null for an expired token", async () => {
      const { readSessionCookie } = await import("./session-cookie");

      // Create a JWT that's already expired
      const secret = new TextEncoder().encode(TEST_SECRET);
      const expiredToken = await new SignJWT({ sid: TEST_SESSION_ID })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt(Math.floor(Date.now() / 1000) - 10000)
        .setIssuer("bq:assess")
        .setAudience("bq:assess")
        .setExpirationTime(Math.floor(Date.now() / 1000) - 5000)
        .sign(secret);

      mockCookieStore.get.mockReturnValue({ value: expiredToken });

      const result = await readSessionCookie();
      expect(result).toBeNull();
    });

    it("returns null for a token with wrong issuer", async () => {
      const { readSessionCookie } = await import("./session-cookie");

      const secret = new TextEncoder().encode(TEST_SECRET);
      const wrongIssuerToken = await new SignJWT({ sid: TEST_SESSION_ID })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setIssuer("wrong:issuer")
        .setAudience("bq:assess")
        .setExpirationTime("2h")
        .sign(secret);

      mockCookieStore.get.mockReturnValue({ value: wrongIssuerToken });

      const result = await readSessionCookie();
      expect(result).toBeNull();
    });

    it("returns null for a token with wrong audience", async () => {
      const { readSessionCookie } = await import("./session-cookie");

      const secret = new TextEncoder().encode(TEST_SECRET);
      const wrongAudienceToken = await new SignJWT({ sid: TEST_SESSION_ID })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setIssuer("bq:assess")
        .setAudience("wrong:audience")
        .setExpirationTime("2h")
        .sign(secret);

      mockCookieStore.get.mockReturnValue({ value: wrongAudienceToken });

      const result = await readSessionCookie();
      expect(result).toBeNull();
    });

    it("returns null for garbage input", async () => {
      const { readSessionCookie } = await import("./session-cookie");

      mockCookieStore.get.mockReturnValue({ value: "not-a-jwt" });

      const result = await readSessionCookie();
      expect(result).toBeNull();
    });
  });

  describe("clearSessionCookie", () => {
    it("deletes the cookie with correct name and path", async () => {
      const { clearSessionCookie } = await import("./session-cookie");

      await clearSessionCookie();

      expect(mockCookieStore.delete).toHaveBeenCalledWith({
        name: "bq-session",
        path: "/",
      });
    });
  });

  describe("round-trip", () => {
    it("create → read returns the same session ID", async () => {
      const { createSessionCookie, readSessionCookie } = await import(
        "./session-cookie"
      );

      await createSessionCookie(TEST_SESSION_ID);
      const token = mockCookieStore.set.mock.calls[0][1];
      mockCookieStore.get.mockReturnValue({ value: token });

      const result = await readSessionCookie();
      expect(result).toBe(TEST_SESSION_ID);
    });
  });
});
