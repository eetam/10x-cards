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

    // Use service role client to delete user account (bypasses RLS)
    // CASCADE will automatically delete all related data (flashcards, generations, error logs)
    const { getServerSupabaseClient } = await import("../../../db/supabase.server");
    const adminClient = getServerSupabaseClient();

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

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
