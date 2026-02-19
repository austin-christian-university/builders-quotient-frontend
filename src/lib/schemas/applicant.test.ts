import { describe, it, expect } from "vitest";
import { emailCaptureSchema } from "./applicant";

describe("emailCaptureSchema", () => {
  it("accepts valid email only", () => {
    const result = emailCaptureSchema.safeParse({ email: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("accepts email with optional firstName", () => {
    const result = emailCaptureSchema.safeParse({
      email: "test@example.com",
      firstName: "Jane",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe("Jane");
    }
  });

  it("trims whitespace from email", () => {
    const result = emailCaptureSchema.safeParse({
      email: "  test@example.com  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("trims whitespace from firstName", () => {
    const result = emailCaptureSchema.safeParse({
      email: "test@example.com",
      firstName: "  Jane  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe("Jane");
    }
  });

  it("rejects invalid email", () => {
    const result = emailCaptureSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = emailCaptureSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = emailCaptureSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects firstName over 100 characters", () => {
    const result = emailCaptureSchema.safeParse({
      email: "test@example.com",
      firstName: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts firstName at exactly 100 characters", () => {
    const result = emailCaptureSchema.safeParse({
      email: "test@example.com",
      firstName: "a".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("provides custom error message for invalid email", () => {
    const result = emailCaptureSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find(
        (i) => i.path[0] === "email"
      );
      expect(emailError?.message).toBe("Please enter a valid email address");
    }
  });
});
