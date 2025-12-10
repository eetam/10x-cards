globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, q as renderComponent, r as renderTemplate } from '../chunks/astro/server_BEHOjCPm.mjs';
import { j as jsxRuntimeExports, B as Button, e as apiClient, $ as $$Layout } from '../chunks/client_DXxObFE8.mjs';
import { R as React, a as reactExports } from '../chunks/_@astro-renderers_D9WLdofW.mjs';
export { r as renderers } from '../chunks/_@astro-renderers_D9WLdofW.mjs';
import { Q as QueryClient, a as QueryClientProvider } from '../chunks/QueryClientProvider_Bwd_EYNw.mjs';

function DashboardHero() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-4 mb-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text", children: "10xCards" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto", children: "Aplikacja do szybkiego tworzenia fiszek edukacyjnych z wykorzystaniem AI. Ucz się efektywnie metodą powtórek interwałowych." })
  ] });
}

function PrimaryActionButton({ label, href, icon, disabled, variant = "default" }) {
  if (disabled) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant, size: "lg", disabled: true, className: "w-full", children: [
      icon && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mr-2", children: icon }),
      label
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant, size: "lg", asChild: true, className: "w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href, children: [
    icon && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mr-2", children: icon }),
    label
  ] }) });
}

function DashboardActions({ isAuthenticated }) {
  const getRedirectUrl = (path) => {
    if (isAuthenticated) {
      return path;
    }
    return `/login?redirect=${encodeURIComponent(path)}`;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 mb-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-semibold", children: "Szybkie akcje" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryActionButton, { label: "Generuj fiszki", href: getRedirectUrl("/generate"), disabled: !isAuthenticated }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryActionButton, { label: "Moje fiszki", href: getRedirectUrl("/flashcards"), disabled: !isAuthenticated }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PrimaryActionButton, { label: "Rozpocznij naukę", href: getRedirectUrl("/study"), disabled: !isAuthenticated })
    ] })
  ] });
}

function DashboardAuthLinks({ isAuthenticated }) {
  if (isAuthenticated) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4 mb-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "default", size: "lg", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/login", children: "Zaloguj się" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "lg", asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/register", children: "Zarejestruj się" }) })
  ] });
}

const createStoreImpl = (createState) => {
  let state;
  const listeners = /* @__PURE__ */ new Set();
  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };
  const getState = () => state;
  const getInitialState = () => initialState;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const api = { setState, getState, getInitialState, subscribe };
  const initialState = state = createState(setState, getState, api);
  return api;
};
const createStore = ((createState) => createState ? createStoreImpl(createState) : createStoreImpl);

const identity = (arg) => arg;
function useStore(api, selector = identity) {
  const slice = React.useSyncExternalStore(
    api.subscribe,
    React.useCallback(() => selector(api.getState()), [api, selector]),
    React.useCallback(() => selector(api.getInitialState()), [api, selector])
  );
  React.useDebugValue(slice);
  return slice;
}
const createImpl = (createState) => {
  const api = createStore(createState);
  const useBoundStore = (selector) => useStore(api, selector);
  Object.assign(useBoundStore, api);
  return useBoundStore;
};
const create = ((createState) => createState ? createImpl(createState) : createImpl);

const API_ENDPOINTS = {
  authSession: "/api/auth/session"
};

async function getAuthSession() {
  return apiClient.get(API_ENDPOINTS.authSession);
}

function getSupabaseClient() {
  {
    return null;
  }
}
const supabaseClient = typeof window !== "undefined" ? getSupabaseClient() : null;
const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      try {
        const sessionData = await getAuthSession();
        if (sessionData && sessionData.isAuthenticated && sessionData.user) {
          const user = {
            id: sessionData.user.id,
            aud: "authenticated",
            role: "authenticated",
            email: sessionData.user.email || `user-${sessionData.user.id}@example.com`,
            email_confirmed_at: (/* @__PURE__ */ new Date()).toISOString(),
            phone: "",
            confirmed_at: (/* @__PURE__ */ new Date()).toISOString(),
            last_sign_in_at: (/* @__PURE__ */ new Date()).toISOString(),
            app_metadata: {},
            user_metadata: {},
            identities: [],
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            updated_at: (/* @__PURE__ */ new Date()).toISOString(),
            is_anonymous: false
          };
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          return;
        }
      } catch (apiError) {
        if (false) ;
      }
      if (supabaseClient) {
        const {
          data: { session },
          error: sessionError
        } = await supabaseClient.auth.getSession();
        if (sessionError) {
          set({ error: sessionError.message, isLoading: false });
          return;
        }
        if (session?.user) {
          set({
            user: session.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
        supabaseClient.auth.onAuthStateChange((_event, session2) => {
          if (session2?.user) {
            set({
              user: session2.user,
              isAuthenticated: true,
              error: null
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              error: null
            });
          }
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to initialize auth";
      set({ error: message, isLoading: false });
    }
  },
  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      error: null
    });
  },
  setError: (error) => {
    set({ error });
  },
  logout: async () => {
    if (!supabaseClient) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      return;
    }
    try {
      set({ isLoading: true, error: null });
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to logout";
      set({ error: message, isLoading: false });
    }
  }
}));

function useAuth() {
  const { user, isAuthenticated, isLoading, error, initialize, logout } = useAuthStore();
  reactExports.useEffect(() => {
    void initialize().catch((err) => {
    });
  }, [initialize]);
  return {
    user,
    isAuthenticated,
    isLoading,
    error: typeof error === "string" ? error : error ? String(error) : null,
    userId: user?.id ?? null,
    logout
  };
}

function Dashboard() {
  const { isAuthenticated, userId, isLoading, error } = useAuth();
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "container mx-auto px-4 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "Ładowanie..." }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "container mx-auto px-4 py-8 max-w-6xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardHero, {}),
    isAuthenticated ? /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardActions, { isAuthenticated, userId: userId ?? void 0 }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardAuthLinks, { isAuthenticated }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardActions, { isAuthenticated, userId: userId ?? void 0 })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm mb-4", children: [
      "Błąd autoryzacji: ",
      typeof error === "string" ? error : JSON.stringify(error)
    ] })
  ] });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1e3,
      // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});
function DashboardWithProvider() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Dashboard, {}) });
}

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "10xCards - Dashboard" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "DashboardWithProvider", DashboardWithProvider, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/mcalik/source/repos/10x-cards/src/components/dashboard/DashboardWithProvider", "client:component-export": "DashboardWithProvider" })} ` })}`;
}, "C:/Users/mcalik/source/repos/10x-cards/src/pages/index.astro", void 0);

const $$file = "C:/Users/mcalik/source/repos/10x-cards/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
