# API Endpoint Implementation Plan: GET /api/flashcards

## 1. Przegląd punktu końcowego

Endpoint GET `/api/flashcards` umożliwia zalogowanym użytkownikom pobieranie listy swoich fiszek z obsługą paginacji, sortowania i filtrowania. Endpoint zwraca uproszczone dane fiszek (bez pełnych parametrów FSRS) wraz z metadanymi paginacji, co optymalizuje wydajność dla listy kolekcji.

**Główne funkcjonalności:**
- Paginacja wyników (domyślnie 25, maksymalnie 100 na stronę)
- Sortowanie po dacie utworzenia, dacie aktualizacji lub dacie następnej powtórki
- Filtrowanie po źródle pochodzenia (ai-full, ai-edited, manual)
- Filtrowanie po stanie FSRS (0-3: new, learning, review, relearning)
- Automatyczna izolacja danych użytkownika przez Row-Level Security (RLS)

## 2. Szczegóły żądania

### Metoda HTTP
`GET`

### Struktura URL
```
/api/flashcards
```

### Query Parameters

**Wymagane:**
- Brak wymaganych parametrów

**Opcjonalne:**
- `page` (number) - Numer strony (domyślnie: 1, minimum: 1)
- `limit` (number) - Liczba elementów na stronę (domyślnie: 25, minimum: 1, maksimum: 100)
- `sort` (string) - Pole sortowania (domyślnie: "createdAt")
  - Dozwolone wartości: `"createdAt"`, `"updatedAt"`, `"due"`
- `order` (string) - Kolejność sortowania (domyślnie: "desc")
  - Dozwolone wartości: `"asc"`, `"desc"`
- `source` (string) - Filtr po źródle pochodzenia
  - Dozwolone wartości: `"ai-full"`, `"ai-edited"`, `"manual"`
- `state` (number) - Filtr po stanie FSRS
  - Dozwolone wartości: `0` (new), `1` (learning), `2` (review), `3` (relearning)

### Request Body
Brak (GET request)

### Headers
- `Authorization: Bearer <token>` - Wymagany token JWT dla autentykacji

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

**ListFlashcardsQuery** (`src/types.ts`)
```typescript
export interface ListFlashcardsQuery {
  page?: number;
  limit?: number;
  sort?: "createdAt" | "updatedAt" | "due";
  order?: "asc" | "desc";
  source?: FlashcardSource;
  state?: FSRSState;
}
```

**ListFlashcardsResponse** (`src/types.ts`)
```typescript
export interface ListFlashcardsResponse {
  data: Pick<Flashcard, "id" | "front" | "back" | "source" | "state" | "due" | "created_at" | "updated_at">[];
  pagination: PaginationInfo;
}
```

**PaginationInfo** (`src/types.ts`)
```typescript
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

**FlashcardSource** (`src/types.ts`)
```typescript
export type FlashcardSource = "ai-full" | "ai-edited" | "manual";
```

**FSRSState** (`src/types.ts`)
```typescript
export type FSRSState = 0 | 1 | 2 | 3; // new, learning, review, relearning
```

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
    "data": [
      {
        "id": "uuid",
        "front": "string",
        "back": "string",
        "source": "ai-full" | "ai-edited" | "manual",
        "state": 0 | 1 | 2 | 3,
        "due": "ISO 8601 timestamp",
        "created_at": "ISO 8601 timestamp",
        "updated_at": "ISO 8601 timestamp"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 100,
      "totalPages": 4
    }
  }
}
```

**Uwagi:**
- Pola w odpowiedzi są w formacie `snake_case` zgodnie z konwencją bazy danych
- `due` jest w formacie ISO 8601 timestamp z timezone
- `created_at` i `updated_at` są w formacie ISO 8601 timestamp z timezone
- `state` jest liczbą całkowitą reprezentującą stan FSRS
- `source` jest stringiem z wartością enum

### Error Responses

**400 Bad Request** - Błędne parametry query
```json
{
  "success": false,
  "error": {
    "message": "Invalid query parameters",
    "code": "VALIDATION_ERROR",
    "field": "limit"
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

### Krok 2: Walidacja parametrów query
1. Parsowanie parametrów query z URL
2. Walidacja przez Zod schema:
   - `page`: liczba całkowita >= 1 (domyślnie: 1)
   - `limit`: liczba całkowita 1-100 (domyślnie: 25)
   - `sort`: enum ["createdAt", "updatedAt", "due"] (domyślnie: "createdAt")
   - `order`: enum ["asc", "desc"] (domyślnie: "desc")
   - `source`: enum ["ai-full", "ai-edited", "manual"] (opcjonalne)
   - `state`: liczba całkowita 0-3 (opcjonalne)
3. Zwrócenie błędu 400 w przypadku nieprawidłowych wartości

### Krok 3: Budowanie zapytania do bazy danych
1. Mapowanie pola sortowania z camelCase (API) na snake_case (baza):
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`
   - `due` → `due`
2. Budowanie zapytania Supabase:
   - Filtrowanie po `user_id` (automatycznie przez RLS, ale dodajemy dla przejrzystości)
   - Opcjonalne filtrowanie po `source` (jeśli podane)
   - Opcjonalne filtrowanie po `state` (jeśli podane)
   - Sortowanie po wybranym polu i kolejności
   - Paginacja z użyciem `.range()`
   - Pobranie tylko wymaganych pól: `id, front, back, source, state, due, created_at, updated_at`
   - Pobranie całkowitej liczby rekordów (`count: "exact"`)

### Krok 4: Wykonanie zapytania
1. Wywołanie metody `listFlashcards` w `FlashcardService`
2. Obsługa błędów bazy danych
3. Zwrócenie pustej listy i błędu w przypadku problemów z bazą

### Krok 5: Przygotowanie odpowiedzi
1. Obliczenie `totalPages`: `Math.ceil(total / limit)`
2. Utworzenie obiektu `PaginationInfo`
3. Mapowanie danych z bazy (już w formacie snake_case) do odpowiedzi
4. Zwrócenie odpowiedzi 200 OK z danymi i paginacją

### Diagram przepływu

```
Client Request
    ↓
[Authentication Check]
    ↓ (401 if invalid)
[Query Parameter Validation]
    ↓ (400 if invalid)
[Build Database Query]
    ↓
[Execute Query via FlashcardService]
    ↓ (500 if error)
[Format Response]
    ↓
[Return 200 OK with data]
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

### Walidacja danych wejściowych
- **Zod schema:** Wszystkie parametry query są walidowane przez Zod przed użyciem
- **Ograniczenia wartości:**
  - `page`: minimum 1
  - `limit`: 1-100 (zapobiega nadmiernemu obciążeniu)
  - `sort`: tylko dozwolone pola (zapobiega SQL injection przez sortowanie)
  - `order`: tylko "asc" lub "desc"
  - `source`: tylko dozwolone wartości enum
  - `state`: tylko 0-3 (zapobiega nieprawidłowym wartościom)

### Ochrona przed atakami
- **SQL Injection:** Supabase używa parametryzowanych zapytań, a sortowanie jest mapowane przez whitelistę
- **Rate Limiting:** (Opcjonalnie) Można dodać rate limiting dla endpointu GET, ale zwykle nie jest wymagany dla operacji odczytu
- **Data Exposure:** RLS zapewnia, że użytkownik nie może uzyskać dostępu do fiszek innych użytkowników, nawet jeśli zna ich ID

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
  return ResponseUtils.createAuthErrorResponse(
    authError?.message || "Invalid or expired token"
  );
}
```

#### 3. Nieprawidłowe parametry query (400 Bad Request)
**Przyczyna:** Parametry query nie spełniają wymagań walidacji
**Przykłady:**
- `page` < 1
- `limit` < 1 lub > 100
- `sort` nie jest jednym z dozwolonych wartości
- `order` nie jest "asc" lub "desc"
- `source` nie jest jednym z dozwolonych wartości
- `state` nie jest liczbą 0-3

**Obsługa:**
```typescript
if (!validationResult.success) {
  const firstError = validationResult.error.errors[0];
  return ResponseUtils.createValidationErrorResponse(
    firstError?.message || "Invalid query parameters",
    firstError?.path.join(".") || "unknown"
  );
}
```

#### 4. Błąd bazy danych (500 Internal Server Error)
**Przyczyna:** Problem z połączeniem do bazy, błąd zapytania SQL, lub inny błąd infrastruktury
**Obsługa:**
```typescript
if (fetchError) {
  return ResponseUtils.createInternalErrorResponse(
    `Failed to fetch flashcards: ${fetchError.message}`
  );
}
```

#### 5. Nieoczekiwany błąd (500 Internal Server Error)
**Przyczyna:** Wyjątek w kodzie, który nie został obsłużony
**Obsługa:**
```typescript
catch (error) {
  if (import.meta.env.NODE_ENV === "development" && error instanceof Error) {
    console.error("Error in GET /api/flashcards:", error.message);
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

1. **`idx_flashcards_user_id`** - Optymalizuje filtrowanie po użytkowniku
   ```sql
   CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
   ```

2. **`idx_flashcards_due`** - Optymalizuje sortowanie po dacie powtórki
   ```sql
   CREATE INDEX idx_flashcards_due ON flashcards(due);
   ```

3. **Złożony indeks dla sesji nauki** - Optymalizuje najczęstszy przypadek użycia
   ```sql
   CREATE INDEX idx_flashcards_user_due ON flashcards(user_id, due) WHERE due <= now();
   ```

**Uwaga:** Dla sortowania po `created_at` i `updated_at` można rozważyć dodatkowe indeksy, ale podstawowy indeks na `user_id` powinien wystarczyć dla większości przypadków.

### Optymalizacje zapytania

1. **Selekcja tylko wymaganych pól:** Zapytanie pobiera tylko pola potrzebne w odpowiedzi, nie wszystkie kolumny tabeli
   ```typescript
   .select("id,front,back,source,state,due,created_at,updated_at")
   ```

2. **Paginacja:** Użycie `.range()` zamiast pobierania wszystkich rekordów
   ```typescript
   .range((page - 1) * limit, page * limit - 1)
   ```

3. **Count z dokładnością:** Użycie `count: "exact"` dla dokładnej liczby rekordów (wymagane dla paginacji)

4. **Filtrowanie po stronie bazy:** Wszystkie filtry (`source`, `state`) są aplikowane w zapytaniu SQL, nie w kodzie aplikacji

### Potencjalne wąskie gardła

1. **Duże kolekcje fiszek:** Dla użytkowników z tysiącami fiszek, sortowanie może być wolne
   - **Rozwiązanie:** Indeksy na polach sortowania, szczególnie `created_at` i `updated_at`

2. **Zliczanie całkowitej liczby:** `count: "exact"` może być kosztowne dla dużych tabel
   - **Rozwiązanie:** Dla bardzo dużych kolekcji można rozważyć przybliżone zliczanie lub cache

3. **Równoczesne żądania:** Wiele równoczesnych żądań GET może obciążyć bazę
   - **Rozwiązanie:** (Opcjonalnie) Rate limiting, cache odpowiedzi dla często używanych zapytań

### Rekomendacje

1. **Monitorowanie:** Śledzenie czasu odpowiedzi endpointu i identyfikacja wolnych zapytań
2. **Cache:** (Opcjonalnie) Cache odpowiedzi dla często używanych kombinacji parametrów (np. pierwsza strona bez filtrów)
3. **Paginacja:** Utrzymanie maksymalnego limitu 100 elementów na stronę
4. **Indeksy:** Rozważenie dodatkowych indeksów na `created_at` i `updated_at` jeśli sortowanie po tych polach jest wolne

## 9. Etapy wdrożenia

### Krok 1: Utworzenie schematu walidacji Zod
**Lokalizacja:** `src/pages/api/flashcards/index.ts`

Utworzenie schematu walidacji dla parametrów query:
```typescript
const ListFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  sort: z.enum(["createdAt", "updatedAt", "due"]).optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
  state: z.coerce.number().int().min(0).max(3).optional(),
});
```

**Uwagi:**
- Użycie `z.coerce` dla `page`, `limit` i `state` aby automatycznie konwertować stringi z URL na liczby
- Domyślne wartości zgodne ze specyfikacją API
- Walidacja zakresów wartości

### Krok 2: Dodanie metody `listFlashcards` do `FlashcardService`
**Lokalizacja:** `src/lib/services/flashcard.service.ts`

Implementacja metody listującej fiszki z paginacją i filtrowaniem:
```typescript
async listFlashcards(
  userId: string,
  options: {
    page: number;
    limit: number;
    sort: "createdAt" | "updatedAt" | "due";
    order: "asc" | "desc";
    source?: FlashcardSource;
    state?: FSRSState;
  }
): Promise<{
  data: Pick<Flashcard, "id" | "front" | "back" | "source" | "state" | "due" | "created_at" | "updated_at">[];
  total: number;
  error: Error | null;
}>
```

**Szczegóły implementacji:**
1. Mapowanie pola sortowania z camelCase na snake_case
2. Budowanie zapytania Supabase z filtrowaniem po `user_id`
3. Opcjonalne dodanie filtrów `.eq("source", options.source)` i `.eq("state", options.state)`
4. Sortowanie przez `.order(sortField, { ascending: options.order === "asc" })`
5. Paginacja przez `.range((options.page - 1) * options.limit, options.page * options.limit - 1)`
6. Pobranie tylko wymaganych pól i count
7. Obsługa błędów i zwrócenie wyniku

**Wzorzec:** Podobny do `GenerationService.listGenerations()`

### Krok 3: Implementacja handlera GET
**Lokalizacja:** `src/pages/api/flashcards/index.ts`

Dodanie eksportu `GET: APIRoute` z następującą logiką:

1. **Walidacja autentykacji:**
   - Sprawdzenie `DEFAULT_USER_ID` dla development
   - Wyodrębnienie tokena Bearer
   - Weryfikacja tokena przez `AuthUtils.verifyToken()`
   - Pobranie `userId`

2. **Walidacja parametrów query:**
   - Parsowanie parametrów z URL
   - Walidacja przez `ListFlashcardsQuerySchema`
   - Zwrócenie błędu 400 w przypadku niepowodzenia

3. **Pobranie danych:**
   - Wywołanie `flashcardService.listFlashcards(userId, options)`
   - Obsługa błędów bazy danych

4. **Przygotowanie odpowiedzi:**
   - Obliczenie `totalPages`
   - Utworzenie obiektu `PaginationInfo`
   - Mapowanie danych do `ListFlashcardsResponse`
   - Zwrócenie odpowiedzi 200 OK

5. **Obsługa wyjątków:**
   - Try-catch dla nieoczekiwanych błędów
   - Logowanie w development
   - Zwrócenie błędu 500

**Wzorzec:** Podobny do `GET /api/generations`

### Krok 4: Testowanie
**Lokalizacja:** Testy jednostkowe i integracyjne

**Scenariusze testowe:**

1. **Testy autentykacji:**
   - Brak tokena → 401
   - Nieprawidłowy token → 401
   - Poprawny token → 200

2. **Testy walidacji parametrów:**
   - Nieprawidłowy `page` (< 1) → 400
   - Nieprawidłowy `limit` (< 1 lub > 100) → 400
   - Nieprawidłowy `sort` → 400
   - Nieprawidłowy `order` → 400
   - Nieprawidłowy `source` → 400
   - Nieprawidłowy `state` (< 0 lub > 3) → 400

3. **Testy funkcjonalności:**
   - Pobranie pierwszej strony (domyślne parametry) → 200 z danymi
   - Paginacja (różne strony) → poprawne dane
   - Sortowanie po różnych polach → poprawne kolejność
   - Filtrowanie po `source` → tylko fiszki z danym źródłem
   - Filtrowanie po `state` → tylko fiszki z danym stanem
   - Kombinacja filtrów → poprawne wyniki
   - Pusta kolekcja → 200 z pustą tablicą i total=0

4. **Testy bezpieczeństwa:**
   - Użytkownik A nie widzi fiszek użytkownika B (RLS)
   - Filtrowanie automatycznie po `user_id`

5. **Testy wydajności:**
   - Czas odpowiedzi dla różnych rozmiarów kolekcji
   - Wydajność sortowania
   - Wydajność paginacji

### Krok 5: Dokumentacja i code review
**Akcje:**
1. Sprawdzenie zgodności z regułami implementacji (backend, shared, astro)
2. Weryfikacja użycia prawidłowych kodów statusu HTTP
3. Sprawdzenie zgodności z konwencjami nazewnictwa
4. Weryfikacja obsługi błędów
5. Sprawdzenie komentarzy w kodzie (JSDoc)

### Krok 6: Integracja z frontendem
**Uwagi:**
- Endpoint jest gotowy do użycia przez frontend
- Frontend powinien obsługiwać paginację i filtry zgodnie ze specyfikacją
- Przykładowe użycie:
  ```typescript
  const response = await fetch('/api/flashcards?page=1&limit=25&sort=createdAt&order=desc&source=ai-full', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  ```

## 10. Dodatkowe uwagi

### Zgodność z regułami implementacji

1. **Astro guidelines:**
   - ✅ Użycie `export const prerender = false` dla API route
   - ✅ Użycie `APIRoute` type z Astro
   - ✅ Użycie `locals.supabase` zamiast bezpośredniego importu

2. **Backend guidelines:**
   - ✅ Użycie Supabase dla operacji bazy danych
   - ✅ Użycie Zod do walidacji danych wejściowych
   - ✅ Użycie `SupabaseClient` type z `src/db/supabase.client.ts`

3. **Shared guidelines:**
   - ✅ Obsługa błędów na początku funkcji (early returns)
   - ✅ Użycie guard clauses
   - ✅ Czytelny kod bez niepotrzebnych else

### Zgodność z PRD

- **FR-012:** Lista fiszek z paginacją ✅
- **FR-013:** Filtrowanie i sortowanie fiszek ✅
- **FR-010:** Dostęp tylko do własnych fiszek (RLS) ✅

### Potencjalne rozszerzenia w przyszłości

1. **Wyszukiwanie tekstowe:** Dodanie parametru `search` do wyszukiwania po `front` i `back`
2. **Zaawansowane filtry:** Filtrowanie po zakresie dat (`createdAt`, `updatedAt`, `due`)
3. **Sortowanie wielokolumnowe:** Sortowanie po wielu polach jednocześnie
4. **Cache:** Implementacja cache dla często używanych zapytań
5. **Metryki:** Śledzenie najczęściej używanych filtrów i sortowań dla optymalizacji

---

**Status:** Plan gotowy do implementacji
**Ostatnia aktualizacja:** 2025-01-XX
