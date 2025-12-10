import { z } from "zod";

/**
 * Schema for submit review request body
 */
export const SubmitReviewSchema = z.object({
  rating: z.number().int().min(1).max(4, "Rating must be between 1 and 4"),
  responseTime: z.number().int().positive().optional(),
});

/**
 * Type inferred from SubmitReviewSchema
 */
export type SubmitReviewData = z.infer<typeof SubmitReviewSchema>;

/**
 * Schema for study session query parameters
 */
export const StudySessionQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
