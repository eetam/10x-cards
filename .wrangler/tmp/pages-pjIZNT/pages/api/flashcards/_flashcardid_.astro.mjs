globalThis.process ??= {}; globalThis.process.env ??= {};
import { E as EnvConfig, A as AuthUtils, R as ResponseUtils } from '../../../chunks/auth.utils_D1pWbdx5.mjs';
import { F as FlashcardService } from '../../../chunks/flashcard.service_Cyu9Xsk_.mjs';
import { k as stringType, o as objectType } from '../../../chunks/astro/server_BEHOjCPm.mjs';
export { r as renderers } from '../../../chunks/_@astro-renderers_D9WLdofW.mjs';

const prerender = false;
const FlashcardIdSchema = stringType().uuid("Invalid flashcard ID format");
const UpdateFlashcardSchema = objectType({
  front: stringType().max(200, "Front must not exceed 200 characters").trim().min(1, "Front is required"),
  back: stringType().max(500, "Back must not exceed 500 characters").trim().min(1, "Back is required")
});
const GET = async ({ request, locals, params }) => {
  try {
    const defaultUserId = EnvConfig.getDefaultUserId();
    let userId;
    if (defaultUserId) {
      userId = defaultUserId;
    }
    const flashcardId = params.flashcardId;
    if (!flashcardId) {
      return ResponseUtils.createValidationErrorResponse("Flashcard ID is required", "flashcardId");
    }
    const validationResult = FlashcardIdSchema.safeParse(flashcardId);
    if (!validationResult.success) {
      return ResponseUtils.createValidationErrorResponse("Invalid flashcard ID format", "flashcardId");
    }
    const validatedFlashcardId = validationResult.data;
    const flashcardService = new FlashcardService(locals.supabase);
    const { flashcard, error: fetchError } = await flashcardService.getFlashcardById(validatedFlashcardId, userId);
    if (fetchError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to fetch flashcard: ${fetchError.message}`);
    }
    if (!flashcard) {
      return ResponseUtils.createErrorResponse("Flashcard not found", "NOT_FOUND", 404);
    }
    const reviewHistoryArray = Array.isArray(flashcard.review_history) ? flashcard.review_history : [];
    const responseData = {
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
      review_history: flashcard.review_history,
      reviewHistory: reviewHistoryArray,
      created_at: flashcard.created_at,
      createdAt: flashcard.created_at,
      updated_at: flashcard.updated_at,
      updatedAt: flashcard.updated_at
    };
    return ResponseUtils.createSuccessResponse(responseData, 200);
  } catch {
    return ResponseUtils.createInternalErrorResponse();
  }
};
const PUT = async ({ request, locals, params }) => {
  try {
    const defaultUserId = EnvConfig.getDefaultUserId();
    let userId;
    if (defaultUserId) {
      userId = defaultUserId;
    }
    const flashcardId = params.flashcardId;
    if (!flashcardId) {
      return ResponseUtils.createValidationErrorResponse("Flashcard ID is required", "flashcardId");
    }
    const validationResult = FlashcardIdSchema.safeParse(flashcardId);
    if (!validationResult.success) {
      return ResponseUtils.createValidationErrorResponse("Invalid flashcard ID format", "flashcardId");
    }
    const validatedFlashcardId = validationResult.data;
    const body = await request.json();
    const bodyValidationResult = UpdateFlashcardSchema.safeParse(body);
    if (!bodyValidationResult.success) {
      const firstError = bodyValidationResult.error.errors[0];
      return ResponseUtils.createValidationErrorResponse(
        firstError?.message || "Invalid request data",
        firstError?.path.join(".") || "unknown"
      );
    }
    const { front, back } = bodyValidationResult.data;
    const flashcardService = new FlashcardService(locals.supabase);
    const { flashcard: existingFlashcard, error: fetchError } = await flashcardService.getFlashcardById(
      validatedFlashcardId,
      userId
    );
    if (fetchError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to fetch flashcard: ${fetchError.message}`);
    }
    if (!existingFlashcard) {
      return ResponseUtils.createErrorResponse("Flashcard not found", "NOT_FOUND", 404);
    }
    const { exists: duplicateExists, error: duplicateError } = await flashcardService.checkDuplicate(
      userId,
      front,
      back,
      validatedFlashcardId
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
    const { flashcard: updatedFlashcard, error: updateError } = await flashcardService.updateFlashcard(
      validatedFlashcardId,
      userId,
      { front, back }
    );
    if (updateError) {
      if (updateError.message.includes("already exists")) {
        return ResponseUtils.createErrorResponse(
          "Flashcard with this content already exists",
          "DUPLICATE_FLASHCARD",
          409
        );
      }
      return ResponseUtils.createInternalErrorResponse(`Failed to update flashcard: ${updateError.message}`);
    }
    if (!updatedFlashcard) {
      return ResponseUtils.createInternalErrorResponse("Failed to update flashcard: no data returned");
    }
    const responseData = {
      id: updatedFlashcard.id,
      user_id: updatedFlashcard.user_id,
      userId: updatedFlashcard.user_id,
      generation_id: updatedFlashcard.generation_id,
      generationId: updatedFlashcard.generation_id,
      front: updatedFlashcard.front,
      back: updatedFlashcard.back,
      source: updatedFlashcard.source,
      state: updatedFlashcard.state,
      due: updatedFlashcard.due,
      stability: updatedFlashcard.stability,
      difficulty: updatedFlashcard.difficulty,
      lapses: updatedFlashcard.lapses,
      created_at: updatedFlashcard.created_at,
      createdAt: updatedFlashcard.created_at,
      updated_at: updatedFlashcard.updated_at,
      updatedAt: updatedFlashcard.updated_at
    };
    return ResponseUtils.createSuccessResponse(responseData, 200);
  } catch {
    return ResponseUtils.createInternalErrorResponse();
  }
};
const DELETE = async ({ request, locals, params }) => {
  try {
    const defaultUserId = EnvConfig.getDefaultUserId();
    let userId;
    if (defaultUserId) {
      userId = defaultUserId;
    }
    const flashcardId = params.flashcardId;
    if (!flashcardId) {
      return ResponseUtils.createValidationErrorResponse("Flashcard ID is required", "flashcardId");
    }
    const validationResult = FlashcardIdSchema.safeParse(flashcardId);
    if (!validationResult.success) {
      return ResponseUtils.createValidationErrorResponse("Invalid flashcard ID format", "flashcardId");
    }
    const validatedFlashcardId = validationResult.data;
    const flashcardService = new FlashcardService(locals.supabase);
    const { flashcard, error: fetchError } = await flashcardService.getFlashcardById(validatedFlashcardId, userId);
    if (fetchError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to fetch flashcard: ${fetchError.message}`);
    }
    if (!flashcard) {
      return ResponseUtils.createErrorResponse("Flashcard not found", "NOT_FOUND", 404);
    }
    const { success, error: deleteError } = await flashcardService.deleteFlashcard(validatedFlashcardId, userId);
    if (deleteError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to delete flashcard: ${deleteError.message}`);
    }
    if (!success) {
      return ResponseUtils.createErrorResponse("Flashcard not found", "NOT_FOUND", 404);
    }
    return ResponseUtils.createSuccessResponse({ message: "Flashcard deleted successfully" }, 200);
  } catch {
    return ResponseUtils.createInternalErrorResponse();
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  GET,
  PUT,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
