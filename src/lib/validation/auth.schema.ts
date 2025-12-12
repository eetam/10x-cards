import { z } from "zod";

/**
 * Schematy walidacji dla modułu autentykacji
 * Zgodne z PRD (zaktualizowane - usunięto restrykcyjne wymagania regex)
 *
 * PRD wymagania:
 * - US-001: "Walidacja formatu e-mail i minimalnej długości hasła (8 znaków)"
 * - US-002: Logowanie
 * - US-003: "Formularz wymaga podania starego i nowego hasła"
 * - US-004: "Operacja wymaga potwierdzenia hasłem"
 */

/**
 * Schemat walidacji logowania
 * PRD: US-002
 */
export const loginSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schemat walidacji rejestracji (client-side)
 * PRD: US-001 - "Walidacja formatu e-mail i minimalnej długości hasła (8 znaków)"
 *
 * UWAGA: Usunięto regex zgodnie z PRD - tylko minimalna długość
 */
export const registerSchema = z
  .object({
    email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email"),
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Schemat walidacji rejestracji (server-side)
 * Nie wymaga confirmPassword (walidowane tylko client-side)
 */
export const registerServerSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
});

/**
 * Schemat walidacji zmiany hasła
 * PRD: US-003 - "Formularz wymaga podania starego i nowego hasła"
 *
 * UWAGA: Uproszczono zgodnie z PRD (2 pola zamiast 3)
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Stare hasło jest wymagane"),
    newPassword: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Nowe hasło musi być inne niż obecne",
    path: ["newPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

/**
 * Schemat walidacji usunięcia konta
 * PRD: US-004 - "Operacja wymaga potwierdzenia hasłem"
 *
 * UWAGA: Uproszczono zgodnie z PRD (tylko hasło, bez checkboxa)
 */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Hasło jest wymagane"),
});

export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;

/**
 * ========================================
 * SCHEMATY ROZSZERZONE (dla lepszego UX)
 * ========================================
 * Poniższe schematy są opcjonalne i wykraczają poza wymagania PRD.
 * Mogą być użyte jeśli zespół UX uzna je za wartościowe.
 */

/**
 * Schemat walidacji zmiany hasła (rozszerzona wersja)
 * Dodaje pole potwierdzenia mimo że PRD tego nie wymaga
 */
export const changePasswordSchemaExtended = z
  .object({
    currentPassword: z.string().min(1, "Stare hasło jest wymagane"),
    newPassword: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Nowe hasło musi być inne niż obecne",
    path: ["newPassword"],
  });

/**
 * Schemat walidacji usunięcia konta (rozszerzona wersja)
 * Dodaje checkbox mimo że PRD tego nie wymaga
 */
export const deleteAccountSchemaExtended = z.object({
  password: z.string().min(1, "Hasło jest wymagane"),
  confirmation: z.boolean().refine((val) => val === true, {
    message: "Musisz potwierdzić usunięcie konta",
  }),
});

/**
 * ========================================
 * OPCJONALNE - FUNKCJONALNOŚCI POZA MVP
 * ========================================
 * Poniższe schematy są dla funkcjonalności forget/reset password,
 * które NIE SĄ wymagane przez PRD MVP.
 */

/**
 * Schemat walidacji odzyskiwania hasła (OPCJONALNY - poza MVP)
 */
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Schemat walidacji resetowania hasła (OPCJONALNY - poza MVP)
 */
export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
