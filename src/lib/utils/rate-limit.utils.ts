import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Rate limiting configuration
 */
const RATE_LIMITS = {
  generations_per_hour: 10,
  generations_per_day: 50,
  max_concurrent_generations: 3,
} as const;

/**
 * Rate limiting utility functions
 */
export const RateLimitUtils = {
  /**
   * Check if user has exceeded generation rate limits
   */
  async checkGenerationRateLimit(
    supabase: SupabaseClient,
    userId: string
  ): Promise<{ allowed: boolean; error: string | null; retryAfter?: number }> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Check hourly limit
      const { data: hourlyGenerations, error: hourlyError } = await supabase
        .from("generations")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", oneHourAgo.toISOString());

      if (hourlyError) {
        return { allowed: false, error: "Failed to check rate limits" };
      }

      if (hourlyGenerations && hourlyGenerations.length >= RATE_LIMITS.generations_per_hour) {
        const oldestGeneration = hourlyGenerations.reduce((oldest, current) => {
          return current.created_at < oldest.created_at ? current : oldest;
        }, hourlyGenerations[0]);

        const retryAfter = Math.ceil(
          (new Date(oldestGeneration.created_at).getTime() + 60 * 60 * 1000 - now.getTime()) / 1000
        );

        return {
          allowed: false,
          error: `Rate limit exceeded. Maximum ${RATE_LIMITS.generations_per_hour} generations per hour.`,
          retryAfter,
        };
      }

      // Check daily limit
      const { data: dailyGenerations, error: dailyError } = await supabase
        .from("generations")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", oneDayAgo.toISOString());

      if (dailyError) {
        return { allowed: false, error: "Failed to check rate limits" };
      }

      if (dailyGenerations && dailyGenerations.length >= RATE_LIMITS.generations_per_day) {
        return {
          allowed: false,
          error: `Daily limit exceeded. Maximum ${RATE_LIMITS.generations_per_day} generations per day.`,
        };
      }

      return { allowed: true, error: null };
    } catch (error) {
      return {
        allowed: false,
        error: error instanceof Error ? error.message : "Rate limit check failed",
      };
    }
  },

  /**
   * Check concurrent generation limit
   */
  async checkConcurrentGenerationLimit(
    supabase: SupabaseClient,
    userId: string
  ): Promise<{ allowed: boolean; error: string | null }> {
    try {
      // Check for generations created in the last 5 minutes (assuming they might still be processing)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const { data: recentGenerations, error } = await supabase
        .from("generations")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", fiveMinutesAgo.toISOString());

      if (error) {
        return { allowed: false, error: "Failed to check concurrent generation limit" };
      }

      if (recentGenerations && recentGenerations.length >= RATE_LIMITS.max_concurrent_generations) {
        return {
          allowed: false,
          error: `Too many concurrent generations. Maximum ${RATE_LIMITS.max_concurrent_generations} generations can be processed simultaneously.`,
        };
      }

      return { allowed: true, error: null };
    } catch (error) {
      return {
        allowed: false,
        error: error instanceof Error ? error.message : "Concurrent generation check failed",
      };
    }
  },

  /**
   * Get rate limit information for user
   */
  async getRateLimitInfo(
    supabase: SupabaseClient,
    userId: string
  ): Promise<{
    hourlyUsed: number;
    hourlyLimit: number;
    dailyUsed: number;
    dailyLimit: number;
    hourlyResetTime: string;
    dailyResetTime: string;
  }> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [hourlyResult, dailyResult] = await Promise.all([
      supabase.from("generations").select("id").eq("user_id", userId).gte("created_at", oneHourAgo.toISOString()),
      supabase.from("generations").select("id").eq("user_id", userId).gte("created_at", oneDayAgo.toISOString()),
    ]);

    const hourlyUsed = hourlyResult.data?.length || 0;
    const dailyUsed = dailyResult.data?.length || 0;

    return {
      hourlyUsed,
      hourlyLimit: RATE_LIMITS.generations_per_hour,
      dailyUsed,
      dailyLimit: RATE_LIMITS.generations_per_day,
      hourlyResetTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
      dailyResetTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };
  },
};
