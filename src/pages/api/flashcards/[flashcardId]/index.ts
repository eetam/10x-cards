import type { APIRoute } from "astro";
import { z } from "zod";
import type { FlashcardResponse } from "../../../../types";
import { AuthUtils } from "../../../../lib/utils/auth.utils";
import { ResponseUtils } from "../../../../lib/utils/response.utils";
import { FlashcardService } from "../../../../lib/services/flashcard.service";
import { EnvConfig } from "../../../../lib/config/env.config";

// Disable prerendering for API routes
export const prerender = false;

// Validation schema for flashcardId path parameter
const FlashcardIdSchema = z.string().uuid("Invalid flashcard ID format");

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
