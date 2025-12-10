import type { ListFlashcardsResponse, FlashcardSource, FSRSState } from "../../types";

/**
 * Type for a single flashcard item in the list
 */
export type FlashcardListItem = ListFlashcardsResponse["data"][number];

/**
 * Filters state for flashcards list
 */
export interface FlashcardsFiltersState {
  page: number;
  limit: number;
  sort: "createdAt" | "updatedAt" | "due";
  order: "asc" | "desc";
  source?: FlashcardSource;
  state?: FSRSState;
}

/**
 * Form data for creating/editing flashcard
 */
export interface FlashcardFormData {
  front: string;
  back: string;
}

/**
 * Default filters configuration
 */
export const DEFAULT_FILTERS: FlashcardsFiltersState = {
  page: 1,
  limit: 25,
  sort: "createdAt",
  order: "desc",
};

/**
 * Source label mapping for display
 */
export const SOURCE_LABELS: Record<FlashcardSource, string> = {
  "ai-full": "AI",
  "ai-edited": "AI (edytowane)",
  manual: "Ręczne",
};

/**
 * State label mapping for display
 */
export const STATE_LABELS: Record<FSRSState, string> = {
  0: "Nowe",
  1: "W nauce",
  2: "Do powtórki",
  3: "Ponowna nauka",
};

/**
 * Sort field labels
 */
export const SORT_LABELS: Record<FlashcardsFiltersState["sort"], string> = {
  createdAt: "Data utworzenia",
  updatedAt: "Data aktualizacji",
  due: "Termin powtórki",
};
