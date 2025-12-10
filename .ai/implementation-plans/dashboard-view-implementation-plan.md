# Plan implementacji widoku Dashboard

## 1. Przegląd

Dashboard (ekran powitania) jest głównym punktem wejścia do aplikacji 10xCards. Widok ten pełni funkcję prezentacji aplikacji dla niezalogowanych użytkowników oraz centrum informacji i nawigacji dla zalogowanych użytkowników.

Główne cele widoku:

- Prezentacja aplikacji i jej funkcjonalności dla nowych użytkowników
- Wyświetlenie podsumowania statystyk dla zalogowanych użytkowników (liczba fiszek, fiszki do powtórki)
- Szybki dostęp do kluczowych funkcji aplikacji przez przyciski CTA
- Nawigacja do logowania/rejestracji dla niezalogowanych użytkowników

Widok jest publiczny (dostępny bez autoryzacji), ale wyświetla różne treści w zależności od stanu autoryzacji użytkownika.

## 2. Routing widoku

- **Ścieżka:** `/`
- **Plik:** `src/pages/index.astro`
- **Layout:** `src/layouts/Layout.astro` (wspólny layout z topbarem)
- **Ochrona:** Strona publiczna, dostępna bez autoryzacji

## 3. Struktura komponentów

```
Dashboard (index.astro)
├── DashboardHero (React) - nagłówek powitalny z logo i opisem
├── DashboardStats (React) - karty ze statystykami (tylko dla zalogowanych)
│   ├── StatCard (React) - pojedyncza karta statystyki
│   └── StatCard (React)
├── DashboardActions (React) - sekcja z przyciskami CTA
│   ├── PrimaryActionButton (React) - główne przyciski akcji
│   └── PrimaryActionButton (React)
└── DashboardAuthLinks (React) - linki do logowania/rejestracji (tylko dla niezalogowanych)
```

## 4. Szczegóły komponentów

### DashboardHero

- **Opis komponentu:** Nagłówek powitalny wyświetlający nazwę aplikacji, logo i krótki opis funkcjonalności. Komponent jest zawsze widoczny, niezależnie od stanu autoryzacji.

- **Główne elementy:**
  - Logo aplikacji (może być tekstowe lub obrazek)
  - Nagłówek H1 z nazwą aplikacji "10xCards"
  - Paragraf z opisem aplikacji: "Aplikacja do szybkiego tworzenia fiszek edukacyjnych z wykorzystaniem AI. Ucz się efektywnie metodą powtórek interwałowych."

- **Obsługiwane interakcje:**
  - Brak interakcji (komponent statyczny)

- **Obsługiwana walidacja:**
  - Brak walidacji

- **Typy:**
  - Brak props (komponent bez parametrów)

- **Props:**
  - Brak props

### DashboardStats

- **Opis komponentu:** Sekcja wyświetlająca karty ze statystykami użytkownika. Komponent jest widoczny tylko dla zalogowanych użytkowników. Wyświetla podstawowe statystyki: całkowitą liczbę fiszek, liczbę fiszek do powtórki dzisiaj, oraz opcjonalnie dodatkowe statystyki z API `/api/statistics` (jeśli endpoint jest dostępny).

- **Główne elementy:**
  - Kontener z grid layout (responsive: 1 kolumna na mobile, 2-3 kolumny na desktop)
  - Komponenty `StatCard` dla każdej statystyki:
    - Karta "Wszystkie fiszki" z liczbą `totalCards`
    - Karta "Do powtórki dzisiaj" z liczbą `dueToday`
    - Opcjonalnie: karta "Średnia dokładność" z `averageAccuracy` (jeśli dostępne z API)
    - Opcjonalnie: karta "Serie nauki" z `studyStreak` (jeśli dostępne z API)
  - Skeleton loader podczas ładowania danych
  - Komunikat "Brak danych" jeśli statystyki są niedostępne

- **Obsługiwane interakcje:**
  - Automatyczne pobieranie statystyk przy montowaniu komponentu (jeśli użytkownik jest zalogowany)
  - Wyświetlenie skeleton loadera podczas ładowania
  - Obsługa błędów z wyświetleniem komunikatu

- **Obsługiwana walidacja:**
  - Sprawdzenie czy użytkownik jest zalogowany (warunkowy render)
  - Walidacja odpowiedzi API (sprawdzenie struktury danych)

- **Typy:**
  - `UserStatisticsResponse` z `src/types.ts` (jeśli endpoint jest dostępny)
  - `DashboardStatsViewModel` (lokalny typ dla danych wyświetlanych w komponencie)

- **Props:**
  ```typescript
  interface DashboardStatsProps {
    isAuthenticated: boolean;
    userId?: string;
  }
  ```

### StatCard

- **Opis komponentu:** Pojedyncza karta wyświetlająca jedną statystykę. Używana w komponencie `DashboardStats` do prezentacji poszczególnych metryk.

- **Główne elementy:**
  - Shadcn/ui Card jako kontener
  - Ikona reprezentująca statystykę (opcjonalnie)
  - Etykieta statystyki (tekst opisowy)
  - Wartość statystyki (liczba lub tekst)
  - Opcjonalnie: trend lub zmiana w stosunku do poprzedniego okresu

- **Obsługiwane interakcje:**
  - Brak interakcji (komponent statyczny)

- **Obsługiwana walidacja:**
  - Sprawdzenie czy wartość jest zdefiniowana przed wyświetleniem
  - Formatowanie liczby (np. separator tysięcy)

- **Typy:**
  - Brak zewnętrznych typów (używa lokalnych props)

- **Props:**
  ```typescript
  interface StatCardProps {
    label: string;
    value: number | string;
    icon?: React.ReactNode;
    trend?: {
      value: number;
      direction: "up" | "down" | "neutral";
    };
  }
  ```

### DashboardActions

- **Opis komponentu:** Sekcja z przyciskami Call-to-Action (CTA) umożliwiającymi szybki dostęp do kluczowych funkcji aplikacji. Dla zalogowanych użytkowników wyświetla aktywne przyciski prowadzące do głównych sekcji. Dla niezalogowanych przyciski mogą być nieaktywne lub przekierowywać do logowania.

- **Główne elementy:**
  - Kontener z grid layout (responsive: 1 kolumna na mobile, 2-3 kolumny na desktop)
  - Przyciski CTA (Shadcn/ui Button):
    - "Generuj fiszki" - przekierowanie do `/generate` (aktywny tylko dla zalogowanych)
    - "Moje fiszki" - przekierowanie do `/flashcards` (aktywny tylko dla zalogowanych)
    - "Rozpocznij naukę" - przekierowanie do `/study` (aktywny tylko dla zalogowanych i gdy `dueToday > 0`)
  - Dla niezalogowanych: przyciski mogą być nieaktywne lub przekierowywać do `/login?redirect=/docelowa-strona`

- **Obsługiwane interakcje:**
  - Kliknięcie przycisku "Generuj fiszki" → nawigacja do `/generate` (lub `/login?redirect=/generate` dla niezalogowanych)
  - Kliknięcie przycisku "Moje fiszki" → nawigacja do `/flashcards` (lub `/login?redirect=/flashcards` dla niezalogowanych)
  - Kliknięcie przycisku "Rozpocznij naukę" → nawigacja do `/study` (tylko dla zalogowanych z `dueToday > 0`)
  - Dla niezalogowanych: przyciski przekierowują do logowania z parametrem `redirect`

- **Obsługiwana walidacja:**
  - Sprawdzenie stanu autoryzacji przed aktywacją przycisków
  - Sprawdzenie czy `dueToday > 0` przed aktywacją przycisku "Rozpocznij naukę"
  - Walidacja dostępności danych statystyk przed wyświetleniem stanu przycisków

- **Typy:**
  - Brak zewnętrznych typów (używa lokalnych props i stanu)

- **Props:**
  ```typescript
  interface DashboardActionsProps {
    isAuthenticated: boolean;
    dueToday?: number;
  }
  ```

### PrimaryActionButton

- **Opis komponentu:** Wrapper dla przycisku CTA z dodatkowymi stylami i funkcjonalnością. Używany w komponencie `DashboardActions` dla spójnego wyglądu przycisków akcji.

- **Główne elementy:**
  - Shadcn/ui Button z wariantem "default" lub "outline"
  - Ikona (opcjonalnie)
  - Tekst etykiety
  - Stan disabled gdy przycisk jest nieaktywny

- **Obsługiwane interakcje:**
  - Kliknięcie → nawigacja do docelowej strony lub wywołanie callback
  - Stan disabled gdy warunki nie są spełnione

- **Obsługiwana walidacja:**
  - Sprawdzenie czy przycisk powinien być aktywny przed renderowaniem
  - Walidacja dostępności danych przed aktywacją

- **Typy:**
  - Brak zewnętrznych typów (używa lokalnych props)

- **Props:**
  ```typescript
  interface PrimaryActionButtonProps {
    label: string;
    href: string;
    icon?: React.ReactNode;
    disabled?: boolean;
    variant?: "default" | "outline";
  }
  ```

### DashboardAuthLinks

- **Opis komponentu:** Sekcja z linkami do logowania i rejestracji. Widoczna tylko dla niezalogowanych użytkowników. Zawiera przyciski/linki prowadzące do stron autoryzacji.

- **Główne elementy:**
  - Kontener z flex layout
  - Link "Zaloguj się" prowadzący do `/login`
  - Separator (opcjonalnie)
  - Link "Zarejestruj się" prowadzący do `/register`
  - Opcjonalnie: krótki tekst zachęcający do rejestracji

- **Obsługiwane interakcje:**
  - Kliknięcie "Zaloguj się" → nawigacja do `/login`
  - Kliknięcie "Zarejestruj się" → nawigacja do `/register`

- **Obsługiwana walidacja:**
  - Sprawdzenie stanu autoryzacji przed renderowaniem (tylko dla niezalogowanych)

- **Typy:**
  - Brak zewnętrznych typów (używa lokalnych props)

- **Props:**
  ```typescript
  interface DashboardAuthLinksProps {
    isAuthenticated: boolean;
  }
  ```

## 5. Typy

### Typy z API

#### UserStatisticsResponse

Typ zdefiniowany w `src/types.ts`:

```typescript
interface UserStatisticsResponse {
  totalCards: number;
  cardsBySource: {
    "ai-full": number;
    "ai-edited": number;
    manual: number;
  };
  cardsByState: {
    new: number;
    learning: number;
    review: number;
    relearning: number;
  };
  dueToday: number;
  averageAccuracy: number;
  studyStreak: number;
  totalStudyTime: number; // minutes
  period: TimePeriod; // "7d" | "30d" | "90d" | "all"
}
```

#### StatisticsQuery

Typ zdefiniowany w `src/types.ts`:

```typescript
interface StatisticsQuery {
  period?: TimePeriod; // "7d" | "30d" | "90d" | "all"
}
```

### Niestandardowe typy ViewModel

#### DashboardStatsViewModel

Lokalny typ dla danych wyświetlanych w komponencie `DashboardStats`:

```typescript
interface DashboardStatsViewModel {
  totalCards: number;
  dueToday: number;
  averageAccuracy?: number; // opcjonalne, jeśli dostępne z API
  studyStreak?: number; // opcjonalne, jeśli dostępne z API
  isLoading: boolean;
  error: string | null;
}
```

#### DashboardState

Lokalny typ dla stanu głównego komponentu Dashboard:

```typescript
interface DashboardState {
  isAuthenticated: boolean;
  userId: string | null;
  statistics: DashboardStatsViewModel | null;
  isLoadingStatistics: boolean;
}
```

## 6. Zarządzanie stanem

### Stan globalny (autoryzacja)

Widok Dashboard wymaga dostępu do stanu autoryzacji użytkownika. Stan ten powinien być zarządzany przez:

- **Zustand store** lub **React Context** z hookiem `useAuth()`
- Store powinien zawierać:
  - `user: User | null` - obiekt użytkownika z Supabase
  - `isAuthenticated: boolean` - flaga stanu autoryzacji
  - `isLoading: boolean` - flaga ładowania stanu autoryzacji
  - `error: string | null` - błąd autoryzacji

Hook `useAuth()` powinien być używany w komponencie Dashboard do:

- Sprawdzenia czy użytkownik jest zalogowany
- Pobrania ID użytkownika (jeśli zalogowany)
- Subskrypcji zmian stanu autoryzacji

### Stan lokalny (statystyki)

Komponent `DashboardStats` używa React Query do zarządzania danymi statystyk:

- **React Query `useQuery`** dla pobierania statystyk z API `/api/statistics`
- Query key: `["statistics", userId, period]` gdzie `period` domyślnie "30d"
- Automatyczne cache'owanie i refetch
- Loading state i error state zarządzane przez React Query

### Custom hook: useDashboardStatistics

Hook do zarządzania statystykami w widoku Dashboard:

```typescript
function useDashboardStatistics(userId: string | null, period: TimePeriod = "30d") {
  return useQuery({
    queryKey: ["statistics", userId, period],
    queryFn: () => fetchStatistics(userId!, period),
    enabled: !!userId, // tylko jeśli użytkownik jest zalogowany
    staleTime: 5 * 60 * 1000, // 5 minut
    retry: 1,
  });
}
```

Hook zwraca:

- `data: UserStatisticsResponse | undefined` - dane statystyk
- `isLoading: boolean` - flaga ładowania
- `error: Error | null` - błąd pobierania
- `refetch: () => void` - funkcja do ponownego pobrania danych

## 7. Integracja API

### Endpoint: GET /api/statistics

**Opis:** Endpoint do pobrania statystyk użytkownika. Endpoint jest opcjonalny - jeśli nie jest jeszcze zaimplementowany, widok powinien działać bez statystyk (wyświetlając tylko podstawowe informacje).

**Request:**

- Method: `GET`
- Path: `/api/statistics`
- Query Parameters:
  - `period` (optional): `"7d" | "30d" | "90d" | "all"` (default: `"30d"`)
- Headers:
  - `Authorization: Bearer <jwt_token>` (wymagane dla zalogowanych użytkowników)

**Response:**

- Success (200 OK):
  ```typescript
  {
    data: UserStatisticsResponse;
    success: true;
  }
  ```
- Error (401 Unauthorized):
  ```typescript
  {
    error: {
      message: string;
      code: "UNAUTHORIZED";
    }
    success: false;
  }
  ```

**Implementacja klienta API:**

Funkcja w `src/lib/api/statistics.api.ts`:

```typescript
export async function fetchStatistics(period: TimePeriod = "30d"): Promise<UserStatisticsResponse> {
  const response = await apiClient.get<UserStatisticsResponse>(`/api/statistics?period=${period}`);
  return response.data;
}
```

**Użycie w komponencie:**

Komponent `DashboardStats` używa React Query z funkcją `fetchStatistics`:

```typescript
const { data, isLoading, error } = useDashboardStatistics(userId, "30d");
```

### Fallback gdy endpoint nie jest dostępny

Jeśli endpoint `/api/statistics` nie jest jeszcze zaimplementowany, widok powinien:

1. Wyświetlić podstawowe informacje bez statystyk z API
2. Użyć danych z innych źródeł (np. liczba fiszek z `/api/flashcards` z limit=1 i total z paginacji)
3. Wyświetlić komunikat "Statystyki wkrótce" lub ukryć sekcję statystyk
4. Nie wyświetlać błędów związanych z brakiem endpointu

## 8. Interakcje użytkownika

### Dla niezalogowanych użytkowników

1. **Wyświetlenie ekranu powitalnego:**
   - Użytkownik widzi nagłówek z nazwą aplikacji i opisem
   - Widzi sekcję z linkami do logowania/rejestracji
   - Przyciski CTA są nieaktywne lub przekierowują do logowania

2. **Kliknięcie "Zaloguj się":**
   - Nawigacja do `/login`
   - Po zalogowaniu: automatyczne przekierowanie z powrotem do `/` (lub strony wskazanej w `redirect`)

3. **Kliknięcie "Zarejestruj się":**
   - Nawigacja do `/register`
   - Po rejestracji: automatyczne logowanie i przekierowanie do `/`

### Dla zalogowanych użytkowników

1. **Wyświetlenie ekranu powitalnego:**
   - Użytkownik widzi nagłówek z nazwą aplikacji
   - Widzi karty ze statystykami (liczba fiszek, fiszki do powtórki)
   - Widzi aktywne przyciski CTA

2. **Kliknięcie "Generuj fiszki":**
   - Nawigacja do `/generate`
   - Jeśli użytkownik nie ma uprawnień: przekierowanie z komunikatem błędu

3. **Kliknięcie "Moje fiszki":**
   - Nawigacja do `/flashcards`
   - Wyświetlenie listy wszystkich fiszek użytkownika

4. **Kliknięcie "Rozpocznij naukę":**
   - Nawigacja do `/study`
   - Przycisk jest aktywny tylko gdy `dueToday > 0`
   - Jeśli brak fiszek do powtórki: przycisk nieaktywny lub ukryty

5. **Odświeżenie statystyk:**
   - Statystyki są automatycznie odświeżane przez React Query
   - Możliwość ręcznego odświeżenia (opcjonalnie: przycisk "Odśwież")

## 9. Warunki i walidacja

### Warunki wyświetlania komponentów

1. **DashboardStats:**
   - Warunek: `isAuthenticated === true`
   - Jeśli warunek nie spełniony: komponent nie jest renderowany

2. **DashboardAuthLinks:**
   - Warunek: `isAuthenticated === false`
   - Jeśli warunek nie spełniony: komponent nie jest renderowany

3. **Przycisk "Rozpocznij naukę":**
   - Warunek: `isAuthenticated === true && dueToday > 0`
   - Jeśli warunek nie spełniony: przycisk jest nieaktywny (disabled) lub ukryty

### Walidacja danych z API

1. **Walidacja odpowiedzi `/api/statistics`:**
   - Sprawdzenie czy odpowiedź zawiera wymagane pola (`totalCards`, `dueToday`)
   - Sprawdzenie czy wartości są liczbami (nie null/undefined)
   - Obsługa przypadku gdy endpoint zwraca błąd 404 (endpoint nie istnieje)

2. **Walidacja stanu autoryzacji:**
   - Sprawdzenie czy token JWT jest ważny
   - Obsługa wygaśnięcia tokena (przekierowanie do logowania)

3. **Walidacja dostępności danych:**
   - Sprawdzenie czy dane statystyk są dostępne przed wyświetleniem
   - Wyświetlenie skeleton loadera podczas ładowania
   - Wyświetlenie komunikatu błędu w przypadku niepowodzenia

### Warunki wpływające na stan interfejsu

1. **Stan ładowania:**
   - Gdy `isLoadingStatistics === true`: wyświetlenie skeleton loadera zamiast danych
   - Gdy `isLoadingStatistics === false && data === null`: wyświetlenie komunikatu "Brak danych"

2. **Stan błędu:**
   - Gdy `error !== null`: wyświetlenie komunikatu błędu z możliwością ponowienia
   - Gdy błąd 401: przekierowanie do logowania

3. **Stan autoryzacji:**
   - Gdy `isAuthenticated === false`: wyświetlenie linków do logowania/rejestracji
   - Gdy `isAuthenticated === true`: wyświetlenie statystyk i aktywnych przycisków CTA

## 10. Obsługa błędów

### Błędy autoryzacji (401 Unauthorized)

**Scenariusz:** Użytkownik próbuje pobrać statystyki, ale token JWT jest nieprawidłowy lub wygasł.

**Obsługa:**

- Wyświetlenie komunikatu: "Sesja wygasła. Zaloguj się ponownie."
- Przekierowanie do `/login?redirect=/`
- Toast notification z informacją o wygaśnięciu sesji

**Implementacja:**

```typescript
if (error?.status === 401) {
  // Przekierowanie do logowania
  window.location.href = `/login?redirect=/`;
  // Toast notification
  toast.error("Sesja wygasła. Zaloguj się ponownie.");
}
```

### Błędy serwera (500 Internal Server Error)

**Scenariusz:** Wystąpił błąd serwera podczas pobierania statystyk.

**Obsługa:**

- Wyświetlenie komunikatu: "Wystąpił błąd podczas pobierania statystyk. Spróbuj ponownie."
- Przycisk "Spróbuj ponownie" do ręcznego odświeżenia danych
- Automatyczne ponowienie po 5 sekundach (opcjonalnie)

**Implementacja:**

```typescript
if (error?.status === 500) {
  // Wyświetlenie komunikatu błędu
  // Przycisk do ręcznego odświeżenia
  // Opcjonalnie: automatyczne ponowienie
}
```

### Błędy sieciowe

**Scenariusz:** Brak połączenia z internetem lub timeout requestu.

**Obsługa:**

- Wyświetlenie komunikatu: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
- Przycisk "Spróbuj ponownie" do ręcznego odświeżenia
- Retry logic w kliencie API (automatyczne ponowienie)

**Implementacja:**

```typescript
if (error?.message === "Network Error" || error?.code === "ECONNABORTED") {
  // Wyświetlenie komunikatu błędu sieciowego
  // Przycisk do ręcznego odświeżenia
}
```

### Endpoint nie istnieje (404 Not Found)

**Scenariusz:** Endpoint `/api/statistics` nie jest jeszcze zaimplementowany.

**Obsługa:**

- Ukrycie sekcji statystyk lub wyświetlenie komunikatu "Statystyki wkrótce"
- Nie wyświetlanie błędów związanych z brakiem endpointu
- Użycie danych z innych źródeł (np. liczba fiszek z `/api/flashcards`)

**Implementacja:**

```typescript
if (error?.status === 404) {
  // Ukrycie sekcji statystyk lub wyświetlenie komunikatu
  // Nie wyświetlanie błędów
  // Fallback do innych źródeł danych
}
```

### Błędy walidacji (400 Bad Request)

**Scenariusz:** Nieprawidłowe parametry query (np. nieprawidłowy `period`).

**Obsługa:**

- Wyświetlenie komunikatu: "Nieprawidłowe parametry. Używam domyślnych wartości."
- Automatyczne użycie domyślnych wartości (`period: "30d"`)
- Logowanie błędu w konsoli (tylko w development)

**Implementacja:**

```typescript
if (error?.status === 400) {
  // Wyświetlenie komunikatu
  // Automatyczne użycie domyślnych wartości
  // Logowanie błędu w development
}
```

### Przypadki brzegowe

1. **Brak fiszek (totalCards === 0):**
   - Wyświetlenie "0 fiszek" zamiast ukrycia karty
   - Zachęta do generowania pierwszej fiszki

2. **Brak fiszek do powtórki (dueToday === 0):**
   - Wyświetlenie "0 fiszek do powtórki" z komunikatem "Wszystkie fiszki są na bieżąco!"
   - Przycisk "Rozpocznij naukę" nieaktywny lub ukryty

3. **Dane częściowo dostępne:**
   - Wyświetlenie dostępnych danych
   - Ukrycie lub wyświetlenie "Niedostępne" dla brakujących danych

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury komponentów

1. Utworzenie katalogu `src/components/dashboard/` dla komponentów Dashboard
2. Utworzenie plików komponentów:
   - `src/components/dashboard/DashboardHero.tsx`
   - `src/components/dashboard/DashboardStats.tsx`
   - `src/components/dashboard/StatCard.tsx`
   - `src/components/dashboard/DashboardActions.tsx`
   - `src/components/dashboard/PrimaryActionButton.tsx`
   - `src/components/dashboard/DashboardAuthLinks.tsx`

### Krok 2: Implementacja hooka useAuth (jeśli nie istnieje)

1. Utworzenie store Zustand lub Context dla stanu autoryzacji
2. Implementacja hooka `useAuth()` w `src/lib/hooks/useAuth.ts`
3. Integracja z Supabase Auth SDK
4. Subskrypcja zmian stanu autoryzacji przez `onAuthStateChange`

### Krok 3: Implementacja klienta API dla statystyk

1. Utworzenie pliku `src/lib/api/statistics.api.ts`
2. Implementacja funkcji `fetchStatistics(period: TimePeriod)`
3. Integracja z centralnym klientem API (`src/lib/api/client.ts`)
4. Obsługa błędów i retry logic

### Krok 4: Implementacja custom hooka useDashboardStatistics

1. Utworzenie pliku `src/lib/hooks/useDashboardStatistics.ts`
2. Implementacja hooka używającego React Query
3. Konfiguracja query key, staleTime, retry
4. Obsługa warunkowego włączania query (tylko dla zalogowanych)

### Krok 5: Implementacja komponentu DashboardHero

1. Utworzenie komponentu `DashboardHero.tsx`
2. Dodanie nagłówka H1 z nazwą aplikacji
3. Dodanie opisu aplikacji
4. Stylowanie z użyciem Tailwind CSS
5. Testowanie responsywności

### Krok 6: Implementacja komponentu StatCard

1. Utworzenie komponentu `StatCard.tsx`
2. Użycie Shadcn/ui Card jako kontenera
3. Dodanie etykiety i wartości statystyki
4. Opcjonalnie: dodanie ikony i trendu
5. Stylowanie z użyciem Tailwind CSS

### Krok 7: Implementacja komponentu DashboardStats

1. Utworzenie komponentu `DashboardStats.tsx`
2. Integracja z hookiem `useDashboardStatistics`
3. Wyświetlenie kart statystyk używając `StatCard`
4. Dodanie skeleton loadera podczas ładowania
5. Obsługa błędów z wyświetleniem komunikatu
6. Warunkowy render tylko dla zalogowanych użytkowników

### Krok 8: Implementacja komponentu PrimaryActionButton

1. Utworzenie komponentu `PrimaryActionButton.tsx`
2. Użycie Shadcn/ui Button jako podstawy
3. Dodanie obsługi nawigacji (Astro Link lub React Router)
4. Dodanie stanu disabled
5. Opcjonalnie: dodanie ikony

### Krok 9: Implementacja komponentu DashboardActions

1. Utworzenie komponentu `DashboardActions.tsx`
2. Integracja z hookiem `useAuth()` do sprawdzenia stanu autoryzacji
3. Integracja z danymi statystyk do sprawdzenia `dueToday`
4. Wyświetlenie przycisków CTA używając `PrimaryActionButton`
5. Obsługa nawigacji do odpowiednich stron
6. Warunkowa aktywacja przycisku "Rozpocznij naukę" (tylko gdy `dueToday > 0`)

### Krok 10: Implementacja komponentu DashboardAuthLinks

1. Utworzenie komponentu `DashboardAuthLinks.tsx`
2. Dodanie linków do `/login` i `/register`
3. Stylowanie z użyciem Tailwind CSS
4. Warunkowy render tylko dla niezalogowanych użytkowników

### Krok 11: Integracja komponentów w widoku Dashboard

1. Edycja pliku `src/pages/index.astro`
2. Import wszystkich komponentów Dashboard
3. Użycie hooka `useAuth()` do sprawdzenia stanu autoryzacji
4. Warunkowy render komponentów w zależności od stanu autoryzacji
5. Dodanie providera React Query (jeśli nie jest w Layout)

### Krok 12: Stylowanie i responsywność

1. Stylowanie wszystkich komponentów z użyciem Tailwind CSS
2. Testowanie responsywności na różnych rozdzielczościach:
   - Mobile (< 768px): 1 kolumna dla kart, pełna szerokość przycisków
   - Tablet (768px - 1024px): 2 kolumny dla kart
   - Desktop (> 1024px): 3 kolumny dla kart
3. Sprawdzenie dostępności (a11y): aria-labels, focus indicators, semantyczne HTML

### Krok 13: Testowanie

1. Testowanie dla niezalogowanych użytkowników:
   - Wyświetlenie nagłówka i linków do logowania/rejestracji
   - Sprawdzenie czy przyciski CTA są nieaktywne lub przekierowują do logowania
2. Testowanie dla zalogowanych użytkowników:
   - Wyświetlenie statystyk (jeśli endpoint dostępny)
   - Sprawdzenie aktywności przycisków CTA
   - Sprawdzenie warunkowej aktywacji przycisku "Rozpocznij naukę"
3. Testowanie obsługi błędów:
   - Błąd 401: przekierowanie do logowania
   - Błąd 500: wyświetlenie komunikatu z możliwością ponowienia
   - Błąd sieciowy: wyświetlenie komunikatu
   - Endpoint 404: ukrycie sekcji statystyk lub wyświetlenie komunikatu
4. Testowanie responsywności na różnych urządzeniach
5. Testowanie dostępności (nawigacja klawiaturowa, czytniki ekranu)

### Krok 14: Optymalizacja i poprawki

1. Optymalizacja wydajności:
   - Lazy loading komponentów (jeśli potrzebne)
   - Memoization komponentów z React.memo (jeśli potrzebne)
   - Optymalizacja query React Query (staleTime, cacheTime)
2. Poprawki błędów znalezionych podczas testowania
3. Finalne sprawdzenie zgodności z PRD i wymaganiami UI

