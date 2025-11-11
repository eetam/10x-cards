"use client";

import * as React from "react";
import { Button } from "../ui/button";

interface DashboardAuthLinksProps {
  isAuthenticated: boolean;
}

/**
 * DashboardAuthLinks component - Login/Register links (only for unauthenticated users)
 */
export function DashboardAuthLinks({ isAuthenticated }: DashboardAuthLinksProps) {
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
      <Button variant="default" size="lg" asChild>
        <a href="/login">Zaloguj się</a>
      </Button>
      <Button variant="outline" size="lg" asChild>
        <a href="/register">Zarejestruj się</a>
      </Button>
    </div>
  );
}
