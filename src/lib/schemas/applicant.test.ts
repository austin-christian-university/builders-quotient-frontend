import { describe, it, expect } from "vitest";
import { emailCaptureSchema } from "./applicant";

const validInput = {
  email: "test@example.com",
  phone: "5125551234",
  leadType: "prospective_student" as const,
};

describe("emailCaptureSchema", () => {
  it("accepts valid email with leadType", () => {
    const result = emailCaptureSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts email with optional firstName", () => {
    const result = emailCaptureSchema.safeParse({
      ...validInput,
      firstName: "Jane",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe("Jane");
    }
  });

  it("trims whitespace from email", () => {
    const result = emailCaptureSchema.safeParse({
      ...validInput,
      email: "  test@example.com  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("trims whitespace from firstName", () => {
    const result = emailCaptureSchema.safeParse({
      ...validInput,
      firstName: "  Jane  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe("Jane");
    }
  });

  it("rejects invalid email", () => {
    const result = emailCaptureSchema.safeParse({
      ...validInput,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = emailCaptureSchema.safeParse({
      ...validInput,
      email: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = emailCaptureSchema.safeParse({
      leadType: "prospective_student",
    });
    expect(result.success).toBe(false);
  });

  it("rejects firstName over 100 characters", () => {
    const result = emailCaptureSchema.safeParse({
      ...validInput,
      firstName: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts firstName at exactly 100 characters", () => {
    const result = emailCaptureSchema.safeParse({
      ...validInput,
      firstName: "a".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("provides custom error message for invalid email", () => {
    const result = emailCaptureSchema.safeParse({
      ...validInput,
      email: "bad",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find(
        (i) => i.path[0] === "email"
      );
      expect(emailError?.message).toBe("Please enter a valid email address");
    }
  });

  it("accepts valid 10-digit phone", () => {
    const result = emailCaptureSchema.safeParse({
      ...validInput,
      phone: "(512) 555-1234",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("+15125551234");
    }
  });

  it("rejects missing phone", () => {
    const { phone: _phone, ...noPhone } = validInput; // eslint-disable-line @typescript-eslint/no-unused-vars
    const result = emailCaptureSchema.safeParse(noPhone);
    expect(result.success).toBe(false);
  });

  it("normalizes phone to E.164 format", () => {
    const result = emailCaptureSchema.safeParse({
      ...validInput,
      phone: "1-512-555-1234",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("+15125551234");
    }
  });

  it("rejects missing leadType", () => {
    const result = emailCaptureSchema.safeParse({
      email: "test@example.com",
      phone: "5125551234",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid leadType", () => {
    const result = emailCaptureSchema.safeParse({
      email: "test@example.com",
      phone: "5125551234",
      leadType: "something_else",
    });
    expect(result.success).toBe(false);
  });

  it("accepts both leadType values", () => {
    for (const leadType of ["prospective_student", "general_interest"]) {
      const result = emailCaptureSchema.safeParse({
        email: "test@example.com",
        phone: "5125551234",
        leadType,
      });
      expect(result.success).toBe(true);
    }
  });

  it("provides custom error message for missing leadType", () => {
    const result = emailCaptureSchema.safeParse({
      email: "test@example.com",
      phone: "5125551234",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const leadTypeError = result.error.issues.find(
        (i) => i.path[0] === "leadType"
      );
      expect(leadTypeError?.message).toBe(
        "Please select what best describes you"
      );
    }
  });
});
