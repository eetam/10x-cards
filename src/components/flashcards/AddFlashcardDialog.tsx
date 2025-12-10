"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { FlashcardForm } from "./FlashcardForm";
import { createFlashcard } from "../../lib/api/flashcards";
import type { FlashcardFormData } from "./types";
import type { CreateFlashcardRequest } from "../../types";

interface AddFlashcardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Dialog for adding a new flashcard manually
 */
export function AddFlashcardDialog({ open, onOpenChange, onSuccess }: AddFlashcardDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateFlashcardRequest) => createFlashcard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const handleSubmit = (data: FlashcardFormData) => {
    mutation.mutate({
      front: data.front,
      back: data.back,
      source: "manual",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Dodaj nową fiszkę</DialogTitle>
          <DialogDescription>Utwórz nową fiszkę wprowadzając pytanie (awers) i odpowiedź (rewers).</DialogDescription>
        </DialogHeader>
        <FlashcardForm
          onSubmit={handleSubmit}
          isSubmitting={mutation.isPending}
          submitLabel="Dodaj fiszkę"
          onCancel={() => onOpenChange(false)}
        />
        {mutation.isError && (
          <p className="text-sm text-destructive mt-2">Wystąpił błąd podczas dodawania fiszki. Spróbuj ponownie.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
