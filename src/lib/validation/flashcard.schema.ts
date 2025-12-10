import { z } from "zod";

/**
 * Maximum length for flashcard front (question)
 */
export const MAX_FRONT_LENGTH = 200;

/**
 * Maximum length for flashcard back (answer)
 */
export const MAX_BACK_LENGTH = 500;

/**
 * Zod schema for flashcard form validation (create/edit)
 */
export const FlashcardFormSchema = z.object({
  front: z
    .string()
    .trim()
    .min(1, "Awers jest wymagany")
    .max(MAX_FRONT_LENGTH, `Awers może mieć maksymalnie ${MAX_FRONT_LENGTH} znaków`),
  back: z
    .string()
    .trim()
    .min(1, "Rewers jest wymagany")
    .max(MAX_BACK_LENGTH, `Rewers może mieć maksymalnie ${MAX_BACK_LENGTH} znaków`),
});

/**
 * Type inferred from FlashcardFormSchema
 */
export type FlashcardFormData = z.infer<typeof FlashcardFormSchema>;

/**
 * Zod schema for URL query params validation
 */
export const FlashcardsFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  sort: z.enum(["createdAt", "updatedAt", "due"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
  state: z.coerce.number().min(0).max(3).optional(),
});
