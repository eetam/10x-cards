globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, q as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_BEHOjCPm.mjs';
import { j as jsxRuntimeExports, B as Button, e as apiClient, $ as $$Layout } from '../chunks/client_DXxObFE8.mjs';
import { a as reactExports } from '../chunks/_@astro-renderers_D9WLdofW.mjs';
export { r as renderers } from '../chunks/_@astro-renderers_D9WLdofW.mjs';
import { u as useQueryClient, Q as QueryClient, a as QueryClientProvider } from '../chunks/QueryClientProvider_Bwd_EYNw.mjs';
import { C as Card, b as CardContent, a as CardHeader, e as CardTitle, d as useQuery, u as useMutation, X } from '../chunks/card_TkRUOyCG.mjs';
import { c as createLucideIcon, L as LoaderCircle, A as Alert, C as CircleAlert, a as AlertTitle, b as AlertDescription } from '../chunks/index_O94rUJhX.mjs';
import { P as Progress } from '../chunks/progress_BEXoAnCm.mjs';
import { R as RefreshCw } from '../chunks/refresh-cw_9n-T0FOG.mjs';

/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$2 = [
  ["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
  ["path", { d: "M19 12H5", key: "x3x0zl" }]
];
const ArrowLeft = createLucideIcon("arrow-left", __iconNode$2);

/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode$1 = [
  ["path", { d: "M12 7v14", key: "1akyts" }],
  [
    "path",
    {
      d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
      key: "ruj8y"
    }
  ]
];
const BookOpen = createLucideIcon("book-open", __iconNode$1);

/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
];
const CircleCheck = createLucideIcon("circle-check", __iconNode);

function StudyProgress({ current, total }) {
  const percentage = total > 0 ? Math.round(current / total * 100) : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        current,
        " / ",
        total
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        percentage,
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: percentage, className: "h-2" })
  ] });
}

function FlashcardDisplay({ card, isRevealed }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-2xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "min-h-[200px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "flex items-center justify-center p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl text-center font-medium", children: card.front }) }) }),
    isRevealed && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "min-h-[200px] border-primary/50 bg-primary/5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "flex items-center justify-center p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xl text-center", children: card.back }) }) })
  ] });
}

const RATING_CONFIG = [
  { rating: 1, label: "Powtórz", sublabel: "1", variant: "destructive" },
  { rating: 2, label: "Trudne", sublabel: "2", variant: "secondary" },
  { rating: 3, label: "Dobrze", sublabel: "3", variant: "default" },
  { rating: 4, label: "Łatwe", sublabel: "4", variant: "outline" }
];
function RatingButtons({ onRating, isSubmitting }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap justify-center gap-3", children: RATING_CONFIG.map(({ rating, label, sublabel, variant }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Button,
    {
      variant,
      size: "lg",
      disabled: isSubmitting,
      onClick: () => onRating(rating),
      className: "min-w-[100px] flex-col h-auto py-3",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base font-medium", children: label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs opacity-70", children: sublabel })
      ]
    },
    rating
  )) });
}

function StudyComplete({ stats, onGoToDashboard, onStudyMore }) {
  const { reviewed, again, hard, good, easy } = stats;
  const accuracy = reviewed > 0 ? Math.round((good + easy) / reviewed * 100) : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "w-16 h-16 mx-auto text-green-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "Sesja zakończona!" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Gratulacje! Ukończyłeś wszystkie fiszki w tej sesji." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: "Podsumowanie" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-bold", children: reviewed }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Przejrzanych" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-3xl font-bold", children: [
              accuracy,
              "%"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Dokładność" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-2", children: "Rozkład ocen:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 gap-2 text-center text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-destructive", children: again }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Powtórz" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-orange-500", children: hard }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Trudne" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-green-500", children: good }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Dobrze" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-blue-500", children: easy }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Łatwe" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "flex-1", onClick: onGoToDashboard, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
        "Dashboard"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "flex-1", onClick: onStudyMore, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-4 h-4 mr-2" }),
        "Ucz się dalej"
      ] })
    ] })
  ] });
}

async function fetchStudySession(query = {}) {
  const params = new URLSearchParams();
  if (query.limit) params.set("limit", String(query.limit));
  const queryString = params.toString();
  const endpoint = queryString ? `/api/study-session?${queryString}` : "/api/study-session";
  return apiClient.get(endpoint);
}
async function submitReview(flashcardId, rating, responseTime) {
  return apiClient.post(`/api/flashcards/${flashcardId}/review`, {
    rating,
    responseTime
  });
}

const INITIAL_STATS = {
  reviewed: 0,
  again: 0,
  hard: 0,
  good: 0,
  easy: 0
};
function StudySession() {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = reactExports.useState(0);
  const [isRevealed, setIsRevealed] = reactExports.useState(false);
  const [sessionStats, setSessionStats] = reactExports.useState(INITIAL_STATS);
  const [cards, setCards] = reactExports.useState([]);
  const [isComplete, setIsComplete] = reactExports.useState(false);
  const {
    data: sessionData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["study-session"],
    queryFn: () => fetchStudySession({ limit: 20 }),
    staleTime: 0,
    // Always fetch fresh data
    refetchOnWindowFocus: false
  });
  reactExports.useEffect(() => {
    if (sessionData?.cards) {
      setCards(sessionData.cards);
      setCurrentIndex(0);
      setIsRevealed(false);
      setSessionStats(INITIAL_STATS);
      setIsComplete(false);
    }
  }, [sessionData]);
  const reviewMutation = useMutation({
    mutationFn: ({ flashcardId, rating }) => submitReview(flashcardId, rating),
    onSuccess: (_, { rating }) => {
      setSessionStats((prev) => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        again: rating === 1 ? prev.again + 1 : prev.again,
        hard: rating === 2 ? prev.hard + 1 : prev.hard,
        good: rating === 3 ? prev.good + 1 : prev.good,
        easy: rating === 4 ? prev.easy + 1 : prev.easy
      }));
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsRevealed(false);
      } else {
        setIsComplete(true);
      }
    }
  });
  const handleReveal = reactExports.useCallback(() => {
    setIsRevealed(true);
  }, []);
  const handleRating = reactExports.useCallback(
    (rating) => {
      const currentCard2 = cards[currentIndex];
      if (!currentCard2) return;
      reviewMutation.mutate({
        flashcardId: currentCard2.id,
        rating
      });
    },
    [cards, currentIndex, reviewMutation]
  );
  const handleExit = reactExports.useCallback(() => {
    window.location.replace("/");
  }, []);
  const handleStudyMore = reactExports.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["study-session"] });
    refetch();
  }, [queryClient, refetch]);
  reactExports.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      switch (event.code) {
        case "Space":
          event.preventDefault();
          if (!isRevealed && !isComplete) {
            handleReveal();
          }
          break;
        case "Digit1":
        case "Numpad1":
          if (isRevealed && !isComplete) {
            handleRating(1);
          }
          break;
        case "Digit2":
        case "Numpad2":
          if (isRevealed && !isComplete) {
            handleRating(2);
          }
          break;
        case "Digit3":
        case "Numpad3":
          if (isRevealed && !isComplete) {
            handleRating(3);
          }
          break;
        case "Digit4":
        case "Numpad4":
          if (isRevealed && !isComplete) {
            handleRating(4);
          }
          break;
        case "Escape":
          handleExit();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRevealed, isComplete, handleReveal, handleRating, handleExit]);
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center min-h-[400px] space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-8 h-8 animate-spin text-primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Ładowanie sesji nauki..." })
    ] });
  }
  if (error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md mx-auto space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { variant: "destructive", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertTitle, { children: "Błąd" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDescription, { children: "Nie udało się załadować sesji nauki. Spróbuj ponownie później." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: handleExit, children: "Wróć do dashboardu" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => refetch(), children: "Spróbuj ponownie" })
      ] })
    ] });
  }
  if (!cards.length) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md mx-auto text-center space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "w-16 h-16 mx-auto text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "Gratulacje!" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Nie masz fiszek do powtórki. Wszystkie zostały przerobione!" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-3 justify-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: handleExit, children: "Wróć do dashboardu" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => window.location.href = "/flashcards", children: "Przeglądaj fiszki" })
      ] })
    ] });
  }
  if (isComplete) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(StudyComplete, { stats: sessionStats, onGoToDashboard: handleExit, onStudyMore: handleStudyMore });
  }
  const currentCard = cards[currentIndex];
  if (!currentCard) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StudyProgress, { current: sessionStats.reviewed, total: cards.length }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: handleExit, title: "Zakończ (Escape)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "w-5 h-5" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(FlashcardDisplay, { card: currentCard, isRevealed }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: !isRevealed ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "lg", onClick: handleReveal, className: "min-w-[200px]", children: [
      "Pokaż odpowiedź",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 text-xs opacity-70", children: "(Spacja)" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(RatingButtons, { onRating: handleRating, isSubmitting: reviewMutation.isPending }) }),
    reviewMutation.isError && /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { variant: "destructive", className: "max-w-md mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDescription, { children: "Nie udało się zapisać oceny. Spróbuj ponownie." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-xs text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Skróty klawiszowe: Spacja - pokaż odpowiedź, 1-4 - oceń, Escape - zakończ" }) })
  ] });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});
function StudySessionWithProvider() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsx(StudySession, {}) });
}

const $$Study = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Sesja nauki - 10xCards" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-background"> <div class="container mx-auto px-4 py-8 max-w-4xl"> ${renderComponent($$result2, "StudySessionWithProvider", StudySessionWithProvider, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/mcalik/source/repos/10x-cards/src/components/study/StudySessionWithProvider", "client:component-export": "StudySessionWithProvider" })} </div> </main> ` })}`;
}, "C:/Users/mcalik/source/repos/10x-cards/src/pages/study.astro", void 0);

const $$file = "C:/Users/mcalik/source/repos/10x-cards/src/pages/study.astro";
const $$url = "/study";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Study,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
