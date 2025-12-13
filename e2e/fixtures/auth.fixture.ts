/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from "@playwright/test";
import { AuthPage } from "../pages/auth.page";
import { GenerationPage } from "../pages/generation.page";
import { ProposalsReviewPage } from "../pages/proposals-review.page";

/**
 * Extended test fixtures with authenticated user
 * Automatically logs in test user before each test
 */
interface AuthFixtures {
  authPage: AuthPage;
  generationPage: GenerationPage;
  proposalsReviewPage: ProposalsReviewPage;
}

export const test = base.extend<AuthFixtures>({
  authPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    await use(authPage);
  },

  generationPage: async ({ page }, use) => {
    const generationPage = new GenerationPage(page);
    await use(generationPage);
  },

  proposalsReviewPage: async ({ page }, use) => {
    const proposalsReviewPage = new ProposalsReviewPage(page);
    await use(proposalsReviewPage);
  },
});

/**
 * Setup authenticated session for tests
 * Logs in with test user credentials from environment
 */
export async function setupAuthenticatedSession(authPage: AuthPage) {
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
  }

  await authPage.gotoLogin();
  await authPage.login(email, password);

  // Verify login was successful
  const isLoggedIn = await authPage.isLoggedIn();
  if (!isLoggedIn) {
    throw new Error("Failed to authenticate test user");
  }
}

export { expect } from "@playwright/test";
