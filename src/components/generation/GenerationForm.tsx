import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CreateGenerationRequest, ApiError } from "../../types";
import {
  GenerationFormSchema,
  MIN_TEXT_LENGTH,
  MAX_TEXT_LENGTH,
  DEFAULT_MODEL,
} from "../../lib/validation/generation.schema";
import { generateFlashcards } from "../../lib/api/generations";
import { ApiClientError } from "../../lib/api/client";
import { CharacterCounter } from "./CharacterCounter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Progress } from "../ui/progress";
import { AlertCircle, Loader2 } from "lucide-react";

/**
 * Helper function to map API error codes to user-friendly messages
 */
function getErrorMessage(error: ApiError): string {
  const errorMessages: Record<string, string> = {
    VALIDATION_ERROR: "Nieprawidłowe dane. Sprawdź formularz.",
    RATE_LIMIT_EXCEEDED: "Zbyt wiele requestów. Spróbuj za chwilę.",
    CONCURRENT_LIMIT_EXCEEDED: "Zbyt wiele równoczesnych generacji. Poczekaj na zakończenie poprzednich.",
    NETWORK_ERROR: "Brak połączenia z internetem. Sprawdź połączenie.",
    UNKNOWN_ERROR: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
  };

  return errorMessages[error.code || ""] || error.message || "Wystąpił błąd. Spróbuj ponownie.";
}

/**
 * Generation form component for creating flashcards from source text
 */
export function GenerationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [showLongOperationMessage, setShowLongOperationMessage] = useState(false);

  const form = useForm<CreateGenerationRequest>({
    resolver: zodResolver(GenerationFormSchema),
    defaultValues: {
      sourceText: "",
    },
    mode: "onChange",
  });

  // Watch sourceText for character counter
  const sourceText = useWatch({
    control: form.control,
    name: "sourceText",
    defaultValue: "",
  });

  const sourceTextLength = sourceText?.length || 0;

  // Check if form is valid for button state
  const isFormValid =
    form.formState.isValid && sourceTextLength >= MIN_TEXT_LENGTH && sourceTextLength <= MAX_TEXT_LENGTH;

  const onSubmit = async (data: CreateGenerationRequest) => {
    setIsSubmitting(true);
    setError(null);
    setShowLongOperationMessage(false);

    // Show long operation message after 5 seconds
    const longOperationTimer = setTimeout(() => {
      setShowLongOperationMessage(true);
    }, 5000);

    try {
      // Trim sourceText before sending
      // Model is not sent - API will use default model
      const trimmedData: CreateGenerationRequest = {
        sourceText: data.sourceText.trim(),
      };

      const response = await generateFlashcards(trimmedData);

      clearTimeout(longOperationTimer);

      // Save proposals to sessionStorage for the review view
      if (response.proposals && response.proposals.length > 0) {
        try {
          sessionStorage.setItem(`generation-${response.generationId}-proposals`, JSON.stringify(response.proposals));
        } catch {
          // Ignore storage errors
        }
      }

      // Redirect to generation details page
      window.location.href = `/generations/${response.generationId}`;
    } catch (err) {
      clearTimeout(longOperationTimer);

      if (err instanceof ApiClientError) {
        const apiError: ApiError = {
          message: err.message,
          code: err.code,
        };

        setError(apiError);

        // Handle authorization errors
        if (err.status === 401) {
          window.location.href = `/login?redirect=/generate`;
          return;
        }

        // Handle field-specific errors (if API returns field in error)
        // This would require API to return field in error response
        // For now, we just show the error in Alert
      } else {
        setError({
          message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
          code: "UNKNOWN_ERROR",
        });
      }
    } finally {
      setIsSubmitting(false);
      setShowLongOperationMessage(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Source Text Field */}
        <FormField
          control={form.control}
          name="sourceText"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel htmlFor="sourceText">Tekst źródłowy</FormLabel>
              <FormControl>
                <Textarea
                  id="sourceText"
                  data-testid="generation-source-text"
                  placeholder="Wklej tekst (1000-10000 znaków)..."
                  disabled={isSubmitting}
                  className="min-h-[200px] resize-y"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.invalid ? "sourceText-error" : "sourceText-counter"}
                  {...field}
                />
              </FormControl>
              <div className="flex items-center justify-between">
                <CharacterCounter current={sourceTextLength} min={MIN_TEXT_LENGTH} max={MAX_TEXT_LENGTH} />
                <span id="sourceText-counter" className="sr-only">
                  {sourceTextLength} znaków z zakresu {MIN_TEXT_LENGTH}-{MAX_TEXT_LENGTH}
                </span>
              </div>
              <FormMessage id="sourceText-error" />
            </FormItem>
          )}
        />

        {/* Model Information */}
        <div className="text-sm text-muted-foreground">
          Używany model AI: <span className="font-medium">{DEFAULT_MODEL}</span>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" data-testid="generation-error-alert">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
          </Alert>
        )}

        {/* Long Operation Message */}
        {showLongOperationMessage && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>To może zająć do 30 sekund. Proszę czekać...</AlertDescription>
          </Alert>
        )}

        {/* Progress Indicator (optional, shown during submission) */}
        {isSubmitting && <Progress value={undefined} className="h-2" />}

        {/* Submit Button */}
        <Button
          type="submit"
          data-testid="generation-submit-button"
          disabled={isSubmitting || !isFormValid}
          className="w-full"
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generowanie...
            </>
          ) : (
            "Generuj"
          )}
        </Button>
      </form>
    </Form>
  );
}
