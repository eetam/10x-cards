# API Endpoint Implementation Plan: Get Generation Details

## 1. Przegląd punktu końcowego

Endpoint `GET /api/generations/{generationId}` służy do pobierania szczegółowych informacji o sesji generowania fiszek przez AI. Endpoint umożliwia użytkownikowi przeglądanie metadanych sesji generowania, w tym liczby wygenerowanych i zaakceptowanych fiszek, czasu trwania generowania oraz innych statystyk związanych z sesją.

**Funkcjonalność:**

- Pobieranie szczegółów sesji generowania na podstawie identyfikatora
- Weryfikacja autoryzacji użytkownika (tylko właściciel może przeglądać swoje sesje)
- Zwracanie danych w formacie zgodnym z `GenerationDetailsResponse`
- Konwersja danych z bazy danych (snake_case) do formatu API (camelCase)
- Konwersja typu `interval` PostgreSQL na format ISO 8601 duration

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/generations/{generationId}`
- **Parametry:**
  - **Wymagane:**
    - `generationId` (uuid) - Identyfikator sesji generowania w parametrze ścieżki
  - **Opcjonalne:** Brak
- **Request Body:** Brak (GET request)
- **Headers:**
  - `Authorization: Bearer <jwt_token>` - Wymagany token JWT Supabase Auth

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

- **`GenerationDetailsResponse`** - Typ odpowiedzi zgodny z `src/types.ts`:
  ```typescript
  {
    id: string;
    userId: string;
    model: string;
    generatedCount: number;
    acceptedUneditedCount: number;
    acceptedEditedCount: number;
    sourceTextLength: number;
    generationDuration: string; // ISO 8601 duration
    createdAt: string; // ISO 8601 timestamp
  }
  ```

### Typy bazy danych

- **`Generation`** - Typ z `src/types.ts` (alias dla `Tables<"generations">`)
- **`SupabaseClient`** - Typ klienta Supabase z `src/db/supabase.client.ts`

### Typy pomocnicze

- **`ApiError`** - Typ błędu API z `src/types.ts`
- **`ApiResponse<GenerationDetailsResponse>`** - Typ odpowiedzi API

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

**Response Body:**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "model": "openai/gpt-4o-mini",
    "generatedCount": 8,
    "acceptedUneditedCount": 5,
    "acceptedEditedCount": 2,
    "sourceTextLength": 5234,
    "generationDuration": "PT15.234S",
    "createdAt": "2024-01-15T10:30:00.000Z"
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

#### 404 Not Found

**Przyczyna:** Sesja generowania o podanym ID nie istnieje lub nie należy do zalogowanego użytkownika

**Response Body:**

```json
{
  "error": {
    "message": "Generation not found",
    "code": "NOT_FOUND"
  },
  "success": false
}
```

#### 400 Bad Request

**Przyczyna:** Nieprawidłowy format UUID w parametrze `generationId`

**Response Body:**

```json
{
  "error": {
    "message": "Invalid generation ID format",
    "code": "VALIDATION_ERROR",
    "field": "generationId"
  },
  "success": false
}
```

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

### Krok 2: Walidacja parametrów

1. Pobranie `generationId` z parametrów ścieżki (`params.generationId`)
2. Walidacja formatu UUID za pomocą Zod schema
3. Zwrócenie 400 w przypadku nieprawidłowego formatu

### Krok 3: Pobranie danych z bazy

1. Utworzenie instancji `GenerationService` z klientem Supabase z `locals.supabase`
2. Wywołanie metody serwisu do pobrania danych generacji
3. Wykonanie zapytania do tabeli `generations` z filtrem:
   - `id = generationId`
   - RLS automatycznie filtruje po `user_id = auth.uid()`
4. Sprawdzenie czy rekord istnieje
5. Zwrócenie 404 jeśli rekord nie istnieje lub nie należy do użytkownika

### Krok 4: Transformacja danych

1. Mapowanie pól z formatu bazy danych (snake_case) do formatu API (camelCase):
   - `user_id` → `userId`
   - `generated_count` → `generatedCount`
   - `accepted_unedited_count` → `acceptedUneditedCount`
   - `accepted_edited_count` → `acceptedEditedCount`
   - `source_text_length` → `sourceTextLength`
   - `generation_duration` → `generationDuration` (z konwersją na ISO 8601)
   - `created_at` → `createdAt`
2. Konwersja `generation_duration` (PostgreSQL interval) na format ISO 8601 duration:
   - Jeśli `generation_duration` jest `null`, zwróć `null` lub pusty string
   - Konwersja formatu PostgreSQL interval (np. "00:00:15.234") na ISO 8601 (np. "PT15.234S")
   - Użycie funkcji pomocniczej do konwersji

### Krok 5: Przygotowanie odpowiedzi

1. Utworzenie obiektu `GenerationDetailsResponse`
2. Zwrócenie odpowiedzi 200 OK z danymi

## 6. Względy bezpieczeństwa

### Autentykacja

- **Wymagany token JWT:** Wszystkie żądania muszą zawierać prawidłowy token Bearer w nagłówku `Authorization`
- **Weryfikacja tokenu:** Token jest weryfikowany za pomocą `AuthUtils.verifyToken()` z Supabase Auth
- **Wygaśnięcie tokenu:** Wygasłe tokeny są automatycznie odrzucane przez Supabase

### Autoryzacja

- **Row-Level Security (RLS):** Tabela `generations` ma włączone RLS, które automatycznie filtruje rekordy na podstawie `user_id = auth.uid()`
- **Izolacja danych:** Użytkownik może przeglądać tylko swoje własne sesje generowania
- **Ochrona przed enumeracją:** Endpoint zwraca 404 zarówno gdy rekord nie istnieje, jak i gdy nie należy do użytkownika (zapobiega wyciekowi informacji)

### Walidacja danych wejściowych

- **Format UUID:** Parametr `generationId` jest walidowany jako prawidłowy UUID przed wykonaniem zapytania
- **Zapobieganie SQL Injection:** Użycie Supabase client z parametryzowanymi zapytaniami eliminuje ryzyko SQL injection

### Bezpieczeństwo odpowiedzi

- **Filtrowanie danych:** Zwracane są tylko pola zdefiniowane w `GenerationDetailsResponse`, nie wszystkie pola z bazy danych
- **Brak wrażliwych danych:** Endpoint nie zwraca `source_text_hash` ani innych wrażliwych informacji

## 7. Obsługa błędów

### Scenariusze błędów i kody statusu

| Scenariusz                         | Kod statusu | Komunikat błędu                | Kod błędu        |
| ---------------------------------- | ----------- | ------------------------------ | ---------------- |
| Brak nagłówka Authorization        | 401         | "Authentication required"      | UNAUTHORIZED     |
| Nieprawidłowy token JWT            | 401         | "Invalid or expired token"     | UNAUTHORIZED     |
| Wygasły token JWT                  | 401         | "Invalid or expired token"     | UNAUTHORIZED     |
| Nieprawidłowy format UUID          | 400         | "Invalid generation ID format" | VALIDATION_ERROR |
| Sesja nie istnieje                 | 404         | "Generation not found"         | NOT_FOUND        |
| Sesja należy do innego użytkownika | 404         | "Generation not found"         | NOT_FOUND        |
| Błąd połączenia z bazą danych      | 500         | "Internal server error"        | INTERNAL_ERROR   |
| Nieoczekiwany błąd serwera         | 500         | "Internal server error"        | INTERNAL_ERROR   |

### Strategia obsługi błędów

1. **Wczesne zwracanie błędów:** Walidacja i autentykacja są wykonywane na początku, przed kosztownymi operacjami
2. **Spójne formaty odpowiedzi:** Wszystkie błędy używają `ResponseUtils.createErrorResponse()` dla spójności
3. **Logowanie błędów:** Błędy serwera są logowane w trybie development dla debugowania
4. **Bezpieczne komunikaty:** Komunikaty błędów nie ujawniają szczegółów implementacji ani wrażliwych informacji
5. **Ochrona przed wyciekiem informacji:** 404 jest zwracany zarówno dla nieistniejących rekordów, jak i rekordów należących do innych użytkowników

## 8. Rozważania dotyczące wydajności

### Optymalizacje zapytań

- **Indeks na `id`:** Kolumna `id` jest kluczem podstawowym, więc zapytania są bardzo szybkie
- **Indeks na `user_id`:** Indeks `idx_generations_user_id` optymalizuje filtrowanie po użytkowniku (wykorzystywane przez RLS)
- **Pojedyncze zapytanie:** Endpoint wykonuje tylko jedno zapytanie SELECT do bazy danych
- **Selekcja pól:** Zapytanie pobiera tylko wymagane pola, nie wszystkie kolumny

### Caching

- **Brak cache:** Endpoint nie implementuje cache, ponieważ dane mogą być często aktualizowane (np. `accepted_unedited_count`, `accepted_edited_count`)
- **Możliwość rozszerzenia:** W przyszłości można rozważyć cache z krótkim TTL dla często przeglądanych sesji

### Konwersja danych

- **Efektywna konwersja:** Konwersja `interval` na ISO 8601 jest wykonywana w pamięci, bez dodatkowych zapytań do bazy
- **Funkcja pomocnicza:** Konwersja powinna być zaimplementowana jako funkcja pomocnicza w `GenerationService` lub osobnym utility

### Limity

- **Brak limitów:** Endpoint nie wymaga limitów, ponieważ zwraca pojedynczy rekord
- **Rozmiar odpowiedzi:** Odpowiedź jest mała (kilkaset bajtów), więc nie ma problemów z transferem

## 9. Etapy wdrożenia

### Krok 1: Utworzenie struktury pliku endpointu

1. Utworzenie pliku `src/pages/api/generations/[generationId]/index.ts`
2. Dodanie eksportu `export const prerender = false;`
3. Importowanie wymaganych typów i narzędzi:
   - `APIRoute` z `astro`
   - `z` z `zod` dla walidacji
   - `GenerationDetailsResponse` z `src/types`
   - `AuthUtils` z `src/lib/utils/auth.utils`
   - `ResponseUtils` z `src/lib/utils/response.utils`
   - `GenerationService` z `src/lib/services/generation.service`

### Krok 2: Implementacja metody GET

1. Utworzenie funkcji `export const GET: APIRoute`
2. Dodanie parametrów `{ request, locals, params }`
3. Implementacja try-catch dla obsługi błędów

### Krok 3: Walidacja autentykacji

1. Wyodrębnienie tokenu z nagłówka `Authorization`
2. Wywołanie `AuthUtils.extractBearerToken()`
3. Weryfikacja tokenu za pomocą `AuthUtils.verifyToken()`
4. Zwrócenie 401 w przypadku niepowodzenia
5. Pobranie `userId` z zweryfikowanego tokenu

### Krok 4: Walidacja parametru generationId

1. Pobranie `generationId` z `params.generationId`
2. Utworzenie Zod schema dla walidacji UUID:
   ```typescript
   const GenerationIdSchema = z.string().uuid();
   ```
3. Walidacja parametru
4. Zwrócenie 400 w przypadku nieprawidłowego formatu

### Krok 5: Rozszerzenie GenerationService

1. Dodanie metody `getGenerationById()` do `GenerationService`:
   ```typescript
   async getGenerationById(
     generationId: string,
     userId: string
   ): Promise<{ generation: Generation | null; error: Error | null }>
   ```
2. Implementacja zapytania do bazy danych:
   - Użycie `this.supabase.from("generations")`
   - Filtrowanie po `id = generationId`
   - RLS automatycznie filtruje po `user_id`
   - Pobranie wszystkich wymaganych pól
3. Obsługa błędów zapytania

### Krok 6: Implementacja konwersji interval na ISO 8601

1. Utworzenie funkcji pomocniczej w `GenerationService` lub osobnym utility:
   ```typescript
   function convertIntervalToISO8601(interval: string | null): string | null;
   ```
2. Implementacja konwersji:
   - Parsowanie formatu PostgreSQL interval (np. "00:00:15.234")
   - Konwersja na sekundy (z mikrosekundami)
   - Formatowanie jako ISO 8601 duration (np. "PT15.234S")
   - Obsługa wartości `null`
3. Alternatywnie: użycie biblioteki do konwersji (np. `luxon` lub `date-fns`)

### Krok 7: Mapowanie danych do GenerationDetailsResponse

1. Utworzenie funkcji mapującej w endpointzie lub serwisie
2. Mapowanie pól:
   - `id` → `id`
   - `user_id` → `userId`
   - `model` → `model`
   - `generated_count` → `generatedCount`
   - `accepted_unedited_count` → `acceptedUneditedCount`
   - `accepted_edited_count` → `acceptedEditedCount`
   - `source_text_length` → `sourceTextLength`
   - `generation_duration` → `generationDuration` (z konwersją)
   - `created_at` → `createdAt`
3. Obsługa wartości `null` dla opcjonalnych pól

### Krok 8: Obsługa przypadku "not found"

1. Sprawdzenie czy `generation` jest `null` po zapytaniu
2. Zwrócenie 404 z komunikatem "Generation not found"
3. Użycie `ResponseUtils.createErrorResponse()`

### Krok 9: Przygotowanie i zwrócenie odpowiedzi

1. Utworzenie obiektu `GenerationDetailsResponse`
2. Zwrócenie odpowiedzi 200 OK za pomocą `ResponseUtils.createSuccessResponse()`
3. Upewnienie się, że odpowiedź zawiera właściwą strukturę z `data` i `success`

### Krok 10: Obsługa błędów serwera

1. W bloku catch logowanie błędu w trybie development
2. Zwrócenie 500 za pomocą `ResponseUtils.createInternalErrorResponse()`
3. Upewnienie się, że szczegóły błędów nie są ujawniane w produkcji

### Krok 11: Testy (opcjonalne, ale zalecane)

1. Utworzenie pliku testowego w `src/pages/api/generations/[generationId]/__tests__/`
2. Testy dla:
   - Pomyślnego pobrania generacji
   - Błędu 401 (brak autentykacji)
   - Błędu 404 (nieistniejąca generacja)
   - Błędu 400 (nieprawidłowy format UUID)
   - Konwersji interval na ISO 8601
   - Mapowania danych

### Krok 12: Dokumentacja (opcjonalne)

1. Aktualizacja dokumentacji API jeśli istnieje
2. Dodanie przykładów użycia endpointu

## 10. Uwagi implementacyjne

### Konwersja PostgreSQL interval na ISO 8601

PostgreSQL zwraca typ `interval` w formacie tekstowym (np. "00:00:15.234" dla 15.234 sekundy). Konwersja na ISO 8601 duration wymaga:

1. **Parsowanie formatu PostgreSQL:**
   - Format: `HH:MM:SS.microseconds`
   - Przykład: "00:00:15.234" = 15.234 sekundy

2. **Konwersja na ISO 8601:**
   - Format: `PT{n}S` gdzie `n` to liczba sekund (z opcjonalnymi mikrosekundami)
   - Przykład: "PT15.234S"

3. **Implementacja przykładowa:**
   ```typescript
   function convertIntervalToISO8601(interval: string | null): string | null {
     if (!interval) return null;

     // Parse PostgreSQL interval format: "HH:MM:SS.microseconds"
     const parts = interval.split(":");
     if (parts.length !== 3) return null;

     const hours = parseInt(parts[0], 10);
     const minutes = parseInt(parts[1], 10);
     const seconds = parseFloat(parts[2]);

     const totalSeconds = hours * 3600 + minutes * 60 + seconds;

     return `PT${totalSeconds}S`;
   }
   ```

### Użycie Supabase Client

Zgodnie z regułami implementacji, należy używać `locals.supabase` zamiast bezpośredniego importu `supabaseClient`:

```typescript
const supabase = locals.supabase;
const generationService = new GenerationService(supabase);
```

### Obsługa wartości null

Pola `accepted_unedited_count`, `accepted_edited_count` i `generation_duration` mogą być `null` w bazie danych. Należy upewnić się, że:

- Wartości `null` są poprawnie obsługiwane w mapowaniu
- Typ `GenerationDetailsResponse` pozwala na `null` lub odpowiednie wartości domyślne
- Konwersja interval obsługuje `null`

### Testowanie w środowisku development

W trybie development można użyć `DEFAULT_USER_ID` z zmiennych środowiskowych do testowania bez pełnej autentykacji (podobnie jak w `POST /api/generations`), ale należy to zaimplementować tylko jeśli jest to zgodne z istniejącym wzorcem w projekcie.
