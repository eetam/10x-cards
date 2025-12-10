globalThis.process ??= {}; globalThis.process.env ??= {};
import { E as EnvConfig, A as AuthUtils, R as ResponseUtils } from '../../chunks/auth.utils_D1pWbdx5.mjs';
import { F as FlashcardService } from '../../chunks/flashcard.service_Cyu9Xsk_.mjs';
import { G as GenerationService } from '../../chunks/generation.service_rl8g26CR.mjs';
import { o as objectType, l as coerce, p as enumType, k as stringType } from '../../chunks/astro/server_BEHOjCPm.mjs';
export { r as renderers } from '../../chunks/_@astro-renderers_D9WLdofW.mjs';

const prerender = false;
const ListFlashcardsQuerySchema = objectType({
  page: coerce.number().int().min(1).optional().default(1),
  limit: coerce.number().int().min(1).max(100).optional().default(25),
  sort: enumType(["createdAt", "updatedAt", "due"]).optional().default("createdAt"),
  order: enumType(["asc", "desc"]).optional().default("desc"),
  source: enumType(["ai-full", "ai-edited", "manual"]).optional(),
  state: coerce.number().int().min(0).max(3).optional()
});
const CreateFlashcardSchema = objectType({
  front: stringType().max(200, "Front must not exceed 200 characters").trim().min(1, "Front is required"),
  back: stringType().max(500, "Back must not exceed 500 characters").trim().min(1, "Back is required"),
  source: enumType(["ai-full", "ai-edited", "manual"], {
    errorMap: () => ({ message: "Source must be one of: ai-full, ai-edited, manual" })
  }),
  generationId: stringType().uuid("Invalid generation ID format").optional().nullable()
}).refine(
  (data) => {
    if ((data.source === "ai-full" || data.source === "ai-edited") && !data.generationId) {
      return false;
    }
    return true;
  },
  {
    message: "Generation ID is required for AI-generated flashcards",
    path: ["generationId"]
  }
).refine(
  (data) => {
    if (data.source === "manual" && data.generationId) {
      return false;
    }
    return true;
  },
  {
    message: "Generation ID should not be provided for manual flashcards",
    path: ["generationId"]
  }
);
const POST = async ({ request, locals }) => {
  try {
    const defaultUserId = EnvConfig.getDefaultUserId();
    let userId;
    if (defaultUserId) {
      userId = defaultUserId;
    }
    const body = await request.json();
    const validationResult = CreateFlashcardSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return ResponseUtils.createValidationErrorResponse(
        firstError?.message || "Invalid request data",
        firstError?.path.join(".") || "unknown"
      );
    }
    const { front, back, source, generationId } = validationResult.data;
    if (generationId) {
      const generationService = new GenerationService(locals.supabase);
      const { generation, error: fetchError } = await generationService.getGenerationById(generationId, userId);
      if (fetchError) {
        return ResponseUtils.createInternalErrorResponse(`Failed to verify generation: ${fetchError.message}`);
      }
      if (!generation) {
        return ResponseUtils.createErrorResponse("Generation not found", "NOT_FOUND", 404);
      }
    }
    const flashcardService = new FlashcardService(locals.supabase);
    const { exists: duplicateExists, error: duplicateError } = await flashcardService.checkDuplicate(
      userId,
      front,
      back
    );
    if (duplicateError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to check duplicates: ${duplicateError.message}`);
    }
    if (duplicateExists) {
      return ResponseUtils.createErrorResponse(
        "Flashcard with this content already exists",
        "DUPLICATE_FLASHCARD",
        409
      );
    }
    const command = {
      front,
      back,
      source,
      generationId: generationId || void 0
    };
    const { flashcard, error: createError } = await flashcardService.createFlashcard(userId, command);
    if (createError) {
      if (createError.message.includes("already exists")) {
        return ResponseUtils.createErrorResponse(
          "Flashcard with this content already exists",
          "DUPLICATE_FLASHCARD",
          409
        );
      }
      return ResponseUtils.createInternalErrorResponse(`Failed to create flashcard: ${createError.message}`);
    }
    if (!flashcard) {
      return ResponseUtils.createInternalErrorResponse("Failed to create flashcard: no data returned");
    }
    if (generationId && (source === "ai-full" || source === "ai-edited")) {
      const generationService = new GenerationService(locals.supabase);
      const { error: metricsError } = await generationService.incrementAcceptedCount(generationId, source);
      if (metricsError) {
      }
    }
    const response = {
      id: flashcard.id,
      user_id: flashcard.user_id,
      userId: flashcard.user_id,
      generation_id: flashcard.generation_id,
      generationId: flashcard.generation_id,
      front: flashcard.front,
      back: flashcard.back,
      source: flashcard.source,
      state: flashcard.state,
      due: flashcard.due,
      stability: flashcard.stability,
      difficulty: flashcard.difficulty,
      lapses: flashcard.lapses,
      created_at: flashcard.created_at,
      createdAt: flashcard.created_at,
      updated_at: flashcard.updated_at,
      updatedAt: flashcard.updated_at
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
    const validationResult = ListFlashcardsQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return ResponseUtils.createValidationErrorResponse(
        firstError?.message || "Invalid query parameters",
        firstError?.path.join(".") || "unknown"
      );
    }
    const { page, limit, sort, order, source, state } = validationResult.data;
    const flashcardService = new FlashcardService(locals.supabase);
    const {
      data,
      total,
      error: fetchError
    } = await flashcardService.listFlashcards(userId, {
      page,
      limit,
      sort,
      order,
      source,
      state: state !== void 0 ? state : void 0
    });
    if (fetchError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to fetch flashcards: ${fetchError.message}`);
    }
    const totalPages = Math.ceil(total / limit);
    const pagination = {
      page,
      limit,
      total,
      totalPages
    };
    const response = {
      data: data.map((flashcard) => ({
        id: flashcard.id,
        front: flashcard.front,
        back: flashcard.back,
        source: flashcard.source,
        state: flashcard.state,
        due: flashcard.due,
        created_at: flashcard.created_at,
        updated_at: flashcard.updated_at
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
