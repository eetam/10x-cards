"use client";

import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { ChevronDown, Check, X, Edit } from "lucide-react";
import type { ProposalViewModel, ProposalStatus } from "../../types";
import { cn } from "../../lib/utils";

interface ProposalCardProps {
  proposal: ProposalViewModel;
  index: number;
  isBackExpanded: boolean;
  onToggleBack: (index: number) => void;
  onAccept: (index: number) => void;
  onEdit: (index: number) => void;
  onReject: (index: number) => void;
}

/**
 * Get status badge variant based on proposal status
 */
function getStatusBadgeVariant(status: ProposalStatus): "default" | "secondary" | "outline" {
  switch (status) {
    case "accepted":
      return "default";
    case "edited":
      return "secondary";
    case "rejected":
      return "outline";
    default:
      return "outline";
  }
}

/**
 * Get status label in Polish
 */
function getStatusLabel(status: ProposalStatus): string {
  switch (status) {
    case "pending":
      return "Oczekująca";
    case "accepted":
      return "Zaakceptowana";
    case "edited":
      return "Edytowana";
    case "rejected":
      return "Odrzucona";
    default:
      return "Nieznany";
  }
}

/**
 * Component for displaying a single proposal card
 * Shows front (always visible), back (collapsible), confidence badge, action buttons, and status
 */
export function ProposalCard({
  proposal,
  index,
  isBackExpanded,
  onToggleBack,
  onAccept,
  onEdit,
  onReject,
}: ProposalCardProps) {
  const displayFront = proposal.editedFront ?? proposal.front;
  const displayBack = proposal.editedBack ?? proposal.back;
  const isPending = proposal.status === "pending";

  return (
    <Card data-testid={`proposal-card-${index}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg" data-testid={`proposal-front-${index}`}>
            {displayFront}
          </CardTitle>
          <div className="flex items-center gap-2">
            {proposal.confidence !== undefined && (
              <Badge variant="outline" className="text-xs">
                {(proposal.confidence * 100).toFixed(0)}% pewności
              </Badge>
            )}
            <Badge variant={getStatusBadgeVariant(proposal.status)}>{getStatusLabel(proposal.status)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Collapsible open={isBackExpanded} onOpenChange={() => onToggleBack(index)}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span>{isBackExpanded ? "Ukryj odpowiedź" : "Pokaż odpowiedź"}</span>
              <ChevronDown className={cn("size-4 transition-transform", isBackExpanded && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="rounded-md border bg-muted/50 p-4 text-sm" data-testid={`proposal-back-${index}`}>
              {displayBack}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
      {isPending && (
        <CardFooter className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => onAccept(index)}
            className="flex-1"
            data-testid={`proposal-accept-${index}`}
          >
            <Check className="mr-2 size-4" />
            Akceptuj
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(index)}
            className="flex-1"
            data-testid={`proposal-edit-${index}`}
          >
            <Edit className="mr-2 size-4" />
            Edytuj
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject(index)}
            className="flex-1"
            data-testid={`proposal-reject-${index}`}
          >
            <X className="mr-2 size-4" />
            Odrzuć
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
