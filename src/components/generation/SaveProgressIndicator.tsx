"use client";

import * as React from "react";
import { Progress } from "../ui/progress";

interface SaveProgressIndicatorProps {
  current: number;
  total: number;
  isVisible: boolean;
}

/**
 * Component displaying progress of saving all accepted proposals
 * Shows progress bar and text like "Zapisywanie 3 z 10"
 */
export function SaveProgressIndicator({ current, total, isVisible }: SaveProgressIndicatorProps) {
  if (!isVisible) {
    return null;
  }

  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Zapisywanie <span className="font-medium">{current}</span> z <span className="font-medium">{total}</span>
        </span>
        <span className="text-muted-foreground">{Math.round(percentage)}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
