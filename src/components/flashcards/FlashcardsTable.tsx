"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import type { FlashcardListItem } from "./types";
import { SOURCE_LABELS, STATE_LABELS } from "./types";
import { formatRelativeDate } from "../../lib/utils/date.utils";
import type { FlashcardSource, FSRSState } from "../../types";

interface FlashcardsTableProps {
  flashcards: FlashcardListItem[];
  onEdit: (flashcard: FlashcardListItem) => void;
  onDelete: (flashcard: FlashcardListItem) => void;
}

/**
 * Truncate text to specified length
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
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

/**
 * Table view for flashcards (desktop)
 */
export function FlashcardsTable({ flashcards, onEdit, onDelete }: FlashcardsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[30%]">Awers</TableHead>
          <TableHead className="w-[30%]">Rewers</TableHead>
          <TableHead className="w-[10%]">Źródło</TableHead>
          <TableHead className="w-[10%]">Stan</TableHead>
          <TableHead className="w-[12%]">Termin</TableHead>
          <TableHead className="w-[8%] text-right">Akcje</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {flashcards.map((flashcard) => (
          <TableRow key={flashcard.id}>
            <TableCell className="font-medium">{truncateText(flashcard.front, 50)}</TableCell>
            <TableCell className="text-muted-foreground">{truncateText(flashcard.back, 50)}</TableCell>
            <TableCell>
              <Badge variant={getSourceVariant(flashcard.source as FlashcardSource)}>{SOURCE_LABELS[flashcard.source as FlashcardSource]}</Badge>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">{STATE_LABELS[flashcard.state as FSRSState]}</span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">{flashcard.due ? formatRelativeDate(flashcard.due) : "-"}</span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(flashcard)} title="Edytuj">
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(flashcard)} title="Usuń" className="text-destructive hover:text-destructive">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
