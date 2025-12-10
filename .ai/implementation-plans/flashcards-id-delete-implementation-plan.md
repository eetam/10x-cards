# API Endpoint Implementation Plan: Delete Flashcard

## 1. Przegląd punktu końcowego

Endpoint DELETE `/api/flashcards/{flashcardId}` umożliwia użytkownikowi usunięcie pojedynczej fiszki ze swojej kolekcji. Endpoint jest chroniony autentykacją i wykorzystuje Row-Level Security (RLS) w bazie danych, aby zapewnić, że użytkownicy mogą usuwać wyłącznie swoje własne fiszki.

**Funkcjonalność:**
- Usuwa fiszkę z bazy danych na podstawie identyfikatora
- Weryfikuje autentykację użytkownika
- Sprawdza istnienie fiszki przed usunięciem
- Zwraca prostą wiadomość potwierdzającą usunięcie

**Lokalizacja implementacji:**
- Plik: `src/pages/api/flashcards/[flashcardId]/index.ts`
- Metoda: `DELETE` (do dodania obok istniejących metod `GET` i `PUT`)

---

## 2. Szczegóły żądania

### Metoda HTTP
`DELETE`

### Struktura URL
```
/api/flashcards/{flashcardId}
```

### Parametry ścieżki

**Wymagane:**
- `flashcardId` (string, UUID) - Identyfikator fiszki do usunięcia
  - Format: UUID v4
  - Walidacja: Musi być poprawnym UUID
  - Przykład: `550e8400-e29b-41d4-a716-446655440000`

### Request Body
Brak (DELETE nie wymaga body)

### Headers

**Wymagane:**
- `Authorization: Bearer <token>` - Token JWT użytkownika (wymagany w trybie produkcyjnym)

**Opcjonalne:**
- `Content-Type: application/json` - Standardowy header dla API

---

## 3. Wykorzystywane typy

### DTOs i Command Modele

**Brak dedykowanych DTOs** - Endpoint DELETE nie wymaga specjalnych typów DTO, ponieważ:
- Nie przyjmuje danych wejściowych (oprócz parametru ścieżki)
- Zwraca prostą odpowiedź z komunikatem tekstowym

**Wykorzystywane typy z istniejącego kodu:**
- `Flashcard` - Typ z `src/types.ts` (używany wewnętrznie w serwisie do weryfikacji istnienia)
- `ApiError` - Typ z `src/types.ts` (używany przez `ResponseUtils`)

### Schematy walidacji Zod

```typescript
const FlashcardIdSchema = z.string().uuid("Invalid flashcard ID format");
```

**Uwaga:** Ten schemat już istnieje w pliku `src/pages/api/flashcards/[flashcardId]/index.ts` i może być ponownie wykorzystany.

---

## 4. Szczegóły odpowiedzi

### Sukces: 200 OK

**Response Body:**
```json
{
  "data": {
    "message": "Flashcard deleted successfully"
  },
  "success": true
}
```

**Struktura:**
- `data.message` (string) - Komunikat potwierdzający usunięcie
- `success` (boolean) - Flaga sukcesu (zawsze `true`)

### Błędy

#### 401 Unauthorized
**Przyczyna:** Brak tokenu autentykacji lub nieprawidłowy/wygasły token

**Response Body:**
```json
{
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  },
  "success": false
}
```

#### 404 Not Found
**Przyczyna:** Fiszka o podanym ID nie istnieje lub nie należy do użytkownika

**Response Body:**
```json
{
  "error": {
    "message": "Flashcard not found",
    "code": "NOT_FOUND"
  },
  "success": false
}
```

#### 400 Bad Request
**Przyczyna:** Nieprawidłowy format UUID w parametrze `flashcardId`

**Response Body:**
```json
{
  "error": {
    "message": "Invalid flashcard ID format",
    "code": "VALIDATION_ERROR",
    "field": "flashcardId"
  },
  "success": false
}
```

#### 500 Internal Server Error
**Przyczyna:** Błąd bazy danych lub nieoczekiwany błąd serwera

**Response Body:**
```json
{
  "error": {
    "message": "Internal server error",
    "code": "INTERNAL_ERROR"
  },
  "success": false
}
```

---

## 5. Przepływ danych

### Diagram przepływu

```
1. Request → DELETE /api/flashcards/{flashcardId}
   ↓
2. Walidacja autentykacji (AuthUtils.verifyToken)
   ↓
3. Walidacja parametru flashcardId (Zod schema)
   ↓
4. Weryfikacja istnienia fiszki (FlashcardService.getFlashcardById)
   ↓
5. Usunięcie fiszki (FlashcardService.deleteFlashcard)
   ↓
6. Zwrócenie odpowiedzi sukcesu (ResponseUtils.createSuccessResponse)
```

### Szczegółowy przepływ

1. **Otrzymanie żądania**
   - Astro przekazuje żądanie do handlera `DELETE`
   - Parametr `flashcardId` jest dostępny w `params.flashcardId`

2. **Walidacja autentykacji**
   - Sprawdzenie obecności nagłówka `Authorization`
   - Wyodrębnienie tokenu Bearer
   - Weryfikacja tokenu przez Supabase Auth
   - Pobranie `userId` z tokenu
   - **Obsługa trybu deweloperskiego:** Jeśli `EnvConfig.getDefaultUserId()` zwraca wartość, użyj jej zamiast normalnej autentykacji

3. **Walidacja parametru ścieżki**
   - Sprawdzenie obecności `flashcardId`
   - Walidacja formatu UUID za pomocą Zod schema
   - Zwrócenie błędu 400 w przypadku nieprawidłowego formatu

4. **Weryfikacja istnienia fiszki**
   - Wywołanie `FlashcardService.getFlashcardById(flashcardId, userId)`
   - Sprawdzenie czy fiszka istnieje i należy do użytkownika
   - Zwrócenie błędu 404 jeśli fiszka nie istnieje

5. **Usunięcie fiszki**
   - Wywołanie `FlashcardService.deleteFlashcard(flashcardId, userId)`
   - RLS w bazie danych automatycznie zapewnia, że tylko właściciel może usunąć fiszkę
   - Obsługa błędów bazy danych

6. **Zwrócenie odpowiedzi**
   - Utworzenie odpowiedzi sukcesu z komunikatem
   - Zwrócenie statusu 200 OK

### Interakcje z bazą danych

**Tabela:** `flashcards`

**Operacja:** `DELETE FROM flashcards WHERE id = ? AND user_id = ?`

**RLS (Row-Level Security):**
- Polityka RLS automatycznie filtruje zapytania według `user_id`
- Użytkownik może usunąć tylko swoje własne fiszki
- Próba usunięcia cudzej fiszki zwróci 0 wierszy (traktowane jako 404)

**Klucze obce:**
- `generation_id` - Relacja z tabelą `generations` z `ON DELETE SET NULL`
  - Usunięcie fiszki nie wpływa na sesję generowania
- `user_id` - Relacja z `auth.users` z `ON DELETE CASCADE`
  - Usunięcie użytkownika automatycznie usuwa wszystkie jego fiszki (obsługiwane przez Supabase)

---

## 6. Względy bezpieczeństwa

### Autentykacja

**Mechanizm:**
- JWT token w nagłówku `Authorization: Bearer <token>`
- Weryfikacja tokenu przez Supabase Auth API
- Token musi być ważny i nie wygasły

**Implementacja:**
- Użycie `AuthUtils.verifyToken()` do weryfikacji
- Obsługa trybu deweloperskiego z `EnvConfig.getDefaultUserId()` (tylko w środowisku development)

### Autoryzacja

**Mechanizm:**
- Row-Level Security (RLS) w bazie danych PostgreSQL
- Polityka RLS: `auth.uid() = user_id`
- Użytkownik może operować tylko na swoich własnych fiszkach

**Dodatkowa weryfikacja:**
- Przed usunięciem sprawdzamy istnienie fiszki z `user_id`
- Jeśli fiszka nie istnieje lub nie należy do użytkownika, zwracamy 404
- To zapewnia spójność z oczekiwaniami API (404 zamiast 403)

### Walidacja danych wejściowych

**Parametr ścieżki:**
- Walidacja formatu UUID za pomocą Zod
- Ochrona przed SQL injection (Supabase używa parametryzowanych zapytań)
- Ochrona przed nieprawidłowymi danymi

**Brak danych wrażliwych:**
- Endpoint nie przyjmuje danych wrażliwych w body
- Wszystkie dane są przekazywane przez parametr ścieżki

### Rate Limiting (przyszłość)

**Uwaga:** Obecnie nie ma implementacji rate limitingu, ale można rozważyć:
- Ograniczenie liczby żądań DELETE na użytkownika w jednostce czasu
- Implementacja w middleware lub na poziomie Supabase

### Logowanie

**Zalecane:**
- Logowanie operacji usunięcia w trybie deweloperskim
- W trybie produkcyjnym: rozważyć logowanie do systemu audytu (opcjonalne)

---

## 7. Obsługa błędów

### Scenariusze błędów i kody statusu

| Scenariusz | Kod statusu | Komunikat | Kod błędu |
|------------|-------------|-----------|-----------|
| Brak tokenu autentykacji | 401 | "Authentication required" | UNAUTHORIZED |
| Nieprawidłowy/wygasły token | 401 | "Invalid or expired token" | UNAUTHORIZED |
| Brak parametru flashcardId | 400 | "Flashcard ID is required" | VALIDATION_ERROR |
| Nieprawidłowy format UUID | 400 | "Invalid flashcard ID format" | VALIDATION_ERROR |
| Fiszka nie istnieje | 404 | "Flashcard not found" | NOT_FOUND |
| Fiszka należy do innego użytkownika | 404 | "Flashcard not found" | NOT_FOUND |
| Błąd bazy danych | 500 | "Internal server error" | INTERNAL_ERROR |
| Nieoczekiwany błąd | 500 | "Internal server error" | INTERNAL_ERROR |

### Szczegółowa obsługa błędów

#### Błędy autentykacji (401)

**Scenariusz 1: Brak nagłówka Authorization**
```typescript
if (!token) {
  return ResponseUtils.createAuthErrorResponse("Authentication required");
}
```

**Scenariusz 2: Nieprawidłowy token**
```typescript
if (authError || !user) {
  return ResponseUtils.createAuthErrorResponse(
    authError?.message || "Invalid or expired token"
  );
}
```

#### Błędy walidacji (400)

**Scenariusz 1: Brak parametru**
```typescript
if (!flashcardId) {
  return ResponseUtils.createValidationErrorResponse(
    "Flashcard ID is required",
    "flashcardId"
  );
}
```

**Scenariusz 2: Nieprawidłowy format UUID**
```typescript
const validationResult = FlashcardIdSchema.safeParse(flashcardId);
if (!validationResult.success) {
  return ResponseUtils.createValidationErrorResponse(
    "Invalid flashcard ID format",
    "flashcardId"
  );
}
```

#### Błędy nie znalezionych zasobów (404)

**Scenariusz: Fiszka nie istnieje lub nie należy do użytkownika**
```typescript
const { flashcard, error: fetchError } = await flashcardService.getFlashcardById(
  validatedFlashcardId,
  userId
);

if (fetchError) {
  return ResponseUtils.createInternalErrorResponse(
    `Failed to fetch flashcard: ${fetchError.message}`
  );
}

if (!flashcard) {
  return ResponseUtils.createErrorResponse(
    "Flashcard not found",
    "NOT_FOUND",
    404
  );
}
```

**Uwaga:** RLS automatycznie filtruje fiszki według `user_id`, więc próba usunięcia cudzej fiszki zwróci `null` (traktowane jako 404).

#### Błędy serwera (500)

**Scenariusz 1: Błąd bazy danych podczas usuwania**
```typescript
const { error: deleteError } = await flashcardService.deleteFlashcard(
  validatedFlashcardId,
  userId
);

if (deleteError) {
  return ResponseUtils.createInternalErrorResponse(
    `Failed to delete flashcard: ${deleteError.message}`
  );
}
```

**Scenariusz 2: Nieoczekiwany błąd**
```typescript
catch (error) {
  if (import.meta.env.NODE_ENV === "development" && error instanceof Error) {
    console.error("Error in DELETE /api/flashcards/[flashcardId]:", error.message);
    console.error(error.stack);
  }
  return ResponseUtils.createInternalErrorResponse();
}
```

### Obsługa błędów w serwisie

**FlashcardService.deleteFlashcard()** powinien:
- Zwracać `{ success: boolean; error: Error | null }`
- Obsługiwać kod błędu `PGRST116` (no rows found) jako sukces (RLS już zapewnił bezpieczeństwo)
- Logować inne błędy bazy danych

---

## 8. Rozważania dotyczące wydajności

### Optymalizacje zapytań

**Indeksy w bazie danych:**
- `idx_flashcards_user_id` - Optymalizuje filtrowanie po `user_id` (RLS)
- `idx_flashcards_due` - Nie jest bezpośrednio używany w DELETE, ale istnieje dla innych operacji
- `PRIMARY KEY (id)` - Natywny indeks dla szybkiego wyszukiwania po ID

**Wydajność DELETE:**
- Operacja DELETE jest wydajna dzięki indeksowi PRIMARY KEY na `id`
- RLS dodaje warunek `user_id = auth.uid()`, który jest zoptymalizowany przez `idx_flashcards_user_id`
- Operacja jest atomowa (transakcja)

### Potencjalne wąskie gardła

1. **Weryfikacja istnienia przed usunięciem**
   - Wymaga dodatkowego zapytania SELECT
   - **Rozwiązanie:** Można pominąć weryfikację i polegać na RLS + sprawdzeniu liczby usuniętych wierszy
   - **Zalecenie:** Zachować weryfikację dla lepszych komunikatów błędów (404 vs 500)

2. **Częste usuwanie**
   - Jeśli użytkownik często usuwa fiszki, może to wpływać na wydajność
   - **Rozwiązanie:** Rozważyć soft delete (opcjonalne w przyszłości)
   - **Aktualnie:** Hard delete jest wystarczający dla MVP

### Cache (nie dotyczy)

- Endpoint DELETE nie wymaga cache'owania
- Operacja modyfikuje dane, więc cache powinien być invalidowany (jeśli istnieje)

### Monitoring

**Zalecane metryki:**
- Czas odpowiedzi endpointu DELETE
- Liczba błędów 404 vs 500
- Częstotliwość wywołań DELETE per użytkownik

---

## 9. Etapy wdrożenia

### Krok 1: Dodanie metody deleteFlashcard do FlashcardService

**Plik:** `src/lib/services/flashcard.service.ts`

**Implementacja:**
```typescript
/**
 * Delete a flashcard by ID for the user
 * RLS automatically filters by user_id
 * @param flashcardId - The flashcard ID
 * @param userId - The user ID
 * @returns Object with success flag and error if any
 */
async deleteFlashcard(
  flashcardId: string,
  userId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await this.supabase
      .from("flashcards")
      .delete()
      .eq("id", flashcardId)
      .eq("user_id", userId);

    if (error) {
      // If no rows found (PGRST116), that's fine - RLS already ensured security
      if (error.code === "PGRST116") {
        return { success: false, error: null }; // Treat as not found
      }
      return { success: false, error: new Error(`Database error: ${error.message}`) };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}
```

**Uwagi:**
- Metoda zwraca `success: boolean` zamiast danych (DELETE nie zwraca danych)
- Obsługuje kod błędu `PGRST116` (no rows found) jako normalny przypadek
- RLS automatycznie zapewnia bezpieczeństwo

### Krok 2: Implementacja handlera DELETE w endpoint

**Plik:** `src/pages/api/flashcards/[flashcardId]/index.ts`

**Implementacja:**
```typescript
/**
 * DELETE /api/flashcards/{flashcardId}
 *
 * Deletes a flashcard by its ID.
 * Only the owner of the flashcard can delete it (enforced by RLS).
 *
 * @param request - The incoming HTTP request
 * @param locals - Astro locals containing Supabase client
 * @param params - Route parameters containing flashcardId
 * @returns Response with success message or error
 */
export const DELETE: APIRoute = async ({ request, locals, params }) => {
  try {
    // Step 1: Authentication validation
    const defaultUserId = EnvConfig.getDefaultUserId();

    let userId: string;

    if (defaultUserId) {
      userId = defaultUserId;
      if (import.meta.env.NODE_ENV === "development") {
        console.log(`Using default user ID for testing: ${userId}`);
      }
    } else {
      // Normal authentication flow
      const authHeader = request.headers.get("authorization");
      const token = AuthUtils.extractBearerToken(authHeader);

      if (!token) {
        return ResponseUtils.createAuthErrorResponse("Authentication required");
      }

      // Verify JWT token with Supabase
      const { user, error: authError } = await AuthUtils.verifyToken(locals.supabase, token);

      if (authError || !user) {
        return ResponseUtils.createAuthErrorResponse(
          authError?.message || "Invalid or expired token"
        );
      }

      userId = user.id;
    }

    // Step 2: Validate path parameter
    const flashcardId = params.flashcardId;

    if (!flashcardId) {
      return ResponseUtils.createValidationErrorResponse(
        "Flashcard ID is required",
        "flashcardId"
      );
    }

    const validationResult = FlashcardIdSchema.safeParse(flashcardId);

    if (!validationResult.success) {
      return ResponseUtils.createValidationErrorResponse(
        "Invalid flashcard ID format",
        "flashcardId"
      );
    }

    const validatedFlashcardId = validationResult.data;

    // Step 3: Verify flashcard exists and belongs to user
    const flashcardService = new FlashcardService(locals.supabase);
    const { flashcard, error: fetchError } = await flashcardService.getFlashcardById(
      validatedFlashcardId,
      userId
    );

    if (fetchError) {
      return ResponseUtils.createInternalErrorResponse(
        `Failed to fetch flashcard: ${fetchError.message}`
      );
    }

    if (!flashcard) {
      return ResponseUtils.createErrorResponse("Flashcard not found", "NOT_FOUND", 404);
    }

    // Step 4: Delete flashcard
    const { success, error: deleteError } = await flashcardService.deleteFlashcard(
      validatedFlashcardId,
      userId
    );

    if (deleteError) {
      return ResponseUtils.createInternalErrorResponse(
        `Failed to delete flashcard: ${deleteError.message}`
      );
    }

    if (!success) {
      // This should not happen if we verified existence, but handle gracefully
      return ResponseUtils.createErrorResponse("Flashcard not found", "NOT_FOUND", 404);
    }

    // Step 5: Return success response
    return ResponseUtils.createSuccessResponse(
      { message: "Flashcard deleted successfully" },
      200
    );
  } catch (error) {
    // Log error for debugging in development
    if (import.meta.env.NODE_ENV === "development" && error instanceof Error) {
      console.error("Error in DELETE /api/flashcards/[flashcardId]:", error.message);
      console.error(error.stack);
    }
    return ResponseUtils.createInternalErrorResponse();
  }
};
```

**Uwagi:**
- Wykorzystuje istniejący schemat walidacji `FlashcardIdSchema`
- Weryfikuje istnienie fiszki przed usunięciem dla lepszych komunikatów błędów
- Zwraca prostą odpowiedź z komunikatem tekstowym zgodnie ze specyfikacją API

### Krok 3: Testowanie jednostkowe (opcjonalne, zalecane)

**Plik:** `src/pages/api/flashcards/[flashcardId]/index.test.ts` (jeśli istnieje)

**Scenariusze testowe:**
1. ✅ Pomyślne usunięcie fiszki
2. ✅ Błąd 401 - brak autentykacji
3. ✅ Błąd 401 - nieprawidłowy token
4. ✅ Błąd 400 - brak parametru flashcardId
5. ✅ Błąd 400 - nieprawidłowy format UUID
6. ✅ Błąd 404 - fiszka nie istnieje
7. ✅ Błąd 404 - fiszka należy do innego użytkownika
8. ✅ Błąd 500 - błąd bazy danych

### Krok 4: Testowanie manualne

**Testy do wykonania:**
1. Usunięcie istniejącej fiszki (sukces 200)
2. Próba usunięcia nieistniejącej fiszki (404)
3. Próba usunięcia bez autentykacji (401)
4. Próba usunięcia z nieprawidłowym UUID (400)
5. Próba usunięcia cudzej fiszki (404)

**Narzędzia:**
- Postman
- curl
- Thunder Client (VS Code extension)

**Przykładowe żądanie curl:**
```bash
curl -X DELETE \
  http://localhost:4321/api/flashcards/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### Krok 5: Weryfikacja zgodności ze specyfikacją

**Checklist:**
- ✅ Metoda HTTP: DELETE
- ✅ Ścieżka: `/api/flashcards/{flashcardId}`
- ✅ Parametr ścieżki: `flashcardId` (UUID)
- ✅ Response body: `{ "message": "Flashcard deleted successfully" }`
- ✅ Kod sukcesu: 200 OK
- ✅ Kody błędów: 404 Not Found, 401 Unauthorized
- ✅ Walidacja UUID
- ✅ Autentykacja wymagana

### Krok 6: Code Review i refaktoryzacja

**Punkty do sprawdzenia:**
- Spójność z istniejącymi endpointami (GET, PUT)
- Zgodność z konwencjami projektu
- Obsługa błędów zgodna z wzorcem
- Logowanie błędów w trybie deweloperskim
- Dokumentacja kodu (JSDoc)

### Krok 7: Aktualizacja dokumentacji (opcjonalne)

**Jeśli istnieje dokumentacja API:**
- Zaktualizuj OpenAPI/Swagger spec
- Dodaj przykłady użycia
- Zaktualizuj README jeśli zawiera informacje o API

---

## 10. Podsumowanie

Endpoint DELETE `/api/flashcards/{flashcardId}` jest prostym endpointem, który wymaga:

1. **Dodania metody `deleteFlashcard()` do `FlashcardService`**
   - Prosta operacja DELETE z filtrowaniem po `id` i `user_id`
   - Obsługa błędów bazy danych

2. **Implementacji handlera `DELETE` w `src/pages/api/flashcards/[flashcardId]/index.ts`**
   - Wykorzystanie istniejących utility functions (AuthUtils, ResponseUtils)
   - Wykorzystanie istniejącego schematu walidacji Zod
   - Weryfikacja istnienia fiszki przed usunięciem
   - Zwrócenie prostej odpowiedzi z komunikatem

3. **Bezpieczeństwo zapewnione przez:**
   - Autentykację JWT przez Supabase Auth
   - Row-Level Security (RLS) w bazie danych
   - Walidację parametrów wejściowych

4. **Zgodność ze specyfikacją API:**
   - Wszystkie wymagane parametry i odpowiedzi
   - Właściwe kody statusu HTTP
   - Spójność z istniejącymi endpointami

Endpoint jest gotowy do implementacji i testowania.


