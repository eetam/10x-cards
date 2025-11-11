import type { SupabaseClient } from "@supabase/supabase-js";
import type { Flashcard, FlashcardInsert, CreateFlashcardCommand } from "../../types";

/**
 * Service for handling flashcard operations
 */
export class FlashcardService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Check if a flashcard with identical content already exists for the user
   * @param userId - The user ID
   * @param front - The front side of the flashcard
   * @param back - The back side of the flashcard
   * @returns Object with exists flag and error if any
   */
  async checkDuplicate(userId: string, front: string, back: string): Promise<{ exists: boolean; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from("flashcards")
        .select("id")
        .eq("user_id", userId)
        .eq("front", front)
        .eq("back", back)
        .limit(1)
        .maybeSingle();

      if (error) {
        // If no rows found (PGRST116), that's fine - no duplicate
        if (error.code === "PGRST116") {
          return { exists: false, error: null };
        }
        return { exists: false, error: new Error(`Database error: ${error.message}`) };
      }

      // If data exists, duplicate found
      return { exists: data !== null, error: null };
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Create a new flashcard for the user
   * @param userId - The user ID
   * @param command - The flashcard creation command
   * @returns Object with created flashcard and error if any
   */
  async createFlashcard(
    userId: string,
    command: CreateFlashcardCommand
  ): Promise<{ flashcard: Flashcard | null; error: Error | null }> {
    try {
      // Prepare data for insertion
      const flashcardData: FlashcardInsert = {
        user_id: userId,
        generation_id: command.generationId || null,
        front: command.front.trim(),
        back: command.back.trim(),
        source: command.source,
        state: 0, // New
        due: new Date().toISOString(), // Current timestamp
        stability: 0,
        difficulty: 0,
        lapses: 0,
        review_history: [], // Empty JSON array
      };

      const { data, error } = await this.supabase.from("flashcards").insert(flashcardData).select().single();

      if (error) {
        // Check for UNIQUE constraint violation
        if (error.code === "23505") {
          return {
            flashcard: null,
            error: new Error("Flashcard with this content already exists"),
          };
        }
        return { flashcard: null, error: new Error(`Database error: ${error.message}`) };
      }

      return { flashcard: data as Flashcard, error: null };
    } catch (error) {
      return {
        flashcard: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }
}
