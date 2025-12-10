# Plan implementacji sesji nauki (Study Session)

## 1. Przegląd

Sesja nauki (`/study`) to kluczowa funkcjonalność aplikacji 10xCards, umożliwiająca użytkownikom powtarzanie fiszek metodą spaced repetition. Implementacja obejmuje:

1. **API endpoints** do pobierania fiszek do powtórki i zapisywania ocen
2. **Widok pełnoekranowy** z minimalnym UI
3. **Uproszczona implementacja FSRS** (Free Spaced Repetition Scheduler)

**Wymagania funkcjonalne:**
- FR-014: Sesja nauki z fiszkami do powtórki
- FR-015: Ocenianie fiszek (Again, Hard, Good, Easy)
- FR-016: Algorytm FSRS do planowania powtórek

## 2. API Endpoints

### 2.1 GET /api/study-session

**Opis:** Pobiera fiszki do powtórki (gdzie `due <= now`)

**Plik:** `src/pages/api/study-session/index.ts`

**Query Parameters:**
- `limit` (opcjonalny, default: 20, max: 100) - maksymalna liczba fiszek

**Response (200 OK):**
```typescript
{
  data: {
    sessionId: string;      // UUID sesji
    cards: StudyCard[];     // Fiszki do powtórki
    totalDue: number;       // Całkowita liczba fiszek do powtórki
    sessionStartedAt: string; // ISO 8601 timestamp
  },
  success: true
}
```

**StudyCard:**
```typescript
{
  id: string;
  front: string;
  back: string;
  state: FSRSState;      // 0-3
  due: string;           // ISO 8601
  stability: number;
  difficulty: number;
  lapses: number;
}
```

**Błędy:**
- 401 Unauthorized - brak autoryzacji
- 500 Internal Server Error

### 2.2 POST /api/flashcards/[flashcardId]/review

**Opis:** Zapisuje ocenę fiszki i aktualizuje parametry FSRS

**Plik:** `src/pages/api/flashcards/[flashcardId]/review.ts`

**Request Body:**
```typescript
{
  rating: 1 | 2 | 3 | 4;  // 1=Again, 2=Hard, 3=Good, 4=Easy
  responseTime?: number;   // Czas odpowiedzi w ms (opcjonalny)
}
```

**Response (200 OK):**
```typescript
{
  data: {
    flashcardId: string;
    newState: FSRSState;
    newDue: string;        // ISO 8601
    newStability: number;
    newDifficulty: number;
    newLapses: number;
  },
  success: true
}
```

**Błędy:**
- 400 Bad Request - nieprawidłowe dane
- 401 Unauthorized
- 404 Not Found - fiszka nie istnieje
- 500 Internal Server Error

## 3. Uproszczony algorytm FSRS

Implementujemy uproszczoną wersję FSRS dla MVP:

### Stany fiszki (FSRSState):
- `0` = New (nowa)
- `1` = Learning (w nauce)
- `2` = Review (do powtórki)
- `3` = Relearning (ponowna nauka)

### Obliczanie następnego terminu (due):

```typescript
function calculateNextDue(
  currentState: FSRSState,
  rating: ReviewRating,
  stability: number,
  difficulty: number,
  lapses: number
): { newDue: Date; newState: FSRSState; newStability: number; newDifficulty: number; newLapses: number } {
  const now = new Date();

  // Rating 1 (Again) - zawsze reset do Learning
  if (rating === 1) {
    return {
      newDue: addMinutes(now, 1),      // Powtórz za 1 minutę
      newState: 1,                       // Learning
      newStability: Math.max(stability * 0.5, 0.5),
      newDifficulty: Math.min(difficulty + 0.1, 1),
      newLapses: lapses + 1,
    };
  }

  // Rating 2 (Hard)
  if (rating === 2) {
    const interval = Math.max(stability * 0.8, 1); // dni
    return {
      newDue: addDays(now, interval),
      newState: currentState === 0 ? 1 : 2,
      newStability: stability * 1.2,
      newDifficulty: Math.min(difficulty + 0.05, 1),
      newLapses: lapses,
    };
  }

  // Rating 3 (Good)
  if (rating === 3) {
    const interval = Math.max(stability * 1.5, 1); // dni
    return {
      newDue: addDays(now, interval),
      newState: 2, // Review
      newStability: stability * 2.5,
      newDifficulty: difficulty,
      newLapses: lapses,
    };
  }

  // Rating 4 (Easy)
  const interval = Math.max(stability * 2.5, 2); // dni
  return {
    newDue: addDays(now, interval),
    newState: 2, // Review
    newStability: stability * 3.5,
    newDifficulty: Math.max(difficulty - 0.05, 0),
    newLapses: lapses,
  };
}
```

### Wartości początkowe dla nowych fiszek:
- `state`: 0 (New)
- `due`: now (natychmiast do powtórki)
- `stability`: 1.0
- `difficulty`: 0.3
- `lapses`: 0

## 4. Routing widoku

- **Ścieżka:** `/study`
- **Plik:** `src/pages/study.astro`
- **Layout:** Minimalny layout bez nawigacji (pełnoekranowy tryb)
- **Ochrona:** Strona chroniona, wymaga autoryzacji

## 5. Struktura komponentów

```
StudyPage (Astro)
└── StudySessionWithProvider (React - wrapper)
    └── StudySession (React - główny komponent)
        ├── StudyProgress (pasek postępu)
        ├── FlashcardDisplay
        │   ├── CardFront (awers)
        │   └── CardBack (rewers - ukryty do odkrycia)
        ├── RevealButton (przycisk "Pokaż odpowiedź")
        ├── RatingButtons (przyciski oceny 1-4)
        │   ├── AgainButton
        │   ├── HardButton
        │   ├── GoodButton
        │   └── EasyButton
        ├── StudyComplete (ekran końcowy)
        └── ExitButton (wyjście z sesji)
```

## 6. Szczegóły komponentów

### StudySession

**Plik:** `src/components/study/StudySession.tsx`

**Stan:**
- `cards: StudyCard[]` - fiszki do powtórki
- `currentIndex: number` - indeks aktualnej fiszki
- `isRevealed: boolean` - czy rewers jest odkryty
- `isLoading: boolean` - ładowanie
- `isComplete: boolean` - czy sesja zakończona
- `sessionStats: { reviewed: number; again: number; hard: number; good: number; easy: number }`

**Funkcje:**
- `handleReveal()` - odkrycie rewersu
- `handleRating(rating: ReviewRating)` - ocena i przejście do następnej
- `handleExit()` - wyjście z sesji

### FlashcardDisplay

**Plik:** `src/components/study/FlashcardDisplay.tsx`

**Props:**
```typescript
interface FlashcardDisplayProps {
  card: StudyCard;
  isRevealed: boolean;
}
```

**Elementy:**
- Karta z awersem (zawsze widoczna)
- Karta z rewersem (widoczna po odkryciu)
- Animacja przejścia

### RatingButtons

**Plik:** `src/components/study/RatingButtons.tsx`

**Props:**
```typescript
interface RatingButtonsProps {
  onRating: (rating: ReviewRating) => void;
  isSubmitting: boolean;
}
```

**Przyciski:**
- Again (1) - czerwony
- Hard (2) - pomarańczowy
- Good (3) - zielony
- Easy (4) - niebieski

### StudyProgress

**Plik:** `src/components/study/StudyProgress.tsx`

**Props:**
```typescript
interface StudyProgressProps {
  current: number;
  total: number;
}
```

### StudyComplete

**Plik:** `src/components/study/StudyComplete.tsx`

**Props:**
```typescript
interface StudyCompleteProps {
  stats: {
    reviewed: number;
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
  onContinue: () => void; // Powrót do dashboardu
  onStudyMore: () => void; // Nowa sesja
}
```

## 7. Interakcje użytkownika

### Flow sesji nauki:

1. Użytkownik wchodzi na `/study`
2. System pobiera fiszki do powtórki (GET /api/study-session)
3. Wyświetlana jest pierwsza fiszka (tylko awers)
4. Użytkownik klika "Pokaż odpowiedź" lub naciska spację
5. Wyświetlany jest rewers
6. Użytkownik ocenia fizkę (1-4) klikając przycisk lub naciskając klawisz
7. System zapisuje ocenę (POST /api/flashcards/[id]/review)
8. Wyświetlana jest następna fiszka
9. Po zakończeniu wszystkich fiszek - ekran podsumowania

### Nawigacja klawiaturowa:

- **Spacja** - odkrycie rewersu
- **1** - ocena "Again"
- **2** - ocena "Hard"
- **3** - ocena "Good"
- **4** - ocena "Easy"
- **Escape** - wyjście z sesji

## 8. Obsługa błędów

### Brak fiszek do powtórki:
- Wyświetlenie komunikatu "Gratulacje! Nie masz fiszek do powtórki."
- Przycisk "Wróć do dashboardu"
- Przycisk "Przeglądaj wszystkie fiszki"

### Błąd pobierania fiszek:
- Alert z komunikatem błędu
- Przycisk "Spróbuj ponownie"

### Błąd zapisywania oceny:
- Toast z błędem
- Automatyczna ponowna próba
- Możliwość pominięcia fiszki

## 9. Kroki implementacji

### Krok 1: Utility FSRS
1. Utworzenie `src/lib/utils/fsrs.utils.ts`
2. Implementacja `calculateNextDue()`
3. Implementacja pomocniczych funkcji dat

### Krok 2: Serwis Study Session
1. Utworzenie `src/lib/services/study.service.ts`
2. Implementacja `getDueFlashcards(userId, limit)`
3. Implementacja `submitReview(flashcardId, userId, rating)`

### Krok 3: API Endpoints
1. Utworzenie `src/pages/api/study-session/index.ts` (GET)
2. Utworzenie `src/pages/api/flashcards/[flashcardId]/review.ts` (POST)
3. Walidacja Zod dla request body

### Krok 4: API Client
1. Rozszerzenie `src/lib/api/` o funkcje:
   - `fetchStudySession(limit?)`
   - `submitReview(flashcardId, rating)`

### Krok 5: Komponenty UI
1. `StudyProgress.tsx`
2. `FlashcardDisplay.tsx`
3. `RatingButtons.tsx`
4. `StudyComplete.tsx`

### Krok 6: Główny komponent
1. `StudySession.tsx`
2. `StudySessionWithProvider.tsx`

### Krok 7: Strona Astro
1. `src/pages/study.astro`

### Krok 8: Testowanie
1. Test flow sesji nauki
2. Test nawigacji klawiaturowej
3. Test obsługi błędów
4. Test aktualizacji FSRS

## 10. Pliki do utworzenia/modyfikacji

### Nowe pliki:
- `src/lib/utils/fsrs.utils.ts`
- `src/lib/services/study.service.ts`
- `src/lib/api/study.ts`
- `src/lib/validation/review.schema.ts`
- `src/pages/api/study-session/index.ts`
- `src/pages/api/flashcards/[flashcardId]/review.ts`
- `src/pages/study.astro`
- `src/components/study/StudySession.tsx`
- `src/components/study/StudySessionWithProvider.tsx`
- `src/components/study/StudyProgress.tsx`
- `src/components/study/FlashcardDisplay.tsx`
- `src/components/study/RatingButtons.tsx`
- `src/components/study/StudyComplete.tsx`

### Modyfikowane pliki:
- `src/lib/services/flashcard.service.ts` (dodanie metody updateFSRS)
