import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Flashcard,
  FlashcardInsert,
  FlashcardUpdate,
  CreateFlashcardCommand,
  FlashcardSource,
  FSRSState,
} from "../../types";

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
   * @param excludeFlashcardId - Optional flashcard ID to exclude from duplicate check (for updates)
   * @returns Object with exists flag and error if any
   */
  async checkDuplicate(
    userId: string,
    front: string,
    back: string,
    excludeFlashcardId?: string
  ): Promise<{ exists: boolean; error: Error | null }> {
    try {
      let query = this.supabase
        .from("flashcards")
        .select("id")
        .eq("user_id", userId)
        .eq("front", front)
        .eq("back", back);

      // Exclude the current flashcard if provided (for update operations)
      if (excludeFlashcardId) {
        query = query.neq("id", excludeFlashcardId);
      }

      const { data, error } = await query.limit(1).maybeSingle();

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

  /**
   * Get a single flashcard by ID for the user
   * RLS automatically filters by user_id
   * @param flashcardId - The flashcard ID
   * @param userId - The user ID
   * @returns Object with flashcard and error if any
   */
  async getFlashcardById(
    flashcardId: string,
    userId: string
  ): Promise<{ flashcard: Flashcard | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from("flashcards")
        .select("*")
        .eq("id", flashcardId)
        .eq("user_id", userId)
        .single();

      if (error) {
        // If no rows found, return null flashcard (not an error)
        if (error.code === "PGRST116") {
          return { flashcard: null, error: null };
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

  /**
   * Update a flashcard's content (front and back) for the user
   * RLS automatically filters by user_id
   * @param flashcardId - The flashcard ID
   * @param userId - The user ID
   * @param data - The update data (front and back)
   * @returns Object with updated flashcard and error if any
   */
  async updateFlashcard(
    flashcardId: string,
    userId: string,
    data: { front: string; back: string }
  ): Promise<{ flashcard: Flashcard | null; error: Error | null }> {
    try {
      // Prepare data for update
      const updateData: FlashcardUpdate = {
        front: data.front.trim(),
        back: data.back.trim(),
        updated_at: new Date().toISOString(), // Current timestamp
      };

      const { data: updatedFlashcard, error } = await this.supabase
        .from("flashcards")
        .update(updateData)
        .eq("id", flashcardId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        // If no rows found (PGRST116), flashcard doesn't exist or doesn't belong to user
        if (error.code === "PGRST116") {
          return { flashcard: null, error: null };
        }

        // Check for UNIQUE constraint violation (duplicate)
        if (error.code === "23505") {
          return {
            flashcard: null,
            error: new Error("Flashcard with this content already exists"),
          };
        }

        return { flashcard: null, error: new Error(`Database error: ${error.message}`) };
      }

      return { flashcard: updatedFlashcard as Flashcard, error: null };
    } catch (error) {
      return {
        flashcard: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * List flashcards for a user with pagination, sorting, and filtering
   * RLS automatically filters by user_id
   * @param userId - The user ID
   * @param options - Query options (pagination, sorting, filtering)
   * @returns Object with flashcard data, total count, and error if any
   */
  async listFlashcards(
    userId: string,
    options: {
      page: number;
      limit: number;
      sort: "createdAt" | "updatedAt" | "due";
      order: "asc" | "desc";
      source?: FlashcardSource;
      state?: FSRSState;
    }
  ): Promise<{
    data: Pick<Flashcard, "id" | "front" | "back" | "source" | "state" | "due" | "created_at" | "updated_at">[];
    total: number;
    error: Error | null;
  }> {
    try {
      // Map sort field from API format (camelCase) to database format (snake_case)
      const sortFieldMap: Record<"createdAt" | "updatedAt" | "due", string> = {
        createdAt: "created_at",
        updatedAt: "updated_at",
        due: "due",
      };
      const sortField = sortFieldMap[options.sort];

      // Build query with count
      let query = this.supabase
        .from("flashcards")
        .select("id,front,back,source,state,due,created_at,updated_at", {
          count: "exact",
        })
        .eq("user_id", userId);

      // Apply optional filters
      if (options.source) {
        query = query.eq("source", options.source);
      }

      if (options.state !== undefined) {
        query = query.eq("state", options.state);
      }

      // Apply sorting and pagination
      query = query
        .order(sortField, { ascending: options.order === "asc" })
        .range((options.page - 1) * options.limit, options.page * options.limit - 1);

      const { data, count, error } = await query;

      if (error) {
        return {
          data: [],
          total: 0,
          error: new Error(`Database error: ${error.message}`),
        };
      }

      return {
        data: data || [],
        total: count || 0,
        error: null,
      };
    } catch (error) {
      return {
        data: [],
        total: 0,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }
}
