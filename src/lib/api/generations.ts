import type { CreateGenerationRequest, GenerateFlashcardsResponse } from "../../types";
import { apiClient } from "./client";

/**
 * Generate flashcards from source text using AI
 *
 * @param data - Generation request data containing sourceText and optional model
 * @returns Promise resolving to GenerateFlashcardsResponse with generationId and proposals
 * @throws ApiClientError if the request fails
 */
export async function generateFlashcards(data: CreateGenerationRequest): Promise<GenerateFlashcardsResponse> {
  return apiClient.post<GenerateFlashcardsResponse>("/api/generations", data);
}
