import type { APIRoute } from "astro";
import { z } from "zod";
import type {
  CreateFlashcardResponse,
  CreateFlashcardCommand,
  ListFlashcardsResponse,
  PaginationInfo,
  FSRSState,
} from "../../../types";
import { AuthUtils } from "../../../lib/utils/auth.utils";
import { ResponseUtils } from "../../../lib/utils/response.utils";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import { GenerationService } from "../../../lib/services/generation.service";
import { EnvConfig } from "../../../lib/config/env.config";

// Disable prerendering for API routes
export const prerender = false;

// Validation schema for query parameters
const ListFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  sort: z.enum(["createdAt", "updatedAt", "due"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
  state: z.coerce.number().int().min(0).max(3).optional(),
});

// Validation schema for request body
const CreateFlashcardSchema = z
  .object({
    front: z.string().max(200, "Front must not exceed 200 characters").trim().min(1, "Front is required"),
    back: z.string().max(500, "Back must not exceed 500 characters").trim().min(1, "Back is required"),
    source: z.enum(["ai-full", "ai-edited", "manual"], {
      errorMap: () => ({ message: "Source must be one of: ai-full, ai-edited, manual" }),
    }),
    generationId: z.string().uuid("Invalid generation ID format").optional().nullable(),
  })
  .refine(
    (data) => {
      // If source is ai-full or ai-edited, generationId should be provided (recommended but not strictly required)
      if ((data.source === "ai-full" || data.source === "ai-edited") && !data.generationId) {
        return false;
      }
      return true;
    },
    {
      message: "Generation ID is required for AI-generated flashcards",
      path: ["generationId"],
    }
  )
  .refine(
    (data) => {
      // If source is manual, generationId should be null or not provided
      if (data.source === "manual" && data.generationId) {
        return false;
      }
      return true;
    },
    {
      message: "Generation ID should not be provided for manual flashcards",
      path: ["generationId"],
    }
  );

/**
 * POST /api/flashcards
 *
 * Creates a new flashcard for the authenticated user.
 * The flashcard can be created manually, directly from AI proposal (ai-full),
 * or from AI proposal after editing (ai-edited).
 *
 * @param request - The incoming HTTP request
 * @param locals - Astro locals containing Supabase client
 * @returns Response with created flashcard data or error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authentication validation
    const defaultUserId = EnvConfig.getDefaultUserId();

    let userId: string;

    if (defaultUserId) {
      userId = defaultUserId;
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
    }

    // Step 2: Validate input data
    const body = await request.json();
    const validationResult = CreateFlashcardSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return ResponseUtils.createValidationErrorResponse(
        firstError?.message || "Invalid request data",
        firstError?.path.join(".") || "unknown"
      );
    }

    const { front, back, source, generationId } = validationResult.data;

    // Step 3: Verify generationId (if provided)
    if (generationId) {
      const generationService = new GenerationService(locals.supabase);
      const { generation, error: fetchError } = await generationService.getGenerationById(generationId, userId);

      if (fetchError) {
        return ResponseUtils.createInternalErrorResponse(`Failed to verify generation: ${fetchError.message}`);
      }

      if (!generation) {
        return ResponseUtils.createErrorResponse("Generation not found", "NOT_FOUND", 404);
      }
    }

    // Step 4: Check for duplicates
    const flashcardService = new FlashcardService(locals.supabase);
    const { exists: duplicateExists, error: duplicateError } = await flashcardService.checkDuplicate(
      userId,
      front,
      back
    );

    if (duplicateError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to check duplicates: ${duplicateError.message}`);
    }

    if (duplicateExists) {
      return ResponseUtils.createErrorResponse(
        "Flashcard with this content already exists",
        "DUPLICATE_FLASHCARD",
        409
      );
    }

    // Step 5: Create flashcard
    const command: CreateFlashcardCommand = {
      front,
      back,
      source,
      generationId: generationId || undefined,
    };

    const { flashcard, error: createError } = await flashcardService.createFlashcard(userId, command);

    if (createError) {
      // Check if it's a duplicate error (UNIQUE constraint violation)
      if (createError.message.includes("already exists")) {
        return ResponseUtils.createErrorResponse(
          "Flashcard with this content already exists",
          "DUPLICATE_FLASHCARD",
          409
        );
      }
      return ResponseUtils.createInternalErrorResponse(`Failed to create flashcard: ${createError.message}`);
    }

    if (!flashcard) {
      return ResponseUtils.createInternalErrorResponse("Failed to create flashcard: no data returned");
    }

    // Step 6: Update generation metrics if flashcard is from AI generation
    if (generationId && (source === "ai-full" || source === "ai-edited")) {
      const generationService = new GenerationService(locals.supabase);
      const { error: metricsError } = await generationService.incrementAcceptedCount(generationId, source);

      // Log error but don't fail the request - metrics update is non-critical
      if (metricsError) {
        // Continue with response - flashcard was created successfully
        // Metrics update failure is non-critical
      }
    }

    // Step 7: Transform response (snake_case to camelCase)
    // CreateFlashcardResponse contains both snake_case (from Pick) and camelCase (from & {})
    const response: CreateFlashcardResponse = {
      id: flashcard.id,
      user_id: flashcard.user_id,
      userId: flashcard.user_id,
      generation_id: flashcard.generation_id,
      generationId: flashcard.generation_id,
      front: flashcard.front,
      back: flashcard.back,
      source: flashcard.source as "ai-full" | "ai-edited" | "manual",
      state: flashcard.state,
      due: flashcard.due,
      stability: flashcard.stability,
      difficulty: flashcard.difficulty,
      lapses: flashcard.lapses,
      created_at: flashcard.created_at,
      createdAt: flashcard.created_at,
      updated_at: flashcard.updated_at,
      updatedAt: flashcard.updated_at,
    };

    // Step 8: Return success response
    return ResponseUtils.createSuccessResponse(response, 201);
  } catch (error) {
    return ResponseUtils.createInternalErrorResponse();
  }
};

/**
 * GET /api/flashcards
 *
 * Retrieves a list of flashcards for the authenticated user.
 * Supports pagination, sorting, and filtering by source and state.
 *
 * @param request - The incoming HTTP request
 * @param locals - Astro locals containing Supabase client
 * @returns Response with list of flashcards and pagination info
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authentication validation
    const defaultUserId = EnvConfig.getDefaultUserId();

    let userId: string;

    if (defaultUserId) {
      userId = defaultUserId;
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
    }

    // Step 2: Validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const validationResult = ListFlashcardsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return ResponseUtils.createValidationErrorResponse(
        firstError?.message || "Invalid query parameters",
        firstError?.path.join(".") || "unknown"
      );
    }

    const { page, limit, sort, order, source, state } = validationResult.data;

    // Step 3: Fetch flashcards from database
    const flashcardService = new FlashcardService(locals.supabase);
    const {
      data,
      total,
      error: fetchError,
    } = await flashcardService.listFlashcards(userId, {
      page,
      limit,
      sort,
      order,
      source,
      state: state !== undefined ? (state as FSRSState) : undefined,
    });

    if (fetchError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to fetch flashcards: ${fetchError.message}`);
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
    // Note: ListFlashcardsResponse uses Pick from Flashcard, so fields are in snake_case
    const response: ListFlashcardsResponse = {
      data: data.map((flashcard) => ({
        id: flashcard.id,
        front: flashcard.front,
        back: flashcard.back,
        source: flashcard.source as "ai-full" | "ai-edited" | "manual",
        state: flashcard.state,
        due: flashcard.due,
        created_at: flashcard.created_at,
        updated_at: flashcard.updated_at,
      })),
      pagination,
    };

    // Step 6: Return success response
    return ResponseUtils.createSuccessResponse(response, 200);
  } catch (error) {
    return ResponseUtils.createInternalErrorResponse();
  }
};
