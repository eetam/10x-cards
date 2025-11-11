# Architektura UI dla 10xCards

## 1. Przegląd struktury UI

Aplikacja 10xCards MVP wykorzystuje architekturę opartą na Astro 5 z React 19 dla komponentów interaktywnych. Interfejs użytkownika jest zorganizowany wokół głównych przepływów: autoryzacji, generowania fiszek przez AI, zarządzania fiszkami oraz sesji nauki z algorytmem FSRS.

Struktura UI jest zaprojektowana z myślą o:

- **Prostocie i intuicyjności** - minimalne kroki do osiągnięcia celów użytkownika
- **Responsywności** - mobile-first approach z adaptacją do większych ekranów
- **Dostępności** - pełna nawigacja klawiaturowa, semantyczne HTML, wsparcie dla czytników ekranu
- **Bezpieczeństwie** - ochrona routes przez middleware, walidacja po obu stronach, izolacja danych użytkownika

Aplikacja składa się z 8 głównych widoków, które obsługują wszystkie wymagania funkcjonalne z PRD oraz integrują się z endpointami API zgodnie z planem API.

## 2. Lista widoków

### 2.1. Ekran powitania (Dashboard)

- **Ścieżka:** `/`
- **Główny cel:** Punkt wejścia do aplikacji, prezentacja głównych funkcjonalności i szybki dostęp do kluczowych sekcji
- **Kluczowe informacje do wyświetlenia:**
  - Nazwa aplikacji i krótki opis funkcjonalności
  - Dla zalogowanych użytkowników: liczba fiszek w kolekcji, liczba fiszek do powtórki dzisiaj, ostatnia aktywność
  - Statystyki podstawowe (opcjonalnie, jeśli dostępne z API `/api/statistics`)
- **Kluczowe komponenty widoku:**
  - Nagłówek powitalny z logo aplikacji
  - Sekcja z opisem aplikacji
  - Przyciski CTA (Call-to-Action): "Generuj fiszki", "Moje fiszki", "Rozpocznij naukę"
  - Dla zalogowanych: karty z podsumowaniem (liczba fiszek, fiszki do powtórki)
  - Linki do logowania/rejestracji dla niezalogowanych użytkowników
- **UX, dostępność i względy bezpieczeństwa:**
  - Centrowany, minimalistyczny layout z odpowiednimi odstępami
  - Przyciski CTA powinny być wyraźnie widoczne i łatwo dostępne
  - Dla użytkowników niezalogowanych: wyraźne wskazanie potrzeby rejestracji/logowania
  - Dla zalogowanych: szybki dostęp do najczęściej używanych funkcji
  - Semantyczna struktura HTML z właściwą hierarchią nagłówków
  - Focus indicators dla nawigacji klawiaturowej
  - Strona publiczna, dostępna bez autoryzacji

### 2.2. Strona logowania

- **Ścieżka:** `/login`
- **Główny cel:** Uwierzytelnienie istniejącego użytkownika (FR-002)
- **Kluczowe informacje do wyświetlenia:**
  - Formularz logowania z polami email i hasło
  - Link do strony rejestracji
  - Informacja o możliwości przekierowania po zalogowaniu (jeśli parametr `redirect` w URL)
- **Kluczowe komponenty widoku:**
  - Formularz logowania (React Hook Form + Zod)
  - Pole email (Shadcn/ui Input type="email")
  - Pole hasło (Shadcn/ui Input type="password" z możliwością pokazania/ukrycia)
  - Przycisk "Zaloguj się" (Shadcn/ui Button)
  - Link "Nie masz konta? Zarejestruj się"
  - Komponenty do wyświetlania błędów walidacji (Shadcn/ui Alert lub Text z variant="destructive")
- **UX, dostępność i względy bezpieczeństwa:**
  - Centrowany layout, minimalistyczny design
  - Walidacja formatu email i minimalnej długości hasła (8 znaków) po stronie klienta
  - Inline errors pod odpowiednimi polami formularza
  - Obsługa błędów z API (nieprawidłowe dane logowania)
  - Automatyczne przekierowanie do ekranu powitania lub strony wskazanej w parametrze `redirect` po sukcesie
  - Dla już zalogowanych użytkowników: automatyczne przekierowanie do `/`
  - Pełna nawigacja klawiaturowa (Tab między polami, Enter do wysłania)
  - ARIA labels dla wszystkich pól formularza
  - Strona publiczna, ale z przekierowaniem dla zalogowanych

### 2.3. Strona rejestracji

- **Ścieżka:** `/register`
- **Główny cel:** Utworzenie nowego konta użytkownika (FR-001)
- **Kluczowe informacje do wyświetlenia:**
  - Formularz rejestracji z polami email, hasło, potwierdzenie hasła
  - Link do strony logowania
  - Informacja o wymaganiach dotyczących hasła
- **Kluczowe komponenty widoku:**
  - Formularz rejestracji (React Hook Form + Zod)
  - Pole email (Shadcn/ui Input type="email")
  - Pole hasło (Shadcn/ui Input type="password" z możliwością pokazania/ukrycia)
  - Pole potwierdzenie hasła (Shadcn/ui Input type="password")
  - Przycisk "Zarejestruj się" (Shadcn/ui Button)
  - Link "Masz już konto? Zaloguj się"
  - Komponenty do wyświetlania błędów walidacji
- **UX, dostępność i względy bezpieczeństwa:**
  - Centrowany layout, spójny z stroną logowania
  - Walidacja: format email, minimalna długość hasła (8 znaków), zgodność haseł
  - Inline errors pod odpowiednimi polami
  - Obsługa błędów z API (email już używany)
  - Po sukcesie: automatyczne logowanie i przekierowanie do ekranu powitania
  - Dla już zalogowanych użytkowników: automatyczne przekierowanie do `/`
  - Pełna nawigacja klawiaturowa
  - ARIA labels i role dla wszystkich elementów
  - Strona publiczna, ale z przekierowaniem dla zalogowanych

### 2.4. Generowanie fiszek

- **Ścieżka:** `/generate`
- **Główny cel:** Wklejenie tekstu i wygenerowanie propozycji fiszek przez AI (FR-005, FR-006, US-005)
- **Kluczowe informacje do wyświetlenia:**
  - Pole do wklejenia tekstu (textarea)
  - Licznik znaków w czasie rzeczywistym (1000-10000 znaków)
  - Status generowania (loading, success, error)
  - Informacje o procesie generowania (czas trwania, postęp)
- **Kluczowe komponenty widoku:**
  - Formularz generowania (React Hook Form + Zod)
  - Pole textarea (Shadcn/ui Textarea) z placeholderem wskazującym limit
  - Licznik znaków (wyświetlanie aktualnej liczby i limitu)
  - Przycisk "Generuj" (Shadcn/ui Button) z loading state
  - Progress indicator (Shadcn/ui Progress lub Loader) podczas generowania
  - Komponent do wyświetlania błędów (Shadcn/ui Alert)
  - Opcjonalnie: przycisk anulowania generowania (jeśli API wspiera)
- **UX, dostępność i względy bezpieczeństwa:**
  - Responsywny layout: pełna szerokość textarea na mobile, ograniczona z centrowaniem na desktop
  - Walidacja długości tekstu przed wysłaniem (1000-10000 znaków)
  - Wyświetlenie błędu inline jeśli walidacja nie spełniona
  - Podczas generowania: wyłączenie przycisku "Generuj", wyświetlenie progress indicator
  - Dla długich operacji (>5 sekund): dodatkowe informacje ("To może zająć do 30 sekund")
  - Po sukcesie: automatyczne przekierowanie do `/generations/{generationId}`
  - W przypadku błędu: komunikat błędu z możliwością ponowienia
  - Pełna nawigacja klawiaturowa
  - ARIA labels dla wszystkich elementów
  - Strona chroniona, wymaga autoryzacji

### 2.5. Przegląd propozycji fiszek

- **Ścieżka:** `/generations/[generationId]`
- **Główny cel:** Przeglądanie, akceptacja, edycja lub odrzucenie propozycji fiszek wygenerowanych przez AI (FR-007, FR-008, FR-009, US-006, US-007)
- **Kluczowe informacje do wyświetlenia:**
  - Lista wszystkich propozycji fiszek z generacji
  - Dla każdej propozycji: awers (front), rewers (back), wskaźnik confidence (jeśli dostępny)
  - Status każdej propozycji (niezaakceptowana, zaakceptowana, odrzucona, edytowana)
  - Licznik propozycji (całkowita liczba, liczba zaakceptowanych)
  - Informacje o generacji (data, model AI, czas trwania)
- **Kluczowe komponenty widoku:**
  - Nagłówek strony z informacjami o generacji
  - Licznik propozycji i przycisk "Zapisz wszystkie zaakceptowane" (aktywny gdy są zaakceptowane)
  - Lista propozycji w formie kart (Shadcn/ui Card)
  - Dla każdej karty:
    - Awers (front) - zawsze widoczny
    - Rewers (back) - z możliwością rozłożenia/zwinięcia
    - Wskaźnik confidence (opcjonalnie, jeśli dostępny)
    - Przyciski akcji: "Akceptuj" (variant="default"), "Edytuj" (variant="outline"), "Odrzuć" (variant="ghost" lub "destructive")
  - Modal edycji (Shadcn/ui Dialog) z formularzem edycji awersu i rewersu
  - Progress indicator podczas zapisywania zaakceptowanych fiszek
  - Toast notifications dla potwierdzeń i błędów
- **UX, dostępność i względy bezpieczeństwa:**
  - Wszystkie propozycje wyświetlane na raz (API zwraca wszystkie w jednej odpowiedzi)
  - Dla dużej liczby propozycji (>20): rozważyć wirtualizację listy dla lepszej wydajności
  - Zapamiętanie stanu rozwinięcia/zwinięcia rewersu w lokalnym stanie React
  - Przycisk "Edytuj" otwiera modal z formularzem edycji
  - Po zapisaniu zmian w modalu: propozycja automatycznie akceptowana
  - Przycisk "Zapisz wszystkie zaakceptowane": równoległe wysyłanie requestów (Promise.all), progress indicator
  - Po zapisaniu: toast z podsumowaniem, opcjonalne przekierowanie do `/flashcards`
  - W przypadku błędów: wyświetlenie które fiszki nie zostały zapisane, możliwość ponowienia
  - Optymistyczne aktualizacje UI dla lepszego UX
  - Pełna nawigacja klawiaturowa (Tab, Enter, Escape dla modala)
  - ARIA labels dla wszystkich interaktywnych elementów
  - Strona chroniona, wymaga autoryzacji
  - Weryfikacja, że generacja należy do zalogowanego użytkownika

### 2.6. Lista fiszek

- **Ścieżka:** `/flashcards`
- **Główny cel:** Przeglądanie, edycja i usuwanie wszystkich fiszek użytkownika (FR-011, FR-012, FR-013, US-009, US-010)
- **Kluczowe informacje do wyświetlenia:**
  - Lista wszystkich fiszek użytkownika z paginacją (25 na stronę)
  - Dla każdej fiszki: awers, rewers, źródło (source), data następnej powtórki (due), stan FSRS (state)
  - Informacje o paginacji (aktualna strona, całkowita liczba stron, całkowita liczba fiszek)
  - Aktywne filtry i sortowanie
- **Kluczowe komponenty widoku:**
  - Nagłówek strony z przyciskiem "Dodaj fiszkę" (otwiera modal)
  - Sekcja filtrów i sortowania:
    - Dropdown filtrowania po źródle (source): ai-full, ai-edited, manual (Shadcn/ui Select)
    - Dropdown filtrowania po stanie (state): new, learning, review, relearning (Shadcn/ui Select)
    - Dropdown sortowania: createdAt, updatedAt, due (Shadcn/ui Select)
    - Dropdown kierunku sortowania: asc, desc (Shadcn/ui Select)
  - Lista fiszek:
    - Na desktop: tabela (Shadcn/ui Table) z kolumnami: awers, rewers, źródło, data następnej powtórki, akcje
    - Na mobile: karty (Shadcn/ui Card) z podstawowymi informacjami i przyciskiem "Pokaż więcej"
  - Dla każdej fiszki: przyciski edycji i usunięcia
  - Paginacja (Shadcn/ui Pagination) z informacją o stronie ("Strona 1 z 5")
  - Modal dodawania/edycji fiszki (Shadcn/ui Dialog) z formularzem
  - AlertDialog potwierdzenia usunięcia (Shadcn/ui AlertDialog)
  - Toast notifications dla potwierdzeń i błędów
  - Skeleton loader podczas ładowania
- **UX, dostępność i względy bezpieczeństwa:**
  - Filtry i sortowanie synchronizowane z URL query params (`?page=1&limit=25&source=ai-full&sort=createdAt&order=desc`)
  - React Query do pobierania danych z automatycznym cache'owaniem
  - Modal dodawania/edycji: formularz z polami awers (max 200 znaków) i rewers (max 500 znaków), liczniki znaków
  - Walidacja: sprawdzenie czy pola nie są puste i czy nie przekraczają limitów
  - Dla edycji: wstępne wypełnienie pól danymi fiszki
  - Po zapisaniu: zamknięcie modala, odświeżenie listy (React Query invalidate), toast z potwierdzeniem
  - Usunięcie: AlertDialog z potwierdzeniem, optymistyczne usunięcie z UI, toast z możliwością undo
  - W przypadku błędu: przywrócenie fiszki i wyświetlenie błędu
  - Pełna nawigacja klawiaturowa
  - ARIA labels dla wszystkich elementów
  - Strona chroniona, wymaga autoryzacji
  - Weryfikacja, że wszystkie fiszki należą do zalogowanego użytkownika

### 2.7. Sesja nauki

- **Ścieżka:** `/study`
- **Główny cel:** Przeprowadzenie sesji nauki z fiszkami do powtórki na dziś z ocenianiem znajomości (FR-014, FR-015, FR-016, FR-017, US-011, US-012, US-013)
- **Kluczowe informacje do wyświetlenia:**
  - Aktualna fiszka (awers, następnie rewers po odkryciu)
  - Licznik postępu (np. "3 z 10")
  - Przyciski oceny znajomości (1=Again, 2=Hard, 3=Good, 4=Easy)
  - Informacje o sesji (czas trwania, liczba przejrzanych fiszek)
  - Na desktop: opcjonalny sidebar z postępem i listą fiszek w sesji
- **Kluczowe komponenty widoku:**
  - Pełnoekranowy widok nauki z minimalnym UI
  - Karta fiszki (Shadcn/ui Card) z awersem/rewersem
  - Przycisk "Odkryj odpowiedź" (jeśli rewers nie jest jeszcze widoczny)
  - Przyciski oceny (Shadcn/ui Button): "Again" (1), "Hard" (2), "Good" (3), "Easy" (4)
  - Licznik postępu (wyświetlanie aktualnej pozycji i całkowitej liczby)
  - Na desktop: sidebar z postępem i listą fiszek w sesji
  - Ekran podsumowania sesji po zakończeniu (liczba przejrzanych fiszek, czas trwania, statystyki)
  - Przycisk "Zakończ sesję" lub automatyczne przejście do podsumowania
  - Toast notifications dla potwierdzeń
- **UX, dostępność i względy bezpieczeństwa:**
  - Pełnoekranowy tryb nauki z minimalnym UI dla skupienia
  - Na mobile: większe przyciski oceny dla łatwiejszego dotknięcia
  - Na desktop: możliwość pokazania sidebaru z postępem
  - Automatyczne przejście do następnej fiszki po ocenie
  - Nawigacja klawiaturowa: klawisze 1-4 dla ocen, strzałki dla nawigacji między fiszkami, Escape dla zakończenia sesji
  - Po zakończeniu: ekran podsumowania z możliwością powrotu do ekranu powitania
  - Integracja z API: GET /api/study-session do pobrania fiszek, POST /api/study-session/review do oceny, POST /api/study-session/complete do zakończenia
  - Obsługa przypadku braku fiszek do powtórki (404 z API) - wyświetlenie komunikatu i przekierowanie
  - ARIA labels dla wszystkich elementów
  - Strona chroniona, wymaga autoryzacji
  - Implementacja na końcu projektu (może być nieaktywna w początkowych wersjach MVP)

### 2.8. Profil użytkownika (opcjonalny)

- **Ścieżka:** `/profile` (opcjonalna, może być dostępna przez menu użytkownika)
- **Główny cel:** Zarządzanie kontem użytkownika (FR-003, FR-004, US-003, US-004)
- **Kluczowe informacje do wyświetlenia:**
  - Email użytkownika
  - Formularz zmiany hasła (stare hasło, nowe hasło, potwierdzenie)
  - Sekcja usunięcia konta z potwierdzeniem
  - Opcjonalnie: statystyki użytkownika
- **Kluczowe komponenty widoku:**
  - Sekcja informacji o koncie (email)
  - Formularz zmiany hasła (React Hook Form + Zod)
  - AlertDialog potwierdzenia usunięcia konta (wymaga podania hasła)
  - Toast notifications dla potwierdzeń i błędów
- **UX, dostępność i względy bezpieczeństwa:**
  - Minimalistyczny layout z wyraźnym podziałem sekcji
  - Walidacja poprawności starego hasła przed zmianą
  - Potwierdzenie hasłem przed usunięciem konta
  - Po usunięciu konta: wylogowanie i przekierowanie do ekranu powitania
  - Pełna nawigacja klawiaturowa
  - ARIA labels dla wszystkich elementów
  - Strona chroniona, wymaga autoryzacji
  - Uwaga: Może być dostępna przez menu użytkownika w topbarze zamiast osobnej strony

## 3. Mapa podróży użytkownika

### 3.1. Przepływ dla nowego użytkownika

1. **Wejście do aplikacji** (`/`)
   - Użytkownik widzi ekran powitania z opisem aplikacji
   - Widzi przyciski CTA, ale są one nieaktywne lub przekierowują do logowania
   - Kliknięcie "Zaloguj się" lub "Zarejestruj się"

2. **Rejestracja** (`/register`)
   - Wypełnienie formularza rejestracji (email, hasło, potwierdzenie hasła)
   - Walidacja po stronie klienta
   - Po sukcesie: automatyczne logowanie i przekierowanie do ekranu powitania

3. **Ekran powitania (zalogowany)** (`/`)
   - Widzi podsumowanie (liczba fiszek: 0, fiszki do powtórki: 0)
   - Może wybrać: "Generuj fiszki" lub "Dodaj fiszkę ręcznie"

### 3.2. Przepływ generowania fiszek przez AI

1. **Ekran powitania** (`/`)
   - Kliknięcie "Generuj fiszki" → przekierowanie do `/generate`

2. **Generowanie fiszek** (`/generate`)
   - Wklejenie tekstu (1000-10000 znaków)
   - Kliknięcie "Generuj" → wyświetlenie progress indicator
   - Po sukcesie: automatyczne przekierowanie do `/generations/{generationId}`

3. **Przegląd propozycji** (`/generations/[generationId]`)
   - Przeglądanie listy propozycji fiszek
   - Dla każdej propozycji: akceptacja, edycja (w modalu) lub odrzucenie
   - Kliknięcie "Zapisz wszystkie zaakceptowane" → progress indicator → toast z podsumowaniem
   - Opcjonalne przekierowanie do `/flashcards` lub pozostanie na stronie

### 3.3. Przepływ ręcznego dodawania fiszek

1. **Lista fiszek** (`/flashcards`)
   - Kliknięcie "Dodaj fiszkę" → otwarcie modala z formularzem
   - Wypełnienie awersu (max 200 znaków) i rewersu (max 500 znaków)
   - Kliknięcie "Zapisz" → zamknięcie modala, odświeżenie listy, toast z potwierdzeniem

### 3.4. Przepływ zarządzania fiszkami

1. **Lista fiszek** (`/flashcards`)
   - Przeglądanie listy z możliwością filtrowania (source, state) i sortowania
   - Paginacja dla dużej liczby fiszek

2. **Edycja fiszki**
   - Kliknięcie przycisku "Edytuj" przy fiszce → otwarcie modala z wstępnie wypełnionymi polami
   - Modyfikacja awersu/rewersu
   - Kliknięcie "Zapisz" → zamknięcie modala, odświeżenie listy, toast z potwierdzeniem

3. **Usunięcie fiszki**
   - Kliknięcie przycisku "Usuń" → otwarcie AlertDialog z potwierdzeniem
   - Potwierdzenie → optymistyczne usunięcie z UI, wysłanie requestu DELETE
   - Toast z potwierdzeniem i możliwością undo

### 3.5. Przepływ sesji nauki

1. **Ekran powitania** (`/`)
   - Sprawdzenie liczby fiszek do powtórki (z API `/api/statistics` lub `/api/study-session`)
   - Jeśli są fiszki do powtórki: aktywny przycisk "Rozpocznij naukę"
   - Kliknięcie → przekierowanie do `/study`

2. **Sesja nauki** (`/study`)
   - Pobranie fiszek do powtórki (GET /api/study-session)
   - Wyświetlenie pierwszej fiszki (awers)
   - Kliknięcie "Odkryj odpowiedź" → wyświetlenie rewersu
   - Wybór oceny (1-4) → automatyczne przejście do następnej fiszki
   - Powtarzanie dla wszystkich fiszek w sesji

3. **Zakończenie sesji**
   - Po ostatniej fiszce: ekran podsumowania (liczba przejrzanych, czas trwania)
   - Wysłanie requestu POST /api/study-session/complete
   - Możliwość powrotu do ekranu powitania

### 3.6. Przepływ autoryzacji (ochrona routes)

1. **Próba dostępu do chronionej strony**
   - Middleware sprawdza obecność i ważność JWT tokena
   - Brak autoryzacji → przekierowanie do `/login?redirect=/docelowa-strona`

2. **Logowanie**
   - Wypełnienie formularza logowania
   - Po sukcesie: automatyczne przekierowanie do strony wskazanej w parametrze `redirect` lub do `/`

3. **Wylogowanie**
   - Kliknięcie "Wyloguj" w menu użytkownika
   - Wylogowanie przez Supabase Auth SDK
   - Przekierowanie do ekranu powitania

## 4. Układ i struktura nawigacji

### 4.1. Topbar (główna nawigacja)

**Komponenty:**

- Logo aplikacji (link do `/`)
- Główne linki nawigacyjne (widoczne na desktop >=768px):
  - "Dashboard" (link do `/`)
  - "Moje fiszki" (link do `/flashcards`)
  - "Generuj" (link do `/generate`)
  - "Nauka" (link do `/study`)
- Menu użytkownika (Shadcn/ui DropdownMenu):
  - Dla zalogowanych: email użytkownika, "Profil" (opcjonalnie), "Wyloguj"
  - Dla niezalogowanych: "Zaloguj się", "Zarejestruj się"

**Responsywność:**

- Na desktop (>=768px): zawsze widoczna nawigacja w topbarze
- Na mobile (<768px): hamburger menu (Shadcn/ui Sheet) z listą linków nawigacyjnych

**Dostępność:**

- Wszystkie linki z odpowiednimi aria-labels
- Highlight aktywnej sekcji w menu
- Logo zawsze widoczne i prowadzące do ekranu powitania
- Menu zamykane po kliknięciu linku na mobile

### 4.2. Layout aplikacji

**Struktura:**

- Wspólny layout Astro (`src/layouts/Layout.astro`) używany przez wszystkie strony z wyjątkiem login/register
- Layout zawiera:
  - Topbar z nawigacją
  - `<slot />` dla treści stron
  - Provider dla React Query
  - Provider dla Zustand/Context (globalny stan użytkownika)
  - Globalny provider toast (Shadcn/ui Toaster)

**Strony z własnym layoutem:**

- `/login` i `/register` mogą mieć własny minimalistyczny layout bez topbara

### 4.3. Sidebar (opcjonalny)

**Dla ekranów >1024px:**

- Opcjonalny sidebar jako dodatkowa nawigacja
- Może zawierać: szybki dostęp do sekcji, statystyki, ostatnie aktywności
- Szczegóły zawartości wymagają doprecyzowania (zgodnie z unresolved_issues)

### 4.4. Breadcrumbs (opcjonalne)

- Dla głębszych poziomów nawigacji (np. `/generations/[generationId]`) można rozważyć breadcrumbs
- Dla MVP: nie jest priorytetem, ale może poprawić UX

## 5. Kluczowe komponenty

### 5.1. Komponenty UI z Shadcn/ui

**Formularze:**

- **Button** - wszystkie przyciski akcji z różnymi wariantami (default, outline, ghost, destructive)
- **Input** - pola tekstowe (email, hasło)
- **Textarea** - pola wieloliniowe (tekst do generowania, rewers fiszki)
- **Form** - integracja z React Hook Form dla walidacji
- **Select** - dropdowny dla filtrów i sortowania
- **Label** - etykiety dla pól formularza

**Wyświetlanie danych:**

- **Card** - karty dla propozycji fiszek, listy fiszek na mobile, karty podsumowania
- **Table** - tabela dla listy fiszek na desktop
- **Pagination** - paginacja listy fiszek

**Dialogi i modale:**

- **Dialog** - modal edycji fiszki, modal dodawania fiszki
- **AlertDialog** - potwierdzenie usunięcia fiszki/konta
- **Sheet** - hamburger menu na mobile

**Powiadomienia:**

- **Toast** (Toaster) - powiadomienia o sukcesach, błędach, informacjach
- **Alert** - wyświetlanie błędów walidacji w formularzach

**Wskaźniki stanu:**

- **Progress** - wskaźnik postępu podczas generowania/zapisywania
- **Loader** (Skeleton) - wskaźniki ładowania, skeleton loaders dla list

### 5.2. Komponenty specyficzne dla aplikacji

**Komponenty fiszek:**

- **FlashcardCard** - karta wyświetlająca fiszkę (awers/rewers) z możliwością rozłożenia/zwinięcia
- **FlashcardList** - lista fiszek z różnymi layoutami dla mobile/desktop
- **FlashcardForm** - formularz dodawania/edycji fiszki (używany w modalu)

**Komponenty generowania:**

- **GenerationForm** - formularz wklejania tekstu do generowania
- **ProposalList** - lista propozycji fiszek z akcjami (akceptuj, edytuj, odrzuć)
- **ProposalCard** - karta pojedynczej propozycji z przyciskami akcji

**Komponenty sesji nauki:**

- **StudySession** - główny komponent sesji nauki
- **StudyCard** - karta fiszki w trybie nauki
- **StudyProgress** - wskaźnik postępu sesji
- **StudySummary** - ekran podsumowania sesji

**Komponenty nawigacji:**

- **Topbar** - główna nawigacja z logo i menu użytkownika
- **MobileMenu** - hamburger menu na mobile
- **UserMenu** - dropdown menu użytkownika

**Komponenty autoryzacji:**

- **LoginForm** - formularz logowania
- **RegisterForm** - formularz rejestracji
- **AuthGuard** - komponent ochrony routes (używany w middleware)

### 5.3. Komponenty pomocnicze

**Obsługa błędów:**

- **ErrorBoundary** - komponent do obsługi błędów React
- **ErrorDisplay** - wyświetlanie błędów z API z mapowaniem kodów HTTP na komunikaty

**Wskaźniki ładowania:**

- **LoadingSpinner** - spinner podczas ładowania
- **SkeletonLoader** - skeleton loaders dla list i kart

**Walidacja:**

- **FormField** - pole formularza z walidacją i wyświetlaniem błędów
- **CharacterCounter** - licznik znaków dla pól tekstowych

### 5.4. Hooks i utilities

**Custom hooks:**

- **useAuth()** - hook do zarządzania stanem użytkownika i sesją
- **useFlashcards()** - hook do pobierania i zarządzania fiszkami (React Query)
- **useGenerations()** - hook do pobierania i zarządzania generacjami (React Query)
- **useStudySession()** - hook do zarządzania sesją nauki (React Query)
- **useToast()** - hook do wyświetlania powiadomień toast

**Utilities:**

- **apiClient** - centralny klient API z automatycznym dołączaniem JWT tokena
- **errorMapper** - mapowanie kodów HTTP na komunikaty użytkownika
- **validation** - schematy Zod dla walidacji formularzy
- **dateUtils** - funkcje pomocnicze do formatowania dat

### 5.5. Stores (Zustand/Context)

**Auth Store:**

- Stan użytkownika (user object z Supabase)
- Loading state
- Error state
- Metody: login, logout, refreshSession

**UI Store (opcjonalny):**

- Stan modali (otwarte/zamknięte)
- Stan sidebaru (otwarty/zamknięty)
- Preferencje użytkownika (theme, layout)

## 6. Mapowanie wymagań funkcjonalnych na elementy UI

### 6.1. Zarządzanie kontem użytkownika

- **FR-001 (Rejestracja)**: Strona `/register` z formularzem rejestracji
- **FR-002 (Logowanie)**: Strona `/login` z formularzem logowania
- **FR-003 (Zmiana hasła)**: Sekcja w profilu użytkownika (`/profile` lub menu użytkownika)
- **FR-004 (Usunięcie konta)**: Sekcja w profilu użytkownika z AlertDialog potwierdzenia

### 6.2. Generowanie fiszek przez AI

- **FR-005 (Wklejanie tekstu)**: Strona `/generate` z textarea
- **FR-006 (Analiza przez AI)**: Integracja z API POST /api/generations, wyświetlenie progress indicator
- **FR-007 (Interfejs przeglądu)**: Strona `/generations/[generationId]` z listą propozycji
- **FR-008 (Opcje akcji)**: Przyciski "Akceptuj", "Edytuj", "Odrzuć" w każdej karcie propozycji
- **FR-009 (Zapisywanie)**: Przycisk "Zapisz wszystkie zaakceptowane" z integracją POST /api/flashcards

### 6.3. Manualne zarządzanie fiszkami

- **FR-010 (Formularz dodawania)**: Modal z formularzem w liście fiszek (`/flashcards`)
- **FR-011 (Widok listy)**: Strona `/flashcards` z listą wszystkich fiszek
- **FR-012 (Paginacja)**: Komponent Pagination z 25 fiszkami na stronę
- **FR-013 (Edycja i usuwanie)**: Przyciski edycji (modal) i usunięcia (AlertDialog) w każdej fiszce

### 6.4. System nauki (Spaced Repetition)

- **FR-014 (Widok sesji)**: Strona `/study` z pełnoekranowym trybem nauki
- **FR-015 (Integracja FSRS)**: Integracja z API GET /api/study-session i POST /api/study-session/review
- **FR-016 (Przygotowanie sesji)**: Automatyczne pobranie fiszek do powtórki z API
- **FR-017 (Ocenianie)**: Przyciski oceny (1-4) w widoku sesji nauki

## 7. Mapowanie historyjek użytkownika na widoki

### 7.1. Zarządzanie kontem

- **US-001 (Rejestracja)**: Strona `/register` z formularzem i walidacją
- **US-002 (Logowanie)**: Strona `/login` z formularzem i obsługą błędów
- **US-003 (Zmiana hasła)**: Sekcja w profilu użytkownika z formularzem i walidacją starego hasła
- **US-004 (Usunięcie konta)**: Sekcja w profilu z AlertDialog wymagającym potwierdzenia hasłem

### 7.2. Proces generowania i zarządzania fiszkami

- **US-005 (Generowanie propozycji)**: Strona `/generate` z textarea, licznikiem znaków, przyciskiem "Generuj" i progress indicator
- **US-006 (Przeglądanie i akceptacja)**: Strona `/generations/[generationId]` z listą propozycji i przyciskami akcji
- **US-007 (Edycja propozycji)**: Modal edycji w widoku propozycji z formularzem awersu/rewersu
- **US-008 (Ręczne tworzenie)**: Modal z formularzem w liście fiszek (`/flashcards`)
- **US-009 (Przeglądanie kolekcji)**: Strona `/flashcards` z listą, paginacją i informacjami o fiszkach
- **US-010 (Edycja i usuwanie)**: Przyciski edycji (modal) i usunięcia (AlertDialog) w liście fiszek

### 7.3. Sesja nauki

- **US-011 (Rozpoczęcie sesji)**: Przycisk "Rozpocznij naukę" na ekranie powitania, przekierowanie do `/study`
- **US-012 (Ocenianie znajomości)**: Przyciski oceny (1-4) w widoku sesji nauki z automatycznym przejściem do następnej fiszki
- **US-013 (Zakończenie sesji)**: Ekran podsumowania po ostatniej fiszce z możliwością powrotu do panelu głównego

## 8. Rozwiązanie punktów bólu użytkownika

### 8.1. Problem: Ręczne tworzenie fiszek jest czasochłonne

**Rozwiązanie w UI:**

- Główny przepływ przez generowanie AI (`/generate` → `/generations/[generationId]`)
- Duże, wyraźne przyciski CTA na ekranie powitania prowadzące do generowania
- Prosty formularz wklejania tekstu z automatycznym wykrywaniem języka przez AI
- Szybki proces akceptacji/edycji propozycji z możliwością masowego zapisywania

### 8.2. Problem: Trudność w zarządzaniu dużą liczbą fiszek

**Rozwiązanie w UI:**

- Lista fiszek z filtrowaniem (source, state) i sortowaniem (createdAt, updatedAt, due)
- Paginacja z synchronizacją URL query params dla możliwości udostępnienia linku
- Różne layouty dla mobile (karty) i desktop (tabela) dla lepszej czytelności
- Szybka edycja przez modal bez opuszczania listy
- Optymistyczne aktualizacje UI dla natychmiastowego feedbacku

### 8.3. Problem: Brak motywacji do regularnej nauki

**Rozwiązanie w UI:**

- Wyświetlenie liczby fiszek do powtórki na ekranie powitania
- Przycisk "Rozpocznij naukę" aktywny tylko gdy są fiszki do powtórki
- Pełnoekranowy tryb nauki z minimalnym UI dla skupienia
- Ekran podsumowania sesji z statystykami dla motywacji
- Opcjonalnie: statystyki użytkownika (streak, accuracy) na ekranie powitania

### 8.4. Problem: Niepewność co do jakości wygenerowanych fiszek

**Rozwiązanie w UI:**

- Wskaźnik confidence dla każdej propozycji (jeśli dostępny z API)
- Możliwość edycji każdej propozycji przed zapisaniem
- Możliwość odrzucenia nieodpowiednich propozycji
- Podgląd awersu i rewersu przed akceptacją

### 8.5. Problem: Trudność w nawigacji między sekcjami

**Rozwiązanie w UI:**

- Zawsze widoczny topbar z głównymi linkami nawigacyjnymi (desktop)
- Hamburger menu na mobile z wszystkimi sekcjami
- Logo prowadzące do ekranu powitania z każdego miejsca
- Highlight aktywnej sekcji w menu
- Breadcrumbs dla głębszych poziomów (opcjonalnie)

## 9. Obsługa przypadków brzegowych i błędów

### 9.1. Przypadki brzegowe

**Brak fiszek:**

- Ekran powitania: wyświetlenie "0 fiszek" z zachętą do generowania
- Lista fiszek: komunikat "Nie masz jeszcze żadnych fiszek" z przyciskiem "Dodaj pierwszą fiszkę"
- Sesja nauki: komunikat "Brak fiszek do powtórki" z przekierowaniem do ekranu powitania

**Brak fiszek do powtórki:**

- Przycisk "Rozpocznij naukę" nieaktywny lub ukryty
- Komunikat na ekranie powitania: "Wszystkie fiszki są na bieżąco!"

**Duża liczba propozycji:**

- Rozważenie wirtualizacji listy dla >20 propozycji
- Dla MVP: zwykła lista z możliwością scrollowania

**Długie operacje:**

- Progress indicator dla generowania AI (>5 sekund: dodatkowe informacje)
- Progress indicator dla zapisywania wielu fiszek
- Możliwość anulowania (jeśli API wspiera)

**Pusta kolekcja po filtrowaniu:**

- Komunikat "Brak fiszek spełniających kryteria" z sugestią zmiany filtrów

### 9.2. Obsługa błędów

**Błędy walidacji (400):**

- Wyświetlenie szczegółów walidacji w formularzu (Shadcn/ui Alert)
- Inline errors pod odpowiednimi polami
- Mapowanie błędów API na pola formularza

**Błędy autoryzacji (401):**

- Przekierowanie do `/login` z parametrem `redirect`
- Toast z komunikatem "Sesja wygasła. Zaloguj się ponownie."

**Błędy nie znaleziono (404):**

- Komunikat "Nie znaleziono" z przyciskiem powrotu
- Dla fiszek/generacji: weryfikacja, że zasób należy do użytkownika

**Błędy konfliktu (409):**

- Komunikat o duplikacie fiszki z sugestią edycji istniejącej
- Toast z możliwością przejścia do istniejącej fiszki

**Błędy serwera (500):**

- Ogólny komunikat błędu z możliwością ponowienia
- Toast z komunikatem "Wystąpił błąd. Spróbuj ponownie."

**Rate limiting (429):**

- Komunikat "Zbyt wiele requestów. Spróbuj za chwilę."
- Automatyczne ponowienie po określonym czasie (opcjonalnie)

**Błędy sieciowe:**

- Komunikat "Brak połączenia z internetem"
- Retry logic w kliencie API
- Możliwość ponowienia przez użytkownika

## 10. Zgodność z planem API

### 10.1. Endpointy generacji

- **POST /api/generations**: Używany w `/generate` do generowania propozycji
- **GET /api/generations/{generationId}**: Używany w `/generations/[generationId]` do pobrania szczegółów generacji
- **GET /api/generations**: Może być używany do wyświetlenia historii generacji (opcjonalnie)

### 10.2. Endpointy fiszek

- **POST /api/flashcards**: Używany do tworzenia fiszek (ręcznie lub z propozycji)
- **GET /api/flashcards**: Używany w `/flashcards` do pobrania listy z paginacją, filtrowaniem i sortowaniem
- **GET /api/flashcards/{flashcardId}**: Używany do pobrania szczegółów fiszki przed edycją
- **PUT /api/flashcards/{flashcardId}**: Używany do aktualizacji fiszki w modalu edycji
- **DELETE /api/flashcards/{flashcardId}**: Używany do usunięcia fiszki z potwierdzeniem

### 10.3. Endpointy sesji nauki

- **GET /api/study-session**: Używany w `/study` do pobrania fiszek do powtórki
- **POST /api/study-session/review**: Używany do przesłania oceny fiszki
- **POST /api/study-session/complete**: Używany do zakończenia sesji nauki

### 10.4. Endpointy statystyk

- **GET /api/statistics**: Może być używany na ekranie powitania do wyświetlenia podsumowania (opcjonalnie)

### 10.5. Autoryzacja

- Wszystkie endpointy wymagają JWT tokena w headerze Authorization
- Token automatycznie dołączany przez klienta API z Supabase Auth
- Middleware Astro sprawdza autoryzację przed renderowaniem stron

## 11. Podsumowanie

Architektura UI dla 10xCards MVP została zaprojektowana w sposób kompleksowy, uwzględniający wszystkie wymagania funkcjonalne z PRD, możliwości API oraz decyzje z sesji planowania. Struktura oparta na 8 głównych widokach zapewnia intuicyjną nawigację i efektywne przepływy użytkownika dla wszystkich kluczowych funkcjonalności: autoryzacji, generowania fiszek przez AI, zarządzania fiszkami oraz sesji nauki.

Kluczowe aspekty architektury:

- **Prostota**: Minimalne kroki do osiągnięcia celów użytkownika
- **Responsywność**: Mobile-first approach z adaptacją do większych ekranów
- **Dostępność**: Pełna nawigacja klawiaturowa, semantyczne HTML, wsparcie dla czytników ekranu
- **Bezpieczeństwo**: Ochrona routes, walidacja po obu stronach, izolacja danych
- **Wydajność**: React Query dla cache'owania, optymistyczne aktualizacje, skeleton loaders
- **UX**: Toast notifications, progress indicators, możliwość cofnięcia operacji, synchronizacja stanu z URL

Architektura jest gotowa do implementacji i zapewnia solidne fundamenty dla rozwoju aplikacji poza MVP.
