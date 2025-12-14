"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Loader2, X, AlertCircle, BookOpen } from "lucide-react";
import { StudyProgress } from "./StudyProgress";
import { FlashcardDisplay } from "./FlashcardDisplay";
import { RatingButtons } from "./RatingButtons";
import { StudyComplete } from "./StudyComplete";
import { fetchStudySession, submitReview } from "../../lib/api/study";
import type { StudyCard, ReviewRating } from "../../types";

interface SessionStats {
  reviewed: number;
  again: number;
  hard: number;
  good: number;
  easy: number;
}

const INITIAL_STATS: SessionStats = {
  reviewed: 0,
  again: 0,
  hard: 0,
  good: 0,
  easy: 0,
};

/**
 * Main study session component
 * Handles fetching cards, displaying them, and submitting reviews
 */
export function StudySession() {
  const queryClient = useQueryClient();

  // Session state
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isRevealed, setIsRevealed] = React.useState(false);
  const [sessionStats, setSessionStats] = React.useState<SessionStats>(INITIAL_STATS);
  const [cards, setCards] = React.useState<StudyCard[]>([]);
  const [isComplete, setIsComplete] = React.useState(false);

  // Fetch study session
  const {
    data: sessionData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["study-session"],
    queryFn: () => fetchStudySession({ limit: 20 }),
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: false,
  });

  // Initialize cards when session data is fetched
  React.useEffect(() => {
    if (sessionData?.cards) {
      setCards(sessionData.cards);
      setCurrentIndex(0);
      setIsRevealed(false);
      setSessionStats(INITIAL_STATS);
      setIsComplete(false);
    }
  }, [sessionData]);

  // Submit review mutation
  const reviewMutation = useMutation({
    mutationFn: ({ flashcardId, rating }: { flashcardId: string; rating: ReviewRating }) =>
      submitReview(flashcardId, rating),
    onSuccess: (_, { rating }) => {
      // Update stats based on rating
      setSessionStats((prev) => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        again: rating === 1 ? prev.again + 1 : prev.again,
        hard: rating === 2 ? prev.hard + 1 : prev.hard,
        good: rating === 3 ? prev.good + 1 : prev.good,
        easy: rating === 4 ? prev.easy + 1 : prev.easy,
      }));

      // Move to next card or complete session
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsRevealed(false);
      } else {
        setIsComplete(true);
      }
    },
  });

  // Handlers
  const handleReveal = React.useCallback(() => {
    setIsRevealed(true);
  }, []);

  const handleRating = React.useCallback(
    (rating: ReviewRating) => {
      const currentCard = cards[currentIndex];
      if (!currentCard) return;

      reviewMutation.mutate({
        flashcardId: currentCard.id,
        rating,
      });
    },
    [cards, currentIndex, reviewMutation]
  );

  const handleExit = React.useCallback(() => {
    window.location.replace("/");
  }, []);

  const handleStudyMore = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["study-session"] });
    refetch();
  }, [queryClient, refetch]);

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case "Space":
          event.preventDefault();
          if (!isRevealed && !isComplete) {
            handleReveal();
          }
          break;
        case "Digit1":
        case "Numpad1":
          if (isRevealed && !isComplete) {
            handleRating(1);
          }
          break;
        case "Digit2":
        case "Numpad2":
          if (isRevealed && !isComplete) {
            handleRating(2);
          }
          break;
        case "Digit3":
        case "Numpad3":
          if (isRevealed && !isComplete) {
            handleRating(3);
          }
          break;
        case "Digit4":
        case "Numpad4":
          if (isRevealed && !isComplete) {
            handleRating(4);
          }
          break;
        case "Escape":
          handleExit();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRevealed, isComplete, handleReveal, handleRating, handleExit]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Ładowanie sesji nauki...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>Nie udało się załadować sesji nauki. Spróbuj ponownie później.</AlertDescription>
        </Alert>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExit}>
            Wróć do dashboardu
          </Button>
          <Button onClick={() => refetch()}>Spróbuj ponownie</Button>
        </div>
      </div>
    );
  }

  // No cards to study
  if (!cards.length) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="space-y-4">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Gratulacje!</h1>
          <p className="text-muted-foreground">Nie masz fiszek do powtórki. Wszystkie zostały przerobione!</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={handleExit}>
            Wróć do dashboardu
          </Button>
          <Button onClick={() => (window.location.href = "/flashcards")}>Przeglądaj fiszki</Button>
        </div>
      </div>
    );
  }

  // Completion screen
  if (isComplete) {
    return <StudyComplete stats={sessionStats} onGoToDashboard={handleExit} onStudyMore={handleStudyMore} />;
  }

  // Current card
  const currentCard = cards[currentIndex];
  if (!currentCard) return null;

  return (
    <div className="space-y-8">
      {/* Header with progress and exit */}
      <div className="flex items-center justify-between">
        <StudyProgress current={sessionStats.reviewed} total={cards.length} />
        <Button variant="ghost" size="icon" onClick={handleExit} title="Zakończ (Escape)">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Flashcard display */}
      <FlashcardDisplay card={currentCard} isRevealed={isRevealed} />

      {/* Actions */}
      <div className="flex justify-center">
        {!isRevealed ? (
          <Button size="lg" onClick={handleReveal} className="min-w-[200px]">
            Pokaż odpowiedź
            <span className="ml-2 text-xs opacity-70 hidden sm:inline">(Spacja)</span>
          </Button>
        ) : (
          <RatingButtons onRating={handleRating} isSubmitting={reviewMutation.isPending} />
        )}
      </div>

      {/* Review error */}
      {reviewMutation.isError && (
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Nie udało się zapisać oceny. Spróbuj ponownie.</AlertDescription>
        </Alert>
      )}

      {/* Keyboard hints */}
      <div className="text-center text-xs text-muted-foreground">
        <p>Skróty klawiszowe: Spacja - pokaż odpowiedź, 1-4 - oceń, Escape - zakończ</p>
      </div>
    </div>
  );
}
