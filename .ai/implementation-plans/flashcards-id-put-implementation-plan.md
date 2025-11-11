# API Endpoint Implementation Plan: PUT /api/flashcards/{flashcardId}

## 1. Przegląd punktu końcowego

Endpoint PUT `/api/flashcards/{flashcardId}` umożliwia zalogowanym użytkownikom aktualizację treści pojedynczej fiszki (awers i rewers). Endpoint pozwala na edycję tylko pól `front` i `back`, zachowując wszystkie pozostałe dane fiszki (parametry FSRS, źródło, metadane) bez zmian. Automatycznie aktualizuje pole `updated_at` z aktualnym timestampem.

**Główne funkcjonalności:**

- Aktualizacja treści fiszki (awers i rewers)
- Walidacja długości pól (max 200 znaków dla front, max 500 dla back)
- Sprawdzenie istnienia fiszki i przynależności do użytkownika
- Wykrywanie duplikatów (UNIQUE constraint na user_id, front, back)
- Automatyczna aktualizacja `updated_at`
- Zwrócenie pełnych danych zaktualizowanej fiszki

## 2. Szczegóły żądania

### Metoda HTTP

`PUT`

### Struktura URL

```
/api/flashcards/{flashcardId}
```

### Path Parameters

**Wymagane:**

- `flashcardId` (uuid) - Unikalny identyfikator fiszki w formacie UUID

**Przykład:**

```
PUT /api/flashcards/123e4567-e89b-12d3-a456-426614174000
```

### Query Parameters

Brak

### Request Body

**Wymagane pola:**

- `front` (string) - Awers fiszki (pytanie), maksymalnie 200 znaków
- `back` (string) - Rewers fiszki (odpowiedź), maksymalnie 500 znaków

**Struktura:**

```json
{
  "front": "string (max 200 characters)",
  "back": "string (max 500 characters)"
}
```

**Przykład:**

```json
{
  "front": "What is the capital of France?",
  "back": "Paris is the capital and largest city of France."
}
```

### Headers

- `Authorization: Bearer <token>` - Wymagany token JWT dla autentykacji
- `Content-Type: application/json` - Wymagany typ zawartości

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

**UpdateFlashcardRequest** (`src/types.ts`)

```typescript
export interface UpdateFlashcardRequest {
  front: string; // max 200 characters
  back: string; // max 500 characters
}
```

**UpdateFlashcardResponse** (`src/types.ts`)

```typescript
export type UpdateFlashcardResponse = CreateFlashcardResponse; // Same structure as create response
```

**CreateFlashcardResponse** (`src/types.ts`)

```typescript
export type CreateFlashcardResponse = Pick<
  Flashcard,
  | "id"
  | "user_id"
  | "generation_id"
  | "front"
  | "back"
  | "source"
  | "state"
  | "due"
  | "stability"
  | "difficulty"
  | "lapses"
  | "created_at"
  | "updated_at"
> & {
  userId: string; // mapped from user_id
  generationId: string | null; // mapped from generation_id
  createdAt: string; // mapped from created_at
  updatedAt: string; // mapped from updated_at
};
```

### Command Modele

**UpdateFlashcardCommand** (`src/types.ts`)

```typescript
export interface UpdateFlashcardCommand {
  flashcardId: string;
  data: UpdateFlashcardRequest;
}
```

### Typy bazy danych

- `Flashcard` - Typ bazowy z `src/types.ts` (importowany z `database.types.ts`)
- `FlashcardUpdate` - Typ dla aktualizacji z `src/types.ts` (importowany z `database.types.ts`)

## 4. Szczegóły odpowiedzi

### Success Response (200 OK)

**Struktura odpowiedzi:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "userId": "uuid",
    "generation_id": "uuid | null",
    "generationId": "uuid | null",
    "front": "string",
    "back": "string",
    "source": "ai-full" | "ai-edited" | "manual",
    "state": 0 | 1 | 2 | 3,
    "due": "ISO 8601 timestamp",
    "stability": 0.0,
    "difficulty": 0.0,
    "lapses": 0,
    "created_at": "ISO 8601 timestamp",
    "createdAt": "ISO 8601 timestamp",
    "updated_at": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Uwagi:**

- Odpowiedź zawiera zarówno pola w formacie `snake_case` jak i `camelCase` dla kompatybilności
- `updated_at`/`updatedAt` zawiera nowy timestamp po aktualizacji
- Wszystkie pozostałe pola pozostają bez zmian (parametry FSRS, source, generation_id, etc.)
- `due`, `created_at`, `updated_at` są w formacie ISO 8601 timestamp z timezone

### Error Responses

**400 Bad Request** - Nieprawidłowe dane wejściowe

```json
{
  "success": false,
  "error": {
    "message": "Front must not exceed 200 characters",
    "code": "VALIDATION_ERROR",
    "field": "front"
  }
}
```

**401 Unauthorized** - Brak autentykacji lub nieprawidłowy token

```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

**404 Not Found** - Fiszka nie istnieje lub nie należy do użytkownika

```json
{
  "success": false,
  "error": {
    "message": "Flashcard not found",
    "code": "NOT_FOUND"
  }
}
```

**409 Conflict** - Fiszka z taką treścią już istnieje (duplikat)

```json
{
  "success": false,
  "error": {
    "message": "Flashcard with this content already exists",
    "code": "DUPLICATE_FLASHCARD"
  }
}
```

**500 Internal Server Error** - Błąd serwera

```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "code": "INTERNAL_ERROR"
  }
}
```

## 5. Przepływ danych

### Krok 1: Walidacja autentykacji

1. Sprawdzenie nagłówka `Authorization`
2. Wyodrębnienie tokena Bearer
3. Weryfikacja tokena JWT przez Supabase Auth
4. Pobranie `user_id` z tokena
5. **Fallback dla development:** Jeśli ustawiona zmienna `DEFAULT_USER_ID`, użyj jej zamiast autentykacji (tylko w trybie development)

### Krok 2: Walidacja parametru path

1. Pobranie `flashcardId` z `params.flashcardId`
2. Sprawdzenie czy parametr istnieje
3. Walidacja formatu UUID przez Zod schema
4. Zwrócenie błędu 400 w przypadku nieprawidłowego formatu

### Krok 3: Walidacja request body

1. Parsowanie JSON z request body
2. Walidacja przez Zod schema:
   - `front`: string, min 1 znak, max 200 znaków, trim
   - `back`: string, min 1 znak, max 500 znaków, trim
3. Zwrócenie błędu 400 w przypadku niepowodzenia walidacji

### Krok 4: Sprawdzenie istnienia fiszki

1. Wywołanie `flashcardService.getFlashcardById(flashcardId, userId)`
2. Sprawdzenie czy fiszka istnieje i należy do użytkownika
3. Zwrócenie błędu 404 jeśli fiszka nie istnieje

### Krok 5: Sprawdzenie duplikatów

1. Sprawdzenie czy nowa treść (front + back) nie tworzy duplikatu
2. **Ważne:** Sprawdzenie musi wykluczyć aktualnie edytowaną fiszkę (aby umożliwić edycję bez zmiany treści)
3. Wywołanie `flashcardService.checkDuplicate(userId, front, back, excludeFlashcardId)`
4. Zwrócenie błędu 409 jeśli duplikat istnieje

### Krok 6: Aktualizacja fiszki

1. Przygotowanie danych do aktualizacji:
   - `front`: zaktualizowana wartość (trimmed)
   - `back`: zaktualizowana wartość (trimmed)
   - `updated_at`: aktualny timestamp (ISO 8601)
2. Wywołanie `flashcardService.updateFlashcard(flashcardId, userId, updateData)`
3. Obsługa błędów bazy danych, w tym UNIQUE constraint violation (409)

### Krok 7: Pobranie zaktualizowanej fiszki

1. Wywołanie `flashcardService.getFlashcardById(flashcardId, userId)` po aktualizacji
2. Weryfikacja że aktualizacja się powiodła

### Krok 8: Przygotowanie odpowiedzi

1. Mapowanie danych z bazy (snake_case) do formatu odpowiedzi
2. Dodanie pól w formacie camelCase dla kompatybilności
3. Zwrócenie odpowiedzi 200 OK z pełnymi danymi zaktualizowanej fiszki

### Diagram przepływu

```
Client Request
    ↓
[Authentication Check]
    ↓ (401 if invalid)
[Path Parameter Validation]
    ↓ (400 if invalid)
[Request Body Validation]
    ↓ (400 if invalid)
[Check Flashcard Exists]
    ↓ (404 if not found)
[Check for Duplicates]
    ↓ (409 if duplicate)
[Update Flashcard in Database]
    ↓ (500 if error)
[Fetch Updated Flashcard]
    ↓
[Transform Response Data]
    ↓
[Return 200 OK with updated flashcard data]
```

## 6. Względy bezpieczeństwa

### Autentykacja

- **Wymagany token JWT:** Wszystkie żądania muszą zawierać poprawny token Bearer w nagłówku `Authorization`
- **Weryfikacja przez Supabase Auth:** Token jest weryfikowany przez `supabase.auth.getUser(token)`
- **Fallback development:** W trybie development można użyć `DEFAULT_USER_ID` z zmiennych środowiskowych (tylko dla testów lokalnych)

### Autoryzacja

- **Row-Level Security (RLS):** Tabela `flashcards` ma włączone RLS, które automatycznie filtruje wyniki do fiszek należących do zalogowanego użytkownika
- **Polityka UPDATE:** `auth.uid() = user_id` zapewnia, że użytkownik może aktualizować tylko swoje fiszki
- **Dodatkowe filtrowanie:** W zapytaniu jawnie dodajemy `.eq("user_id", userId)` dla przejrzystości i dodatkowej warstwy bezpieczeństwa
- **Ochrona przed enumeracją:** Jeśli fiszka nie istnieje lub należy do innego użytkownika, zwracamy 404 (nie ujawniamy, czy fiszka istnieje, ale nie należy do użytkownika)

### Walidacja danych wejściowych

- **Zod schema:** Wszystkie dane wejściowe są walidowane przez Zod przed użyciem
- **Ograniczenia długości:**
  - `front`: maksymalnie 200 znaków (zgodnie ze schematem bazy danych)
  - `back`: maksymalnie 500 znaków (zgodnie ze schematem bazy danych)
- **Trim:** Automatyczne usunięcie białych znaków z początku i końca
- **Format UUID:** Walidacja formatu UUID dla `flashcardId` zapobiega SQL injection

### Ochrona przed atakami

- **SQL Injection:** Supabase używa parametryzowanych zapytań, a wszystkie dane są walidowane przed użyciem
- **ID Enumeration:** RLS zapewnia, że użytkownik nie może aktualizować fiszek innych użytkowników, nawet jeśli zna ich ID
- **Data Exposure:** RLS zapewnia, że użytkownik nie może uzyskać dostępu do fiszek innych użytkowników
- **Duplicate Prevention:** UNIQUE constraint na `(user_id, front, back)` zapobiega przypadkowemu tworzeniu duplikatów

### Ograniczenia edycji

- **Tylko front i back:** Endpoint pozwala na aktualizację tylko pól `front` i `back`
- **Parametry FSRS niezmienne:** Parametry algorytmu FSRS (state, due, stability, difficulty, lapses) nie mogą być zmieniane przez ten endpoint (są aktualizowane przez algorytm FSRS podczas powtórek)
- **Source niezmienne:** Pole `source` nie może być zmieniane (zachowuje informację o pochodzeniu fiszki)

## 7. Obsługa błędów

### Scenariusze błędów i odpowiedzi

#### 1. Brak autentykacji (401 Unauthorized)

**Przyczyna:** Brak nagłówka `Authorization` lub nieprawidłowy format
**Obsługa:**

```typescript
if (!token) {
  return ResponseUtils.createAuthErrorResponse("Authentication required");
}
```

#### 2. Nieprawidłowy lub wygasły token (401 Unauthorized)

**Przyczyna:** Token JWT jest nieprawidłowy, wygasły lub nie można zweryfikować użytkownika
**Obsługa:**

```typescript
if (authError || !user) {
  return ResponseUtils.createAuthErrorResponse(authError?.message || "Invalid or expired token");
}
```

#### 3. Brak parametru flashcardId (400 Bad Request)

**Przyczyna:** Parametr `flashcardId` nie został przekazany w URL
**Obsługa:**

```typescript
if (!flashcardId) {
  return ResponseUtils.createValidationErrorResponse("Flashcard ID is required", "flashcardId");
}
```

#### 4. Nieprawidłowy format flashcardId (400 Bad Request)

**Przyczyna:** Parametr `flashcardId` nie jest w formacie UUID
**Obsługa:**

```typescript
const validationResult = FlashcardIdSchema.safeParse(flashcardId);
if (!validationResult.success) {
  return ResponseUtils.createValidationErrorResponse("Invalid flashcard ID format", "flashcardId");
}
```

#### 5. Nieprawidłowy request body (400 Bad Request)

**Przyczyna:** Request body nie spełnia wymagań walidacji
**Przykłady:**

- `front` jest pusty lub przekracza 200 znaków
- `back` jest pusty lub przekracza 500 znaków
- Brak wymaganych pól
- Nieprawidłowy format JSON

**Obsługa:**

```typescript
if (!validationResult.success) {
  const firstError = validationResult.error.errors[0];
  return ResponseUtils.createValidationErrorResponse(
    firstError?.message || "Invalid request data",
    firstError?.path.join(".") || "unknown"
  );
}
```

#### 6. Fiszka nie znaleziona (404 Not Found)

**Przyczyna:**

- Fiszka o podanym ID nie istnieje w bazie danych
- Fiszka należy do innego użytkownika (RLS zablokował dostęp)

**Obsługa:**

```typescript
if (!flashcard) {
  return ResponseUtils.createErrorResponse("Flashcard not found", "NOT_FOUND", 404);
}
```

**Uwaga:** Nie rozróżniamy między "fiszka nie istnieje" a "fiszka należy do innego użytkownika" ze względów bezpieczeństwa (zapobieganie enumeracji).

#### 7. Duplikat fiszki (409 Conflict)

**Przyczyna:** Fiszka z identyczną treścią (front + back) już istnieje dla tego użytkownika
**Obsługa:**

```typescript
if (duplicateExists) {
  return ResponseUtils.createErrorResponse("Flashcard with this content already exists", "DUPLICATE_FLASHCARD", 409);
}
```

**Uwaga:** Sprawdzenie duplikatów musi wykluczyć aktualnie edytowaną fiszkę, aby umożliwić zapisanie bez zmian.

#### 8. Błąd bazy danych (500 Internal Server Error)

**Przyczyna:** Problem z połączeniem do bazy, błąd zapytania SQL, lub inny błąd infrastruktury
**Obsługa:**

```typescript
if (updateError) {
  // Check if it's a duplicate error (UNIQUE constraint violation)
  if (updateError.message.includes("already exists") || updateError.code === "23505") {
    return ResponseUtils.createErrorResponse("Flashcard with this content already exists", "DUPLICATE_FLASHCARD", 409);
  }
  return ResponseUtils.createInternalErrorResponse(`Failed to update flashcard: ${updateError.message}`);
}
```

#### 9. Nieoczekiwany błąd (500 Internal Server Error)

**Przyczyna:** Wyjątek w kodzie, który nie został obsłużony
**Obsługa:**

```typescript
catch (error) {
  if (import.meta.env.NODE_ENV === "development" && error instanceof Error) {
    console.error("Error in PUT /api/flashcards/[flashcardId]:", error.message);
    console.error(error.stack);
  }
  return ResponseUtils.createInternalErrorResponse();
}
```

### Logowanie błędów

- **Development:** Wszystkie błędy są logowane do konsoli z pełnym stack trace
- **Production:** Błędy są logowane bez wrażliwych informacji (można rozszerzyć o zewnętrzny system logowania)

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych

#### Indeksy

Schemat bazy danych zawiera następujące indeksy optymalizujące zapytania:

1. **Primary Key na `id`** - Optymalizuje wyszukiwanie po ID

   ```sql
   -- Automatycznie utworzony przez PRIMARY KEY constraint
   ```

2. **`idx_flashcards_user_id`** - Optymalizuje filtrowanie po użytkowniku

   ```sql
   CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
   ```

3. **UNIQUE constraint na `(user_id, front, back)`** - Zapewnia unikalność i optymalizuje sprawdzanie duplikatów
   ```sql
   UNIQUE (user_id, front, back)
   ```

**Uwaga:** Zapytanie UPDATE używa zarówno `id` (primary key) jak i `user_id` (indeks), co zapewnia optymalną wydajność.

### Optymalizacje zapytania

1. **Selekcja po aktualizacji:** Po UPDATE pobieramy zaktualizowany rekord przez `.select().single()` aby zwrócić pełne dane
2. **Filtrowanie po ID i user_id:** Zapytanie filtruje zarówno po `id` (primary key) jak i `user_id` (indeks), co zapewnia szybkie wyszukiwanie
3. **RLS:** Row-Level Security działa na poziomie bazy danych, więc nie ma dodatkowego obciążenia w aplikacji
4. **Sprawdzanie duplikatów:** Użycie indeksu UNIQUE constraint zapewnia szybkie sprawdzanie duplikatów

### Potencjalne wąskie gardła

1. **Sprawdzanie duplikatów:** Dla dużych kolekcji sprawdzanie duplikatów może być kosztowne
   - **Rozwiązanie:** Indeks UNIQUE constraint optymalizuje to sprawdzenie

2. **Równoczesne aktualizacje:** Wiele równoczesnych żądań UPDATE może obciążyć bazę
   - **Rozwiązanie:** (Opcjonalnie) Rate limiting dla operacji zapisu

3. **Aktualizacja `updated_at`:** Jeśli nie ma triggera w bazie, trzeba ręcznie ustawić timestamp
   - **Rozwiązanie:** Ustawienie `updated_at` w aplikacji przed zapisem

### Rekomendacje

1. **Monitorowanie:** Śledzenie czasu odpowiedzi endpointu
2. **Trigger dla updated_at:** (Opcjonalnie) Rozważenie utworzenia triggera w bazie danych do automatycznego aktualizowania `updated_at`
3. **Indeksy:** Obecne indeksy są wystarczające dla tego endpointu

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematów walidacji Zod

**Lokalizacja:** `src/pages/api/flashcards/[flashcardId]/index.ts`

Utworzenie schematów walidacji:

1. **Dla parametru path:**

```typescript
const FlashcardIdSchema = z.string().uuid("Invalid flashcard ID format");
```

2. **Dla request body:**

```typescript
const UpdateFlashcardSchema = z.object({
  front: z.string().max(200, "Front must not exceed 200 characters").trim().min(1, "Front is required"),
  back: z.string().max(500, "Back must not exceed 500 characters").trim().min(1, "Back is required"),
});
```

**Uwagi:**

- Schematy walidują format UUID i długość pól
- Komunikaty błędów są czytelne dla użytkownika
- Automatyczne trimowanie białych znaków

### Krok 2: Rozszerzenie metody `checkDuplicate` w `FlashcardService`

**Lokalizacja:** `src/lib/services/flashcard.service.ts`

Rozszerzenie metody o opcjonalny parametr `excludeFlashcardId`:

```typescript
async checkDuplicate(
  userId: string,
  front: string,
  back: string,
  excludeFlashcardId?: string
): Promise<{ exists: boolean; error: Error | null }>
```

**Szczegóły implementacji:**

1. Dodanie opcjonalnego parametru `excludeFlashcardId`
2. W zapytaniu dodanie `.neq("id", excludeFlashcardId)` jeśli parametr jest podany
3. Pozwala to na sprawdzenie duplikatów z wykluczeniem aktualnie edytowanej fiszki

### Krok 3: Dodanie metody `updateFlashcard` do `FlashcardService`

**Lokalizacja:** `src/lib/services/flashcard.service.ts`

Implementacja metody aktualizującej fiszkę:

```typescript
async updateFlashcard(
  flashcardId: string,
  userId: string,
  data: { front: string; back: string }
): Promise<{ flashcard: Flashcard | null; error: Error | null }>
```

**Szczegóły implementacji:**

1. Przygotowanie danych do aktualizacji:
   - `front`: trimmed string
   - `back`: trimmed string
   - `updated_at`: aktualny timestamp (ISO 8601)
2. Budowanie zapytania UPDATE z filtrowaniem po `id` i `user_id`
3. Użycie `.select().single()` do zwrócenia zaktualizowanego rekordu
4. Obsługa błędu `PGRST116` (no rows found) jako `null` zamiast błędu
5. Obsługa UNIQUE constraint violation (kod `23505`) jako specjalny błąd
6. Obsługa innych błędów bazy danych
7. Zwrócenie wyniku z obsługą błędów

**Wzorzec:** Podobny do `createFlashcard()`, ale z UPDATE zamiast INSERT

### Krok 4: Implementacja handlera PUT

**Lokalizacja:** `src/pages/api/flashcards/[flashcardId]/index.ts`

Dodanie eksportu `PUT: APIRoute` z następującą logiką:

1. **Walidacja autentykacji:**
   - Sprawdzenie `DEFAULT_USER_ID` dla development
   - Wyodrębnienie tokena Bearer
   - Weryfikacja tokena przez `AuthUtils.verifyToken()`
   - Pobranie `userId`

2. **Walidacja parametru path:**
   - Pobranie `flashcardId` z `params.flashcardId`
   - Sprawdzenie czy parametr istnieje
   - Walidacja przez `FlashcardIdSchema`
   - Zwrócenie błędu 400 w przypadku niepowodzenia

3. **Walidacja request body:**
   - Parsowanie JSON z request body
   - Walidacja przez `UpdateFlashcardSchema`
   - Zwrócenie błędu 400 w przypadku niepowodzenia

4. **Sprawdzenie istnienia fiszki:**
   - Wywołanie `flashcardService.getFlashcardById(flashcardId, userId)`
   - Zwrócenie błędu 404 jeśli fiszka nie istnieje

5. **Sprawdzenie duplikatów:**
   - Wywołanie `flashcardService.checkDuplicate(userId, front, back, flashcardId)`
   - Zwrócenie błędu 409 jeśli duplikat istnieje

6. **Aktualizacja fiszki:**
   - Wywołanie `flashcardService.updateFlashcard(flashcardId, userId, { front, back })`
   - Obsługa błędów bazy danych, w tym UNIQUE constraint violation

7. **Pobranie zaktualizowanej fiszki:**
   - Wywołanie `flashcardService.getFlashcardById(flashcardId, userId)` po aktualizacji
   - Weryfikacja że aktualizacja się powiodła

8. **Przygotowanie odpowiedzi:**
   - Mapowanie danych z bazy (snake_case) do formatu odpowiedzi
   - Dodanie pól w formacie camelCase
   - Zwrócenie odpowiedzi 200 OK

9. **Obsługa wyjątków:**
   - Try-catch dla nieoczekiwanych błędów
   - Logowanie w development
   - Zwrócenie błędu 500

**Wzorzec:** Podobny do `POST /api/flashcards`, ale z UPDATE zamiast INSERT

### Krok 5: Testowanie

**Lokalizacja:** Testy jednostkowe i integracyjne

**Scenariusze testowe:**

1. **Testy autentykacji:**
   - Brak tokena → 401
   - Nieprawidłowy token → 401
   - Poprawny token → 200

2. **Testy walidacji parametrów:**
   - Brak `flashcardId` → 400
   - Nieprawidłowy format UUID → 400
   - Poprawny format UUID → kontynuacja

3. **Testy walidacji request body:**
   - Brak `front` → 400
   - Brak `back` → 400
   - `front` pusty → 400
   - `back` pusty → 400
   - `front` > 200 znaków → 400
   - `back` > 500 znaków → 400
   - Poprawne dane → kontynuacja

4. **Testy funkcjonalności:**
   - Aktualizacja istniejącej fiszki → 200 z zaktualizowanymi danymi
   - Aktualizacja nieistniejącej fiszki → 404
   - Aktualizacja fiszki innego użytkownika → 404 (RLS)
   - Aktualizacja z duplikatem → 409
   - Aktualizacja bez zmiany treści → 200 (sprawdzenie wykluczenia w checkDuplicate)
   - Sprawdzenie że `updated_at` jest zaktualizowane
   - Sprawdzenie że pozostałe pola nie są zmienione

5. **Testy bezpieczeństwa:**
   - Użytkownik A nie może aktualizować fiszki użytkownika B (RLS)
   - Filtrowanie automatycznie po `user_id`

6. **Testy wydajności:**
   - Czas odpowiedzi dla różnych rozmiarów kolekcji
   - Wydajność sprawdzania duplikatów

### Krok 6: Dokumentacja i code review

**Akcje:**

1. Sprawdzenie zgodności z regułami implementacji (backend, shared, astro)
2. Weryfikacja użycia prawidłowych kodów statusu HTTP
3. Sprawdzenie zgodności z konwencjami nazewnictwa
4. Weryfikacja obsługi błędów
5. Sprawdzenie komentarzy w kodzie (JSDoc)

### Krok 7: Integracja z frontendem

**Uwagi:**

- Endpoint jest gotowy do użycia przez frontend
- Frontend powinien obsługiwać wszystkie kody błędów
- Przykładowe użycie:
  ```typescript
  const response = await fetch(`/api/flashcards/${flashcardId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      front: "Updated question",
      back: "Updated answer",
    }),
  });
  ```

## 10. Dodatkowe uwagi

### Zgodność z regułami implementacji

1. **Astro guidelines:**
   - ✅ Użycie `export const prerender = false` dla API route
   - ✅ Użycie `APIRoute` type z Astro
   - ✅ Użycie `locals.supabase` zamiast bezpośredniego importu
   - ✅ Dynamiczny parametr path w formacie `[flashcardId]`

2. **Backend guidelines:**
   - ✅ Użycie Supabase dla operacji bazy danych
   - ✅ Użycie Zod do walidacji danych wejściowych
   - ✅ Użycie `SupabaseClient` type z `src/db/supabase.client.ts`

3. **Shared guidelines:**
   - ✅ Obsługa błędów na początku funkcji (early returns)
   - ✅ Użycie guard clauses
   - ✅ Czytelny kod bez niepotrzebnych else

### Zgodność z PRD

- **FR-010:** Dostęp tylko do własnych fiszek (RLS) ✅
- **FR-011:** Aktualizacja treści fiszki ✅
- **FR-012:** Walidacja długości pól ✅

### Aktualizacja `updated_at`

**Opcja 1: Ręczne ustawienie w aplikacji (zalecane dla MVP)**

- Ustawienie `updated_at` w aplikacji przed zapisem do bazy
- Proste i kontrolowane przez aplikację

**Opcja 2: Trigger w bazie danych (opcjonalne rozszerzenie)**

- Utworzenie triggera PostgreSQL do automatycznego aktualizowania `updated_at`
- Wymaga dodatkowej migracji

**Rekomendacja:** Dla MVP użyj opcji 1. Opcja 2 może być dodana w przyszłości jako optymalizacja.

### Potencjalne rozszerzenia w przyszłości

1. **Częściowa aktualizacja:** Obsługa PATCH zamiast PUT dla aktualizacji tylko wybranych pól
2. **Wersjonowanie:** Śledzenie historii zmian fiszki
3. **Optimistic locking:** Wersjonowanie optymistyczne z `updated_at` jako tokenem wersji
4. **Bulk update:** Aktualizacja wielu fiszek jednocześnie
5. **Metryki:** Śledzenie częstości aktualizacji fiszek

### Różnice w stosunku do endpointu tworzenia

1. **Brak pola `source`:** Endpoint UPDATE nie pozwala na zmianę źródła pochodzenia
2. **Brak pola `generationId`:** Endpoint UPDATE nie pozwala na zmianę powiązania z generacją
3. **Sprawdzanie duplikatów:** Musi wykluczyć aktualnie edytowaną fiszkę
4. **Sprawdzanie istnienia:** Musi sprawdzić czy fiszka istnieje przed aktualizacją
5. **Aktualizacja `updated_at`:** Automatyczna aktualizacja timestampu

---

**Status:** Plan gotowy do implementacji
**Ostatnia aktualizacja:** 2025-01-XX
