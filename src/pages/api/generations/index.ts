import type { APIRoute } from "astro";
import { z } from "zod";
import type { GenerateFlashcardsResponse } from "../../../types";
import { AuthUtils } from "../../../lib/utils/auth.utils";
import { ResponseUtils } from "../../../lib/utils/response.utils";
import { RateLimitUtils } from "../../../lib/utils/rate-limit.utils";
import { GenerationService } from "../../../lib/services/generation.service";
import { TextUtils } from "../../../lib/utils/text.utils";
import { EnvConfig } from "../../../lib/config/env.config";

// Disable prerendering for API routes
export const prerender = false;

// Validation schema for request body
const CreateGenerationSchema = z.object({
  sourceText: z
    .string()
    .min(1000, "Source text must be at least 1000 characters")
    .max(10000, "Source text must not exceed 10000 characters")
    .trim(),
  model: z.string().optional().default("openai/gpt-4o-mini"), // Default model
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = CreateGenerationSchema.safeParse(body);

    if (!validationResult.success) {
      return ResponseUtils.createValidationErrorResponse(
        validationResult.error.errors[0]?.message || "Invalid request data",
        validationResult.error.errors[0]?.path.join(".") || "unknown"
      );
    }

    const { sourceText, model } = validationResult.data;

    // Get default user ID for testing
    const defaultUserId = EnvConfig.getDefaultUserId();
    console.log("DEFAULT_USER_ID env var:", import.meta.env.DEFAULT_USER_ID);
    console.log("OPENROUTER_USE_MOCK env var:", import.meta.env.OPENROUTER_USE_MOCK);

    let userId: string;

    // Check if we should use default user ID for testing
    if (defaultUserId) {
      userId = defaultUserId;
      console.log(`Using default user ID for testing: ${userId}`);
    } else {
      // Normal authentication flow
      const authHeader = request.headers.get("authorization");
      const token = AuthUtils.extractBearerToken(authHeader);

      if (!token) {
        return ResponseUtils.createAuthErrorResponse("Authentication required");
      }

      // Verify JWT token with Supabase
      const { user, error: authError } = await AuthUtils.verifyToken(locals.supabase, token);

      if (authError || !user) {
        return ResponseUtils.createAuthErrorResponse(authError?.message || "Invalid or expired token");
      }

      userId = user.id;

      // Check user permissions
      const { allowed, error: permissionError } = await AuthUtils.checkGenerationPermission(locals.supabase, user.id);

      if (!allowed) {
        return ResponseUtils.createErrorResponse(
          permissionError?.message || "Permission denied",
          permissionError?.code || "PERMISSION_DENIED",
          403
        );
      }
    }

    // Check rate limits
    const {
      allowed: rateLimitAllowed,
      error: rateLimitError,
      retryAfter,
    } = await RateLimitUtils.checkGenerationRateLimit(locals.supabase, userId);

    if (!rateLimitAllowed) {
      const status = retryAfter ? 429 : 403; // 429 Too Many Requests if retryAfter is provided
      const response = ResponseUtils.createErrorResponse(
        rateLimitError || "Rate limit exceeded",
        "RATE_LIMIT_EXCEEDED",
        status
      );

      if (retryAfter) {
        response.headers.set("Retry-After", retryAfter.toString());
      }

      return response;
    }

    // Check concurrent generation limit
    const { allowed: concurrentAllowed, error: concurrentError } = await RateLimitUtils.checkConcurrentGenerationLimit(
      locals.supabase,
      userId
    );

    if (!concurrentAllowed) {
      return ResponseUtils.createErrorResponse(
        concurrentError || "Too many concurrent generations",
        "CONCURRENT_LIMIT_EXCEEDED",
        429
      );
    }

    // Sanitize source text
    const sanitizedText = TextUtils.sanitizeText(sourceText);

    // Initialize generation service
    const generationService = new GenerationService(locals.supabase);

    // Create generation record
    const { generationId, error: createError } = await generationService.createGeneration(userId, sanitizedText, model);

    if (createError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to create generation: ${createError.message}`);
    }

    // Generate flashcards
    const { proposals, error: generationError } = await generationService.generateFlashcards({
      generationId,
      sourceText: sanitizedText,
      model,
    });

    if (generationError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to generate flashcards: ${generationError.message}`);
    }

    // Prepare response
    const response: GenerateFlashcardsResponse = {
      generationId,
      proposals,
      generatedAt: new Date().toISOString(),
      duration: 0, // Will be calculated by the service
    };

    return ResponseUtils.createSuccessResponse(response, 201);
  } catch (error) {
    // Log error for debugging in development
    if (import.meta.env.NODE_ENV === "development" && error instanceof Error) {
      console.error("Error in POST /api/generations:", error.message);
    }
    return ResponseUtils.createInternalErrorResponse();
  }
};
