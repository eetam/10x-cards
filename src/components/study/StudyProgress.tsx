"use client";

import * as React from "react";
import { Progress } from "../ui/progress";

interface StudyProgressProps {
  current: number;
  total: number;
}

/**
 * Progress bar showing study session progress
 */
export function StudyProgress({ current, total }: StudyProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          {current} / {total}
        </span>
        <span>{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
