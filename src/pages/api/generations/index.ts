import type { APIRoute } from "astro";
import { z } from "zod";
import type { GenerateFlashcardsResponse, ListGenerationsResponse, PaginationInfo } from "../../../types";
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

// Validation schema for query parameters
const ListGenerationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  sort: z.enum(["createdAt", "model"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
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

    let userId: string;

    // Check if we should use default user ID for testing
    if (defaultUserId) {
      userId = defaultUserId;
    } else {
      // Normal authentication flow - use SSR client from middleware (locals.supabase)
      const authHeader = request.headers.get("authorization");
      const token = AuthUtils.extractBearerToken(authHeader);

      if (token) {
        // Verify JWT token with SSR client (can handle tokens)
        const { user, error: authError } = await AuthUtils.verifyToken(locals.supabase, token);

        if (authError || !user) {
          return ResponseUtils.createAuthErrorResponse(authError?.message || "Invalid or expired token");
        }

        userId = user.id;
      } else {
        // Check session from cookies
        const {
          data: { session },
        } = await locals.supabase.auth.getSession();

        if (!session?.user?.id) {
          return ResponseUtils.createAuthErrorResponse("Authentication required");
        }

        userId = session.user.id;
      }

      // Check user permissions (requires service role client for admin API)
      const { getServerSupabaseClient } = await import("../../../db/supabase.server.ts");
      const serviceRoleClient = getServerSupabaseClient();
      const { allowed, error: permissionError } = await AuthUtils.checkGenerationPermission(serviceRoleClient, userId);

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
      userId,
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
    console.error("[POST /api/generations] Error:", error);
    return ResponseUtils.createInternalErrorResponse(error instanceof Error ? error.message : "Unknown error occurred");
  }
};

/**
 * GET /api/generations
 *
 * Retrieves a list of flashcard generation sessions for the authenticated user.
 * Supports pagination, sorting, and filtering.
 *
 * @param request - The incoming HTTP request
 * @param locals - Astro locals containing Supabase client
 * @returns Response with list of generations and pagination info
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authentication validation
    const defaultUserId = EnvConfig.getDefaultUserId();

    let userId: string;

    // Check if we should use default user ID for testing
    if (defaultUserId) {
      userId = defaultUserId;
    } else {
      // Normal authentication flow - use SSR client from middleware (locals.supabase)
      const authHeader = request.headers.get("authorization");
      const token = AuthUtils.extractBearerToken(authHeader);

      if (token) {
        // Verify JWT token with SSR client (can handle tokens)
        const { user, error: authError } = await AuthUtils.verifyToken(locals.supabase, token);

        if (authError || !user) {
          return ResponseUtils.createAuthErrorResponse(authError?.message || "Invalid or expired token");
        }

        userId = user.id;
      } else {
        // Check session from cookies
        const {
          data: { session },
        } = await locals.supabase.auth.getSession();

        if (!session?.user?.id) {
          return ResponseUtils.createAuthErrorResponse("Authentication required");
        }

        userId = session.user.id;
      }
    }

    // Step 2: Validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const validationResult = ListGenerationsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return ResponseUtils.createValidationErrorResponse(
        firstError?.message || "Invalid query parameters",
        firstError?.path.join(".") || "unknown"
      );
    }

    const { page, limit, sort, order } = validationResult.data;

    // Step 3: Fetch generations from database
    const generationService = new GenerationService(locals.supabase);
    const {
      data,
      total,
      error: fetchError,
    } = await generationService.listGenerations(userId, {
      page,
      limit,
      sort,
      order,
    });

    if (fetchError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to fetch generations: ${fetchError.message}`);
    }

    // Step 4: Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const pagination: PaginationInfo = {
      page,
      limit,
      total,
      totalPages,
    };

    // Step 5: Prepare response
    // Note: ListGenerationsResponse uses Pick from Generation, so fields are in snake_case
    const response: ListGenerationsResponse = {
      data: data.map((generation) => ({
        id: generation.id,
        model: generation.model,
        generated_count: generation.generated_count,
        accepted_unedited_count: generation.accepted_unedited_count,
        accepted_edited_count: generation.accepted_edited_count,
        created_at: generation.created_at,
      })),
      pagination,
    };

    // Step 6: Return success response
    return ResponseUtils.createSuccessResponse(response, 200);
  } catch {
    return ResponseUtils.createInternalErrorResponse();
  }
};
