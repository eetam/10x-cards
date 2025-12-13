import { cleanupTestData } from "./helpers/teardown";

/**
 * Global teardown for Playwright tests
 * Runs once after all tests complete
 * Cleans up test data from the database
 */
async function globalTeardown() {
  console.log("\n=== Running Global Teardown ===");
  await cleanupTestData();
  console.log("=== Global Teardown Complete ===\n");
}

export default globalTeardown;
