// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  env: {
    schema: {
      // PUBLIC_ prefix variables for client-side Supabase client (optional)
      // Used for getting JWT tokens for API requests and Supabase Auth features
      PUBLIC_SUPABASE_URL: envField.string({
        context: "client",
        access: "public",
        optional: true, // Optional - API endpoints handle auth, but needed for JWT tokens
      }),
      PUBLIC_SUPABASE_KEY: envField.string({
        context: "client",
        access: "public", // Anon key is safe to expose to client
        optional: true, // Optional - API endpoints handle auth, but needed for JWT tokens
      }),
      // Server-side variables (for API routes and middleware)
      SUPABASE_URL: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      SUPABASE_KEY: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      OPENROUTER_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true, // Optional - only required for AI generation features
      }),
      OPENROUTER_USE_MOCK: envField.boolean({
        context: "server",
        access: "public",
        optional: true,
        default: false,
      }),
      // DEFAULT_USER_ID - server-side only (used by API endpoints)
      DEFAULT_USER_ID: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
    },
  },
});
