#!/usr/bin/env node
/* eslint-disable no-undef, no-console */

/**
 * Setup script for E2E test database
 *
 * This script helps configure the test database by:
 * 1. Linking to the test Supabase project
 * 2. Applying migrations
 *
 * Usage:
 *   npm run test:e2e:setup <test-project-ref>
 *
 * Example:
 *   npm run test:e2e:setup awcxsbfrwqddcwdcnicp
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Parse command line arguments
const projectRef = process.argv[2];

if (!projectRef) {
  console.error("\n❌ Error: Test project reference is required\n");
  console.log("Usage: npm run test:e2e:setup <test-project-ref>");
  console.log("\nExample:");
  console.log("  npm run test:e2e:setup awcxsbfrwqddcwdcnicp");
  console.log("\nYou can find your project reference in Supabase Dashboard:");
  console.log("  Settings → General → Reference ID");
  process.exit(1);
}

console.log("\n=== Setting up E2E Test Database ===\n");
console.log(`Test project reference: ${projectRef}`);

// Check if Supabase CLI is installed
try {
  execSync("supabase --version", { stdio: "pipe" });
  console.log("✓ Supabase CLI is installed");
} catch {
  console.error("\n❌ Error: Supabase CLI is not installed");
  console.log("\nPlease install it first:");
  console.log("  npm install -g supabase");
  console.log("\nOr visit: https://supabase.com/docs/guides/cli");
  process.exit(1);
}

// Check if .env.test exists
const envTestPath = path.join(process.cwd(), ".env.test");
if (!fs.existsSync(envTestPath)) {
  console.error("\n❌ Error: .env.test file not found");
  console.log("\nPlease create .env.test from .env.test.example:");
  console.log("  cp .env.test.example .env.test");
  process.exit(1);
}

console.log("✓ .env.test file found");

// Step 1: Link to test project
console.log("\n1. Linking to test project...");
try {
  execSync(`supabase link --project-ref ${projectRef}`, {
    stdio: "inherit",
  });
  console.log("✓ Linked to test project");
} catch {
  console.error("\n❌ Error: Failed to link to test project");
  console.log("\nMake sure you:");
  console.log("  1. Are logged in: supabase login");
  console.log("  2. Have access to the project");
  console.log("  3. Provided correct project reference");
  process.exit(1);
}

// Step 2: Apply migrations
console.log("\n2. Applying database migrations...");
try {
  execSync("supabase db push", {
    stdio: "inherit",
  });
  console.log("✓ Migrations applied successfully");
} catch {
  console.error("\n❌ Error: Failed to apply migrations");
  console.log("\nPlease check:");
  console.log("  1. Database is accessible");
  console.log("  2. Migration files are valid");
  console.log("  3. You have sufficient permissions");
  process.exit(1);
}

console.log("\n=== Test Database Setup Complete ===\n");
console.log("Next steps:");
console.log("  1. Verify test user exists in Supabase Dashboard:");
console.log("     Authentication → Users");
console.log("     Email: test-user@test.com (from .env.test)");
console.log("  2. Run tests: npm run test:e2e");
console.log("");
