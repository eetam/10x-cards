import type { CreateFlashcardRequest, CreateFlashcardResponse } from "../../types";
import { apiClient } from "./client";

/**
 * Create a new flashcard
 *
 * @param data - Flashcard creation request data containing front, back, source, and optional generationId
 * @returns Promise resolving to CreateFlashcardResponse with created flashcard data
 * @throws ApiClientError if the request fails (400 for validation errors, 409 for duplicates, 401 for unauthorized)
 */
export async function createFlashcard(data: CreateFlashcardRequest): Promise<CreateFlashcardResponse> {
  return apiClient.post<CreateFlashcardResponse>("/api/flashcards", data);
}

