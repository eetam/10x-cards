import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

// Use PUBLIC_ variables (available on both server and client in Astro)
// Fallback to non-prefixed variables for backward compatibility
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing SUPABASE_URL environment variable. Please set PUBLIC_SUPABASE_URL (or SUPABASE_URL) in your .env file."
  );
}

if (!supabaseKey) {
  throw new Error(
    "Missing SUPABASE_KEY environment variable. Please set PUBLIC_SUPABASE_KEY (or SUPABASE_KEY) in your .env file."
  );
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseKey);
