import { describe, it, expect, vi } from "vitest";
import { getCompletedSteps } from "@/lib/queries/vignettes";

vi.mock("server-only", () => ({}));

type ResponseRow = {
  vignette_id: string;
  response_phase: number;
  upload_status: string;
};

function clientReturning(rows: ResponseRow[]) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = chain;
  builder.eq = chain;
  // `.not()` is the terminal call in getCompletedSteps
  builder.not = () => Promise.resolve({ data: rows, error: null });
  return { from: () => builder } as never;
}

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => mockClient,
}));

let mockClient: never;

const PI_A = "pi-vignette-a";
const PI_B = "pi-vignette-b";
const CI_A = "ci-vignette-a";
const CI_B = "ci-vignette-b";

const SESSION = {
  practical_vignette_ids: [PI_A, PI_B],
  creative_vignette_ids: [CI_A, CI_B],
} as never;

function phases(vignetteId: string, uploadStatus: string): ResponseRow[] {
  return [1, 2, 3].map((response_phase) => ({
    vignette_id: vignetteId,
    response_phase,
    upload_status: uploadStatus,
  }));
}

describe("getCompletedSteps — upload status gating", () => {
  it("counts a vignette complete when all three phases uploaded", async () => {
    mockClient = clientReturning(phases(PI_A, "uploaded")) as never;
    const steps = await getCompletedSteps("s1", SESSION);
    expect(steps.has(1)).toBe(true);
  });

  it("still counts a vignette complete while uploads are in flight", async () => {
    // 'pending' must NOT block the student — uploads are queued and async, and
    // blocking here would stall the assessment on a slow connection.
    mockClient = clientReturning(phases(PI_A, "pending")) as never;
    const steps = await getCompletedSteps("s1", SESSION);
    expect(steps.has(1)).toBe(true);
  });

  it("does NOT count a vignette whose uploads definitively failed", async () => {
    // There is no video behind a failed upload. Marking the step complete sends
    // the student past a vignette that can never be scored — the August 2026
    // failure mode, where three failed uploads still reached the finish screen.
    mockClient = clientReturning(phases(PI_A, "failed")) as never;
    const steps = await getCompletedSteps("s1", SESSION);
    expect(steps.has(1)).toBe(false);
  });

  it("does not count a vignette when only some phases failed", async () => {
    mockClient = clientReturning([
      { vignette_id: PI_A, response_phase: 1, upload_status: "uploaded" },
      { vignette_id: PI_A, response_phase: 2, upload_status: "failed" },
      { vignette_id: PI_A, response_phase: 3, upload_status: "uploaded" },
    ]) as never;
    const steps = await getCompletedSteps("s1", SESSION);
    expect(steps.has(1)).toBe(false);
  });

  it("isolates failure to the affected vignette", async () => {
    mockClient = clientReturning([
      ...phases(PI_A, "uploaded"),
      ...phases(PI_B, "uploaded"),
      ...phases(CI_A, "uploaded"),
      ...phases(CI_B, "failed"),
    ]) as never;
    const steps = await getCompletedSteps("s1", SESSION);
    expect(steps.has(1)).toBe(true);
    expect(steps.has(2)).toBe(true);
    expect(steps.has(3)).toBe(true);
    expect(steps.has(4)).toBe(false);
  });
});
