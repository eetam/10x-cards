"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { FlashcardFilters } from "./FlashcardFilters";
import { FlashcardsTable } from "./FlashcardsTable";
import { FlashcardsCards } from "./FlashcardsCards";
import { FlashcardsPagination } from "./FlashcardsPagination";
import { AddFlashcardDialog } from "./AddFlashcardDialog";
import { EditFlashcardDialog } from "./EditFlashcardDialog";
import { DeleteFlashcardDialog } from "./DeleteFlashcardDialog";
import { fetchFlashcards, deleteFlashcard } from "../../lib/api/flashcards";
import type { FlashcardsFiltersState, FlashcardListItem } from "./types";
import { DEFAULT_FILTERS } from "./types";

/**
 * Parse filters from URL search params
 */
function parseFiltersFromURL(): FlashcardsFiltersState {
  if (typeof window === "undefined") return DEFAULT_FILTERS;

  const params = new URLSearchParams(window.location.search);

  return {
    page: parseInt(params.get("page") ?? "1", 10) || 1,
    limit: parseInt(params.get("limit") ?? "25", 10) || 25,
    sort: (params.get("sort") as FlashcardsFiltersState["sort"]) ?? "createdAt",
    order: (params.get("order") as "asc" | "desc") ?? "desc",
    source: params.get("source") as FlashcardsFiltersState["source"] | undefined,
    state: params.get("state")
      ? (parseInt(params.get("state") ?? "0", 10) as FlashcardsFiltersState["state"])
      : undefined,
  };
}

/**
 * Update URL with new filters
 */
function updateURLWithFilters(filters: FlashcardsFiltersState) {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  params.set("sort", filters.sort);
  params.set("order", filters.order);
  if (filters.source) params.set("source", filters.source);
  if (filters.state !== undefined) params.set("state", String(filters.state));

  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newURL);
}

/**
 * Loading skeleton for the table
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
      ))}
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground mb-4">Nie masz jeszcze żadnych fiszek.</p>
      <div className="flex justify-center gap-2">
        <Button onClick={onAddClick}>
          <Plus className="mr-2 size-4" />
          Dodaj pierwszą fiszkę
        </Button>
        <Button variant="outline" asChild>
          <a href="/generate">Wygeneruj fiszki z AI</a>
        </Button>
      </div>
    </div>
  );
}

/**
 * Main flashcards list component
 */
export function FlashcardsList() {
  const queryClient = useQueryClient();

  // Filters state
  const [filters, setFilters] = React.useState<FlashcardsFiltersState>(() => parseFiltersFromURL());

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedFlashcard, setSelectedFlashcard] = React.useState<FlashcardListItem | null>(null);

  // Responsive state
  const [isMobile, setIsMobile] = React.useState(false);

  // Check for mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update URL when filters change
  React.useEffect(() => {
    updateURLWithFilters(filters);
  }, [filters]);

  // Fetch flashcards query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["flashcards", filters],
    queryFn: () =>
      fetchFlashcards({
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort,
        order: filters.order,
        source: filters.source,
        state: filters.state,
      }),
    placeholderData: (previousData) => previousData,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteFlashcard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
      setIsDeleteDialogOpen(false);
      setSelectedFlashcard(null);
    },
  });

  // Handlers
  const handleFiltersChange = (newFilters: Partial<FlashcardsFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleEdit = (flashcard: FlashcardListItem) => {
    setSelectedFlashcard(flashcard);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (flashcard: FlashcardListItem) => {
    setSelectedFlashcard(flashcard);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedFlashcard) {
      deleteMutation.mutate(selectedFlashcard.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Moje fiszki</h1>
          {data && <p className="text-muted-foreground text-sm">{data.pagination.total} fiszek łącznie</p>}
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          Dodaj fiszkę
        </Button>
      </div>

      {/* Filters */}
      <FlashcardFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Content */}
      {isLoading && <LoadingSkeleton />}

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Nie udało się pobrać fiszek. Spróbuj ponownie.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 size-4" />
              Ponów
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {data && data.data.length === 0 && !isLoading && <EmptyState onAddClick={() => setIsAddDialogOpen(true)} />}

      {data && data.data.length > 0 && (
        <>
          {isMobile ? (
            <FlashcardsCards flashcards={data.data} onEdit={handleEdit} onDelete={handleDelete} />
          ) : (
            <FlashcardsTable flashcards={data.data} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          <FlashcardsPagination pagination={data.pagination} onPageChange={handlePageChange} />
        </>
      )}

      {/* Dialogs */}
      <AddFlashcardDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />

      <EditFlashcardDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} flashcard={selectedFlashcard} />

      <DeleteFlashcardDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        flashcard={selectedFlashcard}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
