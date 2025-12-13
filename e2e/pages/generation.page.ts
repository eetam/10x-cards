import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Generation Flow
 * Handles interaction with flashcard generation from text
 */
export class GenerationPage {
  readonly page: Page;
  readonly sourceTextArea: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sourceTextArea = page.getByTestId("generation-source-text");
    this.submitButton = page.getByTestId("generation-submit-button");
    this.errorAlert = page.getByTestId("generation-error-alert");
  }

  /**
   * Navigate to generation page
   */
  async goto() {
    await this.page.goto("/generate");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Fill source text and submit generation
   */
  async generateFlashcards(text: string) {
    await this.sourceTextArea.fill(text);
    await this.submitButton.click();

    // Wait for redirect to generation review page
    await this.page.waitForURL(/\/generations\/[a-f0-9-]+/);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Check if generation form is visible
   */
  async isFormVisible() {
    return await this.sourceTextArea.isVisible();
  }

  /**
   * Check if submit button is enabled
   */
  async isSubmitEnabled() {
    return await this.submitButton.isEnabled();
  }

  /**
   * Get error message if present
   */
  async getErrorMessage() {
    if (await this.errorAlert.isVisible()) {
      return await this.errorAlert.textContent();
    }
    return null;
  }
}
