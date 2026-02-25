import { describe, it, expect } from "vitest";
import { sessionPayloadSchema, sessionRowSchema } from "./session";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("sessionPayloadSchema", () => {
  const validPayload = {
    sid: VALID_UUID,
    iss: "bq:assess" as const,
    aud: "bq:assess" as const,
    exp: 1700000000,
    iat: 1699990000,
  };

  it("accepts a valid payload", () => {
    const result = sessionPayloadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("accepts aud as an array", () => {
    const result = sessionPayloadSchema.safeParse({
      ...validPayload,
      aud: ["bq:assess"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID sid", () => {
    const result = sessionPayloadSchema.safeParse({
      ...validPayload,
      sid: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects wrong issuer", () => {
    const result = sessionPayloadSchema.safeParse({
      ...validPayload,
      iss: "wrong:issuer",
    });
    expect(result.success).toBe(false);
  });

  it("rejects wrong audience", () => {
    const result = sessionPayloadSchema.safeParse({
      ...validPayload,
      aud: "wrong:audience",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = sessionPayloadSchema.safeParse({ sid: VALID_UUID });
    expect(result.success).toBe(false);
  });
});

describe("sessionRowSchema", () => {
  const validRow = {
    id: VALID_UUID,
    applicant_id: VALID_UUID,
    status: "assigned" as const,
    assessment_type: "public" as const,
    practical_vignette_ids: [VALID_UUID],
    creative_vignette_ids: [],
    started_at: null,
    completed_at: null,
    created_at: "2024-01-01T00:00:00Z",
  };

  it("accepts a valid session row", () => {
    const result = sessionRowSchema.safeParse(validRow);
    expect(result.success).toBe(true);
  });

  it("defaults assessment_type to public", () => {
    const { assessment_type: _type, ...withoutType } = validRow; // eslint-disable-line @typescript-eslint/no-unused-vars
    const result = sessionRowSchema.safeParse(withoutType);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assessment_type).toBe("public");
    }
  });

  it("defaults vignette arrays to empty", () => {
    const { practical_vignette_ids: _pids, creative_vignette_ids: _cids, ...withoutIds } = // eslint-disable-line @typescript-eslint/no-unused-vars
      validRow;
    const result = sessionRowSchema.safeParse(withoutIds);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.practical_vignette_ids).toEqual([]);
      expect(result.data.creative_vignette_ids).toEqual([]);
    }
  });

  it("accepts all valid statuses", () => {
    for (const status of [
      "assigned",
      "in_progress",
      "completed",
      "abandoned",
    ]) {
      const result = sessionRowSchema.safeParse({ ...validRow, status });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = sessionRowSchema.safeParse({
      ...validRow,
      status: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid assessment_type", () => {
    const result = sessionRowSchema.safeParse({
      ...validRow,
      assessment_type: "enterprise",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID vignette IDs", () => {
    const result = sessionRowSchema.safeParse({
      ...validRow,
      practical_vignette_ids: ["not-a-uuid"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID id", () => {
    const result = sessionRowSchema.safeParse({ ...validRow, id: "abc" });
    expect(result.success).toBe(false);
  });
});
