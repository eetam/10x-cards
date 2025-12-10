import type { CreateGenerationRequest, GenerateFlashcardsResponse, GenerationDetailsResponse } from "../../types";
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

/**
 * Get generation details by ID
 *
 * @param generationId - UUID of the generation session
 * @returns Promise resolving to GenerationDetailsResponse with generation details
 * @throws ApiClientError if the request fails (404 if not found, 401 if unauthorized)
 */
export async function getGenerationDetails(generationId: string): Promise<GenerationDetailsResponse> {
  return apiClient.get<GenerationDetailsResponse>(`/api/generations/${generationId}`);
}
