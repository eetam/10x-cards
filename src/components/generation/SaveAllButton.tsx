"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

interface SaveAllButtonProps {
  acceptedCount: number;
  isSaving: boolean;
  onSave: () => Promise<void>;
}

/**
 * Button for saving all accepted proposals
 * Disabled when there are no accepted proposals or during saving
 */
export function SaveAllButton({ acceptedCount, isSaving, onSave }: SaveAllButtonProps) {
  const isDisabled = acceptedCount === 0 || isSaving;

  return (
    <Button onClick={onSave} disabled={isDisabled} size="lg" className="w-full sm:w-auto" data-testid="save-all-button">
      {isSaving ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          <span className="hidden sm:inline">Zapisywanie...</span>
          <span className="sm:hidden">Zapisywanie</span>
        </>
      ) : (
        <>
          <span className="hidden sm:inline">Zapisz wszystkie zaakceptowane ({acceptedCount})</span>
          <span className="sm:hidden">Zapisz ({acceptedCount})</span>
        </>
      )}
    </Button>
  );
}
