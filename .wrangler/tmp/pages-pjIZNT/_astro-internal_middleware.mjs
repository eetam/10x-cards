globalThis.process ??= {}; globalThis.process.env ??= {};
import './chunks/astro-designed-error-pages_D3PPft0k.mjs';
import './chunks/astro/server_BEHOjCPm.mjs';
import { s as sequence } from './chunks/index_8PQ-Up8j.mjs';

const onRequest$2 = async (context, next) => {
  try {
    const { supabaseClient } = await import('./chunks/supabase.client_B0qiGyd_.mjs');
    context.locals.supabase = supabaseClient;
  } catch {
    context.locals.supabase = null;
  }
  const url = new URL(context.request.url);
  const PROTECTED_ROUTES = ["/generate"];
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => url.pathname.startsWith(route));
  if (isProtectedRoute) {
    {
      return next();
    }
  }
  return next();
};

const onRequest$1 = (context, next) => {
  if (context.isPrerendered) {
    context.locals.runtime ??= {
      env: process.env
    };
  }
  return next();
};

const onRequest = sequence(
	onRequest$1,
	onRequest$2
	
);

export { onRequest };
