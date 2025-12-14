import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApiError } from "../../types";

/**
 * Utility functions for API authentication and authorization
 */
export const AuthUtils = {
  /**
   * Extract and validate Bearer token from Authorization header
   */
  extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7); // Remove "Bearer " prefix
  },

  /**
   * Verify JWT token with Supabase and return user
   */
  async verifyToken(
    supabase: SupabaseClient,
    token: string
  ): Promise<{ user: { id: string } | null; error: ApiError | null }> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return {
          user: null,
          error: {
            message: "Invalid or expired token",
            code: "UNAUTHORIZED",
          },
        };
      }

      return { user, error: null };
    } catch {
      return {
        user: null,
        error: {
          message: "Authentication verification failed",
          code: "AUTH_ERROR",
        },
      };
    }
  },

  /**
   * Extract user ID from request (token or cookies)
   * Uses SSR client from middleware (locals.supabase)
   * @param request - The incoming HTTP request
   * @param supabase - SSR Supabase client from middleware
   * @returns Object with userId or error
   */
  async getUserIdFromRequest(
    request: Request,
    supabase: SupabaseClient
  ): Promise<{ userId: string | null; error: ApiError | null }> {
    const authHeader = request.headers.get("authorization");
    const token = this.extractBearerToken(authHeader);

    if (token) {
      // Verify JWT token with SSR client (can handle tokens)
      const { user, error: authError } = await this.verifyToken(supabase, token);

      if (authError || !user) {
        return {
          userId: null,
          error: authError || {
            message: "Invalid or expired token",
            code: "UNAUTHORIZED",
          },
        };
      }

      return { userId: user.id, error: null };
    }

    // Check session from cookies
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return {
        userId: null,
        error: {
          message: "Authentication required",
          code: "UNAUTHORIZED",
        },
      };
    }

    return { userId: session.user.id, error: null };
  },

  /**
   * Check if user has permission to perform generation operations
   */
  async checkGenerationPermission(
    supabase: SupabaseClient,
    userId: string
  ): Promise<{ allowed: boolean; error: ApiError | null }> {
    try {
      // Check if user exists and is active
      const { data: user, error } = await supabase.auth.admin.getUserById(userId);

      if (error || !user || !user.user.email_confirmed_at) {
        return {
          allowed: false,
          error: {
            message: "User account not verified",
            code: "ACCOUNT_NOT_VERIFIED",
          },
        };
      }

      // Additional permission checks can be added here
      // e.g., check subscription status, rate limits, etc.

      return { allowed: true, error: null };
    } catch {
      return {
        allowed: false,
        error: {
          message: "Permission check failed",
          code: "PERMISSION_ERROR",
        },
      };
    }
  },
};
