import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordFormData } from "../../lib/validation/auth.schema";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Loader2, CheckCircle2 } from "lucide-react";

/**
 * Change password form component
 * PRD: US-003 - Zmiana hasła
 */
export function ChangePasswordForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

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

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Nie udało się zmienić hasła");
      }

      // PRD US-003 AC: "Po zmianie użytkownik otrzymuje potwierdzenie"
      setSuccessMessage(result.data.message);
      reset(); // Clear form
      setIsSubmitting(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nie udało się zmienić hasła");
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zmiana hasła</CardTitle>
        <CardDescription>Zaktualizuj hasło do swojego konta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="size-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">{successMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Obecne hasło</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="••••••••"
              {...register("currentPassword")}
              disabled={isSubmitting}
              autoComplete="current-password"
            />
            {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nowe hasło</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              {...register("newPassword")}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
            {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Zmiana hasła...
              </>
            ) : (
              "Zmień hasło"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
