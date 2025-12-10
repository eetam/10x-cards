import { useEffect } from "react";
import { useAuthStore } from "../stores/auth.store";

/**
 * Hook to access authentication state and methods
 * @returns Authentication state and methods
 */
export function useAuth() {
  const { user, isAuthenticated, isLoading, error, initialize, logout } = useAuthStore();

  useEffect(() => {
    // Initialize auth state on mount
    void initialize().catch((err) => {
      // Error during initialization - already handled by store
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Error initializing auth:", err);
      }
    });
  }, [initialize]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error: typeof error === "string" ? error : error ? String(error) : null,
    userId: user?.id ?? null,
    logout,
  };
}
