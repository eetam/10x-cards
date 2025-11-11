# API Endpoint Implementation Plan: Generate Flashcards

## 1. Przegląd punktu końcowego

Endpoint POST `/api/generations` służy do tworzenia nowej sesji generowania fiszek przez AI oraz generowania propozycji fiszek na podstawie dostarczonego tekstu źródłowego. Endpoint integruje się z zewnętrzną usługą OpenRouter.ai w celu generowania treści AI, zapisuje metadane sesji w bazie danych i zwraca propozycje fiszek wraz z poziomem pewności.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/generations`
- **Parametry:**
  - **Wymagane:** `sourceText` (string, 1000-10000 znaków)
  - **Opcjonalne:** `model` (string, domyślnie skonfigurowany model)
- **Request Body:**

```json
{
  "sourceText": "string (1000-10000 characters)",
  "model": "string (optional)"
}
```

## 3. Wykorzystywane typy

### DTOs z `src/types.ts`:

- `CreateGenerationRequest` - walidacja danych wejściowych
- `CreateGenerationResponse` - metadane generowania w odpowiedzi
- `GenerateFlashcardsResponse` - pełna struktura odpowiedzi
- `FlashcardProposal` - struktura pojedynczej propozycji fiszki
- `CreateGenerationCommand` - alias dla requestu

### Typy bazy danych:

- `GenerationInsert` - dane do wstawienia do tabeli `generations`
- `GenerationErrorLogInsert` - logowanie błędów generowania

## 4. Szczegóły odpowiedzi

### Sukces (201 Created):

```json
{
  "generation": {
    "id": "uuid",
    "userId": "uuid",
    "model": "string",
    "sourceTextHash": "string",
    "sourceTextLength": "number",
    "createdAt": "ISO 8601 timestamp"
  },
  "proposals": [
    {
      "front": "string",
      "back": "string",
      "confidence": "number (0-1)"
    }
  ],
  "generatedAt": "ISO 8601 timestamp",
  "duration": "number (milliseconds)"
}
```

### Kody błędów:

- **400 Bad Request:** Nieprawidłowa długość tekstu, nieprawidłowy format danych
- **401 Unauthorized:** Brak uwierzytelnienia lub nieprawidłowy token
- **500 Internal Server Error:** Błąd komunikacji z AI, błąd bazy danych

## 5. Przepływ danych

1. **Walidacja żądania:** Sprawdzenie uwierzytelnienia użytkownika (middleware)
2. **Walidacja danych:** Walidacja długości i formatu `sourceText` oraz opcjonalnego `model`
3. **Generowanie hash:** Utworzenie hash tekstu źródłowego dla deduplikacji
4. **Zapis metadanych:** Utworzenie rekordu w tabeli `generations` z podstawowymi metadanymi
5. **Komunikacja z AI:** Wywołanie OpenRouter API z tekstem źródłowym i modelem
6. **Parsowanie odpowiedzi:** Przetworzenie odpowiedzi AI na strukturę `FlashcardProposal[]`
7. **Walidacja propozycji:** Sprawdzenie poprawności wygenerowanych fiszek
8. **Aktualizacja rekordu:** Zapisanie liczby wygenerowanych fiszek i czasu trwania
9. **Zwrócenie odpowiedzi:** Formatowanie danych zgodnie z `GenerateFlashcardsResponse`

## 6. Względy bezpieczeństwa

### Uwierzytelnienie i autoryzacja:

- Wymagane uwierzytelnienie użytkownika przez middleware
- Sprawdzenie ważności tokenu JWT z Supabase
- Weryfikacja uprawnień użytkownika do tworzenia generacji

### Walidacja danych:

- Długość tekstu: 1000-10000 znaków (ochrona przed DoS)
- Sanityzacja tekstu źródłowego (usunięcie potencjalnie szkodliwych znaków)
- Walidacja modelu AI przeciwko białej liście dostępnych modeli
- Walidacja struktury JSON żądania

### Ochrona przed nadużyciami:

- Rate limiting na poziomie użytkownika (maksymalnie X generacji na godzinę)
- Walidacja rozmiaru żądania (maksymalnie 10KB)
- Logowanie wszystkich prób dostępu dla audytu

## 7. Obsługa błędów

### Błędy walidacji (400):

- Tekst za krótki (< 1000 znaków) lub za długi (> 10000 znaków)
- Nieprawidłowy format JSON
- Nieprawidłowy model AI
- Pusty tekst źródłowy

### Błędy autoryzacji (401):

- Brak tokenu uwierzytelnienia
- Nieprawidłowy lub wygasły token
- Brak uprawnień użytkownika

### Błędy serwera (500):

- Błąd komunikacji z OpenRouter API
- Błąd połączenia z bazą danych
- Błąd parsowania odpowiedzi AI
- Nieoczekiwany błąd aplikacji

### Logowanie błędów:

- Błędy generowania AI → tabela `generation_error_logs`
- Błędy aplikacji → standardowe logi serwera
- Metryki wydajności → monitoring czasu odpowiedzi

## 8. Rozważania dotyczące wydajności

### Optymalizacje:

- **Asynchroniczne przetwarzanie:** Generowanie AI może trwać 10-30 sekund
- **Timeout handling:** Maksymalny czas oczekiwania na odpowiedź AI (60s)
- **Connection pooling:** Optymalizacja połączeń z bazą danych
- **Caching:** Cache skonfigurowanych modeli AI

### Monitoring:

- Czas odpowiedzi endpointu
- Liczba równoczesnych generacji
- Wskaźnik sukcesu komunikacji z AI
- Wykorzystanie zasobów bazy danych

### Limity:

- Maksymalnie 100 równoczesnych generacji na użytkownika
- Timeout 60 sekund na żądanie AI
- Maksymalny rozmiar odpowiedzi AI: 1MB

## 9. Etapy wdrożenia

1. **Utworzenie struktury endpointu**
   - Utworzenie pliku `src/pages/api/generations/index.ts`
   - Implementacja podstawowej struktury POST handlera
   - Konfiguracja `export const prerender = false`

2. **Implementacja walidacji**
   - Utworzenie schematu Zod dla `CreateGenerationRequest`
   - Walidacja długości tekstu (1000-10000 znaków)
   - Walidacja opcjonalnego modelu AI

3. **Implementacja uwierzytelnienia**
   - Integracja z middleware uwierzytelnienia
   - Pobranie `user_id` z tokenu JWT
   - Sprawdzenie uprawnień użytkownika

4. **Utworzenie service generowania**
   - Utworzenie `src/lib/services/generation.service.ts`
   - Implementacja funkcji generowania hash tekstu
   - Implementacja komunikacji z OpenRouter API

5. **Implementacja logiki bazy danych**
   - Utworzenie rekordu w tabeli `generations`
   - Implementacja aktualizacji metadanych po generowaniu
   - Obsługa transakcji bazodanowych

6. **Implementacja komunikacji z AI**
   - Konfiguracja klienta OpenRouter
   - Implementacja promptu dla generowania fiszek
   - Parsowanie i walidacja odpowiedzi AI

7. **Implementacja obsługi błędów**
   - Obsługa błędów komunikacji z AI
   - Logowanie błędów do `generation_error_logs`
   - Zwracanie odpowiednich kodów statusu

8. **Implementacja rate limiting**
   - Dodanie limitu generacji na użytkownika
   - Implementacja cache dla limitów
   - Obsługa błędów przekroczenia limitów

9. **Testy jednostkowe**
   - Testy walidacji danych wejściowych
   - Testy komunikacji z AI (mock)
   - Testy obsługi błędów

10. **Testy integracyjne**
    - Testy end-to-end z prawdziwym AI
    - Testy wydajności i limitów
    - Testy bezpieczeństwa

11. **Dokumentacja i monitoring**
    - Dokumentacja API endpointu
    - Konfiguracja metryk i alertów
    - Testy obciążeniowe
