import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

function runtimeEnv(name: string): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p: any = typeof process !== "undefined" ? (process as any) : undefined;
  const value = p?.env?.[name];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function resolveBrowserSupabaseConfig() {
  const url =
    runtimeEnv("PUBLIC_SUPABASE_URL") ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (import.meta.env as any).PUBLIC_SUPABASE_URL ||
    runtimeEnv("SUPABASE_URL") ||
    import.meta.env.SUPABASE_URL;

  const key =
    runtimeEnv("PUBLIC_SUPABASE_KEY") ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (import.meta.env as any).PUBLIC_SUPABASE_KEY ||
    runtimeEnv("SUPABASE_KEY") ||
    import.meta.env.SUPABASE_KEY;
  return { url, key };
}

// Create Supabase client only if both URL and key are available
// This prevents errors during module import if variables are not yet available
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

function initBrowserSupabaseClient(): ReturnType<typeof createClient<Database>> {
  if (supabaseClient) return supabaseClient;

  const { url, key } = resolveBrowserSupabaseConfig();

  if (!url || !key) {
    throw new Error(
      "Supabase client not initialized. Please ensure PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY are set."
    );
  }

  supabaseClient = createClient<Database>(url, key);
  return supabaseClient;
}

// Export a getter function that throws a helpful error if client is not available
export function getSupabaseClient() {
  return initBrowserSupabaseClient();
}

// Export the client directly for backward compatibility
// This will be null if variables are not available, but allows the app to load
export { supabaseClient };

/**
 * Cookie options for Supabase SSR
 * - secure: true only in production (HTTPS required)
 * - secure: false in development (localhost works without HTTPS)
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: import.meta.env.PROD, // false in dev (localhost), true in prod (HTTPS)
  httpOnly: true,
  sameSite: "lax" as const,
};

/**
 * Parse cookie header string into array of cookie objects
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Create a Supabase server client with SSR support (cookies)
 * This is required for server-side authentication checks in middleware and API routes
 *
 * NOTE: This creates a NEW instance every time (no singleton caching).
 * Each request should get its own client with fresh env and cookies.
 */
export function createSupabaseServerInstance(context: {
  headers: Headers;
  cookies: AstroCookies;
}): ReturnType<typeof createServerClient<Database>> {
  const url =
    runtimeEnv("SUPABASE_URL") ||
    import.meta.env.SUPABASE_URL ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (import.meta.env as any).PUBLIC_SUPABASE_URL;
  const key =
    runtimeEnv("PUBLIC_SUPABASE_KEY") ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (import.meta.env as any).PUBLIC_SUPABASE_KEY ||
    import.meta.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase URL and key are required. Please ensure SUPABASE_URL and SUPABASE_KEY (or PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY) are set in your environment variables."
    );
  }

  return createServerClient<Database>(url, key, {
    cookieOptions,
    cookies: {
      getAll() {
        const cookieHeader = context.headers.get("Cookie") ?? "";
        return parseCookieHeader(cookieHeader);
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          context.cookies.set(name, value, {
            ...options,
            secure: import.meta.env.PROD, // false in dev, true in prod
            httpOnly: true,
            sameSite: "lax",
            path: "/",
          });
        });
      },
    },
  });
}
