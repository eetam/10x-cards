import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deleteAccountSchema, type DeleteAccountFormData } from "../../lib/validation/auth.schema";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Loader2, AlertTriangle } from "lucide-react";

/**
 * Delete account section component
 * PRD: US-004 - Usunięcie konta
 */
export function DeleteAccountSection() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
  });

  const onConfirmDelete = async (data: DeleteAccountFormData) => {
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      // Get JWT token from Supabase session
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        import.meta.env.PUBLIC_SUPABASE_URL || "",
        import.meta.env.PUBLIC_SUPABASE_KEY || ""
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Sesja wygasła. Zaloguj się ponownie");
      }

      const response = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Nie udało się usunąć konta");
      }

      // Account deleted successfully, redirect to home
      window.location.href = "/";
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nie udało się usunąć konta");
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    reset();
    setErrorMessage(null);
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Strefa niebezpieczna</CardTitle>
        <CardDescription>Trwale usuń swoje konto i wszystkie dane</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            <strong>Ostrzeżenie:</strong> Ta operacja jest nieodwracalna. Wszystkie twoje fiszki, generacje i dane
            zostaną trwale usunięte.
          </AlertDescription>
        </Alert>

        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Usuń konto</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Czy na pewno chcesz usunąć konto?</AlertDialogTitle>
              <AlertDialogDescription>
                Ta operacja jest nieodwracalna. Wszystkie twoje dane zostaną trwale usunięte i nie będzie możliwości ich
                odzyskania.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form onSubmit={handleSubmit(onConfirmDelete)} className="space-y-4">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Potwierdź hasłem</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Wprowadź swoje hasło"
                  {...register("password")}
                  disabled={isDeleting}
                  autoComplete="current-password"
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>
                  Anuluj
                </AlertDialogCancel>
                <Button type="submit" variant="destructive" disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Usuwanie...
                    </>
                  ) : (
                    "Usuń konto"
                  )}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
