"use client";

import * as React from "react";
import { Button } from "../ui/button";
import type { ReviewRating } from "../../types";

interface RatingButtonsProps {
  onRating: (rating: ReviewRating) => void;
  isSubmitting: boolean;
}

const RATING_CONFIG: { rating: ReviewRating; label: string; sublabel: string; variant: "destructive" | "secondary" | "default" | "outline" }[] = [
  { rating: 1, label: "Powtórz", sublabel: "1", variant: "destructive" },
  { rating: 2, label: "Trudne", sublabel: "2", variant: "secondary" },
  { rating: 3, label: "Dobrze", sublabel: "3", variant: "default" },
  { rating: 4, label: "Łatwe", sublabel: "4", variant: "outline" },
];

/**
 * Rating buttons for FSRS algorithm (1-4)
 * 1 = Again (repeat), 2 = Hard, 3 = Good, 4 = Easy
 */
export function RatingButtons({ onRating, isSubmitting }: RatingButtonsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {RATING_CONFIG.map(({ rating, label, sublabel, variant }) => (
        <Button
          key={rating}
          variant={variant}
          size="lg"
          disabled={isSubmitting}
          onClick={() => onRating(rating)}
          className="min-w-[100px] flex-col h-auto py-3"
        >
          <span className="text-base font-medium">{label}</span>
          <span className="text-xs opacity-70">{sublabel}</span>
        </Button>
      ))}
    </div>
  );
}
