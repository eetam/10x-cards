import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GenerationService } from "../generation.service";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
} as unknown as SupabaseClient;

// Mock OpenRouter client
vi.mock("../openrouter.client", () => ({
  createOpenRouterClient: vi.fn(() => ({
    createChatCompletion: vi.fn(),
  })),
}));

describe("GenerationService Integration Tests", () => {
  let generationService: GenerationService;

  beforeEach(() => {
    generationService = new GenerationService(mockSupabase);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createGeneration", () => {
    it("should create generation record successfully", async () => {
      const mockGenerationId = "gen-123";
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: mockGenerationId },
            error: null,
          }),
        })),
      }));

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await generationService.createGeneration(
        "user-123",
        "This is a test source text for generation",
        "openai/gpt-4o-mini"
      );

      expect(result.generationId).toBe(mockGenerationId);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith("generations");
    });

    it("should handle database error when creating generation", async () => {
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Database connection failed" },
          }),
        })),
      }));

      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await generationService.createGeneration("user-123", "Test text", "openai/gpt-4o-mini");

      expect(result.generationId).toBe("");
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain("Database error");
    });
  });

  describe("generateFlashcards", () => {
    it("should generate flashcards successfully", async () => {
      // Mock successful AI response
      const mockAIResponse = JSON.stringify([
        {
          front: "What is TypeScript?",
          back: "TypeScript is a typed superset of JavaScript",
          confidence: 0.95,
        },
        {
          front: "What is React?",
          back: "React is a JavaScript library for building user interfaces",
          confidence: 0.9,
        },
      ]);

      const { createOpenRouterClient } = await import("../openrouter.client");
      const mockClient = {
        createChatCompletion: vi.fn().mockResolvedValue(mockAIResponse),
      };
      vi.mocked(createOpenRouterClient).mockReturnValue(
        mockClient as unknown as ReturnType<typeof createOpenRouterClient>
      );

      // Mock database update
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }));
      vi.mocked(mockSupabase.from).mockReturnValue({
        update: mockUpdate,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      const command = {
        generationId: "gen-123",
        sourceText: "This is a comprehensive text about web development technologies including TypeScript and React.",
        model: "openai/gpt-4o-mini",
      };

      const result = await generationService.generateFlashcards(command);

      expect(result.proposals).toHaveLength(2);
      expect(result.proposals[0].front).toBe("What is TypeScript?");
      expect(result.proposals[1].back).toBe("React is a JavaScript library for building user interfaces");
      expect(result.error).toBeNull();
    });

    it("should handle AI service error", async () => {
      const { createOpenRouterClient } = await import("../openrouter.client");
      const mockClient = {
        createChatCompletion: vi.fn().mockRejectedValue(new Error("AI service unavailable")),
      };
      vi.mocked(createOpenRouterClient).mockReturnValue(
        mockClient as unknown as ReturnType<typeof createOpenRouterClient>
      );

      // Mock error logging
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      const command = {
        generationId: "gen-123",
        sourceText: "Test text",
        model: "openai/gpt-4o-mini",
      };

      const result = await generationService.generateFlashcards(command);

      expect(result.proposals).toHaveLength(0);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain("AI service error");
    });

    it("should handle invalid AI response", async () => {
      const { createOpenRouterClient } = await import("../openrouter.client");
      const mockClient = {
        createChatCompletion: vi.fn().mockResolvedValue("Invalid JSON response"),
      };
      vi.mocked(createOpenRouterClient).mockReturnValue(
        mockClient as unknown as ReturnType<typeof createOpenRouterClient>
      );

      const command = {
        generationId: "gen-123",
        sourceText: "Test text",
        model: "openai/gpt-4o-mini",
      };

      const result = await generationService.generateFlashcards(command);

      expect(result.proposals).toHaveLength(0);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain("No valid flashcard proposals generated");
    });
  });

  describe("logGenerationError", () => {
    it("should log generation error successfully", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      await generationService.logGenerationError(
        "user-123",
        "openai/gpt-4o-mini",
        "Test source text",
        "AI_ERROR",
        "AI service returned invalid response"
      );

      expect(mockSupabase.from).toHaveBeenCalledWith("generation_error_logs");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-123",
          model: "openai/gpt-4o-mini",
          error_code: "AI_ERROR",
          error_message: "AI service returned invalid response",
        })
      );
    });

    it("should handle error logging failure gracefully", async () => {
      // Set development environment for console.error to be called
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
        // Mock implementation
      });

      const mockInsert = vi.fn().mockRejectedValue(new Error("Database error"));
      vi.mocked(mockSupabase.from).mockReturnValue({
        insert: mockInsert,
      } as unknown as ReturnType<SupabaseClient["from"]>);

      // Should not throw
      await expect(
        generationService.logGenerationError("user-123", "openai/gpt-4o-mini", "Test text", "ERROR", "Test error")
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith("Failed to log generation error:", expect.any(Error));

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });
});
