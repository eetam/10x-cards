import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Authentication
 * Handles login and logout operations
 */
export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Will add selectors when implementing auth tests
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
  }

  /**
   * Navigate to login page
   */
  async gotoLogin() {
    await this.page.goto("/login");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Perform login with credentials
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();

    // Wait for redirect to dashboard
    await this.page.waitForURL("/", { timeout: 10000 });
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Check if user is logged in by checking for logout button or user menu
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      // Check if dashboard or user-specific content is visible
      await this.page.waitForSelector('text="Szybkie akcje"', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
