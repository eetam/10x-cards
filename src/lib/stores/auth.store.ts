import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";

/**
 * Create Supabase client for browser (optional)
 * Used as fallback when API endpoint is not available
 * Requires PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY
 */
function getSupabaseClient() {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseKey);
}

const supabaseClient = typeof window !== "undefined" ? getSupabaseClient() : null;

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Use Supabase client to get session and setup auth listener
      if (supabaseClient) {
        // Get current session from Supabase
        // Note: This reads from localStorage but is validated by Supabase
        const {
          data: { session },
          error: sessionError,
        } = await supabaseClient.auth.getSession();

        if (sessionError) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: sessionError.message,
          });
          return;
        }

        if (session?.user) {
          set({
            user: session.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }

        // Subscribe to auth state changes
        // This will automatically update state when user logs in/out
        supabaseClient.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            set({
              user: session.user,
              isAuthenticated: true,
              error: null,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              error: null,
            });
          }
        });
      } else {
        // No Supabase client available - user not authenticated
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to initialize auth";
      set({ error: message, isLoading: false, user: null, isAuthenticated: false });
    }
  },

  setUser: (user: User | null) => {
    set({
      user,
      isAuthenticated: !!user,
      error: null,
    });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  /**
   * Login user with email and password
   * PRD: US-002 - Logowanie do aplikacji
   */
  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Logowanie nie powiodło się");
      }

      // Set session in Supabase client if available
      if (supabaseClient && data.data.session) {
        await supabaseClient.auth.setSession({
          access_token: data.data.session.access_token,
          refresh_token: data.data.session.refresh_token,
        });
      }

      // Create User object from API response
      const user: User = {
        id: data.data.user.id,
        aud: "authenticated",
        role: "authenticated",
        email: data.data.user.email,
        email_confirmed_at: new Date().toISOString(),
        phone: "",
        confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        identities: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_anonymous: false,
      } as User;

      // Update store state
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Logowanie nie powiodło się";
      set({ error: message, isLoading: false, isAuthenticated: false, user: null });
      throw error;
    }
  },

  /**
   * Register new user
   * PRD: US-001 - Rejestracja konta przez e-mail/hasło
   * PRD AC: "Po rejestracji następuje automatyczne logowanie"
   */
  register: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Rejestracja nie powiodła się");
      }

      const requiresEmailConfirmation = data.data.requiresEmailConfirmation || false;

      // If session is available (email confirmation disabled), auto-login per PRD US-001
      if (data.data.session && !requiresEmailConfirmation) {
        // Set session in Supabase client if available
        if (supabaseClient) {
          await supabaseClient.auth.setSession({
            access_token: data.data.session.access_token,
            refresh_token: data.data.session.refresh_token,
          });
        }

        // Create User object from API response
        const user: User = {
          id: data.data.user.id,
          aud: "authenticated",
          role: "authenticated",
          email: data.data.user.email,
          email_confirmed_at: new Date().toISOString(),
          phone: "",
          confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
          identities: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_anonymous: false,
        } as User;

        // Update store state - auto-login
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        // Email confirmation required - don't auto-login
        set({ isLoading: false, error: null });
      }

      return { requiresEmailConfirmation };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Rejestracja nie powiodła się";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  /**
   * Logout user
   * Calls API endpoint to invalidate session, then clears local state
   */
  logout: async () => {
    try {
      set({ isLoading: true, error: null });

      // Call logout API endpoint
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      } catch (apiError) {
        // If API call fails, still try to sign out from Supabase client
        console.error("[Auth] Logout API error:", apiError);
      }

      // Also sign out from Supabase client if available
      if (supabaseClient) {
        // Use scope 'local' to clear session from current tab only
        await supabaseClient.auth.signOut({ scope: "local" });

        // Also manually clear localStorage to ensure session is gone
        // This is a safety measure to prevent race conditions
        if (typeof window !== "undefined") {
          // Clear all Supabase auth related items from localStorage
          const keys = Object.keys(localStorage);
          keys.forEach((key) => {
            if (key.startsWith("sb-") && key.includes("-auth-token")) {
              localStorage.removeItem(key);
            }
          });
        }

        // Wait a bit to ensure localStorage operations complete
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Clear local state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wylogowanie nie powiodło się";
      set({ error: message, isLoading: false });
      throw error;
    }
  },
}));
