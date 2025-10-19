/**
 * Environment configuration utilities
 * Uses import.meta.env for Astro compatibility
 */
export const EnvConfig = {
  /**
   * Get OpenRouter API configuration
   */
  getOpenRouterConfig() {
    return {
      apiKey: import.meta.env.OPENROUTER_API_KEY,
      baseUrl: "https://openrouter.ai/api/v1",
      timeout: 60000,
      useMock: import.meta.env.OPENROUTER_USE_MOCK === "true",
    };
  },

  /**
   * Get Supabase configuration
   */
  getSupabaseConfig() {
    return {
      url: import.meta.env.SUPABASE_URL,
      key: import.meta.env.SUPABASE_KEY,
    };
  },

  /**
   * Get default user ID for testing
   */
  getDefaultUserId(): string | null {
    return import.meta.env.DEFAULT_USER_ID || null;
  },

  /**
   * Validate required environment variables
   */
  validateRequiredEnvVars(): { valid: boolean; missing: string[] } {
    const required = ["OPENROUTER_API_KEY", "SUPABASE_URL", "SUPABASE_KEY"];

    const missing = required.filter((key) => !import.meta.env[key]);

    return {
      valid: missing.length === 0,
      missing,
    };
  },
};
