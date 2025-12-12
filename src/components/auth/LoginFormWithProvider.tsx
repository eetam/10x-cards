import { LoginForm } from "./LoginForm";

/**
 * Login form with provider wrapper
 * Used in Astro pages with client:load directive
 */
export function LoginFormWithProvider() {
  return <LoginForm />;
}
