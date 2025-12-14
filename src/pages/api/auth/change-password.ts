import type { APIRoute } from "astro";
import { ResponseUtils } from "../../../lib/utils/response.utils";
import { changePasswordSchema } from "../../../lib/validation/auth.schema";
import { AuthUtils } from "../../../lib/utils/auth.utils";
import { ZodError } from "zod";

/**
 * POST /api/auth/change-password
 *
 * Change password for authenticated user
 * PRD: US-003 - Zmiana hasła
 *
 * Request Headers:
 * Authorization: Bearer {token}
 *
 * Request Body:
 * {
 *   currentPassword: string;
 *   newPassword: string;
 * }
 *
 * Response (Success):
 * {
 *   success: true,
 *   data: { message: "Hasło zostało zmienione" }
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
    // Normal authentication flow - use SSR client from middleware (locals.supabase)
    const { userId: authenticatedUserId, error: authError } = await AuthUtils.getUserIdFromRequest(
      request,
      locals.supabase
    );

    if (authError || !authenticatedUserId) {
      return ResponseUtils.createAuthErrorResponse(authError?.message || "Wymagane uwierzytelnienie");
    }

    // Get user details for email
    const {
      data: { user },
      error: userError,
    } = await locals.supabase.auth.getUser();

    if (userError || !user) {
      return ResponseUtils.createAuthErrorResponse("Nie można pobrać danych użytkownika");
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = changePasswordSchema.parse(body);

    // Verify current password by attempting to sign in
    const { error: verifyError } = await locals.supabase.auth.signInWithPassword({
      email: user.email || "",
      password: validatedData.currentPassword,
    });

    if (verifyError) {
      return ResponseUtils.createErrorResponse(
        "Nieprawidłowe obecne hasło",
        "INVALID_CURRENT_PASSWORD",
        400,
        "currentPassword"
      );
    }

    // Update password
    const { error: updateError } = await locals.supabase.auth.updateUser({
      password: validatedData.newPassword,
    });

    if (updateError) {
      const { message, code } = ResponseUtils.mapSupabaseAuthError(updateError);
      return ResponseUtils.createErrorResponse(message, code, 400);
    }

    // PRD US-003 AC: "Po zmianie użytkownik otrzymuje potwierdzenie"
    return ResponseUtils.createSuccessResponse({
      message: "Hasło zostało zmienione pomyślnie",
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return ResponseUtils.createValidationErrorResponse(firstError.message, firstError.path.join("."));
    }

    // Handle other errors
    console.error("[Change Password API] Error:", error);
    return ResponseUtils.createInternalErrorResponse("Wystąpił błąd podczas zmiany hasła");
  }
};
