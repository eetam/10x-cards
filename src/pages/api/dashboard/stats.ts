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

    // Calculate start of today (midnight UTC)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Fetch statistics
    const [flashcardsResult, dueResult, generationsResult, studiedTodayResult] = await Promise.all([
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

      // Flashcards studied today (with reviews in review_history from today)
      locals.supabase.from("flashcards").select("id, review_history").eq("user_id", userId),
    ]);

    // Count flashcards that have reviews today
    let studiedToday = 0;
    if (studiedTodayResult.data) {
      studiedToday = studiedTodayResult.data.filter((flashcard) => {
        const reviewHistory = flashcard.review_history as
          | { reviewedAt: string; rating: number; previousState: number; newState: number }[]
          | undefined;

        if (!Array.isArray(reviewHistory)) return false;

        return reviewHistory.some((review) => {
          return review.reviewedAt && review.reviewedAt >= startOfToday;
        });
      }).length;
    }

    const stats = {
      totalFlashcards: flashcardsResult.count || 0,
      dueToday: dueResult.count || 0,
      totalGenerations: generationsResult.count || 0,
      studiedToday,
    };

    return ResponseUtils.createSuccessResponse(stats, 200);
  } catch (error) {
    return ResponseUtils.createInternalErrorResponse(
      error instanceof Error ? error.message : "Failed to fetch dashboard stats"
    );
  }
};
