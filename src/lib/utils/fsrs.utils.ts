import type { FSRSState, ReviewRating } from "../../types";

/**
 * FSRS (Free Spaced Repetition Scheduler) utility functions
 * Simplified implementation for MVP
 */

/**
 * Default values for new flashcards
 */
export const FSRS_DEFAULTS = {
  state: 0 as FSRSState,
  stability: 1.0,
  difficulty: 0.3,
  lapses: 0,
};

/**
 * Add minutes to a date
 */
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Result of FSRS calculation
 */
export interface FSRSResult {
  newDue: Date;
  newState: FSRSState;
  newStability: number;
  newDifficulty: number;
  newLapses: number;
}

/**
 * Calculate next review parameters based on rating
 *
 * @param currentState - Current FSRS state (0-3)
 * @param rating - User's rating (1-4: Again, Hard, Good, Easy)
 * @param stability - Current stability value
 * @param difficulty - Current difficulty value (0-1)
 * @param lapses - Current number of lapses
 * @returns New FSRS parameters
 */
export function calculateNextReview(
  currentState: FSRSState,
  rating: ReviewRating,
  stability: number,
  difficulty: number,
  lapses: number
): FSRSResult {
  const now = new Date();

  // Ensure minimum values
  const safeStability = Math.max(stability, 0.5);
  const safeDifficulty = Math.min(Math.max(difficulty, 0), 1);

  // Rating 1 (Again) - reset to Learning state
  if (rating === 1) {
    return {
      newDue: addMinutes(now, 1), // Review in 1 minute
      newState: 1 as FSRSState, // Learning
      newStability: Math.max(safeStability * 0.5, 0.5),
      newDifficulty: Math.min(safeDifficulty + 0.1, 1),
      newLapses: lapses + 1,
    };
  }

  // Rating 2 (Hard)
  if (rating === 2) {
    const interval = Math.max(safeStability * 0.8, 0.5); // days (minimum 12 hours)
    return {
      newDue: addDays(now, interval),
      newState: (currentState === 0 ? 1 : 2) as FSRSState,
      newStability: safeStability * 1.2,
      newDifficulty: Math.min(safeDifficulty + 0.05, 1),
      newLapses: lapses,
    };
  }

  // Rating 3 (Good)
  if (rating === 3) {
    const interval = Math.max(safeStability * 1.5, 1); // days
    return {
      newDue: addDays(now, interval),
      newState: 2 as FSRSState, // Review
      newStability: safeStability * 2.5,
      newDifficulty: safeDifficulty,
      newLapses: lapses,
    };
  }

  // Rating 4 (Easy)
  const interval = Math.max(safeStability * 2.5, 2); // days
  return {
    newDue: addDays(now, interval),
    newState: 2 as FSRSState, // Review
    newStability: safeStability * 3.5,
    newDifficulty: Math.max(safeDifficulty - 0.05, 0),
    newLapses: lapses,
  };
}

/**
 * Get human-readable label for FSRS state
 */
export function getStateLabel(state: FSRSState): string {
  const labels: Record<FSRSState, string> = {
    0: "Nowa",
    1: "W nauce",
    2: "Do powtórki",
    3: "Ponowna nauka",
  };
  return labels[state] || "Nieznany";
}

/**
 * Get human-readable label for rating
 */
export function getRatingLabel(rating: ReviewRating): string {
  const labels: Record<ReviewRating, string> = {
    1: "Powtórz",
    2: "Trudne",
    3: "Dobrze",
    4: "Łatwe",
  };
  return labels[rating] || "Nieznany";
}

/**
 * Estimate next review interval based on rating (for UI display)
 */
export function estimateNextInterval(rating: ReviewRating, stability: number): string {
  const safeStability = Math.max(stability, 0.5);

  let days: number;
  switch (rating) {
    case 1:
      return "1 min";
    case 2:
      days = Math.max(safeStability * 0.8, 0.5);
      break;
    case 3:
      days = Math.max(safeStability * 1.5, 1);
      break;
    case 4:
      days = Math.max(safeStability * 2.5, 2);
      break;
    default:
      return "?";
  }

  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours} godz.`;
  } else if (days < 30) {
    const roundedDays = Math.round(days);
    return roundedDays === 1 ? "1 dzień" : `${roundedDays} dni`;
  } else {
    const months = Math.round(days / 30);
    return months === 1 ? "1 mies." : `${months} mies.`;
  }
}
