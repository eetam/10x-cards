import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FlashcardService } from "../flashcard.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Flashcard } from "../../../types";

// Mock Supabase client
const createMockSupabase = () => {
  const mockQueryBuilder = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
  };

  return {
    from: vi.fn(() => mockQueryBuilder),
  } as unknown as SupabaseClient;
};

describe("FlashcardService", () => {
  let flashcardService: FlashcardService;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    flashcardService = new FlashcardService(mockSupabase);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listFlashcards", () => {
    it("should list flashcards with default pagination and sorting", async () => {
      const mockFlashcards: Pick<
        Flashcard,
        "id" | "front" | "back" | "source" | "state" | "due" | "created_at" | "updated_at"
      >[] = [
        {
          id: "card-1",
          front: "Question 1",
          back: "Answer 1",
          source: "manual",
          state: 0,
          due: "2024-01-01T00:00:00Z",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "card-2",
          front: "Question 2",
          back: "Answer 2",
          source: "ai-full",
          state: 1,
          due: "2024-01-02T00:00:00Z",
          created_at: "2024-01-02T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
        },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockFlashcards,
          count: 2,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await flashcardService.listFlashcards("user-123", {
        page: 1,
        limit: 25,
        sort: "createdAt",
        order: "desc",
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("id,front,back,source,state,due,created_at,updated_at", {
        count: "exact",
      });
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(mockQueryBuilder.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 24);
    });

    it("should apply source filter when provided", async () => {
      const mockFlashcards: Pick<
        Flashcard,
        "id" | "front" | "back" | "source" | "state" | "due" | "created_at" | "updated_at"
      >[] = [
        {
          id: "card-1",
          front: "Question 1",
          back: "Answer 1",
          source: "ai-full",
          state: 0,
          due: "2024-01-01T00:00:00Z",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockFlashcards,
          count: 1,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await flashcardService.listFlashcards("user-123", {
        page: 1,
        limit: 25,
        sort: "createdAt",
        order: "desc",
        source: "ai-full",
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].source).toBe("ai-full");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("source", "ai-full");
    });

    it("should apply state filter when provided", async () => {
      const mockFlashcards: Pick<
        Flashcard,
        "id" | "front" | "back" | "source" | "state" | "due" | "created_at" | "updated_at"
      >[] = [
        {
          id: "card-1",
          front: "Question 1",
          back: "Answer 1",
          source: "manual",
          state: 2,
          due: "2024-01-01T00:00:00Z",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockFlashcards,
          count: 1,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await flashcardService.listFlashcards("user-123", {
        page: 1,
        limit: 25,
        sort: "createdAt",
        order: "desc",
        state: 2,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].state).toBe(2);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("state", 2);
    });

    it("should apply both source and state filters", async () => {
      const mockFlashcards: Pick<
        Flashcard,
        "id" | "front" | "back" | "source" | "state" | "due" | "created_at" | "updated_at"
      >[] = [
        {
          id: "card-1",
          front: "Question 1",
          back: "Answer 1",
          source: "ai-edited",
          state: 1,
          due: "2024-01-01T00:00:00Z",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockFlashcards,
          count: 1,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await flashcardService.listFlashcards("user-123", {
        page: 1,
        limit: 25,
        sort: "createdAt",
        order: "desc",
        source: "ai-edited",
        state: 1,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].source).toBe("ai-edited");
      expect(result.data[0].state).toBe(1);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("source", "ai-edited");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("state", 1);
    });

    it("should sort by updatedAt in ascending order", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      await flashcardService.listFlashcards("user-123", {
        page: 1,
        limit: 25,
        sort: "updatedAt",
        order: "asc",
      });

      expect(mockQueryBuilder.order).toHaveBeenCalledWith("updated_at", { ascending: true });
    });

    it("should sort by due date", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      await flashcardService.listFlashcards("user-123", {
        page: 1,
        limit: 25,
        sort: "due",
        order: "desc",
      });

      expect(mockQueryBuilder.order).toHaveBeenCalledWith("due", { ascending: false });
    });

    it("should handle pagination correctly", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          count: 100,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      await flashcardService.listFlashcards("user-123", {
        page: 3,
        limit: 25,
        sort: "createdAt",
        order: "desc",
      });

      // Page 3, limit 25: range should be (3-1)*25 = 50 to 3*25-1 = 74
      expect(mockQueryBuilder.range).toHaveBeenCalledWith(50, 74);
    });

    it("should handle database errors", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          count: null,
          error: { message: "Database connection failed" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await flashcardService.listFlashcards("user-123", {
        page: 1,
        limit: 25,
        sort: "createdAt",
        order: "desc",
      });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain("Database error");
    });

    it("should handle empty result set", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await flashcardService.listFlashcards("user-123", {
        page: 1,
        limit: 25,
        sort: "createdAt",
        order: "desc",
      });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.error).toBeNull();
    });

    it("should handle unexpected errors", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockRejectedValue(new Error("Unexpected error")),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await flashcardService.listFlashcards("user-123", {
        page: 1,
        limit: 25,
        sort: "createdAt",
        order: "desc",
      });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe("getFlashcardById", () => {
    it("should return flashcard when found", async () => {
      const mockFlashcard: Flashcard = {
        id: "card-123",
        user_id: "user-123",
        generation_id: null,
        front: "Question",
        back: "Answer",
        source: "manual",
        state: 0,
        due: "2024-01-01T00:00:00Z",
        stability: 0,
        difficulty: 0,
        lapses: 0,
        review_history: [],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockFlashcard,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await flashcardService.getFlashcardById("card-123", "user-123");

      expect(result.flashcard).toEqual(mockFlashcard);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("*");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("id", "card-123");
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(mockQueryBuilder.single).toHaveBeenCalled();
    });

    it("should return null flashcard when not found (PGRST116)", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "No rows found" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await flashcardService.getFlashcardById("non-existent", "user-123");

      expect(result.flashcard).toBeNull();
      expect(result.error).toBeNull();
    });

    it("should return error for database errors other than PGRST116", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST001", message: "Database connection error" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await flashcardService.getFlashcardById("card-123", "user-123");

      expect(result.flashcard).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain("Database connection error");
    });

    it("should handle unexpected errors", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error("Unexpected error")),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await flashcardService.getFlashcardById("card-123", "user-123");

      expect(result.flashcard).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });
});
