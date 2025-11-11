# Pytania i zalecenia dotyczące architektury UI dla MVP 10xCards

## Pytania i zalecenia

1. **Czy główny widok aplikacji powinien być dashboardem z podsumowaniem statystyk i szybkim dostępem do kluczowych funkcji, czy raczej bezpośrednim widokiem do generowania fiszek?**

   ✅ Decyzja: Ekran powitania jako główny widok z możliwością przejścia do innych sekcji (Generowanie fiszek, Edycja fiszek). Przycisk/nawigacja do sesji nauki (implementacja na końcu).

2. **Jak powinien wyglądać przepływ generowania fiszek - czy jako osobna strona/route, czy jako modal/overlay na głównym widoku?**

   ✅ Decyzja: Osobna strona/route `/generate` z dedykowanym formularzem do wklejania tekstu (POST /api/generations). Po wygenerowaniu, automatyczne przekierowanie do widoku przeglądu propozycji `/generations/{generationId}` z możliwością akceptacji, edycji lub odrzucenia każdej propozycji. Edycja powinna odbywać się w modal/dialog (Shadcn/ui Dialog), a akceptacja/odrzucenie przez przyciski inline w liście propozycji.

3. **Czy lista fiszek powinna być dostępna jako osobna strona, czy zintegrowana z dashboardem jako sekcja?**

   ✅ Decyzja: Osobna strona `/flashcards` z pełną funkcjonalnością listy, filtrowania (query param `source`, `state`), sortowania (query param `sort`, `order`) i paginacji (query param `page`, `limit`).

4. **Jak powinien być zorganizowany widok sesji nauki - czy jako pełnoekranowy tryb nauki, czy jako komponent na stronie?**

   ✅ Decyzja: Pełnoekranowy tryb nauki na dedykowanej stronie `/study` z minimalnym UI (tylko fiszka, przyciski oceny, licznik postępu). Implementacja na końcu projektu.

5. **Jak powinna być obsługiwana autoryzacja i stan sesji użytkownika w kontekście Supabase Auth?**

   ✅ Decyzja: Użyć Supabase Auth client-side SDK do zarządzania sesją. Wszystkie requesty do API powinny automatycznie dołączać JWT token w headerze Authorization. Zaimplementować middleware/guard routes chroniące strony wymagające autoryzacji. Dla nieautoryzowanych użytkowników przekierować do `/login`. Stworzyć kontekst React lub hook do zarządzania stanem użytkownika i tokenem. Obsłużyć refresh token automatycznie przez Supabase SDK.

6. **Jak powinny być prezentowane i obsługiwane błędy API w interfejsie użytkownika?**

   ✅ Decyzja: Zaimplementować centralny system obsługi błędów z mapowaniem kodów HTTP na komunikaty użytkownika: 400 - wyświetlić szczegóły walidacji (Shadcn/ui Alert), 401 - przekierować do logowania z komunikatem, 404 - komunikat "Nie znaleziono" z przyciskiem powrotu, 409 - komunikat o duplikacie z sugestią edycji istniejącej fiszki, 500 - ogólny komunikat błędu z możliwością ponowienia. Użyć toast notifications (Shadcn/ui Toast) dla błędów operacji, a inline errors dla formularzy. Dla długotrwałych operacji (generowanie AI) pokazać progress indicator i możliwość anulowania.

7. **Jak powinna być zorganizowana nawigacja główna aplikacji - sidebar, topbar, czy bottom navigation?**

   ✅ Decyzja: Topbar z logo i głównymi linkami (Dashboard, Moje fiszki, Generuj, Nauka) oraz menu użytkownika (dropdown z Shadcn/ui DropdownMenu) zawierające profil i wylogowanie. Sidebar opcjonalnie dla większych ekranów (>1024px) jako dodatkowa nawigacja. Dla mobile (<768px) rozważyć bottom navigation lub hamburger menu. Wszystkie linki powinny być React Router links dla SPA experience w Astro.

8. **Jak powinien być zarządzany stan aplikacji - czy używać globalnego state management (Redux/Zustand), czy lokalnego stanu React z kontekstem?**

   ✅ Decyzja: Hybrydowe podejście: Zustand lub React Context dla globalnego stanu użytkownika i sesji, lokalny stan React dla komponentów formularzy i list z paginacją. Dla danych z API użyć React Query (TanStack Query) dla automatycznego cache'owania, synchronizacji i refetch. To zapewni optymalizację requestów, automatyczne invalidacje cache po mutacjach (POST/PUT/DELETE) i loading states out-of-the-box. Unikać duplikacji danych między komponentami.

9. **Jak powinna być obsługiwana responsywność interfejsu, szczególnie dla widoku sesji nauki i listy fiszek?**

   ✅ Decyzja: Mobile-first approach z Tailwind 4 breakpoints. Dla listy fiszek: na mobile pokazać kartę z awersem i przyciskiem "Pokaż więcej", na desktop pełną tabelę z wszystkimi kolumnami. Dla sesji nauki: na mobile pełnoekranowy widok z większymi przyciskami oceny (łatwiejsze dotknięcie), na desktop możliwość pokazania sidebaru z postępem. Dla formularza generowania: na mobile pełna szerokość textarea, na desktop ograniczona szerokość z centrowaniem. Użyć Shadcn/ui komponentów które są zbudowane z myślą o responsywności.

10. **Jak powinna być zaimplementowana dostępność (a11y) interfejsu, szczególnie dla operacji klawiaturowych i czytników ekranu?**

    ✅ Decyzja: Zapewnić pełną nawigację klawiaturową: Tab/Shift+Tab dla nawigacji, Enter/Space dla akcji, Escape dla zamykania modali. Dla sesji nauki: klawisze 1-4 dla ocen (1=Again, 2=Hard, 3=Good, 4=Easy), strzałki dla nawigacji między fiszkami. Wszystkie interaktywne elementy powinny mieć odpowiednie aria-labels i role. Użyć semantycznych tagów HTML. Shadcn/ui komponenty są zbudowane z myślą o a11y, ale należy zweryfikować custom komponenty. Dodać focus indicators i skip links dla głównych sekcji. Testować z czytnikami ekranu (NVDA/JAWS).

---

## Kolejne pytania i zalecenia

11. **Jak powinien wyglądać ekran powitania - jakie elementy powinien zawierać i jak powinien być zorganizowany?**

    ✅ Decyzja: Ekran powitania powinien zawierać: nagłówek powitalny z nazwą aplikacji, krótki opis funkcjonalności, duże przyciski CTA (Call-to-Action) prowadzące do głównych sekcji: "Generuj fiszki" (link do `/generate`), "Moje fiszki" (link do `/flashcards`), oraz opcjonalnie "Rozpocznij naukę" (link do `/study`, może być nieaktywny/disabled jeśli implementacja na końcu). Dla zalogowanych użytkowników można dodać krótkie podsumowanie (liczba fiszek, ostatnia aktywność). Użyć Shadcn/ui Button z variant="default" dla głównych akcji. Układ powinien być centrowany, minimalistyczny, z odpowiednimi odstępami.

12. **Jak powinna być zorganizowana struktura routingu w Astro - czy używać file-based routing Astro, czy React Router dla SPA?**

    ✅ Decyzja: Użyć file-based routing Astro dla głównych stron (`src/pages/index.astro` - ekran powitania, `src/pages/generate.astro` - generowanie, `src/pages/flashcards.astro` - lista fiszek, `src/pages/generations/[generationId].astro` - przegląd propozycji, `src/pages/login.astro` - logowanie, `src/pages/register.astro` - rejestracja). Wewnątrz każdej strony użyć React komponentów dla interaktywności. Dla nawigacji między stronami użyć standardowych linków `<a>` lub Astro `<Link>` component. React Router nie jest potrzebny, ponieważ Astro obsługuje routing na poziomie frameworka. Dla dynamicznych części (np. lista fiszek z paginacją) użyć React komponentów z React Query do zarządzania stanem.

13. **Jak powinien wyglądać formularz generowania fiszek - jakie pola, walidacja i feedback dla użytkownika?**

    ✅ Decyzja: Formularz powinien zawierać: pole textarea (Shadcn/ui Textarea) z placeholderem wskazującym limit 1000-10000 znaków, licznik znaków w czasie rzeczywistym, przycisk "Generuj" (Shadcn/ui Button) z loading state podczas generowania. Walidacja: sprawdzenie długości tekstu przed wysłaniem (1000-10000 znaków), wyświetlenie błędu inline jeśli nie spełnione. Podczas generowania: wyświetlić progress indicator (Shadcn/ui Progress lub Skeleton), możliwość anulowania jeśli API to wspiera. Po sukcesie: automatyczne przekierowanie do `/generations/{generationId}`. Użyć React Hook Form z Zod do walidacji po stronie klienta.

14. **Jak powinien być zorganizowany widok przeglądu propozycji fiszek - layout, sposób wyświetlania propozycji i akcje użytkownika?**

    ✅ Decyzja: Widok powinien wyświetlać listę propozycji w formie kart (Shadcn/ui Card), każda karta zawiera: awers (front) i rewers (back) z możliwością rozłożenia/zwinięcia, wskaźnik confidence (jeśli dostępny), przyciski akcji: "Akceptuj" (Shadcn/ui Button variant="default"), "Edytuj" (variant="outline"), "Odrzuć" (variant="ghost" lub "destructive"). Na górze strony: licznik propozycji, przycisk "Zapisz wszystkie zaakceptowane" (aktywny gdy są zaakceptowane propozycje). Edycja powinna otwierać modal (Shadcn/ui Dialog) z formularzem edycji awersu i rewersu. Po zapisaniu zmian propozycja jest automatycznie akceptowana. Użyć optymistycznych aktualizacji UI.

15. **Jak powinna być zaimplementowana lista fiszek - komponenty, filtry, sortowanie i paginacja?**

    ✅ Decyzja: Lista powinna używać React komponentu z React Query do pobierania danych (GET /api/flashcards z query params). Dla desktop: tabela (Shadcn/ui Table) z kolumnami: awers, rewers, źródło (source), data następnej powtórki (due), akcje (edycja, usunięcie). Dla mobile: karty (Shadcn/ui Card) z podstawowymi informacjami. Filtry: dropdown (Shadcn/ui Select) dla source i state. Sortowanie: dropdown dla pola sortowania i kierunku. Paginacja: Shadcn/ui Pagination component z wyświetlaniem informacji o stronie (np. "Strona 1 z 5"). Wszystkie filtry i sortowanie powinny być synchronizowane z URL query params dla możliwości udostępnienia linku.

16. **Jak powinien być zaimplementowany formularz ręcznego tworzenia/edycji fiszki - czy jako osobna strona, czy modal?**

    ✅ Decyzja: Modal (Shadcn/ui Dialog) otwierany z listy fiszek (przycisk "Dodaj fiszkę") lub z widoku przeglądu propozycji (przycisk "Edytuj"). Formularz powinien zawierać: pole tekstowe dla awersu (max 200 znaków, Shadcn/ui Input), pole textarea dla rewersu (max 500 znaków, Shadcn/ui Textarea), liczniki znaków, przyciski "Zapisz" i "Anuluj". Walidacja: sprawdzenie czy pola nie są puste i czy nie przekraczają limitów. Dla edycji: wstępne wypełnienie pól danymi fiszki. Po zapisaniu: zamknięcie modala, odświeżenie listy (React Query invalidate), wyświetlenie toast z potwierdzeniem. Użyć React Hook Form z Zod.

17. **Jak powinna być obsługiwana autoryzacja na poziomie routingu - middleware Astro czy guard w komponentach React?**

    ✅ Decyzja: Użyć Astro middleware (`src/middleware/index.ts`) do sprawdzania autoryzacji przed renderowaniem stron. Middleware powinien sprawdzać obecność i ważność JWT tokena z Supabase Auth. Dla nieautoryzowanych użytkowników próbujących dostać się do chronionych stron: przekierowanie do `/login` z parametrem `redirect` wskazującym docelową stronę. Dla stron publicznych (login, register): przekierowanie do `/` jeśli użytkownik jest już zalogowany. W komponentach React użyć hook `useAuth()` do sprawdzania stanu użytkownika dla warunkowego renderowania elementów UI.

18. **Jak powinny być zorganizowane strony logowania i rejestracji - layout, formularze i obsługa błędów?**

    ✅ Decyzja: Osobne strony `/login` i `/register` z centrowanym layoutem. Formularz logowania: pole email (Shadcn/ui Input type="email"), pole hasło (Shadcn/ui Input type="password" z możliwością pokazania/ukrycia), przycisk "Zaloguj się", link do rejestracji. Formularz rejestracji: email, hasło, potwierdzenie hasła, przycisk "Zarejestruj się", link do logowania. Walidacja: format email, minimalna długość hasła (8 znaków), zgodność haseł. Błędy: wyświetlić inline pod odpowiednim polem (Shadcn/ui Alert lub Text z variant="destructive"). Po sukcesie: automatyczne przekierowanie do ekranu powitania lub strony wskazanej w parametrze `redirect`. Użyć Supabase Auth SDK do logowania/rejestracji.

19. **Jak powinien być zorganizowany layout aplikacji - wspólny layout z topbarem dla wszystkich stron czy osobne layouty?**

    ✅ Decyzja: Wspólny layout Astro (`src/layouts/Layout.astro`) zawierający: topbar z logo, nawigacją i menu użytkownika, oraz `<slot />` dla treści stron. Topbar powinien być React komponentem (client-side) dla interaktywności (dropdown menu, stan zalogowania). Layout powinien być używany przez wszystkie strony z wyjątkiem login/register (które mogą mieć własny minimalistyczny layout). W layout wbudować provider dla React Query i Zustand/Context dla globalnego stanu. Dla mobile: topbar może przekształcić się w hamburger menu (Shadcn/ui Sheet).

20. **Jak powinna być obsługiwana walidacja formularzy - po stronie klienta, serwera, czy obu?**

    ✅ Decyzja: Walidacja po obu stronach. Po stronie klienta: React Hook Form z Zod schema dla natychmiastowego feedbacku użytkownika i lepszego UX. Walidacja powinna być zgodna z wymaganiami API (np. długość tekstu 1000-10000 znaków dla generowania, max 200/500 znaków dla fiszek). Po stronie serwera: API zwraca błędy walidacji (400 Bad Request) które powinny być wyświetlone w formularzu. Dla błędów z API: mapować odpowiedź na pola formularza i wyświetlić inline errors. Użyć Shadcn/ui Form components które integrują się z React Hook Form.

---

## Kolejne pytania i zalecenia

21. **Jak powinien być zorganizowany system zarządzania stanem użytkownika i sesji - gdzie przechowywać token JWT i jak synchronizować stan między komponentami?**

    ✅ Decyzja: Użyć Zustand store lub React Context dla globalnego stanu użytkownika. Token JWT powinien być przechowywany w Supabase Auth session (automatycznie zarządzany przez Supabase SDK), nie w localStorage bezpośrednio. Store powinien zawierać: stan użytkownika (user object z Supabase), loading state, error state. Hook `useAuth()` powinien subskrybować zmiany sesji Supabase i aktualizować store. Wszystkie komponenty wymagające informacji o użytkowniku powinny używać `useAuth()` hook. Dla synchronizacji między kartami przeglądarki: użyć Supabase Auth `onAuthStateChange` listener. Token powinien być automatycznie dołączany do requestów przez interceptor w kliencie API (np. axios interceptor lub fetch wrapper).

22. **Jak powinien być zorganizowany klient API do komunikacji z backendem - centralny serwis, czy rozproszone wywołania w komponentach?**

    ✅ Decyzja: Centralny klient API w `src/lib/api/client.ts` używający fetch lub axios, z automatycznym dołączaniem JWT tokena z Supabase Auth. Klient powinien obsługiwać: automatyczne dodawanie Authorization header, obsługę błędów (mapowanie kodów HTTP na wyjątki), retry logic dla błędów sieciowych, timeout handling. Dla każdego zasobu (generations, flashcards, study-session) stworzyć dedykowane funkcje w `src/lib/api/` (np. `generations.api.ts`, `flashcards.api.ts`). React Query powinien używać tych funkcji jako query functions. Dla optymalizacji: użyć React Query mutations dla POST/PUT/DELETE i queries dla GET. Wszystkie endpointy powinny być zdefiniowane jako stałe w `src/lib/api/endpoints.ts`.

23. **Jak powinna być obsługiwana paginacja w liście fiszek - infinite scroll, tradycyjna paginacja, czy obie opcje?**

    ✅ Decyzja: Tradycyjna paginacja z przyciskami (Shadcn/ui Pagination) dla MVP, ponieważ jest prostsza w implementacji i bardziej przewidywalna dla użytkownika. Paginacja powinna być synchronizowana z URL query params (`?page=1&limit=25`) dla możliwości udostępnienia linku. React Query powinien używać `page` i `limit` jako query keys dla cache'owania. Dla lepszego UX: pokazać skeleton loader podczas ładowania nowej strony. W przyszłości można rozważyć infinite scroll jako opcję, ale dla MVP tradycyjna paginacja jest wystarczająca. Wyświetlić informację o całkowitej liczbie stron i aktualnej stronie.

24. **Jak powinien być obsługiwany proces zapisywania zaakceptowanych propozycji fiszek - pojedyncze requesty czy batch request?**

    ✅ Decyzja: Pojedyncze requesty POST /api/flashcards dla każdej zaakceptowanej propozycji, ponieważ API nie ma endpointu batch. Użyć Promise.all() dla równoległego wysyłania requestów, co przyspieszy proces. Podczas zapisywania: wyświetlić progress indicator pokazujący postęp (np. "Zapisywanie 3 z 10"). Po zakończeniu: wyświetlić toast z podsumowaniem (np. "Zapisano 10 fiszek"), przekierować do `/flashcards` lub pozostać na stronie z możliwością powrotu. W przypadku błędów: wyświetlić które fiszki nie zostały zapisane i pozwolić na ponowienie próby. Użyć React Query mutations z optymistycznymi aktualizacjami dla lepszego UX.

25. **Jak powinien być zorganizowany system toast notifications - globalny provider czy lokalne komponenty?**

    ✅ Decyzja: Globalny provider toast (Shadcn/ui Toaster) w głównym layout aplikacji. Wszystkie komponenty powinny używać hook `useToast()` do wyświetlania powiadomień. Toast powinny być używane dla: sukcesów operacji (zapisanie fiszki, usunięcie), błędów operacji (nie udało się zapisać), informacji (sesja wygasła). Dla błędów formularzy: użyć inline errors zamiast toast. Toast powinny mieć odpowiednie warianty (success, error, info) i automatycznie znikać po 3-5 sekundach. Dla ważnych powiadomień: możliwość ręcznego zamknięcia. Provider powinien być renderowany w layout raz, a hook dostępny w całej aplikacji.

26. **Jak powinien być obsługiwany loading state podczas generowania fiszek przez AI - progress bar, skeleton, czy spinner?**

    ✅ Decyzja: Kombinacja: spinner/loader (Shadcn/ui Loader) z tekstem informującym o procesie (np. "Generowanie fiszek... To może zająć kilka sekund"), oraz progress indicator jeśli API zwraca informacje o postępie. Podczas generowania: wyłączyć przycisk "Generuj" i pokazać możliwość anulowania (jeśli API to wspiera). Dla długich operacji (>5 sekund): pokazać dodatkowe informacje (np. "To może zająć do 30 sekund"). Po zakończeniu: automatyczne przekierowanie do widoku propozycji. W przypadku błędu: wyświetlić komunikat błędu z możliwością ponowienia. Użyć React Query mutation z loading state.

27. **Jak powinna być obsługiwana edycja fiszki z listy - inline editing, modal, czy osobna strona?**

    ✅ Decyzja: Modal (Shadcn/ui Dialog) otwierany po kliknięciu przycisku "Edytuj" w liście fiszek. Modal powinien zawierać formularz z polami awers i rewers, wstępnie wypełniony danymi fiszki. Po zapisaniu: zamknięcie modala, odświeżenie listy (React Query invalidate), wyświetlenie toast z potwierdzeniem. Dla desktop: można rozważyć inline editing w przyszłości, ale dla MVP modal jest prostszy i bardziej spójny z resztą aplikacji. Modal powinien być responsywny i dobrze działać na mobile. Walidacja powinna być taka sama jak przy tworzeniu nowej fiszki.

28. **Jak powinien być obsługiwany proces usuwania fiszki - natychmiastowe usunięcie czy potwierdzenie?**

    ✅ Decyzja: Potwierdzenie przed usunięciem używając Shadcn/ui AlertDialog. Dialog powinien zawierać: pytanie potwierdzające (np. "Czy na pewno chcesz usunąć tę fiszkę?"), przyciski "Anuluj" i "Usuń". Po potwierdzeniu: optymistyczne usunięcie z UI (fiszka znika natychmiast), wysłanie requestu DELETE /api/flashcards/{id}, w przypadku błędu: przywrócenie fiszki i wyświetlenie błędu. Po sukcesie: wyświetlenie toast z potwierdzeniem. Dla lepszego UX: możliwość cofnięcia usunięcia przez toast (undo) jeśli użytkownik szybko zorientuje się, że usunął coś przez pomyłkę.

29. **Jak powinien być zorganizowany widok przeglądu propozycji - czy wszystkie propozycje na raz czy lazy loading?**

    ✅ Decyzja: Wszystkie propozycje na raz, ponieważ API zwraca wszystkie propozycje w jednej odpowiedzi (POST /api/generations zwraca tablicę proposals). Dla dużej liczby propozycji (>20): rozważyć wirtualizację listy (react-window lub react-virtuoso) dla lepszej wydajności, ale dla MVP zwykła lista jest wystarczająca. Każda propozycja powinna być renderowana jako karta (Shadcn/ui Card) z możliwością rozłożenia/zwinięcia rewersu. Dla lepszego UX: zapamiętać które propozycje są rozwinięte w lokalnym stanie React. Filtrowanie i sortowanie propozycji po stronie klienta nie jest potrzebne, ponieważ wszystkie są już zwrócone przez API.

30. **Jak powinna być obsługiwana responsywność topbara - hamburger menu na mobile czy zawsze widoczna nawigacja?**

    ✅ Decyzja: Hamburger menu (Shadcn/ui Sheet) na mobile (<768px) z listą linków nawigacyjnych. Na desktop (>=768px): zawsze widoczna nawigacja w topbarze. Menu powinno zawierać: linki do głównych sekcji (Dashboard, Moje fiszki, Generuj, Nauka), separator, menu użytkownika (profil, wylogowanie). Dla lepszego UX: pokazać aktywną sekcję w menu (highlight). Logo powinno być zawsze widoczne i prowadzić do ekranu powitania. Menu powinno być zamykane po kliknięciu linku na mobile. Użyć Tailwind breakpoints dla responsywności.
