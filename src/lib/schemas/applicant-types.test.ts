import { describe, it, expect } from "vitest";
import { normalizeUSPhone } from "./applicant";

describe("normalizeUSPhone", () => {
  it("normalizes 10-digit number to E.164", () => {
    expect(normalizeUSPhone("5125551234")).toBe("+15125551234");
  });

  it("normalizes 11-digit number starting with 1", () => {
    expect(normalizeUSPhone("15125551234")).toBe("+15125551234");
  });

  it("strips non-digit characters", () => {
    expect(normalizeUSPhone("(512) 555-1234")).toBe("+15125551234");
    expect(normalizeUSPhone("512.555.1234")).toBe("+15125551234");
    expect(normalizeUSPhone("512 555 1234")).toBe("+15125551234");
  });

  it("handles dashes and country code prefix", () => {
    expect(normalizeUSPhone("1-512-555-1234")).toBe("+15125551234");
  });

  it("returns null for too few digits", () => {
    expect(normalizeUSPhone("51255512")).toBeNull();
    expect(normalizeUSPhone("123")).toBeNull();
  });

  it("returns null for too many digits", () => {
    expect(normalizeUSPhone("512555123456")).toBeNull();
  });

  it("returns null for 11 digits not starting with 1", () => {
    expect(normalizeUSPhone("25125551234")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(normalizeUSPhone("")).toBeNull();
  });
});
