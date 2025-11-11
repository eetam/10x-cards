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
    void initialize();
  }, [initialize]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    userId: user?.id ?? null,
    logout,
  };
}
