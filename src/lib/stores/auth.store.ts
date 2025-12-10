import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import { getAuthSession } from "../api/auth.api";

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

      // First, try to get session from API endpoint (works with DEFAULT_USER_ID on server)
      try {
        const sessionData = await getAuthSession();

        if (sessionData && sessionData.isAuthenticated && sessionData.user) {
          // Create user object from API response
          const user: User = {
            id: sessionData.user.id,
            aud: "authenticated",
            role: "authenticated",
            email: sessionData.user.email || `user-${sessionData.user.id}@example.com`,
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

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return;
        }
      } catch (apiError) {
        // If API call fails, log error and fall back to Supabase client
        if (import.meta.env.DEV) {
          const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
          console.warn("API auth session failed, falling back to Supabase client:", errorMessage);
        }
      }

      // If Supabase client is available, use it directly
      if (supabaseClient) {
        // Get current session
        const {
          data: { session },
          error: sessionError,
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
        // Fallback: Not authenticated
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to initialize auth";
      set({ error: message, isLoading: false });
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

  logout: async () => {
    if (!supabaseClient) {
      // If Supabase client is not available, just clear local state
      // In the future, we can call API endpoint /api/auth/logout
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
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
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to logout";
      set({ error: message, isLoading: false });
    }
  },
}));
