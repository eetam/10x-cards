import { RegisterForm } from "./RegisterForm";

/**
 * Registration form with provider wrapper
 * Used in Astro pages with client:load directive
 */
export function RegisterFormWithProvider() {
  return <RegisterForm />;
}
