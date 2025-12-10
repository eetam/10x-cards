import type {
  CreateFlashcardRequest,
  CreateFlashcardResponse,
  ListFlashcardsResponse,
  ListFlashcardsQuery,
  UpdateFlashcardRequest,
  UpdateFlashcardResponse,
} from "../../types";
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

/**
 * Fetch flashcards list with pagination and filtering
 *
 * @param query - Query parameters for filtering, sorting, and pagination
 * @returns Promise resolving to ListFlashcardsResponse with flashcards data and pagination info
 * @throws ApiClientError if the request fails
 */
export async function fetchFlashcards(query: ListFlashcardsQuery = {}): Promise<ListFlashcardsResponse> {
  const params = new URLSearchParams();

  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.sort) params.set("sort", query.sort);
  if (query.order) params.set("order", query.order);
  if (query.source) params.set("source", query.source);
  if (query.state !== undefined) params.set("state", String(query.state));

  const queryString = params.toString();
  const endpoint = queryString ? `/api/flashcards?${queryString}` : "/api/flashcards";

  return apiClient.get<ListFlashcardsResponse>(endpoint);
}

/**
 * Update an existing flashcard
 *
 * @param id - Flashcard ID to update
 * @param data - Update data containing front and back
 * @returns Promise resolving to UpdateFlashcardResponse with updated flashcard data
 * @throws ApiClientError if the request fails (404 for not found, 400 for validation errors)
 */
export async function updateFlashcard(id: string, data: UpdateFlashcardRequest): Promise<UpdateFlashcardResponse> {
  return apiClient.put<UpdateFlashcardResponse>(`/api/flashcards/${id}`, data);
}

/**
 * Delete a flashcard
 *
 * @param id - Flashcard ID to delete
 * @returns Promise resolving when deletion is complete
 * @throws ApiClientError if the request fails (404 for not found)
 */
export async function deleteFlashcard(id: string): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>(`/api/flashcards/${id}`);
}
