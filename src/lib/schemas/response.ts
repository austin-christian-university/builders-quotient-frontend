import { z } from "zod";

export const reserveResponseSchema = z.object({
  sessionId: z.string().uuid(),
  vignetteId: z.string().uuid(),
  vignetteType: z.enum(["practical", "creative"]),
  step: z.number().int().min(1).max(4),
  responsePhase: z.number().int().min(1).max(3),
  videoDurationSeconds: z.number().int().min(10).max(180),
  recordingStartedAt: z.string().datetime(),
});

export type ReserveResponse = z.infer<typeof reserveResponseSchema>;

export const confirmUploadSchema = z.object({
  sessionId: z.string().uuid(),
  vignetteId: z.string().uuid(),
  responsePhase: z.number().int().min(1).max(3),
  storagePath: z.string().min(1),
});

export type ConfirmUpload = z.infer<typeof confirmUploadSchema>;
