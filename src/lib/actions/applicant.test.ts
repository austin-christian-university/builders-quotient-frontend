import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---
vi.mock("server-only", () => ({}));

const mockReadSessionCookie = vi.fn<() => Promise<string | null>>();
vi.mock("@/lib/assessment/session-cookie", () => ({
  readSessionCookie: (...args: unknown[]) =>
    mockReadSessionCookie(...(args as [])),
}));

const mockGetSessionById = vi.fn<
  (id: string) => Promise<Record<string, unknown> | null>
>();
vi.mock("@/lib/queries/session", () => ({
  getSessionById: (...args: unknown[]) =>
    mockGetSessionById(...(args as [string])),
}));

// Supabase mock: chainable query builder
function createQueryBuilder(returnData: unknown = null, returnError: unknown = null) {
  const builder: Record<string, unknown> = {};
  const chain = (..._args: unknown[]) => builder;
  builder.select = chain;
  builder.insert = chain;
  builder.update = chain;
  builder.delete = chain;
  builder.eq = chain;
  builder.neq = chain;
  builder.is = chain;
  builder.in = chain;
  builder.limit = chain;
  builder.single = () => Promise.resolve({ data: returnData, error: returnError });
  builder.maybeSingle = () => Promise.resolve({ data: returnData, error: returnError });
  return builder;
}

let applicantQueryResults: Map<string, { data: unknown; error: unknown }>;

function mockSupabaseFrom(table: string) {
  const result = applicantQueryResults.get(table);
  if (result) {
    return createQueryBuilder(result.data, result.error);
  }
  return createQueryBuilder();
}

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({
    from: (table: string) => mockSupabaseFrom(table),
  }),
}));

// Mock redirect
const mockRedirect = vi.fn<(url: string) => never>();
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...(args as [string])),
}));

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: () => "test-token-123456789ab",
}));

// Import after all mocks
import { captureEmail } from "./applicant";

const TEST_SESSION_ID = "session-001";
const TEST_APPLICANT_ID = "applicant-001";
const TEST_EXISTING_APPLICANT_ID = "applicant-existing";

const TEST_SESSION = {
  id: TEST_SESSION_ID,
  status: "completed",
  applicant_id: TEST_APPLICANT_ID,
};

function makeFormData(
  overrides: Record<string, string> = {}
): FormData {
  const data = new FormData();
  data.set("email", "test@example.com");
  data.set("phone", "(512) 555-1234");
  data.set("leadType", "prospective_student");
  for (const [key, val] of Object.entries(overrides)) {
    data.set(key, val);
  }
  return data;
}

describe("captureEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    applicantQueryResults = new Map();
    mockReadSessionCookie.mockResolvedValue(TEST_SESSION_ID);
    mockGetSessionById.mockResolvedValue(TEST_SESSION);
  });

  // --- Session guards ---

  it("returns error when no session cookie", async () => {
    mockReadSessionCookie.mockResolvedValue(null);

    const result = await captureEmail(makeFormData());

    expect(result).toEqual({
      success: false,
      error: "Session expired. Please start over.",
    });
  });

  it("returns error when session not found", async () => {
    mockGetSessionById.mockResolvedValue(null);

    const result = await captureEmail(makeFormData());

    expect(result).toEqual({
      success: false,
      error: "Assessment not completed. Please finish all steps first.",
    });
  });

  it("returns error when session is not completed", async () => {
    mockGetSessionById.mockResolvedValue({
      ...TEST_SESSION,
      status: "in_progress",
    });

    const result = await captureEmail(makeFormData());

    expect(result).toEqual({
      success: false,
      error: "Assessment not completed. Please finish all steps first.",
    });
  });

  // --- Validation ---

  it("returns field errors for invalid email", async () => {
    const result = await captureEmail(
      makeFormData({ email: "not-an-email" })
    );

    expect(result.success).toBe(false);
    if (!result.success && "fieldErrors" in result) {
      expect(result.fieldErrors?.email).toBeDefined();
    }
  });

  it("returns field errors for missing phone", async () => {
    const data = makeFormData();
    data.delete("phone");

    const result = await captureEmail(data);

    expect(result.success).toBe(false);
    if (!result.success && "fieldErrors" in result) {
      expect(result.fieldErrors?.phone).toBeDefined();
    }
  });

  it("returns field errors for missing leadType", async () => {
    const data = makeFormData();
    data.delete("leadType");

    const result = await captureEmail(data);

    expect(result.success).toBe(false);
  });

  // --- Duplicate detection ---

  it("returns duplicateFound for email match without confirm", async () => {
    // Make the first supabase query (email check) return a match
    applicantQueryResults.set("applicants", {
      data: { id: TEST_EXISTING_APPLICANT_ID },
      error: null,
    });

    const result = await captureEmail(makeFormData());

    expect(result).toEqual({
      success: false,
      duplicateFound: true,
      duplicateEmail: true,
      duplicatePhone: false,
      existingApplicantId: TEST_EXISTING_APPLICANT_ID,
    });
  });

  it("returns duplicateFound when confirmDuplicate present but ID mismatches", async () => {
    applicantQueryResults.set("applicants", {
      data: { id: TEST_EXISTING_APPLICANT_ID },
      error: null,
    });

    const result = await captureEmail(
      makeFormData({
        confirmDuplicate: "true",
        existingApplicantId: "wrong-id",
      })
    );

    // Should re-present the duplicate notice with the correct ID
    expect(result).toEqual({
      success: false,
      duplicateFound: true,
      duplicateEmail: true,
      duplicatePhone: false,
      existingApplicantId: TEST_EXISTING_APPLICANT_ID,
    });
  });

  // --- Normal flow (no duplicate) ---

  it("updates applicant and redirects on success", async () => {
    // No duplicate found
    applicantQueryResults.set("applicants", { data: null, error: null });

    await captureEmail(makeFormData());

    expect(mockRedirect).toHaveBeenCalledWith(
      "/assess/thank-you?path=student"
    );
  });

  it("redirects with path=general for general_interest", async () => {
    applicantQueryResults.set("applicants", { data: null, error: null });

    await captureEmail(
      makeFormData({ leadType: "general_interest" })
    );

    expect(mockRedirect).toHaveBeenCalledWith(
      "/assess/thank-you?path=general"
    );
  });

  // --- Duplicate detection ---

  it("returns duplicateFound when duplicate exists (merge handled by linkToExistingProfile)", async () => {
    applicantQueryResults.set("applicants", {
      data: { id: TEST_EXISTING_APPLICANT_ID },
      error: null,
    });

    const result = await captureEmail(makeFormData());

    expect(result).toEqual({
      success: false,
      duplicateFound: true,
      duplicateEmail: true,
      duplicatePhone: false,
      existingApplicantId: TEST_EXISTING_APPLICANT_ID,
    });
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
