import { useEffect, useRef } from "react";
import { useAuthStore } from "../../lib/stores/auth.store";

/**
 * AuthProvider - Initializes auth state once at application root
 * This prevents multiple initialization calls from different components
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initializedRef = useRef(false);

  useEffect(() => {
    // Initialize auth state only once for the entire application
    if (!initializedRef.current) {
      initializedRef.current = true;
      const { initialize } = useAuthStore.getState();
      void initialize().catch((err) => {
        // Error during initialization - already handled by store
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error("[AuthProvider] Error initializing auth:", err);
        }
      });
    }
  }, []);

  return <>{children}</>;
}
