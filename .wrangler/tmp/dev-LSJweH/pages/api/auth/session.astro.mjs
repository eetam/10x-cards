globalThis.process ??= {}; globalThis.process.env ??= {};
import { E as EnvConfig, R as ResponseUtils, A as AuthUtils } from '../../../chunks/auth.utils_D1pWbdx5.mjs';
export { r as renderers } from '../../../chunks/_@astro-renderers_D9WLdofW.mjs';

const prerender = false;
const GET = async ({ request, locals }) => {
  try {
    const defaultUserId = EnvConfig.getDefaultUserId();
    if (defaultUserId) {
      return ResponseUtils.createSuccessResponse({
        user: {
          id: defaultUserId,
          email: `test-${defaultUserId}@example.com`
        },
        isAuthenticated: true
      });
    }
    const authHeader = request.headers.get("authorization");
    const token = AuthUtils.extractBearerToken(authHeader);
    if (!token) {
      return ResponseUtils.createSuccessResponse({
        user: null,
        isAuthenticated: false
      });
    }
    if (!locals.supabase) {
      return ResponseUtils.createSuccessResponse({
        user: null,
        isAuthenticated: false
      });
    }
    const { user, error: authError } = await AuthUtils.verifyToken(locals.supabase, token);
    if (authError || !user) {
      return ResponseUtils.createSuccessResponse({
        user: null,
        isAuthenticated: false
      });
    }
    return ResponseUtils.createSuccessResponse({
      user: {
        id: user.id,
        email: user.email
      },
      isAuthenticated: true
    });
  } catch {
    return ResponseUtils.createSuccessResponse({
      user: null,
      isAuthenticated: false
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
