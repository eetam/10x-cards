import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page Object Model for Proposals Review
 * Handles interaction with generated flashcard proposals
 */
export class ProposalsReviewPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get proposal card by index
   */
  getProposalCard(index: number): Locator {
    return this.page.getByTestId(`proposal-card-${index}`);
  }

  /**
   * Get proposal front text by index
   */
  getProposalFront(index: number): Locator {
    return this.page.getByTestId(`proposal-front-${index}`);
  }

  /**
   * Get proposal back text by index
   */
  getProposalBack(index: number): Locator {
    return this.page.getByTestId(`proposal-back-${index}`);
  }

  /**
   * Get accept button for proposal by index
   */
  getAcceptButton(index: number): Locator {
    return this.page.getByTestId(`proposal-accept-${index}`);
  }

  /**
   * Get edit button for proposal by index
   */
  getEditButton(index: number): Locator {
    return this.page.getByTestId(`proposal-edit-${index}`);
  }

  /**
   * Get reject button for proposal by index
   */
  getRejectButton(index: number): Locator {
    return this.page.getByTestId(`proposal-reject-${index}`);
  }

  /**
   * Get save all button
   */
  getSaveAllButton(): Locator {
    return this.page.getByTestId("save-all-button");
  }

  /**
   * Count visible proposal cards
   */
  async getProposalsCount(): Promise<number> {
    return await this.page.getByTestId(/proposal-card-\d+/).count();
  }

  /**
   * Accept proposal by index
   */
  async acceptProposal(index: number) {
    await this.getAcceptButton(index).click();
    // Wait for status change animation
    await this.page.waitForTimeout(300);
  }

  /**
   * Reject proposal by index
   */
  async rejectProposal(index: number) {
    await this.getRejectButton(index).click();
    // Wait for status change animation
    await this.page.waitForTimeout(300);
  }

  /**
   * Accept multiple proposals by indices
   */
  async acceptProposals(indices: number[]) {
    for (const index of indices) {
      await this.acceptProposal(index);
    }
  }

  /**
   * Save all accepted proposals
   */
  async saveAllAccepted() {
    const saveButton = this.getSaveAllButton();
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Wait for redirect to flashcards page
    await this.page.waitForURL("/flashcards", { timeout: 10000 });
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Check if save all button is enabled
   */
  async isSaveAllButtonEnabled(): Promise<boolean> {
    return await this.getSaveAllButton().isEnabled();
  }

  /**
   * Get save all button text (includes count)
   */
  async getSaveAllButtonText(): Promise<string | null> {
    return await this.getSaveAllButton().textContent();
  }
}
