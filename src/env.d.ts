/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
    }
  }
}

interface ImportMetaEnv {
  // Public variables (available on client-side) - optional
  // Used for JWT token retrieval and Supabase Auth features
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_KEY?: string;
  // Server-side variables (for API routes and middleware)
  readonly SUPABASE_URL?: string;
  readonly SUPABASE_KEY?: string;
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_USE_MOCK?: string;
  readonly DEFAULT_USER_ID?: string; // Server-side only, used by API endpoints
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
