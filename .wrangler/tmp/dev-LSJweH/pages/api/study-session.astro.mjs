globalThis.process ??= {}; globalThis.process.env ??= {};
import { E as EnvConfig, A as AuthUtils, R as ResponseUtils } from '../../chunks/auth.utils_D1pWbdx5.mjs';
import { S as StudyService } from '../../chunks/study.service_CY3kkesv.mjs';
import { o as objectType, l as coerce } from '../../chunks/astro/server_BEHOjCPm.mjs';
export { r as renderers } from '../../chunks/_@astro-renderers_D9WLdofW.mjs';

const prerender = false;
const StudySessionQuerySchema = objectType({
  limit: coerce.number().int().min(1).max(100).optional().default(20)
});
const GET = async ({ request, locals }) => {
  try {
    const defaultUserId = EnvConfig.getDefaultUserId();
    let userId;
    if (defaultUserId) {
      userId = defaultUserId;
    }
    const url = new URL(request.url);
    const queryParams = {
      limit: url.searchParams.get("limit") || void 0
    };
    const validationResult = StudySessionQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return ResponseUtils.createValidationErrorResponse(
        validationResult.error.errors[0]?.message || "Invalid query parameters",
        validationResult.error.errors[0]?.path[0]?.toString()
      );
    }
    const { limit } = validationResult.data;
    const studyService = new StudyService(locals.supabase);
    const { cards, totalDue, error } = await studyService.getDueFlashcards(userId, limit);
    if (error) {
      return ResponseUtils.createInternalErrorResponse(`Failed to fetch study session: ${error.message}`);
    }
    const sessionId = crypto.randomUUID();
    const response = {
      sessionId,
      cards,
      totalDue,
      sessionStartedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return ResponseUtils.createSuccessResponse(response);
  } catch {
    return ResponseUtils.createInternalErrorResponse();
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
