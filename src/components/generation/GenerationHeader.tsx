"use client";

import * as React from "react";
import type { GenerationDetailsResponse } from "../../types";
import { formatDate, formatISO8601Duration } from "../../lib/utils/date.utils";

interface GenerationHeaderProps {
  generation: GenerationDetailsResponse;
}

/**
 * Component displaying generation session information
 * Shows creation date, AI model, and generation duration
 */
export function GenerationHeader({ generation }: GenerationHeaderProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Przegląd propozycji fiszek</h1>
      <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-4">
        <div>
          <span className="font-medium">Data utworzenia:</span> {formatDate(generation.createdAt)}
        </div>
        <div>
          <span className="font-medium">Model AI:</span> {generation.model}
        </div>
        {generation.generationDuration && (
          <div>
            <span className="font-medium">Czas trwania:</span> {formatISO8601Duration(generation.generationDuration)}
          </div>
        )}
      </div>
    </div>
  );
}
