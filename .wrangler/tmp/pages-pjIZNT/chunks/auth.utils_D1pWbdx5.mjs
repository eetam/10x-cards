globalThis.process ??= {}; globalThis.process.env ??= {};
const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": undefined, "SSR": true};
const EnvConfig = {
  /**
   * Get OpenRouter API configuration
   */
  getOpenRouterConfig() {
    return {
      apiKey: "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",
      baseUrl: "https://openrouter.ai/api/v1",
      timeout: 6e4,
      useMock: true
    };
  },
  /**
   * Get Supabase configuration
   */
  getSupabaseConfig() {
    return {
      url: "http://127.0.0.1:54321",
      key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
    };
  },
  /**
   * Get default user ID for testing
   */
  getDefaultUserId() {
    return "5a3e0f7e-ac4f-498d-b625-aa6dc1ac36be";
  },
  /**
   * Validate required environment variables
   */
  validateRequiredEnvVars() {
    const required = ["OPENROUTER_API_KEY", "SUPABASE_URL", "SUPABASE_KEY"];
    const missing = required.filter((key) => !Object.assign(__vite_import_meta_env__, { SUPABASE_URL: "http://127.0.0.1:54321", SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU", OPENROUTER_API_KEY: "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", OPENROUTER_USE_MOCK: "true", DEFAULT_USER_ID: "5a3e0f7e-ac4f-498d-b625-aa6dc1ac36be" })[key]);
    return {
      valid: missing.length === 0,
      missing
    };
  }
};

const ResponseUtils = {
  /**
   * Create standardized error response
   */
  createErrorResponse(message, code, status, field) {
    const error = {
      message,
      code,
      field
    };
    return new Response(JSON.stringify({ error, success: false }), {
      status,
      headers: { "Content-Type": "application/json" }
    });
  },
  /**
   * Create standardized success response
   */
  createSuccessResponse(data, status = 200) {
    return new Response(JSON.stringify({ data, success: true }), {
      status,
      headers: { "Content-Type": "application/json" }
    });
  },
  /**
   * Create validation error response
   */
  createValidationErrorResponse(message, field) {
    return this.createErrorResponse(message, "VALIDATION_ERROR", 400, field);
  },
  /**
   * Create authentication error response
   */
  createAuthErrorResponse(message = "Authentication required") {
    return this.createErrorResponse(message, "UNAUTHORIZED", 401);
  },
  /**
   * Create internal server error response
   */
  createInternalErrorResponse(message = "Internal server error") {
    return this.createErrorResponse(message, "INTERNAL_ERROR", 500);
  }
};

const AuthUtils = {
  /**
   * Extract and validate Bearer token from Authorization header
   */
  extractBearerToken(authHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7);
  },
  /**
   * Verify JWT token with Supabase and return user
   */
  async verifyToken(supabase, token) {
    try {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser(token);
      if (error || !user) {
        return {
          user: null,
          error: {
            message: "Invalid or expired token",
            code: "UNAUTHORIZED"
          }
        };
      }
      return { user, error: null };
    } catch {
      return {
        user: null,
        error: {
          message: "Authentication verification failed",
          code: "AUTH_ERROR"
        }
      };
    }
  },
  /**
   * Check if user has permission to perform generation operations
   */
  async checkGenerationPermission(supabase, userId) {
    try {
      const { data: user, error } = await supabase.auth.admin.getUserById(userId);
      if (error || !user || !user.user.email_confirmed_at) {
        return {
          allowed: false,
          error: {
            message: "User account not verified",
            code: "ACCOUNT_NOT_VERIFIED"
          }
        };
      }
      return { allowed: true, error: null };
    } catch {
      return {
        allowed: false,
        error: {
          message: "Permission check failed",
          code: "PERMISSION_ERROR"
        }
      };
    }
  }
};

export { AuthUtils as A, EnvConfig as E, ResponseUtils as R };
