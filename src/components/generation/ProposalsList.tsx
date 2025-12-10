"use client";

import * as React from "react";
import { ProposalCard } from "./ProposalCard";
import type { ProposalViewModel, ProposalStatus } from "../../types";

interface ProposalsListProps {
  proposals: ProposalViewModel[];
  expandedBacks: Set<number>;
  onToggleBack: (index: number) => void;
  onProposalStatusChange: (index: number, status: ProposalStatus) => void;
  onProposalEdit: (index: number) => void;
}

/**
 * Component rendering list of proposal cards
 * Uses grid layout for responsive design
 */
export function ProposalsList({
  proposals,
  expandedBacks,
  onToggleBack,
  onProposalStatusChange,
  onProposalEdit,
}: ProposalsListProps) {
  const handleAccept = (index: number) => {
    onProposalStatusChange(index, "accepted");
  };

  const handleReject = (index: number) => {
    onProposalStatusChange(index, "rejected");
  };

  const handleEdit = (index: number) => {
    onProposalEdit(index);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
      {proposals.map((proposal, index) => (
        <ProposalCard
          key={index}
          proposal={proposal}
          index={index}
          isBackExpanded={expandedBacks.has(index)}
          onToggleBack={onToggleBack}
          onAccept={handleAccept}
          onEdit={handleEdit}
          onReject={handleReject}
        />
      ))}
    </div>
  );
}
