"use client";

import * as React from "react";

interface ProposalsCounterProps {
  total: number;
  accepted: number;
}

/**
 * Component displaying proposal counter (total and accepted)
 * Shows format like "5 z 10 zaakceptowanych"
 */
export function ProposalsCounter({ total, accepted }: ProposalsCounterProps) {
  return (
    <div className="text-sm text-muted-foreground">
      <span className="font-medium">{accepted}</span> z <span className="font-medium">{total}</span> zaakceptowanych
    </div>
  );
}
