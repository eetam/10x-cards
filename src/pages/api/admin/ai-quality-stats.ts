import type { APIRoute } from "astro";
import { AuthUtils } from "../../../lib/utils/auth.utils";
import { ResponseUtils } from "../../../lib/utils/response.utils";
import { EnvConfig } from "../../../lib/config/env.config";

export const prerender = false;

interface AIQualityStats {
  // MS-01: Jakość generacji AI
  totalProposals: number;
  acceptedFlashcards: number; // ai-full + ai-edited
  aiFullCount: number;
  aiEditedCount: number;
  rejectedProposals: number;
  acceptanceRate: number; // percentage
  ms01Target: number; // 75%
  ms01Achieved: boolean;

  // MS-02: Adopcja funkcji generowania AI
  totalFlashcards: number;
  aiCreatedFlashcards: number; // ai-full + ai-edited
  manualFlashcards: number;
  aiAdoptionRate: number; // percentage
  ms02Target: number; // 75%
  ms02Achieved: boolean;

  // Additional insights
  editRate: number; // percentage of AI proposals that were edited
  generationsCount: number;
  averageProposalsPerGeneration: number;
}

/**
 * GET /api/admin/ai-quality-stats
 * Returns AI quality statistics for MS-01 and MS-02 metrics
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

    // Fetch all necessary data in parallel
    const [generationsResult, flashcardsResult, aiFullResult, aiEditedResult, manualResult] = await Promise.all([
      // Get all generations with generated_count (number of proposals generated)
      locals.supabase.from("generations").select("generated_count"),

      // Get total flashcards count
      locals.supabase.from("flashcards").select("id", { count: "exact", head: true }),

      // Get ai-full flashcards
      locals.supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("source", "ai-full"),

      // Get ai-edited flashcards
      locals.supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("source", "ai-edited"),

      // Get manual flashcards
      locals.supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("source", "manual"),
    ]);

    // Calculate MS-01: Jakość generacji AI
    const totalProposals = generationsResult.data?.reduce((sum, gen) => sum + (gen.generated_count || 0), 0) || 0;
    const aiFullCount = aiFullResult.count || 0;
    const aiEditedCount = aiEditedResult.count || 0;
    const acceptedFlashcards = aiFullCount + aiEditedCount;
    const rejectedProposals = Math.max(0, totalProposals - acceptedFlashcards);
    const acceptanceRate = totalProposals > 0 ? (acceptedFlashcards / totalProposals) * 100 : 0;
    const ms01Target = 75;
    const ms01Achieved = acceptanceRate >= ms01Target;

    // Calculate MS-02: Adopcja funkcji generowania AI
    const totalFlashcards = flashcardsResult.count || 0;
    const aiCreatedFlashcards = acceptedFlashcards;
    const manualFlashcards = manualResult.count || 0;
    const aiAdoptionRate = totalFlashcards > 0 ? (aiCreatedFlashcards / totalFlashcards) * 100 : 0;
    const ms02Target = 75;
    const ms02Achieved = aiAdoptionRate >= ms02Target;

    // Additional insights
    const editRate = acceptedFlashcards > 0 ? (aiEditedCount / acceptedFlashcards) * 100 : 0;
    const generationsCount = generationsResult.data?.length || 0;
    // Calculate average only for successful generations (generated_count > 0)
    const successfulGenerations = generationsResult.data?.filter((gen) => (gen.generated_count || 0) > 0) || [];
    const successfulGenerationsCount = successfulGenerations.length;
    const averageProposalsPerGeneration =
      successfulGenerationsCount > 0 ? totalProposals / successfulGenerationsCount : 0;

    const stats: AIQualityStats = {
      // MS-01
      totalProposals,
      acceptedFlashcards,
      aiFullCount,
      aiEditedCount,
      rejectedProposals,
      acceptanceRate: Math.round(acceptanceRate * 100) / 100,
      ms01Target,
      ms01Achieved,

      // MS-02
      totalFlashcards,
      aiCreatedFlashcards,
      manualFlashcards,
      aiAdoptionRate: Math.round(aiAdoptionRate * 100) / 100,
      ms02Target,
      ms02Achieved,

      // Additional
      editRate: Math.round(editRate * 100) / 100,
      generationsCount,
      averageProposalsPerGeneration: Math.round(averageProposalsPerGeneration * 100) / 100,
    };

    return ResponseUtils.createSuccessResponse(stats, 200);
  } catch (error) {
    return ResponseUtils.createInternalErrorResponse(
      error instanceof Error ? error.message : "Failed to fetch AI quality stats"
    );
  }
};
