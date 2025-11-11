import type { APIRoute } from "astro";
import { z } from "zod";
import type { FlashcardResponse, UpdateFlashcardResponse } from "../../../../types";
import { AuthUtils } from "../../../../lib/utils/auth.utils";
import { ResponseUtils } from "../../../../lib/utils/response.utils";
import { FlashcardService } from "../../../../lib/services/flashcard.service";
import { EnvConfig } from "../../../../lib/config/env.config";

// Disable prerendering for API routes
export const prerender = false;

// Validation schema for flashcardId path parameter
const FlashcardIdSchema = z.string().uuid("Invalid flashcard ID format");

// Validation schema for request body (PUT)
const UpdateFlashcardSchema = z.object({
  front: z.string().max(200, "Front must not exceed 200 characters").trim().min(1, "Front is required"),
  back: z.string().max(500, "Back must not exceed 500 characters").trim().min(1, "Back is required"),
});

/**
 * GET /api/flashcards/{flashcardId}
 *
 * Retrieves detailed information about a single flashcard by its ID.
 * Returns full flashcard data including all FSRS parameters and metadata.
 *
 * @param request - The incoming HTTP request
 * @param locals - Astro locals containing Supabase client
 * @param params - Route parameters containing flashcardId
 * @returns Response with flashcard data or error
 */
export const GET: APIRoute = async ({ request, locals, params }) => {
  try {
    // Step 1: Authentication validation
    const defaultUserId = EnvConfig.getDefaultUserId();

    let userId: string;

    if (defaultUserId) {
      userId = defaultUserId;
      if (import.meta.env.NODE_ENV === "development") {
        console.log(`Using default user ID for testing: ${userId}`);
      }
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

    // Step 2: Validate path parameter
    const flashcardId = params.flashcardId;

    if (!flashcardId) {
      return ResponseUtils.createValidationErrorResponse("Flashcard ID is required", "flashcardId");
    }

    const validationResult = FlashcardIdSchema.safeParse(flashcardId);

    if (!validationResult.success) {
      return ResponseUtils.createValidationErrorResponse("Invalid flashcard ID format", "flashcardId");
    }

    const validatedFlashcardId = validationResult.data;

    // Step 3: Fetch flashcard from database
    const flashcardService = new FlashcardService(locals.supabase);
    const { flashcard, error: fetchError } = await flashcardService.getFlashcardById(validatedFlashcardId, userId);

    if (fetchError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to fetch flashcard: ${fetchError.message}`);
    }

    // Step 4: Handle not found case
    if (!flashcard) {
      return ResponseUtils.createErrorResponse("Flashcard not found", "NOT_FOUND", 404);
    }

    // Step 5: Transform response data
    // Map database fields (snake_case) to API format (camelCase)
    // Note: FlashcardResponse contains both snake_case (from Pick) and camelCase (from & {})
    // review_history is Json type which can be an array, so we need to handle it properly
    const reviewHistoryArray = Array.isArray(flashcard.review_history) ? (flashcard.review_history as unknown[]) : [];

    const responseData: FlashcardResponse = {
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
      review_history: flashcard.review_history,
      reviewHistory: reviewHistoryArray,
      created_at: flashcard.created_at,
      createdAt: flashcard.created_at,
      updated_at: flashcard.updated_at,
      updatedAt: flashcard.updated_at,
    };

    // Step 6: Return success response
    return ResponseUtils.createSuccessResponse(responseData, 200);
  } catch (error) {
    // Log error for debugging in development
    if (import.meta.env.NODE_ENV === "development" && error instanceof Error) {
      console.error("Error in GET /api/flashcards/[flashcardId]:", error.message);
      console.error(error.stack);
    }
    return ResponseUtils.createInternalErrorResponse();
  }
};

/**
 * PUT /api/flashcards/{flashcardId}
 *
 * Updates the content (front and back) of a single flashcard by its ID.
 * Only the front and back fields can be updated; all other fields remain unchanged.
 * Automatically updates the updated_at timestamp.
 *
 * @param request - The incoming HTTP request
 * @param locals - Astro locals containing Supabase client
 * @param params - Route parameters containing flashcardId
 * @returns Response with updated flashcard data or error
 */
export const PUT: APIRoute = async ({ request, locals, params }) => {
  try {
    // Step 1: Authentication validation
    const defaultUserId = EnvConfig.getDefaultUserId();

    let userId: string;

    if (defaultUserId) {
      userId = defaultUserId;
      if (import.meta.env.NODE_ENV === "development") {
        console.log(`Using default user ID for testing: ${userId}`);
      }
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

    // Step 2: Validate path parameter
    const flashcardId = params.flashcardId;

    if (!flashcardId) {
      return ResponseUtils.createValidationErrorResponse("Flashcard ID is required", "flashcardId");
    }

    const validationResult = FlashcardIdSchema.safeParse(flashcardId);

    if (!validationResult.success) {
      return ResponseUtils.createValidationErrorResponse("Invalid flashcard ID format", "flashcardId");
    }

    const validatedFlashcardId = validationResult.data;

    // Step 3: Validate request body
    const body = await request.json();
    const bodyValidationResult = UpdateFlashcardSchema.safeParse(body);

    if (!bodyValidationResult.success) {
      const firstError = bodyValidationResult.error.errors[0];
      return ResponseUtils.createValidationErrorResponse(
        firstError?.message || "Invalid request data",
        firstError?.path.join(".") || "unknown"
      );
    }

    const { front, back } = bodyValidationResult.data;

    // Step 4: Check if flashcard exists
    const flashcardService = new FlashcardService(locals.supabase);
    const { flashcard: existingFlashcard, error: fetchError } = await flashcardService.getFlashcardById(
      validatedFlashcardId,
      userId
    );

    if (fetchError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to fetch flashcard: ${fetchError.message}`);
    }

    if (!existingFlashcard) {
      return ResponseUtils.createErrorResponse("Flashcard not found", "NOT_FOUND", 404);
    }

    // Step 5: Check for duplicates (excluding current flashcard)
    const { exists: duplicateExists, error: duplicateError } = await flashcardService.checkDuplicate(
      userId,
      front,
      back,
      validatedFlashcardId
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

    // Step 6: Update flashcard
    const { flashcard: updatedFlashcard, error: updateError } = await flashcardService.updateFlashcard(
      validatedFlashcardId,
      userId,
      { front, back }
    );

    if (updateError) {
      // Check if it's a duplicate error (UNIQUE constraint violation)
      if (updateError.message.includes("already exists")) {
        return ResponseUtils.createErrorResponse(
          "Flashcard with this content already exists",
          "DUPLICATE_FLASHCARD",
          409
        );
      }
      return ResponseUtils.createInternalErrorResponse(`Failed to update flashcard: ${updateError.message}`);
    }

    if (!updatedFlashcard) {
      return ResponseUtils.createInternalErrorResponse("Failed to update flashcard: no data returned");
    }

    // Step 7: Transform response data
    // Map database fields (snake_case) to API format (camelCase)
    // UpdateFlashcardResponse is the same as CreateFlashcardResponse
    // Note: updatedFlashcard already contains the updated data from the UPDATE query
    const responseData: UpdateFlashcardResponse = {
      id: updatedFlashcard.id,
      user_id: updatedFlashcard.user_id,
      userId: updatedFlashcard.user_id,
      generation_id: updatedFlashcard.generation_id,
      generationId: updatedFlashcard.generation_id,
      front: updatedFlashcard.front,
      back: updatedFlashcard.back,
      source: updatedFlashcard.source as "ai-full" | "ai-edited" | "manual",
      state: updatedFlashcard.state,
      due: updatedFlashcard.due,
      stability: updatedFlashcard.stability,
      difficulty: updatedFlashcard.difficulty,
      lapses: updatedFlashcard.lapses,
      created_at: updatedFlashcard.created_at,
      createdAt: updatedFlashcard.created_at,
      updated_at: updatedFlashcard.updated_at,
      updatedAt: updatedFlashcard.updated_at,
    };

    // Step 8: Return success response
    return ResponseUtils.createSuccessResponse(responseData, 200);
  } catch (error) {
    // Log error for debugging in development
    if (import.meta.env.NODE_ENV === "development" && error instanceof Error) {
      console.error("Error in PUT /api/flashcards/[flashcardId]:", error.message);
      console.error(error.stack);
    }
    return ResponseUtils.createInternalErrorResponse();
  }
};
