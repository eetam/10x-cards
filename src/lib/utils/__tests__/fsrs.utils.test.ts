import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateNextReview, getStateLabel, getRatingLabel, estimateNextInterval, FSRS_DEFAULTS } from "../fsrs.utils";
import type { FSRSState, ReviewRating } from "../../../types";

describe("FSRS Utils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("calculateNextReview", () => {
    it("should reset to Learning state when rating is 1 (Again)", () => {
      const result = calculateNextReview(2, 1, 5.0, 0.5, 2);

      expect(result.newState).toBe(1);
      expect(result.newDue.getTime()).toBe(new Date("2024-01-15T12:01:00Z").getTime());
      expect(result.newStability).toBeLessThan(5.0);
      expect(result.newDifficulty).toBeGreaterThan(0.5);
      expect(result.newLapses).toBe(3);
    });

    it("should handle rating 2 (Hard) correctly", () => {
      const result = calculateNextReview(1, 2, 2.0, 0.4, 0);

      expect(result.newState).toBe(2);
      expect(result.newDue.getTime()).toBeGreaterThan(new Date("2024-01-15T12:00:00Z").getTime());
      expect(result.newStability).toBeGreaterThan(2.0);
      expect(result.newDifficulty).toBeGreaterThan(0.4);
      expect(result.newLapses).toBe(0);
    });

    it("should handle rating 3 (Good) correctly", () => {
      const result = calculateNextReview(1, 3, 3.0, 0.5, 0);

      expect(result.newState).toBe(2);
      expect(result.newDue.getTime()).toBeGreaterThan(new Date("2024-01-15T12:00:00Z").getTime());
      expect(result.newStability).toBeGreaterThan(3.0);
      expect(result.newDifficulty).toBe(0.5);
      expect(result.newLapses).toBe(0);
    });

    it("should handle rating 4 (Easy) correctly", () => {
      const result = calculateNextReview(1, 4, 4.0, 0.6, 0);

      expect(result.newState).toBe(2);
      expect(result.newDue.getTime()).toBeGreaterThan(new Date("2024-01-15T12:00:00Z").getTime());
      expect(result.newStability).toBeGreaterThan(4.0);
      expect(result.newDifficulty).toBeLessThan(0.6);
      expect(result.newLapses).toBe(0);
    });

    it("should ensure minimum stability of 0.5", () => {
      const result = calculateNextReview(0, 1, 0.1, 0.3, 0);

      expect(result.newStability).toBeGreaterThanOrEqual(0.5);
    });

    it("should clamp difficulty between 0 and 1", () => {
      const resultLow = calculateNextReview(0, 1, 1.0, -0.1, 0);
      const resultHigh = calculateNextReview(0, 1, 1.0, 1.5, 0);

      expect(resultLow.newDifficulty).toBeGreaterThanOrEqual(0);
      expect(resultHigh.newDifficulty).toBeLessThanOrEqual(1);
    });

    it("should transition from New (0) to Learning (1) with Hard rating", () => {
      const result = calculateNextReview(0, 2, 1.0, 0.3, 0);

      expect(result.newState).toBe(1);
    });
  });

  describe("getStateLabel", () => {
    it("should return correct label for each state", () => {
      expect(getStateLabel(0)).toBe("Nowa");
      expect(getStateLabel(1)).toBe("W nauce");
      expect(getStateLabel(2)).toBe("Do powtórki");
      expect(getStateLabel(3)).toBe("Ponowna nauka");
    });

    it("should return 'Nieznany' for invalid state", () => {
      expect(getStateLabel(99 as FSRSState)).toBe("Nieznany");
    });
  });

  describe("getRatingLabel", () => {
    it("should return correct label for each rating", () => {
      expect(getRatingLabel(1)).toBe("Powtórz");
      expect(getRatingLabel(2)).toBe("Trudne");
      expect(getRatingLabel(3)).toBe("Dobrze");
      expect(getRatingLabel(4)).toBe("Łatwe");
    });

    it("should return 'Nieznany' for invalid rating", () => {
      expect(getRatingLabel(99 as ReviewRating)).toBe("Nieznany");
    });
  });

  describe("estimateNextInterval", () => {
    it("should return '1 min' for rating 1", () => {
      expect(estimateNextInterval(1, 5.0)).toBe("1 min");
    });

    it("should return hours format for rating 2 when interval < 1 day", () => {
      const result = estimateNextInterval(2, 0.5);
      expect(result).toContain("godz.");
    });

    it("should return days format for rating 3 when interval < 30 days", () => {
      const result = estimateNextInterval(3, 5.0);
      expect(result).toMatch(/\d+ (dzień|dni)/);
    });

    it("should return months format for rating 4 when interval >= 30 days", () => {
      const result = estimateNextInterval(4, 20.0);
      expect(result).toMatch(/\d+ (mies\.|miesięcy)/);
    });

    it("should handle singular forms correctly", () => {
      // Test singular "1 dzień" - need stability that gives exactly 1 day when rounded
      // For rating 3: days = max(stability * 1.5, 1)
      // To get exactly 1: stability * 1.5 should be close to 1, so stability ≈ 0.67
      const result = estimateNextInterval(3, 0.67);
      expect(result).toBe("1 dzień");

      // Test plural "2 dni"
      const resultPlural = estimateNextInterval(3, 1.0);
      expect(resultPlural).toBe("2 dni");
    });

    it("should ensure minimum interval for rating 2", () => {
      const result = estimateNextInterval(2, 0.1);
      expect(result).toContain("godz.");
    });

    it("should ensure minimum interval for rating 3", () => {
      const result = estimateNextInterval(3, 0.1);
      expect(result).toBe("1 dzień");
    });

    it("should ensure minimum interval for rating 4", () => {
      const result = estimateNextInterval(4, 0.1);
      expect(result).toBe("2 dni");
    });
  });

  describe("FSRS_DEFAULTS", () => {
    it("should have correct default values", () => {
      expect(FSRS_DEFAULTS.state).toBe(0);
      expect(FSRS_DEFAULTS.stability).toBe(1.0);
      expect(FSRS_DEFAULTS.difficulty).toBe(0.3);
      expect(FSRS_DEFAULTS.lapses).toBe(0);
    });
  });
});
