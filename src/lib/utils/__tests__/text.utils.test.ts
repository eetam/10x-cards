import { describe, it, expect } from "vitest";
import { TextUtils } from "../text.utils";
import type { FlashcardProposal } from "../../types";

describe("TextUtils", () => {
  describe("generateTextHash", () => {
    it("should generate consistent hash for same text", () => {
      const text = "This is a test text for hashing";
      const hash1 = TextUtils.generateTextHash(text);
      const hash2 = TextUtils.generateTextHash(text);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex format
    });

    it("should generate different hashes for different texts", () => {
      const text1 = "First text";
      const text2 = "Second text";

      const hash1 = TextUtils.generateTextHash(text1);
      const hash2 = TextUtils.generateTextHash(text2);

      expect(hash1).not.toBe(hash2);
    });

    it("should handle empty string", () => {
      const hash = TextUtils.generateTextHash("");
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("sanitizeText", () => {
    it("should remove control characters", () => {
      const text = "Hello\x00World\x08Test";
      const sanitized = TextUtils.sanitizeText(text);

      expect(sanitized).toBe("HelloWorldTest");
    });

    it("should normalize whitespace", () => {
      const text = "Hello    world\n\n\t\tTest";
      const sanitized = TextUtils.sanitizeText(text);

      expect(sanitized).toBe("Hello world Test");
    });

    it("should trim text", () => {
      const text = "   Hello world   ";
      const sanitized = TextUtils.sanitizeText(text);

      expect(sanitized).toBe("Hello world");
    });

    it("should limit text length to 10000 characters", () => {
      const longText = "a".repeat(15000);
      const sanitized = TextUtils.sanitizeText(longText);

      expect(sanitized.length).toBe(10000);
    });
  });

  describe("validateFlashcardProposal", () => {
    it("should validate correct flashcard proposal", () => {
      const proposal: FlashcardProposal = {
        front: "What is TypeScript?",
        back: "TypeScript is a typed superset of JavaScript",
        confidence: 0.9,
      };

      expect(TextUtils.validateFlashcardProposal(proposal)).toBe(true);
    });

    it("should reject proposal with invalid front", () => {
      const proposal = {
        front: "", // Empty front
        back: "Valid back",
        confidence: 0.9,
      };

      expect(TextUtils.validateFlashcardProposal(proposal)).toBe(false);
    });

    it("should reject proposal with front too long", () => {
      const proposal = {
        front: "a".repeat(201), // Too long
        back: "Valid back",
        confidence: 0.9,
      };

      expect(TextUtils.validateFlashcardProposal(proposal)).toBe(false);
    });

    it("should reject proposal with invalid back", () => {
      const proposal = {
        front: "Valid front",
        back: "", // Empty back
        confidence: 0.9,
      };

      expect(TextUtils.validateFlashcardProposal(proposal)).toBe(false);
    });

    it("should reject proposal with back too long", () => {
      const proposal = {
        front: "Valid front",
        back: "a".repeat(501), // Too long
        confidence: 0.9,
      };

      expect(TextUtils.validateFlashcardProposal(proposal)).toBe(false);
    });

    it("should reject proposal with invalid confidence", () => {
      const proposal = {
        front: "Valid front",
        back: "Valid back",
        confidence: 1.5, // Invalid confidence
      };

      expect(TextUtils.validateFlashcardProposal(proposal)).toBe(false);
    });

    it("should reject null or non-object proposals", () => {
      expect(TextUtils.validateFlashcardProposal(null)).toBe(false);
      expect(TextUtils.validateFlashcardProposal(undefined)).toBe(false);
      expect(TextUtils.validateFlashcardProposal("string")).toBe(false);
      expect(TextUtils.validateFlashcardProposal(123)).toBe(false);
    });
  });

  describe("parseFlashcardProposals", () => {
    it("should parse valid JSON array", () => {
      const jsonResponse = JSON.stringify([
        {
          front: "What is React?",
          back: "React is a JavaScript library for building user interfaces",
          confidence: 0.95,
        },
        {
          front: "What is JSX?",
          back: "JSX is a syntax extension for JavaScript",
          confidence: 0.9,
        },
      ]);

      const proposals = TextUtils.parseFlashcardProposals(jsonResponse);

      expect(proposals).toHaveLength(2);
      expect(proposals[0].front).toBe("What is React?");
      expect(proposals[1].back).toBe("JSX is a syntax extension for JavaScript");
    });

    it("should parse JSON object with proposals array", () => {
      const jsonResponse = JSON.stringify({
        proposals: [
          {
            front: "Test question",
            back: "Test answer",
            confidence: 0.8,
          },
        ],
      });

      const proposals = TextUtils.parseFlashcardProposals(jsonResponse);

      expect(proposals).toHaveLength(1);
      expect(proposals[0].front).toBe("Test question");
    });

    it("should handle invalid JSON gracefully", () => {
      const invalidJson = "This is not valid JSON";
      const proposals = TextUtils.parseFlashcardProposals(invalidJson);

      expect(proposals).toHaveLength(0);
    });

    it("should filter out invalid proposals", () => {
      const jsonResponse = JSON.stringify([
        {
          front: "Valid question",
          back: "Valid answer",
          confidence: 0.9,
        },
        {
          front: "", // Invalid - empty front
          back: "Valid answer",
          confidence: 0.9,
        },
        {
          front: "Another valid question",
          back: "Another valid answer",
          confidence: 0.8,
        },
      ]);

      const proposals = TextUtils.parseFlashcardProposals(jsonResponse);

      expect(proposals).toHaveLength(2);
      expect(proposals.every((p) => p.front.length > 0)).toBe(true);
    });
  });

  describe("extractProposalsFromText", () => {
    it("should extract Q&A format", () => {
      const text =
        "Q: What is TypeScript?\nA: TypeScript is a typed superset of JavaScript\n\nQ: What is React?\nA: React is a JavaScript library";

      const proposals = TextUtils.extractProposalsFromText(text);

      expect(proposals).toHaveLength(2);
      expect(proposals[0].front).toBe("What is TypeScript?");
      expect(proposals[0].back).toBe("TypeScript is a typed superset of JavaScript");
      expect(proposals[0].confidence).toBe(0.8);
    });

    it("should extract Front/Back format", () => {
      const text =
        "Front: What is JavaScript?\nBack: JavaScript is a programming language\n\nFront: What is HTML?\nBack: HTML is a markup language";

      const proposals = TextUtils.extractProposalsFromText(text);

      expect(proposals).toHaveLength(2);
      expect(proposals[0].front).toBe("What is JavaScript?");
      expect(proposals[0].back).toBe("JavaScript is a programming language");
    });

    it("should extract Question/Answer format", () => {
      const text =
        "Question: What is CSS?\nAnswer: CSS is a stylesheet language\n\nQuestion: What is Node.js?\nAnswer: Node.js is a JavaScript runtime";

      const proposals = TextUtils.extractProposalsFromText(text);

      expect(proposals).toHaveLength(2);
      expect(proposals[0].front).toBe("What is CSS?");
      expect(proposals[0].back).toBe("CSS is a stylesheet language");
    });

    it("should handle text with no patterns", () => {
      const text = "This is just regular text with no Q&A patterns";

      const proposals = TextUtils.extractProposalsFromText(text);

      expect(proposals).toHaveLength(0);
    });

    it("should filter out proposals that are too long", () => {
      const text = `Q: ${"a".repeat(201)}\nA: Valid answer`;

      const proposals = TextUtils.extractProposalsFromText(text);

      expect(proposals).toHaveLength(0);
    });
  });
});
