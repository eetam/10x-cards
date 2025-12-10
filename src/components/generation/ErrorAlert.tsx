"use client";

import * as React from "react";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import type { ApiError } from "../../types";
import { Button } from "../ui/button";

interface ErrorAlertProps {
  error: ApiError | null;
  onRetry?: () => void;
}

/**
 * Component displaying API errors
 * Shows error message with optional retry button
 */
export function ErrorAlert({ error, onRetry }: ErrorAlertProps) {
  if (!error) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error.message || "Wystąpił błąd. Spróbuj ponownie."}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
            Spróbuj ponownie
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
