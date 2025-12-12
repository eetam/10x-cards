import { useAuthStore } from "../stores/auth.store";

/**
 * Hook to access authentication state and methods
 * Note: Auth is initialized by AuthProvider at app root
 * @returns Authentication state and methods
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const logout = useAuthStore((state) => state.logout);

  return {
    user,
    isAuthenticated,
    isLoading,
    error: typeof error === "string" ? error : error ? String(error) : null,
    userId: user?.id ?? null,
    logout,
  };
}
