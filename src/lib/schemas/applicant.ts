import { z } from "zod";

export const leadTypes = ["prospective_student", "general_interest"] as const;
export type LeadType = (typeof leadTypes)[number];

/** Validates the email-gate form (captures email after assessment). */
export const emailCaptureSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  firstName: z
    .string()
    .trim()
    .max(100, "Name is too long")
    .transform((v) => v || undefined)
    .optional(),
  leadType: z.enum(leadTypes, {
    message: "Please select what best describes you",
  }),
});

export type EmailCaptureInput = z.infer<typeof emailCaptureSchema>;
