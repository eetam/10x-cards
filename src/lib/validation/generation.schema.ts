import { z } from "zod";

/**
 * Minimum and maximum text length for source text
 */
export const MIN_TEXT_LENGTH = 1000;
export const MAX_TEXT_LENGTH = 10000;

/**
 * Allowed AI models for flashcard generation
 */
export const ALLOWED_MODELS = ["openai/gpt-4o-mini", "openai/gpt-4o", "anthropic/claude-3-haiku"] as const;

/**
 * Default AI model
 */
export const DEFAULT_MODEL = "openai/gpt-4o-mini";

/**
 * Zod schema for generation form validation
 * Note: model is not included in form - API uses default model
 */
export const GenerationFormSchema = z.object({
  sourceText: z
    .string()
    .trim()
    .min(MIN_TEXT_LENGTH, `Tekst musi zawierać co najmniej ${MIN_TEXT_LENGTH} znaków`)
    .max(MAX_TEXT_LENGTH, `Tekst nie może przekraczać ${MAX_TEXT_LENGTH} znaków`),
});

/**
 * Type inferred from GenerationFormSchema
 */
export type GenerationFormData = z.infer<typeof GenerationFormSchema>;
