import type { APIRoute } from "astro";
import { z } from "zod";
import type { SubmitReviewResponse, ReviewRating } from "../../../../types";
import { AuthUtils } from "../../../../lib/utils/auth.utils";
import { ResponseUtils } from "../../../../lib/utils/response.utils";
import { StudyService } from "../../../../lib/services/study.service";
import { EnvConfig } from "../../../../lib/config/env.config";

// Disable prerendering for API routes
export const prerender = false;

// Validation schemas
const FlashcardIdSchema = z.string().uuid("Invalid flashcard ID format");

const SubmitReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1").max(4, "Rating must be at most 4"),
  responseTime: z.number().int().positive().optional(),
});

/**
 * POST /api/flashcards/{flashcardId}/review
 *
 * Submits a review for a flashcard and updates FSRS parameters.
 *
 * @param request - The incoming HTTP request
 * @param locals - Astro locals containing Supabase client
 * @param params - Route parameters containing flashcardId
 * @returns Response with updated flashcard data or error
 */
export const POST: APIRoute = async ({ request, locals, params }) => {
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

    // Step 2: Validate flashcard ID
    const flashcardId = params.flashcardId;

    if (!flashcardId) {
      return ResponseUtils.createValidationErrorResponse("Flashcard ID is required", "flashcardId");
    }

    const idValidation = FlashcardIdSchema.safeParse(flashcardId);

    if (!idValidation.success) {
      return ResponseUtils.createValidationErrorResponse("Invalid flashcard ID format", "flashcardId");
    }

    // Step 3: Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return ResponseUtils.createValidationErrorResponse("Invalid JSON body");
    }

    const bodyValidation = SubmitReviewSchema.safeParse(body);

    if (!bodyValidation.success) {
      const firstError = bodyValidation.error.errors[0];
      return ResponseUtils.createValidationErrorResponse(
        firstError?.message || "Invalid request body",
        firstError?.path[0]?.toString()
      );
    }

    const { rating } = bodyValidation.data;

    // Step 4: Submit review
    const studyService = new StudyService(locals.supabase);
    const { data, error } = await studyService.submitReview(idValidation.data, userId, rating as ReviewRating);

    if (error) {
      if (error.message === "Flashcard not found") {
        return ResponseUtils.createErrorResponse("Flashcard not found", "NOT_FOUND", 404);
      }
      return ResponseUtils.createInternalErrorResponse(`Failed to submit review: ${error.message}`);
    }

    if (!data) {
      return ResponseUtils.createErrorResponse("Flashcard not found", "NOT_FOUND", 404);
    }

    // Step 5: Return response
    const response: Omit<SubmitReviewResponse, "nextCard"> = {
      flashcardId: data.flashcardId,
      newState: data.newState,
      newDue: data.newDue,
      newStability: data.newStability,
      newDifficulty: data.newDifficulty,
      newLapses: data.newLapses,
    };

    return ResponseUtils.createSuccessResponse(response);
  } catch {
    return ResponseUtils.createInternalErrorResponse();
  }
};
