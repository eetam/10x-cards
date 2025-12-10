# Plan implementacji widoku Generowanie fiszek

## 1. Przegląd

Widok generowania fiszek (`/generate`) umożliwia użytkownikom wklejenie tekstu źródłowego (1000-10000 znaków) i wygenerowanie propozycji fiszek przez AI. Widok jest chroniony i wymaga autoryzacji. Po pomyślnym wygenerowaniu propozycji, użytkownik jest automatycznie przekierowywany do widoku przeglądu propozycji (`/generations/{generationId}`).

Widok realizuje wymagania funkcjonalne:

- **FR-005**: Możliwość wklejenia tekstu (1000-10000 znaków)
- **FR-006**: System analizuje tekst przy użyciu AI, aby wygenerować propozycje fiszek
- **US-005**: Generowanie propozycji fiszek z tekstu

## 2. Routing widoku

- **Ścieżka:** `/generate`
- **Plik:** `src/pages/generate.astro`
- **Layout:** Wspólny layout aplikacji (`src/layouts/Layout.astro`) z topbarem
- **Ochrona:** Strona chroniona, wymaga autoryzacji (middleware sprawdza JWT token)
- **Przekierowanie:** Brak autoryzacji → `/login?redirect=/generate`

## 3. Struktura komponentów

```
GeneratePage (Astro)
└── GenerationForm (React - client-side)
    ├── Form (Shadcn/ui Form wrapper)
    │   ├── FormField (sourceText)
    │   │   ├── Label
    │   │   ├── Textarea (Shadcn/ui)
    │   │   ├── CharacterCounter
    │   │   └── FormMessage (błędy walidacji)
    │   └── FormField (model - opcjonalny)
    │       ├── Label
    │       ├── Select (Shadcn/ui)
    │       └── FormMessage
    ├── Button (Shadcn/ui - "Generuj")
    ├── Progress (Shadcn/ui - podczas generowania)
    └── Alert (Shadcn/ui - błędy)
```

## 4. Szczegóły komponentów

### GeneratePage (Astro)

- **Opis komponentu:** Główna strona Astro renderująca widok generowania. Zawiera React komponent `GenerationForm` jako interaktywny element.
- **Główne elementy:**
  - `<Layout>` wrapper z topbarem
  - `<GenerationForm client:load />` - React komponent z lazy loading
  - Meta tags dla SEO
- **Obsługiwane zdarzenia:** Brak (Astro jest statyczny)
- **Warunki walidacji:** Brak (walidacja w komponencie React)
- **Typy:** Brak
- **Propsy:** Brak

### GenerationForm (React)

- **Opis komponentu:** Główny komponent formularza generowania fiszek. Zarządza stanem formularza, walidacją, wywołaniem API i obsługą błędów. Używa React Hook Form z integracją Zod dla walidacji.
- **Główne elementy:**
  - `Form` (Shadcn/ui) - wrapper dla React Hook Form
  - `FormField` dla pola `sourceText`:
    - `Label` - "Tekst źródłowy"
    - `Textarea` (Shadcn/ui) - pole wieloliniowe z placeholderem
    - `CharacterCounter` - licznik znaków w czasie rzeczywistym
    - `FormMessage` - wyświetlanie błędów walidacji
  - `FormField` dla pola `model` (opcjonalny):
    - `Label` - "Model AI (opcjonalny)"
    - `Select` (Shadcn/ui) - wybór modelu AI
    - `FormMessage` - wyświetlanie błędów
  - `Button` (Shadcn/ui) - przycisk "Generuj" z loading state
  - `Progress` (Shadcn/ui) - wskaźnik postępu podczas generowania (opcjonalny)
  - `Alert` (Shadcn/ui) - wyświetlanie błędów z API
- **Obsługiwane zdarzenia:**
  - `onSubmit` - wysłanie formularza (wywołanie API)
  - `onChange` (sourceText) - aktualizacja licznika znaków
  - `onFocus` / `onBlur` - obsługa focus states dla dostępności
- **Obsługiwana walidacja:**
  - `sourceText`:
    - Wymagane (nie może być puste)
    - Minimalna długość: 1000 znaków (po trim)
    - Maksymalna długość: 10000 znaków
    - Trim whitespace przed walidacją
    - Komunikat błędu dla zbyt krótkiego tekstu: "Tekst musi zawierać co najmniej 1000 znaków"
    - Komunikat błędu dla zbyt długiego tekstu: "Tekst nie może przekraczać 10000 znaków"
  - `model`:
    - Opcjonalne
    - Jeśli podane, musi być jednym z dozwolonych modeli (z konfiguracji)
    - Domyślna wartość: skonfigurowany model z env
- **Typy:**
  - `CreateGenerationRequest` - typ requestu do API
  - `GenerateFlashcardsResponse` - typ odpowiedzi z API
  - `FormData` - lokalny typ dla formularza (extends CreateGenerationRequest)
- **Propsy:**
  - Brak (komponent nie przyjmuje propsów)

### CharacterCounter

- **Opis komponentu:** Komponent wyświetlający aktualną liczbę znaków i limit. Zmienia kolor w zależności od tego, czy tekst spełnia wymagania (zielony dla zakresu 1000-10000, czerwony poza zakresem).
- **Główne elementy:**
  - `<span>` z licznikiem znaków
  - Format: "{current} / {min}-{max} znaków"
  - Dynamiczne klasy Tailwind dla kolorów
- **Obsługiwane zdarzenia:** Brak (tylko wyświetlanie)
- **Warunki walidacji:** Brak (tylko wizualizacja)
- **Typy:**
  - `{ current: number; min: number; max: number }`
- **Propsy:**
  - `current: number` - aktualna liczba znaków
  - `min: number` - minimalna liczba znaków (1000)
  - `max: number` - maksymalna liczba znaków (10000)

## 5. Typy

### Typy z `src/types.ts` (już istniejące)

#### CreateGenerationRequest

```typescript
interface CreateGenerationRequest {
  sourceText: string; // 1000-10000 characters
  model?: string; // optional, defaults to configured model
}
```

#### GenerateFlashcardsResponse

```typescript
interface GenerateFlashcardsResponse {
  generationId: string;
  proposals: FlashcardProposal[];
  generatedAt: string; // ISO 8601 timestamp
  duration: number; // milliseconds
}
```

#### FlashcardProposal

```typescript
interface FlashcardProposal {
  front: string;
  back: string;
  confidence: number; // 0-1
}
```

#### ApiResponse<T>

```typescript
type ApiResponse<T> = { data: T; success: true } | { error: ApiError; success: false };
```

#### ApiError

```typescript
interface ApiError {
  message: string;
  code?: string;
  field?: string;
}
```

### Nowe typy ViewModel (lokalne dla komponentu)

#### GenerationFormState

```typescript
interface GenerationFormState {
  isSubmitting: boolean;
  error: ApiError | null;
  progress: number; // 0-100, opcjonalny dla długich operacji
  startTime: number | null; // timestamp rozpoczęcia generowania
}
```

**Pola:**

- `isSubmitting: boolean` - czy formularz jest w trakcie wysyłania
- `error: ApiError | null` - błąd z API (null gdy brak błędu)
- `progress: number` - postęp generowania (0-100), używany tylko dla długich operacji
- `startTime: number | null` - timestamp rozpoczęcia generowania, używany do obliczania czasu trwania

#### CharacterCounterProps

```typescript
interface CharacterCounterProps {
  current: number;
  min: number;
  max: number;
}
```

**Pola:**

- `current: number` - aktualna liczba znaków w polu tekstowym
- `min: number` - minimalna wymagana liczba znaków (1000)
- `max: number` - maksymalna dozwolona liczba znaków (10000)

## 6. Zarządzanie stanem

### Stan lokalny React (useState)

Komponent `GenerationForm` używa lokalnego stanu React do zarządzania:

1. **Stan formularza (React Hook Form):**
   - `form` - instancja React Hook Form z metodami `register`, `handleSubmit`, `watch`, `formState`
   - Zarządzany przez `useForm` hook z React Hook Form
   - Integracja z Zod schema przez `zodResolver`

2. **Stan UI (useState):**
   - `isSubmitting: boolean` - czy formularz jest w trakcie wysyłania
   - `error: ApiError | null` - błąd z API
   - `startTime: number | null` - timestamp rozpoczęcia generowania (dla wyświetlania czasu trwania)

3. **Licznik znaków (useWatch):**
   - `sourceTextLength: number` - aktualna długość tekstu
   - Obliczany przez `useWatch` hook z React Hook Form, subskrybujący zmiany pola `sourceText`

### Custom Hook (opcjonalny)

Można utworzyć custom hook `useGenerationForm` do ekstrakcji logiki formularza:

```typescript
function useGenerationForm() {
  const form = useForm<CreateGenerationRequest>({...});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const onSubmit = async (data: CreateGenerationRequest) => {
    // Logika wysyłania
  };

  return { form, isSubmitting, error, onSubmit };
}
```

**Zalety:**

- Separacja logiki od UI
- Łatwiejsze testowanie
- Możliwość reużycia w innych komponentach

**Wady:**

- Dodatkowa warstwa abstrakcji (może być niepotrzebna dla prostego formularza)

**Rekomendacja:** Dla MVP można pozostawić logikę bezpośrednio w komponencie. Jeśli formularz stanie się bardziej złożony, można wyekstrahować hook.

### React Query (nie wymagany)

React Query nie jest wymagany dla tego widoku, ponieważ:

- Formularz wykonuje mutację (POST), nie query
- Po sukcesie następuje przekierowanie, więc nie ma potrzeby cache'owania
- Błędy są obsługiwane lokalnie w komponencie

## 7. Integracja API

### Endpoint

- **Method:** POST
- **Path:** `/api/generations`
- **Client:** `apiClient.post<GenerateFlashcardsResponse>("/api/generations", requestBody)`

### Request

**Typ:** `CreateGenerationRequest`

```typescript
{
  sourceText: string; // 1000-10000 characters (po trim)
  model?: string; // optional
}
```

**Walidacja przed wysłaniem:**

- Trim whitespace z `sourceText`
- Sprawdzenie długości: 1000-10000 znaków
- Jeśli `model` nie jest podany, używa domyślnego z konfiguracji (lub nie wysyła, jeśli API używa domyślnego)

### Response

**Typ:** `GenerateFlashcardsResponse`

```typescript
{
  generationId: string; // UUID
  proposals: FlashcardProposal[]; // Array of proposals
  generatedAt: string; // ISO 8601 timestamp
  duration: number; // milliseconds
}
```

**Obsługa odpowiedzi:**

- **Sukces (201):**
  - Zapisanie `generationId`
  - Przekierowanie do `/generations/{generationId}`
  - Opcjonalnie: toast notification z potwierdzeniem
- **Błąd (400):**
  - Wyświetlenie błędu walidacji w formularzu
  - Mapowanie błędów API na pola formularza (jeśli API zwraca `field`)
- **Błąd (401):**
  - Przekierowanie do `/login?redirect=/generate`
  - Toast z komunikatem "Sesja wygasła"
- **Błąd (429):**
  - Wyświetlenie komunikatu o rate limiting
  - Opcjonalnie: wyświetlenie `Retry-After` header
- **Błąd (500):**
  - Wyświetlenie ogólnego komunikatu błędu
  - Możliwość ponowienia

### Implementacja wywołania API

```typescript
const onSubmit = async (data: CreateGenerationRequest) => {
  setIsSubmitting(true);
  setError(null);
  const startTime = Date.now();

  try {
    // Trim sourceText przed wysłaniem
    const trimmedData = {
      ...data,
      sourceText: data.sourceText.trim(),
    };

    const response = await apiClient.post<GenerateFlashcardsResponse>("/api/generations", trimmedData);

    // Przekierowanie do widoku propozycji
    window.location.href = `/generations/${response.generationId}`;
  } catch (err) {
    if (err instanceof ApiClientError) {
      setError({
        message: err.message,
        code: err.code,
      });

      // Obsługa błędów autoryzacji
      if (err.status === 401) {
        window.location.href = `/login?redirect=/generate`;
        return;
      }
    } else {
      setError({
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
        code: "UNKNOWN_ERROR",
      });
    }
  } finally {
    setIsSubmitting(false);
  }
};
```

## 8. Interakcje użytkownika

### 1. Wklejenie tekstu

**Akcja:** Użytkownik wkleja tekst do pola textarea

**Reakcja:**

- Licznik znaków aktualizuje się w czasie rzeczywistym
- Jeśli tekst < 1000 znaków: licznik wyświetla się na czerwono, przycisk "Generuj" może być nieaktywny
- Jeśli tekst w zakresie 1000-10000: licznik wyświetla się na zielono, przycisk "Generuj" aktywny
- Jeśli tekst > 10000 znaków: licznik wyświetla się na czerwono, przycisk "Generuj" nieaktywny, wyświetlenie błędu walidacji

### 2. Kliknięcie "Generuj"

**Akcja:** Użytkownik klika przycisk "Generuj"

**Reakcja:**

- Walidacja formularza (React Hook Form + Zod)
- Jeśli walidacja nie powiodła się: wyświetlenie błędów inline pod polami
- Jeśli walidacja powiodła się:
  - Przycisk "Generuj" zmienia się w loading state (disabled, spinner)
  - Opcjonalnie: wyświetlenie progress indicator
  - Wywołanie API POST `/api/generations`
  - Dla długich operacji (>5 sekund): wyświetlenie komunikatu "To może zająć do 30 sekund"

### 3. Sukces generowania

**Akcja:** API zwraca sukces (201) z `generationId` i `proposals`

**Reakcja:**

- Automatyczne przekierowanie do `/generations/{generationId}`
- Opcjonalnie: toast notification z komunikatem "Fiszki wygenerowane pomyślnie"

### 4. Błąd walidacji (400)

**Akcja:** API zwraca błąd walidacji (400)

**Reakcja:**

- Wyświetlenie błędu w `Alert` komponencie
- Jeśli API zwraca `field`, wyświetlenie błędu inline pod odpowiednim polem
- Przycisk "Generuj" wraca do normalnego stanu
- Możliwość poprawienia danych i ponowienia

### 5. Błąd autoryzacji (401)

**Akcja:** API zwraca błąd autoryzacji (401)

**Reakcja:**

- Przekierowanie do `/login?redirect=/generate`
- Toast z komunikatem "Sesja wygasła. Zaloguj się ponownie."

### 6. Rate limiting (429)

**Akcja:** API zwraca błąd rate limiting (429)

**Reakcja:**

- Wyświetlenie komunikatu w `Alert`: "Zbyt wiele requestów. Spróbuj za chwilę."
- Jeśli API zwraca `Retry-After` header, wyświetlenie czasu oczekiwania
- Przycisk "Generuj" nieaktywny do czasu wygaśnięcia limitu

### 7. Błąd serwera (500)

**Akcja:** API zwraca błąd serwera (500)

**Reakcja:**

- Wyświetlenie komunikatu w `Alert`: "Wystąpił błąd serwera. Spróbuj ponownie."
- Przycisk "Generuj" wraca do normalnego stanu
- Możliwość ponowienia

### 8. Nawigacja klawiaturowa

**Akcja:** Użytkownik używa klawiatury

**Reakcja:**

- `Tab` - przechodzenie między polami formularza
- `Enter` w polu textarea - nowa linia (nie wysyła formularza)
- `Enter` w polu Select - otwarcie dropdown
- `Escape` - zamknięcie dropdown Select
- Focus indicators widoczne dla wszystkich interaktywnych elementów

## 9. Warunki i walidacja

### Walidacja po stronie klienta (React Hook Form + Zod)

#### Schema Zod

```typescript
import { z } from "zod";

const MIN_TEXT_LENGTH = 1000;
const MAX_TEXT_LENGTH = 10000;

const GenerationFormSchema = z.object({
  sourceText: z
    .string()
    .trim()
    .min(MIN_TEXT_LENGTH, `Tekst musi zawierać co najmniej ${MIN_TEXT_LENGTH} znaków`)
    .max(MAX_TEXT_LENGTH, `Tekst nie może przekraczać ${MAX_TEXT_LENGTH} znaków`),
  model: z
    .string()
    .optional()
    .refine((val) => !val || ALLOWED_MODELS.includes(val), { message: "Nieprawidłowy model AI" }),
});
```

#### Warunki walidacji

1. **sourceText:**
   - **Wymagane:** Tak
   - **Minimalna długość:** 1000 znaków (po trim)
   - **Maksymalna długość:** 10000 znaków (po trim)
   - **Trim:** Automatyczne usunięcie whitespace na początku i końcu przed walidacją
   - **Komunikaty błędów:**
     - Puste pole: "Tekst źródłowy jest wymagany"
     - Za krótki: "Tekst musi zawierać co najmniej 1000 znaków"
     - Za długi: "Tekst nie może przekraczać 10000 znaków"

2. **model:**
   - **Wymagane:** Nie (opcjonalne)
   - **Format:** Musi być jednym z dozwolonych modeli (z konfiguracji)
   - **Komunikat błędu:** "Nieprawidłowy model AI"

#### Walidacja w czasie rzeczywistym

- **Licznik znaków:** Aktualizuje się przy każdej zmianie tekstu (`useWatch`)
- **Wizualna walidacja:**
  - Zielony kolor licznika gdy tekst w zakresie 1000-10000
  - Czerwony kolor licznika gdy tekst poza zakresem
- **Przycisk "Generuj":**
  - Nieaktywny gdy tekst < 1000 znaków
  - Nieaktywny gdy tekst > 10000 znaków
  - Nieaktywny podczas wysyłania (`isSubmitting`)
  - Aktywny gdy tekst w zakresie 1000-10000 i formularz nie jest w trakcie wysyłania

### Walidacja po stronie serwera (API)

API wykonuje własną walidację zgodnie z planem API:

- **sourceText:** 1000-10000 znaków
- **model:** Opcjonalny, musi być z dozwolonej listy

**Obsługa błędów walidacji z API:**

- Jeśli API zwraca błąd 400 z `field` w odpowiedzi, wyświetlenie błędu inline pod odpowiednim polem
- Jeśli API zwraca błąd 400 bez `field`, wyświetlenie ogólnego komunikatu w `Alert`

### Warunki wpływające na stan UI

1. **Tekst < 1000 znaków:**
   - Licznik znaków: czerwony
   - Przycisk "Generuj": nieaktywny
   - Błąd walidacji: wyświetlony pod polem (po próbie wysłania)

2. **Tekst w zakresie 1000-10000:**
   - Licznik znaków: zielony
   - Przycisk "Generuj": aktywny
   - Brak błędów walidacji

3. **Tekst > 10000 znaków:**
   - Licznik znaków: czerwony
   - Przycisk "Generuj": nieaktywny
   - Błąd walidacji: wyświetlony pod polem (natychmiast)

4. **Podczas wysyłania (`isSubmitting = true`):**
   - Przycisk "Generuj": nieaktywny, wyświetla spinner
   - Pola formularza: nieaktywne (disabled)
   - Progress indicator: widoczny (opcjonalnie)

5. **Po błędzie z API:**
   - Przycisk "Generuj": aktywny (możliwość ponowienia)
   - Pola formularza: aktywne
   - Błąd wyświetlony w `Alert` komponencie

## 10. Obsługa błędów

### Scenariusze błędów i ich obsługa

#### 1. Błąd walidacji klienta (przed wysłaniem)

**Scenariusz:** Użytkownik próbuje wysłać formularz z tekstem < 1000 znaków

**Obsługa:**

- React Hook Form blokuje wysłanie
- Wyświetlenie błędu inline pod polem `sourceText`
- Przycisk "Generuj" pozostaje nieaktywny
- Użytkownik może poprawić tekst i spróbować ponownie

#### 2. Błąd walidacji serwera (400 Bad Request)

**Scenariusz:** API zwraca błąd walidacji (np. tekst po trim < 1000 znaków)

**Obsługa:**

- Wyświetlenie błędu w `Alert` komponencie
- Jeśli API zwraca `field` w odpowiedzi, wyświetlenie błędu inline pod odpowiednim polem
- Przycisk "Generuj" wraca do normalnego stanu
- Użytkownik może poprawić dane i spróbować ponownie

**Przykład odpowiedzi API:**

```json
{
  "success": false,
  "error": {
    "message": "Source text must be between 1000 and 10000 characters",
    "code": "VALIDATION_ERROR",
    "field": "sourceText"
  }
}
```

#### 3. Błąd autoryzacji (401 Unauthorized)

**Scenariusz:** Token JWT wygasł lub jest nieprawidłowy

**Obsługa:**

- Przekierowanie do `/login?redirect=/generate`
- Toast notification z komunikatem "Sesja wygasła. Zaloguj się ponownie."
- Po zalogowaniu, automatyczne przekierowanie z powrotem do `/generate`

#### 4. Rate limiting (429 Too Many Requests)

**Scenariusz:** Użytkownik przekroczył limit requestów

**Obsługa:**

- Wyświetlenie komunikatu w `Alert`: "Zbyt wiele requestów. Spróbuj za chwilę."
- Jeśli API zwraca `Retry-After` header, wyświetlenie czasu oczekiwania (np. "Spróbuj ponownie za 60 sekund")
- Przycisk "Generuj" nieaktywny do czasu wygaśnięcia limitu
- Opcjonalnie: timer odliczający czas do możliwości ponowienia

#### 5. Błąd serwera (500 Internal Server Error)

**Scenariusz:** Błąd po stronie serwera (np. problem z AI API, baza danych)

**Obsługa:**

- Wyświetlenie komunikatu w `Alert`: "Wystąpił błąd serwera. Spróbuj ponownie."
- Przycisk "Generuj" wraca do normalnego stanu
- Możliwość ponowienia przez kliknięcie "Generuj" ponownie
- Opcjonalnie: przycisk "Spróbuj ponownie" w `Alert`

#### 6. Błąd sieciowy

**Scenariusz:** Brak połączenia z internetem lub timeout

**Obsługa:**

- Wyświetlenie komunikatu w `Alert`: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
- Przycisk "Generuj" wraca do normalnego stanu
- Możliwość ponowienia po przywróceniu połączenia

**Implementacja w `apiClient`:**

```typescript
catch (error) {
  if (error instanceof Error) {
    if (error.message === "Failed to fetch" || error.name === "TypeError") {
      throw new ApiClientError("Network error. Please check your connection.", 0, "NETWORK_ERROR");
    }
  }
}
```

#### 7. Timeout (długie operacje)

**Scenariusz:** Generowanie trwa dłużej niż oczekiwano (>30 sekund)

**Obsługa:**

- Dla operacji >5 sekund: wyświetlenie komunikatu "To może zająć do 30 sekund"
- Opcjonalnie: progress indicator (jeśli API wspiera streaming)
- Jeśli timeout: wyświetlenie komunikatu "Operacja przekroczyła limit czasu. Spróbuj ponownie."

#### 8. Nieoczekiwany błąd

**Scenariusz:** Błąd, który nie pasuje do żadnej kategorii

**Obsługa:**

- Wyświetlenie ogólnego komunikatu w `Alert`: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."
- Logowanie błędu do konsoli (tylko w development)
- Przycisk "Generuj" wraca do normalnego stanu
- Możliwość ponowienia

### Mapowanie błędów API na komunikaty użytkownika

Funkcja pomocnicza do mapowania kodów błędów:

```typescript
function getErrorMessage(error: ApiError): string {
  const errorMessages: Record<string, string> = {
    VALIDATION_ERROR: "Nieprawidłowe dane. Sprawdź formularz.",
    RATE_LIMIT_EXCEEDED: "Zbyt wiele requestów. Spróbuj za chwilę.",
    CONCURRENT_LIMIT_EXCEEDED: "Zbyt wiele równoczesnych generacji. Poczekaj na zakończenie poprzednich.",
    NETWORK_ERROR: "Brak połączenia z internetem. Sprawdź połączenie.",
    UNKNOWN_ERROR: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
  };

  return errorMessages[error.code || ""] || error.message || "Wystąpił błąd. Spróbuj ponownie.";
}
```

### Przywracanie stanu po błędzie

Po wystąpieniu błędu:

1. `isSubmitting` ustawione na `false`
2. `error` ustawione na obiekt błędu
3. Pola formularza pozostają wypełnione (użytkownik nie traci danych)
4. Przycisk "Generuj" aktywny (możliwość ponowienia)
5. Błąd wyświetlony w `Alert` komponencie

## 11. Kroki implementacji

### Krok 1: Utworzenie schematu walidacji Zod

**Lokalizacja:** `src/lib/validation/generation.schema.ts`

1. Utworzenie pliku z schematem walidacji:
   - `GenerationFormSchema` - schema dla formularza
   - Stałe: `MIN_TEXT_LENGTH = 1000`, `MAX_TEXT_LENGTH = 10000`
   - Export typu: `type GenerationFormData = z.infer<typeof GenerationFormSchema>`

2. Walidacja `sourceText`:
   - `.trim()` - automatyczne usunięcie whitespace
   - `.min(MIN_TEXT_LENGTH)` - minimalna długość
   - `.max(MAX_TEXT_LENGTH)` - maksymalna długość
   - Komunikaty błędów po polsku

3. Walidacja `model` (opcjonalna):
   - `.optional()` - pole opcjonalne
   - `.refine()` - sprawdzenie czy model jest z dozwolonej listy

### Krok 2: Utworzenie komponentu CharacterCounter

**Lokalizacja:** `src/components/generation/CharacterCounter.tsx`

1. Utworzenie komponentu React:
   - Props: `current`, `min`, `max`
   - Wyświetlanie formatu: "{current} / {min}-{max} znaków"
   - Dynamiczne klasy Tailwind:
     - Zielony gdy `current >= min && current <= max`
     - Czerwony gdy `current < min || current > max`
   - Użycie `useMemo` dla obliczania koloru

2. Testowanie komponentu:
   - Różne wartości `current`
   - Sprawdzenie kolorów

### Krok 3: Utworzenie funkcji API

**Lokalizacja:** `src/lib/api/generations.ts` (lub rozszerzenie istniejącego pliku)

1. Utworzenie funkcji `generateFlashcards`:
   - Parametr: `CreateGenerationRequest`
   - Wywołanie: `apiClient.post<GenerateFlashcardsResponse>("/api/generations", data)`
   - Zwraca: `Promise<GenerateFlashcardsResponse>`
   - Obsługa błędów: rzuca `ApiClientError`

2. Export funkcji:
   - Export named: `export { generateFlashcards }`

### Krok 4: Utworzenie komponentu GenerationForm

**Lokalizacja:** `src/components/generation/GenerationForm.tsx`

1. Setup React Hook Form:
   - Import `useForm` z `react-hook-form`
   - Import `zodResolver` z `@hookform/resolvers/zod`
   - Utworzenie formularza z `useForm<CreateGenerationRequest>`
   - Integracja z Zod schema przez `zodResolver(GenerationFormSchema)`

2. Stan komponentu:
   - `useState` dla `isSubmitting`
   - `useState` dla `error`
   - `useWatch` dla `sourceTextLength` (subskrypcja zmian pola `sourceText`)

3. Funkcja `onSubmit`:
   - Walidacja przez React Hook Form
   - Trim `sourceText` przed wysłaniem
   - Ustawienie `isSubmitting = true`
   - Wywołanie `generateFlashcards(data)`
   - Obsługa sukcesu: przekierowanie do `/generations/{generationId}`
   - Obsługa błędów: ustawienie `error` i wyświetlenie w `Alert`
   - `finally`: ustawienie `isSubmitting = false`

4. Renderowanie formularza:
   - `Form` (Shadcn/ui) wrapper
   - `FormField` dla `sourceText`:
     - `Label`: "Tekst źródłowy"
     - `Textarea` z placeholderem: "Wklej tekst (1000-10000 znaków)..."
     - `CharacterCounter` z aktualną długością
     - `FormMessage` dla błędów walidacji
   - `FormField` dla `model` (opcjonalny):
     - `Label`: "Model AI (opcjonalny)"
     - `Select` z listą dostępnych modeli
     - `FormMessage` dla błędów
   - `Button` "Generuj":
     - `disabled={isSubmitting || !form.formState.isValid}`
     - Loading state gdy `isSubmitting`
   - `Progress` (opcjonalny) podczas generowania
   - `Alert` dla błędów z API

5. Dostępność:
   - ARIA labels dla wszystkich pól
   - `aria-describedby` dla pól z błędami
   - Focus management

### Krok 5: Utworzenie strony Astro

**Lokalizacja:** `src/pages/generate.astro`

1. Import layoutu:
   - Import `Layout` z `../../layouts/Layout.astro`

2. Import komponentu React:
   - Import `GenerationForm` z `../../components/generation/GenerationForm`
   - Client directive: `client:load` (lub `client:visible` dla lazy loading)

3. Struktura strony:
   - `<Layout>` wrapper
   - `<main>` z klasami Tailwind dla responsywności
   - `<h1>`: "Generuj fiszki"
   - `<GenerationForm client:load />`

4. Meta tags:
   - `<title>`: "Generuj fiszki - 10xCards"
   - `<meta name="description">`: Opis strony

5. Styling:
   - Responsywny layout: pełna szerokość na mobile, ograniczona z centrowaniem na desktop
   - Odpowiednie odstępy i padding

### Krok 6: Ochrona route przez middleware

**Lokalizacja:** `src/middleware/index.ts`

1. Sprawdzenie czy route jest chroniony:
   - Dodanie `/generate` do listy chronionych routes

2. Sprawdzenie autoryzacji:
   - Jeśli brak tokena: przekierowanie do `/login?redirect=/generate`

### Krok 7: Testowanie

1. **Test walidacji:**
   - Tekst < 1000 znaków: błąd walidacji
   - Tekst w zakresie 1000-10000: sukces
   - Tekst > 10000 znaków: błąd walidacji
   - Puste pole: błąd walidacji

2. **Test wywołania API:**
   - Sukces: przekierowanie do `/generations/{generationId}`
   - Błąd 400: wyświetlenie błędu
   - Błąd 401: przekierowanie do logowania
   - Błąd 429: wyświetlenie komunikatu o rate limiting
   - Błąd 500: wyświetlenie komunikatu błędu

3. **Test UI:**
   - Licznik znaków aktualizuje się w czasie rzeczywistym
   - Przycisk "Generuj" zmienia stan w zależności od długości tekstu
   - Loading state podczas wysyłania
   - Błędy wyświetlane poprawnie

4. **Test dostępności:**
   - Nawigacja klawiaturowa działa
   - ARIA labels obecne
   - Focus indicators widoczne

5. **Test responsywności:**
   - Mobile: pełna szerokość textarea
   - Desktop: ograniczona szerokość z centrowaniem

### Krok 8: Optymalizacje (opcjonalne)

1. **Lazy loading:**
   - Użycie `client:visible` zamiast `client:load` dla lepszej wydajności

2. **Debouncing licznika znaków:**
   - Dla bardzo długich tekstów, rozważyć debouncing aktualizacji licznika

3. **Progress indicator:**
   - Jeśli API wspiera streaming, wyświetlenie postępu generowania

4. **Anulowanie requestu:**
   - Jeśli API wspiera anulowanie, dodanie przycisku "Anuluj" podczas generowania

5. **Zapisywanie draftu:**
   - Opcjonalnie: zapisywanie tekstu w localStorage jako draft (przed wysłaniem)

