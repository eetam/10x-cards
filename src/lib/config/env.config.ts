/**
 * Environment configuration utilities
 */
export const EnvConfig = {
  /**
   * Get OpenRouter API configuration
   */
  getOpenRouterConfig() {
    return {
      apiKey: process.env.OPENROUTER_API_KEY || "",
      baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      timeout: parseInt(process.env.OPENROUTER_TIMEOUT || "60000"),
    };
  },

  /**
   * Get rate limiting configuration
   */
  getRateLimitConfig() {
    return {
      generationsPerHour: parseInt(process.env.RATE_LIMIT_GENERATIONS_PER_HOUR || "10"),
      generationsPerDay: parseInt(process.env.RATE_LIMIT_GENERATIONS_PER_DAY || "50"),
      maxConcurrentGenerations: parseInt(process.env.RATE_LIMIT_MAX_CONCURRENT_GENERATIONS || "3"),
    };
  },

  /**
   * Get AI model configuration
   */
  getAIModelConfig() {
    return {
      defaultModel: process.env.DEFAULT_AI_MODEL || "openai/gpt-4o-mini",
      maxSourceTextLength: parseInt(process.env.MAX_SOURCE_TEXT_LENGTH || "10000"),
      minSourceTextLength: parseInt(process.env.MIN_SOURCE_TEXT_LENGTH || "1000"),
    };
  },

  /**
   * Get application configuration
   */
  getAppConfig() {
    return {
      nodeEnv: process.env.NODE_ENV || "development",
      port: parseInt(process.env.PORT || "4321"),
      logLevel: process.env.LOG_LEVEL || "info",
      enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === "true",
    };
  },

  /**
   * Get security configuration
   */
  getSecurityConfig() {
    return {
      corsOrigin: process.env.CORS_ORIGIN || "http://localhost:4321",
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:4321"],
    };
  },

  /**
   * Validate required environment variables
   */
  validateRequiredEnvVars(): { valid: boolean; missing: string[] } {
    const required = ["OPENROUTER_API_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY"];

    const missing = required.filter((key) => !process.env[key]);

    return {
      valid: missing.length === 0,
      missing,
    };
  },

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return process.env.NODE_ENV === "development";
  },

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  },
};
