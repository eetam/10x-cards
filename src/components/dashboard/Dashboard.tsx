"use client";

import * as React from "react";
import { DashboardHero } from "./DashboardHero";
import { DashboardActions } from "./DashboardActions";
import { DashboardStats } from "./DashboardStats";
import { useAuth } from "../../lib/hooks/useAuth";

/**
 * Dashboard component - Main dashboard view for authenticated users
 * Note: This page is protected by middleware - unauthenticated users are redirected to /login
 */
export function Dashboard() {
  const { userId, isLoading } = useAuth();

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

  // User is authenticated (guaranteed by middleware)
  return (
    <div className="container mx-auto px-4 py-2 sm:py-4 md:py-6 max-w-7xl pb-8 sm:pb-12 md:pb-16">
      <DashboardHero />
      <DashboardStats />
      <DashboardActions isAuthenticated={true} userId={userId ?? undefined} />
    </div>
  );
}
