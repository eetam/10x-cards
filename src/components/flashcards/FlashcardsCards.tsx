"use client";

import * as React from "react";
import { Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import type { FlashcardListItem } from "./types";
import { SOURCE_LABELS, STATE_LABELS } from "./types";
import { formatRelativeDate } from "../../lib/utils/date.utils";
import type { FlashcardSource, FSRSState } from "../../types";

interface FlashcardsCardsProps {
  flashcards: FlashcardListItem[];
  onEdit: (flashcard: FlashcardListItem) => void;
  onDelete: (flashcard: FlashcardListItem) => void;
}

/**
 * Get badge variant based on source
 */
function getSourceVariant(source: FlashcardSource): "default" | "secondary" | "outline" {
  switch (source) {
    case "ai-full":
      return "default";
    case "ai-edited":
      return "secondary";
    case "manual":
      return "outline";
    default:
      return "outline";
  }
}

interface FlashcardCardItemProps {
  flashcard: FlashcardListItem;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Single flashcard card component
 */
function FlashcardCardItem({ flashcard, onEdit, onDelete }: FlashcardCardItemProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium leading-snug">{flashcard.front}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Badge variant={getSourceVariant(flashcard.source as FlashcardSource)} className="text-xs">
                {SOURCE_LABELS[flashcard.source as FlashcardSource]}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-2">
            <div className="bg-muted/50 rounded-md p-3 text-sm text-muted-foreground">{flashcard.back}</div>
          </CardContent>
        </CollapsibleContent>
        <CardFooter className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{STATE_LABELS[flashcard.state as FSRSState]}</span>
            {flashcard.due && (
              <>
                <span>•</span>
                <span>{formatRelativeDate(flashcard.due)}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                <span className="ml-1 text-xs">{isOpen ? "Zwiń" : "Pokaż"}</span>
              </Button>
            </CollapsibleTrigger>
            <Button variant="ghost" size="icon" onClick={onEdit} title="Edytuj">
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} title="Usuń" className="text-destructive hover:text-destructive">
              <Trash2 className="size-4" />
            </Button>
          </div>
        </CardFooter>
      </Collapsible>
    </Card>
  );
}

/**
 * Cards view for flashcards (mobile)
 */
export function FlashcardsCards({ flashcards, onEdit, onDelete }: FlashcardsCardsProps) {
  return (
    <div className="space-y-3">
      {flashcards.map((flashcard) => (
        <FlashcardCardItem key={flashcard.id} flashcard={flashcard} onEdit={() => onEdit(flashcard)} onDelete={() => onDelete(flashcard)} />
      ))}
    </div>
  );
}
