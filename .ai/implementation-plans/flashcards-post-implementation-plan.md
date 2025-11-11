# API Endpoint Implementation Plan: Create Flashcard

## 1. Przegląd punktu końcowego

Endpoint POST `/api/flashcards` służy do tworzenia nowej fiszki przez użytkownika. Fiszka może być utworzona ręcznie (`manual`), bezpośrednio z propozycji AI bez edycji (`ai-full`), lub z propozycji AI po edycji (`ai-edited`). Endpoint waliduje dane wejściowe, sprawdza unikalność fiszki dla danego użytkownika, weryfikuje opcjonalny `generationId` jeśli został podany, i tworzy nowy rekord w bazie danych z domyślnymi wartościami dla algorytmu FSRS.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/flashcards`
- **Parametry:**
  - **Wymagane:**
    - `front` (string, max 200 znaków) - Awers fiszki (pytanie)
    - `back` (string, max 500 znaków) - Rewers fiszki (odpowiedź)
    - `source` (string, enum: `'ai-full' | 'ai-edited' | 'manual'`) - Źródło pochodzenia fiszki
  - **Opcjonalne:**
    - `generationId` (uuid) - Identyfikator sesji generowania AI, z której pochodzi fiszka (wymagany dla `ai-full` i `ai-edited`)
- **Request Body:**

```json
{
  "front": "string (max 200 characters)",
  "back": "string (max 500 characters)",
  "source": "string (ai-full|ai-edited|manual)",
  "generationId": "uuid (optional, for AI-generated cards)"
}
```

## 3. Wykorzystywane typy

### DTOs z `src/types.ts`:

- `CreateFlashcardRequest` - struktura żądania z walidacją
- `CreateFlashcardResponse` - struktura odpowiedzi sukcesu
- `CreateFlashcardCommand` - alias dla requestu używany w logice biznesowej
- `FlashcardSource` - typ unii: `'ai-full' | 'ai-edited' | 'manual'`

### Typy bazy danych:

- `FlashcardInsert` - dane do wstawienia do tabeli `flashcards`
- `Flashcard` - pełny typ fiszki z bazy danych
- `Generation` - typ dla weryfikacji `generationId` (jeśli podany)

## 4. Szczegóły odpowiedzi

### Sukces (201 Created):

```json
{
  "id": "uuid",
  "userId": "uuid",
  "generationId": "uuid | null",
  "front": "string",
  "back": "string",
  "source": "string",
  "state": 0,
  "due": "ISO 8601 timestamp",
  "stability": 0,
  "difficulty": 0,
  "lapses": 0,
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

### Kody błędów:

- **400 Bad Request:** Nieprawidłowe dane wejściowe (puste pola, przekroczone limity długości, nieprawidłowy format `source`, nieprawidłowy format UUID dla `generationId`)
- **401 Unauthorized:** Brak uwierzytelnienia lub nieprawidłowy token
- **404 Not Found:** `generationId` podany, ale nie istnieje lub nie należy do użytkownika
- **409 Conflict:** Fiszka o identycznej treści (`front` + `back`) już istnieje dla danego użytkownika
- **500 Internal Server Error:** Błąd bazy danych, błąd podczas tworzenia rekordu

## 5. Przepływ danych

### Krok 1: Autentykacja

1. Wyodrębnienie tokenu Bearer z nagłówka `Authorization`
2. Weryfikacja tokenu JWT za pomocą Supabase Auth
3. Pobranie `userId` z zweryfikowanego tokenu
4. W trybie development: możliwość użycia `DEFAULT_USER_ID` z zmiennych środowiskowych

### Krok 2: Walidacja danych wejściowych

1. Parsowanie i walidacja body żądania za pomocą Zod schema:
   - `front`: string, max 200 znaków, niepusty po trim
   - `back`: string, max 500 znaków, niepusty po trim
   - `source`: enum `'ai-full' | 'ai-edited' | 'manual'`
   - `generationId`: opcjonalny UUID
2. Walidacja logiki biznesowej:
   - Jeśli `source` to `'ai-full'` lub `'ai-edited'`, `generationId` powinien być podany (opcjonalne, ale zalecane)
   - Jeśli `source` to `'manual'`, `generationId` powinien być `null` lub nie podany

### Krok 3: Weryfikacja generationId (jeśli podany)

1. Jeśli `generationId` został podany:
   - Walidacja formatu UUID
   - Sprawdzenie czy generacja istnieje w bazie danych
   - Sprawdzenie czy generacja należy do zalogowanego użytkownika (RLS automatycznie filtruje)
   - Zwrócenie 404 jeśli generacja nie istnieje lub nie należy do użytkownika

### Krok 4: Sprawdzenie duplikatów

1. Sprawdzenie czy fiszka o identycznej treści (`front` + `back`) już istnieje dla danego użytkownika
2. Wykonanie zapytania do bazy danych z filtrem: `user_id = userId AND front = front AND back = back`
3. Zwrócenie 409 Conflict jeśli duplikat istnieje

### Krok 5: Przygotowanie danych do wstawienia

1. Utworzenie obiektu `FlashcardInsert`:
   - `user_id`: `userId` z autentykacji
   - `generation_id`: `generationId` z requestu lub `null`
   - `front`: zwalidowany i obcięty tekst
   - `back`: zwalidowany i obcięty tekst
   - `source`: zwalidowana wartość
   - `state`: `0` (domyślnie - New)
   - `due`: `now()` (domyślnie - aktualny timestamp)
   - `stability`: `0` (domyślnie)
   - `difficulty`: `0` (domyślnie)
   - `lapses`: `0` (domyślnie)
   - `review_history`: `[]` (domyślnie - pusty JSON array)
   - `created_at`: automatycznie ustawione przez bazę
   - `updated_at`: automatycznie ustawione przez bazę

### Krok 6: Wstawienie do bazy danych

1. Wywołanie metody serwisu `FlashcardService.createFlashcard()`
2. Wykonanie `INSERT` do tabeli `flashcards`
3. RLS automatycznie weryfikuje, że `user_id` odpowiada `auth.uid()`
4. Obsługa błędu unikalności (UNIQUE constraint) - zwrócenie 409 Conflict
5. Obsługa innych błędów bazy danych - zwrócenie 500

### Krok 7: Transformacja odpowiedzi

1. Mapowanie pól z formatu bazy danych (snake_case) do formatu API (camelCase):
   - `user_id` → `userId`
   - `generation_id` → `generationId`
   - `created_at` → `createdAt`
   - `updated_at` → `updatedAt`
2. Konwersja timestampów na ISO 8601 stringi
3. Utworzenie obiektu `CreateFlashcardResponse`

### Krok 8: Zwrócenie odpowiedzi

1. Zwrócenie odpowiedzi 201 Created z danymi fiszki

## 6. Względy bezpieczeństwa

### Autentykacja

- **Wymagany token JWT:** Wszystkie żądania muszą zawierać prawidłowy token Bearer w nagłówku `Authorization`
- **Weryfikacja tokenu:** Token jest weryfikowany za pomocą `AuthUtils.verifyToken()` z Supabase Auth
- **Wygaśnięcie tokenu:** Wygasłe tokeny są automatycznie odrzucane przez Supabase
- **Tryb development:** W trybie development możliwe użycie `DEFAULT_USER_ID` z zmiennych środowiskowych dla testów

### Autoryzacja

- **Row-Level Security (RLS):** Tabela `flashcards` ma włączone RLS, które automatycznie filtruje rekordy na podstawie `user_id = auth.uid()`
- **Polityka INSERT:** RLS policy `"Users can insert their own flashcards"` zapewnia, że użytkownik może tworzyć fiszki tylko dla siebie (`with check ((select auth.uid()) = user_id)`)
- **Weryfikacja generationId:** Jeśli `generationId` jest podany, weryfikujemy że generacja należy do użytkownika (RLS automatycznie filtruje)

### Walidacja danych

- **Sanityzacja:** Wszystkie pola tekstowe są trimowane przed zapisem
- **Limity długości:** Enforced przez walidację Zod i ograniczenia bazy danych (varchar(200) dla `front`, varchar(500) dla `back`)
- **Enum validation:** `source` musi być jednym z dozwolonych wartości
- **UUID validation:** `generationId` musi być prawidłowym UUID jeśli podany

### Ochrona przed duplikatami

- **UNIQUE constraint:** Baza danych ma constraint `UNIQUE (user_id, front, back)` zapobiegający duplikatom
- **Weryfikacja przed wstawieniem:** Sprawdzamy duplikaty przed próbą wstawienia, aby zwrócić czytelny błąd 409

### Ochrona przed SQL Injection

- **Parametryzowane zapytania:** Supabase używa parametryzowanych zapytań, co zapobiega SQL injection
- **Type safety:** TypeScript zapewnia typową bezpieczeństwo na poziomie kompilacji

## 7. Obsługa błędów

### Błędy walidacji (400 Bad Request)

- **Puste pola:** `front` lub `back` są puste po trim
- **Przekroczone limity:** `front` > 200 znaków lub `back` > 500 znaków
- **Nieprawidłowy source:** `source` nie jest jednym z: `'ai-full'`, `'ai-edited'`, `'manual'`
- **Nieprawidłowy format UUID:** `generationId` ma nieprawidłowy format UUID
- **Format odpowiedzi:**

```json
{
  "error": {
    "message": "Validation error message",
    "code": "VALIDATION_ERROR",
    "field": "fieldName"
  },
  "success": false
}
```

### Błędy autentykacji (401 Unauthorized)

- **Brak tokenu:** Nagłówek `Authorization` nie zawiera tokenu Bearer
- **Nieprawidłowy token:** Token jest nieprawidłowy lub wygasł
- **Format odpowiedzi:**

```json
{
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  },
  "success": false
}
```

### Błędy nie znalezionych zasobów (404 Not Found)

- **Nieistniejąca generacja:** `generationId` podany, ale generacja nie istnieje lub nie należy do użytkownika
- **Format odpowiedzi:**

```json
{
  "error": {
    "message": "Generation not found",
    "code": "NOT_FOUND"
  },
  "success": false
}
```

### Błędy konfliktów (409 Conflict)

- **Duplikat fiszki:** Fiszka o identycznej treści (`front` + `back`) już istnieje dla danego użytkownika
- **Format odpowiedzi:**

```json
{
  "error": {
    "message": "Flashcard with this content already exists",
    "code": "DUPLICATE_FLASHCARD"
  },
  "success": false
}
```

### Błędy serwera (500 Internal Server Error)

- **Błąd bazy danych:** Nieoczekiwany błąd podczas operacji na bazie danych
- **Błąd serwisu:** Błąd w logice serwisu
- **Format odpowiedzi:**

```json
{
  "error": {
    "message": "Internal server error",
    "code": "INTERNAL_ERROR"
  },
  "success": false
}
```

### Logowanie błędów

- **Development:** Wszystkie błędy są logowane do konsoli z pełnym stack trace
- **Production:** Błędy są logowane bez wrażliwych informacji (np. stack trace)

## 8. Rozważania dotyczące wydajności

### Optymalizacje zapytań

- **Indeksy bazy danych:** Tabela `flashcards` ma indeksy:
  - `idx_flashcards_user_id` - optymalizuje zapytania filtrowane po użytkowniku
  - `idx_flashcards_generation_id` - optymalizuje zapytania filtrowane po generacji
  - `UNIQUE (user_id, front, back)` - automatycznie tworzy indeks dla sprawdzania duplikatów
- **RLS performance:** RLS używa `(select auth.uid())` co jest optymalne - wartość jest obliczana raz na zapytanie

### Sprawdzanie duplikatów

- **Przed wstawieniem:** Sprawdzamy duplikaty przed próbą wstawienia, aby uniknąć niepotrzebnego rollbacku transakcji
- **Indeks unikalności:** UNIQUE constraint automatycznie tworzy indeks, więc sprawdzanie duplikatów jest szybkie

### Weryfikacja generationId

- **Opcjonalna weryfikacja:** Weryfikujemy `generationId` tylko jeśli został podany
- **RLS filtering:** RLS automatycznie filtruje wyniki, więc nie musimy ręcznie sprawdzać własności

### Rozmiar odpowiedzi

- **Mały payload:** Odpowiedź zawiera tylko dane jednej fiszki (~500-1000 bajtów)
- **Brak paginacji:** Endpoint zwraca pojedynczy rekord, więc nie ma potrzeby paginacji

### Potencjalne wąskie gardła

- **Weryfikacja duplikatów:** Jeśli użytkownik ma wiele fiszek, sprawdzanie duplikatów może być wolniejsze (ale zoptymalizowane przez indeks)
- **RLS overhead:** RLS dodaje niewielki overhead do każdego zapytania, ale jest akceptowalny dla bezpieczeństwa

## 9. Etapy wdrożenia

### Krok 1: Utworzenie struktury pliku endpointu

1. Utworzenie pliku `src/pages/api/flashcards/index.ts`
2. Dodanie eksportu `export const prerender = false;`
3. Importowanie wymaganych typów i narzędzi:
   - `APIRoute` z `astro`
   - `z` z `zod` dla walidacji
   - `CreateFlashcardRequest`, `CreateFlashcardResponse`, `CreateFlashcardCommand` z `src/types`
   - `AuthUtils` z `src/lib/utils/auth.utils`
   - `ResponseUtils` z `src/lib/utils/response.utils`
   - `FlashcardService` z `src/lib/services/flashcard.service` (do utworzenia)
   - `GenerationService` z `src/lib/services/generation.service` (dla weryfikacji generationId)
   - `EnvConfig` z `src/lib/config/env.config`

### Krok 2: Utworzenie FlashcardService

1. Utworzenie pliku `src/lib/services/flashcard.service.ts`
2. Importowanie wymaganych typów:
   - `SupabaseClient` z `@supabase/supabase-js`
   - `Flashcard`, `FlashcardInsert`, `CreateFlashcardCommand` z `src/types`
3. Utworzenie klasy `FlashcardService`:
   ```typescript
   export class FlashcardService {
     constructor(private supabase: SupabaseClient) {}
   }
   ```
4. Implementacja metody `createFlashcard()`:
   - Przyjmuje `userId: string` i `command: CreateFlashcardCommand`
   - Zwraca `Promise<{ flashcard: Flashcard | null; error: Error | null }>`
   - Sprawdza duplikaty przed wstawieniem
   - Wstawia rekord do bazy danych
   - Obsługuje błędy (w tym UNIQUE constraint violation)
5. Implementacja metody pomocniczej `checkDuplicate()`:
   - Sprawdza czy fiszka o identycznej treści już istnieje
   - Zwraca `Promise<{ exists: boolean; error: Error | null }>`

### Krok 3: Utworzenie Zod schema dla walidacji

1. Utworzenie schema `CreateFlashcardSchema`:
   ```typescript
   const CreateFlashcardSchema = z.object({
     front: z.string().max(200, "Front must not exceed 200 characters").trim().min(1, "Front is required"),
     back: z.string().max(500, "Back must not exceed 500 characters").trim().min(1, "Back is required"),
     source: z.enum(["ai-full", "ai-edited", "manual"], {
       errorMap: () => ({ message: "Source must be one of: ai-full, ai-edited, manual" }),
     }),
     generationId: z.string().uuid("Invalid generation ID format").optional().nullable(),
   });
   ```
2. Dodanie walidacji logiki biznesowej:
   - Jeśli `source` to `'ai-full'` lub `'ai-edited'`, `generationId` powinien być podany (refine)
   - Jeśli `source` to `'manual'`, `generationId` powinien być `null` lub nie podany

### Krok 4: Implementacja metody POST

1. Utworzenie funkcji `export const POST: APIRoute`
2. Dodanie parametrów `{ request, locals }`
3. Implementacja try-catch dla obsługi błędów

### Krok 5: Walidacja autentykacji

1. Pobranie `defaultUserId` z `EnvConfig.getDefaultUserId()`
2. Jeśli `defaultUserId` istnieje (tryb development):
   - Użycie `defaultUserId` jako `userId`
3. W przeciwnym razie (normalny flow):
   - Wyodrębnienie tokenu z nagłówka `Authorization`
   - Wywołanie `AuthUtils.extractBearerToken()`
   - Weryfikacja tokenu za pomocą `AuthUtils.verifyToken()`
   - Zwrócenie 401 w przypadku niepowodzenia
   - Pobranie `userId` z zweryfikowanego tokenu

### Krok 6: Walidacja danych wejściowych

1. Parsowanie body żądania: `await request.json()`
2. Walidacja za pomocą `CreateFlashcardSchema.safeParse()`
3. Zwrócenie 400 w przypadku niepowodzenia walidacji
4. Wyodrębnienie zwalidowanych danych: `{ front, back, source, generationId }`

### Krok 7: Weryfikacja generationId (jeśli podany)

1. Jeśli `generationId` został podany:
   - Utworzenie instancji `GenerationService`
   - Wywołanie `generationService.getGenerationById(generationId, userId)`
   - Sprawdzenie czy generacja istnieje
   - Zwrócenie 404 jeśli generacja nie istnieje lub nie należy do użytkownika

### Krok 8: Sprawdzenie duplikatów

1. Utworzenie instancji `FlashcardService`
2. Wywołanie `flashcardService.checkDuplicate(userId, front, back)`
3. Jeśli duplikat istnieje, zwrócenie 409 Conflict

### Krok 9: Utworzenie fiszki

1. Przygotowanie danych do wstawienia:
   - Utworzenie obiektu `FlashcardInsert` z odpowiednimi wartościami
   - Ustawienie domyślnych wartości dla FSRS (state: 0, stability: 0, difficulty: 0, lapses: 0, review_history: [])
2. Wywołanie `flashcardService.createFlashcard(userId, command)`
3. Obsługa błędów:
   - Jeśli błąd UNIQUE constraint, zwrócenie 409 Conflict
   - Jeśli inny błąd bazy danych, zwrócenie 500

### Krok 10: Transformacja odpowiedzi

1. Mapowanie pól z snake_case do camelCase:
   - `user_id` → `userId`
   - `generation_id` → `generationId`
   - `created_at` → `createdAt`
   - `updated_at` → `updatedAt`
2. Konwersja timestampów na ISO 8601 stringi
3. Utworzenie obiektu `CreateFlashcardResponse`

### Krok 11: Zwrócenie odpowiedzi

1. Zwrócenie odpowiedzi 201 Created za pomocą `ResponseUtils.createSuccessResponse(response, 201)`

### Krok 12: Testowanie

1. Utworzenie testów jednostkowych dla `FlashcardService`:
   - Test tworzenia fiszki
   - Test sprawdzania duplikatów
   - Test obsługi błędów
2. Utworzenie testów integracyjnych dla endpointu:
   - Test sukcesu (201)
   - Test walidacji (400)
   - Test autentykacji (401)
   - Test duplikatu (409)
   - Test nieistniejącej generacji (404)
3. Testowanie w różnych scenariuszach:
   - Tworzenie fiszki manual
   - Tworzenie fiszki ai-full z generationId
   - Tworzenie fiszki ai-edited z generationId
   - Próba utworzenia duplikatu
   - Próba utworzenia z nieprawidłowym generationId

### Krok 13: Dokumentacja

1. Aktualizacja dokumentacji API (jeśli istnieje)
2. Dodanie przykładów użycia endpointu
3. Dokumentacja kodów błędów i scenariuszy
