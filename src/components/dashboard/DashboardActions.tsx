"use client";

import * as React from "react";
import { PrimaryActionButton } from "./PrimaryActionButton";

interface DashboardActionsProps {
  isAuthenticated: boolean;
  userId?: string;
}

/**
 * DashboardActions component - CTA buttons section
 */
export function DashboardActions({ isAuthenticated }: DashboardActionsProps) {
  const getRedirectUrl = (path: string): string => {
    if (isAuthenticated) {
      return path;
    }
    return `/login?redirect=${encodeURIComponent(path)}`;
  };

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Szybkie akcje</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <PrimaryActionButton label="Generuj fiszki" href={getRedirectUrl("/generate")} disabled={!isAuthenticated} />
        <PrimaryActionButton label="Moje fiszki" href={getRedirectUrl("/flashcards")} disabled={!isAuthenticated} />
        <PrimaryActionButton label="Rozpocznij naukę" href={getRedirectUrl("/study")} disabled={!isAuthenticated} />
      </div>
    </div>
  );
}
