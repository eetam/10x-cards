"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Dashboard } from "./Dashboard";

/**
 * Create a new QueryClient instance
 * This is done outside the component to avoid recreating it on every render
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Dashboard with QueryProvider wrapper
 * Combines QueryProvider and Dashboard in a single island
 */
export function DashboardWithProvider() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
