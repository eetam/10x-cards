"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FlashcardsList } from "./FlashcardsList";

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
 * FlashcardsList with QueryProvider wrapper
 * Combines QueryProvider and FlashcardsList in a single island
 */
export function FlashcardsListWithProvider() {
  return (
    <QueryClientProvider client={queryClient}>
      <FlashcardsList />
    </QueryClientProvider>
  );
}
