import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

// Use PUBLIC_ variables (available on both server and client in Astro)
// Fallback to non-prefixed variables for backward compatibility
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;

// When DEFAULT_USER_ID is set (dev/test mode), use service_role key to bypass RLS
// Otherwise use anon key for normal authentication flow
const defaultUserId = import.meta.env.DEFAULT_USER_ID;
const supabaseKey = defaultUserId
  ? import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_KEY
  : import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

// Create Supabase client only if both URL and key are available
// This prevents errors during module import if variables are not yet available
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

if (supabaseUrl && supabaseKey) {
  supabaseClient = createClient<Database>(supabaseUrl, supabaseKey);
} else {
  // Log warning instead of throwing error to allow app to load
  // The error will be caught when trying to use the client
  if (typeof console !== "undefined" && import.meta.env.DEV) {
    console.warn("Supabase client not initialized. Missing environment variables:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      url: supabaseUrl || "missing",
      key: supabaseKey ? "***" : "missing",
    });
  }
}

// Export a getter function that throws a helpful error if client is not available
export function getSupabaseClient() {
  if (!supabaseClient) {
    throw new Error(
      "Supabase client not initialized. Please ensure SUPABASE_URL and SUPABASE_KEY (or PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY) are set in your environment variables."
    );
  }
  return supabaseClient;
}

// Export the client directly for backward compatibility
// This will be null if variables are not available, but allows the app to load
export { supabaseClient };
