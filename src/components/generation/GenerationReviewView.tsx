"use client";

import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getGenerationDetails } from "../../lib/api/generations";
import { createFlashcard } from "../../lib/api/flashcards";
import { ApiClientError } from "../../lib/api/client";
import type {
  ProposalViewModel,
  FlashcardProposal,
  SaveProgressState,
  ApiError,
  CreateFlashcardRequest,
  FlashcardSource,
} from "../../types";
import { GenerationHeader } from "./GenerationHeader";
import { ProposalsCounter } from "./ProposalsCounter";
import { SaveAllButton } from "./SaveAllButton";
import { ProposalsList } from "./ProposalsList";
import { EditProposalDialog } from "./EditProposalDialog";
import { SaveProgressIndicator } from "./SaveProgressIndicator";
import { ErrorAlert } from "./ErrorAlert";
import { Loader2 } from "lucide-react";

interface GenerationReviewViewProps {
  generationId: string;
}

/**
 * Get proposals from sessionStorage
 * Proposals are stored after generation in GenerationForm
 */
function getProposalsFromStorage(generationId: string): FlashcardProposal[] | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = sessionStorage.getItem(`generation-${generationId}-proposals`);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Convert FlashcardProposal to ProposalViewModel with pending status
 */
function toProposalViewModel(proposal: FlashcardProposal): ProposalViewModel {
  return {
    ...proposal,
    status: "pending",
  };
}

/**
 * Main component for reviewing flashcard proposals
 * Manages state, API calls, and user interactions
 */
export function GenerationReviewView({ generationId }: GenerationReviewViewProps) {
  // State management
  const [proposals, setProposals] = React.useState<ProposalViewModel[]>([]);
  const [expandedBacks, setExpandedBacks] = React.useState<Set<number>>(new Set());
  const [editingProposalIndex, setEditingProposalIndex] = React.useState<number | null>(null);
  const [saveProgress, setSaveProgress] = React.useState<SaveProgressState>({
    isSaving: false,
    current: 0,
    total: 0,
    errors: [],
  });
  const [error, setError] = React.useState<ApiError | null>(null);

  // React Query for generation details
  const {
    data: generation,
    error: generationError,
    isLoading: isLoadingGeneration,
    refetch: refetchGeneration,
  } = useQuery({
    queryKey: ["generation", generationId],
    queryFn: () => getGenerationDetails(generationId),
    enabled: !!generationId,
    retry: 1,
  });

  // Load proposals from sessionStorage on mount
  React.useEffect(() => {
    const storedProposals = getProposalsFromStorage(generationId);
    if (storedProposals && storedProposals.length > 0) {
      setProposals(storedProposals.map(toProposalViewModel));
    } else {
      // If no proposals in storage, show error
      setError({
        message: "Nie znaleziono propozycji dla tej generacji. Spróbuj wygenerować fiszki ponownie.",
        code: "PROPOSALS_NOT_FOUND",
      });
    }
  }, [generationId]);

  // Handle API errors
  React.useEffect(() => {
    if (generationError) {
      if (generationError instanceof ApiClientError) {
        if (generationError.status === 401) {
          window.location.href = `/login?redirect=/generations/${generationId}`;
          return;
        }
        if (generationError.status === 404) {
          setError({
            message: "Generacja nie została znaleziona.",
            code: "NOT_FOUND",
          });
          return;
        }
      }
      setError({
        message:
          generationError instanceof Error ? generationError.message : "Wystąpił błąd podczas pobierania danych.",
        code: "API_ERROR",
      });
    }
  }, [generationError, generationId]);

  // Mutation for saving flashcards
  const saveFlashcardMutation = useMutation({
    mutationFn: (data: CreateFlashcardRequest) => createFlashcard(data),
  });

  // Calculate accepted count
  const acceptedCount = React.useMemo(
    () => proposals.filter((p) => p.status === "accepted" || p.status === "edited").length,
    [proposals]
  );

  // Handlers
  const handleToggleBack = React.useCallback((index: number) => {
    setExpandedBacks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleAccept = React.useCallback((index: number) => {
    setProposals((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], status: "accepted" };
      }
      return next;
    });
  }, []);

  const handleReject = React.useCallback((index: number) => {
    setProposals((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], status: "rejected" };
      }
      return next;
    });
  }, []);

  const handleEdit = React.useCallback((index: number) => {
    setEditingProposalIndex(index);
  }, []);

  const handleSaveEdit = React.useCallback(async (index: number, front: string, back: string) => {
    setProposals((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = {
          ...next[index],
          status: "edited",
          editedFront: front,
          editedBack: back,
        };
      }
      return next;
    });
    setEditingProposalIndex(null);
  }, []);

  const handleSaveAll = React.useCallback(async () => {
    const acceptedProposals = proposals.filter((p) => p.status === "accepted" || p.status === "edited");

    if (acceptedProposals.length === 0) {
      return;
    }

    setSaveProgress({
      isSaving: true,
      current: 0,
      total: acceptedProposals.length,
      errors: [],
    });

    const errors: SaveProgressState["errors"] = [];

    // Save all accepted proposals in parallel
    const savePromises = acceptedProposals.map(async (proposal, originalIndex) => {
      const source: FlashcardSource = proposal.status === "edited" ? "ai-edited" : "ai-full";
      const front = proposal.editedFront ?? proposal.front;
      const back = proposal.editedBack ?? proposal.back;

      try {
        await saveFlashcardMutation.mutateAsync({
          front,
          back,
          source,
          generationId,
        });

        setSaveProgress((prev) => ({
          ...prev,
          current: prev.current + 1,
        }));
      } catch (err) {
        const apiError: ApiError =
          err instanceof ApiClientError
            ? {
                message: err.message,
                code: err.code,
              }
            : {
                message: "Nie udało się zapisać fiszki.",
                code: "SAVE_ERROR",
              };

        errors.push({
          index: originalIndex,
          proposal,
          error: apiError,
        });

        setSaveProgress((prev) => ({
          ...prev,
          current: prev.current + 1,
          errors: [...prev.errors, ...errors],
        }));
      }
    });

    await Promise.all(savePromises);

    setSaveProgress((prev) => ({
      ...prev,
      isSaving: false,
    }));

    // Show success/error message
    if (errors.length === 0) {
      // All saved successfully - redirect to flashcards page
      window.location.href = "/flashcards";
    } else {
      alert(
        `Zapisano ${acceptedProposals.length - errors.length} z ${acceptedProposals.length} fiszek. ${errors.length} fiszki nie zostały zapisane.`
      );
    }
  }, [proposals, generationId, saveFlashcardMutation]);

  const handleRetry = React.useCallback(() => {
    setError(null);
    refetchGeneration();
  }, [refetchGeneration]);

  // Loading state
  if (isLoadingGeneration) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Ładowanie szczegółów generacji...</span>
      </div>
    );
  }

  // Error state
  if (error && !generation) {
    return (
      <div className="space-y-4">
        <ErrorAlert error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // No generation data
  if (!generation) {
    return (
      <div className="space-y-4">
        <ErrorAlert
          error={{
            message: "Nie udało się pobrać szczegółów generacji.",
            code: "LOAD_ERROR",
          }}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 sm:pb-12 md:pb-16">
      <GenerationHeader generation={generation} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ProposalsCounter total={proposals.length} accepted={acceptedCount} />
        <SaveAllButton acceptedCount={acceptedCount} isSaving={saveProgress.isSaving} onSave={handleSaveAll} />
      </div>
      <SaveProgressIndicator
        current={saveProgress.current}
        total={saveProgress.total}
        isVisible={saveProgress.isSaving}
      />
      {error && <ErrorAlert error={error} onRetry={handleRetry} />}
      <ProposalsList
        proposals={proposals}
        expandedBacks={expandedBacks}
        onToggleBack={handleToggleBack}
        onProposalStatusChange={(index, status) => {
          if (status === "accepted") {
            handleAccept(index);
          } else if (status === "rejected") {
            handleReject(index);
          }
        }}
        onProposalEdit={handleEdit}
      />
      {editingProposalIndex !== null && proposals[editingProposalIndex] && (
        <EditProposalDialog
          open={editingProposalIndex !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingProposalIndex(null);
            }
          }}
          proposal={proposals[editingProposalIndex]}
          proposalIndex={editingProposalIndex}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
