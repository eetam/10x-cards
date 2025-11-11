import type { APIRoute } from "astro";
import { EnvConfig } from "../../../lib/config/env.config";
import { ResponseUtils } from "../../../lib/utils/response.utils";
import { AuthUtils } from "../../../lib/utils/auth.utils";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/auth/session
 *
 * Returns current user session information.
 * Uses DEFAULT_USER_ID if set, otherwise checks JWT token.
 *
 * @param request - The incoming HTTP request
 * @param locals - Astro locals containing Supabase client
 * @returns Response with user session info or null
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Check for DEFAULT_USER_ID first (for testing/development)
    const defaultUserId = EnvConfig.getDefaultUserId();

    if (defaultUserId) {
      // Return mock user info when DEFAULT_USER_ID is set
      return ResponseUtils.createSuccessResponse({
        user: {
          id: defaultUserId,
          email: `test-${defaultUserId}@example.com`,
        },
        isAuthenticated: true,
      });
    }

    // Normal authentication flow - check JWT token
    const authHeader = request.headers.get("authorization");
    const token = AuthUtils.extractBearerToken(authHeader);

    if (!token) {
      // No token - user is not authenticated
      return ResponseUtils.createSuccessResponse({
        user: null,
        isAuthenticated: false,
      });
    }

    // Verify JWT token with Supabase
    const { user, error: authError } = await AuthUtils.verifyToken(locals.supabase, token);

    if (authError || !user) {
      // Invalid token - user is not authenticated
      return ResponseUtils.createSuccessResponse({
        user: null,
        isAuthenticated: false,
      });
    }

    // Valid token - return user info
    return ResponseUtils.createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
      },
      isAuthenticated: true,
    });
  } catch (error) {
    // On error, assume not authenticated
    return ResponseUtils.createSuccessResponse({
      user: null,
      isAuthenticated: false,
    });
  }
};

