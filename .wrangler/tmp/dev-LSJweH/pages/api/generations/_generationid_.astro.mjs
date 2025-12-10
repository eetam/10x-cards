globalThis.process ??= {}; globalThis.process.env ??= {};
import { E as EnvConfig, A as AuthUtils, R as ResponseUtils } from '../../../chunks/auth.utils_D1pWbdx5.mjs';
import { G as GenerationService } from '../../../chunks/generation.service_rl8g26CR.mjs';
import { k as stringType } from '../../../chunks/astro/server_BEHOjCPm.mjs';
export { r as renderers } from '../../../chunks/_@astro-renderers_D9WLdofW.mjs';

const prerender = false;
const GenerationIdSchema = stringType().uuid("Invalid generation ID format");
const GET = async ({ request, locals, params }) => {
  try {
    const defaultUserId = EnvConfig.getDefaultUserId();
    let userId;
    if (defaultUserId) {
      userId = defaultUserId;
    }
    const generationId = params.generationId;
    if (!generationId) {
      return ResponseUtils.createValidationErrorResponse("Generation ID is required", "generationId");
    }
    const validationResult = GenerationIdSchema.safeParse(generationId);
    if (!validationResult.success) {
      return ResponseUtils.createValidationErrorResponse("Invalid generation ID format", "generationId");
    }
    const validatedGenerationId = validationResult.data;
    const generationService = new GenerationService(locals.supabase);
    const { generation, error: fetchError } = await generationService.getGenerationById(validatedGenerationId, userId);
    if (fetchError) {
      return ResponseUtils.createInternalErrorResponse(`Failed to fetch generation: ${fetchError.message}`);
    }
    if (!generation) {
      return ResponseUtils.createErrorResponse("Generation not found", "NOT_FOUND", 404);
    }
    const generationDuration = generationService.convertIntervalToISO8601(generation.generation_duration);
    const responseData = {
      id: generation.id,
      user_id: generation.user_id,
      userId: generation.user_id,
      model: generation.model,
      generated_count: generation.generated_count,
      accepted_unedited_count: generation.accepted_unedited_count,
      acceptedUneditedCount: generation.accepted_unedited_count ?? 0,
      accepted_edited_count: generation.accepted_edited_count,
      acceptedEditedCount: generation.accepted_edited_count ?? 0,
      source_text_length: generation.source_text_length,
      sourceTextLength: generation.source_text_length,
      generation_duration: generation.generation_duration,
      generationDuration: generationDuration ?? "",
      created_at: generation.created_at,
      createdAt: generation.created_at
    };
    return ResponseUtils.createSuccessResponse(responseData, 200);
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
