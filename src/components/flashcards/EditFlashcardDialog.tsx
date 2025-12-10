"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { FlashcardForm } from "./FlashcardForm";
import { updateFlashcard } from "../../lib/api/flashcards";
import type { FlashcardFormData, FlashcardListItem } from "./types";

interface EditFlashcardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flashcard: FlashcardListItem | null;
  onSuccess?: () => void;
}

/**
 * Dialog for editing an existing flashcard
 */
export function EditFlashcardDialog({ open, onOpenChange, flashcard, onSuccess }: EditFlashcardDialogProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: FlashcardFormData) => {
      if (!flashcard) throw new Error("No flashcard selected");
      return updateFlashcard(flashcard.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
      onOpenChange(false);
      onSuccess?.();
    },
  });

  const handleSubmit = (data: FlashcardFormData) => {
    mutation.mutate(data);
  };

  if (!flashcard) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <DialogDescription>Wprowadź zmiany w awersie i rewersie fiszki.</DialogDescription>
        </DialogHeader>
        <FlashcardForm
          defaultValues={{
            front: flashcard.front,
            back: flashcard.back,
          }}
          onSubmit={handleSubmit}
          isSubmitting={mutation.isPending}
          submitLabel="Zapisz zmiany"
          onCancel={() => onOpenChange(false)}
        />
        {mutation.isError && <p className="text-sm text-destructive mt-2">Wystąpił błąd podczas zapisywania zmian. Spróbuj ponownie.</p>}
      </DialogContent>
    </Dialog>
  );
}
