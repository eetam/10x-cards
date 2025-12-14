import type { APIRoute } from "astro";
import { z } from "zod";
import type { StudySessionResponse } from "../../../types";
import { AuthUtils } from "../../../lib/utils/auth.utils";
import { ResponseUtils } from "../../../lib/utils/response.utils";
import { StudyService } from "../../../lib/services/study.service";
import { EnvConfig } from "../../../lib/config/env.config";

// Disable prerendering for API routes
export const prerender = false;

// Validation schema for query parameters
const StudySessionQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

/**
 * GET /api/study-session
 *
 * Retrieves flashcards due for review.
 * Returns cards where due <= now, sorted by due date ascending.
 *
 * @param request - The incoming HTTP request
 * @param locals - Astro locals containing Supabase client
 * @returns Response with study session data or error
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const defaultUserId = EnvConfig.getDefaultUserId();

    let userId: string;

    if (defaultUserId) {
      userId = defaultUserId;
    } else {
      // Normal authentication flow - use SSR client from middleware (locals.supabase)
      const { userId: authenticatedUserId, error: authError } = await AuthUtils.getUserIdFromRequest(
        request,
        locals.supabase
      );

      if (authError || !authenticatedUserId) {
        return ResponseUtils.createAuthErrorResponse(authError?.message || "Authentication required");
      }

      userId = authenticatedUserId;
    }

    // Step 2: Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      limit: url.searchParams.get("limit") || undefined,
    };

    const validationResult = StudySessionQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return ResponseUtils.createValidationErrorResponse(
        validationResult.error.errors[0]?.message || "Invalid query parameters",
        validationResult.error.errors[0]?.path[0]?.toString()
      );
    }

    const { limit } = validationResult.data;

    // Step 3: Get due flashcards
    const studyService = new StudyService(locals.supabase);
    const { cards, totalDue, error } = await studyService.getDueFlashcards(userId, limit);

    if (error) {
      return ResponseUtils.createInternalErrorResponse(`Failed to fetch study session: ${error.message}`);
    }

    // Step 4: Generate session ID and return response
    const sessionId = crypto.randomUUID();

    const response: StudySessionResponse = {
      sessionId,
      cards,
      totalDue,
      sessionStartedAt: new Date().toISOString(),
    };

    return ResponseUtils.createSuccessResponse(response);
  } catch {
    return ResponseUtils.createInternalErrorResponse();
  }
};
