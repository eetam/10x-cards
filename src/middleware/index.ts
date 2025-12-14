import type { MiddlewareHandler } from "astro";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = new URL(context.request.url);
  const isApiRoute = url.pathname.startsWith("/api/");
  const PUBLIC_ROUTES = ["/login", "/register"];
  const isPublicRoute = PUBLIC_ROUTES.some((route) => url.pathname.startsWith(route));
  const isProtectedRoute = !isPublicRoute && !isApiRoute;

  if (isProtectedRoute) {
    try {
      const supabase = createSupabaseServerInstance({
        headers: context.request.headers,
        cookies: context.cookies,
      });

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("[Middleware] Session error:", error);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/login?redirect=${encodeURIComponent(url.pathname)}`,
          },
        });
      }

      if (session?.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        context.locals.supabase = supabase as any;
        return next();
      }

      return new Response(null, {
        status: 302,
        headers: {
          Location: `/login?redirect=${encodeURIComponent(url.pathname)}`,
        },
      });
    } catch (error) {
      console.error("[Middleware] Error:", error);
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/login?redirect=${encodeURIComponent(url.pathname)}`,
        },
      });
    }
  }

  if (isApiRoute) {
    try {
      // Create SSR client for API routes (handles both token and cookie-based auth)
      const supabase = createSupabaseServerInstance({
        headers: context.request.headers,
        cookies: context.cookies,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context.locals.supabase = supabase as any;
    } catch (error) {
      console.error("[Middleware] Failed to initialize Supabase server client:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "Database service unavailable",
            code: "SERVICE_UNAVAILABLE",
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  return next();
};
