"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { CharacterCounter } from "./CharacterCounter";
import { Loader2 } from "lucide-react";
import type { FlashcardProposal, EditProposalFormData } from "../../types";
import { EditProposalSchema, MAX_FRONT_LENGTH, MAX_BACK_LENGTH } from "../../lib/validation/proposal.schema";

interface EditProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: FlashcardProposal;
  proposalIndex: number;
  onSave: (index: number, front: string, back: string) => Promise<void>;
}

/**
 * Dialog component for editing a proposal
 * Contains form with front and back fields, validation, and character counters
 * After saving, proposal is automatically accepted
 */
export function EditProposalDialog({
  open,
  onOpenChange,
  proposal,
  proposalIndex,
  onSave,
}: EditProposalDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<EditProposalFormData>({
    resolver: zodResolver(EditProposalSchema),
    defaultValues: {
      front: proposal.front,
      back: proposal.back,
    },
    mode: "onChange",
  });

  // Reset form when proposal changes or dialog opens
  React.useEffect(() => {
    if (open) {
      form.reset({
        front: proposal.front,
        back: proposal.back,
      });
    }
  }, [open, proposal, form]);

  const onSubmit = async (data: EditProposalFormData) => {
    setIsSaving(true);
    try {
      await onSave(proposalIndex, data.front.trim(), data.back.trim());
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSaving(false);
    }
  };

  const frontValue = form.watch("front");
  const backValue = form.watch("back");
  const frontLength = frontValue?.length ?? 0;
  const backLength = backValue?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edytuj propozycję fiszki</DialogTitle>
          <DialogDescription>Wprowadź zmiany w awersie i rewersie fiszki. Po zapisaniu propozycja zostanie automatycznie zaakceptowana.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <Input {...field} placeholder="Wprowadź pytanie..." maxLength={MAX_FRONT_LENGTH} />
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isSaving || !form.formState.isValid}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Zapisywanie...
                  </>
                ) : (
                  "Zapisz"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

