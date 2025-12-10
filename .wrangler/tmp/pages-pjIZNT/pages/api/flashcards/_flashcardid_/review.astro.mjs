globalThis.process ??= {}; globalThis.process.env ??= {};
import { E as EnvConfig, A as AuthUtils, R as ResponseUtils } from '../../../../chunks/auth.utils_D1pWbdx5.mjs';
import { S as StudyService } from '../../../../chunks/study.service_CY3kkesv.mjs';
import { k as stringType, o as objectType, n as numberType } from '../../../../chunks/astro/server_BEHOjCPm.mjs';
export { r as renderers } from '../../../../chunks/_@astro-renderers_D9WLdofW.mjs';

const prerender = false;
const FlashcardIdSchema = stringType().uuid("Invalid flashcard ID format");
const SubmitReviewSchema = objectType({
  rating: numberType().int().min(1, "Rating must be at least 1").max(4, "Rating must be at most 4"),
  responseTime: numberType().int().positive().optional()
});
const POST = async ({ request, locals, params }) => {
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
    const idValidation = FlashcardIdSchema.safeParse(flashcardId);
    if (!idValidation.success) {
      return ResponseUtils.createValidationErrorResponse("Invalid flashcard ID format", "flashcardId");
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return ResponseUtils.createValidationErrorResponse("Invalid JSON body");
    }
    const bodyValidation = SubmitReviewSchema.safeParse(body);
    if (!bodyValidation.success) {
      const firstError = bodyValidation.error.errors[0];
      return ResponseUtils.createValidationErrorResponse(
        firstError?.message || "Invalid request body",
        firstError?.path[0]?.toString()
      );
    }
    const { rating } = bodyValidation.data;
    const studyService = new StudyService(locals.supabase);
    const { data, error } = await studyService.submitReview(idValidation.data, userId, rating);
    if (error) {
      if (error.message === "Flashcard not found") {
        return ResponseUtils.createErrorResponse("Flashcard not found", "NOT_FOUND", 404);
      }
      return ResponseUtils.createInternalErrorResponse(`Failed to submit review: ${error.message}`);
    }
    if (!data) {
      return ResponseUtils.createErrorResponse("Flashcard not found", "NOT_FOUND", 404);
    }
    const response = {
      flashcardId: data.flashcardId,
      newState: data.newState,
      newDue: data.newDue,
      newStability: data.newStability,
      newDifficulty: data.newDifficulty,
      newLapses: data.newLapses
    };
    return ResponseUtils.createSuccessResponse(response);
  } catch {
    return ResponseUtils.createInternalErrorResponse();
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
