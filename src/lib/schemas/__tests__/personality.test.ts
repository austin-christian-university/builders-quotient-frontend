import { describe, it, expect } from "vitest";
import {
  personalityPageSchema,
  personalitySubmitSchema,
} from "../personality";

const validUuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

describe("personalityPageSchema", () => {
  it("parses a valid page submission", () => {
    const input = {
      sessionId: validUuid,
      responses: [
        { itemId: "AM01", facet: "AM", value: 4, reverse: false },
        { itemId: "AM02", facet: "AM", value: 2, reverse: false },
      ],
    };
    const result = personalityPageSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts all 5 Likert values", () => {
    for (const value of [1, 2, 3, 4, 5]) {
      const input = {
        sessionId: validUuid,
        responses: [{ itemId: "AM01", facet: "AM", value, reverse: false }],
      };
      const result = personalityPageSchema.safeParse(input);
      expect(result.success).toBe(true);
    }
  });

  it("rejects Likert value 0", () => {
    const input = {
      sessionId: validUuid,
      responses: [{ itemId: "AM01", facet: "AM", value: 0, reverse: false }],
    };
    const result = personalityPageSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects Likert value 6", () => {
    const input = {
      sessionId: validUuid,
      responses: [{ itemId: "AM01", facet: "AM", value: 6, reverse: false }],
    };
    const result = personalityPageSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects fractional Likert values", () => {
    const input = {
      sessionId: validUuid,
      responses: [
        { itemId: "AM01", facet: "AM", value: 3.5, reverse: false },
      ],
    };
    const result = personalityPageSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing sessionId", () => {
    const input = {
      responses: [{ itemId: "AM01", facet: "AM", value: 3, reverse: false }],
    };
    const result = personalityPageSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID for sessionId", () => {
    const input = {
      sessionId: "not-a-uuid",
      responses: [{ itemId: "AM01", facet: "AM", value: 3, reverse: false }],
    };
    const result = personalityPageSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects empty responses array", () => {
    const input = {
      sessionId: validUuid,
      responses: [],
    };
    const result = personalityPageSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects more than 6 responses", () => {
    const input = {
      sessionId: validUuid,
      responses: Array.from({ length: 7 }, (_, i) => ({
        itemId: `AM${String(i + 1).padStart(2, "0")}`,
        facet: "AM",
        value: 3,
        reverse: false,
      })),
    };
    const result = personalityPageSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing itemId", () => {
    const input = {
      sessionId: validUuid,
      responses: [{ facet: "AM", value: 3, reverse: false }],
    };
    const result = personalityPageSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid facet code", () => {
    const input = {
      sessionId: validUuid,
      responses: [
        { itemId: "AM01", facet: "INVALID", value: 3, reverse: false },
      ],
    };
    const result = personalityPageSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts all valid facet codes", () => {
    const facets = ["AM", "RT", "IN", "AU", "SE", "ST", "IL", "GR", "AC"];
    for (const facet of facets) {
      const input = {
        sessionId: validUuid,
        responses: [{ itemId: "X01", facet, value: 3, reverse: false }],
      };
      const result = personalityPageSchema.safeParse(input);
      expect(result.success).toBe(true);
    }
  });
});

describe("personalitySubmitSchema", () => {
  it("parses valid submit input", () => {
    const result = personalitySubmitSchema.safeParse({
      sessionId: validUuid,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing sessionId", () => {
    const result = personalitySubmitSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID", () => {
    const result = personalitySubmitSchema.safeParse({
      sessionId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});
