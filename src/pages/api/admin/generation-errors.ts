import type { APIRoute } from "astro";
import { AuthUtils } from "../../../lib/utils/auth.utils";
import { ResponseUtils } from "../../../lib/utils/response.utils";
import { EnvConfig } from "../../../lib/config/env.config";

export const prerender = false;

interface GenerationError {
  id: number;
  userId: string;
  model: string;
  sourceTextHash: string;
  sourceTextLength: number;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface GenerationErrorsResponse {
  errors: GenerationError[];
  totalCount: number;
  errorsByCode: Record<string, number>;
  errorsByModel: Record<string, number>;
}

/**
 * GET /api/admin/generation-errors
 * Returns generation error logs for monitoring and debugging
 * Available to all authenticated users (hidden endpoint, no UI link)
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const defaultUserId = EnvConfig.getDefaultUserId();

    if (!defaultUserId) {
      // Normal authentication flow - use SSR client from middleware (locals.supabase)
      const { userId: authenticatedUserId, error: authError } = await AuthUtils.getUserIdFromRequest(
        request,
        locals.supabase
      );

      if (authError || !authenticatedUserId) {
        return ResponseUtils.createAuthErrorResponse(authError?.message || "Authentication required");
      }
    }

    // Fetch error logs
    const { data: errorLogs, error: fetchError } = await locals.supabase
      .from("generation_error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100); // Limit to most recent 100 errors

    if (fetchError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to fetch error logs: ${fetchError.message}`);
    }

    // Transform and aggregate data
    const errors: GenerationError[] =
      errorLogs?.map((log) => ({
        id: log.id,
        userId: log.user_id,
        model: log.model,
        sourceTextHash: log.source_text_hash,
        sourceTextLength: log.source_text_length,
        errorCode: log.error_code,
        errorMessage: log.error_message,
        createdAt: log.created_at,
      })) || [];

    // Aggregate errors by code
    const errorsByCode: Record<string, number> = {};
    errors.forEach((error) => {
      const code = error.errorCode || "UNKNOWN";
      errorsByCode[code] = (errorsByCode[code] || 0) + 1;
    });

    // Aggregate errors by model
    const errorsByModel: Record<string, number> = {};
    errors.forEach((error) => {
      errorsByModel[error.model] = (errorsByModel[error.model] || 0) + 1;
    });

    // Get total count
    const { count: totalCount } = await locals.supabase
      .from("generation_error_logs")
      .select("*", { count: "exact", head: true });

    const response: GenerationErrorsResponse = {
      errors,
      totalCount: totalCount || 0,
      errorsByCode,
      errorsByModel,
    };

    return ResponseUtils.createSuccessResponse(response, 200);
  } catch (error) {
    return ResponseUtils.createInternalErrorResponse(
      error instanceof Error ? error.message : "Failed to fetch generation errors"
    );
  }
};
