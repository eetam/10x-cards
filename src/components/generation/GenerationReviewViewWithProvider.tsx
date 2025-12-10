"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GenerationReviewView } from "./GenerationReviewView";

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

interface GenerationReviewViewWithProviderProps {
  generationId: string;
}

/**
 * GenerationReviewView with QueryProvider wrapper
 * Combines QueryProvider and GenerationReviewView in a single island
 */
export function GenerationReviewViewWithProvider({ generationId }: GenerationReviewViewWithProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <GenerationReviewView generationId={generationId} />
    </QueryClientProvider>
  );
}

