import type { APIRoute } from "astro";
import { ResponseUtils } from "../../../lib/utils/response.utils";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

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

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create SSR client with cookies support
    // This ensures session cookies are cleared on logout
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Sign out - Supabase handles session invalidation and cookie clearing
    const { error } = await supabase.auth.signOut();

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
