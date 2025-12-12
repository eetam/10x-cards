import type { APIRoute } from "astro";
import { ResponseUtils } from "../../../lib/utils/response.utils";
import { AuthUtils } from "../../../lib/utils/auth.utils";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/auth/session
 *
 * Returns current user session information.
 * Checks JWT token from Authorization header or Supabase session.
 *
 * @param request - The incoming HTTP request
 * @param locals - Astro locals containing Supabase client
 * @returns Response with user session info or null
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // First, try to get session from cookies (SSR client)
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      // User is authenticated via cookies
      return ResponseUtils.createSuccessResponse({
        user: {
          id: session.user.id,
          email: session.user.email,
        },
        isAuthenticated: true,
      });
    }

    // Fallback: Check JWT token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = AuthUtils.extractBearerToken(authHeader);

    if (!token) {
      // No token and no session - user is not authenticated
      return ResponseUtils.createSuccessResponse({
        user: null,
        isAuthenticated: false,
      });
    }

    // Verify JWT token with Supabase
    const { user, error: authError } = await AuthUtils.verifyToken(supabase, token);

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
  } catch {
    // On error, assume not authenticated
    return ResponseUtils.createSuccessResponse({
      user: null,
      isAuthenticated: false,
    });
  }
};
