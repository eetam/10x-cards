"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { CheckCircle2, ArrowLeft, RefreshCw } from "lucide-react";

interface SessionStats {
  reviewed: number;
  again: number;
  hard: number;
  good: number;
  easy: number;
}

interface StudyCompleteProps {
  stats: SessionStats;
  onGoToDashboard: () => void;
  onStudyMore: () => void;
}

/**
 * Completion screen shown when study session is finished
 */
export function StudyComplete({ stats, onGoToDashboard, onStudyMore }: StudyCompleteProps) {
  const { reviewed, again, hard, good, easy } = stats;

  // Calculate accuracy (good + easy) / total
  const accuracy = reviewed > 0 ? Math.round(((good + easy) / reviewed) * 100) : 0;

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
        <h1 className="text-2xl font-bold">Sesja zakończona!</h1>
        <p className="text-muted-foreground">Gratulacje! Ukończyłeś wszystkie fiszki w tej sesji.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Podsumowanie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-3xl font-bold">{reviewed}</p>
              <p className="text-sm text-muted-foreground">Przejrzanych</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{accuracy}%</p>
              <p className="text-sm text-muted-foreground">Dokładność</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-2">Rozkład ocen:</p>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <p className="font-medium text-destructive">{again}</p>
                <p className="text-xs text-muted-foreground">Powtórz</p>
              </div>
              <div>
                <p className="font-medium text-orange-500">{hard}</p>
                <p className="text-xs text-muted-foreground">Trudne</p>
              </div>
              <div>
                <p className="font-medium text-green-500">{good}</p>
                <p className="text-xs text-muted-foreground">Dobrze</p>
              </div>
              <div>
                <p className="font-medium text-blue-500">{easy}</p>
                <p className="text-xs text-muted-foreground">Łatwe</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" className="flex-1" onClick={onGoToDashboard}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Dashboard
        </Button>
        <Button className="flex-1" onClick={onStudyMore}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Ucz się dalej
        </Button>
      </div>
    </div>
  );
}
