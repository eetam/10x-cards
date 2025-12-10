import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { StudyCard, FSRSState, ReviewRating } from "../../types";
import { calculateNextReview } from "../utils/fsrs.utils";

/**
 * Service for study session operations
 */
export class StudyService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get flashcards due for review
   *
   * @param userId - User ID
   * @param limit - Maximum number of cards to return (default: 20)
   * @returns Object with cards array and total count
   */
  async getDueFlashcards(
    userId: string,
    limit = 20
  ): Promise<{
    cards: StudyCard[];
    totalDue: number;
    error: Error | null;
  }> {
    try {
      const now = new Date().toISOString();

      // Get cards where due <= now
      const { data, error, count } = await this.supabase
        .from("flashcards")
        .select("id, front, back, state, due, stability, difficulty, lapses", { count: "exact" })
        .eq("user_id", userId)
        .lte("due", now)
        .order("due", { ascending: true })
        .limit(limit);

      if (error) {
        return {
          cards: [],
          totalDue: 0,
          error: new Error(`Database error: ${error.message}`),
        };
      }

      const cards: StudyCard[] = (data || []).map((card) => ({
        id: card.id,
        front: card.front,
        back: card.back,
        state: card.state as FSRSState,
        due: card.due,
        stability: card.stability,
        difficulty: card.difficulty,
        lapses: card.lapses,
      }));

      return {
        cards,
        totalDue: count || cards.length,
        error: null,
      };
    } catch (error) {
      return {
        cards: [],
        totalDue: 0,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Submit a review for a flashcard
   *
   * @param flashcardId - Flashcard ID
   * @param userId - User ID
   * @param rating - Review rating (1-4)
   * @returns Updated flashcard data or error
   */
  async submitReview(
    flashcardId: string,
    userId: string,
    rating: ReviewRating
  ): Promise<{
    data: {
      flashcardId: string;
      newState: FSRSState;
      newDue: string;
      newStability: number;
      newDifficulty: number;
      newLapses: number;
    } | null;
    error: Error | null;
  }> {
    try {
      // First, get current flashcard data
      const { data: flashcard, error: fetchError } = await this.supabase
        .from("flashcards")
        .select("id, state, due, stability, difficulty, lapses, review_history")
        .eq("id", flashcardId)
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          return {
            data: null,
            error: new Error("Flashcard not found"),
          };
        }
        return {
          data: null,
          error: new Error(`Database error: ${fetchError.message}`),
        };
      }

      if (!flashcard) {
        return {
          data: null,
          error: new Error("Flashcard not found"),
        };
      }

      // Calculate new FSRS parameters
      const fsrsResult = calculateNextReview(
        flashcard.state as FSRSState,
        rating,
        flashcard.stability,
        flashcard.difficulty,
        flashcard.lapses
      );

      // Prepare review history entry
      const reviewEntry = {
        rating,
        reviewedAt: new Date().toISOString(),
        previousState: flashcard.state,
        newState: fsrsResult.newState,
      };

      // Update existing review_history or create new array
      const existingHistory = Array.isArray(flashcard.review_history) ? flashcard.review_history : [];
      const newHistory = [...existingHistory, reviewEntry];

      // Update flashcard
      const { error: updateError } = await this.supabase
        .from("flashcards")
        .update({
          state: fsrsResult.newState,
          due: fsrsResult.newDue.toISOString(),
          stability: fsrsResult.newStability,
          difficulty: fsrsResult.newDifficulty,
          lapses: fsrsResult.newLapses,
          review_history: newHistory,
          updated_at: new Date().toISOString(),
        })
        .eq("id", flashcardId)
        .eq("user_id", userId);

      if (updateError) {
        return {
          data: null,
          error: new Error(`Failed to update flashcard: ${updateError.message}`),
        };
      }

      return {
        data: {
          flashcardId,
          newState: fsrsResult.newState,
          newDue: fsrsResult.newDue.toISOString(),
          newStability: fsrsResult.newStability,
          newDifficulty: fsrsResult.newDifficulty,
          newLapses: fsrsResult.newLapses,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get count of due flashcards for a user
   */
  async getDueCount(userId: string): Promise<{ count: number; error: Error | null }> {
    try {
      const now = new Date().toISOString();

      const { count, error } = await this.supabase
        .from("flashcards")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .lte("due", now);

      if (error) {
        return {
          count: 0,
          error: new Error(`Database error: ${error.message}`),
        };
      }

      return {
        count: count || 0,
        error: null,
      };
    } catch (error) {
      return {
        count: 0,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }
}
