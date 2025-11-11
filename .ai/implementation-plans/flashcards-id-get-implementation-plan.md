# API Endpoint Implementation Plan: GET /api/flashcards/{flashcardId}

## 1. Przegląd punktu końcowego

Endpoint GET `/api/flashcards/{flashcardId}` umożliwia zalogowanym użytkownikom pobranie szczegółowych informacji o pojedynczej fiszce na podstawie jej identyfikatora. W przeciwieństwie do endpointu listującego fiszki, ten endpoint zwraca pełne dane fiszki, w tym wszystkie parametry algorytmu FSRS (stability, difficulty, lapses, review_history) oraz metadane (generationId, timestamps).

**Główne funkcjonalności:**

- Pobranie pojedynczej fiszki po ID
- Zwrócenie pełnych danych fiszki (wszystkie pola z bazy danych)
- Automatyczna izolacja danych użytkownika przez Row-Level Security (RLS)
- Obsługa przypadku, gdy fiszka nie istnieje lub nie należy do użytkownika (404 Not Found)

## 2. Szczegóły żądania

### Metoda HTTP

`GET`

### Struktura URL

```
/api/flashcards/{flashcardId}
```

### Path Parameters

**Wymagane:**

- `flashcardId` (uuid) - Unikalny identyfikator fiszki w formacie UUID

**Przykład:**

```
GET /api/flashcards/123e4567-e89b-12d3-a456-426614174000
```

### Query Parameters

Brak

### Request Body

Brak (GET request)

### Headers

- `Authorization: Bearer <token>` - Wymagany token JWT dla autentykacji

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

**FlashcardResponse** (`src/types.ts`)

```typescript
export type FlashcardResponse = Pick<
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
  | "review_history"
  | "created_at"
  | "updated_at"
> & {
  userId: string; // mapped from user_id
  generationId: string | null; // mapped from generation_id
  reviewHistory: unknown[]; // mapped from review_history (Json type)
  createdAt: string; // mapped from created_at
  updatedAt: string; // mapped from updated_at
};
```

**Uwagi:**

- Typ zawiera zarówno pola w formacie `snake_case` (z Pick) jak i `camelCase` (z & {})
- `review_history` jest mapowane na `reviewHistory` jako tablica
- `generation_id` może być `null` dla fiszek manualnych

### Command Modele

Brak (endpoint tylko do odczytu)

### Typy bazy danych

- `Flashcard` - Typ bazowy z `src/types.ts` (importowany z `database.types.ts`)

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
    "review_history": [],
    "reviewHistory": [],
    "created_at": "ISO 8601 timestamp",
    "createdAt": "ISO 8601 timestamp",
    "updated_at": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

**Uwagi:**

- Odpowiedź zawiera zarówno pola w formacie `snake_case` jak i `camelCase` dla kompatybilności
- `due`, `created_at`, `updated_at` są w formacie ISO 8601 timestamp z timezone
- `state` jest liczbą całkowitą reprezentującą stan FSRS (0: new, 1: learning, 2: review, 3: relearning)
- `stability` i `difficulty` są liczbami zmiennoprzecinkowymi (real)
- `lapses` jest liczbą całkowitą
- `review_history`/`reviewHistory` jest tablicą obiektów JSON reprezentujących historię powtórek
- `generation_id`/`generationId` może być `null` dla fiszek utworzonych ręcznie

### Error Responses

**400 Bad Request** - Nieprawidłowy format flashcardId

```json
{
  "success": false,
  "error": {
    "message": "Invalid flashcard ID format",
    "code": "VALIDATION_ERROR",
    "field": "flashcardId"
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

### Krok 3: Pobranie fiszki z bazy danych

1. Wywołanie metody `getFlashcardById(flashcardId, userId)` w `FlashcardService`
2. Metoda wykonuje zapytanie z filtrowaniem po `id` i `user_id`
3. RLS automatycznie zapewnia, że użytkownik widzi tylko swoje fiszki
4. Użycie `.single()` do pobrania pojedynczego rekordu

### Krok 4: Obsługa przypadku "not found"

1. Jeśli `flashcard` jest `null`, zwróć błąd 404
2. Może to oznaczać, że:
   - Fiszka nie istnieje
   - Fiszka należy do innego użytkownika (RLS zablokował dostęp)

### Krok 5: Przygotowanie odpowiedzi

1. Mapowanie danych z bazy (snake_case) do formatu odpowiedzi
2. Dodanie pól w formacie camelCase dla kompatybilności
3. Mapowanie `review_history` (JSONB) na `reviewHistory` (array)
4. Obsługa `null` dla `generation_id`
5. Zwrócenie odpowiedzi 200 OK z danymi fiszki

### Diagram przepływu

```
Client Request
    ↓
[Authentication Check]
    ↓ (401 if invalid)
[Path Parameter Validation]
    ↓ (400 if invalid)
[Fetch Flashcard from Database]
    ↓
[Check if Flashcard Exists]
    ↓ (404 if not found)
[Transform Response Data]
    ↓
[Return 200 OK with flashcard data]
```

## 6. Względy bezpieczeństwa

### Autentykacja

- **Wymagany token JWT:** Wszystkie żądania muszą zawierać poprawny token Bearer w nagłówku `Authorization`
- **Weryfikacja przez Supabase Auth:** Token jest weryfikowany przez `supabase.auth.getUser(token)`
- **Fallback development:** W trybie development można użyć `DEFAULT_USER_ID` z zmiennych środowiskowych (tylko dla testów lokalnych)

### Autoryzacja

- **Row-Level Security (RLS):** Tabela `flashcards` ma włączone RLS, które automatycznie filtruje wyniki do fiszek należących do zalogowanego użytkownika
- **Polityka SELECT:** `auth.uid() = user_id` zapewnia, że użytkownik widzi tylko swoje fiszki
- **Dodatkowe filtrowanie:** W zapytaniu jawnie dodajemy `.eq("user_id", userId)` dla przejrzystości i dodatkowej warstwy bezpieczeństwa
- **Ochrona przed enumeracją:** Jeśli fiszka nie istnieje lub należy do innego użytkownika, zwracamy 404 (nie ujawniamy, czy fiszka istnieje, ale nie należy do użytkownika)

### Walidacja danych wejściowych

- **Zod schema:** Parametr `flashcardId` jest walidowany przez Zod przed użyciem
- **Format UUID:** Walidacja formatu UUID zapobiega SQL injection i nieprawidłowym zapytaniom
- **Walidacja parametru path:** Sprawdzenie czy parametr istnieje przed walidacją

### Ochrona przed atakami

- **SQL Injection:** Supabase używa parametryzowanych zapytań, a UUID jest walidowany przed użyciem
- **ID Enumeration:** RLS zapewnia, że użytkownik nie może uzyskać dostępu do fiszek innych użytkowników, nawet jeśli zna ich ID
- **Data Exposure:** RLS zapewnia, że użytkownik nie może uzyskać dostępu do fiszek innych użytkowników

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

#### 5. Fiszka nie znaleziona (404 Not Found)

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

#### 6. Błąd bazy danych (500 Internal Server Error)

**Przyczyna:** Problem z połączeniem do bazy, błąd zapytania SQL, lub inny błąd infrastruktury
**Obsługa:**

```typescript
if (fetchError) {
  return ResponseUtils.createInternalErrorResponse(`Failed to fetch flashcard: ${fetchError.message}`);
}
```

#### 7. Nieoczekiwany błąd (500 Internal Server Error)

**Przyczyna:** Wyjątek w kodzie, który nie został obsłużony
**Obsługa:**

```typescript
catch (error) {
  if (import.meta.env.NODE_ENV === "development" && error instanceof Error) {
    console.error("Error in GET /api/flashcards/[flashcardId]:", error.message);
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

**Uwaga:** Zapytanie używa zarówno `id` (primary key) jak i `user_id` (indeks), co zapewnia optymalną wydajność.

### Optymalizacje zapytania

1. **Selekcja wszystkich pól:** Zapytanie pobiera wszystkie pola fiszki (`.select("*")`), co jest odpowiednie dla endpointu zwracającego pełne dane
2. **Pojedynczy rekord:** Użycie `.single()` zamiast `.limit(1)` zapewnia, że zwracany jest dokładnie jeden rekord
3. **Filtrowanie po ID i user_id:** Zapytanie filtruje zarówno po `id` (primary key) jak i `user_id` (indeks), co zapewnia szybkie wyszukiwanie
4. **RLS:** Row-Level Security działa na poziomie bazy danych, więc nie ma dodatkowego obciążenia w aplikacji

### Potencjalne wąskie gardła

1. **Duże obiekty review_history:** Jeśli `review_history` zawiera bardzo dużo wpisów, może to wpłynąć na rozmiar odpowiedzi
   - **Rozwiązanie:** Obecnie nie ma limitu, ale można rozważyć paginację historii w przyszłości

2. **Równoczesne żądania:** Wiele równoczesnych żądań GET może obciążyć bazę
   - **Rozwiązanie:** (Opcjonalnie) Cache odpowiedzi dla często pobieranych fiszek

### Rekomendacje

1. **Monitorowanie:** Śledzenie czasu odpowiedzi endpointu
2. **Cache:** (Opcjonalnie) Cache odpowiedzi dla często pobieranych fiszek (np. w sesji nauki)
3. **Indeksy:** Obecne indeksy są wystarczające dla tego endpointu

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji Zod

**Lokalizacja:** `src/pages/api/flashcards/[flashcardId]/index.ts`

Utworzenie schematu walidacji dla parametru path:

```typescript
const FlashcardIdSchema = z.string().uuid("Invalid flashcard ID format");
```

**Uwagi:**

- Schemat waliduje format UUID
- Komunikat błędu jest czytelny dla użytkownika

### Krok 2: Utworzenie pliku endpointu

**Lokalizacja:** `src/pages/api/flashcards/[flashcardId]/index.ts`

Utworzenie nowego pliku dla endpointu z dynamicznym parametrem path:

- Struktura folderów: `src/pages/api/flashcards/[flashcardId]/index.ts`
- Eksport `export const prerender = false;` dla API route

### Krok 3: Dodanie metody `getFlashcardById` do `FlashcardService`

**Lokalizacja:** `src/lib/services/flashcard.service.ts`

Implementacja metody pobierającej pojedynczą fiszkę:

```typescript
async getFlashcardById(
  flashcardId: string,
  userId: string
): Promise<{ flashcard: Flashcard | null; error: Error | null }>
```

**Szczegóły implementacji:**

1. Budowanie zapytania Supabase z filtrowaniem po `id` i `user_id`
2. Użycie `.single()` do pobrania pojedynczego rekordu
3. Obsługa błędu `PGRST116` (no rows found) jako `null` zamiast błędu
4. Obsługa innych błędów bazy danych
5. Zwrócenie wyniku z obsługą błędów

**Wzorzec:** Podobny do `GenerationService.getGenerationById()`

### Krok 4: Implementacja handlera GET

**Lokalizacja:** `src/pages/api/flashcards/[flashcardId]/index.ts`

Dodanie eksportu `GET: APIRoute` z następującą logiką:

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

3. **Pobranie fiszki:**
   - Wywołanie `flashcardService.getFlashcardById(flashcardId, userId)`
   - Obsługa błędów bazy danych

4. **Obsługa przypadku "not found":**
   - Sprawdzenie czy `flashcard` jest `null`
   - Zwrócenie błędu 404

5. **Przygotowanie odpowiedzi:**
   - Mapowanie danych z bazy (snake_case) do formatu odpowiedzi
   - Dodanie pól w formacie camelCase
   - Mapowanie `review_history` na `reviewHistory`
   - Obsługa `null` dla `generation_id`
   - Zwrócenie odpowiedzi 200 OK

6. **Obsługa wyjątków:**
   - Try-catch dla nieoczekiwanych błędów
   - Logowanie w development
   - Zwrócenie błędu 500

**Wzorzec:** Podobny do `GET /api/generations/[generationId]`

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

3. **Testy funkcjonalności:**
   - Pobranie istniejącej fiszki → 200 z danymi
   - Pobranie nieistniejącej fiszki → 404
   - Pobranie fiszki innego użytkownika → 404 (RLS)
   - Sprawdzenie wszystkich pól w odpowiedzi
   - Sprawdzenie mapowania `review_history` → `reviewHistory`
   - Sprawdzenie obsługi `null` dla `generation_id`

4. **Testy bezpieczeństwa:**
   - Użytkownik A nie może pobrać fiszki użytkownika B (RLS)
   - Filtrowanie automatycznie po `user_id`

5. **Testy wydajności:**
   - Czas odpowiedzi dla różnych rozmiarów `review_history`
   - Wydajność zapytania z indeksami

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
- Frontend powinien obsługiwać wszystkie pola odpowiedzi
- Przykładowe użycie:
  ```typescript
  const response = await fetch(`/api/flashcards/${flashcardId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
- **FR-011:** Pobranie szczegółów pojedynczej fiszki ✅

### Potencjalne rozszerzenia w przyszłości

1. **Wersjonowanie:** Dodanie parametru `version` do pobierania historycznych wersji fiszki
2. **Pola opcjonalne:** Parametr query do kontrolowania, które pola mają być zwrócone
3. **Relacje:** Rozszerzenie odpowiedzi o dane powiązane (np. szczegóły generacji)
4. **Cache:** Implementacja cache dla często pobieranych fiszek
5. **Metryki:** Śledzenie najczęściej pobieranych fiszek dla optymalizacji

### Różnice w stosunku do endpointu listującego

1. **Pełne dane:** Zwraca wszystkie pola fiszki, w tym parametry FSRS
2. **Brak paginacji:** Zwraca pojedynczy rekord
3. **Brak filtrów:** Nie ma parametrów query do filtrowania
4. **404 Not Found:** Obsługuje przypadek, gdy fiszka nie istnieje
5. **Mapowanie danych:** Wymaga mapowania `review_history` (JSONB) na `reviewHistory` (array)

---

**Status:** Plan gotowy do implementacji
**Ostatnia aktualizacja:** 2025-01-XX
