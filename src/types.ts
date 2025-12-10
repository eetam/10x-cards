import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ============================================================================
// Base Types from Database
// ============================================================================

export type Flashcard = Tables<"flashcards">;
export type Generation = Tables<"generations">;
export type GenerationErrorLog = Tables<"generation_error_logs">;

export type FlashcardInsert = TablesInsert<"flashcards">;
export type GenerationInsert = TablesInsert<"generations">;
export type GenerationErrorLogInsert = TablesInsert<"generation_error_logs">;

export type FlashcardUpdate = TablesUpdate<"flashcards">;
export type GenerationUpdate = TablesUpdate<"generations">;

// ============================================================================
// Common Types
// ============================================================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type FlashcardSource = "ai-full" | "ai-edited" | "manual";

export type FSRSState = 0 | 1 | 2 | 3; // new, learning, review, relearning

export type ReviewRating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export type TimePeriod = "7d" | "30d" | "90d" | "all";

// ============================================================================
// Generation DTOs
// ============================================================================

export interface CreateGenerationRequest {
  sourceText: string; // 1000-10000 characters
  model?: string; // optional, defaults to configured model
}

export type CreateGenerationResponse = Pick<
  Generation,
  "id" | "user_id" | "model" | "source_text_hash" | "source_text_length" | "created_at"
> & {
  userId: string; // mapped from user_id
  sourceTextHash: string; // mapped from source_text_hash
  sourceTextLength: number; // mapped from source_text_length
  createdAt: string; // mapped from created_at
};

export interface FlashcardProposal {
  front: string;
  back: string;
  confidence: number; // 0-1
}

export interface GenerateFlashcardsResponse {
  generationId: string;
  proposals: FlashcardProposal[];
  generatedAt: string;
  duration: number; // milliseconds
}

export type GenerationDetailsResponse = Pick<
  Generation,
  | "id"
  | "user_id"
  | "model"
  | "generated_count"
  | "accepted_unedited_count"
  | "accepted_edited_count"
  | "source_text_length"
  | "generation_duration"
  | "created_at"
> & {
  userId: string; // mapped from user_id
  acceptedUneditedCount: number; // mapped from accepted_unedited_count
  acceptedEditedCount: number; // mapped from accepted_edited_count
  sourceTextLength: number; // mapped from source_text_length
  generationDuration: string; // mapped from generation_duration (ISO 8601 duration)
  createdAt: string; // mapped from created_at
};

export interface ListGenerationsResponse {
  data: Pick<
    Generation,
    "id" | "model" | "generated_count" | "accepted_unedited_count" | "accepted_edited_count" | "created_at"
  >[];
  pagination: PaginationInfo;
}

// ============================================================================
// Flashcard DTOs
// ============================================================================

export interface CreateFlashcardRequest {
  front: string; // max 200 characters
  back: string; // max 500 characters
  source: FlashcardSource;
  generationId?: string; // optional, for AI-generated cards
}

export type CreateFlashcardResponse = Pick<
  Flashcard,
  | "id"
  | "user_id"
  | "generation_id"
  | "front"
  | "back"
  | "source"
  | "state"
  | "due"
  | "stability"
  | "difficulty"
  | "lapses"
  | "created_at"
  | "updated_at"
> & {
  userId: string; // mapped from user_id
  generationId: string | null; // mapped from generation_id
  createdAt: string; // mapped from created_at
  updatedAt: string; // mapped from updated_at
};

export type FlashcardResponse = Pick<
  Flashcard,
  | "id"
  | "user_id"
  | "generation_id"
  | "front"
  | "back"
  | "source"
  | "state"
  | "due"
  | "stability"
  | "difficulty"
  | "lapses"
  | "review_history"
  | "created_at"
  | "updated_at"
> & {
  userId: string; // mapped from user_id
  generationId: string | null; // mapped from generation_id
  reviewHistory: unknown[]; // mapped from review_history (Json type)
  createdAt: string; // mapped from created_at
  updatedAt: string; // mapped from updated_at
};

export interface UpdateFlashcardRequest {
  front: string; // max 200 characters
  back: string; // max 500 characters
}

export type UpdateFlashcardResponse = CreateFlashcardResponse; // Same structure as create response

export interface ListFlashcardsResponse {
  data: Pick<Flashcard, "id" | "front" | "back" | "source" | "state" | "due" | "created_at" | "updated_at">[];
  pagination: PaginationInfo;
}

// ============================================================================
// Study Session DTOs
// ============================================================================

export type StudyCard = Pick<
  Flashcard,
  "id" | "front" | "back" | "state" | "due" | "stability" | "difficulty" | "lapses"
>;

export interface StudySessionResponse {
  sessionId: string;
  cards: StudyCard[];
  totalDue: number;
  sessionStartedAt: string;
}

export interface SubmitReviewRequest {
  flashcardId: string;
  rating: ReviewRating; // 1-4: Again, Hard, Good, Easy
  responseTime?: number; // milliseconds, optional
}

export interface SubmitReviewResponse {
  flashcardId: string;
  newState: FSRSState;
  newDue: string; // ISO 8601 timestamp
  newStability: number;
  newDifficulty: number;
  newLapses: number;
  nextCard: Pick<StudyCard, "id" | "front" | "state" | "due"> | null;
}

export interface CompleteSessionRequest {
  sessionId: string;
  completedAt: string; // ISO 8601 timestamp
}

export interface CompleteSessionResponse {
  sessionId: string;
  cardsReviewed: number;
  sessionDuration: number; // milliseconds
  completedAt: string; // ISO 8601 timestamp
}

// ============================================================================
// Statistics DTOs
// ============================================================================

export interface CardsBySource {
  "ai-full": number;
  "ai-edited": number;
  manual: number;
}

export interface CardsByState {
  new: number; // state 0
  learning: number; // state 1
  review: number; // state 2
  relearning: number; // state 3
}

export interface UserStatisticsResponse {
  totalCards: number;
  cardsBySource: CardsBySource;
  cardsByState: CardsByState;
  dueToday: number;
  averageAccuracy: number;
  studyStreak: number;
  totalStudyTime: number; // minutes
  period: TimePeriod;
}

// ============================================================================
// Error Response Types
// ============================================================================

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

export interface ValidationError {
  message: string;
  field: string;
  value?: unknown;
}

// ============================================================================
// Utility Types for API Responses
// ============================================================================

export type ApiResponse<T> =
  | {
      data: T;
      success: true;
    }
  | {
      error: ApiError;
      success: false;
    };

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// ============================================================================
// Command Models for Business Logic
// ============================================================================

export type CreateGenerationCommand = CreateGenerationRequest;

export interface GenerateFlashcardsCommand {
  generationId: string;
  sourceText: string;
  model: string;
  userId: string;
}

export type CreateFlashcardCommand = CreateFlashcardRequest;

export interface UpdateFlashcardCommand {
  flashcardId: string;
  data: UpdateFlashcardRequest;
}

export type SubmitReviewCommand = SubmitReviewRequest;

export type CompleteSessionCommand = CompleteSessionRequest;

// ============================================================================
// Query Parameters Types
// ============================================================================

export interface ListGenerationsQuery {
  page?: number;
  limit?: number;
  sort?: "createdAt" | "model";
  order?: "asc" | "desc";
}

export interface ListFlashcardsQuery {
  page?: number;
  limit?: number;
  sort?: "createdAt" | "updatedAt" | "due";
  order?: "asc" | "desc";
  source?: FlashcardSource;
  state?: FSRSState;
}

export interface StudySessionQuery {
  limit?: number; // max 100
}

export interface StatisticsQuery {
  period?: TimePeriod;
}

// ============================================================================
// Generation Review ViewModel Types
// ============================================================================

/**
 * Status propozycji fiszki w widoku przeglądu
 */
export type ProposalStatus = "pending" | "accepted" | "rejected" | "edited";

/**
 * ViewModel dla propozycji z dodatkowym statusem i edytowaną zawartością
 */
export interface ProposalViewModel extends FlashcardProposal {
  status: ProposalStatus;
  editedFront?: string; // edytowany awers (jeśli został edytowany)
  editedBack?: string; // edytowany rewers (jeśli został edytowany)
}

/**
 * Typ danych formularza edycji propozycji
 */
export interface EditProposalFormData {
  front: string; // max 200 characters
  back: string; // max 500 characters
}

/**
 * Typ stanu postępu zapisywania wszystkich zaakceptowanych propozycji
 */
export interface SaveProgressState {
  isSaving: boolean;
  current: number; // liczba zapisanych fiszek
  total: number; // całkowita liczba fiszek do zapisania
  errors: {
    index: number;
    proposal: ProposalViewModel;
    error: ApiError;
  }[]; // błędy podczas zapisywania
}
