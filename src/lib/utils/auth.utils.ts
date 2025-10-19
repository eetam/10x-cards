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
  async verifyToken(supabase: SupabaseClient, token: string): Promise<{ user: unknown; error: ApiError | null }> {
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
