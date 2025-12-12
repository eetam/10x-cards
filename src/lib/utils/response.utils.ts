import type { ApiError } from "../../types";

/**
 * Utility functions for API response formatting
 */
export const ResponseUtils = {
  /**
   * Create standardized error response
   */
  createErrorResponse(message: string, code: string, status: number, field?: string): Response {
    const error: ApiError = {
      message,
      code,
      field,
    };

    return new Response(JSON.stringify({ error, success: false }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  },

  /**
   * Create standardized success response
   */
  createSuccessResponse<T>(data: T, status = 200): Response {
    return new Response(JSON.stringify({ data, success: true }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  },

  /**
   * Create validation error response
   */
  createValidationErrorResponse(message: string, field: string): Response {
    return this.createErrorResponse(message, "VALIDATION_ERROR", 400, field);
  },

  /**
   * Create authentication error response
   */
  createAuthErrorResponse(message = "Authentication required"): Response {
    return this.createErrorResponse(message, "UNAUTHORIZED", 401);
  },

  /**
   * Create internal server error response
   */
  createInternalErrorResponse(message = "Internal server error"): Response {
    return this.createErrorResponse(message, "INTERNAL_ERROR", 500);
  },

  /**
   * Map Supabase auth errors to user-friendly Polish messages
   */
  mapSupabaseAuthError(error: { message: string }): {
    message: string;
    code: string;
  } {
    const errorMap: Record<string, { message: string; code: string }> = {
      "Invalid login credentials": {
        message: "Nieprawidłowy email lub hasło",
        code: "INVALID_CREDENTIALS",
      },
      "Email not confirmed": {
        message: "Potwierdź swój email przed zalogowaniem",
        code: "EMAIL_NOT_CONFIRMED",
      },
      "User already registered": {
        message: "Ten email jest już używany",
        code: "EMAIL_ALREADY_EXISTS",
      },
      "already registered": {
        message: "Ten email jest już używany",
        code: "EMAIL_ALREADY_EXISTS",
      },
      "Password should be at least 8 characters": {
        message: "Hasło musi mieć co najmniej 8 znaków",
        code: "WEAK_PASSWORD",
      },
      "Token has expired or is invalid": {
        message: "Link wygasł lub jest nieprawidłowy",
        code: "INVALID_TOKEN",
      },
      "Invalid JWT": {
        message: "Sesja wygasła. Zaloguj się ponownie",
        code: "INVALID_TOKEN",
      },
      "JWT expired": {
        message: "Sesja wygasła. Zaloguj się ponownie",
        code: "TOKEN_EXPIRED",
      },
    };

    for (const [key, value] of Object.entries(errorMap)) {
      if (error.message.includes(key)) {
        return value;
      }
    }

    return {
      message: error.message,
      code: "AUTH_ERROR",
    };
  },
};
