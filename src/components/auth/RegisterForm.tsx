import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "../../lib/validation/auth.schema";
import { useAuthStore } from "../../lib/stores/auth.store";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Loader2, CheckCircle2 } from "lucide-react";

/**
 * Registration form component
 * PRD: US-001 - Rejestracja konta przez e-mail/hasło
 * AC: "Po rejestracji następuje automatyczne logowanie"
 */
export function RegisterForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const register = useAuthStore((state) => state.register);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Handle redirect after successful registration
  useEffect(() => {
    if (shouldRedirect) {
      const timer = setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await register(data.email, data.password);

      if (result.requiresEmailConfirmation) {
        // Email confirmation required - show message
        setRequiresEmailConfirmation(true);
        setSuccessMessage("Sprawdź swoją skrzynkę email aby aktywować konto");
        setIsSubmitting(false);
      } else {
        // PRD US-001 AC: "Po rejestracji następuje automatyczne logowanie"
        // Auto-login successful, redirect to dashboard
        setSuccessMessage("Konto utworzone pomyślnie! Przekierowywanie...");
        setShouldRedirect(true);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Rejestracja nie powiodła się");
      setIsSubmitting(false);
    }
  };

  // If email confirmation is required, show only the success message
  if (requiresEmailConfirmation && successMessage) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="size-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">{successMessage}</AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <a href="/login" className="text-primary hover:underline">
            Przejdź do logowania
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Rejestracja</h1>
        <p className="text-muted-foreground">Utwórz nowe konto</p>
      </div>

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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="twoj@email.com"
            {...registerField("email")}
            disabled={isSubmitting}
            autoComplete="email"
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Hasło</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...registerField("password")}
            disabled={isSubmitting}
            autoComplete="new-password"
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...registerField("confirmPassword")}
            disabled={isSubmitting}
            autoComplete="new-password"
          />
          {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Tworzenie konta...
            </>
          ) : (
            "Zarejestruj się"
          )}
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Masz już konto? </span>
          <a href="/login" className="text-primary hover:underline">
            Zaloguj się
          </a>
        </div>
      </form>
    </div>
  );
}
