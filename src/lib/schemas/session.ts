import { z } from "zod";

/** Validated JWT payload from the session cookie. */
export const sessionPayloadSchema = z.object({
  sid: z.string().uuid(),
  iss: z.literal("bq:assess"),
  aud: z.union([z.literal("bq:assess"), z.array(z.literal("bq:assess"))]),
  exp: z.number(),
  iat: z.number(),
});

export type SessionPayload = z.infer<typeof sessionPayloadSchema>;

/** Shape of a session row returned from the database. */
export const sessionRowSchema = z.object({
  id: z.string().uuid(),
  applicant_id: z.string().uuid(),
  status: z.enum(["assigned", "in_progress", "completed", "abandoned"]),
  assessment_type: z.enum(["public", "admissions"]).default("public"),
  practical_vignette_ids: z.array(z.string().uuid()).default([]),
  creative_vignette_ids: z.array(z.string().uuid()).default([]),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  created_at: z.string(),
});

export type SessionRow = z.infer<typeof sessionRowSchema>;
