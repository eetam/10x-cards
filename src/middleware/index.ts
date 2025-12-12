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

  // Public routes - these routes are accessible without authentication
  const PUBLIC_ROUTES = ["/login", "/register"];
  const isPublicRoute = PUBLIC_ROUTES.some((route) => url.pathname.startsWith(route));

  // API routes are handled separately
  const isApiRoute = url.pathname.startsWith("/api/");

  // Everything except public routes and API routes requires authentication
  const isProtectedRoute = !isPublicRoute && !isApiRoute;

  // Check if route is protected
  if (isProtectedRoute) {
    // Check if user is authenticated via Supabase session
    if (context.locals.supabase) {
      try {
        const {
          data: { session },
        } = await context.locals.supabase.auth.getSession();

        if (session?.user) {
          // User is authenticated, allow access
          return next();
        }
      } catch (error) {
        // Error getting session, redirect to login
        console.error("[Middleware] Session error:", error);
      }
    }

    // User is not authenticated, redirect to login
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/login?redirect=${encodeURIComponent(url.pathname)}`,
      },
    });
  }

  return next();
};
