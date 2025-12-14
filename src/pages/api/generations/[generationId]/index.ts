import type { APIRoute } from "astro";
import { z } from "zod";
import type { GenerationDetailsResponse } from "../../../../types";
import { AuthUtils } from "../../../../lib/utils/auth.utils";
import { ResponseUtils } from "../../../../lib/utils/response.utils";
import { GenerationService } from "../../../../lib/services/generation.service";
import { EnvConfig } from "../../../../lib/config/env.config";

// Disable prerendering for API routes
export const prerender = false;

// Validation schema for generationId path parameter
const GenerationIdSchema = z.string().uuid("Invalid generation ID format");

/**
 * GET /api/generations/{generationId}
 *
 * Retrieves detailed information about a flashcard generation session.
 *
 * @param request - The incoming HTTP request
 * @param locals - Astro locals containing Supabase client
 * @param params - Route parameters containing generationId
 * @returns Response with generation details or error
 */
export const GET: APIRoute = async ({ request, locals, params }) => {
  try {
    const defaultUserId = EnvConfig.getDefaultUserId();

    let userId: string;

    // Check if we should use default user ID for testing
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

    // Step 2: Validate generationId parameter
    const generationId = params.generationId;

    if (!generationId) {
      return ResponseUtils.createValidationErrorResponse("Generation ID is required", "generationId");
    }

    const validationResult = GenerationIdSchema.safeParse(generationId);

    if (!validationResult.success) {
      return ResponseUtils.createValidationErrorResponse("Invalid generation ID format", "generationId");
    }

    const validatedGenerationId = validationResult.data;

    // Step 3: Fetch generation from database using GenerationService
    const generationService = new GenerationService(locals.supabase);
    const { generation, error: fetchError } = await generationService.getGenerationById(validatedGenerationId, userId);

    if (fetchError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to fetch generation: ${fetchError.message}`);
    }

    // Step 4: Handle not found case
    if (!generation) {
      return ResponseUtils.createErrorResponse("Generation not found", "NOT_FOUND", 404);
    }

    // Step 5: Transform data to GenerationDetailsResponse
    // Convert generation_duration from PostgreSQL interval to ISO 8601 duration
    const generationDuration = generationService.convertIntervalToISO8601(generation.generation_duration);

    // Map database fields (snake_case) to API format (camelCase)
    // Note: GenerationDetailsResponse contains both snake_case (from Pick) and camelCase (from & {})
    const responseData: GenerationDetailsResponse = {
      id: generation.id,
      user_id: generation.user_id,
      userId: generation.user_id,
      model: generation.model,
      generated_count: generation.generated_count,
      accepted_unedited_count: generation.accepted_unedited_count,
      acceptedUneditedCount: generation.accepted_unedited_count ?? 0,
      accepted_edited_count: generation.accepted_edited_count,
      acceptedEditedCount: generation.accepted_edited_count ?? 0,
      source_text_length: generation.source_text_length,
      sourceTextLength: generation.source_text_length,
      generation_duration: generation.generation_duration as string | null,
      generationDuration: generationDuration ?? "",
      created_at: generation.created_at,
      createdAt: generation.created_at,
    };

    // Step 6: Return success response
    return ResponseUtils.createSuccessResponse(responseData, 200);
  } catch {
    return ResponseUtils.createInternalErrorResponse();
  }
};
