# Dokument wymagań produktu (PRD) - 10xCards

## 1. Przegląd produktu
10xCards to aplikacja internetowa, która używa AI do szybkiego tworzenia fiszek edukacyjnych. Celem jest uproszczenie nauki dowolnego zagadnienia metodą powtórek interwałowych (spaced repetition).

W wersji MVP, aplikacja pozwoli na generowanie fiszek z wklejonego tekstu, z możliwością ich akceptacji, edycji lub odrzucenia. Fiszki będą składać się z dwóch stron (pytanie i odpowiedź) i zostaną utworzone w języku, który AI wykryje we wklejonym tekście. Będzie również możliwość tworzenia własnych fiszek. Do obsługi powtórek zostanie wykorzystany gotowy algorytm FSRS (Free Spaced Repetition Scheduler).

## 2. Problem użytkownika
Ręczne tworzenie fiszek jest czasochłonne, co zniechęca do nauki metodą spaced repetition. Użytkownicy poświęcają zbyt dużo czasu na przygotowanie materiałów zamiast na naukę. 10xCards rozwiązuje ten problem przez automatyzację tworzenia fiszek.

## 3. Wymagania funkcjonalne
### 3.1. Zarządzanie kontem użytkownika
-   FR-001: Rejestracja konta przez e-mail/hasło.
-   FR-002: Logowanie na konto.
-   FR-003: Zmiana hasła.
-   FR-004: Usunięcie konta i wszystkich danych.

### 3.2. Generowanie fiszek przez AI
-   FR-005: Możliwość wklejenia tekstu (1000-10000 znaków).
-   FR-006: System analizuje tekst przy użyciu AI, aby wygenerować propozycje fiszek.
-   FR-007: Interfejs do przeglądu propozycji fiszek.
-   FR-008: Opcje: "Akceptuj", "Edytuj", "Odrzuć" dla każdej propozycji.
-   FR-009: Zapisywanie zaakceptowanych fiszek w kolekcji użytkownika.

### 3.3. Manualne zarządzanie fiszkami
-   FR-010: Formularz do ręcznego dodawania fiszek.
-   FR-011: Widok listy wszystkich fiszek użytkownika.
-   FR-012: Paginacja listy fiszek (25 na stronę).
-   FR-013: Możliwość edycji i usunięcia każdej fiszki z listy.

### 3.4. System nauki (Spaced Repetition)
-   FR-014: Dedykowany widok "Sesja nauki".
-   FR-015: Integracja z algorytmem FSRS do planowania powtórek.
-   FR-016: Automatyczne przygotowywanie dziennej sesji powtórek.
-   FR-017: Interfejs do oceniania znajomości fiszek podczas nauki.

## 4. Granice produktu
Funkcjonalności nieobjęte MVP:
-   Własny algorytm powtórek (zamiast tego integracja z gotowym rozwiązaniem).
-   Import fiszek z plików (PDF, DOCX, itp.).
-   Współdzielenie zestawów fiszek.
-   Integracje z innymi platformami.
-   Aplikacje mobilne (tylko wersja webowa).
-   Tworzenie wielu talii fiszek (tylko jedna globalna kolekcja).

## 5. Historyjki użytkowników

### Zarządzanie kontem
---
-   ID: US-001
-   Tytuł: Rejestracja nowego użytkownika
-   Opis: Jako nowy użytkownik, chcę utworzyć konto, aby przechowywać moje fiszki.
-   AC:
    -   Formularz wymaga podania adresu e-mail, hasła i jego potwierdzenia.
    -   Walidacja formatu e-mail i minimalnej długości hasła (8 znaków).
    -   Po rejestracji następuje automatyczne logowanie.
    -   Wyświetlenie błędu, jeśli e-mail jest już używany.

---
-   ID: US-002
-   Tytuł: Logowanie do aplikacji
-   Opis: Jako zarejestrowany użytkownik, chcę się zalogować, aby uzyskać dostęp do moich fiszek.
-   AC:
    -   Formularz logowania wymaga e-maila i hasła.
    -   Po poprawnym logowaniu użytkownik widzi panel główny.
    -   Wyświetlenie błędu przy błędnych danych.

---
-   ID: US-003
-   Tytuł: Zmiana hasła
-   Opis: Jako użytkownik, chcę zmienić hasło, aby zabezpieczyć konto.
-   AC:
    -   Formularz wymaga podania starego i nowego hasła.
    -   Walidacja poprawności starego hasła.
    -   Po zmianie użytkownik otrzymuje potwierdzenie.

---
-   ID: US-004
-   Tytuł: Usunięcie konta
-   Opis: Jako użytkownik, chcę trwale usunąć moje konto i dane.
-   AC:
    -   Operacja wymaga potwierdzenia hasłem.
    -   Po potwierdzeniu konto i dane są trwale usuwane.
    -   Użytkownik jest wylogowywany.

### Proces generowania i zarządzania fiszkami
---
-   ID: US-005
-   Tytuł: Generowanie propozycji fiszek z tekstu
-   Opis: Jako użytkownik, chcę wkleić tekst, aby AI wygenerowało dla mnie fiszki.
-   AC:
    -   Główny widok zawiera pole do wklejenia tekstu (limit 1000-10000 znaków).
    -   Kliknięcie "Generuj" rozpoczyna proces (widoczny wskaźnik ładowania).
    -   Po zakończeniu użytkownik widzi listę propozycji (liczba propozycji proporcjonalna do wielkości wklejonego textu).
    -   W przypadku błędu wyświetlany jest komunikat.

---
-   ID: US-006
-   Tytuł: Przeglądanie i akceptacja propozycji
-   Opis: Jako użytkownik, chcę przejrzeć propozycje AI i wybrać, które zapisać.
-   AC:
    -   Każda propozycja ma przyciski: "Akceptuj", "Edytuj", "Odrzuć".
    -   "Odrzuć" usuwa propozycję, "Akceptuj" ją zatwierdza.
    -   Przycisk "Zapisz" dodaje wszystkie zaakceptowane propozycje do kolekcji.

---
-   ID: US-007
-   Tytuł: Edycja propozycji fiszki
-   Opis: Jako użytkownik, chcę edytować propozycję przed jej zapisaniem.
-   AC:
    -   Przycisk "Edytuj" otwiera formularz edycji awersu/rewersu.
    -   Po zapisaniu zmian propozycja jest automatycznie akceptowana.

---
-   ID: US-008
-   Tytuł: Ręczne tworzenie nowej fiszki
-   Opis: Jako użytkownik, chcę móc ręcznie dodać własną fiszkę.
-   AC:
    -   Dostępny jest prosty formularz z polami na awers i rewers.
    -   Po zapisaniu, nowa fiszka trafia do kolekcji.

---
-   ID: US-009
-   Tytuł: Przeglądanie kolekcji fiszek
-   Opis: Jako użytkownik, chcę mieć dostęp do listy wszystkich moich fiszek.
-   AC:
    -   Dedykowany widok z listą wszystkich fiszek.
    -   Lista zawiera awers, rewers i datę następnej powtórki.
    -   Lista jest paginowana.

---
-   ID: US-010
-   Tytuł: Edycja i usuwanie istniejącej fiszki
-   Opis: Jako użytkownik, chcę edytować i usuwać fiszki z mojej kolekcji.
-   AC:
    -   Każda fiszka na liście ma opcje edycji i usunięcia.
    -   Usunięcie wymaga dodatkowego potwierdzenia.

### Sesja nauki
---
-   ID: US-011
-   Tytuł: Rozpoczęcie sesji nauki
-   Opis: Jako użytkownik, chcę rozpocząć sesję z fiszkami do powtórki na dziś.
-   AC:
    -   Przycisk "Rozpocznij naukę" jest aktywny, gdy są fiszki do powtórki.
    -   Rozpoczęcie sesji przenosi do widoku nauki, pokazując awers pierwszej fiszki.

---
-   ID: US-012
-   Tytuł: Ocenianie znajomości fiszki
-   Opis: Jako użytkownik, chcę ocenić znajomość fiszki, aby system zaplanował kolejną powtórkę.
-   AC:
    -   Po odkryciu rewersu dostępne są przyciski do oceny znajomości.
    -   Ocena jest przekazywana do algorytmu FSRS.
    -   System automatycznie przechodzi do następnej fiszki.

---
-   ID: US-013
-   Tytuł: Zakończenie sesji nauki
-   Opis: Jako użytkownik, po przejściu wszystkich fiszek chcę otrzymać podsumowanie.
-   AC:
    -   Po ostatniej fiszce wyświetlany jest ekran podsumowania sesji.
    -   Z podsumowania można wrócić do panelu głównego.

## 6. Metryki sukcesu
-   MS-01: Jakość generacji AI
    -   Cel: 75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkownika (bezpośrednio lub po edycji).
    -   Pomiar: Stosunek fiszek zaakceptowanych (w tym edytowanych) do wszystkich zaproponowanych przez AI.

-   MS-02: Adopcja funkcji generowania AI
    -   Cel: 75% wszystkich nowych fiszek jest tworzonych przy użyciu AI.
    -   Pomiar: Procentowy udział fiszek stworzonych przez AI w ogólnej liczbie nowo dodanych fiszek.
