import type { APIRoute } from "astro";
import { ResponseUtils } from "../../../lib/utils/response.utils";
import { loginSchema } from "../../../lib/validation/auth.schema";
import { ZodError } from "zod";

/**
 * POST /api/auth/login
 *
 * Logowanie użytkownika
 * PRD: US-002 - Logowanie do aplikacji
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
 *     session: { access_token: string, refresh_token: string }
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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate request body
    const body = await request.json();

    // Validate with Zod schema
    const validatedData = loginSchema.parse(body);

    // Check if Supabase client is available
    if (!locals.supabase) {
      return ResponseUtils.createErrorResponse("Serwis autentykacji jest niedostępny", "SERVICE_UNAVAILABLE", 500);
    }

    // Sign in with email and password
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      // Map Supabase error to user-friendly message
      const { message, code } = ResponseUtils.mapSupabaseAuthError(error);
      return ResponseUtils.createErrorResponse(message, code, 401);
    }

    if (!data.session || !data.user) {
      return ResponseUtils.createErrorResponse("Nie udało się utworzyć sesji", "SESSION_ERROR", 500);
    }

    // Return user data and session tokens
    return ResponseUtils.createSuccessResponse({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return ResponseUtils.createValidationErrorResponse(firstError.message, firstError.path.join("."));
    }

    // Handle other errors
    console.error("[Login API] Error:", error);
    return ResponseUtils.createInternalErrorResponse("Wystąpił błąd podczas logowania");
  }
};
