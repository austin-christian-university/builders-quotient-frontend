import { z } from "zod";

/** Validates the email-gate form (captures email after assessment). */
export const emailCaptureSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  firstName: z
    .string()
    .trim()
    .max(100, "Name is too long")
    .optional(),
});

export type EmailCaptureInput = z.infer<typeof emailCaptureSchema>;
