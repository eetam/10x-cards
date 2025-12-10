import type { MiddlewareResponseHandler } from "astro";

import { getSupabaseClient, supabaseClient } from "../db/supabase.client.ts";
import { AuthUtils } from "../lib/utils/auth.utils";
import { EnvConfig } from "../lib/config/env.config";

/**
 * List of protected routes that require authentication
 */
const PROTECTED_ROUTES = ["/generate"];

/**
 * Check if a route is protected
 */
function isProtectedRoute(url: URL): boolean {
  return PROTECTED_ROUTES.some((route) => url.pathname.startsWith(route));
}

/**
 * Extract JWT token from cookies or Authorization header
 */
function getTokenFromRequest(request: Request): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    return AuthUtils.extractBearerToken(authHeader);
  }

  // For now, we only check Authorization header
  // In a real app, you might want to parse Supabase session cookies
  // Supabase stores access token in sb-<project-ref>-auth-token cookie

  return null;
}

export const onRequest: MiddlewareResponseHandler = async (context, next) => {
  // Set Supabase client in locals (use getSupabaseClient to ensure it's initialized)
  try {
    context.locals.supabase = getSupabaseClient();
  } catch (error) {
    // If Supabase client is not available, log error but don't block the request
    // This allows the app to load even if Supabase is not configured
    if (import.meta.env.DEV) {
      console.error("Failed to initialize Supabase client:", error);
    }
    // Create a dummy client to prevent errors in API routes
    // API routes should handle missing Supabase client gracefully
    context.locals.supabase = null as any;
  }

  const url = new URL(context.request.url);

  // Check if route is protected
  if (isProtectedRoute(url)) {
    // Check for DEFAULT_USER_ID (development mode)
    const defaultUserId = EnvConfig.getDefaultUserId();
    if (defaultUserId) {
      // Allow access in development mode with DEFAULT_USER_ID
      return next();
    }

    // Try to get token from request
    const token = getTokenFromRequest(context.request);

    if (!token) {
      // No token - redirect to login
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/login?redirect=${encodeURIComponent(url.pathname)}`,
        },
      });
    }

    // Verify token (only if Supabase client is available)
    if (supabaseClient) {
      const { user, error } = await AuthUtils.verifyToken(supabaseClient, token);

      if (error || !user) {
        // Invalid token - redirect to login
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/login?redirect=${encodeURIComponent(url.pathname)}`,
          },
        });
      }
    } else {
      // No Supabase client - redirect to login
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/login?redirect=${encodeURIComponent(url.pathname)}`,
        },
      });
    }

    // Token is valid - allow access
  }

  return next();
};
