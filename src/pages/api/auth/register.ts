import type { APIRoute } from "astro";
import { ResponseUtils } from "../../../lib/utils/response.utils";
import { registerServerSchema } from "../../../lib/validation/auth.schema";
import { ZodError } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

/**
 * POST /api/auth/register
 *
 * Rejestracja nowego użytkownika
 * PRD: US-001 - Rejestracja konta przez e-mail/hasło
 *
 * Request Body:
 * {
 *   email: string;
 *   password: string;
 * }
 *
 * Response (Success):
 * {
 *   success: true,
 *   data: {
 *     user: { id: string, email: string },
 *     session: { access_token: string, refresh_token: string } | null
 *   }
 * }
 *
 * Response (Error):
 * {
 *   success: false,
 *   error: { message: string, code: string, field?: string }
 * }
 */
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();

    // Validate with Zod schema
    const validatedData = registerServerSchema.parse(body);

    // Create SSR client with cookies support
    // This ensures session is saved in cookies after registration (if auto-login is enabled)
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    // Get the origin from the request to construct the redirect URL
    // This ensures email confirmation links point to the correct domain (not localhost)
    const requestUrl = new URL(request.url);
    const redirectTo = `${requestUrl.origin}/login`;

    // Register user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      // Map Supabase error to user-friendly message
      const { message, code } = ResponseUtils.mapSupabaseAuthError(error);
      return ResponseUtils.createErrorResponse(message, code, 400);
    }

    if (!data.user) {
      return ResponseUtils.createErrorResponse("Nie udało się utworzyć konta", "REGISTRATION_FAILED", 500);
    }

    // PRD US-001 AC: "Po rejestracji następuje automatyczne logowanie"
    // Return user data and session for automatic login
    return ResponseUtils.createSuccessResponse(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        // Session will be available if email confirmation is disabled in Supabase
        session: data.session
          ? {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            }
          : null,
        requiresEmailConfirmation: !data.session,
        message: data.session ? "Konto utworzone pomyślnie" : "Sprawdź email aby aktywować konto",
      },
      201
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return ResponseUtils.createValidationErrorResponse(firstError.message, firstError.path.join("."));
    }

    // Handle other errors
    console.error("[Register API] Error:", error);
    return ResponseUtils.createInternalErrorResponse("Wystąpił błąd podczas rejestracji");
  }
};
