# Schemat bazy danych PostgreSQL dla 10xCards

## Przegląd

Schemat bazy danych został zaprojektowany dla aplikacji 10xCards z wykorzystaniem **PostgreSQL** jako części platformy **Supabase**. Schemat wykorzystuje wbudowany system autentykacji Supabase (`auth.users`) i implementuje zabezpieczenia na poziomie wiersza (RLS) dla wszystkich tabel użytkownika.

---

## 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

### Tabela: `auth.users` (zarządzana przez Supabase)

**Uwaga:** Ta tabela jest częścią wbudowanego systemu autentykacji Supabase i nie wymaga tworzenia przez migracje. Jest zarządzana automatycznie przez Supabase Auth.

| Opis                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Przechowuje dane użytkowników systemu (e-mail, hasła, metadane sesji).                                                                          |
| Wszystkie operacje CRUD na kontach użytkowników są obsługiwane przez Supabase Auth API.                                                         |
| Pozostałe tabele aplikacji (`generations`, `flashcards`, `generation_error_logs`) odwołują się do `auth.users(id)` przez klucze obce `user_id`. |

**Kluczowe kolumny:**

- `id` (uuid) - PRIMARY KEY, identyfikator użytkownika
- `email` - adres e-mail użytkownika
- `created_at` - data utworzenia konta
- `updated_at` - data ostatniej aktualizacji

---

### Tabela: `generations`

Przechowuje metadane każdej sesji generowania fiszek przez AI.

| Nazwa kolumny             | Typ danych                 | Ograniczenia                                                                      | Opis                                                                                                   |
| ------------------------- | -------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `id`                      | `uuid`                     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                        | Unikalny identyfikator sesji generowania.                                                              |
| `user_id`                 | `uuid`                     | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`                         | Identyfikator użytkownika, który zainicjował generowanie.                                              |
| `model`                   | `text`                     | `NOT NULL`                                                                        | Nazwa modelu AI użytego do generowania (np. "gpt-4", "claude-3").                                      |
| `generated_count`         | `integer`                  | `NOT NULL`, `DEFAULT 0`, `CHECK (generated_count >= 0)`                           | Liczba fiszek wygenerowanych przez AI w tej sesji.                                                     |
| `accepted_unedited_count` | `integer`                  | `NULL`, `CHECK (accepted_unedited_count IS NULL OR accepted_unedited_count >= 0)` | Liczba zaakceptowanych fiszek bez edycji (source='ai-full'). Aktualizowane po przeglądzie propozycji.  |
| `accepted_edited_count`   | `integer`                  | `NULL`, `CHECK (accepted_edited_count IS NULL OR accepted_edited_count >= 0)`     | Liczba zaakceptowanych fiszek po edycji (source='ai-edited'). Aktualizowane po przeglądzie propozycji. |
| `source_text_hash`        | `text`                     | `NOT NULL`                                                                        | Hash tekstu źródłowego (do deduplikacji i audytu).                                                     |
| `source_text_length`      | `integer`                  | `NOT NULL`, `CHECK (source_text_length >= 1000 AND source_text_length <= 10000)`  | Długość tekstu źródłowego użytego do generowania.                                                      |
| `generation_duration`     | `interval`                 | `NULL`                                                                            | Czas trwania generowania (od wysłania request do otrzymania odpowiedzi). Aktualizowane po zakończeniu. |
| `created_at`              | `timestamp with time zone` | `NOT NULL`, `DEFAULT now()`                                                       | Czas utworzenia rekordu.                                                                               |

---

### Tabela: `flashcards`

Przechowuje wszystkie fiszki, zarówno te generowane przez AI, jak i tworzone ręcznie.

| Nazwa kolumny    | Typ danych                 | Ograniczenia                                                       | Opis                                                                                    |
| ---------------- | -------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `id`             | `uuid`                     | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                         | Unikalny identyfikator fiszki.                                                          |
| `user_id`        | `uuid`                     | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`          | Identyfikator użytkownika (właściciela fiszki).                                         |
| `generation_id`  | `uuid`                     | `REFERENCES generations(id) ON DELETE SET NULL`                    | Opcjonalny identyfikator sesji AI, z której pochodzi fiszka.                            |
| `front`          | `varchar(200)`             | `NOT NULL`                                                         | Awers fiszki (pytanie).                                                                 |
| `back`           | `varchar(500)`             | `NOT NULL`                                                         | Rewers fiszki (odpowiedź).                                                              |
| `source`         | `varchar(10)`              | `NOT NULL`, `CHECK (source IN ('ai-full', 'ai-edited', 'manual'))` | Źródło pochodzenia fiszki.                                                              |
| `state`          | `smallint`                 | `NOT NULL`, `DEFAULT 0`                                            | Stan fiszki w algorytmie FSRS (0: New, 1: Learning, 2: Review, 3: Relearning).          |
| `due`            | `timestamp with time zone` | `NOT NULL`, `DEFAULT now()`                                        | Data następnej powtórki.                                                                |
| `stability`      | `real`                     | `NOT NULL`, `DEFAULT 0`                                            | Parametr "stability" algorytmu FSRS.                                                    |
| `difficulty`     | `real`                     | `NOT NULL`, `DEFAULT 0`                                            | Parametr "difficulty" algorytmu FSRS.                                                   |
| `lapses`         | `integer`                  | `NOT NULL`, `DEFAULT 0`                                            | Liczba pomyłek (lapses) dla fiszki.                                                     |
| `review_history` | `jsonb`                    | `NOT NULL`, `DEFAULT '[]'`                                         | Historia powtórek przechowywana w formacie JSON.                                        |
| `created_at`     | `timestamp with time zone` | `NOT NULL`, `DEFAULT now()`                                        | Czas utworzenia fiszki.                                                                 |
| `updated_at`     | `timestamp with time zone` | `NOT NULL`, `DEFAULT now()`                                        | Czas ostatniej modyfikacji fiszki.                                                      |
| -                | -                          | `UNIQUE (user_id, front, back)`                                    | Zapewnia unikalność fiszek dla danego użytkownika na podstawie treści awersu i rewersu. |

---

### Tabela: `generation_error_logs`

Loguje błędy, które wystąpiły podczas procesu generowania fiszek przez AI.

| Nazwa kolumny        | Typ danych                 | Ograniczenia                                                                     | Opis                                                   |
| -------------------- | -------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `id`                 | `bigserial`                | `PRIMARY KEY`                                                                    | Unikalny identyfikator logu błędu (auto-incrementing). |
| `user_id`            | `uuid`                     | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`                        | Identyfikator użytkownika, u którego wystąpił błąd.    |
| `model`              | `text`                     | `NOT NULL`                                                                       | Nazwa modelu AI, który zwrócił błąd.                   |
| `source_text_hash`   | `text`                     | `NOT NULL`                                                                       | Hash tekstu źródłowego, który spowodował błąd.         |
| `source_text_length` | `integer`                  | `NOT NULL`, `CHECK (source_text_length >= 1000 AND source_text_length <= 10000)` | Długość tekstu źródłowego, który spowodował błąd.      |
| `error_code`         | `text`                     | `NULL`                                                                           | Kod błędu zwrócony przez API AI (jeśli dostępny).      |
| `error_message`      | `text`                     | `NULL`                                                                           | Szczegółowy komunikat błędu.                           |
| `created_at`         | `timestamp with time zone` | `NOT NULL`, `DEFAULT now()`                                                      | Czas wystąpienia błędu.                                |

---

## 2. Relacje między tabelami

### Diagram relacji encji

```
auth.users (Supabase Auth)
    │
    ├──[1:N]──> generations
    │              │
    │              └──[1:N]──> flashcards (opcjonalna)
    │
    ├──[1:N]──> flashcards
    │
    └──[1:N]──> generation_error_logs
```

### Szczegółowy opis relacji

- **`auth.users` ←→ `generations` (Jeden-do-wielu)**
  - Jeden użytkownik (`auth.users`) może mieć wiele sesji generowania (`generations`).
  - Relacja zaimplementowana przez klucz obcy `user_id` w tabeli `generations`.
  - `ON DELETE CASCADE`: Usunięcie użytkownika powoduje automatyczne usunięcie wszystkich jego sesji generowania.

- **`auth.users` ←→ `flashcards` (Jeden-do-wielu)**
  - Jeden użytkownik (`auth.users`) może mieć wiele fiszek (`flashcards`).
  - Relacja zaimplementowana przez klucz obcy `user_id` w tabeli `flashcards`.
  - `ON DELETE CASCADE`: Usunięcie użytkownika powoduje automatyczne usunięcie wszystkich jego fiszek.

- **`generations` ←→ `flashcards` (Jeden-do-wielu, opcjonalna)**
  - Jedna sesja generowania (`generations`) może dać w wyniku wiele fiszek (`flashcards`).
  - Relacja zaimplementowana przez klucz obcy `generation_id` w tabeli `flashcards`.
  - `ON DELETE SET NULL`: Usunięcie sesji generowania nie usuwa fiszek, a jedynie zeruje pole `generation_id`, zachowując fiszki.
  - Relacja jest **opcjonalna** - fiszki tworzone ręcznie (`source = 'manual'`) nie mają powiązanego `generation_id`.

- **`auth.users` ←→ `generation_error_logs` (Jeden-do-wielu)**
  - Jeden użytkownik (`auth.users`) może mieć wiele logów błędów (`generation_error_logs`).
  - Relacja zaimplementowana przez klucz obcy `user_id` w tabeli `generation_error_logs`.
  - `ON DELETE CASCADE`: Usunięcie użytkownika powoduje automatyczne usunięcie wszystkich jego logów błędów.

---

## 3. Indeksy

W celu optymalizacji wydajności zapytań, zostaną utworzone następujące indeksy:

### Indeksy na tabeli `generations`

```sql
-- Optymalizacja zapytań pobierających sesje generowania dla konkretnego użytkownika
CREATE INDEX idx_generations_user_id ON generations(user_id);

-- Optymalizacja zapytań sortujących sesje po dacie utworzenia
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);

-- Optymalizacja wyszukiwania duplikatów na podstawie hash tekstu źródłowego
CREATE INDEX idx_generations_source_text_hash ON generations(source_text_hash);

-- Optymalizacja analityki modeli AI
CREATE INDEX idx_generations_model ON generations(model);

-- Optymalizacja zapytań analitycznych dotyczących czasu trwania generowania
CREATE INDEX idx_generations_duration ON generations(generation_duration) WHERE generation_duration IS NOT NULL;
```

### Indeksy na tabeli `flashcards`

```sql
-- Optymalizacja zapytań pobierających fiszki dla konkretnego użytkownika
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);

-- Optymalizacja zapytań pobierających fiszki z konkretnej sesji generowania
CREATE INDEX idx_flashcards_generation_id ON flashcards(generation_id);

-- Optymalizacja zapytań wyszukujących fiszki do powtórki (sortowanie po due)
CREATE INDEX idx_flashcards_due ON flashcards(due);

-- Optymalizacja zapytań pobierających fiszki do powtórki dla konkretnego użytkownika
-- (złożony indeks dla najczęstszego przypadku użycia w sesji nauki)
CREATE INDEX idx_flashcards_user_due ON flashcards(user_id, due) WHERE due <= now();
```

### Indeksy na tabeli `generation_error_logs`

```sql
-- Optymalizacja zapytań pobierających logi błędów dla konkretnego użytkownika
CREATE INDEX idx_generation_error_logs_user_id ON generation_error_logs(user_id);

-- Optymalizacja zapytań sortujących logi po dacie wystąpienia
CREATE INDEX idx_generation_error_logs_created_at ON generation_error_logs(created_at DESC);

-- Optymalizacja analityki błędów po modelach AI
CREATE INDEX idx_generation_error_logs_model ON generation_error_logs(model);

-- Optymalizacja wyszukiwania błędów dla konkretnego tekstu źródłowego
CREATE INDEX idx_generation_error_logs_source_hash ON generation_error_logs(source_text_hash);

-- Optymalizacja grupowania błędów po kodzie błędu
CREATE INDEX idx_generation_error_logs_error_code ON generation_error_logs(error_code) WHERE error_code IS NOT NULL;
```

---

## 4. Zasady PostgreSQL (Row-Level Security)

Dla wszystkich tabel aplikacji zostanie włączone zabezpieczenie na poziomie wiersza (RLS). Zapewni to, że użytkownicy mają dostęp wyłącznie do swoich własnych danych. Polityki wykorzystują funkcję `auth.uid()` dostarczoną przez Supabase do identyfikacji zalogowanego użytkownika.

### Polityki dla tabeli `generations`

```sql
-- Włączenie RLS
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Polityka SELECT: użytkownik może odczytać tylko własne sesje generowania
CREATE POLICY "Users can view their own generations"
  ON generations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Polityka INSERT: użytkownik może dodawać sesje generowania tylko dla siebie
CREATE POLICY "Users can insert their own generations"
  ON generations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Polityka UPDATE: użytkownik może aktualizować tylko własne sesje generowania
CREATE POLICY "Users can update their own generations"
  ON generations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Polityka DELETE: użytkownik może usuwać tylko własne sesje generowania
CREATE POLICY "Users can delete their own generations"
  ON generations
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Polityki dla tabeli `flashcards`

```sql
-- Włączenie RLS
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Polityka SELECT: użytkownik może odczytać tylko własne fiszki
CREATE POLICY "Users can view their own flashcards"
  ON flashcards
  FOR SELECT
  USING (auth.uid() = user_id);

-- Polityka INSERT: użytkownik może dodawać fiszki tylko do własnego konta
CREATE POLICY "Users can insert their own flashcards"
  ON flashcards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Polityka UPDATE: użytkownik może modyfikować tylko własne fiszki
CREATE POLICY "Users can update their own flashcards"
  ON flashcards
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Polityka DELETE: użytkownik może usuwać tylko własne fiszki
CREATE POLICY "Users can delete their own flashcards"
  ON flashcards
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Polityki dla tabeli `generation_error_logs`

```sql
-- Włączenie RLS
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;

-- Polityka SELECT: użytkownik może odczytać tylko własne logi błędów
CREATE POLICY "Users can view their own error logs"
  ON generation_error_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Polityka INSERT: użytkownik może dodawać logi błędów tylko dla siebie
CREATE POLICY "Users can insert their own error logs"
  ON generation_error_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 5. Dodatkowe uwagi i decyzje projektowe

### 5.1. Integracja z Supabase Auth

- **Tabela `auth.users`**: Schemat wykorzystuje wbudowany system autentykacji Supabase. Tabela `auth.users` jest automatycznie zarządzana przez Supabase i nie wymaga ręcznego tworzenia.
- **Funkcja `auth.uid()`**: Wszystkie polityki RLS wykorzystują tę funkcję do identyfikacji zalogowanego użytkownika, co zapewnia spójność z ekosystemem Supabase.
- **Wymagania funkcjonalne**: Integracja pokrywa wymagania FR-001 do FR-004 z PRD (rejestracja, logowanie, zmiana hasła, usunięcie konta).

### 5.2. Algorytm FSRS (Free Spaced Repetition Scheduler)

Schemat tabeli `flashcards` zawiera wszystkie niezbędne kolumny do implementacji algorytmu FSRS zgodnie z wymaganiem FR-015:

- `state`: Stan fiszki w cyklu nauki (0: New, 1: Learning, 2: Review, 3: Relearning)
- `due`: Data i czas następnej powtórki (kluczowa dla FR-016: automatyczne przygotowywanie dziennej sesji)
- `stability`: Miara stabilności pamięci dla danej fiszki
- `difficulty`: Miara trudności fiszki
- `lapses`: Liczba pomyłek/nieudanych powtórek
- `review_history`: Historia wszystkich powtórek w formacie JSONB (przechowuje oceny z FR-017)

### 5.3. Integralność danych

- **ON DELETE CASCADE**: Użycie tej reguły dla wszystkich kluczy obcych `user_id` zapewnia automatyczne czyszczenie wszystkich danych użytkownika po usunięciu konta, co realizuje wymaganie FR-004 (usunięcie konta i wszystkich danych).
- **ON DELETE SET NULL**: Dla relacji `generation_id` w tabeli `flashcards` zapewnia, że fiszki pozostają w systemie nawet po usunięciu metadanych sesji generowania, co jest istotne dla zachowania kolekcji użytkownika.
- **UNIQUE constraint**: Ograniczenie `UNIQUE (user_id, front, back)` zapobiega przypadkowemu tworzeniu duplikatów fiszek przez tego samego użytkownika.

### 5.4. Metryki sukcesu i analityka

Schemat został zaprojektowany z myślą o łatwym mierzeniu metryk sukcesu zdefiniowanych w PRD:

#### Metryka MS-01: Jakość generacji AI

Tabela `generations` zawiera dedykowane kolumny do śledzenia akceptacji fiszek:

- `generated_count`: Liczba fiszek wygenerowanych przez AI
- `accepted_unedited_count`: Fiszki zaakceptowane bez zmian (`source='ai-full'`)
- `accepted_edited_count`: Fiszki zaakceptowane po edycji (`source='ai-edited'`)

**Wzór**: `(accepted_unedited_count + accepted_edited_count) / generated_count * 100%`

#### Metryka MS-02: Adopcja funkcji generowania AI

Kolumna `source` w tabeli `flashcards` pozwala na:

- Rozróżnienie fiszek AI (`'ai-full'`, `'ai-edited'`) od manualnych (`'manual'`)
- Obliczenie procentowego udziału fiszek AI w ogólnej liczbie

**Wzór**: `COUNT(source IN ('ai-full', 'ai-edited')) / COUNT(*) * 100%`

#### Analityka modeli AI

Kolumna `model` w tabelach `generations` i `generation_error_logs` umożliwia:

- Porównanie wydajności różnych modeli AI
- Analiza kosztów per model
- Testowanie A/B różnych dostawców AI (OpenRouter umożliwia łatwe przełączanie)
- Identyfikacja modeli z największą liczbą błędów

#### Monitorowanie wydajności generowania

Kolumna `generation_duration` w tabeli `generations` pozwala na:

- **Analiza czasu odpowiedzi**: Średni, minimalny i maksymalny czas generowania per model
- **Wykrywanie problemów**: Identyfikacja sesji z nienormalnie długim czasem generowania
- **Porównanie modeli**: Obiektywne porównanie szybkości różnych modeli AI
- **Korelacja z długością tekstu**: Analiza jak długość tekstu źródłowego wpływa na czas generowania
- **SLA monitoring**: Śledzenie czy czasy odpowiedzi mieszczą się w akceptowalnych granicach
- **User Experience**: Optymalizacja wyboru modelu dla najlepszego UX (balans jakość vs. czas)

**Przykładowe zapytania analityczne:**

```sql
-- Średni czas generowania per model
SELECT model, AVG(generation_duration) as avg_duration
FROM generations
WHERE generation_duration IS NOT NULL
GROUP BY model;

-- Sesje przekraczające 30 sekund
SELECT * FROM generations
WHERE generation_duration > INTERVAL '30 seconds';
```

### 5.5. Hash tekstu źródłowego zamiast pełnego tekstu

Zamiast przechowywać cały tekst źródłowy, schemat wykorzystuje `source_text_hash`:

**Zalety:**

- **Deduplikacja**: Wykrycie czy ten sam tekst był już wcześniej przetwarzany
- **Oszczędność miejsca**: Hash zajmuje znacznie mniej miejsca niż pełny tekst (10KB)
- **Prywatność**: Nie przechowujemy potencjalnie wrażliwych treści dłużej niż potrzeba
- **Audyt**: Możliwość powiązania błędów z konkretnymi tekstami źródłowymi bez ich przechowywania

**Implementacja:**

- Sugerowane: SHA-256 hash tekstu źródłowego (64 znaki hex)
- Hash obliczany po stronie aplikacji przed zapisem do bazy

**Uwaga**: Jeśli w przyszłości pojawi się potrzeba przechowywania pełnego tekstu źródłowego (np. do re-generowania), można rozważyć:

- Dodanie kolumny `source_text` jako opcjonalnej (NULL)
- Przechowywanie w zewnętrznym storage (S3, Supabase Storage)

### 5.6. Czas trwania generowania

Kolumna `generation_duration` wykorzystuje typ `interval` (natywny typ PostgreSQL):

**Zalety typu `interval`:**

- Natywne wsparcie PostgreSQL dla operacji na różnicach czasowych
- Łatwe operacje arytmetyczne (AVG, SUM, MIN, MAX)
- Czytelny format wyświetlania (np. "00:00:15.234" dla 15.234 sekundy)
- Możliwość łatwego porównywania (`> INTERVAL '30 seconds'`)
- Precyzja do mikrosekundy

**Implementacja w aplikacji:**

```typescript
// Przykład w TypeScript
const startTime = Date.now();
// ... wywołanie API AI ...
const endTime = Date.now();
const durationMs = endTime - startTime;

// Zapis do bazy jako interval (PostgreSQL przyjmuje milisekundy)
await supabase
  .from("generations")
  .update({
    generation_duration: `${durationMs} milliseconds`,
  })
  .eq("id", generationId);
```

**Alternatywy (nieużywane):**

- `integer` (milisekundy) - wymaga konwersji w zapytaniach
- `real` (sekundy) - mniej precyzyjne, trudniejsze operacje

### 5.7. Walidacja długości tekstu

Ograniczenia `CHECK` zapewniają zgodność z wymaganiami PRD:

- **Tekst źródłowy** (`source_text_length`): 1000-10000 znaków (FR-005)
- **Awers fiszki** (`front`): maksymalnie 200 znaków
- **Rewers fiszki** (`back`): maksymalnie 500 znaków

### 5.8. Optymalizacja zapytań

Indeksy zostały strategicznie umieszczone dla najczęstszych operacji:

- **Sesja nauki**: Indeks złożony `(user_id, due)` z warunkiem `WHERE due <= now()` optymalizuje pobieranie fiszek do powtórki (FR-016)
- **Lista fiszek**: Indeks `user_id` wspiera paginację (FR-012)
- **Śledzenie generacji**: Indeksy na `generation_id` i `created_at` wspierają analitykę i audyt
- **Monitorowanie wydajności**: Indeks na `generation_duration` dla analiz czasów generowania

### 5.9. Normalizacja i denormalizacja

- **Schemat znormalizowany do 3NF**: Brak redundantnych danych, wszystkie atrybuty zależne funkcjonalnie od klucza podstawowego
- **Denormalizacja celowa**:
  - `review_history` jako JSONB zamiast osobnej tabeli - elastyczność i wydajność dla historii powtórek
  - `generated_count`, `accepted_unedited_count`, `accepted_edited_count` w tabeli `generations` - cache dla metryk sukcesu

### 5.10. Skalowalność

- **UUID**: Typ `uuid` dla kluczy podstawowych zapewnia globalną unikalność i lepszą dystrybucję w indeksach
- **Timestamp with time zone**: Poprawna obsługa stref czasowych dla użytkowników z różnych regionów
- **JSONB**: Elastyczne przechowywanie `review_history` bez potrzeby zmian schematu przy ewolucji algorytmu FSRS

### 5.9. Bezpieczeństwo

- **RLS na wszystkich tabelach**: Izolacja danych użytkowników na poziomie bazy danych
- **Integracja z Supabase Auth**: Spójna autentykacja i autoryzacja
- **Polityki RLS**: Wykorzystanie `auth.uid()` zapewnia, że tylko zalogowany użytkownik może operować na swoich danych
- **Brak dostępu bez uwierzytelnienia**: Wszystkie polityki wymagają zalogowania (`auth.uid()` musi zwrócić wartość)

### 5.10. Pokrycie wymagań funkcjonalnych

| Wymaganie        | Implementacja w schemacie                                          |
| ---------------- | ------------------------------------------------------------------ |
| FR-001 do FR-004 | Obsługiwane przez `auth.users` (Supabase Auth)                     |
| FR-005 do FR-009 | Tabele `generations` i `flashcards` z kolumną `source`             |
| FR-010 do FR-013 | Tabela `flashcards` z politykami RLS umożliwiającymi pełen CRUD    |
| FR-014 do FR-017 | Parametry FSRS w tabeli `flashcards` (state, due, stability, etc.) |

---

## Podsumowanie

Schemat bazy danych dla aplikacji 10xCards został zaprojektowany z myślą o:

1. **Bezpieczeństwie**: RLS na wszystkich tabelach, integracja z Supabase Auth
2. **Wydajności**: Strategicznie umieszczone indeksy, w tym złożone dla najczęstszych zapytań
3. **Integralności**: Klucze obce z odpowiednimi regułami CASCADE i SET NULL
4. **Skalowalności**: UUID, timezone-aware timestamps, JSONB dla elastycznych danych
5. **Zgodności z wymaganiami**: Pełne pokrycie wszystkich wymagań funkcjonalnych z PRD
6. **Zgodności z decyzjami**: Implementacja wszystkich ustaleń z sesji planowania

Schemat jest gotowy do implementacji jako migracja Supabase i stanowi solidną podstawę dla MVP aplikacji 10xCards.
