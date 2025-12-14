import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test"), override: true });

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",

  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npx astro dev --mode test --port 4321",
    url: "http://localhost:4321",
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: Object.fromEntries(Object.entries(process.env).filter(([, v]) => typeof v === "string")) as Record<
      string,
      string
    >,
  },
});
