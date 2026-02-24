import { z } from "zod";

const likertValueSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const personalityFacetSchema = z.enum([
  "AM",
  "RT",
  "IN",
  "AU",
  "SE",
  "ST",
  "IL",
  "GR",
  "AC",
]);

export const personalityPageSchema = z.object({
  sessionId: z.string().uuid(),
  responses: z
    .array(
      z.object({
        itemId: z.string().min(1),
        facet: personalityFacetSchema,
        value: likertValueSchema,
        reverse: z.boolean(),
      })
    )
    .min(1)
    .max(6),
});

export type PersonalityPageInput = z.infer<typeof personalityPageSchema>;

export const personalitySubmitSchema = z.object({
  sessionId: z.string().uuid(),
});

export type PersonalitySubmitInput = z.infer<typeof personalitySubmitSchema>;
