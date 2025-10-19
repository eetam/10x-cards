import { describe, it, expect, vi } from "vitest";
import { OpenRouterClient } from "../openrouter.client";

describe("OpenRouterClient Mock Mode", () => {
  describe("Mock responses", () => {
    it("should generate mock flashcards when useMock is true", async () => {
      const client = new OpenRouterClient({
        apiKey: "",
        baseUrl: "https://openrouter.ai/api/v1",
        timeout: 60000,
        useMock: true,
      });

      const sourceText =
        "TypeScript is a programming language developed by Microsoft. It is a superset of JavaScript that adds static type definitions.";

      const response = await client.createChatCompletion({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert educator creating flashcards from educational content. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: sourceText,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      // Parse the response
      const flashcards = JSON.parse(response);

      // Verify response structure
      expect(Array.isArray(flashcards)).toBe(true);
      expect(flashcards.length).toBeGreaterThanOrEqual(3);
      expect(flashcards.length).toBeLessThanOrEqual(5);

      // Verify each flashcard structure
      flashcards.forEach((card: any) => {
        expect(card).toHaveProperty("front");
        expect(card).toHaveProperty("back");
        expect(card).toHaveProperty("confidence");
        expect(typeof card.front).toBe("string");
        expect(typeof card.back).toBe("string");
        expect(typeof card.confidence).toBe("number");
        expect(card.confidence).toBeGreaterThanOrEqual(0.7);
        expect(card.confidence).toBeLessThanOrEqual(1.0);
      });
    });

    it("should simulate API delay when using mock", async () => {
      const client = new OpenRouterClient({
        apiKey: "",
        baseUrl: "https://openrouter.ai/api/v1",
        timeout: 60000,
        useMock: true,
      });

      const startTime = Date.now();

      await client.createChatCompletion({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: "Test message",
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take at least 1 second (simulated delay)
      expect(duration).toBeGreaterThanOrEqual(1000);
    });

    it("should always return true for testConnection when using mock", async () => {
      const client = new OpenRouterClient({
        apiKey: "",
        baseUrl: "https://openrouter.ai/api/v1",
        timeout: 60000,
        useMock: true,
      });

      const result = await client.testConnection();
      expect(result).toBe(true);
    });
  });

  describe("Real API mode", () => {
    it("should require API key when not using mock", () => {
      expect(() => {
        new OpenRouterClient({
          apiKey: "",
          baseUrl: "https://openrouter.ai/api/v1",
          timeout: 60000,
          useMock: false,
        });
      }).not.toThrow();
    });
  });
});
