# Plan Testów - 10xCards

## 1. Wprowadzenie i Cele Testowania

### 1.1. Cel Dokumentu

Niniejszy dokument definiuje kompleksową strategię testowania aplikacji 10xCards - platformy do generowania fiszek edukacyjnych z wykorzystaniem AI i metody powtórek interwałowych (spaced repetition).

### 1.2. Cele Testowania

- **Zapewnienie jakości funkcjonalnej**: Weryfikacja, że wszystkie wymagania z PRD są poprawnie zaimplementowane
- **Zapewnienie bezpieczeństwa**: Weryfikacja ochrony danych użytkownika i autentykacji
- **Zapewnienie wydajności**: Weryfikacja, że aplikacja działa wydajnie przy typowych obciążeniach
- **Zapewnienie niezawodności**: Weryfikacja stabilności aplikacji w różnych scenariuszach
- **Wsparcie metryk sukcesu**: MS-01 (75% akceptacji fiszek AI) i MS-02 (75% fiszek tworzonych przez AI)

### 1.3. Zakres Dokumentu

Plan testów obejmuje:

- Testy jednostkowe (Unit Tests)
- Testy integracyjne (Integration Tests)
- Testy end-to-end (E2E Tests)
- Testy bezpieczeństwa (Security Tests)
- Testy wydajnościowe (Performance Tests)
- Testy użyteczności (Usability Tests)

## 2. Zakres Testów

### 2.1. Funkcjonalności w Zakresie Testowania

#### 2.1.1. Zarządzanie Kontem Użytkownika (FR-001 do FR-004)

- ✅ Rejestracja konta przez e-mail/hasło
- ✅ Logowanie na konto
- ✅ Wylogowanie
- ✅ Zmiana hasła
- ✅ Usunięcie konta i wszystkich danych
- ✅ Sesja użytkownika (persystencja, timeout)

#### 2.1.2. Generowanie Fiszek przez AI (FR-005 do FR-009)

- ✅ Wklejanie tekstu (walidacja długości: 1000-10000 znaków)
- ✅ Analiza tekstu przez AI i generowanie propozycji fiszek
- ✅ Interfejs przeglądu propozycji fiszek
- ✅ Akceptacja propozycji fiszek
- ✅ Edycja propozycji fiszek przed zapisaniem
- ✅ Odrzucenie propozycji fiszek
- ✅ Zapisywanie zaakceptowanych fiszek
- ✅ Wykrywanie języka tekstu źródłowego

#### 2.1.3. Manualne Zarządzanie Fiszkami (FR-010 do FR-013)

- ✅ Ręczne dodawanie fiszek (formularz)
- ✅ Wyświetlanie listy wszystkich fiszek użytkownika
- ✅ Paginacja listy fiszek (25 na stronę)
- ✅ Edycja fiszek
- ✅ Usuwanie fiszek (z potwierdzeniem)
- ✅ Filtrowanie fiszek (po źródle, stanie)
- ✅ Sortowanie fiszek

#### 2.1.4. System Nauki - Spaced Repetition (FR-014 do FR-015)

- ✅ Widok "Sesja nauki"
- ✅ Integracja z algorytmem FSRS
- ✅ Wyświetlanie fiszek do powtórki
- ✅ System oceniania fiszek (1-4)
- ✅ Aktualizacja stanu fiszek po ocenie
- ✅ Podsumowanie sesji nauki
- ✅ Statystyki nauki (fiszki do powtórki dzisiaj)

#### 2.1.5. Dashboard i Statystyki

- ✅ Wyświetlanie statystyk użytkownika
- ✅ Liczba wszystkich fiszek
- ✅ Liczba fiszek do powtórki dzisiaj
- ✅ Liczba wygenerowanych propozycji
- ✅ Liczba fiszek przestudiowanych dzisiaj

### 2.2. Funkcjonalności poza Zakresem Testowania MVP

- ❌ Import plików (PDF, DOCX)
- ❌ Udostępnianie zestawów fiszek
- ❌ Integracje z platformami zewnętrznymi
- ❌ Aplikacje mobilne
- ❌ Wiele decków

## 3. Typy Testów do Przeprowadzenia

### 3.1. Testy Jednostkowe (Unit Tests)

**Narzędzie**: Vitest  
**Pokrycie**: Funkcje utility, serwisy, komponenty logiki biznesowej

**Obszary testowania**:

- `src/lib/utils/` - funkcje pomocnicze (auth.utils, text.utils, response.utils, fsrs.utils)
- `src/lib/services/` - serwisy biznesowe (FlashcardService, GenerationService, StudyService, OpenRouterClient)
- `src/lib/validation/` - schematy walidacji (Zod schemas)
- Funkcje pomocnicze w komponentach React

**Kryteria pokrycia**: Minimum 80% pokrycia kodu dla modułów krytycznych

### 3.2. Testy Integracyjne (Integration Tests)

**Narzędzie**: Vitest z mockami Supabase  
**Pokrycie**: Integracja między modułami, komunikacja z API

**Obszary testowania**:

- Integracja serwisów z bazą danych (Supabase)
- Integracja z OpenRouter API (z mockami)
- Integracja middleware z endpointami API
- Integracja komponentów React z API client
- Integracja FSRS z bazą danych

### 3.3. Testy End-to-End (E2E Tests)

**Narzędzie**: Playwright  
**Pokrycie**: Pełne przepływy użytkownika

**Obszary testowania**:

- Przepływ rejestracji i logowania
- Przepływ generowania fiszek przez AI
- Przepływ przeglądu i akceptacji propozycji
- Przepływ ręcznego tworzenia fiszek
- Przepływ sesji nauki
- Przepływ zarządzania fiszkami (edycja, usuwanie)

**Środowisko**: Dedykowana baza testowa Supabase Cloud

### 3.4. Testy Bezpieczeństwa (Security Tests)

**Narzędzie**: Manual + Playwright  
**Pokrycie**: Autentykacja, autoryzacja, ochrona danych

**Obszary testowania**:

- Ochrona tras przez middleware
- Weryfikacja tokenów JWT
- Row Level Security (RLS) w Supabase
- Izolacja danych użytkownika
- Walidacja danych wejściowych (XSS, SQL Injection)
- Ochrona przed CSRF
- Bezpieczne przechowywanie haseł

### 3.5. Testy Wydajnościowe (Performance Tests)

**Narzędzie**: Playwright + Lighthouse CI  
**Pokrycie**: Czas odpowiedzi, obciążenie

**Obszary testowania**:

- Czas odpowiedzi API endpoints (< 2s dla większości)
- Czas generowania fiszek przez AI (< 30s)
- Czas ładowania stron (< 3s)
- Wydajność przy dużej liczbie fiszek (1000+)
- Wydajność sesji nauki z dużą liczbą fiszek do powtórki

### 3.6. Testy Użyteczności (Usability Tests)

**Narzędzie**: Manual testing  
**Pokrycie**: UX, dostępność, responsywność

**Obszary testowania**:

- Responsywność na różnych urządzeniach
- Dostępność (WCAG 2.1 Level AA)
- Nawigacja klawiaturowa
- Komunikaty błędów i sukcesu
- Intuicyjność interfejsu

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1. Autentykacja Użytkownika

#### TC-AUTH-001: Rejestracja Nowego Użytkownika

**Priorytet**: Wysoki  
**Typ**: E2E

**Kroki**:

1. Użytkownik otwiera stronę `/register`
2. Wypełnia formularz: email, hasło, potwierdzenie hasła
3. Kliknie "Zarejestruj się"
4. System weryfikuje dane i tworzy konto
5. Użytkownik jest automatycznie zalogowany
6. Użytkownik jest przekierowany na dashboard

**Oczekiwany rezultat**: Konto zostaje utworzone, użytkownik jest zalogowany

**Warunki brzegowe**:

- Email już istnieje → błąd walidacji
- Hasło za słabe → błąd walidacji
- Hasła nie pasują → błąd walidacji

#### TC-AUTH-002: Logowanie Użytkownika

**Priorytet**: Wysoki  
**Typ**: E2E

**Kroki**:

1. Użytkownik otwiera stronę `/login`
2. Wprowadza email i hasło
3. Kliknie "Zaloguj się"
4. System weryfikuje dane
5. Użytkownik jest zalogowany
6. Użytkownik jest przekierowany na dashboard

**Oczekiwany rezultat**: Użytkownik jest zalogowany, sesja jest utworzona

**Warunki brzegowe**:

- Nieprawidłowe dane → błąd autentykacji
- Konto nie istnieje → błąd autentykacji

#### TC-AUTH-003: Zmiana Hasła

**Priorytet**: Średni  
**Typ**: E2E

**Kroki**:

1. Zalogowany użytkownik przechodzi do `/settings`
2. Wypełnia formularz zmiany hasła (obecne hasło, nowe hasło)
3. Kliknie "Zmień hasło"
4. System weryfikuje obecne hasło
5. System aktualizuje hasło

**Oczekiwany rezultat**: Hasło zostaje zmienione

**Warunki brzegowe**:

- Nieprawidłowe obecne hasło → błąd
- Nowe hasło za słabe → błąd walidacji

#### TC-AUTH-004: Usunięcie Konta

**Priorytet**: Wysoki  
**Typ**: E2E

**Kroki**:

1. Zalogowany użytkownik przechodzi do `/settings`
2. Kliknie "Usuń konto"
3. Potwierdza usunięcie (wprowadza hasło)
4. System weryfikuje hasło
5. System usuwa konto i wszystkie dane użytkownika

**Oczekiwany rezultat**: Konto i wszystkie dane są usunięte

**Warunki brzegowe**:

- Nieprawidłowe hasło → błąd
- Brak potwierdzenia → operacja anulowana

### 4.2. Generowanie Fiszek przez AI

#### TC-GEN-001: Generowanie Propozycji Fiszek z Prawidłowego Tekstu

**Priorytet**: Krytyczny  
**Typ**: E2E

**Kroki**:

1. Zalogowany użytkownik przechodzi do `/generate`
2. Wkleja tekst źródłowy (1000-10000 znaków)
3. Kliknie "Generuj fiszki"
4. System wysyła żądanie do OpenRouter API
5. System otrzymuje propozycje fiszek
6. Użytkownik jest przekierowany na `/generations/[id]`
7. Wyświetlane są propozycje fiszek

**Oczekiwany rezultat**: Propozycje fiszek są wygenerowane i wyświetlone

**Warunki brzegowe**:

- Tekst za krótki (< 1000 znaków) → błąd walidacji
- Tekst za długi (> 10000 znaków) → błąd walidacji
- Błąd API → komunikat błędu

#### TC-GEN-002: Akceptacja Propozycji Fiszek

**Priorytet**: Krytyczny  
**Typ**: E2E

**Kroki**:

1. Użytkownik przegląda propozycje fiszek
2. Kliknie "Akceptuj" na wybranych propozycjach
3. Kliknie "Zapisz wszystkie zaakceptowane"
4. System zapisuje zaakceptowane fiszki do bazy danych
5. Użytkownik jest przekierowany na `/flashcards`

**Oczekiwany rezultat**: Zaakceptowane fiszki są zapisane

**Warunki brzegowe**:

- Brak zaakceptowanych fiszek → przycisk nieaktywny
- Błąd zapisu → komunikat błędu

#### TC-GEN-003: Edycja Propozycji Fiszki przed Zapisaniem

**Priorytet**: Wysoki  
**Typ**: E2E

**Kroki**:

1. Użytkownik przegląda propozycje fiszek
2. Kliknie "Edytuj" na wybranej propozycji
3. Modyfikuje treść pytania lub odpowiedzi
4. Kliknie "Zapisz"
5. Propozycja jest oznaczona jako "Edytowana"
6. Po zapisaniu wszystkich, edytowana fiszka jest zapisana z modyfikacjami

**Oczekiwany rezultat**: Edytowana fiszka jest zapisana z modyfikacjami

#### TC-GEN-004: Odrzucenie Propozycji Fiszek

**Priorytet**: Średni  
**Typ**: E2E

**Kroki**:

1. Użytkownik przegląda propozycje fiszek
2. Kliknie "Odrzuć" na wybranych propozycjach
3. Propozycje są oznaczone jako odrzucone
4. Po zapisaniu, odrzucone propozycje nie są zapisywane

**Oczekiwany rezultat**: Odrzucone propozycje nie są zapisywane

### 4.3. Manualne Zarządzanie Fiszkami

#### TC-FLASH-001: Ręczne Tworzenie Fiszki

**Priorytet**: Wysoki  
**Typ**: E2E

**Kroki**:

1. Zalogowany użytkownik przechodzi do `/flashcards`
2. Kliknie "Dodaj fiszkę"
3. Wypełnia formularz: pytanie, odpowiedź, opcjonalnie źródło
4. Kliknie "Zapisz"
5. System zapisuje fiszkę do bazy danych
6. Fiszka pojawia się na liście

**Oczekiwany rezultat**: Fiszka jest utworzona i widoczna na liście

**Warunki brzegowe**:

- Puste pola wymagane → błąd walidacji
- Zbyt długi tekst → błąd walidacji

#### TC-FLASH-002: Wyświetlanie Listy Fiszek z Paginacją

**Priorytet**: Wysoki  
**Typ**: E2E

**Kroki**:

1. Użytkownik przechodzi do `/flashcards`
2. System wyświetla pierwsze 25 fiszek
3. Użytkownik klika "Następna strona"
4. System wyświetla kolejne 25 fiszek

**Oczekiwany rezultat**: Paginacja działa poprawnie

**Warunki brzegowe**:

- Mniej niż 25 fiszek → brak paginacji
- Dokładnie 25 fiszek → brak przycisku "Następna"

#### TC-FLASH-003: Edycja Fiszki

**Priorytet**: Wysoki  
**Typ**: E2E

**Kroki**:

1. Użytkownik otwiera listę fiszek
2. Kliknie "Edytuj" na wybranej fiszce
3. Modyfikuje treść
4. Kliknie "Zapisz"
5. System aktualizuje fiszkę w bazie danych
6. Zmiany są widoczne na liście

**Oczekiwany rezultat**: Fiszka jest zaktualizowana

#### TC-FLASH-004: Usuwanie Fiszki

**Priorytet**: Wysoki  
**Typ**: E2E

**Kroki**:

1. Użytkownik otwiera listę fiszek
2. Kliknie "Usuń" na wybranej fiszce
3. Potwierdza usunięcie w dialogu
4. System usuwa fiszkę z bazy danych
5. Fiszka znika z listy

**Oczekiwany rezultat**: Fiszka jest usunięta

**Warunki brzegowe**:

- Anulowanie potwierdzenia → fiszka pozostaje

### 4.4. System Nauki - Spaced Repetition

#### TC-STUDY-001: Rozpoczęcie Sesji Nauki

**Priorytet**: Krytyczny  
**Typ**: E2E

**Kroki**:

1. Zalogowany użytkownik przechodzi do `/study`
2. System pobiera fiszki do powtórki (due <= now)
3. Wyświetla pierwszą fiszkę
4. Pokazuje postęp sesji

**Oczekiwany rezultat**: Sesja nauki rozpoczyna się z fiszkami do powtórki

**Warunki brzegowe**:

- Brak fiszek do powtórki → komunikat "Brak fiszek do powtórki"
- Wszystkie fiszki przestudiowane → komunikat sukcesu

#### TC-STUDY-002: Ocena Fiszki podczas Sesji

**Priorytet**: Krytyczny  
**Typ**: E2E

**Kroki**:

1. Użytkownik widzi fiszkę (pytanie)
2. Kliknie "Pokaż odpowiedź"
3. Wybiera ocenę (1-4)
4. System aktualizuje stan fiszki zgodnie z FSRS
5. Wyświetlana jest następna fiszka

**Oczekiwany rezultat**: Fiszka jest oceniona, stan jest zaktualizowany

#### TC-STUDY-003: Zakończenie Sesji Nauki

**Priorytet**: Wysoki  
**Typ**: E2E

**Kroki**:

1. Użytkownik ocenia wszystkie fiszki w sesji
2. System wyświetla podsumowanie sesji
3. Pokazuje statystyki (liczba ocenionych, średnia ocena)
4. Użytkownik może wrócić do dashboardu

**Oczekiwany rezultat**: Sesja jest zakończona, podsumowanie wyświetlone

### 4.5. Dashboard i Statystyki

#### TC-DASH-001: Wyświetlanie Statystyk

**Priorytet**: Średni  
**Typ**: E2E

**Kroki**:

1. Zalogowany użytkownik przechodzi do `/`
2. System pobiera statystyki z API
3. Wyświetla karty ze statystykami:
   - Liczba wszystkich fiszek
   - Liczba fiszek do powtórki dzisiaj
   - Liczba wygenerowanych propozycji
   - Liczba fiszek przestudiowanych dzisiaj

**Oczekiwany rezultat**: Statystyki są wyświetlone poprawnie

**Warunki brzegowe**:

- Brak danych → wyświetlenie 0

## 5. Środowisko Testowe

### 5.1. Środowiska Testowe

#### 5.1.1. Środowisko Lokalne (Development)

- **Baza danych**: Supabase Local (Docker) lub Supabase Cloud (test project)
- **API**: OpenRouter Mock Mode (`OPENROUTER_USE_MOCK=true`)
- **Port**: 4321
- **Użycie**: Testy jednostkowe, integracyjne, szybkie testy E2E

#### 5.1.2. Środowisko Testowe (Staging)

- **Baza danych**: Dedykowany projekt Supabase Cloud
- **API**: OpenRouter Mock Mode lub rzeczywiste API (z limitami)
- **URL**: `https://staging.10xcards.com` (przykładowy)
- **Użycie**: Pełne testy E2E, testy integracyjne

#### 5.1.3. Środowisko Produkcyjne (Production)

- **Baza danych**: Produkcyjny projekt Supabase Cloud
- **API**: Rzeczywiste OpenRouter API
- **URL**: `https://10xcards.com` (przykładowy)
- **Użycie**: Testy smoke, testy regresyjne przed release

### 5.2. Konfiguracja Środowiska Testowego

#### 5.2.1. Zmienne Środowiskowe dla Testów

Plik `.env.test`:

```env
SUPABASE_URL=https://test-project.supabase.co
PUBLIC_SUPABASE_KEY=test-anon-key
SUPABASE_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
E2E_USERNAME=test@example.com
E2E_PASSWORD=test-password
E2E_USERNAME_ID=test-user-uuid
OPENROUTER_USE_MOCK=true
OPENROUTER_API_KEY=test-key
SUPABASE_ACCESS_TOKEN=test-access-token
```

#### 5.2.2. Setup Bazy Danych Testowej

- Automatyczne migracje przed testami (`e2e/global-setup.ts`)
- Automatyczne czyszczenie danych po testach (`e2e/global-teardown.ts`)
- Dedykowany użytkownik testowy

### 5.3. Dane Testowe

- Przykładowe teksty źródłowe (JavaScript, Python) w `e2e/helpers/test-data.ts`
- Mock responses dla OpenRouter API
- Predefiniowane fiszki testowe

## 6. Narzędzia do Testowania

### 6.1. Testy Jednostkowe i Integracyjne

- **Vitest** (v3.2.4) - framework testowy
- **@vitest/ui** - interfejs graficzny
- **React Testing Library** - testowanie komponentów React (jeśli dodane)
- **Zod** - walidacja schematów (używane w testach)

### 6.2. Testy End-to-End

- **Playwright** (v1.57.0) - framework E2E
- **Page Object Model (POM)** - wzorzec organizacji testów
- **Fixtures** - reusable test setup (`e2e/fixtures/auth.fixture.ts`)

### 6.3. Testy Wydajnościowe

- **Playwright** - pomiar czasu odpowiedzi
- **Lighthouse CI** (opcjonalnie) - metryki wydajności

### 6.4. Testy Bezpieczeństwa

- **Manual testing** - weryfikacja RLS, autentykacji
- **Playwright** - automatyzacja testów bezpieczeństwa

### 6.5. Narzędzia Pomocnicze

- **ESLint** - jakość kodu
- **Prettier** - formatowanie kodu
- **TypeScript** - sprawdzanie typów
- **dotenv** - zarządzanie zmiennymi środowiskowymi

## 7. Harmonogram Testów

### 7.1. Faza Development (Continuous)

- **Testy jednostkowe**: Po każdej zmianie kodu
- **Testy integracyjne**: Po zmianach w serwisach/API
- **Linting**: Pre-commit hooks (Husky)

### 7.2. Faza Pre-Commit

- **Linting**: Automatyczny (lint-staged)
- **Formatowanie**: Automatyczne (Prettier)
- **Testy jednostkowe**: Opcjonalnie (można dodać do pre-commit)

### 7.3. Faza Pre-Merge (Pull Request)

- **Wszystkie testy jednostkowe**: `npm run test:run`
- **Wszystkie testy E2E**: `npm run test:e2e`
- **Build**: `npm run build`
- **Linting**: `npm run lint`

### 7.4. Faza Pre-Release

- **Pełna suita testów**: Wszystkie typy testów
- **Testy regresyjne**: Wszystkie scenariusze krytyczne
- **Testy wydajnościowe**: Weryfikacja metryk
- **Testy bezpieczeństwa**: Przegląd bezpieczeństwa

### 7.5. Faza Post-Release

- **Testy smoke**: Podstawowa weryfikacja produkcji
- **Monitoring**: Monitorowanie błędów i wydajności

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria Ogólne

- ✅ Wszystkie testy krytyczne przechodzą (100%)
- ✅ Wszystkie testy wysokiego priorytetu przechodzą (100%)
- ✅ Minimum 80% pokrycia kodu dla modułów krytycznych
- ✅ Brak błędów krytycznych i wysokich
- ✅ Build przechodzi bez błędów
- ✅ Linting przechodzi (dopuszczalne tylko ostrzeżenia)

### 8.2. Kryteria Funkcjonalne

- ✅ Wszystkie wymagania z PRD są zaimplementowane i przetestowane
- ✅ Wszystkie scenariusze testowe z sekcji 4 przechodzą
- ✅ Metryki sukcesu są osiągalne (MS-01, MS-02)

### 8.3. Kryteria Wydajnościowe

- ✅ Czas odpowiedzi API < 2s (95 percentyl)
- ✅ Czas generowania fiszek < 30s
- ✅ Czas ładowania stron < 3s
- ✅ Aplikacja działa płynnie przy 1000+ fiszkach

### 8.4. Kryteria Bezpieczeństwa

- ✅ Wszystkie trasy są chronione przez middleware
- ✅ RLS działa poprawnie (izolacja danych)
- ✅ Tokeny JWT są weryfikowane
- ✅ Walidacja danych wejściowych działa
- ✅ Brak podatności na XSS, SQL Injection

### 8.5. Kryteria Jakości Kodu

- ✅ Brak błędów TypeScript
- ✅ ESLint przechodzi (tylko ostrzeżenia akceptowalne)
- ✅ Kod jest sformatowany (Prettier)
- ✅ Brak nieużywanych zmiennych/importów

## 9. Role i Odpowiedzialności w Procesie Testowania

### 9.1. Developer

- **Odpowiedzialności**:
  - Pisanie testów jednostkowych dla nowego kodu
  - Uruchamianie testów lokalnie przed commit
  - Naprawianie testów po zmianach w kodzie
  - Utrzymanie pokrycia testami na poziomie 80%+

### 9.2. QA Engineer

- **Odpowiedzialności**:
  - Tworzenie i utrzymanie testów E2E
  - Weryfikacja scenariuszy testowych
  - Raportowanie błędów
  - Weryfikacja kryteriów akceptacji przed release

### 9.3. Tech Lead / Senior Developer

- **Odpowiedzialności**:
  - Przegląd strategii testowania
  - Weryfikacja kryteriów akceptacji
  - Decyzje dotyczące priorytetów testów
  - Approval przed release

### 9.4. DevOps Engineer

- **Odpowiedzialności**:
  - Konfiguracja CI/CD pipelines
  - Utrzymanie środowisk testowych
  - Monitoring wydajności testów

## 10. Procedury Raportowania Błędów

### 10.1. Format Raportu Błędu

Każdy raport błędu powinien zawierać:

1. **Tytuł**: Krótki, opisowy tytuł błędu
2. **Priorytet**: Krytyczny / Wysoki / Średni / Niski
3. **Środowisko**: Lokalne / Testowe / Produkcyjne
4. **Kroki reprodukcji**: Szczegółowe kroki do odtworzenia błędu
5. **Oczekiwany rezultat**: Co powinno się wydarzyć
6. **Rzeczywisty rezultat**: Co się faktycznie wydarzyło
7. **Zrzuty ekranu / Logi**: Jeśli dostępne
8. **Informacje techniczne**: Browser, OS, wersja aplikacji

### 10.2. Priorytety Błędów

#### Krytyczny

- Aplikacja nie działa (crash, biały ekran)
- Utrata danych użytkownika
- Błędy bezpieczeństwa (wyciek danych, brak autentykacji)

#### Wysoki

- Główne funkcjonalności nie działają
- Błędy uniemożliwiające użycie aplikacji
- Problemy z wydajnością wpływające na UX

#### Średni

- Funkcjonalności działają częściowo
- Problemy z UX (ale aplikacja użyteczna)
- Błędy w funkcjach pomocniczych

#### Niski

- Drobne problemy wizualne
- Błędy w funkcjach opcjonalnych
- Sugestie ulepszeń

### 10.3. Narzędzia do Raportowania

- **GitHub Issues**: Główny system śledzenia błędów
- **Labels**: Używanie labeli do kategoryzacji (bug, enhancement, etc.)
- **Milestones**: Grupowanie błędów według wersji

### 10.4. Proces Naprawy Błędów

1. **Raportowanie**: QA/Developer tworzy issue w GitHub
2. **Triage**: Tech Lead przypisuje priorytet i assignee
3. **Naprawa**: Developer naprawia błąd i dodaje testy
4. **Weryfikacja**: QA weryfikuje naprawę
5. **Zamknięcie**: Issue jest zamykane po weryfikacji

## 11. Metryki i Monitoring

### 11.1. Metryki Testowe

- **Pokrycie kodu**: Minimum 80% dla modułów krytycznych
- **Liczba testów**: Śledzenie wzrostu liczby testów
- **Czas wykonania testów**: Optymalizacja czasu wykonania
- **Wskaźnik sukcesu testów**: Cel: >95%

### 11.2. Metryki Aplikacji (MS-01, MS-02)

- **MS-01**: 75% fiszek AI zaakceptowanych (z edycją lub bez)
- **MS-02**: 75% wszystkich fiszek utworzonych przez AI

### 11.3. Monitoring Produkcji

- **Error tracking**: Supabase Logs, Cloudflare Analytics
- **Performance monitoring**: Cloudflare Analytics
- **User analytics**: Opcjonalnie (Google Analytics, Plausible)

## 12. Plan Rozwoju Testów

### 12.1. Krótkoterminowe (MVP)

- ✅ Utrzymanie obecnego pokrycia testami (68 testów jednostkowych, 4 E2E)
- ✅ Dodanie testów E2E dla pozostałych scenariuszy (autentykacja, sesje nauki)
- ✅ Zwiększenie pokrycia testami jednostkowymi do 80%

### 12.2. Średnioterminowe (Post-MVP)

- Dodanie testów wydajnościowych
- Dodanie testów bezpieczeństwa (automatyzacja)
- Dodanie testów integracyjnych dla FSRS
- Dodanie testów accessibility (a11y)

### 12.3. Długoterminowe

- Visual regression testing
- Load testing
- Security penetration testing
- Continuous performance monitoring

## 13. Załączniki

### 13.1. Przydatne Linki

- [Dokumentacja Vitest](https://vitest.dev/)
- [Dokumentacja Playwright](https://playwright.dev/)
- [Dokumentacja Supabase Testing](https://supabase.com/docs/guides/cli/local-development)
- [Dokumentacja Astro Testing](https://docs.astro.build/en/guides/testing/)

### 13.2. Przykłady Testów

- Testy jednostkowe: `src/lib/utils/__tests__/`
- Testy integracyjne: `src/lib/services/__tests__/`
- Testy E2E: `e2e/flashcard-generation.spec.ts`

---

**Wersja dokumentu**: 1.0  
**Data utworzenia**: 2025-01-XX  
**Ostatnia aktualizacja**: 2025-01-XX  
**Autor**: QA Team  
**Status**: Aktywny
