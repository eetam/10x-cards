"use client";

import * as React from "react";
import { DashboardHero } from "./DashboardHero";
import { DashboardActions } from "./DashboardActions";
import { DashboardAuthLinks } from "./DashboardAuthLinks";
import { useAuth } from "../../lib/hooks/useAuth";

/**
 * Dashboard component - Main dashboard view combining all dashboard sections
 */
export function Dashboard() {
  try {
    const { isAuthenticated, userId, isLoading, error } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Ładowanie...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <DashboardHero />
      {isAuthenticated ? (
        <DashboardActions isAuthenticated={isAuthenticated} userId={userId ?? undefined} />
      ) : (
        <>
          <DashboardAuthLinks isAuthenticated={isAuthenticated} />
          <DashboardActions isAuthenticated={isAuthenticated} userId={userId ?? undefined} />
        </>
      )}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm mb-4">
          Błąd autoryzacji: {typeof error === "string" ? error : JSON.stringify(error)}
        </div>
      )}
    </div>
  );
  } catch (err) {
    // Error boundary - catch any errors during render
    const errorMessage = err instanceof Error ? err.message : String(err);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
          <h2 className="font-bold mb-2">Błąd podczas ładowania dashboardu</h2>
          <p className="text-sm">{errorMessage}</p>
        </div>
      </div>
    );
  }
}
