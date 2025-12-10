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
 * Zod schema for editing proposal form validation
 */
export const EditProposalSchema = z.object({
  front: z
    .string()
    .trim()
    .min(1, "Awers nie może być pusty")
    .max(MAX_FRONT_LENGTH, `Awers nie może przekraczać ${MAX_FRONT_LENGTH} znaków`),
  back: z
    .string()
    .trim()
    .min(1, "Rewers nie może być pusty")
    .max(MAX_BACK_LENGTH, `Rewers nie może przekraczać ${MAX_BACK_LENGTH} znaków`),
});

/**
 * Type inferred from EditProposalSchema
 */
export type EditProposalFormData = z.infer<typeof EditProposalSchema>;

