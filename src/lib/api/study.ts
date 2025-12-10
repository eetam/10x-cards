import type { StudySessionResponse, StudySessionQuery, ReviewRating } from "../../types";
import { apiClient } from "./client";

/**
 * Response type for submitting a review (without nextCard for simplicity)
 */
export interface SubmitReviewApiResponse {
  flashcardId: string;
  newState: number;
  newDue: string;
  newStability: number;
  newDifficulty: number;
  newLapses: number;
}

/**
 * Fetch study session with due flashcards
 *
 * @param query - Query parameters (limit)
 * @returns Promise resolving to StudySessionResponse with cards due for review
 * @throws ApiClientError if the request fails
 */
export async function fetchStudySession(query: StudySessionQuery = {}): Promise<StudySessionResponse> {
  const params = new URLSearchParams();

  if (query.limit) params.set("limit", String(query.limit));

  const queryString = params.toString();
  const endpoint = queryString ? `/api/study-session?${queryString}` : "/api/study-session";

  return apiClient.get<StudySessionResponse>(endpoint);
}

/**
 * Submit a review for a flashcard
 *
 * @param flashcardId - ID of the flashcard being reviewed
 * @param rating - Rating from 1-4 (Again, Hard, Good, Easy)
 * @param responseTime - Optional response time in milliseconds
 * @returns Promise resolving to updated flashcard FSRS data
 * @throws ApiClientError if the request fails
 */
export async function submitReview(
  flashcardId: string,
  rating: ReviewRating,
  responseTime?: number
): Promise<SubmitReviewApiResponse> {
  return apiClient.post<SubmitReviewApiResponse>(`/api/flashcards/${flashcardId}/review`, {
    rating,
    responseTime,
  });
}
