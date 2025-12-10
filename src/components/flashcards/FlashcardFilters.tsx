"use client";

import * as React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import type { FlashcardsFiltersState } from "./types";
import { SOURCE_LABELS, STATE_LABELS, SORT_LABELS } from "./types";
import type { FlashcardSource, FSRSState } from "../../types";

interface FlashcardFiltersProps {
  filters: FlashcardsFiltersState;
  onFiltersChange: (filters: Partial<FlashcardsFiltersState>) => void;
}

/**
 * Filters panel for flashcards list
 */
export function FlashcardFilters({ filters, onFiltersChange }: FlashcardFiltersProps) {
  const handleSourceChange = (value: string) => {
    onFiltersChange({
      source: value === "all" ? undefined : (value as FlashcardSource),
      page: 1, // Reset to first page when filter changes
    });
  };

  const handleStateChange = (value: string) => {
    onFiltersChange({
      state: value === "all" ? undefined : (parseInt(value) as FSRSState),
      page: 1,
    });
  };

  const handleSortChange = (value: string) => {
    onFiltersChange({
      sort: value as FlashcardsFiltersState["sort"],
      page: 1,
    });
  };

  const handleOrderToggle = () => {
    onFiltersChange({
      order: filters.order === "asc" ? "desc" : "asc",
    });
  };

  return (
    <div className="flex flex-wrap gap-4 items-end">
      {/* Source filter */}
      <div className="space-y-1.5">
        <Label htmlFor="source-filter" className="text-sm">
          Źródło
        </Label>
        <Select value={filters.source ?? "all"} onValueChange={handleSourceChange}>
          <SelectTrigger id="source-filter" className="w-[160px]">
            <SelectValue placeholder="Wszystkie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            {(Object.entries(SOURCE_LABELS) as [FlashcardSource, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* State filter */}
      <div className="space-y-1.5">
        <Label htmlFor="state-filter" className="text-sm">
          Stan
        </Label>
        <Select value={filters.state?.toString() ?? "all"} onValueChange={handleStateChange}>
          <SelectTrigger id="state-filter" className="w-[160px]">
            <SelectValue placeholder="Wszystkie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie</SelectItem>
            {(Object.entries(STATE_LABELS) as [string, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort select */}
      <div className="space-y-1.5">
        <Label htmlFor="sort-select" className="text-sm">
          Sortuj według
        </Label>
        <Select value={filters.sort} onValueChange={handleSortChange}>
          <SelectTrigger id="sort-select" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(SORT_LABELS) as [FlashcardsFiltersState["sort"], string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Order toggle */}
      <Button variant="outline" size="icon" onClick={handleOrderToggle} title={filters.order === "asc" ? "Rosnąco" : "Malejąco"}>
        {filters.order === "asc" ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
      </Button>
    </div>
  );
}
