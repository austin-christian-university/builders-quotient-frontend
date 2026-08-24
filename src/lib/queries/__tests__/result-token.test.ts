import { describe, it, expect, vi } from "vitest";
import { resolveSessionByResultsToken } from "@/lib/queries/result-token";

vi.mock("server-only", () => ({}));

type Row = Record<string, unknown> | null;

function clientReturning(data: Row, error: unknown = null) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = chain;
  builder.eq = chain;
  builder.maybeSingle = () => Promise.resolve({ data, error });
  return { from: () => builder } as never;
}

const ROW = {
  id: "session-1",
  applicant_id: "applicant-1",
  status: "scored",
  assessment_type: "public",
  personality_completed_at: null,
  archetype_name: "The Theorist",
  archetype_tagline: "Maps the invisible structures",
  archetype_description: "You think in systems.",
  archetype_based_on_category: null,
  archetype_variant: "balanced",
  applicants: { id: "applicant-1", display_name: "Jonah", lead_type: "general_interest" },
};

describe("resolveSessionByResultsToken", () => {
  it("maps a scored session row to camelCase", async () => {
    const result = await resolveSessionByResultsToken(clientReturning(ROW), "tok");
    expect(result).toEqual({
      id: "session-1",
      applicantId: "applicant-1",
      status: "scored",
      assessmentType: "public",
      personalityCompletedAt: null,
      archetypeName: "The Theorist",
      archetypeTagline: "Maps the invisible structures",
      archetypeDescription: "You think in systems.",
      archetypeBasedOnCategory: null,
      archetypeVariant: "balanced",
      applicant: { id: "applicant-1", displayName: "Jonah", leadType: "general_interest" },
    });
  });

  it("returns null for an unknown token", async () => {
    expect(await resolveSessionByResultsToken(clientReturning(null), "nope")).toBeNull();
  });

  it("returns null when the session is not viewable", async () => {
    const row = { ...ROW, status: "invalidated" };
    expect(await resolveSessionByResultsToken(clientReturning(row), "tok")).toBeNull();
  });

  it("returns null for an in-progress session", async () => {
    const row = { ...ROW, status: "in_progress" };
    expect(await resolveSessionByResultsToken(clientReturning(row), "tok")).toBeNull();
  });

  it("returns null on a query error", async () => {
    const result = await resolveSessionByResultsToken(
      clientReturning(null, { message: "boom" }),
      "tok"
    );
    expect(result).toBeNull();
  });

  it("returns null for an oversized token without querying", async () => {
    const from = vi.fn();
    const result = await resolveSessionByResultsToken({ from } as never, "x".repeat(129));
    expect(result).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });
});
