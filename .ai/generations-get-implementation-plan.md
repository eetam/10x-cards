# API Endpoint Implementation Plan: List User Generations

## 1. Przegląd punktu końcowego

Endpoint `GET /api/generations` służy do pobierania listy sesji generowania fiszek przez AI dla zalogowanego użytkownika. Endpoint umożliwia przeglądanie historii generacji z paginacją, sortowaniem i filtrowaniem. Użytkownik może przeglądać tylko swoje własne sesje generowania dzięki Row-Level Security (RLS) w bazie danych.

**Funkcjonalność:**
- Pobieranie listy sesji generowania z paginacją
- Sortowanie po polu `createdAt` lub `model`
- Określanie kierunku sortowania (ascending/descending)
- Automatyczne filtrowanie po użytkowniku (RLS)
- Zwracanie metadanych paginacji (strona, limit, całkowita liczba, liczba stron)
- Konwersja danych z bazy danych (snake_case) do formatu API (camelCase)

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/generations`
- **Parametry:**
  - **Wymagane:** Brak
  - **Opcjonalne:**
    - `page` (number) - Numer strony (domyślnie: 1, minimum: 1)
    - `limit` (number) - Liczba elementów na stronę (domyślnie: 25, maksimum: 100, minimum: 1)
    - `sort` (string) - Pole sortowania: `"createdAt"` lub `"model"` (domyślnie: `"createdAt"`)
    - `order` (string) - Kierunek sortowania: `"asc"` lub `"desc"` (domyślnie: `"desc"`)
- **Request Body:** Brak (GET request)
- **Headers:**
  - `Authorization: Bearer <jwt_token>` - Wymagany token JWT Supabase Auth

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

- **`ListGenerationsResponse`** - Typ odpowiedzi zgodny z `src/types.ts`:
  ```typescript
  {
    data: Array<{
      id: string;
      model: string;
      generatedCount: number;
      acceptedUneditedCount: number | null;
      acceptedEditedCount: number | null;
      createdAt: string; // ISO 8601 timestamp
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
  ```

- **`ListGenerationsQuery`** - Typ parametrów zapytania z `src/types.ts`:
  ```typescript
  {
    page?: number;
    limit?: number;
    sort?: "createdAt" | "model";
    order?: "asc" | "desc";
  }
  ```

- **`PaginationInfo`** - Typ informacji o paginacji z `src/types.ts`:
  ```typescript
  {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
  ```

### Typy bazy danych

- **`Generation`** - Typ z `src/types.ts` (alias dla `Tables<"generations">`)
- **`SupabaseClient`** - Typ klienta Supabase z `src/db/supabase.client.ts`

### Typy pomocnicze

- **`ApiError`** - Typ błędu API z `src/types.ts`
- **`ApiResponse<ListGenerationsResponse>`** - Typ odpowiedzi API

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

**Response Body:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "model": "openai/gpt-4o-mini",
      "generatedCount": 8,
      "acceptedUneditedCount": 5,
      "acceptedEditedCount": 2,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "model": "anthropic/claude-3-haiku",
      "generatedCount": 12,
      "acceptedUneditedCount": null,
      "acceptedEditedCount": null,
      "createdAt": "2024-01-14T15:20:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 42,
    "totalPages": 2
  },
  "success": true
}
```

**Kod statusu:** 200 OK

### Błędy

#### 401 Unauthorized
**Przyczyna:** Brak tokenu autoryzacyjnego lub nieprawidłowy/wygasły token

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

#### 400 Bad Request
**Przyczyna:** Nieprawidłowe wartości parametrów zapytania

**Response Body:**
```json
{
  "error": {
    "message": "Invalid query parameter: page must be a positive integer",
    "code": "VALIDATION_ERROR",
    "field": "page"
  },
  "success": false
}
```

**Możliwe błędy walidacji:**
- `page` < 1
- `limit` < 1 lub `limit` > 100
- `sort` nie jest jednym z dozwolonych wartości (`"createdAt"`, `"model"`)
- `order` nie jest jednym z dozwolonych wartości (`"asc"`, `"desc"`)

#### 500 Internal Server Error
**Przyczyna:** Błąd serwera podczas przetwarzania żądania

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

## 5. Przepływ danych

### Krok 1: Walidacja autentykacji
1. Wyodrębnienie tokenu Bearer z nagłówka `Authorization`
2. Weryfikacja tokenu JWT za pomocą `AuthUtils.verifyToken()`
3. Pobranie identyfikatora użytkownika z tokenu
4. Zwrócenie 401 w przypadku niepowodzenia autentykacji

### Krok 2: Walidacja parametrów zapytania
1. Pobranie parametrów z URL (`url.searchParams`)
2. Parsowanie i walidacja parametrów za pomocą Zod schema:
   - `page`: opcjonalny, domyślnie 1, minimum 1, integer
   - `limit`: opcjonalny, domyślnie 25, minimum 1, maksimum 100, integer
   - `sort`: opcjonalny, domyślnie `"createdAt"`, enum: `"createdAt"` | `"model"`
   - `order`: opcjonalny, domyślnie `"desc"`, enum: `"asc"` | `"desc"`
3. Zwrócenie 400 w przypadku nieprawidłowych wartości

### Krok 3: Przygotowanie zapytania do bazy danych
1. Utworzenie instancji `GenerationService` z klientem Supabase z `locals.supabase`
2. Mapowanie pola sortowania z formatu API na format bazy danych:
   - `"createdAt"` → `"created_at"`
   - `"model"` → `"model"`
3. Przygotowanie zapytania z:
   - Filtrowaniem po `user_id` (automatyczne przez RLS)
   - Sortowaniem po wybranym polu i kierunku
   - Limitowaniem wyników (`limit`)
   - Offsetem dla paginacji (`(page - 1) * limit`)
   - Selekcją tylko wymaganych pól

### Krok 4: Wykonanie zapytania do bazy danych
1. Wykonanie zapytania SELECT do tabeli `generations`
2. Pobranie całkowitej liczby rekordów (dla paginacji) za pomocą `count()`
3. Pobranie danych z paginacją
4. Obsługa błędów zapytania

### Krok 5: Transformacja danych
1. Mapowanie pól z formatu bazy danych (snake_case) do formatu API (camelCase) dla każdego rekordu:
   - `id` → `id`
   - `model` → `model`
   - `generated_count` → `generatedCount`
   - `accepted_unedited_count` → `acceptedUneditedCount`
   - `accepted_edited_count` → `acceptedEditedCount`
   - `created_at` → `createdAt`
2. Obsługa wartości `null` dla opcjonalnych pól (`accepted_unedited_count`, `accepted_edited_count`)

### Krok 6: Obliczenie metadanych paginacji
1. Obliczenie `totalPages`: `Math.ceil(total / limit)`
2. Upewnienie się, że `page` nie przekracza `totalPages` (jeśli tak, zwróć pustą listę lub błąd)
3. Utworzenie obiektu `PaginationInfo`

### Krok 7: Przygotowanie i zwrócenie odpowiedzi
1. Utworzenie obiektu `ListGenerationsResponse` z:
   - `data`: tablica przekształconych rekordów
   - `pagination`: metadane paginacji
2. Zwrócenie odpowiedzi 200 OK z danymi

## 6. Względy bezpieczeństwa

### Autentykacja
- **Wymagany token JWT:** Wszystkie żądania muszą zawierać prawidłowy token Bearer w nagłówku `Authorization`
- **Weryfikacja tokenu:** Token jest weryfikowany za pomocą `AuthUtils.verifyToken()` z Supabase Auth
- **Wygaśnięcie tokenu:** Wygasłe tokeny są automatycznie odrzucane przez Supabase

### Autoryzacja
- **Row-Level Security (RLS):** Tabela `generations` ma włączone RLS, które automatycznie filtruje rekordy na podstawie `user_id = auth.uid()`
- **Izolacja danych:** Użytkownik może przeglądać tylko swoje własne sesje generowania
- **Brak wycieku informacji:** RLS zapewnia, że nawet jeśli zapytanie SQL zostanie zmodyfikowane, użytkownik nie zobaczy danych innych użytkowników

### Walidacja danych wejściowych
- **Walidacja parametrów:** Wszystkie parametry zapytania są walidowane przed wykonaniem zapytania do bazy
- **Ograniczenie limit:** Maksymalny limit 100 zapobiega przeciążeniu serwera i bazy danych
- **Zapobieganie SQL Injection:** Użycie Supabase client z parametryzowanymi zapytaniami eliminuje ryzyko SQL injection
- **Ochrona przed DoS:** Ograniczenie `limit` do maksymalnie 100 elementów zapobiega przeciążeniu

### Bezpieczeństwo odpowiedzi
- **Filtrowanie danych:** Zwracane są tylko pola zdefiniowane w `ListGenerationsResponse`, nie wszystkie pola z bazy danych
- **Brak wrażliwych danych:** Endpoint nie zwraca `source_text_hash`, `user_id` ani innych wrażliwych informacji
- **Pusta lista zamiast błędu:** Jeśli użytkownik nie ma żadnych generacji, zwracana jest pusta lista zamiast błędu 404

## 7. Obsługa błędów

### Scenariusze błędów i kody statusu

| Scenariusz | Kod statusu | Komunikat błędu | Kod błędu |
|------------|-------------|-----------------|-----------|
| Brak nagłówka Authorization | 401 | "Authentication required" | UNAUTHORIZED |
| Nieprawidłowy token JWT | 401 | "Invalid or expired token" | UNAUTHORIZED |
| Wygasły token JWT | 401 | "Invalid or expired token" | UNAUTHORIZED |
| `page` < 1 | 400 | "Page must be at least 1" | VALIDATION_ERROR |
| `limit` < 1 | 400 | "Limit must be at least 1" | VALIDATION_ERROR |
| `limit` > 100 | 400 | "Limit must not exceed 100" | VALIDATION_ERROR |
| Nieprawidłowa wartość `sort` | 400 | "Sort must be one of: createdAt, model" | VALIDATION_ERROR |
| Nieprawidłowa wartość `order` | 400 | "Order must be one of: asc, desc" | VALIDATION_ERROR |
| Błąd połączenia z bazą danych | 500 | "Internal server error" | INTERNAL_ERROR |
| Nieoczekiwany błąd serwera | 500 | "Internal server error" | INTERNAL_ERROR |

### Strategia obsługi błędów

1. **Wczesne zwracanie błędów:** Walidacja i autentykacja są wykonywane na początku, przed kosztownymi operacjami
2. **Spójne formaty odpowiedzi:** Wszystkie błędy używają `ResponseUtils.createErrorResponse()` dla spójności
3. **Logowanie błędów:** Błędy serwera są logowane w trybie development dla debugowania
4. **Bezpieczne komunikaty:** Komunikaty błędów nie ujawniają szczegółów implementacji ani wrażliwych informacji
5. **Szczegółowe komunikaty walidacji:** Błędy walidacji zawierają informacje o konkretnym polu i przyczynie błędu

## 8. Rozważania dotyczące wydajności

### Optymalizacje zapytań
- **Indeks na `user_id`:** Indeks `idx_generations_user_id` optymalizuje filtrowanie po użytkowniku (wykorzystywane przez RLS)
- **Indeks na `created_at`:** Indeks `idx_generations_created_at` optymalizuje sortowanie po dacie (domyślne sortowanie)
- **Indeks na `model`:** Indeks `idx_generations_model` optymalizuje sortowanie po modelu
- **Selekcja pól:** Zapytanie pobiera tylko wymagane pola, nie wszystkie kolumny
- **Paginacja:** Użycie `limit` i `offset` zapobiega pobieraniu wszystkich rekordów naraz
- **Count query:** Zapytanie `count()` może być kosztowne dla dużych tabel, ale jest konieczne dla paginacji

### Caching
- **Brak cache:** Endpoint nie implementuje cache, ponieważ dane mogą być często aktualizowane (nowe generacje, aktualizacje statystyk)
- **Możliwość rozszerzenia:** W przyszłości można rozważyć cache z krótkim TTL (np. 30 sekund) dla często przeglądanych stron

### Limity i optymalizacje
- **Maksymalny limit:** Limit 100 elementów zapobiega przeciążeniu serwera i bazy danych
- **Domyślny limit:** Domyślny limit 25 elementów zapewnia dobrą wydajność przy rozsądnym rozmiarze odpowiedzi
- **Offset vs Cursor:** Obecna implementacja używa offset-based paginacji, która jest prosta ale może być wolniejsza dla dużych stron. W przyszłości można rozważyć cursor-based paginację

### Monitoring
- **Czas odpowiedzi:** Monitorowanie czasu odpowiedzi zapytania, szczególnie dla dużych stron
- **Wykorzystanie bazy danych:** Monitorowanie obciążenia bazy danych przy wielu równoczesnych żądaniach
- **Rozmiar odpowiedzi:** Monitorowanie rozmiaru odpowiedzi (szczególnie przy limit=100)

## 9. Etapy wdrożenia

### Krok 1: Utworzenie struktury pliku endpointu
1. Plik już istnieje: `src/pages/api/generations/index.ts` (używany przez POST)
2. Dodanie metody GET do istniejącego pliku (Astro obsługuje wiele metod w jednym pliku)
3. Importowanie wymaganych typów i narzędzi:
   - `APIRoute` z `astro`
   - `z` z `zod` dla walidacji
   - `ListGenerationsResponse`, `ListGenerationsQuery`, `PaginationInfo` z `src/types`
   - `AuthUtils` z `src/lib/utils/auth.utils`
   - `ResponseUtils` z `src/lib/utils/response.utils`
   - `GenerationService` z `src/lib/services/generation.service`

### Krok 2: Implementacja metody GET
1. Utworzenie funkcji `export const GET: APIRoute`
2. Dodanie parametrów `{ request, locals }`
3. Implementacja try-catch dla obsługi błędów

### Krok 3: Walidacja autentykacji
1. Wyodrębnienie tokenu z nagłówka `Authorization`
2. Wywołanie `AuthUtils.extractBearerToken()`
3. Weryfikacja tokenu za pomocą `AuthUtils.verifyToken()`
4. Zwrócenie 401 w przypadku niepowodzenia
5. Pobranie `userId` z zweryfikowanego tokenu

### Krok 4: Walidacja parametrów zapytania
1. Pobranie URL z `request.url`
2. Utworzenie obiektu `URLSearchParams` z `url.searchParams`
3. Utworzenie Zod schema dla walidacji parametrów:
   ```typescript
   const ListGenerationsQuerySchema = z.object({
     page: z.coerce.number().int().min(1).optional().default(1),
     limit: z.coerce.number().int().min(1).max(100).optional().default(25),
     sort: z.enum(["createdAt", "model"]).optional().default("createdAt"),
     order: z.enum(["asc", "desc"]).optional().default("desc"),
   });
   ```
4. Parsowanie i walidacja parametrów
5. Zwrócenie 400 w przypadku nieprawidłowych wartości

### Krok 5: Rozszerzenie GenerationService
1. Dodanie metody `listGenerations()` do `GenerationService`:
   ```typescript
   async listGenerations(
     userId: string,
     options: {
       page: number;
       limit: number;
       sort: "createdAt" | "model";
       order: "asc" | "desc";
     }
   ): Promise<{
     data: Generation[];
     total: number;
     error: Error | null;
   }>
   ```
2. Implementacja zapytania do bazy danych:
   - Mapowanie pola sortowania: `"createdAt"` → `"created_at"`
   - Użycie `this.supabase.from("generations")`
   - RLS automatycznie filtruje po `user_id`
   - Sortowanie: `.order(sortField, { ascending: order === "asc" })`
   - Paginacja: `.range((page - 1) * limit, page * limit - 1)`
   - Selekcja pól: `.select("id,model,generated_count,accepted_unedited_count,accepted_edited_count,created_at")`
3. Pobranie całkowitej liczby rekordów:
   - Użycie `.select("id", { count: "exact", head: true })` lub osobne zapytanie `count()`
4. Obsługa błędów zapytania

### Krok 6: Mapowanie danych do formatu API
1. Utworzenie funkcji mapującej w endpointzie lub serwisie:
   ```typescript
   function mapGenerationToResponse(generation: Generation) {
     return {
       id: generation.id,
       model: generation.model,
       generatedCount: generation.generated_count,
       acceptedUneditedCount: generation.accepted_unedited_count,
       acceptedEditedCount: generation.accepted_edited_count,
       createdAt: generation.created_at,
     };
   }
   ```
2. Mapowanie wszystkich rekordów z tablicy `data`
3. Obsługa wartości `null` dla opcjonalnych pól

### Krok 7: Obliczenie metadanych paginacji
1. Obliczenie `totalPages`: `Math.ceil(total / limit)`
2. Utworzenie obiektu `PaginationInfo`:
   ```typescript
   const pagination: PaginationInfo = {
     page,
     limit,
     total,
     totalPages: Math.ceil(total / limit),
   };
   ```

### Krok 8: Przygotowanie i zwrócenie odpowiedzi
1. Utworzenie obiektu `ListGenerationsResponse`:
   ```typescript
   const response: ListGenerationsResponse = {
     data: mappedData,
     pagination,
   };
   ```
2. Zwrócenie odpowiedzi 200 OK za pomocą `ResponseUtils.createSuccessResponse()`
3. Upewnienie się, że odpowiedź zawiera właściwą strukturę z `data`, `pagination` i `success`

### Krok 9: Obsługa przypadku pustej listy
1. Sprawdzenie czy `data` jest pusta
2. Zwrócenie odpowiedzi z pustą tablicą `data` i poprawnymi metadanymi paginacji
3. Upewnienie się, że `total` i `totalPages` są poprawne nawet dla pustej listy

### Krok 10: Obsługa błędów serwera
1. W bloku catch logowanie błędu w trybie development
2. Zwrócenie 500 za pomocą `ResponseUtils.createInternalErrorResponse()`
3. Upewnienie się, że szczegóły błędów nie są ujawniane w produkcji

### Krok 11: Testy (opcjonalne, ale zalecane)
1. Utworzenie pliku testowego w `src/pages/api/generations/__tests__/`
2. Testy dla:
   - Pomyślnego pobrania listy generacji
   - Paginacji (różne strony)
   - Sortowania (różne pola i kierunki)
   - Błędu 401 (brak autentykacji)
   - Błędu 400 (nieprawidłowe parametry)
   - Pustej listy (użytkownik bez generacji)
   - Mapowania danych
   - Obliczania metadanych paginacji

### Krok 12: Dokumentacja (opcjonalne)
1. Aktualizacja dokumentacji API jeśli istnieje
2. Dodanie przykładów użycia endpointu z różnymi parametrami

## 10. Uwagi implementacyjne

### Mapowanie pól sortowania

Pola sortowania w API używają camelCase (`"createdAt"`), podczas gdy w bazie danych używają snake_case (`"created_at"`). Należy zaimplementować mapowanie:

```typescript
function mapSortField(sort: "createdAt" | "model"): string {
  const fieldMap: Record<"createdAt" | "model", string> = {
    createdAt: "created_at",
    model: "model",
  };
  return fieldMap[sort];
}
```

### Paginacja w Supabase

Supabase używa metody `.range()` do paginacji, która przyjmuje indeksy (0-based):
- Pierwsza strona (page=1, limit=25): `.range(0, 24)`
- Druga strona (page=2, limit=25): `.range(25, 49)`
- Ogólny wzór: `.range((page - 1) * limit, page * limit - 1)`

### Pobieranie całkowitej liczby rekordów

Istnieją dwa podejścia do pobierania `total`:

1. **Osobne zapytanie count():**
   ```typescript
   const { count, error: countError } = await this.supabase
     .from("generations")
     .select("*", { count: "exact", head: true });
   ```

2. **Zapytanie z count w głównym zapytaniu:**
   ```typescript
   const { data, count, error } = await this.supabase
     .from("generations")
     .select("id,model,...", { count: "exact" })
     .order(...)
     .range(...);
   ```

Zalecane jest podejście 2, ponieważ wykonuje tylko jedno zapytanie do bazy danych.

### Obsługa wartości null

Pola `accepted_unedited_count` i `accepted_edited_count` mogą być `null` w bazie danych (gdy użytkownik jeszcze nie przeglądał propozycji). Należy upewnić się, że:
- Wartości `null` są poprawnie obsługiwane w mapowaniu
- Typ odpowiedzi pozwala na `null` dla tych pól
- Frontend jest przygotowany na obsługę `null`

### Walidacja z użyciem Zod coerce

Użycie `z.coerce.number()` w schemacie Zod automatycznie konwertuje stringi z URL na liczby:
```typescript
page: z.coerce.number().int().min(1).optional().default(1)
```

To jest wygodne, ponieważ parametry URL są zawsze stringami, ale musimy je przekonwertować na liczby.

### Testowanie w środowisku development

W trybie development można użyć `DEFAULT_USER_ID` z zmiennych środowiskowych do testowania bez pełnej autentykacji (podobnie jak w `POST /api/generations`), ale należy to zaimplementować tylko jeśli jest to zgodne z istniejącym wzorcem w projekcie.

### Edge cases

1. **Strona poza zakresem:** Jeśli `page` przekracza `totalPages`, zwróć pustą listę z poprawnymi metadanymi paginacji
2. **Brak generacji:** Jeśli użytkownik nie ma żadnych generacji, zwróć pustą listę z `total: 0` i `totalPages: 0`
3. **Limit większy niż total:** Jeśli `limit > total`, zwróć wszystkie dostępne rekordy z poprawnymi metadanymi

