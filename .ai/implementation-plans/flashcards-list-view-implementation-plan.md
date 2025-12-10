# Plan implementacji widoku Lista fiszek

## 1. Przegląd

Widok listy fiszek (`/flashcards`) umożliwia użytkownikom przeglądanie, zarządzanie i tworzenie fiszek. Widok zawiera pełną funkcjonalność CRUD z filtrowaniem, sortowaniem i paginacją.

**Główne funkcjonalności:**
- Wyświetlanie listy fiszek (tabela na desktop, karty na mobile)
- Paginacja z synchronizacją URL query params
- Filtrowanie po źródle (`source`) i stanie (`state`)
- Sortowanie po dacie utworzenia, aktualizacji lub terminie powtórki
- Dodawanie nowej fiszki ręcznie (modal)
- Edycja istniejącej fiszki (modal)
- Usuwanie fiszki (z potwierdzeniem AlertDialog)

**Wymagania funkcjonalne:**
- FR-010: Przeglądanie zapisanych fiszek
- FR-011: Edycja fiszek
- FR-012: Usuwanie fiszek
- FR-013: Ręczne tworzenie fiszek

## 2. Routing widoku

- **Ścieżka:** `/flashcards`
- **Plik:** `src/pages/flashcards.astro`
- **Layout:** `src/layouts/Layout.astro` (wspólny layout z topbarem)
- **Ochrona:** Strona chroniona, wymaga autoryzacji (lub `DEFAULT_USER_ID` w dev)

**Query Parameters:**
- `page` - numer strony (default: 1)
- `limit` - liczba elementów na stronę (default: 25)
- `sort` - pole sortowania: `createdAt`, `updatedAt`, `due` (default: `createdAt`)
- `order` - kierunek: `asc`, `desc` (default: `desc`)
- `source` - filtr źródła: `ai-full`, `ai-edited`, `manual` (opcjonalny)
- `state` - filtr stanu: `0`, `1`, `2`, `3` (opcjonalny)

## 3. Struktura komponentów

```
FlashcardsPage (Astro)
└── FlashcardsListWithProvider (React - wrapper z QueryClientProvider)
    └── FlashcardsList (React - główny komponent)
        ├── FlashcardsHeader
        │   ├── Title ("Moje fiszki")
        │   └── AddFlashcardButton → otwiera AddFlashcardDialog
        ├── FlashcardFilters
        │   ├── SourceFilter (Select)
        │   ├── StateFilter (Select)
        │   ├── SortSelect (Select)
        │   └── OrderToggle (Button)
        ├── FlashcardsContent
        │   ├── FlashcardsTable (desktop >= 768px)
        │   │   └── FlashcardRow (dla każdej fiszki)
        │   └── FlashcardsCards (mobile < 768px)
        │       └── FlashcardCard (dla każdej fiszki)
        ├── FlashcardsPagination (Pagination component)
        ├── AddFlashcardDialog (Dialog)
        │   └── FlashcardForm
        ├── EditFlashcardDialog (Dialog)
        │   └── FlashcardForm
        └── DeleteFlashcardDialog (AlertDialog)
```

## 4. Szczegóły komponentów

### FlashcardsListWithProvider

- **Opis:** Wrapper dostarczający `QueryClientProvider` dla React Query
- **Plik:** `src/components/flashcards/FlashcardsListWithProvider.tsx`
- **Props:** Brak

### FlashcardsList

- **Opis:** Główny komponent zarządzający listą fiszek, stanem filtrów i modali
- **Plik:** `src/components/flashcards/FlashcardsList.tsx`
- **Główne elementy:**
  - Integracja z React Query (`useQuery` dla listy)
  - Synchronizacja filtrów z URL query params
  - Zarządzanie otwartymi modalami (add/edit/delete)
- **Stan:**
  - `filters: FlashcardsFiltersState` - aktualne filtry
  - `selectedFlashcard: Flashcard | null` - wybrana fiszka do edycji/usunięcia
  - `isAddDialogOpen: boolean`
  - `isEditDialogOpen: boolean`
  - `isDeleteDialogOpen: boolean`

### FlashcardsHeader

- **Opis:** Nagłówek z tytułem i przyciskiem dodawania
- **Plik:** `src/components/flashcards/FlashcardsHeader.tsx`
- **Props:**
  ```typescript
  interface FlashcardsHeaderProps {
    onAddClick: () => void;
    totalCount: number;
  }
  ```

### FlashcardFilters

- **Opis:** Panel filtrów i sortowania
- **Plik:** `src/components/flashcards/FlashcardFilters.tsx`
- **Props:**
  ```typescript
  interface FlashcardFiltersProps {
    filters: FlashcardsFiltersState;
    onFiltersChange: (filters: FlashcardsFiltersState) => void;
  }
  ```
- **Elementy:**
  - Select dla `source` (Wszystkie / AI / AI (edytowane) / Ręczne)
  - Select dla `state` (Wszystkie / Nowe / W nauce / Do powtórki / Ponowna nauka)
  - Select dla `sort` (Data utworzenia / Data aktualizacji / Termin powtórki)
  - Button toggle dla `order` (Rosnąco / Malejąco)

### FlashcardsTable

- **Opis:** Widok tabelaryczny dla desktop
- **Plik:** `src/components/flashcards/FlashcardsTable.tsx`
- **Props:**
  ```typescript
  interface FlashcardsTableProps {
    flashcards: FlashcardListItem[];
    onEdit: (flashcard: FlashcardListItem) => void;
    onDelete: (flashcard: FlashcardListItem) => void;
  }
  ```
- **Kolumny:**
  - Awers (front) - skrócony do 50 znaków
  - Rewers (back) - skrócony do 50 znaków
  - Źródło (source) - badge
  - Termin (due) - sformatowana data
  - Akcje (edycja, usunięcie)

### FlashcardRow

- **Opis:** Pojedynczy wiersz tabeli
- **Plik:** `src/components/flashcards/FlashcardRow.tsx`
- **Props:**
  ```typescript
  interface FlashcardRowProps {
    flashcard: FlashcardListItem;
    onEdit: () => void;
    onDelete: () => void;
  }
  ```

### FlashcardsCards

- **Opis:** Widok kart dla mobile
- **Plik:** `src/components/flashcards/FlashcardsCards.tsx`
- **Props:** Identyczne jak `FlashcardsTable`

### FlashcardCard

- **Opis:** Pojedyncza karta fiszki dla mobile
- **Plik:** `src/components/flashcards/FlashcardCard.tsx`
- **Props:** Identyczne jak `FlashcardRow`
- **Elementy:**
  - Card z awersem jako główny tekst
  - Collapsible rewers
  - Badge źródła
  - Data terminu
  - Przyciski akcji

### FlashcardsPagination

- **Opis:** Komponent paginacji
- **Plik:** `src/components/flashcards/FlashcardsPagination.tsx`
- **Props:**
  ```typescript
  interface FlashcardsPaginationProps {
    pagination: PaginationInfo;
    onPageChange: (page: number) => void;
  }
  ```

### AddFlashcardDialog

- **Opis:** Modal do dodawania nowej fiszki
- **Plik:** `src/components/flashcards/AddFlashcardDialog.tsx`
- **Props:**
  ```typescript
  interface AddFlashcardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
  }
  ```

### EditFlashcardDialog

- **Opis:** Modal do edycji istniejącej fiszki
- **Plik:** `src/components/flashcards/EditFlashcardDialog.tsx`
- **Props:**
  ```typescript
  interface EditFlashcardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    flashcard: FlashcardListItem | null;
    onSuccess: () => void;
  }
  ```

### DeleteFlashcardDialog

- **Opis:** AlertDialog potwierdzający usunięcie
- **Plik:** `src/components/flashcards/DeleteFlashcardDialog.tsx`
- **Props:**
  ```typescript
  interface DeleteFlashcardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    flashcard: FlashcardListItem | null;
    onConfirm: () => void;
    isDeleting: boolean;
  }
  ```

### FlashcardForm

- **Opis:** Współdzielony formularz dla add/edit
- **Plik:** `src/components/flashcards/FlashcardForm.tsx`
- **Props:**
  ```typescript
  interface FlashcardFormProps {
    defaultValues?: { front: string; back: string };
    onSubmit: (data: FlashcardFormData) => void;
    isSubmitting: boolean;
    submitLabel: string; // "Dodaj" lub "Zapisz"
  }
  ```

## 5. Typy

### Istniejące typy z `src/types.ts`

```typescript
// Używane bezpośrednio
interface ListFlashcardsResponse {
  data: Pick<Flashcard, "id" | "front" | "back" | "source" | "state" | "due" | "created_at" | "updated_at">[];
  pagination: PaginationInfo;
}

interface CreateFlashcardRequest {
  front: string;
  back: string;
  source: FlashcardSource;
  generationId?: string;
}

interface UpdateFlashcardRequest {
  front: string;
  back: string;
}

interface ListFlashcardsQuery {
  page?: number;
  limit?: number;
  sort?: "createdAt" | "updatedAt" | "due";
  order?: "asc" | "desc";
  source?: FlashcardSource;
  state?: FSRSState;
}
```

### Nowe typy ViewModel

```typescript
// src/components/flashcards/types.ts

export type FlashcardListItem = ListFlashcardsResponse["data"][number];

export interface FlashcardsFiltersState {
  page: number;
  limit: number;
  sort: "createdAt" | "updatedAt" | "due";
  order: "asc" | "desc";
  source?: FlashcardSource;
  state?: FSRSState;
}

export interface FlashcardFormData {
  front: string;
  back: string;
}

export const DEFAULT_FILTERS: FlashcardsFiltersState = {
  page: 1,
  limit: 25,
  sort: "createdAt",
  order: "desc",
};
```

## 6. Zarządzanie stanem

### React Query

**Query do pobierania listy:**
```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ["flashcards", filters],
  queryFn: () => fetchFlashcards(filters),
  keepPreviousData: true, // zachowaj poprzednie dane podczas ładowania
});
```

**Mutation do dodawania:**
```typescript
const addMutation = useMutation({
  mutationFn: createFlashcard,
  onSuccess: () => {
    queryClient.invalidateQueries(["flashcards"]);
    onSuccess();
  },
});
```

**Mutation do edycji:**
```typescript
const editMutation = useMutation({
  mutationFn: ({ id, data }: { id: string; data: UpdateFlashcardRequest }) =>
    updateFlashcard(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries(["flashcards"]);
    onSuccess();
  },
});
```

**Mutation do usuwania:**
```typescript
const deleteMutation = useMutation({
  mutationFn: deleteFlashcard,
  onSuccess: () => {
    queryClient.invalidateQueries(["flashcards"]);
    onSuccess();
  },
});
```

### Synchronizacja z URL

```typescript
// Custom hook do synchronizacji filtrów z URL
function useFlashcardsFilters() {
  const [searchParams, setSearchParams] = useState(() =>
    new URLSearchParams(window.location.search)
  );

  const filters = useMemo(() => parseFiltersFromURL(searchParams), [searchParams]);

  const setFilters = useCallback((newFilters: FlashcardsFiltersState) => {
    const params = filtersToURLParams(newFilters);
    window.history.replaceState({}, "", `?${params.toString()}`);
    setSearchParams(params);
  }, []);

  return { filters, setFilters };
}
```

## 7. Integracja API

### Endpointy

| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/flashcards` | Pobierz listę fiszek |
| POST | `/api/flashcards` | Utwórz nową fiszkę |
| PUT | `/api/flashcards/{id}` | Zaktualizuj fiszkę |
| DELETE | `/api/flashcards/{id}` | Usuń fiszkę |

### Funkcje API klienta

**Plik:** `src/lib/api/flashcards.ts` (rozszerzenie)

```typescript
export async function fetchFlashcards(
  query: ListFlashcardsQuery
): Promise<ListFlashcardsResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.sort) params.set("sort", query.sort);
  if (query.order) params.set("order", query.order);
  if (query.source) params.set("source", query.source);
  if (query.state !== undefined) params.set("state", String(query.state));

  return apiClient.get<ListFlashcardsResponse>(`/api/flashcards?${params}`);
}

export async function updateFlashcard(
  id: string,
  data: UpdateFlashcardRequest
): Promise<UpdateFlashcardResponse> {
  return apiClient.put<UpdateFlashcardResponse>(`/api/flashcards/${id}`, data);
}

export async function deleteFlashcard(id: string): Promise<void> {
  return apiClient.delete(`/api/flashcards/${id}`);
}
```

## 8. Interakcje użytkownika

### Przeglądanie listy

1. Użytkownik wchodzi na `/flashcards`
2. Lista ładuje się z domyślnymi filtrami
3. Wyświetlane są fiszki w tabeli (desktop) lub kartach (mobile)
4. Skeleton loader podczas ładowania

### Filtrowanie i sortowanie

1. Użytkownik zmienia filtr/sortowanie
2. URL aktualizuje się (query params)
3. Lista odświeża się automatycznie (React Query)
4. Poprzednie dane są widoczne podczas ładowania

### Dodawanie fiszki

1. Kliknięcie "Dodaj fiszkę"
2. Otwarcie modala z pustym formularzem
3. Wypełnienie pól (front: max 200, back: max 500 znaków)
4. Kliknięcie "Dodaj"
5. Walidacja → API call → zamknięcie modala → odświeżenie listy
6. Toast z potwierdzeniem

### Edycja fiszki

1. Kliknięcie ikony edycji przy fiszce
2. Otwarcie modala z wypełnionym formularzem
3. Modyfikacja pól
4. Kliknięcie "Zapisz"
5. Walidacja → API call → zamknięcie modala → odświeżenie listy
6. Toast z potwierdzeniem

### Usuwanie fiszki

1. Kliknięcie ikony usunięcia przy fiszce
2. Otwarcie AlertDialog z potwierdzeniem
3. Kliknięcie "Usuń"
4. API call → zamknięcie dialogu → odświeżenie listy
5. Toast z potwierdzeniem

### Paginacja

1. Kliknięcie numeru strony lub strzałek
2. URL aktualizuje się (`?page=X`)
3. Lista odświeża się

## 9. Warunki i walidacja

### Walidacja formularza (Zod)

```typescript
// src/lib/validation/flashcard.schema.ts

import { z } from "zod";

export const FlashcardFormSchema = z.object({
  front: z
    .string()
    .trim()
    .min(1, "Awers jest wymagany")
    .max(200, "Awers może mieć maksymalnie 200 znaków"),
  back: z
    .string()
    .trim()
    .min(1, "Rewers jest wymagany")
    .max(500, "Rewers może mieć maksymalnie 500 znaków"),
});

export type FlashcardFormData = z.infer<typeof FlashcardFormSchema>;
```

### Walidacja filtrów URL

```typescript
const FiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  sort: z.enum(["createdAt", "updatedAt", "due"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
  state: z.coerce.number().min(0).max(3).optional(),
});
```

## 10. Obsługa błędów

### Błędy ładowania listy

- Wyświetlenie komunikatu błędu z przyciskiem "Spróbuj ponownie"
- Użycie komponentu Alert

### Błędy formularza

- Inline errors pod polami (React Hook Form)
- Walidacja w czasie rzeczywistym

### Błędy API (add/edit/delete)

- Toast z komunikatem błędu
- Możliwość ponowienia akcji
- Mapowanie kodów błędów:
  - 400 → "Nieprawidłowe dane"
  - 401 → Przekierowanie do logowania
  - 404 → "Fiszka nie została znaleziona"
  - 409 → "Taka fiszka już istnieje"
  - 500 → "Wystąpił błąd serwera"

### Pusta lista

- Wyświetlenie komunikatu "Nie masz jeszcze żadnych fiszek"
- Przycisk "Dodaj pierwszą fiszkę" lub "Wygeneruj fiszki"

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury

1. Utworzenie katalogu `src/components/flashcards/`
2. Utworzenie pliku typów `src/components/flashcards/types.ts`
3. Utworzenie schematu walidacji `src/lib/validation/flashcard.schema.ts`

### Krok 2: Rozszerzenie API klienta

1. Rozszerzenie `src/lib/api/flashcards.ts`:
   - `fetchFlashcards(query)`
   - `updateFlashcard(id, data)`
   - `deleteFlashcard(id)`

### Krok 3: Implementacja komponentów podstawowych

1. `FlashcardsListWithProvider.tsx` - wrapper z QueryClientProvider
2. `FlashcardForm.tsx` - współdzielony formularz
3. `FlashcardsPagination.tsx` - komponent paginacji

### Krok 4: Implementacja modali

1. `AddFlashcardDialog.tsx`
2. `EditFlashcardDialog.tsx`
3. `DeleteFlashcardDialog.tsx`

### Krok 5: Implementacja widoków listy

1. `FlashcardsTable.tsx` + `FlashcardRow.tsx` (desktop)
2. `FlashcardsCards.tsx` + `FlashcardCard.tsx` (mobile)

### Krok 6: Implementacja filtrów

1. `FlashcardFilters.tsx`
2. Custom hook `useFlashcardsFilters.ts`

### Krok 7: Implementacja głównego komponentu

1. `FlashcardsHeader.tsx`
2. `FlashcardsList.tsx` - złożenie wszystkich komponentów

### Krok 8: Utworzenie strony Astro

1. `src/pages/flashcards.astro`

### Krok 9: Testowanie

1. Test paginacji i filtrowania
2. Test CRUD operacji
3. Test responsywności
4. Test obsługi błędów
5. Test synchronizacji URL

### Krok 10: Dodanie nawigacji

1. Dodanie linku w topbarze/menu do `/flashcards`
