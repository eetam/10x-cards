/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

/**
 * Global setup for Playwright E2E tests
 * Runs once before all tests start
 *
 * Responsibilities:
 * 1. Verify test database connection
 * 2. Apply migrations automatically if needed (using Supabase CLI)
 * 3. Check for leftover test data
 */
async function globalSetup() {
  console.log("\n=== Running Global Setup for E2E Tests ===");

  // Load test environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.PUBLIC_SUPABASE_KEY;
  const testUserId = process.env.E2E_USERNAME_ID;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials. Please ensure SUPABASE_URL and SUPABASE_KEY are set in .env.test");
  }

  console.log(`✓ Using test database: ${new URL(supabaseUrl).host}`);

  // Create Supabase client with anon key for verification
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Step 1: Check if database schema exists
  console.log("\n1. Checking database schema...");
  let schemaExists = false;
  try {
    const { error } = await supabase.from("generations").select("id").limit(1);
    if (error && error.code === "PGRST205") {
      schemaExists = false;
      console.log("⚠️  Database schema not found - will apply migrations");
    } else if (error) {
      throw new Error(`Database error: ${error.message}`);
    } else {
      schemaExists = true;
      console.log("✓ Database schema exists");
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("PGRST205")) {
      schemaExists = false;
      console.log("⚠️  Database schema not found - will apply migrations");
    } else {
      console.error("✗ Failed to check database schema");
      throw err;
    }
  }

  // Step 2: Apply migrations if needed
  if (!schemaExists) {
    console.log("\n2. Applying database migrations...");

    // Extract project ref from URL
    const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    const projectRef = projectRefMatch ? projectRefMatch[1] : null;

    if (!projectRef) {
      throw new Error(
        `Could not extract project reference from SUPABASE_URL: ${supabaseUrl}\n` +
          "Please ensure SUPABASE_URL is in format: https://<project-ref>.supabase.co"
      );
    }

    try {
      await applyMigrations(projectRef);
      console.log("✓ Migrations applied successfully");

      // Verify schema was created
      console.log("\n3. Verifying schema was created...");
      try {
        // Wait a bit for migrations to complete
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const { error } = await supabase.from("generations").select("id").limit(1);
        if (error) {
          throw new Error(`Schema verification failed: ${error.message}`);
        }
        console.log("✓ Schema verified");
      } catch (err) {
        console.error("✗ Schema verification failed");
        throw err;
      }
    } catch (err) {
      console.error("✗ Failed to apply migrations");
      if (err instanceof Error) {
        throw err;
      }
      throw new Error("Unknown error during migration");
    }
  } else {
    console.log("\n2. Skipping migrations (schema already exists)");
  }

  // Step 4: Check for pending data from previous runs
  if (testUserId) {
    console.log("\n4. Checking for leftover test data...");
    try {
      const { count: flashcardsCount } = await supabase
        .from("flashcards")
        .select("id", { count: "exact", head: true })
        .eq("user_id", testUserId);

      const { count: generationsCount } = await supabase
        .from("generations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", testUserId);

      if ((flashcardsCount || 0) > 0 || (generationsCount || 0) > 0) {
        console.log(
          `⚠️  Found ${flashcardsCount || 0} flashcards and ${generationsCount || 0} generations from previous runs`
        );
        console.log("   These will be cleaned up by global teardown after tests");
      } else {
        console.log("✓ No leftover test data found");
      }
    } catch {
      console.warn("⚠️  Could not check for leftover data");
    }
  }

  console.log("\n=== Global Setup Complete ===\n");
}

/**
 * Apply database migrations using Supabase CLI
 * Uses SUPABASE_ACCESS_TOKEN from .env.test (set once) or service role key to generate token
 */
async function applyMigrations(projectRef: string) {
  // Check if Supabase CLI is installed
  let cliAvailable = false;
  try {
    execSync("supabase --version", { stdio: "pipe" });
    cliAvailable = true;
  } catch {
    // CLI not available
  }

  // Use Supabase CLI with SUPABASE_ACCESS_TOKEN from .env.test
  // This is a one-time configuration - user adds token to .env.test once, then it works automatically
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

  if (cliAvailable) {
    if (accessToken) {
      // Use provided access token - this is the recommended approach
      await applyMigrationsViaCLI(projectRef, accessToken);
      return;
    }

    // Try to use CLI without token (may work if user is already logged in via 'supabase login')
    try {
      await applyMigrationsViaCLI(projectRef, "");
      return;
    } catch {
      throw new Error(
        "Supabase CLI requires authentication. Please add SUPABASE_ACCESS_TOKEN to .env.test.\n" +
          "Get it from: https://supabase.com/dashboard/account/tokens\n" +
          "\nThis is a one-time configuration - once set, migrations will run automatically."
      );
    }
  }

  // CLI not available
  throw new Error(
    "Supabase CLI is not installed. Please install it:\n" +
      "  npm install -g supabase\n" +
      "\nThen add SUPABASE_ACCESS_TOKEN to .env.test:\n" +
      "  Get it from: https://supabase.com/dashboard/account/tokens"
  );
}

/**
 * Apply migrations using Supabase CLI
 */
async function applyMigrationsViaCLI(projectRef: string, accessToken: string) {
  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  // Check if already linked
  const supabaseConfigPath = path.join(process.cwd(), ".supabase", "config.toml");
  let needsLinking = true;

  if (fs.existsSync(supabaseConfigPath)) {
    try {
      const configContent = fs.readFileSync(supabaseConfigPath, "utf-8");
      if (configContent.includes(`project_id = "${projectRef}"`)) {
        needsLinking = false;
        console.log("   Already linked to project");
      }
    } catch {
      // Assume we need to link
    }
  }

  // Link if needed
  if (needsLinking) {
    console.log(`   Linking to project: ${projectRef}...`);
    try {
      const env = accessToken ? { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken } : process.env;

      execSync(`supabase link --project-ref ${projectRef}`, {
        stdio: "inherit",
        cwd: process.cwd(),
        env,
      });
      console.log("   ✓ Linked to project");
    } catch {
      throw new Error(
        `Failed to link to project. Please run 'supabase login' once, or add SUPABASE_ACCESS_TOKEN to .env.test.`
      );
    }
  }

  // Apply migrations
  console.log("   Applying migrations...");
  try {
    const env = accessToken ? { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken } : process.env;

    execSync("supabase db push", {
      stdio: "inherit",
      cwd: process.cwd(),
      env,
    });
    console.log("   ✓ Migrations applied");
  } catch {
    throw new Error(
      "Failed to apply migrations. Please run 'supabase login' once, or add SUPABASE_ACCESS_TOKEN to .env.test."
    );
  }
}

export default globalSetup;
