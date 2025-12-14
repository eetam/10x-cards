import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Server-side Supabase client for API routes
 * Uses service role key to bypass RLS
 * Should ONLY be used in server-side API routes after proper authentication
 */

function runtimeEnv(name: string): string | undefined {
  // Prefer runtime env in Node dev/e2e (Playwright/webServer).
  // In Cloudflare/workers `process` is not available, so we fall back to import.meta.env.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p: any = typeof process !== "undefined" ? (process as any) : undefined;
  const value = p?.env?.[name];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function resolveServerSupabaseUrl() {
  return (
    runtimeEnv("SUPABASE_URL") ||
    import.meta.env.SUPABASE_URL ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (import.meta.env as any).PUBLIC_SUPABASE_URL
  );
}

function resolveServiceRoleKey() {
  return (
    runtimeEnv("SUPABASE_SERVICE_ROLE_KEY") ||
    runtimeEnv("SUPABASE_KEY") ||
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
    import.meta.env.SUPABASE_KEY
  );
}

let serverSupabaseClient: ReturnType<typeof createClient<Database>> | null = null;

function initServerSupabaseClient(): ReturnType<typeof createClient<Database>> {
  if (serverSupabaseClient) return serverSupabaseClient;

  const url = resolveServerSupabaseUrl();
  const key = resolveServiceRoleKey();

  if (!url || !key) {
    throw new Error(
      "Server Supabase client not initialized. Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or legacy SUPABASE_KEY) are set."
    );
  }

  serverSupabaseClient = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverSupabaseClient;
}

/**
 * Get server-side Supabase client
 * Throws error if not initialized (missing env vars)
 */
export function getServerSupabaseClient() {
  return initServerSupabaseClient();
}

export { serverSupabaseClient };
