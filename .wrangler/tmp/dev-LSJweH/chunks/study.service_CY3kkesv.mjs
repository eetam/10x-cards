globalThis.process ??= {}; globalThis.process.env ??= {};
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1e3);
}
function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1e3);
}
function calculateNextReview(currentState, rating, stability, difficulty, lapses) {
  const now = /* @__PURE__ */ new Date();
  const safeStability = Math.max(stability, 0.5);
  const safeDifficulty = Math.min(Math.max(difficulty, 0), 1);
  if (rating === 1) {
    return {
      newDue: addMinutes(now, 1),
      // Review in 1 minute
      newState: 1,
      // Learning
      newStability: Math.max(safeStability * 0.5, 0.5),
      newDifficulty: Math.min(safeDifficulty + 0.1, 1),
      newLapses: lapses + 1
    };
  }
  if (rating === 2) {
    const interval2 = Math.max(safeStability * 0.8, 0.5);
    return {
      newDue: addDays(now, interval2),
      newState: currentState === 0 ? 1 : 2,
      newStability: safeStability * 1.2,
      newDifficulty: Math.min(safeDifficulty + 0.05, 1),
      newLapses: lapses
    };
  }
  if (rating === 3) {
    const interval2 = Math.max(safeStability * 1.5, 1);
    return {
      newDue: addDays(now, interval2),
      newState: 2,
      // Review
      newStability: safeStability * 2.5,
      newDifficulty: safeDifficulty,
      newLapses: lapses
    };
  }
  const interval = Math.max(safeStability * 2.5, 2);
  return {
    newDue: addDays(now, interval),
    newState: 2,
    // Review
    newStability: safeStability * 3.5,
    newDifficulty: Math.max(safeDifficulty - 0.05, 0),
    newLapses: lapses
  };
}

class StudyService {
  constructor(supabase) {
    this.supabase = supabase;
  }
  /**
   * Get flashcards due for review
   *
   * @param userId - User ID
   * @param limit - Maximum number of cards to return (default: 20)
   * @returns Object with cards array and total count
   */
  async getDueFlashcards(userId, limit = 20) {
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const { data, error, count } = await this.supabase.from("flashcards").select("id, front, back, state, due, stability, difficulty, lapses", { count: "exact" }).eq("user_id", userId).lte("due", now).order("due", { ascending: true }).limit(limit);
      if (error) {
        return {
          cards: [],
          totalDue: 0,
          error: new Error(`Database error: ${error.message}`)
        };
      }
      const cards = (data || []).map((card) => ({
        id: card.id,
        front: card.front,
        back: card.back,
        state: card.state,
        due: card.due,
        stability: card.stability,
        difficulty: card.difficulty,
        lapses: card.lapses
      }));
      return {
        cards,
        totalDue: count || cards.length,
        error: null
      };
    } catch (error) {
      return {
        cards: [],
        totalDue: 0,
        error: error instanceof Error ? error : new Error("Unknown error")
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
  async submitReview(flashcardId, userId, rating) {
    try {
      const { data: flashcard, error: fetchError } = await this.supabase.from("flashcards").select("id, state, due, stability, difficulty, lapses, review_history").eq("id", flashcardId).eq("user_id", userId).single();
      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          return {
            data: null,
            error: new Error("Flashcard not found")
          };
        }
        return {
          data: null,
          error: new Error(`Database error: ${fetchError.message}`)
        };
      }
      if (!flashcard) {
        return {
          data: null,
          error: new Error("Flashcard not found")
        };
      }
      const fsrsResult = calculateNextReview(
        flashcard.state,
        rating,
        flashcard.stability,
        flashcard.difficulty,
        flashcard.lapses
      );
      const reviewEntry = {
        rating,
        reviewedAt: (/* @__PURE__ */ new Date()).toISOString(),
        previousState: flashcard.state,
        newState: fsrsResult.newState
      };
      const existingHistory = Array.isArray(flashcard.review_history) ? flashcard.review_history : [];
      const newHistory = [...existingHistory, reviewEntry];
      const { error: updateError } = await this.supabase.from("flashcards").update({
        state: fsrsResult.newState,
        due: fsrsResult.newDue.toISOString(),
        stability: fsrsResult.newStability,
        difficulty: fsrsResult.newDifficulty,
        lapses: fsrsResult.newLapses,
        review_history: newHistory,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", flashcardId).eq("user_id", userId);
      if (updateError) {
        return {
          data: null,
          error: new Error(`Failed to update flashcard: ${updateError.message}`)
        };
      }
      return {
        data: {
          flashcardId,
          newState: fsrsResult.newState,
          newDue: fsrsResult.newDue.toISOString(),
          newStability: fsrsResult.newStability,
          newDifficulty: fsrsResult.newDifficulty,
          newLapses: fsrsResult.newLapses
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error")
      };
    }
  }
  /**
   * Get count of due flashcards for a user
   */
  async getDueCount(userId) {
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const { count, error } = await this.supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("user_id", userId).lte("due", now);
      if (error) {
        return {
          count: 0,
          error: new Error(`Database error: ${error.message}`)
        };
      }
      return {
        count: count || 0,
        error: null
      };
    } catch (error) {
      return {
        count: 0,
        error: error instanceof Error ? error : new Error("Unknown error")
      };
    }
  }
}

export { StudyService as S };
