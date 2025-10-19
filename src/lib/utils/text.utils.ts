import { createHash } from "crypto";
import type { FlashcardProposal } from "../../types";

/**
 * Utility functions for text processing and validation
 */
export const TextUtils = {
  /**
   * Generate SHA-256 hash of source text for deduplication
   */
  generateTextHash(text: string): string {
    return createHash("sha256").update(text.trim()).digest("hex");
  },

  /**
   * Sanitize source text by removing potentially harmful characters
   */
  sanitizeText(text: string): string {
    return (
      text
        .trim()
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // Remove control characters
        .replace(/\s+/g, " ") // Normalize whitespace
        .substring(0, 10000)
    ); // Ensure max length
  },

  /**
   * Validate flashcard proposal structure
   */
  validateFlashcardProposal(proposal: unknown): proposal is FlashcardProposal {
    if (typeof proposal !== "object" || proposal === null) {
      return false;
    }

    const p = proposal as Record<string, unknown>;

    return (
      typeof p.front === "string" &&
      p.front.length > 0 &&
      p.front.length <= 200 &&
      typeof p.back === "string" &&
      p.back.length > 0 &&
      p.back.length <= 500 &&
      typeof p.confidence === "number" &&
      p.confidence >= 0 &&
      p.confidence <= 1
    );
  },

  /**
   * Parse AI response and extract flashcard proposals
   */
  parseFlashcardProposals(aiResponse: string): FlashcardProposal[] {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(aiResponse);

      if (Array.isArray(parsed)) {
        return parsed.filter(this.validateFlashcardProposal);
      }

      // If it's an object, look for common keys
      if (typeof parsed === "object") {
        const proposals = parsed.proposals || parsed.flashcards || parsed.cards || parsed.data;
        if (Array.isArray(proposals)) {
          return proposals.filter(this.validateFlashcardProposal);
        }
      }

      return [];
    } catch {
      // If JSON parsing fails, try to extract from text
      return this.extractProposalsFromText(aiResponse);
    }
  },

  /**
   * Extract flashcard proposals from unstructured text
   */
  extractProposalsFromText(text: string): FlashcardProposal[] {
    const proposals: FlashcardProposal[] = [];

    // Look for patterns like "Q: ... A: ..." or "Front: ... Back: ..."
    const patterns = [
      /Q:\s*(.+?)\s*A:\s*(.+?)(?=\n|$)/gi,
      /Front:\s*(.+?)\s*Back:\s*(.+?)(?=\n|$)/gi,
      /Question:\s*(.+?)\s*Answer:\s*(.+?)(?=\n|$)/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const front = match[1].trim();
        const back = match[2].trim();

        if (front.length > 0 && front.length <= 200 && back.length > 0 && back.length <= 500) {
          proposals.push({
            front,
            back,
            confidence: 0.8, // Default confidence for extracted proposals
          });
        }
      }
    }

    return proposals;
  },
};
