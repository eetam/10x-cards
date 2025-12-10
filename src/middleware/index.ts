import type { MiddlewareResponseHandler } from "astro";

/**
 * Simplified middleware - delay Supabase initialization to avoid module-level errors
 */
export const onRequest: MiddlewareResponseHandler = async (context, next) => {
  // Lazy load Supabase client to avoid module-level initialization issues
  try {
    const { supabaseClient } = await import("../db/supabase.client.ts");
    // Set Supabase client in locals (will be null if env vars are missing)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context.locals.supabase = supabaseClient as any;
  } catch {
    // If import fails, set null - API routes should handle this
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context.locals.supabase = null as any;
  }

  const url = new URL(context.request.url);

  // Protected routes list
  const PROTECTED_ROUTES = ["/generate"];
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => url.pathname.startsWith(route));

  // Check if route is protected
  if (isProtectedRoute) {
    // Check for DEFAULT_USER_ID (development mode)
    const defaultUserId = import.meta.env.DEFAULT_USER_ID;
    if (defaultUserId) {
      // Allow access in development mode with DEFAULT_USER_ID
      return next();
    }

    // For protected routes without DEFAULT_USER_ID, redirect to login
    // (simplified - skip JWT verification for now)
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/login?redirect=${encodeURIComponent(url.pathname)}`,
      },
    });
  }

  return next();
};
