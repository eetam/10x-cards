"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StudySession } from "./StudySession";

// Create a client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Wrapper component that provides React Query context for StudySession
 */
export function StudySessionWithProvider() {
  return (
    <QueryClientProvider client={queryClient}>
      <StudySession />
    </QueryClientProvider>
  );
}
