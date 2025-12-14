/* eslint-disable no-console */
import { cleanupTestData } from "./helpers/teardown";

async function globalTeardown() {
  console.log("\n=== Running Global Teardown ===");
  await cleanupTestData();
  console.log("=== Global Teardown Complete ===\n");
}

export default globalTeardown;
