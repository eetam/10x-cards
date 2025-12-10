# Plan implementacji widoku Przegląd propozycji fiszek

## 1. Przegląd

Widok przeglądu propozycji fiszek (`/generations/[generationId]`) umożliwia użytkownikom przeglądanie, akceptację, edycję lub odrzucenie propozycji fiszek wygenerowanych przez AI. Widok jest chroniony i wymaga autoryzacji. Użytkownik może przeglądać wszystkie propozycje, zmieniać ich status (akceptacja/odrzucenie), edytować zawartość przed zapisaniem, a następnie zapisać wszystkie zaakceptowane propozycje do swojej kolekcji.

Widok realizuje wymagania funkcjonalne:

- **FR-007**: Interfejs do przeglądu propozycji fiszek
- **FR-008**: Opcje: "Akceptuj", "Edytuj", "Odrzuć" dla każdej propozycji
- **FR-009**: Zapisywanie zaakceptowanych fiszek w kolekcji użytkownika
- **US-006**: Przeglądanie i akceptacja propozycji
- **US-007**: Edycja propozycji fiszki

## 2. Routing widoku

- **Ścieżka:** `/generations/[generationId]`
- **Plik:** `src/pages/generations/[generationId].astro`
- **Layout:** Wspólny layout aplikacji (`src/layouts/Layout.astro`) z topbarem
- **Ochrona:** Strona chroniona, wymaga autoryzacji (middleware sprawdza JWT token)
- **Przekierowanie:** Brak autoryzacji → `/login?redirect=/generations/[generationId]`
- **Parametry ścieżki:**
  - `generationId` (uuid) - ID sesji generowania fiszek

## 3. Struktura komponentów

```
GenerationReviewPage (Astro)
└── GenerationReviewView (React - client-side)
    ├── GenerationHeader
    │   ├── GenerationInfo (data, model, czas trwania)
    │   └── ProposalsCounter (całkowita liczba, liczba zaakceptowanych)
    ├── SaveAllButton (aktywny gdy są zaakceptowane propozycje)
    ├── ProposalsList
    │   └── ProposalCard[] (dla każdej propozycji)
    │       ├── Card (Shadcn/ui)
    │       │   ├── CardHeader
    │       │   │   ├── FrontSide (awers - zawsze widoczny)
    │       │   │   └── ConfidenceBadge (opcjonalnie)
    │       │   ├── CardContent
    │       │   │   └── BackSide (rewers - rozwijany/zwijany)
    │       │   └── CardFooter
    │       │       ├── ActionButtons
    │       │       │   ├── AcceptButton
    │       │       │   ├── EditButton
    │       │       │   └── RejectButton
    │       │       └── StatusBadge (niezaakceptowana, zaakceptowana, odrzucona, edytowana)
    │       └── EditProposalDialog (Shadcn/ui Dialog)
    │           ├── DialogContent
    │           │   ├── DialogHeader (tytuł)
    │           │   ├── EditForm (React Hook Form)
    │           │   │   ├── FormField (front)
    │           │   │   │   ├── Label
    │           │   │   │   ├── Input (Shadcn/ui)
    │           │   │   │   ├── CharacterCounter
    │           │   │   │   └── FormMessage
    │           │   │   └── FormField (back)
    │           │   │       ├── Label
    │           │   │       ├── Textarea (Shadcn/ui)
    │           │   │       ├── CharacterCounter
    │           │   │       └── FormMessage
    │           │   └── DialogFooter
    │           │       ├── CancelButton
    │           │       └── SaveButton
    │           └── ProgressIndicator (podczas zapisywania)
    ├── SaveProgressIndicator (podczas zapisywania wszystkich zaakceptowanych)
    └── ErrorAlert (Shadcn/ui Alert - błędy)
```

## 4. Szczegóły komponentów

### GenerationReviewPage (Astro)

- **Opis komponentu:** Główna strona Astro renderująca widok przeglądu propozycji. Zawiera React komponent `GenerationReviewView` jako interaktywny element. Pobiera `generationId` z parametrów ścieżki i przekazuje go do komponentu React.
- **Główne elementy:**
  - `<Layout>` wrapper z topbarem
  - `<GenerationReviewView client:load generationId={generationId} />` - React komponent z lazy loading
  - Meta tags dla SEO
- **Obsługiwane zdarzenia:** Brak (Astro jest statyczny)
- **Warunki walidacji:** Brak (walidacja w komponencie React)
- **Typy:** Brak
- **Propsy:** Brak

### GenerationReviewView (React)

- **Opis komponentu:** Główny komponent widoku przeglądu propozycji. Zarządza stanem propozycji, ich statusami (akceptacja/odrzucenie/edycja), wywołaniami API i obsługą błędów. Używa React Query do pobierania danych generacji i zarządzania cache'em.
- **Główne elementy:**
  - `GenerationHeader` - nagłówek z informacjami o generacji
  - `ProposalsCounter` - licznik propozycji
  - `SaveAllButton` - przycisk zapisania wszystkich zaakceptowanych
  - `ProposalsList` - lista propozycji
  - `SaveProgressIndicator` - wskaźnik postępu podczas zapisywania
  - `ErrorAlert` - wyświetlanie błędów
- **Obsługiwane zdarzenia:**
  - `onMount` - pobranie danych generacji i propozycji przy montowaniu komponentu
  - `onError` - obsługa błędów z API
- **Obsługiwana walidacja:**
  - Weryfikacja, że `generationId` jest prawidłowym UUID
  - Weryfikacja, że generacja należy do zalogowanego użytkownika (po stronie API)
- **Typy:**
  - `GenerationDetailsResponse` - typ odpowiedzi z API dla szczegółów generacji
  - `FlashcardProposal` - typ propozycji fiszki
  - `ProposalStatus` - typ statusu propozycji ("pending" | "accepted" | "rejected" | "edited")
  - `ProposalViewModel` - lokalny typ ViewModel dla propozycji z dodatkowym statusem
- **Propsy:**
  - `generationId: string` - ID sesji generowania (wymagane)

### GenerationHeader

- **Opis komponentu:** Komponent wyświetlający informacje o sesji generowania: data utworzenia, model AI, czas trwania generowania.
- **Główne elementy:**
  - `<div>` z klasami Tailwind dla layoutu
  - `<h1>` - tytuł strony
  - `<div>` z informacjami o generacji:
    - Data utworzenia (sformatowana)
    - Model AI
    - Czas trwania generowania (sformatowany z ISO 8601 duration)
- **Obsługiwane zdarzenia:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `GenerationDetailsResponse` - typ danych generacji
- **Propsy:**
  - `generation: GenerationDetailsResponse` - dane generacji (wymagane)

### ProposalsCounter

- **Opis komponentu:** Komponent wyświetlający licznik propozycji: całkowita liczba i liczba zaakceptowanych.
- **Główne elementy:**
  - `<div>` z klasami Tailwind dla layoutu
  - `<span>` z całkowitą liczbą propozycji
  - `<span>` z liczbą zaakceptowanych propozycji
- **Obsługiwane zdarzenia:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `number` - całkowita liczba propozycji
  - `number` - liczba zaakceptowanych propozycji
- **Propsy:**
  - `total: number` - całkowita liczba propozycji (wymagane)
  - `accepted: number` - liczba zaakceptowanych propozycji (wymagane)

### SaveAllButton

- **Opis komponentu:** Przycisk zapisania wszystkich zaakceptowanych propozycji. Aktywny tylko gdy są zaakceptowane propozycje. Podczas zapisywania wyświetla loading state.
- **Główne elementy:**
  - `Button` (Shadcn/ui) - przycisk z variant="default"
  - `Loader2` (lucide-react) - ikona ładowania podczas zapisywania
- **Obsługiwane zdarzenia:**
  - `onClick` - wywołanie funkcji zapisania wszystkich zaakceptowanych propozycji
- **Obsługiwana walidacja:**
  - Przycisk jest disabled gdy `acceptedCount === 0`
  - Przycisk jest disabled podczas zapisywania (`isSaving === true`)
- **Typy:** Brak
- **Propsy:**
  - `acceptedCount: number` - liczba zaakceptowanych propozycji (wymagane)
  - `isSaving: boolean` - flaga czy trwa zapisywanie (wymagane)
  - `onSave: () => Promise<void>` - funkcja zapisania (wymagane)

### ProposalsList

- **Opis komponentu:** Komponent renderujący listę propozycji. Dla dużej liczby propozycji (>20) może używać wirtualizacji (opcjonalnie dla MVP).
- **Główne elementy:**
  - `<div>` z klasami Tailwind dla layoutu (grid lub flex column)
  - `ProposalCard[]` - tablica komponentów kart propozycji
- **Obsługiwane zdarzenia:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `ProposalViewModel[]` - tablica propozycji z statusami
- **Propsy:**
  - `proposals: ProposalViewModel[]` - tablica propozycji (wymagane)
  - `onProposalStatusChange: (index: number, status: ProposalStatus) => void` - callback zmiany statusu (wymagane)
  - `onProposalEdit: (index: number, front: string, back: string) => void` - callback edycji (wymagane)

### ProposalCard

- **Opis komponentu:** Komponent karty propozycji fiszki. Wyświetla awers (zawsze widoczny), rewers (rozwijany/zwijany), wskaźnik confidence (jeśli dostępny), przyciski akcji i status propozycji.
- **Główne elementy:**
  - `Card` (Shadcn/ui) - główny kontener karty
  - `CardHeader` - nagłówek karty z awersem
  - `CardContent` - zawartość karty z rewersem (Collapsible)
  - `CardFooter` - stopka karty z przyciskami akcji
  - `ConfidenceBadge` - badge z wskaźnikiem confidence (opcjonalnie)
  - `StatusBadge` - badge ze statusem propozycji
- **Obsługiwane zdarzenia:**
  - `onToggleBack` - rozwinięcie/zwinięcie rewersu
  - `onAccept` - akceptacja propozycji
  - `onEdit` - otwarcie modala edycji
  - `onReject` - odrzucenie propozycji
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `ProposalViewModel` - typ propozycji z statusem
- **Propsy:**
  - `proposal: ProposalViewModel` - propozycja fiszki (wymagane)
  - `index: number` - indeks propozycji w liście (wymagane)
  - `isBackExpanded: boolean` - flaga czy rewers jest rozwinięty (wymagane)
  - `onToggleBack: (index: number) => void` - callback rozwinięcia/zwinięcia (wymagane)
  - `onAccept: (index: number) => void` - callback akceptacji (wymagane)
  - `onEdit: (index: number) => void` - callback edycji (wymagane)
  - `onReject: (index: number) => void` - callback odrzucenia (wymagane)

### EditProposalDialog

- **Opis komponentu:** Modal edycji propozycji fiszki. Zawiera formularz z polami awers i rewers, walidację i obsługę zapisywania. Po zapisaniu zmian propozycja jest automatycznie akceptowana.
- **Główne elementy:**
  - `Dialog` (Shadcn/ui) - główny kontener modala
  - `DialogContent` - zawartość modala
  - `DialogHeader` - nagłówek modala z tytułem
  - `DialogFooter` - stopka modala z przyciskami
  - `Form` (Shadcn/ui z React Hook Form) - formularz edycji
  - `FormField` (front) - pole awersu
  - `FormField` (back) - pole rewersu
  - `CharacterCounter` - liczniki znaków dla obu pól
  - `ProgressIndicator` - wskaźnik postępu podczas zapisywania
- **Obsługiwane zdarzenia:**
  - `onOpenChange` - zmiana stanu otwarcia modala
  - `onSubmit` - wysłanie formularza (zapisanie zmian)
  - `onCancel` - anulowanie edycji
- **Obsługiwana walidacja:**
  - `front`:
    - Wymagane (nie może być puste)
    - Maksymalna długość: 200 znaków
    - Trim whitespace przed walidacją
    - Komunikat błędu dla pustego pola: "Awers nie może być pusty"
    - Komunikat błędu dla zbyt długiego tekstu: "Awers nie może przekraczać 200 znaków"
  - `back`:
    - Wymagane (nie może być puste)
    - Maksymalna długość: 500 znaków
    - Trim whitespace przed walidacją
    - Komunikat błędu dla pustego pola: "Rewers nie może być pusty"
    - Komunikat błędu dla zbyt długiego tekstu: "Rewers nie może przekraczać 500 znaków"
- **Typy:**
  - `EditProposalFormData` - typ danych formularza edycji
  - `FlashcardProposal` - typ propozycji fiszki
- **Propsy:**
  - `open: boolean` - flaga czy modal jest otwarty (wymagane)
  - `onOpenChange: (open: boolean) => void` - callback zmiany stanu otwarcia (wymagane)
  - `proposal: FlashcardProposal` - propozycja do edycji (wymagane)
  - `proposalIndex: number` - indeks propozycji w liście (wymagane)
  - `onSave: (index: number, front: string, back: string) => Promise<void>` - callback zapisania (wymagane)

### SaveProgressIndicator

- **Opis komponentu:** Komponent wyświetlający postęp zapisywania wszystkich zaakceptowanych propozycji. Pokazuje licznik zapisanych fiszek (np. "Zapisywanie 3 z 10").
- **Główne elementy:**
  - `Progress` (Shadcn/ui) - pasek postępu
  - `<div>` z tekstem informującym o postępie
- **Obsługiwane zdarzenia:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `number` - liczba zapisanych fiszek
  - `number` - całkowita liczba fiszek do zapisania
- **Propsy:**
  - `current: number` - liczba zapisanych fiszek (wymagane)
  - `total: number` - całkowita liczba fiszek do zapisania (wymagane)
  - `isVisible: boolean` - flaga czy wskaźnik jest widoczny (wymagane)

### ErrorAlert

- **Opis komponentu:** Komponent wyświetlający błędy z API w formie alertu.
- **Główne elementy:**
  - `Alert` (Shadcn/ui) - kontener alertu z variant="destructive"
  - `AlertCircle` (lucide-react) - ikona błędu
  - `AlertDescription` - opis błędu
- **Obsługiwane zdarzenia:** Brak
- **Obsługiwana walidacja:** Brak
- **Typy:**
  - `ApiError` - typ błędu z API
- **Propsy:**
  - `error: ApiError | null` - błąd do wyświetlenia (wymagane)
  - `onRetry?: () => void` - opcjonalny callback ponowienia (opcjonalne)

## 5. Typy

### Typy z API (już zdefiniowane w `src/types.ts`)

#### GenerationDetailsResponse

Typ odpowiedzi z API dla szczegółów generacji. Zawiera informacje o sesji generowania.

```typescript
type GenerationDetailsResponse = Pick<
  Generation,
  | "id"
  | "user_id"
  | "model"
  | "generated_count"
  | "accepted_unedited_count"
  | "accepted_edited_count"
  | "source_text_length"
  | "generation_duration"
  | "created_at"
> & {
  userId: string; // mapped from user_id
  acceptedUneditedCount: number; // mapped from accepted_unedited_count
  acceptedEditedCount: number; // mapped from accepted_edited_count
  sourceTextLength: number; // mapped from source_text_length
  generationDuration: string; // mapped from generation_duration (ISO 8601 duration)
  createdAt: string; // mapped from created_at
};
```

**Pola:**
- `id: string` - UUID sesji generowania
- `userId: string` - UUID użytkownika
- `model: string` - model AI użyty do generowania
- `generatedCount: number` - liczba wygenerowanych propozycji
- `acceptedUneditedCount: number` - liczba zaakceptowanych propozycji bez edycji
- `acceptedEditedCount: number` - liczba zaakceptowanych propozycji po edycji
- `sourceTextLength: number` - długość tekstu źródłowego
- `generationDuration: string` - czas trwania generowania w formacie ISO 8601 duration
- `createdAt: string` - data utworzenia w formacie ISO 8601

#### FlashcardProposal

Typ propozycji fiszki zwracanej przez API.

```typescript
interface FlashcardProposal {
  front: string;
  back: string;
  confidence: number; // 0-1
}
```

**Pola:**
- `front: string` - awers fiszki (pytanie)
- `back: string` - rewers fiszki (odpowiedź)
- `confidence: number` - wskaźnik pewności AI (0.0-1.0)

#### GenerateFlashcardsResponse

Typ odpowiedzi z API dla generowania fiszek. Zawiera ID generacji i tablicę propozycji.

```typescript
interface GenerateFlashcardsResponse {
  generationId: string;
  proposals: FlashcardProposal[];
  generatedAt: string;
  duration: number; // milliseconds
}
```

**Pola:**
- `generationId: string` - UUID sesji generowania
- `proposals: FlashcardProposal[]` - tablica propozycji fiszek
- `generatedAt: string` - data wygenerowania w formacie ISO 8601
- `duration: number` - czas trwania generowania w milisekundach

#### CreateFlashcardRequest

Typ requestu do API dla tworzenia fiszki.

```typescript
interface CreateFlashcardRequest {
  front: string; // max 200 characters
  back: string; // max 500 characters
  source: FlashcardSource;
  generationId?: string; // optional, for AI-generated cards
}
```

**Pola:**
- `front: string` - awers fiszki (maksymalnie 200 znaków)
- `back: string` - rewers fiszki (maksymalnie 500 znaków)
- `source: FlashcardSource` - źródło fiszki ("ai-full" | "ai-edited" | "manual")
- `generationId?: string` - opcjonalne ID generacji (dla fiszek wygenerowanych przez AI)

#### CreateFlashcardResponse

Typ odpowiedzi z API dla utworzonej fiszki.

```typescript
type CreateFlashcardResponse = Pick<
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

### Nowe typy ViewModel (do zdefiniowania w komponencie lub w `src/types.ts`)

#### ProposalStatus

Typ statusu propozycji w widoku.

```typescript
type ProposalStatus = "pending" | "accepted" | "rejected" | "edited";
```

**Wartości:**
- `"pending"` - propozycja nie została jeszcze przetworzona
- `"accepted"` - propozycja została zaakceptowana (bez edycji)
- `"rejected"` - propozycja została odrzucona
- `"edited"` - propozycja została edytowana i zaakceptowana

#### ProposalViewModel

Typ ViewModel dla propozycji z dodatkowym statusem i edytowaną zawartością.

```typescript
interface ProposalViewModel extends FlashcardProposal {
  status: ProposalStatus;
  editedFront?: string; // edytowany awers (jeśli został edytowany)
  editedBack?: string; // edytowany rewers (jeśli został edytowany)
}
```

**Pola:**
- Wszystkie pola z `FlashcardProposal` (front, back, confidence)
- `status: ProposalStatus` - status propozycji w widoku
- `editedFront?: string` - opcjonalny edytowany awers (jeśli propozycja została edytowana)
- `editedBack?: string` - opcjonalny edytowany rewers (jeśli propozycja została edytowana)

#### EditProposalFormData

Typ danych formularza edycji propozycji.

```typescript
interface EditProposalFormData {
  front: string; // max 200 characters
  back: string; // max 500 characters
}
```

**Pola:**
- `front: string` - awers fiszki (maksymalnie 200 znaków)
- `back: string` - rewers fiszki (maksymalnie 500 znaków)

#### SaveProgressState

Typ stanu postępu zapisywania wszystkich zaakceptowanych propozycji.

```typescript
interface SaveProgressState {
  isSaving: boolean;
  current: number; // liczba zapisanych fiszek
  total: number; // całkowita liczba fiszek do zapisania
  errors: Array<{
    index: number;
    proposal: ProposalViewModel;
    error: ApiError;
  }>; // błędy podczas zapisywania
}
```

**Pola:**
- `isSaving: boolean` - flaga czy trwa zapisywanie
- `current: number` - liczba zapisanych fiszek
- `total: number` - całkowita liczba fiszek do zapisania
- `errors: Array<{...}>` - tablica błędów podczas zapisywania (indeks, propozycja, błąd)

## 6. Zarządzanie stanem

### Stan lokalny komponentu (useState)

Komponent `GenerationReviewView` zarządza następującym stanem lokalnym:

1. **Stan propozycji z statusami:**
   ```typescript
   const [proposals, setProposals] = useState<ProposalViewModel[]>([]);
   ```
   - Przechowuje tablicę propozycji z ich statusami (pending, accepted, rejected, edited)
   - Inicjalizowany danymi z API przy montowaniu komponentu
   - Aktualizowany przy zmianie statusu propozycji (akceptacja, odrzucenie, edycja)

2. **Stan rozwinięcia rewersów:**
   ```typescript
   const [expandedBacks, setExpandedBacks] = useState<Set<number>>(new Set());
   ```
   - Przechowuje zbiór indeksów propozycji, których rewersy są rozwinięte
   - Używany do zapamiętania stanu rozwinięcia/zwinięcia rewersu dla każdej propozycji
   - Aktualizowany przy kliknięciu przycisku rozwinięcia/zwinięcia

3. **Stan modala edycji:**
   ```typescript
   const [editingProposalIndex, setEditingProposalIndex] = useState<number | null>(null);
   ```
   - Przechowuje indeks propozycji, która jest aktualnie edytowana (lub null jeśli modal jest zamknięty)
   - Używany do kontrolowania otwarcia/zamknięcia modala edycji

4. **Stan postępu zapisywania:**
   ```typescript
   const [saveProgress, setSaveProgress] = useState<SaveProgressState>({
     isSaving: false,
     current: 0,
     total: 0,
     errors: [],
   });
   ```
   - Przechowuje stan postępu zapisywania wszystkich zaakceptowanych propozycji
   - Używany do wyświetlania progress indicator i obsługi błędów

5. **Stan błędów:**
   ```typescript
   const [error, setError] = useState<ApiError | null>(null);
   ```
   - Przechowuje błąd z API (jeśli wystąpił)
   - Używany do wyświetlania ErrorAlert

### React Query (useQuery, useMutation)

Komponent używa React Query do zarządzania danymi z API:

1. **Query dla szczegółów generacji:**
   ```typescript
   const { data: generation, error: generationError, isLoading: isLoadingGeneration } = useQuery({
     queryKey: ['generation', generationId],
     queryFn: () => getGenerationDetails(generationId),
     enabled: !!generationId,
     retry: 1,
   });
   ```
   - Pobiera szczegóły generacji z API
   - Cache'uje dane dla szybkiego dostępu
   - Automatycznie obsługuje loading i error states

2. **Query dla propozycji (jeśli API zwraca je osobno):**
   ```typescript
   // Uwaga: Jeśli API zwraca propozycje razem z generacją, ten query nie jest potrzebny
   // Propozycje są zwracane w GenerateFlashcardsResponse, więc mogą być już dostępne
   // Jeśli jednak API ma osobny endpoint dla propozycji, użyj tego query
   ```
   - Jeśli API ma osobny endpoint dla propozycji, użyj query do ich pobrania
   - W przeciwnym razie propozycje są już dostępne w odpowiedzi z generacji

3. **Mutation dla zapisywania fiszek:**
   ```typescript
   const saveFlashcardMutation = useMutation({
     mutationFn: (data: CreateFlashcardRequest) => createFlashcard(data),
     onSuccess: (data, variables) => {
       // Aktualizacja stanu lokalnego po sukcesie
     },
     onError: (error, variables) => {
       // Obsługa błędu
     },
   });
   ```
   - Używana do zapisywania pojedynczej fiszki
   - Wywoływana dla każdej zaakceptowanej propozycji

### Custom Hook (opcjonalnie)

Można utworzyć custom hook `useGenerationReview` do zarządzania logiką widoku:

```typescript
function useGenerationReview(generationId: string) {
  // React Query queries
  // Stan lokalny
  // Funkcje obsługi akcji (accept, reject, edit, saveAll)
  // Zwraca: { generation, proposals, isLoading, error, handlers }
}
```

**Zalety:**
- Oddzielenie logiki od prezentacji
- Łatwiejsze testowanie
- Możliwość reużycia w innych komponentach

**Wady:**
- Dodatkowa warstwa abstrakcji (może być niepotrzebna dla MVP)

**Decyzja:** Dla MVP można zaimplementować logikę bezpośrednio w komponencie. Jeśli logika stanie się zbyt złożona, można wyodrębnić custom hook.

## 7. Integracja API

### Endpointy API

#### GET /api/generations/{generationId}

**Opis:** Pobiera szczegóły sesji generowania.

**Request:**
- Method: `GET`
- Path: `/api/generations/{generationId}`
- Headers: `Authorization: Bearer {JWT_TOKEN}`

**Response:**
- Success (200 OK): `GenerationDetailsResponse`
- Error (404 Not Found): Generacja nie istnieje lub nie należy do użytkownika
- Error (401 Unauthorized): Brak autoryzacji

**Implementacja w komponencie:**
```typescript
// W pliku src/lib/api/generations.ts
export async function getGenerationDetails(generationId: string): Promise<GenerationDetailsResponse> {
  return apiClient.get<GenerationDetailsResponse>(`/api/generations/${generationId}`);
}
```

#### POST /api/flashcards

**Opis:** Tworzy nową fiszkę (używane do zapisywania zaakceptowanych propozycji).

**Request:**
- Method: `POST`
- Path: `/api/flashcards`
- Headers: `Authorization: Bearer {JWT_TOKEN}`, `Content-Type: application/json`
- Body: `CreateFlashcardRequest`

**Response:**
- Success (201 Created): `CreateFlashcardResponse`
- Error (400 Bad Request): Błąd walidacji (nieprawidłowe dane)
- Error (401 Unauthorized): Brak autoryzacji
- Error (409 Conflict): Fiszka o takiej zawartości już istnieje
- Error (500 Internal Server Error): Błąd serwera

**Implementacja w komponencie:**
```typescript
// W pliku src/lib/api/flashcards.ts (do utworzenia jeśli nie istnieje)
export async function createFlashcard(data: CreateFlashcardRequest): Promise<CreateFlashcardResponse> {
  return apiClient.post<CreateFlashcardResponse>("/api/flashcards", data);
}
```

### Funkcje API (do utworzenia w `src/lib/api/`)

#### getGenerationDetails

Funkcja pobierająca szczegóły generacji z API.

```typescript
// src/lib/api/generations.ts
export async function getGenerationDetails(generationId: string): Promise<GenerationDetailsResponse> {
  return apiClient.get<GenerationDetailsResponse>(`/api/generations/${generationId}`);
}
```

**Parametry:**
- `generationId: string` - UUID sesji generowania

**Zwraca:**
- `Promise<GenerationDetailsResponse>` - szczegóły generacji

**Błędy:**
- `ApiClientError` (404) - generacja nie istnieje
- `ApiClientError` (401) - brak autoryzacji
- `ApiClientError` (500) - błąd serwera

#### createFlashcard

Funkcja tworząca nową fiszkę w API.

```typescript
// src/lib/api/flashcards.ts
export async function createFlashcard(data: CreateFlashcardRequest): Promise<CreateFlashcardResponse> {
  return apiClient.post<CreateFlashcardResponse>("/api/flashcards", data);
}
```

**Parametry:**
- `data: CreateFlashcardRequest` - dane fiszki do utworzenia

**Zwraca:**
- `Promise<CreateFlashcardResponse>` - utworzona fiszka

**Błędy:**
- `ApiClientError` (400) - błąd walidacji
- `ApiClientError` (401) - brak autoryzacji
- `ApiClientError` (409) - duplikat fiszki
- `ApiClientError` (500) - błąd serwera

### Obsługa propozycji

**Uwaga:** Propozycje są zwracane w odpowiedzi z endpointu `POST /api/generations` podczas generowania. Jeśli użytkownik został przekierowany do widoku przeglądu, propozycje powinny być już dostępne (np. w localStorage, sessionStorage, lub w stanie React Query).

**Opcje implementacji:**

1. **Przechowywanie propozycji w React Query cache:**
   - Po wygenerowaniu propozycji w widoku `/generate`, zapisz je w React Query cache z kluczem `['generation-proposals', generationId]`
   - W widoku przeglądu pobierz propozycje z cache

2. **Przechowywanie propozycji w sessionStorage:**
   - Po wygenerowaniu propozycji, zapisz je w sessionStorage z kluczem `generation-${generationId}-proposals`
   - W widoku przeglądu pobierz propozycje z sessionStorage

3. **Osobny endpoint API dla propozycji (jeśli dostępny):**
   - Jeśli API ma endpoint `GET /api/generations/{generationId}/proposals`, użyj go do pobrania propozycji

**Rekomendacja:** Dla MVP użyj opcji 1 (React Query cache) lub 2 (sessionStorage). Jeśli API nie zwraca propozycji w odpowiedzi z generacji, użyj opcji 3.

## 8. Interakcje użytkownika

### Przeglądanie propozycji

1. **Rozwinięcie/zwinięcie rewersu:**
   - **Akcja:** Kliknięcie przycisku "Pokaż odpowiedź" / "Ukryj odpowiedź" w karcie propozycji
   - **Rezultat:** Rewers propozycji jest rozwinięty/zwinięty
   - **Implementacja:** Toggle stanu `expandedBacks` dla danego indeksu propozycji

2. **Przewijanie listy propozycji:**
   - **Akcja:** Przewijanie strony w dół/górę
   - **Rezultat:** Lista propozycji jest przewijana
   - **Implementacja:** Standardowe przewijanie przeglądarki (nie wymaga implementacji)

### Akceptacja propozycji

1. **Akceptacja pojedynczej propozycji:**
   - **Akcja:** Kliknięcie przycisku "Akceptuj" w karcie propozycji
   - **Rezultat:** 
     - Status propozycji zmienia się na "accepted"
     - Przycisk "Akceptuj" jest ukryty/nieaktywny
     - Licznik zaakceptowanych propozycji jest zwiększony
     - Przycisk "Zapisz wszystkie zaakceptowane" staje się aktywny (jeśli nie był aktywny)
   - **Implementacja:** Aktualizacja stanu `proposals` - zmiana statusu propozycji na "accepted"

### Odrzucenie propozycji

1. **Odrzucenie pojedynczej propozycji:**
   - **Akcja:** Kliknięcie przycisku "Odrzuć" w karcie propozycji
   - **Rezultat:**
     - Status propozycji zmienia się na "rejected"
     - Karta propozycji jest ukryta lub wyświetla status "Odrzucona"
     - Licznik zaakceptowanych propozycji nie zmienia się
   - **Implementacja:** Aktualizacja stanu `proposals` - zmiana statusu propozycji na "rejected"

### Edycja propozycji

1. **Otwarcie modala edycji:**
   - **Akcja:** Kliknięcie przycisku "Edytuj" w karcie propozycji
   - **Rezultat:**
     - Modal edycji jest otwarty
     - Formularz jest wstępnie wypełniony danymi propozycji (front, back)
     - Przyciski akcji w karcie są nieaktywne
   - **Implementacja:** Ustawienie `editingProposalIndex` na indeks propozycji

2. **Edycja zawartości:**
   - **Akcja:** Wprowadzenie zmian w polach formularza (front, back)
   - **Rezultat:**
     - Pola formularza są aktualizowane
     - Liczniki znaków są aktualizowane
     - Błędy walidacji są wyświetlane (jeśli występują)
   - **Implementacja:** React Hook Form zarządza stanem formularza

3. **Zapisanie zmian:**
   - **Akcja:** Kliknięcie przycisku "Zapisz" w modalu edycji
   - **Rezultat:**
     - Formularz jest walidowany
     - Jeśli walidacja przejdzie:
       - Status propozycji zmienia się na "edited"
       - Edytowane wartości (editedFront, editedBack) są zapisane w stanie
       - Modal jest zamykany
       - Toast notification z potwierdzeniem jest wyświetlany
     - Jeśli walidacja nie przejdzie:
       - Błędy walidacji są wyświetlane w formularzu
   - **Implementacja:** 
     - Walidacja przez React Hook Form z Zod
     - Aktualizacja stanu `proposals` - zmiana statusu na "edited" i zapisanie edytowanych wartości
     - Zamknięcie modala (ustawienie `editingProposalIndex` na null)

4. **Anulowanie edycji:**
   - **Akcja:** Kliknięcie przycisku "Anuluj" w modalu edycji lub kliknięcie poza modalem
   - **Rezultat:**
     - Modal jest zamykany
     - Zmiany w formularzu nie są zapisywane
     - Status propozycji pozostaje niezmieniony
   - **Implementacja:** Ustawienie `editingProposalIndex` na null

### Zapisywanie wszystkich zaakceptowanych propozycji

1. **Rozpoczęcie zapisywania:**
   - **Akcja:** Kliknięcie przycisku "Zapisz wszystkie zaakceptowane"
   - **Rezultat:**
     - Przycisk jest nieaktywny
     - Progress indicator jest wyświetlany
     - Rozpoczyna się równoległe zapisywanie wszystkich zaakceptowanych propozycji
   - **Implementacja:**
     - Ustawienie `saveProgress.isSaving` na true
     - Ustawienie `saveProgress.total` na liczbę zaakceptowanych propozycji
     - Wywołanie `Promise.all()` dla wszystkich zaakceptowanych propozycji
     - Dla każdej propozycji:
       - Określenie źródła: "ai-full" (jeśli nie była edytowana) lub "ai-edited" (jeśli była edytowana)
       - Utworzenie requestu `CreateFlashcardRequest` z odpowiednimi danymi
       - Wywołanie `createFlashcard()` API
       - Aktualizacja `saveProgress.current` po każdym sukcesie

2. **Podczas zapisywania:**
   - **Akcja:** Automatyczne (podczas zapisywania)
   - **Rezultat:**
     - Progress indicator pokazuje postęp (np. "Zapisywanie 3 z 10")
     - Pasek postępu jest aktualizowany
   - **Implementacja:** Aktualizacja `saveProgress.current` po każdym sukcesie

3. **Zakończenie zapisywania (sukces):**
   - **Akcja:** Automatyczne (po zakończeniu wszystkich requestów)
   - **Rezultat:**
     - Progress indicator jest ukryty
     - Toast notification z podsumowaniem jest wyświetlany (np. "Zapisano 10 fiszek")
     - Opcjonalne przekierowanie do `/flashcards`
     - Opcjonalne: przycisk "Wróć do listy fiszek"
   - **Implementacja:**
     - Ustawienie `saveProgress.isSaving` na false
     - Wyświetlenie toast notification
     - Opcjonalne przekierowanie

4. **Zakończenie zapisywania (częściowy sukces / błędy):**
   - **Akcja:** Automatyczne (jeśli niektóre requesty zakończyły się błędem)
   - **Rezultat:**
     - Progress indicator jest ukryty
     - Toast notification z informacją o błędach jest wyświetlany (np. "Zapisano 8 z 10 fiszek. 2 fiszki nie zostały zapisane.")
     - Lista błędów jest wyświetlana (które fiszki nie zostały zapisane)
     - Przycisk "Spróbuj ponownie" dla nieudanych fiszek
   - **Implementacja:**
     - Zapisanie błędów w `saveProgress.errors`
     - Wyświetlenie toast notification z informacją o błędach
     - Wyświetlenie listy błędów (opcjonalnie)

### Nawigacja klawiaturowa

1. **Nawigacja między przyciskami:**
   - **Akcja:** Naciśnięcie klawisza Tab
   - **Rezultat:** Focus przechodzi do następnego interaktywnego elementu
   - **Implementacja:** Standardowa nawigacja przeglądarki (nie wymaga implementacji)

2. **Zamknięcie modala:**
   - **Akcja:** Naciśnięcie klawisza Escape
   - **Rezultat:** Modal edycji jest zamykany
   - **Implementacja:** Obsługa `onEscapeKeyDown` w komponencie Dialog

3. **Zapisanie w modalu:**
   - **Akcja:** Naciśnięcie klawisza Enter w formularzu (gdy focus jest na przycisku "Zapisz")
   - **Rezultat:** Formularz jest zapisywany
   - **Implementacja:** Standardowa obsługa formularza (nie wymaga implementacji)

## 9. Warunki i walidacja

### Walidacja po stronie klienta (komponenty)

#### Walidacja generationId

**Komponent:** `GenerationReviewPage` (Astro) / `GenerationReviewView` (React)

**Warunek:** `generationId` musi być prawidłowym UUID

**Walidacja:**
- Sprawdzenie formatu UUID przy parsowaniu parametru ścieżki
- Jeśli format jest nieprawidłowy, wyświetlenie błędu 404 lub przekierowanie do strony błędu

**Implementacja:**
```typescript
// W komponencie React
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(generationId)) {
  // Wyświetlenie błędu lub przekierowanie
}
```

#### Walidacja formularza edycji

**Komponent:** `EditProposalDialog`

**Warunki:**
1. Pole `front`:
   - Wymagane (nie może być puste)
   - Maksymalna długość: 200 znaków (po trim)
   - Trim whitespace przed walidacją

2. Pole `back`:
   - Wymagane (nie może być puste)
   - Maksymalna długość: 500 znaków (po trim)
   - Trim whitespace przed walidacją

**Walidacja:**
- Użycie React Hook Form z integracją Zod
- Walidacja w czasie rzeczywistym (onChange) i przy submit
- Wyświetlanie błędów walidacji pod polami formularza

**Implementacja:**
```typescript
// Schema Zod
const EditProposalSchema = z.object({
  front: z.string().trim().min(1, "Awers nie może być pusty").max(200, "Awers nie może przekraczać 200 znaków"),
  back: z.string().trim().min(1, "Rewers nie może być pusty").max(500, "Rewers nie może przekraczać 500 znaków"),
});

// W komponencie
const form = useForm<EditProposalFormData>({
  resolver: zodResolver(EditProposalSchema),
  mode: "onChange",
});
```

#### Walidacja stanu przycisków

**Komponent:** `SaveAllButton`

**Warunki:**
1. Przycisk jest aktywny tylko gdy `acceptedCount > 0`
2. Przycisk jest nieaktywny podczas zapisywania (`isSaving === true`)

**Walidacja:**
- Sprawdzenie stanu przed renderowaniem przycisku
- Ustawienie `disabled` na true jeśli warunki nie są spełnione

**Implementacja:**
```typescript
<Button disabled={acceptedCount === 0 || isSaving} onClick={onSave}>
  {/* ... */}
</Button>
```

### Walidacja po stronie API

#### Walidacja generationId (API)

**Endpoint:** `GET /api/generations/{generationId}`

**Warunki:**
1. `generationId` musi być prawidłowym UUID
2. Generacja musi istnieć w bazie danych
3. Generacja musi należeć do zalogowanego użytkownika (RLS)

**Walidacja:**
- Sprawdzenie formatu UUID w middleware lub w endpoint handler
- Sprawdzenie istnienia generacji w bazie danych
- Sprawdzenie przynależności do użytkownika przez RLS (Row-Level Security)

**Obsługa błędów:**
- 400 Bad Request: Nieprawidłowy format UUID
- 404 Not Found: Generacja nie istnieje lub nie należy do użytkownika
- 401 Unauthorized: Brak autoryzacji

#### Walidacja danych fiszki (API)

**Endpoint:** `POST /api/flashcards`

**Warunki:**
1. Pole `front`:
   - Wymagane
   - Maksymalna długość: 200 znaków (po trim)
   - Trim whitespace przed walidacją

2. Pole `back`:
   - Wymagane
   - Maksymalna długość: 500 znaków (po trim)
   - Trim whitespace przed walidacją

3. Pole `source`:
   - Wymagane
   - Musi być jednym z: "ai-full", "ai-edited", "manual"

4. Pole `generationId`:
   - Opcjonalne
   - Jeśli podane, musi być prawidłowym UUID
   - Generacja musi istnieć i należeć do użytkownika

**Walidacja:**
- Walidacja przez Zod schema w endpoint handler
- Sprawdzenie duplikatów (jeśli API to wspiera)

**Obsługa błędów:**
- 400 Bad Request: Błąd walidacji (nieprawidłowe dane)
- 409 Conflict: Fiszka o takiej zawartości już istnieje
- 401 Unauthorized: Brak autoryzacji
- 500 Internal Server Error: Błąd serwera

### Wpływ walidacji na stan interfejsu

1. **Błędy walidacji formularza edycji:**
   - Pola z błędami są oznaczone jako `aria-invalid="true"`
   - Komunikaty błędów są wyświetlane pod polami (`FormMessage`)
   - Przycisk "Zapisz" jest nieaktywny dopóki formularz nie jest prawidłowy

2. **Błędy z API:**
   - Błędy są wyświetlane w `ErrorAlert`
   - Toast notifications są wyświetlane dla błędów operacji (zapisywanie)
   - Lista błędów jest wyświetlana dla częściowych sukcesów

3. **Stan ładowania:**
   - Podczas pobierania danych: wyświetlenie skeleton loader lub spinner
   - Podczas zapisywania: wyświetlenie progress indicator
   - Przyciski są nieaktywne podczas operacji

## 10. Obsługa błędów

### Błędy autoryzacji (401 Unauthorized)

**Scenariusz:** Użytkownik próbuje pobrać szczegóły generacji, ale token JWT jest nieprawidłowy lub wygasł.

**Obsługa:**
- Wyświetlenie komunikatu: "Sesja wygasła. Zaloguj się ponownie."
- Przekierowanie do `/login?redirect=/generations/[generationId]`
- Toast notification z informacją o wygaśnięciu sesji

**Implementacja:**
```typescript
if (error?.status === 401) {
  window.location.href = `/login?redirect=/generations/${generationId}`;
  toast.error("Sesja wygasła. Zaloguj się ponownie.");
}
```

### Błędy nie znaleziono (404 Not Found)

**Scenariusz:** Generacja nie istnieje lub nie należy do użytkownika.

**Obsługa:**
- Wyświetlenie komunikatu: "Generacja nie została znaleziona."
- Przycisk "Wróć do dashboardu" lub "Wróć do listy generacji"
- Opcjonalne: przekierowanie do `/generate` lub `/`

**Implementacja:**
```typescript
if (error?.status === 404) {
  // Wyświetlenie ErrorAlert z komunikatem
  // Przycisk powrotu
}
```

### Błędy walidacji (400 Bad Request)

**Scenariusz:** Błąd walidacji podczas zapisywania fiszki (np. zbyt długi tekst).

**Obsługa:**
- Wyświetlenie komunikatu błędu z API
- Toast notification z informacją o błędzie
- Zaznaczenie które fiszki nie zostały zapisane (w przypadku zapisywania wielu)

**Implementacja:**
```typescript
if (error?.status === 400) {
  toast.error(error.message || "Błąd walidacji. Sprawdź dane fiszki.");
  // Zapisanie błędu w saveProgress.errors
}
```

### Błędy konfliktu (409 Conflict)

**Scenariusz:** Fiszka o takiej zawartości już istnieje.

**Obsługa:**
- Wyświetlenie komunikatu: "Fiszka o takiej zawartości już istnieje."
- Toast notification z sugestią edycji istniejącej fiszki
- Opcjonalne: link do istniejącej fiszki

**Implementacja:**
```typescript
if (error?.status === 409) {
  toast.error("Fiszka o takiej zawartości już istnieje. Możesz edytować istniejącą fiszkę.");
  // Opcjonalnie: link do istniejącej fiszki
}
```

### Błędy serwera (500 Internal Server Error)

**Scenariusz:** Wystąpił błąd serwera podczas pobierania danych lub zapisywania fiszek.

**Obsługa:**
- Wyświetlenie komunikatu: "Wystąpił błąd serwera. Spróbuj ponownie."
- Toast notification z możliwością ponowienia
- Przycisk "Spróbuj ponownie" do ręcznego odświeżenia danych

**Implementacja:**
```typescript
if (error?.status === 500) {
  toast.error("Wystąpił błąd serwera. Spróbuj ponownie.", {
    action: {
      label: "Spróbuj ponownie",
      onClick: () => {
        // Ponowienie requestu
      },
    },
  });
}
```

### Błędy sieciowe

**Scenariusz:** Brak połączenia z internetem lub timeout requestu.

**Obsługa:**
- Wyświetlenie komunikatu: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
- Toast notification z możliwością ponowienia
- Retry logic w kliencie API (automatyczne ponowienie)

**Implementacja:**
```typescript
if (error?.code === "NETWORK_ERROR" || error?.message === "Failed to fetch") {
  toast.error("Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.", {
    action: {
      label: "Spróbuj ponownie",
      onClick: () => {
        // Ponowienie requestu
      },
    },
  });
}
```

### Częściowe sukcesy podczas zapisywania

**Scenariusz:** Niektóre fiszki zostały zapisane, ale niektóre zakończyły się błędem.

**Obsługa:**
- Wyświetlenie toast notification z podsumowaniem (np. "Zapisano 8 z 10 fiszek. 2 fiszki nie zostały zapisane.")
- Lista błędów jest wyświetlana (które fiszki nie zostały zapisane i dlaczego)
- Przycisk "Spróbuj ponownie" dla nieudanych fiszek
- Opcjonalne: możliwość zapisania tylko nieudanych fiszek ponownie

**Implementacja:**
```typescript
if (saveProgress.errors.length > 0) {
  toast.error(`Zapisano ${saveProgress.current} z ${saveProgress.total} fiszek. ${saveProgress.errors.length} fiszki nie zostały zapisane.`, {
    duration: 10000, // Dłuższy czas wyświetlania
  });
  // Wyświetlenie listy błędów
  // Przycisk "Spróbuj ponownie" dla nieudanych fiszek
}
```

### Obsługa błędów w modalu edycji

**Scenariusz:** Błąd podczas zapisywania edytowanej propozycji.

**Obsługa:**
- Wyświetlenie komunikatu błędu w formularzu (Alert w modalu)
- Toast notification z informacją o błędzie
- Modal pozostaje otwarty, aby użytkownik mógł poprawić błędy

**Implementacja:**
```typescript
try {
  // Zapisanie zmian
} catch (error) {
  // Wyświetlenie Alert w modalu
  toast.error("Nie udało się zapisać zmian. Spróbuj ponownie.");
  // Modal pozostaje otwarty
}
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury plików

1. Utworzenie pliku strony Astro: `src/pages/generations/[generationId].astro`
2. Utworzenie głównego komponentu React: `src/components/generation/GenerationReviewView.tsx`
3. Utworzenie komponentów pomocniczych:
   - `src/components/generation/GenerationHeader.tsx`
   - `src/components/generation/ProposalsCounter.tsx`
   - `src/components/generation/SaveAllButton.tsx`
   - `src/components/generation/ProposalsList.tsx`
   - `src/components/generation/ProposalCard.tsx`
   - `src/components/generation/EditProposalDialog.tsx`
   - `src/components/generation/SaveProgressIndicator.tsx`
   - `src/components/generation/ErrorAlert.tsx`

### Krok 2: Definicja typów

1. Dodanie nowych typów ViewModel do `src/types.ts` (jeśli nie są już zdefiniowane):
   - `ProposalStatus`
   - `ProposalViewModel`
   - `EditProposalFormData`
   - `SaveProgressState`

### Krok 3: Implementacja funkcji API

1. Dodanie funkcji `getGenerationDetails` do `src/lib/api/generations.ts` (jeśli nie istnieje)
2. Utworzenie pliku `src/lib/api/flashcards.ts` z funkcją `createFlashcard` (jeśli nie istnieje)

### Krok 4: Implementacja komponentów pomocniczych

1. Implementacja `GenerationHeader`:
   - Wyświetlanie informacji o generacji (data, model, czas trwania)
   - Formatowanie daty i czasu trwania

2. Implementacja `ProposalsCounter`:
   - Wyświetlanie licznika propozycji
   - Formatowanie licznika (np. "5 z 10 zaakceptowanych")

3. Implementacja `SaveAllButton`:
   - Przycisk z loading state
   - Obsługa disabled state (gdy brak zaakceptowanych propozycji)

4. Implementacja `SaveProgressIndicator`:
   - Pasek postępu
   - Tekst informujący o postępie

5. Implementacja `ErrorAlert`:
   - Wyświetlanie błędów
   - Przycisk "Spróbuj ponownie" (opcjonalnie)

### Krok 5: Implementacja ProposalCard

1. Implementacja karty propozycji:
   - Wyświetlanie awersu (zawsze widoczny)
   - Wyświetlanie rewersu (rozwijany/zwijany z użyciem Collapsible)
   - Wyświetlanie wskaźnika confidence (opcjonalnie)
   - Wyświetlanie statusu propozycji (badge)
   - Przyciski akcji (Akceptuj, Edytuj, Odrzuć)

2. Obsługa zdarzeń:
   - Toggle rozwinięcia/zwinięcia rewersu
   - Akceptacja propozycji
   - Odrzucenie propozycji
   - Otwarcie modala edycji

### Krok 6: Implementacja EditProposalDialog

1. Implementacja modala edycji:
   - Formularz z polami front i back
   - Liczniki znaków dla obu pól
   - Walidacja przez React Hook Form z Zod
   - Przyciski "Zapisz" i "Anuluj"

2. Obsługa zdarzeń:
   - Otwarcie/zamknięcie modala
   - Zapisanie zmian (automatyczna akceptacja po zapisaniu)
   - Anulowanie edycji

### Krok 7: Implementacja ProposalsList

1. Implementacja listy propozycji:
   - Renderowanie tablicy `ProposalCard`
   - Layout (grid lub flex column)
   - Opcjonalnie: wirtualizacja dla dużej liczby propozycji (>20)

### Krok 8: Implementacja głównego komponentu GenerationReviewView

1. Zarządzanie stanem:
   - Stan propozycji z statusami (`useState<ProposalViewModel[]>`)
   - Stan rozwinięcia rewersów (`useState<Set<number>>`)
   - Stan modala edycji (`useState<number | null>`)
   - Stan postępu zapisywania (`useState<SaveProgressState>`)
   - Stan błędów (`useState<ApiError | null>`)

2. React Query:
   - Query dla szczegółów generacji (`useQuery`)
   - Pobranie propozycji (z cache, sessionStorage, lub API)
   - Mutation dla zapisywania fiszek (`useMutation`)

3. Funkcje obsługi akcji:
   - `handleAccept` - akceptacja propozycji
   - `handleReject` - odrzucenie propozycji
   - `handleEdit` - otwarcie modala edycji
   - `handleSaveEdit` - zapisanie edytowanej propozycji
   - `handleToggleBack` - rozwinięcie/zwinięcie rewersu
   - `handleSaveAll` - zapisanie wszystkich zaakceptowanych propozycji

4. Renderowanie:
   - Warunkowe renderowanie na podstawie stanu ładowania
   - Renderowanie komponentów pomocniczych
   - Obsługa błędów

### Krok 9: Implementacja strony Astro

1. Implementacja `src/pages/generations/[generationId].astro`:
   - Pobranie `generationId` z parametrów ścieżki
   - Renderowanie layoutu z topbarem
   - Renderowanie komponentu `GenerationReviewView` z `client:load`
   - Przekazanie `generationId` jako prop

### Krok 10: Integracja z React Query

1. Konfiguracja React Query Provider (jeśli nie jest już skonfigurowany):
   - Dodanie `QueryClientProvider` w layout aplikacji
   - Konfiguracja `QueryClient` z odpowiednimi opcjami

2. Konfiguracja cache dla propozycji:
   - Zapisanie propozycji w cache po wygenerowaniu (w widoku `/generate`)
   - Pobranie propozycji z cache w widoku przeglądu

### Krok 11: Integracja z Toast Notifications

1. Konfiguracja Toaster (jeśli nie jest już skonfigurowany):
   - Dodanie `<Toaster />` w layout aplikacji
   - Import hooka `useToast` w komponentach

2. Dodanie toast notifications:
   - Sukces zapisania edytowanej propozycji
   - Sukces zapisania wszystkich zaakceptowanych propozycji
   - Błędy podczas zapisywania
   - Częściowe sukcesy

### Krok 12: Testowanie

1. Testowanie podstawowych funkcjonalności:
   - Pobieranie szczegółów generacji
   - Wyświetlanie propozycji
   - Akceptacja propozycji
   - Odrzucenie propozycji
   - Edycja propozycji
   - Zapisywanie wszystkich zaakceptowanych propozycji

2. Testowanie obsługi błędów:
   - Błędy autoryzacji (401)
   - Błędy nie znaleziono (404)
   - Błędy walidacji (400)
   - Błędy konfliktu (409)
   - Błędy serwera (500)
   - Błędy sieciowe

3. Testowanie dostępności:
   - Nawigacja klawiaturowa
   - ARIA labels
   - Focus management

4. Testowanie responsywności:
   - Mobile (<768px)
   - Tablet (768px-1024px)
   - Desktop (>1024px)

### Krok 13: Optymalizacja (opcjonalnie)

1. Wirtualizacja listy propozycji (dla >20 propozycji):
   - Użycie `react-window` lub `react-virtuoso`
   - Implementacja wirtualizacji w `ProposalsList`

2. Optymistyczne aktualizacje UI:
   - Aktualizacja UI przed potwierdzeniem z API
   - Rollback w przypadku błędu

3. Lazy loading komponentów:
   - Użycie `React.lazy()` dla dużych komponentów
   - Code splitting

### Krok 14: Dokumentacja i cleanup

1. Dodanie komentarzy JSDoc do funkcji i komponentów
2. Sprawdzenie zgodności z linterem
3. Usunięcie nieużywanych importów i kodu
4. Aktualizacja dokumentacji projektu (jeśli wymagana)


