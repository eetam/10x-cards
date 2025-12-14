// @ts-check
/* eslint-disable no-undef */
import { defineConfig, envField } from "astro/config";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// Load .env.test with override=true for E2E tests to ensure cloud database is used
const envTestPath = path.resolve(process.cwd(), ".env.test");
if (fs.existsSync(envTestPath)) {
  const envTestConfig = dotenv.config({ path: envTestPath, override: true });
  const parsed = envTestConfig.parsed;
  if (parsed) {
    for (const [key, value] of Object.entries(parsed)) {
      if (value !== undefined) {
        process.env[key] = value;
      }
    }
  }
}

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 4321 },
  vite: {
    plugins: [tailwindcss()],
    ...(fs.existsSync(envTestPath)
      ? {
          define: {
            "import.meta.env.SUPABASE_URL": JSON.stringify(process.env.SUPABASE_URL),
            "import.meta.env.PUBLIC_SUPABASE_URL": JSON.stringify(process.env.PUBLIC_SUPABASE_URL),
            "import.meta.env.PUBLIC_SUPABASE_KEY": JSON.stringify(process.env.PUBLIC_SUPABASE_KEY),
            "import.meta.env.SUPABASE_KEY": JSON.stringify(process.env.SUPABASE_KEY),
            "import.meta.env.OPENROUTER_USE_MOCK": JSON.stringify(process.env.OPENROUTER_USE_MOCK),
            "import.meta.env.OPENROUTER_API_KEY": JSON.stringify(process.env.OPENROUTER_API_KEY),
          },
        }
      : {}),
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: !fs.existsSync(envTestPath),
    },
  }),
  env: {
    schema: {
      PUBLIC_SUPABASE_URL: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_SUPABASE_KEY: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      SUPABASE_URL: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      SUPABASE_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      OPENROUTER_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
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
