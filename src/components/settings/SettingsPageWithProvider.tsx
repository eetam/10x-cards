import { SettingsPage } from "./SettingsPage";

/**
 * Settings page with provider wrapper
 * Used in Astro pages with client:load directive
 */
export function SettingsPageWithProvider() {
  return <SettingsPage />;
}
