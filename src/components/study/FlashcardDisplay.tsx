"use client";

import * as React from "react";
import { Card, CardContent } from "../ui/card";
import type { StudyCard } from "../../types";

interface FlashcardDisplayProps {
  card: StudyCard;
  isRevealed: boolean;
}

/**
 * Displays a flashcard with front and back content
 * Back is hidden until revealed
 */
export function FlashcardDisplay({ card, isRevealed }: FlashcardDisplayProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Front of the card */}
      <Card className="min-h-[200px]">
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-xl text-center font-medium">{card.front}</p>
        </CardContent>
      </Card>

      {/* Back of the card - hidden until revealed */}
      {isRevealed && (
        <Card className="min-h-[200px] border-primary/50 bg-primary/5">
          <CardContent className="flex items-center justify-center p-8">
            <p className="text-xl text-center">{card.back}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
