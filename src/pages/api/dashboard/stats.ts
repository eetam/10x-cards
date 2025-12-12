import type { APIRoute } from "astro";
import { AuthUtils } from "../../../lib/utils/auth.utils";
import { ResponseUtils } from "../../../lib/utils/response.utils";
import { EnvConfig } from "../../../lib/config/env.config";

export const prerender = false;

/**
 * GET /api/dashboard/stats
 * Returns dashboard statistics for authenticated user
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Get default user ID for testing
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

      const { user, error: authError } = await AuthUtils.verifyToken(locals.supabase, token);

      if (authError || !user) {
        return ResponseUtils.createAuthErrorResponse(authError?.message || "Invalid or expired token");
      }

      userId = user.id;
    }

    // Fetch statistics
    const [flashcardsResult, dueResult, generationsResult] = await Promise.all([
      // Total flashcards count
      locals.supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", userId),

      // Flashcards due today
      locals.supabase
        .from("flashcards")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .lte("due", new Date().toISOString()),

      // Total generations count
      locals.supabase.from("generations").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);

    const stats = {
      totalFlashcards: flashcardsResult.count || 0,
      dueToday: dueResult.count || 0,
      totalGenerations: generationsResult.count || 0,
      studiedToday: 0, // TODO: Implement when review_history tracking is added
    };

    return ResponseUtils.createSuccessResponse(stats, 200);
  } catch (error) {
    return ResponseUtils.createInternalErrorResponse(
      error instanceof Error ? error.message : "Failed to fetch dashboard stats"
    );
  }
};
