import type { APIRoute } from "astro";
import { ResponseUtils } from "../../../lib/utils/response.utils";
import { deleteAccountSchema } from "../../../lib/validation/auth.schema";
import { AuthUtils } from "../../../lib/utils/auth.utils";
import { ZodError } from "zod";

/**
 * DELETE /api/auth/account
 *
 * Delete user account (requires password confirmation)
 * PRD: US-004 - Usunięcie konta
 *
 * Request Headers:
 * Authorization: Bearer {token}
 *
 * Request Body:
 * {
 *   password: string;
 * }
 *
 * Response (Success):
 * {
 *   success: true,
 *   data: { message: "Konto zostało usunięte" }
 * }
 *
 * Response (Error):
 * {
 *   success: false,
 *   error: { message: string, code: string, field?: string }
 * }
 */
export const prerender = false;

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    const authHeader = request.headers.get("Authorization");
    const token = AuthUtils.extractBearerToken(authHeader);

    if (!token) {
      return ResponseUtils.createAuthErrorResponse("Wymagane uwierzytelnienie");
    }

    // Verify token and get user
    if (!locals.supabase) {
      return ResponseUtils.createErrorResponse("Serwis autentykacji jest niedostępny", "SERVICE_UNAVAILABLE", 500);
    }

    const { user, error: authError } = await AuthUtils.verifyToken(locals.supabase, token);

    if (authError || !user) {
      return ResponseUtils.createAuthErrorResponse("Nieprawidłowy token uwierzytelniający");
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = deleteAccountSchema.parse(body);

    // PRD US-004 AC: "Operacja wymaga potwierdzenia hasłem"
    // Verify password by attempting to sign in
    const { error: verifyError } = await locals.supabase.auth.signInWithPassword({
      email: user.email || "",
      password: validatedData.password,
    });

    if (verifyError) {
      return ResponseUtils.createErrorResponse("Nieprawidłowe hasło", "INVALID_PASSWORD", 400, "password");
    }

    // Delete user account using admin API
    // Note: This requires service role key or proper RLS policies
    const { error: deleteError } = await locals.supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("[Delete Account API] Error:", deleteError);
      return ResponseUtils.createErrorResponse("Nie udało się usunąć konta", "DELETE_FAILED", 500);
    }

    // Sign out the user
    await locals.supabase.auth.signOut();

    return ResponseUtils.createSuccessResponse({
      message: "Konto zostało trwale usunięte",
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return ResponseUtils.createValidationErrorResponse(firstError.message, firstError.path.join("."));
    }

    // Handle other errors
    console.error("[Delete Account API] Error:", error);
    return ResponseUtils.createInternalErrorResponse("Wystąpił błąd podczas usuwania konta");
  }
};
