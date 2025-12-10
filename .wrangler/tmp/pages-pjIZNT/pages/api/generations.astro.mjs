globalThis.process ??= {}; globalThis.process.env ??= {};
import { R as ResponseUtils, E as EnvConfig, A as AuthUtils } from '../../chunks/auth.utils_D1pWbdx5.mjs';
import { T as TextUtils, G as GenerationService } from '../../chunks/generation.service_rl8g26CR.mjs';
import { o as objectType, k as stringType, p as enumType, l as coerce } from '../../chunks/astro/server_BEHOjCPm.mjs';
export { r as renderers } from '../../chunks/_@astro-renderers_D9WLdofW.mjs';

const RATE_LIMITS = {
  generations_per_hour: 10,
  generations_per_day: 50,
  max_concurrent_generations: 3
};
const RateLimitUtils = {
  /**
   * Check if user has exceeded generation rate limits
   */
  async checkGenerationRateLimit(supabase, userId) {
    try {
      const now = /* @__PURE__ */ new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1e3);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
      const { data: hourlyGenerations, error: hourlyError } = await supabase.from("generations").select("id").eq("user_id", userId).gte("created_at", oneHourAgo.toISOString());
      if (hourlyError) {
        return { allowed: false, error: "Failed to check rate limits" };
      }
      if (hourlyGenerations && hourlyGenerations.length >= RATE_LIMITS.generations_per_hour) {
        const oldestGeneration = hourlyGenerations.reduce((oldest, current) => {
          return current.created_at < oldest.created_at ? current : oldest;
        }, hourlyGenerations[0]);
        const retryAfter = Math.ceil(
          (new Date(oldestGeneration.created_at).getTime() + 60 * 60 * 1e3 - now.getTime()) / 1e3
        );
        return {
          allowed: false,
          error: `Rate limit exceeded. Maximum ${RATE_LIMITS.generations_per_hour} generations per hour.`,
          retryAfter
        };
      }
      const { data: dailyGenerations, error: dailyError } = await supabase.from("generations").select("id").eq("user_id", userId).gte("created_at", oneDayAgo.toISOString());
      if (dailyError) {
        return { allowed: false, error: "Failed to check rate limits" };
      }
      if (dailyGenerations && dailyGenerations.length >= RATE_LIMITS.generations_per_day) {
        return {
          allowed: false,
          error: `Daily limit exceeded. Maximum ${RATE_LIMITS.generations_per_day} generations per day.`
        };
      }
      return { allowed: true, error: null };
    } catch (error) {
      return {
        allowed: false,
        error: error instanceof Error ? error.message : "Rate limit check failed"
      };
    }
  },
  /**
   * Check concurrent generation limit
   */
  async checkConcurrentGenerationLimit(supabase, userId) {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1e3);
      const { data: recentGenerations, error } = await supabase.from("generations").select("id").eq("user_id", userId).gte("created_at", fiveMinutesAgo.toISOString());
      if (error) {
        return { allowed: false, error: "Failed to check concurrent generation limit" };
      }
      if (recentGenerations && recentGenerations.length >= RATE_LIMITS.max_concurrent_generations) {
        return {
          allowed: false,
          error: `Too many concurrent generations. Maximum ${RATE_LIMITS.max_concurrent_generations} generations can be processed simultaneously.`
        };
      }
      return { allowed: true, error: null };
    } catch (error) {
      return {
        allowed: false,
        error: error instanceof Error ? error.message : "Concurrent generation check failed"
      };
    }
  },
  /**
   * Get rate limit information for user
   */
  async getRateLimitInfo(supabase, userId) {
    const now = /* @__PURE__ */ new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1e3);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
    const [hourlyResult, dailyResult] = await Promise.all([
      supabase.from("generations").select("id").eq("user_id", userId).gte("created_at", oneHourAgo.toISOString()),
      supabase.from("generations").select("id").eq("user_id", userId).gte("created_at", oneDayAgo.toISOString())
    ]);
    const hourlyUsed = hourlyResult.data?.length || 0;
    const dailyUsed = dailyResult.data?.length || 0;
    return {
      hourlyUsed,
      hourlyLimit: RATE_LIMITS.generations_per_hour,
      dailyUsed,
      dailyLimit: RATE_LIMITS.generations_per_day,
      hourlyResetTime: new Date(now.getTime() + 60 * 60 * 1e3).toISOString(),
      dailyResetTime: new Date(now.getTime() + 24 * 60 * 60 * 1e3).toISOString()
    };
  }
};

const prerender = false;
const CreateGenerationSchema = objectType({
  sourceText: stringType().min(1e3, "Source text must be at least 1000 characters").max(1e4, "Source text must not exceed 10000 characters").trim(),
  model: stringType().optional().default("openai/gpt-4o-mini")
  // Default model
});
const ListGenerationsQuerySchema = objectType({
  page: coerce.number().int().min(1).optional().default(1),
  limit: coerce.number().int().min(1).max(100).optional().default(25),
  sort: enumType(["createdAt", "model"]).optional().default("createdAt"),
  order: enumType(["asc", "desc"]).optional().default("desc")
});
const POST = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validationResult = CreateGenerationSchema.safeParse(body);
    if (!validationResult.success) {
      return ResponseUtils.createValidationErrorResponse(
        validationResult.error.errors[0]?.message || "Invalid request data",
        validationResult.error.errors[0]?.path.join(".") || "unknown"
      );
    }
    const { sourceText, model } = validationResult.data;
    const defaultUserId = EnvConfig.getDefaultUserId();
    let userId;
    if (defaultUserId) {
      userId = defaultUserId;
    }
    const {
      allowed: rateLimitAllowed,
      error: rateLimitError,
      retryAfter
    } = await RateLimitUtils.checkGenerationRateLimit(locals.supabase, userId);
    if (!rateLimitAllowed) {
      const status = retryAfter ? 429 : 403;
      const response2 = ResponseUtils.createErrorResponse(
        rateLimitError || "Rate limit exceeded",
        "RATE_LIMIT_EXCEEDED",
        status
      );
      if (retryAfter) {
        response2.headers.set("Retry-After", retryAfter.toString());
      }
      return response2;
    }
    const { allowed: concurrentAllowed, error: concurrentError } = await RateLimitUtils.checkConcurrentGenerationLimit(
      locals.supabase,
      userId
    );
    if (!concurrentAllowed) {
      return ResponseUtils.createErrorResponse(
        concurrentError || "Too many concurrent generations",
        "CONCURRENT_LIMIT_EXCEEDED",
        429
      );
    }
    const sanitizedText = TextUtils.sanitizeText(sourceText);
    const generationService = new GenerationService(locals.supabase);
    const { generationId, error: createError } = await generationService.createGeneration(userId, sanitizedText, model);
    if (createError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to create generation: ${createError.message}`);
    }
    const { proposals, error: generationError } = await generationService.generateFlashcards({
      generationId,
      sourceText: sanitizedText,
      model,
      userId
    });
    if (generationError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to generate flashcards: ${generationError.message}`);
    }
    const response = {
      generationId,
      proposals,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      duration: 0
      // Will be calculated by the service
    };
    return ResponseUtils.createSuccessResponse(response, 201);
  } catch {
    return ResponseUtils.createInternalErrorResponse();
  }
};
const GET = async ({ request, locals }) => {
  try {
    const defaultUserId = EnvConfig.getDefaultUserId();
    let userId;
    if (defaultUserId) {
      userId = defaultUserId;
    }
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validationResult = ListGenerationsQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return ResponseUtils.createValidationErrorResponse(
        firstError?.message || "Invalid query parameters",
        firstError?.path.join(".") || "unknown"
      );
    }
    const { page, limit, sort, order } = validationResult.data;
    const generationService = new GenerationService(locals.supabase);
    const {
      data,
      total,
      error: fetchError
    } = await generationService.listGenerations(userId, {
      page,
      limit,
      sort,
      order
    });
    if (fetchError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to fetch generations: ${fetchError.message}`);
    }
    const totalPages = Math.ceil(total / limit);
    const pagination = {
      page,
      limit,
      total,
      totalPages
    };
    const response = {
      data: data.map((generation) => ({
        id: generation.id,
        model: generation.model,
        generated_count: generation.generated_count,
        accepted_unedited_count: generation.accepted_unedited_count,
        accepted_edited_count: generation.accepted_edited_count,
        created_at: generation.created_at
      })),
      pagination
    };
    return ResponseUtils.createSuccessResponse(response, 200);
  } catch {
    return ResponseUtils.createInternalErrorResponse();
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
