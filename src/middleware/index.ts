import type { MiddlewareResponseHandler } from "astro";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

/**
 * Middleware for authentication and route protection
 * Uses Supabase SSR client to read session from cookies
 */
export const onRequest: MiddlewareResponseHandler = async (context, next) => {
  const url = new URL(context.request.url);
  const isApiRoute = url.pathname.startsWith("/api/");

  // Public routes - these routes are accessible without authentication
  const PUBLIC_ROUTES = ["/login", "/register"];
  const isPublicRoute = PUBLIC_ROUTES.some((route) => url.pathname.startsWith(route));

  // Everything except public routes and API routes requires authentication
  const isProtectedRoute = !isPublicRoute && !isApiRoute;

  // For protected routes, check authentication using SSR client with cookies
  if (isProtectedRoute) {
    try {
      // Create SSR client that can read cookies from the request
      const supabase = createSupabaseServerInstance({
        headers: context.request.headers,
        cookies: context.cookies,
      });

      // Get user session from cookies
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("[Middleware] Session error:", error);
        // Redirect to login on error
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/login?redirect=${encodeURIComponent(url.pathname)}`,
          },
        });
      }

      if (session?.user) {
        // User is authenticated, store client in locals and allow access
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        context.locals.supabase = supabase as any;
        return next();
      }

      // User is not authenticated, redirect to login
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/login?redirect=${encodeURIComponent(url.pathname)}`,
        },
      });
    } catch (error) {
      // Error creating Supabase client or getting session
      console.error("[Middleware] Error:", error);
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/login?redirect=${encodeURIComponent(url.pathname)}`,
        },
      });
    }
  }

  // For API routes, use server client with service role (bypasses RLS)
  // This is safe because API routes do their own authentication checks
  if (isApiRoute) {
    try {
      const { serverSupabaseClient } = await import("../db/supabase.server.ts");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context.locals.supabase = serverSupabaseClient as any;
    } catch {
      // If import fails, set null - API routes should handle this
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context.locals.supabase = null as any;
    }
  }

  return next();
};
