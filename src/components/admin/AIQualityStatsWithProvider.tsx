"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AIQualityStats } from "./AIQualityStats";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * AIQualityStatsWithProvider component - Wraps AIQualityStats with React Query provider
 */
export function AIQualityStatsWithProvider() {
  return (
    <QueryClientProvider client={queryClient}>
      <AIQualityStats />
    </QueryClientProvider>
  );
}
