import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StudyService } from "../study.service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Flashcard } from "../../../types";

// Mock Supabase client
const createMockSupabase = () => {
  const mockQueryBuilder = {
    select: vi.fn(),
    eq: vi.fn(),
    lte: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
    update: vi.fn(),
  };

  return {
    from: vi.fn(() => mockQueryBuilder),
  } as unknown as SupabaseClient;
};

describe("StudyService", () => {
  let studyService: StudyService;
  let mockSupabase: SupabaseClient;
  const userId = "user-123";

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    studyService = new StudyService(mockSupabase);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getDueFlashcards", () => {
    it("should return flashcards due for review", async () => {
      const mockFlashcards: Pick<Flashcard, "id" | "front" | "back" | "due" | "state">[] = [
        {
          id: "card-1",
          front: "Question 1",
          back: "Answer 1",
          due: new Date(Date.now() - 1000).toISOString(),
          state: 2,
        },
        {
          id: "card-2",
          front: "Question 2",
          back: "Answer 2",
          due: new Date(Date.now() - 2000).toISOString(),
          state: 2,
        },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockFlashcards,
          count: 2,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await studyService.getDueFlashcards(userId, 20);

      expect(result.cards).toHaveLength(2);
      expect(result.totalDue).toBe(2);
      expect(result.error).toBeNull();
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith("user_id", userId);
      expect(mockQueryBuilder.lte).toHaveBeenCalled();
      expect(mockQueryBuilder.order).toHaveBeenCalledWith("due", { ascending: true });
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(20);
    });

    it("should respect limit parameter", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      await studyService.getDueFlashcards(userId, 10);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });

    it("should return empty array when no flashcards are due", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await studyService.getDueFlashcards(userId, 20);

      expect(result.cards).toHaveLength(0);
      expect(result.totalDue).toBe(0);
      expect(result.error).toBeNull();
    });

    it("should handle database errors", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          count: null,
          error: { message: "Database error" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await studyService.getDueFlashcards(userId, 20);

      expect(result.cards).toHaveLength(0);
      expect(result.totalDue).toBe(0);
      expect(result.error).toBeInstanceOf(Error);
    });

    it("should handle unexpected errors", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockRejectedValue(new Error("Unexpected error")),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await studyService.getDueFlashcards(userId, 20);

      expect(result.cards).toHaveLength(0);
      expect(result.totalDue).toBe(0);
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe("submitReview", () => {
    it("should submit review and update flashcard", async () => {
      const flashcardId = "card-123";
      const rating = 3;

      const mockFlashcard: Flashcard = {
        id: flashcardId,
        user_id: userId,
        generation_id: null,
        front: "Question",
        back: "Answer",
        source: "manual",
        state: 0,
        due: new Date().toISOString(),
        stability: 1.0,
        difficulty: 0.3,
        lapses: 0,
        review_history: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock getFlashcardById - first call to from()
      const getFlashcardMockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockFlashcard,
          error: null,
        }),
      };

      // Mock update - second call to from() returns update builder
      const updateMockQueryBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // First call: get flashcard, second call: update flashcard
      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(getFlashcardMockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>)
        .mockReturnValueOnce(updateMockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await studyService.submitReview(flashcardId, userId, rating);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.flashcardId).toBe(flashcardId);
      expect(result.data?.newState).toBeDefined();
    });

    it("should return error when flashcard not found", async () => {
      const flashcardId = "non-existent";
      const rating = 3;

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "No rows found" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await studyService.submitReview(flashcardId, userId, rating);

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });

    it("should return error when flashcard belongs to different user", async () => {
      const flashcardId = "card-123";
      const rating = 3;
      const differentUserId = "user-456";

      const mockFlashcard: Flashcard = {
        id: flashcardId,
        user_id: userId,
        generation_id: null,
        front: "Question",
        back: "Answer",
        source: "manual",
        state: 0,
        due: new Date().toISOString(),
        stability: 1.0,
        difficulty: 0.3,
        lapses: 0,
        review_history: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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

      const result = await studyService.submitReview(flashcardId, differentUserId, rating);

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });

    it("should handle update errors", async () => {
      const flashcardId = "card-123";
      const rating = 3;

      const mockFlashcard: Flashcard = {
        id: flashcardId,
        user_id: userId,
        generation_id: null,
        front: "Question",
        back: "Answer",
        source: "manual",
        state: 0,
        due: new Date().toISOString(),
        stability: 1.0,
        difficulty: 0.3,
        lapses: 0,
        review_history: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const getFlashcardMockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockFlashcard,
          error: null,
        }),
      };

      const updateMockQueryBuilder = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Update failed" },
        }),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(getFlashcardMockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>)
        .mockReturnValueOnce(updateMockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await studyService.submitReview(flashcardId, userId, rating);

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe("getDueCount", () => {
    it("should return count of flashcards due for review", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({
          count: 5,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await studyService.getDueCount(userId);

      expect(result.count).toBe(5);
      expect(result.error).toBeNull();
    });

    it("should return 0 when no flashcards are due", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({
          count: 0,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await studyService.getDueCount(userId);

      expect(result.count).toBe(0);
      expect(result.error).toBeNull();
    });

    it("should handle database errors", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({
          count: null,
          error: { message: "Database error" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await studyService.getDueCount(userId);

      expect(result.count).toBe(0);
      expect(result.error).toBeInstanceOf(Error);
    });
  });
});
