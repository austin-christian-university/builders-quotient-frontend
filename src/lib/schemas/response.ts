import { z } from "zod";

export const responseSubmissionSchema = z.object({
  sessionId: z.string().uuid(),
  vignetteId: z.string().uuid(),
  vignetteType: z.enum(["practical", "creative"]),
  step: z.number().int().min(1).max(4),
  storagePath: z.string().min(1),
  videoDurationSeconds: z.number().int().min(10).max(180),
  recordingStartedAt: z.string().datetime(),
});

export type ResponseSubmission = z.infer<typeof responseSubmissionSchema>;
