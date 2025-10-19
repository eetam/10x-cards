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
};
