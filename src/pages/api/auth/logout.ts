import type { APIRoute } from "astro";
import { ResponseUtils } from "../../../lib/utils/response.utils";

/**
 * POST /api/auth/logout
 *
 * Wylogowanie użytkownika
 * Unieważnia aktualną sesję w Supabase
 *
 * Request Headers:
 * Authorization: Bearer {token} (opcjonalne - Supabase używa cookie)
 *
 * Response (Success):
 * {
 *   success: true,
 *   data: { message: "Wylogowano pomyślnie" }
 * }
 *
 * Response (Error):
 * {
 *   success: false,
 *   error: { message: string, code: string }
 * }
 */
export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    // Check if Supabase client is available
    if (!locals.supabase) {
      return ResponseUtils.createErrorResponse("Serwis autentykacji jest niedostępny", "SERVICE_UNAVAILABLE", 500);
    }

    // Sign out - Supabase handles session invalidation
    // Works with both cookie and JWT token authentication
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      console.error("[Logout API] Error:", error);
      return ResponseUtils.createErrorResponse("Wystąpił błąd podczas wylogowania", "LOGOUT_ERROR", 500);
    }

    return ResponseUtils.createSuccessResponse({
      message: "Wylogowano pomyślnie",
    });
  } catch (error) {
    console.error("[Logout API] Error:", error);
    return ResponseUtils.createInternalErrorResponse("Wystąpił błąd podczas wylogowania");
  }
};
