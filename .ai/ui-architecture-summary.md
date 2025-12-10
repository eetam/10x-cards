# Podsumowanie planowania architektury UI dla MVP 10xCards

<conversation_summary>

<decisions>

1. Ekran powitania jako główny widok z możliwością przejścia do innych sekcji (Generowanie fiszek, Edycja fiszek). Przycisk/nawigacja do sesji nauki (implementacja na końcu).

2. Osobna strona/route `/generate` z dedykowanym formularzem do wklejania tekstu (POST /api/generations). Po wygenerowaniu, automatyczne przekierowanie do widoku przeglądu propozycji `/generations/{generationId}` z możliwością akceptacji, edycji lub odrzucenia każdej propozycji. Edycja powinna odbywać się w modal/dialog (Shadcn/ui Dialog), a akceptacja/odrzucenie przez przyciski inline w liście propozycji.

3. Osobna strona `/flashcards` z pełną funkcjonalnością listy, filtrowania (query param `source`, `state`), sortowania (query param `sort`, `order`) i paginacji (query param `page`, `limit`).

4. Pełnoekranowy tryb nauki na dedykowanej stronie `/study` z minimalnym UI (tylko fiszka, przyciski oceny, licznik postępu). Implementacja na końcu projektu.

5. Użyć Supabase Auth client-side SDK do zarządzania sesją. Wszystkie requesty do API powinny automatycznie dołączać JWT token w headerze Authorization. Zaimplementować middleware/guard routes chroniące strony wymagające autoryzacji. Dla nieautoryzowanych użytkowników przekierować do `/login`. Stworzyć kontekst React lub hook do zarządzania stanem użytkownika i tokenem. Obsłużyć refresh token automatycznie przez Supabase SDK.

6. Zaimplementować centralny system obsługi błędów z mapowaniem kodów HTTP na komunikaty użytkownika: 400 - wyświetlić szczegóły walidacji (Shadcn/ui Alert), 401 - przekierować do logowania z komunikatem, 404 - komunikat "Nie znaleziono" z przyciskiem powrotu, 409 - komunikat o duplikacie z sugestią edycji istniejącej fiszki, 500 - ogólny komunikat błędu z możliwością ponowienia. Użyć toast notifications (Shadcn/ui Toast) dla błędów operacji, a inline errors dla formularzy. Dla długotrwałych operacji (generowanie AI) pokazać progress indicator i możliwość anulowania.

7. Topbar z logo i głównymi linkami (Dashboard, Moje fiszki, Generuj, Nauka) oraz menu użytkownika (dropdown z Shadcn/ui DropdownMenu) zawierające profil i wylogowanie. Sidebar opcjonalnie dla większych ekranów (>1024px) jako dodatkowa nawigacja. Dla mobile (<768px) rozważyć bottom navigation lub hamburger menu. Wszystkie linki powinny być React Router links dla SPA experience w Astro.

8. Hybrydowe podejście: Zustand lub React Context dla globalnego stanu użytkownika i sesji, lokalny stan React dla komponentów formularzy i list z paginacją. Dla danych z API użyć React Query (TanStack Query) dla automatycznego cache'owania, synchronizacji i refetch. To zapewni optymalizację requestów, automatyczne invalidacje cache po mutacjach (POST/PUT/DELETE) i loading states out-of-the-box. Unikać duplikacji danych między komponentami.

9. Mobile-first approach z Tailwind 4 breakpoints. Dla listy fiszek: na mobile pokazać kartę z awersem i przyciskiem "Pokaż więcej", na desktop pełną tabelę z wszystkimi kolumnami. Dla sesji nauki: na mobile pełnoekranowy widok z większymi przyciskami oceny (łatwiejsze dotknięcie), na desktop możliwość pokazania sidebaru z postępem. Dla formularza generowania: na mobile pełna szerokość textarea, na desktop ograniczona szerokość z centrowaniem. Użyć Shadcn/ui komponentów które są zbudowane z myślą o responsywności.

10. Zapewnić pełną nawigację klawiaturową: Tab/Shift+Tab dla nawigacji, Enter/Space dla akcji, Escape dla zamykania modali. Dla sesji nauki: klawisze 1-4 dla ocen (1=Again, 2=Hard, 3=Good, 4=Easy), strzałki dla nawigacji między fiszkami. Wszystkie interaktywne elementy powinny mieć odpowiednie aria-labels i role. Użyć semantycznych tagów HTML. Shadcn/ui komponenty są zbudowane z myślą o a11y, ale należy zweryfikować custom komponenty. Dodać focus indicators i skip links dla głównych sekcji. Testować z czytnikami ekranu (NVDA/JAWS).

11. Ekran powitania powinien zawierać: nagłówek powitalny z nazwą aplikacji, krótki opis funkcjonalności, duże przyciski CTA (Call-to-Action) prowadzące do głównych sekcji: "Generuj fiszki" (link do `/generate`), "Moje fiszki" (link do `/flashcards`), oraz opcjonalnie "Rozpocznij naukę" (link do `/study`, może być nieaktywny/disabled jeśli implementacja na końcu). Dla zalogowanych użytkowników można dodać krótkie podsumowanie (liczba fiszek, ostatnia aktywność). Użyć Shadcn/ui Button z variant="default" dla głównych akcji. Układ powinien być centrowany, minimalistyczny, z odpowiednimi odstępami.

12. Użyć file-based routing Astro dla głównych stron (`src/pages/index.astro` - ekran powitania, `src/pages/generate.astro` - generowanie, `src/pages/flashcards.astro` - lista fiszek, `src/pages/generations/[generationId].astro` - przegląd propozycji, `src/pages/login.astro` - logowanie, `src/pages/register.astro` - rejestracja). Wewnątrz każdej strony użyć React komponentów dla interaktywności. Dla nawigacji między stronami użyć standardowych linków `<a>` lub Astro `<Link>` component. React Router nie jest potrzebny, ponieważ Astro obsługuje routing na poziomie frameworka. Dla dynamicznych części (np. lista fiszek z paginacją) użyć React komponentów z React Query do zarządzania stanem.

13. Formularz generowania fiszek powinien zawierać: pole textarea (Shadcn/ui Textarea) z placeholderem wskazującym limit 1000-10000 znaków, licznik znaków w czasie rzeczywistym, przycisk "Generuj" (Shadcn/ui Button) z loading state podczas generowania. Walidacja: sprawdzenie długości tekstu przed wysłaniem (1000-10000 znaków), wyświetlenie błędu inline jeśli nie spełnione. Podczas generowania: wyświetlić progress indicator (Shadcn/ui Progress lub Skeleton), możliwość anulowania jeśli API to wspiera. Po sukcesie: automatyczne przekierowanie do `/generations/{generationId}`. Użyć React Hook Form z Zod do walidacji po stronie klienta.

14. Widok przeglądu propozycji powinien wyświetlać listę propozycji w formie kart (Shadcn/ui Card), każda karta zawiera: awers (front) i rewers (back) z możliwością rozłożenia/zwinięcia, wskaźnik confidence (jeśli dostępny), przyciski akcji: "Akceptuj" (Shadcn/ui Button variant="default"), "Edytuj" (variant="outline"), "Odrzuć" (variant="ghost" lub "destructive"). Na górze strony: licznik propozycji, przycisk "Zapisz wszystkie zaakceptowane" (aktywny gdy są zaakceptowane propozycje). Edycja powinna otwierać modal (Shadcn/ui Dialog) z formularzem edycji awersu i rewersu. Po zapisaniu zmian propozycja jest automatycznie akceptowana. Użyć optymistycznych aktualizacji UI.

15. Lista fiszek powinna używać React komponentu z React Query do pobierania danych (GET /api/flashcards z query params). Dla desktop: tabela (Shadcn/ui Table) z kolumnami: awers, rewers, źródło (source), data następnej powtórki (due), akcje (edycja, usunięcie). Dla mobile: karty (Shadcn/ui Card) z podstawowymi informacjami. Filtry: dropdown (Shadcn/ui Select) dla source i state. Sortowanie: dropdown dla pola sortowania i kierunku. Paginacja: Shadcn/ui Pagination component z wyświetlaniem informacji o stronie (np. "Strona 1 z 5"). Wszystkie filtry i sortowanie powinny być synchronizowane z URL query params dla możliwości udostępnienia linku.

16. Modal (Shadcn/ui Dialog) otwierany z listy fiszek (przycisk "Dodaj fiszkę") lub z widoku przeglądu propozycji (przycisk "Edytuj"). Formularz powinien zawierać: pole tekstowe dla awersu (max 200 znaków, Shadcn/ui Input), pole textarea dla rewersu (max 500 znaków, Shadcn/ui Textarea), liczniki znaków, przyciski "Zapisz" i "Anuluj". Walidacja: sprawdzenie czy pola nie są puste i czy nie przekraczają limitów. Dla edycji: wstępne wypełnienie pól danymi fiszki. Po zapisaniu: zamknięcie modala, odświeżenie listy (React Query invalidate), wyświetlenie toast z potwierdzeniem. Użyć React Hook Form z Zod.

17. Użyć Astro middleware (`src/middleware/index.ts`) do sprawdzania autoryzacji przed renderowaniem stron. Middleware powinien sprawdzać obecność i ważność JWT tokena z Supabase Auth. Dla nieautoryzowanych użytkowników próbujących dostać się do chronionych stron: przekierowanie do `/login` z parametrem `redirect` wskazującym docelową stronę. Dla stron publicznych (login, register): przekierowanie do `/` jeśli użytkownik jest już zalogowany. W komponentach React użyć hook `useAuth()` do sprawdzania stanu użytkownika dla warunkowego renderowania elementów UI.

18. Osobne strony `/login` i `/register` z centrowanym layoutem. Formularz logowania: pole email (Shadcn/ui Input type="email"), pole hasło (Shadcn/ui Input type="password" z możliwością pokazania/ukrycia), przycisk "Zaloguj się", link do rejestracji. Formularz rejestracji: email, hasło, potwierdzenie hasła, przycisk "Zarejestruj się", link do logowania. Walidacja: format email, minimalna długość hasła (8 znaków), zgodność haseł. Błędy: wyświetlić inline pod odpowiednim polem (Shadcn/ui Alert lub Text z variant="destructive"). Po sukcesie: automatyczne przekierowanie do ekranu powitania lub strony wskazanej w parametrze `redirect`. Użyć Supabase Auth SDK do logowania/rejestracji.

19. Wspólny layout Astro (`src/layouts/Layout.astro`) zawierający: topbar z logo, nawigacją i menu użytkownika, oraz `<slot />` dla treści stron. Topbar powinien być React komponentem (client-side) dla interaktywności (dropdown menu, stan zalogowania). Layout powinien być używany przez wszystkie strony z wyjątkiem login/register (które mogą mieć własny minimalistyczny layout). W layout wbudować provider dla React Query i Zustand/Context dla globalnego stanu. Dla mobile: topbar może przekształcić się w hamburger menu (Shadcn/ui Sheet).

20. Walidacja po obu stronach. Po stronie klienta: React Hook Form z Zod schema dla natychmiastowego feedbacku użytkownika i lepszego UX. Walidacja powinna być zgodna z wymaganiami API (np. długość tekstu 1000-10000 znaków dla generowania, max 200/500 znaków dla fiszek). Po stronie serwera: API zwraca błędy walidacji (400 Bad Request) które powinny być wyświetlone w formularzu. Dla błędów z API: mapować odpowiedź na pola formularza i wyświetlić inline errors. Użyć Shadcn/ui Form components które integrują się z React Hook Form.

21. Użyć Zustand store lub React Context dla globalnego stanu użytkownika. Token JWT powinien być przechowywany w Supabase Auth session (automatycznie zarządzany przez Supabase SDK), nie w localStorage bezpośrednio. Store powinien zawierać: stan użytkownika (user object z Supabase), loading state, error state. Hook `useAuth()` powinien subskrybować zmiany sesji Supabase i aktualizować store. Wszystkie komponenty wymagające informacji o użytkowniku powinny używać `useAuth()` hook. Dla synchronizacji między kartami przeglądarki: użyć Supabase Auth `onAuthStateChange` listener. Token powinien być automatycznie dołączany do requestów przez interceptor w kliencie API (np. axios interceptor lub fetch wrapper).

22. Centralny klient API w `src/lib/api/client.ts` używający fetch lub axios, z automatycznym dołączaniem JWT tokena z Supabase Auth. Klient powinien obsługiwać: automatyczne dodawanie Authorization header, obsługę błędów (mapowanie kodów HTTP na wyjątki), retry logic dla błędów sieciowych, timeout handling. Dla każdego zasobu (generations, flashcards, study-session) stworzyć dedykowane funkcje w `src/lib/api/` (np. `generations.api.ts`, `flashcards.api.ts`). React Query powinien używać tych funkcji jako query functions. Dla optymalizacji: użyć React Query mutations dla POST/PUT/DELETE i queries dla GET. Wszystkie endpointy powinny być zdefiniowane jako stałe w `src/lib/api/endpoints.ts`.

23. Tradycyjna paginacja z przyciskami (Shadcn/ui Pagination) dla MVP, ponieważ jest prostsza w implementacji i bardziej przewidywalna dla użytkownika. Paginacja powinna być synchronizowana z URL query params (`?page=1&limit=25`) dla możliwości udostępnienia linku. React Query powinien używać `page` i `limit` jako query keys dla cache'owania. Dla lepszego UX: pokazać skeleton loader podczas ładowania nowej strony. W przyszłości można rozważyć infinite scroll jako opcję, ale dla MVP tradycyjna paginacja jest wystarczająca. Wyświetlić informację o całkowitej liczbie stron i aktualnej stronie.

24. Pojedyncze requesty POST /api/flashcards dla każdej zaakceptowanej propozycji, ponieważ API nie ma endpointu batch. Użyć Promise.all() dla równoległego wysyłania requestów, co przyspieszy proces. Podczas zapisywania: wyświetlić progress indicator pokazujący postęp (np. "Zapisywanie 3 z 10"). Po zakończeniu: wyświetlić toast z podsumowaniem (np. "Zapisano 10 fiszek"), przekierować do `/flashcards` lub pozostać na stronie z możliwością powrotu. W przypadku błędów: wyświetlić które fiszki nie zostały zapisane i pozwolić na ponowienie próby. Użyć React Query mutations z optymistycznymi aktualizacjami dla lepszego UX.

25. Globalny provider toast (Shadcn/ui Toaster) w głównym layout aplikacji. Wszystkie komponenty powinny używać hook `useToast()` do wyświetlania powiadomień. Toast powinny być używane dla: sukcesów operacji (zapisanie fiszki, usunięcie), błędów operacji (nie udało się zapisać), informacji (sesja wygasła). Dla błędów formularzy: użyć inline errors zamiast toast. Toast powinny mieć odpowiednie warianty (success, error, info) i automatycznie znikać po 3-5 sekundach. Dla ważnych powiadomień: możliwość ręcznego zamknięcia. Provider powinien być renderowany w layout raz, a hook dostępny w całej aplikacji.

26. Kombinacja: spinner/loader (Shadcn/ui Loader) z tekstem informującym o procesie (np. "Generowanie fiszek... To może zająć kilka sekund"), oraz progress indicator jeśli API zwraca informacje o postępie. Podczas generowania: wyłączyć przycisk "Generuj" i pokazać możliwość anulowania (jeśli API to wspiera). Dla długich operacji (>5 sekund): pokazać dodatkowe informacje (np. "To może zająć do 30 sekund"). Po zakończeniu: automatyczne przekierowanie do widoku propozycji. W przypadku błędu: wyświetlić komunikat błędu z możliwością ponowienia. Użyć React Query mutation z loading state.

27. Modal (Shadcn/ui Dialog) otwierany po kliknięciu przycisku "Edytuj" w liście fiszek. Modal powinien zawierać formularz z polami awers i rewers, wstępnie wypełniony danymi fiszki. Po zapisaniu: zamknięcie modala, odświeżenie listy (React Query invalidate), wyświetlenie toast z potwierdzeniem. Dla desktop: można rozważyć inline editing w przyszłości, ale dla MVP modal jest prostszy i bardziej spójny z resztą aplikacji. Modal powinien być responsywny i dobrze działać na mobile. Walidacja powinna być taka sama jak przy tworzeniu nowej fiszki.

28. Potwierdzenie przed usunięciem używając Shadcn/ui AlertDialog. Dialog powinien zawierać: pytanie potwierdzające (np. "Czy na pewno chcesz usunąć tę fiszkę?"), przyciski "Anuluj" i "Usuń". Po potwierdzeniu: optymistyczne usunięcie z UI (fiszka znika natychmiast), wysłanie requestu DELETE /api/flashcards/{id}, w przypadku błędu: przywrócenie fiszki i wyświetlenie błędu. Po sukcesie: wyświetlenie toast z potwierdzeniem. Dla lepszego UX: możliwość cofnięcia usunięcia przez toast (undo) jeśli użytkownik szybko zorientuje się, że usunął coś przez pomyłkę.

29. Wszystkie propozycje na raz, ponieważ API zwraca wszystkie propozycje w jednej odpowiedzi (POST /api/generations zwraca tablicę proposals). Dla dużej liczby propozycji (>20): rozważyć wirtualizację listy (react-window lub react-virtuoso) dla lepszej wydajności, ale dla MVP zwykła lista jest wystarczająca. Każda propozycja powinna być renderowana jako karta (Shadcn/ui Card) z możliwością rozłożenia/zwinięcia rewersu. Dla lepszego UX: zapamiętać które propozycje są rozwinięte w lokalnym stanie React. Filtrowanie i sortowanie propozycji po stronie klienta nie jest potrzebne, ponieważ wszystkie są już zwrócone przez API.

30. Hamburger menu (Shadcn/ui Sheet) na mobile (<768px) z listą linków nawigacyjnych. Na desktop (>=768px): zawsze widoczna nawigacja w topbarze. Menu powinno zawierać: linki do głównych sekcji (Dashboard, Moje fiszki, Generuj, Nauka), separator, menu użytkownika (profil, wylogowanie). Dla lepszego UX: pokazać aktywną sekcję w menu (highlight). Logo powinno być zawsze widoczne i prowadzić do ekranu powitania. Menu powinno być zamykane po kliknięciu linku na mobile. Użyć Tailwind breakpoints dla responsywności.

</decisions>

<matched_recommendations>

1. **Architektura routingu**: File-based routing Astro z React komponentami dla interaktywności. Struktura stron: `/` (ekran powitania), `/generate` (generowanie), `/flashcards` (lista), `/generations/[generationId]` (przegląd propozycji), `/login`, `/register`, `/study` (sesja nauki - implementacja na końcu).

2. **Zarządzanie stanem**: Hybrydowe podejście - Zustand/React Context dla globalnego stanu użytkownika, React Query dla danych z API, lokalny stan React dla komponentów formularzy i list.

3. **Klient API**: Centralny klient w `src/lib/api/client.ts` z automatycznym dołączaniem JWT tokena, obsługą błędów, retry logic i timeout handling. Dedykowane funkcje API dla każdego zasobu.

4. **Autoryzacja**: Astro middleware do ochrony routes, Supabase Auth SDK do zarządzania sesją, hook `useAuth()` dla komponentów React.

5. **Komponenty UI**: Shadcn/ui jako podstawowa biblioteka komponentów. Wykorzystanie: Button, Card, Dialog, Table, Input, Textarea, Select, Pagination, AlertDialog, Toast, Sheet, Progress, Loader.

6. **Walidacja formularzy**: React Hook Form z Zod schema po stronie klienta, walidacja po stronie serwera przez API, mapowanie błędów API na pola formularza.

7. **Obsługa błędów**: Centralny system z mapowaniem kodów HTTP na komunikaty użytkownika. Toast notifications dla operacji, inline errors dla formularzy.

8. **Responsywność**: Mobile-first approach z Tailwind 4 breakpoints. Różne layouty dla mobile (karty) i desktop (tabele), hamburger menu na mobile, zawsze widoczna nawigacja na desktop.

9. **Dostępność**: Pełna nawigacja klawiaturowa, aria-labels i role, semantyczne tagi HTML, focus indicators, skip links, testowanie z czytnikami ekranu.

10. **Optymalizacja UX**: Optymistyczne aktualizacje UI, skeleton loaders, progress indicators, możliwość cofnięcia operacji (undo), synchronizacja stanu z URL query params.

</matched_recommendations>

<ui_architecture_planning_summary>

## Główne wymagania dotyczące architektury UI

Aplikacja 10xCards MVP będzie zbudowana na Astro 5 z React 19 dla komponentów interaktywnych. Główny stack technologiczny obejmuje: TypeScript 5, Tailwind 4, Shadcn/ui jako bibliotekę komponentów, Supabase Auth dla autoryzacji, React Query (TanStack Query) dla zarządzania danymi z API, oraz React Hook Form z Zod dla walidacji formularzy.

## Kluczowe widoki, ekrany i przepływy użytkownika

### Struktura routingu i widoków

1. **Ekran powitania** (`/`): Centrowany, minimalistyczny layout z nagłówkiem, opisem aplikacji i dużymi przyciskami CTA prowadzącymi do głównych sekcji. Dla zalogowanych użytkowników - krótkie podsumowanie (liczba fiszek, ostatnia aktywność).

2. **Generowanie fiszek** (`/generate`): Formularz z textarea (limit 1000-10000 znaków), licznik znaków, przycisk "Generuj" z loading state. Po wygenerowaniu - automatyczne przekierowanie do `/generations/{generationId}`.

3. **Przegląd propozycji** (`/generations/[generationId]`): Lista propozycji w formie kart z możliwością rozłożenia/zwinięcia rewersu. Każda karta ma przyciski: Akceptuj, Edytuj (otwiera modal), Odrzuć. Przycisk "Zapisz wszystkie zaakceptowane" na górze strony.

4. **Lista fiszek** (`/flashcards`): Tabela na desktop, karty na mobile. Filtry (source, state), sortowanie (createdAt, updatedAt, due), paginacja z synchronizacją URL query params. Akcje: edycja (modal), usunięcie (z potwierdzeniem).

5. **Sesja nauki** (`/study`): Pełnoekranowy tryb nauki z minimalnym UI - fiszka, przyciski oceny (1-4), licznik postępu. Implementacja na końcu projektu.

6. **Autoryzacja** (`/login`, `/register`): Osobne strony z centrowanym layoutem, formularzami z walidacją, inline errors. Po sukcesie - przekierowanie z parametrem `redirect`.

### Przepływy użytkownika

**Przepływ generowania fiszek:**

1. Użytkownik wkleja tekst na `/generate`
2. Kliknięcie "Generuj" → wyświetlenie progress indicator
3. Po sukcesie → przekierowanie do `/generations/{generationId}`
4. Przeglądanie propozycji, akceptacja/edycja/odrzucenie
5. Kliknięcie "Zapisz wszystkie zaakceptowane" → progress indicator → toast z podsumowaniem → opcjonalne przekierowanie do `/flashcards`

**Przepływ zarządzania fiszkami:**

1. Lista fiszek na `/flashcards` z filtrami i sortowaniem
2. Dodanie nowej fiszki → modal z formularzem
3. Edycja → modal z wstępnie wypełnionymi polami
4. Usunięcie → AlertDialog z potwierdzeniem → optymistyczne usunięcie → toast z możliwością undo

**Przepływ autoryzacji:**

1. Próba dostępu do chronionej strony → middleware sprawdza JWT
2. Brak autoryzacji → przekierowanie do `/login?redirect=/docelowa-strona`
3. Logowanie/rejestracja → Supabase Auth SDK → automatyczne przekierowanie

## Strategia integracji z API i zarządzania stanem

### Klient API

Centralny klient API w `src/lib/api/client.ts` z:

- Automatycznym dołączaniem JWT tokena z Supabase Auth
- Mapowaniem kodów HTTP na wyjątki
- Retry logic dla błędów sieciowych
- Timeout handling
- Dedykowane funkcje dla każdego zasobu (`generations.api.ts`, `flashcards.api.ts`, `study-session.api.ts`)
- Stałe endpointy w `src/lib/api/endpoints.ts`

### Zarządzanie stanem

**Trójwarstwowe podejście:**

1. **Globalny stan użytkownika**: Zustand store lub React Context z hookiem `useAuth()`, subskrypcja zmian sesji Supabase przez `onAuthStateChange`
2. **Dane z API**: React Query dla automatycznego cache'owania, synchronizacji, refetch, invalidacji po mutacjach
3. **Lokalny stan**: React useState dla formularzy, list z paginacją, stanu modali

### Integracja z React Query

- **Queries** dla GET: `useQuery` dla listy fiszek, generacji, sesji nauki
- **Mutations** dla POST/PUT/DELETE: `useMutation` z optymistycznymi aktualizacjami
- **Query keys** z parametrami paginacji/filtrowania dla cache'owania
- **Automatyczne invalidacje** po mutacjach (np. po utworzeniu fiszki → invalidate listy)

## Kwestie dotyczące responsywności, dostępności i bezpieczeństwa

### Responsywność

**Mobile-first approach z Tailwind 4:**

- Breakpoint 768px: hamburger menu zamiast topbara
- Breakpoint 1024px: opcjonalny sidebar
- Lista fiszek: karty na mobile, tabela na desktop
- Sesja nauki: większe przyciski na mobile, sidebar z postępem na desktop
- Formularze: pełna szerokość na mobile, ograniczona z centrowaniem na desktop

### Dostępność (a11y)

- **Nawigacja klawiaturowa**: Tab/Shift+Tab, Enter/Space, Escape
- **Sesja nauki**: klawisze 1-4 dla ocen, strzałki dla nawigacji
- **Semantyczne tagi HTML**: proper heading hierarchy, landmarks
- **ARIA**: aria-labels, roles dla wszystkich interaktywnych elementów
- **Focus management**: focus indicators, skip links, trap focus w modalach
- **Testowanie**: NVDA/JAWS dla czytników ekranu

### Bezpieczeństwo

- **Autoryzacja**: Astro middleware sprawdzający JWT przed renderowaniem stron
- **Token management**: Supabase Auth SDK zarządza tokenami, automatyczny refresh
- **API requests**: Wszystkie requesty wymagają JWT w headerze Authorization
- **Row-Level Security**: RLS w Supabase zapewnia izolację danych użytkowników
- **Walidacja**: Podwójna walidacja - klient (Zod) i serwer (API)
- **Error handling**: Nie ujawnianie szczegółów błędów serwera użytkownikowi

## Struktura komponentów i organizacja kodu

### Struktura katalogów

```
src/
├── pages/              # Astro pages (file-based routing)
│   ├── index.astro
│   ├── generate.astro
│   ├── flashcards.astro
│   ├── generations/[generationId].astro
│   ├── login.astro
│   ├── register.astro
│   └── study.astro
├── layouts/            # Astro layouts
│   └── Layout.astro
├── components/         # React komponenty
│   ├── ui/            # Shadcn/ui komponenty
│   ├── flashcard/     # Komponenty fiszek
│   ├── generation/     # Komponenty generowania
│   └── study/         # Komponenty sesji nauki
├── lib/
│   ├── api/           # Klient API i funkcje
│   │   ├── client.ts
│   │   ├── endpoints.ts
│   │   ├── generations.api.ts
│   │   ├── flashcards.api.ts
│   │   └── study-session.api.ts
│   ├── hooks/         # Custom hooks
│   │   └── useAuth.ts
│   └── stores/        # Zustand stores
│       └── auth.store.ts
└── middleware/        # Astro middleware
    └── index.ts
```

### Komponenty UI (Shadcn/ui)

Wykorzystane komponenty: Button, Card, Dialog, Table, Input, Textarea, Select, Pagination, AlertDialog, Toast (Toaster), Sheet, Progress, Loader, Alert, Form (z integracją React Hook Form).

</ui_architecture_planning_summary>

<unresolved_issues>

1. **Anulowanie generowania AI**: Nie jest jasne, czy API wspiera anulowanie długotrwałego procesu generowania. Jeśli nie, należy rozważyć implementację timeout lub innego mechanizmu.

2. **Wirtualizacja listy propozycji**: Dla dużej liczby propozycji (>20) rozważono wirtualizację, ale nie podjęto ostatecznej decyzji. Należy monitorować wydajność podczas implementacji.

3. **Undo dla usuwania fiszek**: Zaproponowano możliwość cofnięcia usunięcia przez toast, ale szczegóły implementacji (czas trwania, sposób przechowywania danych) wymagają doprecyzowania.

4. **Sidebar na desktop**: Opcjonalny sidebar dla ekranów >1024px został wspomniany, ale nie określono jego zawartości ani funkcjonalności.

5. **Profil użytkownika**: W menu użytkownika wspomniano "profil", ale nie zdefiniowano, jakie funkcje powinien zawierać (zmiana hasła, ustawienia, statystyki).

6. **Statystyki na ekranie powitania**: Dla zalogowanych użytkowników zaproponowano krótkie podsumowanie, ale nie określono, które konkretnie dane powinny być wyświetlane ani czy wymagają dedykowanego endpointu API.

7. **Obsługa offline**: Nie rozważono strategii obsługi offline lub cache'owania danych dla pracy bez połączenia internetowego.

8. **Rate limiting**: Nie określono, jak UI powinno reagować na błędy 429 (Too Many Requests) z API.

9. **Wielojęzyczność**: Aplikacja generuje fiszki w języku wykrytym przez AI, ale nie rozważono interfejsu wielojęzycznego dla samej aplikacji.

10. **Testy UI**: Nie określono strategii testowania komponentów UI (unit tests, integration tests, E2E tests).

</unresolved_issues>

</conversation_summary>

