import { test, expect, setupAuthenticatedSession } from "./fixtures/auth.fixture";
import { SAMPLE_TEXT_JAVASCRIPT, isTextValidForGeneration } from "./helpers/test-data";
import { cleanupTestData } from "./helpers/teardown";

/**
 * E2E Tests for Flashcard Generation Flow
 * Tests US-005: Generowanie propozycji fiszek z tekstu
 * Tests US-006: Przeglądanie i akceptacja propozycji
 */

test.describe("Flashcard Generation Flow", () => {
  test.beforeEach(async ({ authPage }) => {
    // Setup: Login with test user
    await setupAuthenticatedSession(authPage);
  });

  test.afterEach(async () => {
    // Clean up test data after each test to avoid duplicates in next test
    await cleanupTestData();
  });

  test("US-005: Should generate flashcard proposals from source text", async ({ generationPage }) => {
    // GIVEN: User is on generation page
    await generationPage.goto();
    expect(await generationPage.isFormVisible()).toBe(true);

    // WHEN: User pastes valid text (1000-10000 characters)
    expect(isTextValidForGeneration(SAMPLE_TEXT_JAVASCRIPT)).toBe(true);

    // AND: Submits generation form
    await generationPage.generateFlashcards(SAMPLE_TEXT_JAVASCRIPT);

    // THEN: User is redirected to generation review page
    expect(generationPage.page.url()).toMatch(/\/generations\/[a-f0-9-]+/);

    // AND: No error is displayed
    const errorMessage = await generationPage.getErrorMessage();
    expect(errorMessage).toBeNull();
  });

  test("US-006: Should accept and save flashcard proposals", async ({ generationPage, proposalsReviewPage }) => {
    // GIVEN: User has generated flashcard proposals
    await generationPage.goto();
    await generationPage.generateFlashcards(SAMPLE_TEXT_JAVASCRIPT);

    // THEN: Proposals are displayed
    const proposalsCount = await proposalsReviewPage.getProposalsCount();
    expect(proposalsCount).toBeGreaterThan(0);

    // WHEN: User accepts first two proposals
    await proposalsReviewPage.acceptProposals([0, 1]);

    // THEN: Save button is enabled and shows correct count
    expect(await proposalsReviewPage.isSaveAllButtonEnabled()).toBe(true);
    const saveButtonText = await proposalsReviewPage.getSaveAllButtonText();
    expect(saveButtonText).toContain("(2)");

    // WHEN: User clicks save all
    await proposalsReviewPage.saveAllAccepted();

    // THEN: User is redirected to flashcards page
    expect(proposalsReviewPage.page.url()).toContain("/flashcards");
  });

  test("US-006: Should reject flashcard proposals", async ({ generationPage, proposalsReviewPage }) => {
    // GIVEN: User has generated flashcard proposals
    await generationPage.goto();
    await generationPage.generateFlashcards(SAMPLE_TEXT_JAVASCRIPT);

    const proposalsCount = await proposalsReviewPage.getProposalsCount();
    expect(proposalsCount).toBeGreaterThan(0);

    // WHEN: User rejects first proposal
    await proposalsReviewPage.rejectProposal(0);

    // THEN: Rejected proposal is not counted in save button
    const saveButtonText = await proposalsReviewPage.getSaveAllButtonText();
    expect(saveButtonText).not.toContain("(1)");
  });

  test("US-006: Should handle mixed acceptance and rejection", async ({ generationPage, proposalsReviewPage }) => {
    // GIVEN: User has generated flashcard proposals
    await generationPage.goto();
    await generationPage.generateFlashcards(SAMPLE_TEXT_JAVASCRIPT);

    const proposalsCount = await proposalsReviewPage.getProposalsCount();
    expect(proposalsCount).toBeGreaterThan(2);

    // WHEN: User accepts some and rejects others
    await proposalsReviewPage.acceptProposal(0);
    await proposalsReviewPage.rejectProposal(1);
    await proposalsReviewPage.acceptProposal(2);

    // THEN: Save button shows correct count (only accepted)
    const saveButtonText = await proposalsReviewPage.getSaveAllButtonText();
    expect(saveButtonText).toContain("(2)");

    // WHEN: User saves accepted proposals
    await proposalsReviewPage.saveAllAccepted();

    // THEN: User is redirected to flashcards
    expect(proposalsReviewPage.page.url()).toContain("/flashcards");
  });
});
