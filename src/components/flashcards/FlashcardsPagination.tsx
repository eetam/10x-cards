"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "../ui/button";
import type { PaginationInfo } from "../../types";

interface FlashcardsPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

/**
 * Pagination component for flashcards list
 */
export function FlashcardsPagination({ pagination, onPageChange }: FlashcardsPaginationProps) {
  const { page, totalPages, total, limit } = pagination;

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers to display
  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return (
      <div className="text-sm text-muted-foreground text-center py-2">
        {total > 0 ? `Pokazuję ${total} ${total === 1 ? "fiszkę" : total < 5 ? "fiszki" : "fiszek"}` : "Brak fiszek"}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="text-sm text-muted-foreground">
        Pokazuję {startItem}-{endItem} z {total} fiszek
      </div>
      <div className="flex items-center gap-1">
        {/* First page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious}
          title="Pierwsza strona"
        >
          <ChevronsLeft className="size-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrevious}
          title="Poprzednia strona"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((pageNum, index) =>
            pageNum === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                size="icon"
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            )
          )}
        </div>

        {/* Mobile: show current page */}
        <span className="sm:hidden px-3 text-sm">
          {page} / {totalPages}
        </span>

        {/* Next page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          title="Następna strona"
        >
          <ChevronRight className="size-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          title="Ostatnia strona"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
