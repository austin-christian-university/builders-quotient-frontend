import { describe, it, expect } from "vitest";
import { responseSubmissionSchema } from "./response";

const validPayload = {
  sessionId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  vignetteId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  vignetteType: "practical" as const,
  step: 1,
  storagePath: "responses/session-123/pi-1.webm",
  videoDurationSeconds: 60,
  recordingStartedAt: "2026-01-15T10:30:00.000Z",
};

describe("responseSubmissionSchema", () => {
  it("parses a valid complete object", () => {
    const result = responseSubmissionSchema.parse(validPayload);
    expect(result).toEqual(validPayload);
  });

  // --- sessionId ---
  it("rejects non-UUID sessionId", () => {
    expect(() =>
      responseSubmissionSchema.parse({ ...validPayload, sessionId: "not-a-uuid" })
    ).toThrow();
  });

  // --- vignetteId ---
  it("rejects empty vignetteId", () => {
    expect(() =>
      responseSubmissionSchema.parse({ ...validPayload, vignetteId: "" })
    ).toThrow();
  });

  // --- vignetteType ---
  it("rejects invalid vignetteType", () => {
    expect(() =>
      responseSubmissionSchema.parse({
        ...validPayload,
        vignetteType: "analytical",
      })
    ).toThrow();
  });

  it("accepts practical vignetteType", () => {
    expect(() =>
      responseSubmissionSchema.parse({
        ...validPayload,
        vignetteType: "practical",
      })
    ).not.toThrow();
  });

  it("accepts creative vignetteType", () => {
    expect(() =>
      responseSubmissionSchema.parse({
        ...validPayload,
        vignetteType: "creative",
      })
    ).not.toThrow();
  });

  // --- step ---
  it("rejects step of 0", () => {
    expect(() =>
      responseSubmissionSchema.parse({ ...validPayload, step: 0 })
    ).toThrow();
  });

  it("rejects step of 5", () => {
    expect(() =>
      responseSubmissionSchema.parse({ ...validPayload, step: 5 })
    ).toThrow();
  });

  it("rejects non-integer step", () => {
    expect(() =>
      responseSubmissionSchema.parse({ ...validPayload, step: 1.5 })
    ).toThrow();
  });

  it("rejects string step", () => {
    expect(() =>
      responseSubmissionSchema.parse({ ...validPayload, step: "2" })
    ).toThrow();
  });

  it("accepts step values 1 through 4", () => {
    for (const step of [1, 2, 3, 4]) {
      expect(() =>
        responseSubmissionSchema.parse({ ...validPayload, step })
      ).not.toThrow();
    }
  });

  // --- storagePath ---
  it("rejects empty storagePath", () => {
    expect(() =>
      responseSubmissionSchema.parse({ ...validPayload, storagePath: "" })
    ).toThrow();
  });

  // --- videoDurationSeconds ---
  it("rejects videoDurationSeconds of 0", () => {
    expect(() =>
      responseSubmissionSchema.parse({
        ...validPayload,
        videoDurationSeconds: 0,
      })
    ).toThrow();
  });

  it("rejects videoDurationSeconds over 300", () => {
    expect(() =>
      responseSubmissionSchema.parse({
        ...validPayload,
        videoDurationSeconds: 301,
      })
    ).toThrow();
  });

  it("rejects negative videoDurationSeconds", () => {
    expect(() =>
      responseSubmissionSchema.parse({
        ...validPayload,
        videoDurationSeconds: -1,
      })
    ).toThrow();
  });

  it("accepts videoDurationSeconds at boundaries", () => {
    for (const val of [10, 90, 180]) {
      expect(() =>
        responseSubmissionSchema.parse({
          ...validPayload,
          videoDurationSeconds: val,
        })
      ).not.toThrow();
    }
  });

  // --- recordingStartedAt ---
  it("rejects invalid datetime string", () => {
    expect(() =>
      responseSubmissionSchema.parse({
        ...validPayload,
        recordingStartedAt: "not-a-date",
      })
    ).toThrow();
  });

  it("accepts valid ISO datetime", () => {
    expect(() =>
      responseSubmissionSchema.parse({
        ...validPayload,
        recordingStartedAt: "2026-02-20T14:00:00.000Z",
      })
    ).not.toThrow();
  });

  // --- missing required fields ---
  it("rejects when a required field is missing", () => {
    const { sessionId: _, ...withoutSession } = validPayload;
    expect(() => responseSubmissionSchema.parse(withoutSession)).toThrow();
  });

  // --- extra fields stripped ---
  it("strips extra fields", () => {
    const result = responseSubmissionSchema.parse({
      ...validPayload,
      extraField: "should be gone",
    });
    expect(result).not.toHaveProperty("extraField");
  });
});
