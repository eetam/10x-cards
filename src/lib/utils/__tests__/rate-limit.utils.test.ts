import { describe, it, expect, vi, beforeEach } from "vitest";
import { RateLimitUtils } from "../rate-limit.utils";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock Supabase client
const createMockSupabase = () => {
  const mockQueryBuilder = {
    select: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn(),
    is: vi.fn(),
  };

  return {
    from: vi.fn(() => mockQueryBuilder),
  } as unknown as SupabaseClient;
};

describe("RateLimitUtils", () => {
  let mockSupabase: SupabaseClient;
  const userId = "user-123";

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("checkGenerationRateLimit", () => {
    it("should allow generation when under hourly limit", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({
          data: [{ id: "gen-1" }, { id: "gen-2" }],
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await RateLimitUtils.checkGenerationRateLimit(mockSupabase, userId);

      expect(result.allowed).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should deny generation when hourly limit exceeded", async () => {
      const mockGenerations = Array.from({ length: 10 }, (_, i) => ({
        id: `gen-${i}`,
        created_at: "2024-01-15T11:30:00Z",
      }));

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({
          data: mockGenerations,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await RateLimitUtils.checkGenerationRateLimit(mockSupabase, userId);

      expect(result.allowed).toBe(false);
      expect(result.error).toContain("Rate limit exceeded");
      expect(result.retryAfter).toBeDefined();
    });

    it("should deny generation when daily limit exceeded", async () => {
      const hourlyMockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({
          data: [{ id: "gen-1" }],
          error: null,
        }),
      };

      const dailyMockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({
          data: Array.from({ length: 50 }, (_, i) => ({ id: `gen-${i}` })),
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(hourlyMockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>)
        .mockReturnValueOnce(dailyMockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await RateLimitUtils.checkGenerationRateLimit(mockSupabase, userId);

      expect(result.allowed).toBe(false);
      expect(result.error).toContain("Daily limit exceeded");
    });

    it("should handle database errors gracefully", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await RateLimitUtils.checkGenerationRateLimit(mockSupabase, userId);

      expect(result.allowed).toBe(false);
      expect(result.error).toBe("Failed to check rate limits");
    });

    it("should handle exceptions", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockRejectedValue(new Error("Network error")),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await RateLimitUtils.checkGenerationRateLimit(mockSupabase, userId);

      expect(result.allowed).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("checkConcurrentGenerationLimit", () => {
    it("should allow generation when under concurrent limit", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({
          data: [{ id: "gen-1" }],
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await RateLimitUtils.checkConcurrentGenerationLimit(mockSupabase, userId);

      expect(result.allowed).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should deny generation when concurrent limit exceeded", async () => {
      const mockGenerations = Array.from({ length: 3 }, (_, i) => ({ id: `gen-${i}` }));

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({
          data: mockGenerations,
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await RateLimitUtils.checkConcurrentGenerationLimit(mockSupabase, userId);

      expect(result.allowed).toBe(false);
      expect(result.error).toContain("Zbyt wiele równoczesnych generacji");
    });

    it("should handle database errors", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await RateLimitUtils.checkConcurrentGenerationLimit(mockSupabase, userId);

      expect(result.allowed).toBe(false);
      expect(result.error).toBe("Failed to check concurrent generation limit");
    });
  });

  describe("getRateLimitInfo", () => {
    it("should return correct rate limit information", async () => {
      const hourlyMockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({
          data: Array.from({ length: 5 }, (_, i) => ({ id: `gen-${i}` })),
          error: null,
        }),
      };

      const dailyMockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({
          data: Array.from({ length: 20 }, (_, i) => ({ id: `gen-${i}` })),
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from)
        .mockReturnValueOnce(hourlyMockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>)
        .mockReturnValueOnce(dailyMockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await RateLimitUtils.getRateLimitInfo(mockSupabase, userId);

      expect(result.hourlyUsed).toBe(5);
      expect(result.hourlyLimit).toBe(10);
      expect(result.dailyUsed).toBe(20);
      expect(result.dailyLimit).toBe(50);
      expect(result.hourlyResetTime).toBeDefined();
      expect(result.dailyResetTime).toBeDefined();
    });

    it("should handle empty results", async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      vi.mocked(mockSupabase.from).mockReturnValue(mockQueryBuilder as unknown as ReturnType<SupabaseClient["from"]>);

      const result = await RateLimitUtils.getRateLimitInfo(mockSupabase, userId);

      expect(result.hourlyUsed).toBe(0);
      expect(result.dailyUsed).toBe(0);
    });
  });
});
