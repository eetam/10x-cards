import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Server-side Supabase client for API routes
 * Uses service role key to bypass RLS
 * Should ONLY be used in server-side API routes after proper authentication
 */

const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_KEY;

let serverSupabaseClient: ReturnType<typeof createClient<Database>> | null = null;

if (supabaseUrl && supabaseServiceRoleKey) {
  serverSupabaseClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
} else {
  if (typeof console !== "undefined" && import.meta.env.DEV) {
    console.warn("Server Supabase client not initialized. Missing environment variables:", {
      hasUrl: !!supabaseUrl,
      hasServiceRoleKey: !!supabaseServiceRoleKey,
    });
  }
}

/**
 * Get server-side Supabase client
 * Throws error if not initialized (missing env vars)
 */
export function getServerSupabaseClient() {
  if (!serverSupabaseClient) {
    throw new Error(
      "Server Supabase client not initialized. Please ensure SUPABASE_URL and SUPABASE_KEY are set in your environment variables."
    );
  }
  return serverSupabaseClient;
}

export { serverSupabaseClient };
