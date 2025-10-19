// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: node({
    mode: "standalone",
  }),
  env: {
    schema: {
      // Required environment variables
      SUPABASE_URL: envField.string({
        context: "server",
        access: "public",
      }),
      SUPABASE_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      OPENROUTER_API_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      OPENROUTER_USE_MOCK: envField.boolean({
        context: "server",
        access: "public",
        optional: true,
        default: false,
      }),
      DEFAULT_USER_ID: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
    },
  },
});
