"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { CharacterCounter } from "../generation/CharacterCounter";
import { FlashcardFormSchema, MAX_FRONT_LENGTH, MAX_BACK_LENGTH } from "../../lib/validation/flashcard.schema";
import type { FlashcardFormData } from "./types";

interface FlashcardFormProps {
  defaultValues?: FlashcardFormData;
  onSubmit: (data: FlashcardFormData) => void;
  isSubmitting: boolean;
  submitLabel: string;
  onCancel?: () => void;
}

/**
 * Shared form component for creating and editing flashcards
 */
export function FlashcardForm({ defaultValues, onSubmit, isSubmitting, submitLabel, onCancel }: FlashcardFormProps) {
  const form = useForm<FlashcardFormData>({
    resolver: zodResolver(FlashcardFormSchema),
    defaultValues: defaultValues ?? {
      front: "",
      back: "",
    },
    mode: "onChange",
  });

  // Reset form when defaultValues change
  React.useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form]);

  const handleSubmit = (data: FlashcardFormData) => {
    onSubmit({
      front: data.front.trim(),
      back: data.back.trim(),
    });
  };

  const frontValue = form.watch("front");
  const backValue = form.watch("back");
  const frontLength = frontValue?.length ?? 0;
  const backLength = backValue?.length ?? 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="front"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Awers (pytanie)</FormLabel>
                <CharacterCounter current={frontLength} min={1} max={MAX_FRONT_LENGTH} />
              </div>
              <FormControl>
                <Input {...field} placeholder="Wprowadź pytanie..." maxLength={MAX_FRONT_LENGTH} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="back"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Rewers (odpowiedź)</FormLabel>
                <CharacterCounter current={backLength} min={1} max={MAX_BACK_LENGTH} />
              </div>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Wprowadź odpowiedź..."
                  maxLength={MAX_BACK_LENGTH}
                  className="min-h-[120px]"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Anuluj
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
