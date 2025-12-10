globalThis.process ??= {}; globalThis.process.env ??= {};
class FlashcardService {
  constructor(supabase) {
    this.supabase = supabase;
  }
  /**
   * Check if a flashcard with identical content already exists for the user
   * @param userId - The user ID
   * @param front - The front side of the flashcard
   * @param back - The back side of the flashcard
   * @param excludeFlashcardId - Optional flashcard ID to exclude from duplicate check (for updates)
   * @returns Object with exists flag and error if any
   */
  async checkDuplicate(userId, front, back, excludeFlashcardId) {
    try {
      let query = this.supabase.from("flashcards").select("id").eq("user_id", userId).eq("front", front).eq("back", back);
      if (excludeFlashcardId) {
        query = query.neq("id", excludeFlashcardId);
      }
      const { data, error } = await query.limit(1).maybeSingle();
      if (error) {
        if (error.code === "PGRST116") {
          return { exists: false, error: null };
        }
        return { exists: false, error: new Error(`Database error: ${error.message}`) };
      }
      return { exists: data !== null, error: null };
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error : new Error("Unknown error")
      };
    }
  }
  /**
   * Create a new flashcard for the user
   * @param userId - The user ID
   * @param command - The flashcard creation command
   * @returns Object with created flashcard and error if any
   */
  async createFlashcard(userId, command) {
    try {
      const flashcardData = {
        user_id: userId,
        generation_id: command.generationId || null,
        front: command.front.trim(),
        back: command.back.trim(),
        source: command.source,
        state: 0,
        // New
        due: (/* @__PURE__ */ new Date()).toISOString(),
        // Current timestamp
        // stability and difficulty will use database defaults (1.0 and 0.3)
        lapses: 0,
        review_history: []
        // Empty JSON array
      };
      const { data, error } = await this.supabase.from("flashcards").insert(flashcardData).select().single();
      if (error) {
        if (error.code === "23505") {
          return {
            flashcard: null,
            error: new Error("Flashcard with this content already exists")
          };
        }
        return { flashcard: null, error: new Error(`Database error: ${error.message}`) };
      }
      return { flashcard: data, error: null };
    } catch (error) {
      return {
        flashcard: null,
        error: error instanceof Error ? error : new Error("Unknown error")
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
  async getFlashcardById(flashcardId, userId) {
    try {
      const { data, error } = await this.supabase.from("flashcards").select("*").eq("id", flashcardId).eq("user_id", userId).single();
      if (error) {
        if (error.code === "PGRST116") {
          return { flashcard: null, error: null };
        }
        return { flashcard: null, error: new Error(`Database error: ${error.message}`) };
      }
      return { flashcard: data, error: null };
    } catch (error) {
      return {
        flashcard: null,
        error: error instanceof Error ? error : new Error("Unknown error")
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
  async updateFlashcard(flashcardId, userId, data) {
    try {
      const updateData = {
        front: data.front.trim(),
        back: data.back.trim(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
        // Current timestamp
      };
      const { data: updatedFlashcard, error } = await this.supabase.from("flashcards").update(updateData).eq("id", flashcardId).eq("user_id", userId).select().single();
      if (error) {
        if (error.code === "PGRST116") {
          return { flashcard: null, error: null };
        }
        if (error.code === "23505") {
          return {
            flashcard: null,
            error: new Error("Flashcard with this content already exists")
          };
        }
        return { flashcard: null, error: new Error(`Database error: ${error.message}`) };
      }
      return { flashcard: updatedFlashcard, error: null };
    } catch (error) {
      return {
        flashcard: null,
        error: error instanceof Error ? error : new Error("Unknown error")
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
  async listFlashcards(userId, options) {
    try {
      const sortFieldMap = {
        createdAt: "created_at",
        updatedAt: "updated_at",
        due: "due"
      };
      const sortField = sortFieldMap[options.sort];
      let query = this.supabase.from("flashcards").select("id,front,back,source,state,due,created_at,updated_at", {
        count: "exact"
      }).eq("user_id", userId);
      if (options.source) {
        query = query.eq("source", options.source);
      }
      if (options.state !== void 0) {
        query = query.eq("state", options.state);
      }
      query = query.order(sortField, { ascending: options.order === "asc" }).range((options.page - 1) * options.limit, options.page * options.limit - 1);
      const { data, count, error } = await query;
      if (error) {
        return {
          data: [],
          total: 0,
          error: new Error(`Database error: ${error.message}`)
        };
      }
      return {
        data: data || [],
        total: count || 0,
        error: null
      };
    } catch (error) {
      return {
        data: [],
        total: 0,
        error: error instanceof Error ? error : new Error("Unknown error")
      };
    }
  }
  /**
   * Delete a flashcard by ID for the user
   * RLS automatically filters by user_id
   * @param flashcardId - The flashcard ID
   * @param userId - The user ID
   * @returns Object with success flag and error if any
   */
  async deleteFlashcard(flashcardId, userId) {
    try {
      const { error } = await this.supabase.from("flashcards").delete().eq("id", flashcardId).eq("user_id", userId);
      if (error) {
        if (error.code === "PGRST116") {
          return { success: false, error: null };
        }
        return { success: false, error: new Error(`Database error: ${error.message}`) };
      }
      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error")
      };
    }
  }
}

export { FlashcardService as F };
