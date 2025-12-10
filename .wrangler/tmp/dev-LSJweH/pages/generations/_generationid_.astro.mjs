globalThis.process ??= {}; globalThis.process.env ??= {};
import { o as objectType, k as stringType, e as createComponent, f as createAstro, q as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_BEHOjCPm.mjs';
import { j as jsxRuntimeExports, B as Button, a as cn, A as ApiClientError, $ as $$Layout } from '../../chunks/client_DXxObFE8.mjs';
import { a as reactExports } from '../../chunks/_@astro-renderers_D9WLdofW.mjs';
export { r as renderers } from '../../chunks/_@astro-renderers_D9WLdofW.mjs';
import { Q as QueryClient, a as QueryClientProvider } from '../../chunks/QueryClientProvider_Bwd_EYNw.mjs';
import { C as Card, a as CardHeader, e as CardTitle, b as CardContent, c as CardFooter, X, d as useQuery, u as useMutation } from '../../chunks/card_TkRUOyCG.mjs';
import { a as getGenerationDetails } from '../../chunks/generations_C3HokjSN.mjs';
import { G as formatDate, H as formatISO8601Duration, B as Badge, i as Collapsible, k as CollapsibleTrigger, C as ChevronDown, j as CollapsibleContent, f as Check, m as Dialog, n as DialogContent, o as DialogHeader, p as DialogTitle, q as DialogDescription, I as Input, J as DialogFooter, l as createFlashcard } from '../../chunks/flashcards_Dvdk7nev.mjs';
import { c as createLucideIcon, L as LoaderCircle, A as Alert, C as CircleAlert, b as AlertDescription } from '../../chunks/index_O94rUJhX.mjs';
import { u as useForm, a, F as Form, b as FormField, c as FormItem, d as FormLabel, C as CharacterCounter, e as FormControl, f as FormMessage, T as Textarea } from '../../chunks/CharacterCounter_BlHqu2lW.mjs';
import { P as Progress } from '../../chunks/progress_BEXoAnCm.mjs';

/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */


const __iconNode = [
  ["path", { d: "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", key: "1m0v6g" }],
  [
    "path",
    {
      d: "M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",
      key: "ohrbg2"
    }
  ]
];
const SquarePen = createLucideIcon("square-pen", __iconNode);

function GenerationHeader({ generation }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "Przegląd propozycji fiszek" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Data utworzenia:" }),
        " ",
        formatDate(generation.createdAt)
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Model AI:" }),
        " ",
        generation.model
      ] }),
      generation.generationDuration && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Czas trwania:" }),
        " ",
        formatISO8601Duration(generation.generationDuration)
      ] })
    ] })
  ] });
}

function ProposalsCounter({ total, accepted }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-muted-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: accepted }),
    " z ",
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: total }),
    " zaakceptowanych"
  ] });
}

function SaveAllButton({ acceptedCount, isSaving, onSave }) {
  const isDisabled = acceptedCount === 0 || isSaving;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onSave, disabled: isDisabled, size: "lg", children: isSaving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 size-4 animate-spin" }),
    "Zapisywanie..."
  ] }) : `Zapisz wszystkie zaakceptowane (${acceptedCount})` });
}

function getStatusBadgeVariant(status) {
  switch (status) {
    case "accepted":
      return "default";
    case "edited":
      return "secondary";
    case "rejected":
      return "outline";
    default:
      return "outline";
  }
}
function getStatusLabel(status) {
  switch (status) {
    case "pending":
      return "Oczekująca";
    case "accepted":
      return "Zaakceptowana";
    case "edited":
      return "Edytowana";
    case "rejected":
      return "Odrzucona";
    default:
      return "Nieznany";
  }
}
function ProposalCard({
  proposal,
  index,
  isBackExpanded,
  onToggleBack,
  onAccept,
  onEdit,
  onReject
}) {
  const displayFront = proposal.editedFront ?? proposal.front;
  const displayBack = proposal.editedBack ?? proposal.back;
  const isPending = proposal.status === "pending";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: displayFront }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        proposal.confidence !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "text-xs", children: [
          (proposal.confidence * 100).toFixed(0),
          "% pewności"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: getStatusBadgeVariant(proposal.status), children: getStatusLabel(proposal.status) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Collapsible, { open: isBackExpanded, onOpenChange: () => onToggleBack(index), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "w-full justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: isBackExpanded ? "Ukryj odpowiedź" : "Pokaż odpowiedź" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: cn("size-4 transition-transform", isBackExpanded && "rotate-180") })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleContent, { className: "pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border bg-muted/50 p-4 text-sm", children: displayBack }) })
    ] }) }),
    isPending && /* @__PURE__ */ jsxRuntimeExports.jsxs(CardFooter, { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "default", size: "sm", onClick: () => onAccept(index), className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "mr-2 size-4" }),
        "Akceptuj"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => onEdit(index), className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SquarePen, { className: "mr-2 size-4" }),
        "Edytuj"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => onReject(index), className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "mr-2 size-4" }),
        "Odrzuć"
      ] })
    ] })
  ] });
}

function ProposalsList({
  proposals,
  expandedBacks,
  onToggleBack,
  onProposalStatusChange,
  onProposalEdit
}) {
  const handleAccept = (index) => {
    onProposalStatusChange(index, "accepted");
  };
  const handleReject = (index) => {
    onProposalStatusChange(index, "rejected");
  };
  const handleEdit = (index) => {
    onProposalEdit(index);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-1 lg:grid-cols-2", children: proposals.map((proposal, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    ProposalCard,
    {
      proposal,
      index,
      isBackExpanded: expandedBacks.has(index),
      onToggleBack,
      onAccept: handleAccept,
      onEdit: handleEdit,
      onReject: handleReject
    },
    index
  )) });
}

const MAX_FRONT_LENGTH = 200;
const MAX_BACK_LENGTH = 500;
const EditProposalSchema = objectType({
  front: stringType().trim().min(1, "Awers nie może być pusty").max(MAX_FRONT_LENGTH, `Awers nie może przekraczać ${MAX_FRONT_LENGTH} znaków`),
  back: stringType().trim().min(1, "Rewers nie może być pusty").max(MAX_BACK_LENGTH, `Rewers nie może przekraczać ${MAX_BACK_LENGTH} znaków`)
});

function EditProposalDialog({ open, onOpenChange, proposal, proposalIndex, onSave }) {
  const [isSaving, setIsSaving] = reactExports.useState(false);
  const form = useForm({
    resolver: a(EditProposalSchema),
    defaultValues: {
      front: proposal.front,
      back: proposal.back
    },
    mode: "onChange"
  });
  reactExports.useEffect(() => {
    if (open) {
      form.reset({
        front: proposal.front,
        back: proposal.back
      });
    }
  }, [open, proposal, form]);
  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      await onSave(proposalIndex, data.front.trim(), data.back.trim());
      onOpenChange(false);
    } catch {
    } finally {
      setIsSaving(false);
    }
  };
  const frontValue = form.watch("front");
  const backValue = form.watch("back");
  const frontLength = frontValue?.length ?? 0;
  const backLength = backValue?.length ?? 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Edytuj propozycję fiszki" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { children: "Wprowadź zmiany w awersie i rewersie fiszki. Po zapisaniu propozycja zostanie automatycznie zaakceptowana." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Form, { ...form, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FormField,
        {
          control: form.control,
          name: "front",
          render: ({ field }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(FormItem, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FormLabel, { children: "Awers (pytanie)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CharacterCounter, { current: frontLength, min: 1, max: MAX_FRONT_LENGTH })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(FormControl, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { ...field, placeholder: "Wprowadź pytanie...", maxLength: MAX_FRONT_LENGTH }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(FormMessage, {})
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        FormField,
        {
          control: form.control,
          name: "back",
          render: ({ field }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(FormItem, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FormLabel, { children: "Rewers (odpowiedź)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CharacterCounter, { current: backLength, min: 1, max: MAX_BACK_LENGTH })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(FormControl, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                ...field,
                placeholder: "Wprowadź odpowiedź...",
                maxLength: MAX_BACK_LENGTH,
                className: "min-h-[120px]"
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(FormMessage, {})
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => onOpenChange(false), disabled: isSaving, children: "Anuluj" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: isSaving || !form.formState.isValid, children: isSaving ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 size-4 animate-spin" }),
          "Zapisywanie..."
        ] }) : "Zapisz" })
      ] })
    ] }) })
  ] }) });
}

function SaveProgressIndicator({ current, total, isVisible }) {
  if (!isVisible) {
    return null;
  }
  const percentage = total > 0 ? current / total * 100 : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
        "Zapisywanie ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: current }),
        " z ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: total })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
        Math.round(percentage),
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: percentage, className: "h-2" })
  ] });
}

function ErrorAlert({ error, onRetry }) {
  if (!error) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { variant: "destructive", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "size-4" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDescription, { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: error.message || "Wystąpił błąd. Spróbuj ponownie." }),
      onRetry && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: onRetry, className: "ml-4", children: "Spróbuj ponownie" })
    ] })
  ] });
}

function getProposalsFromStorage(generationId) {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = sessionStorage.getItem(`generation-${generationId}-proposals`);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
function toProposalViewModel(proposal) {
  return {
    ...proposal,
    status: "pending"
  };
}
function GenerationReviewView({ generationId }) {
  const [proposals, setProposals] = reactExports.useState([]);
  const [expandedBacks, setExpandedBacks] = reactExports.useState(/* @__PURE__ */ new Set());
  const [editingProposalIndex, setEditingProposalIndex] = reactExports.useState(null);
  const [saveProgress, setSaveProgress] = reactExports.useState({
    isSaving: false,
    current: 0,
    total: 0,
    errors: []
  });
  const [error, setError] = reactExports.useState(null);
  const {
    data: generation,
    error: generationError,
    isLoading: isLoadingGeneration,
    refetch: refetchGeneration
  } = useQuery({
    queryKey: ["generation", generationId],
    queryFn: () => getGenerationDetails(generationId),
    enabled: !!generationId,
    retry: 1
  });
  reactExports.useEffect(() => {
    const storedProposals = getProposalsFromStorage(generationId);
    if (storedProposals && storedProposals.length > 0) {
      setProposals(storedProposals.map(toProposalViewModel));
    } else {
      setError({
        message: "Nie znaleziono propozycji dla tej generacji. Spróbuj wygenerować fiszki ponownie.",
        code: "PROPOSALS_NOT_FOUND"
      });
    }
  }, [generationId]);
  reactExports.useEffect(() => {
    if (generationError) {
      if (generationError instanceof ApiClientError) {
        if (generationError.status === 401) {
          window.location.href = `/login?redirect=/generations/${generationId}`;
          return;
        }
        if (generationError.status === 404) {
          setError({
            message: "Generacja nie została znaleziona.",
            code: "NOT_FOUND"
          });
          return;
        }
      }
      setError({
        message: generationError instanceof Error ? generationError.message : "Wystąpił błąd podczas pobierania danych.",
        code: "API_ERROR"
      });
    }
  }, [generationError, generationId]);
  const saveFlashcardMutation = useMutation({
    mutationFn: (data) => createFlashcard(data)
  });
  const acceptedCount = reactExports.useMemo(
    () => proposals.filter((p) => p.status === "accepted" || p.status === "edited").length,
    [proposals]
  );
  const handleToggleBack = reactExports.useCallback((index) => {
    setExpandedBacks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);
  const handleAccept = reactExports.useCallback((index) => {
    setProposals((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], status: "accepted" };
      }
      return next;
    });
  }, []);
  const handleReject = reactExports.useCallback((index) => {
    setProposals((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], status: "rejected" };
      }
      return next;
    });
  }, []);
  const handleEdit = reactExports.useCallback((index) => {
    setEditingProposalIndex(index);
  }, []);
  const handleSaveEdit = reactExports.useCallback(async (index, front, back) => {
    setProposals((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = {
          ...next[index],
          status: "edited",
          editedFront: front,
          editedBack: back
        };
      }
      return next;
    });
    setEditingProposalIndex(null);
  }, []);
  const handleSaveAll = reactExports.useCallback(async () => {
    const acceptedProposals = proposals.filter((p) => p.status === "accepted" || p.status === "edited");
    if (acceptedProposals.length === 0) {
      return;
    }
    setSaveProgress({
      isSaving: true,
      current: 0,
      total: acceptedProposals.length,
      errors: []
    });
    const errors = [];
    const savePromises = acceptedProposals.map(async (proposal, originalIndex) => {
      const source = proposal.status === "edited" ? "ai-edited" : "ai-full";
      const front = proposal.editedFront ?? proposal.front;
      const back = proposal.editedBack ?? proposal.back;
      try {
        await saveFlashcardMutation.mutateAsync({
          front,
          back,
          source,
          generationId
        });
        setSaveProgress((prev) => ({
          ...prev,
          current: prev.current + 1
        }));
      } catch (err) {
        const apiError = err instanceof ApiClientError ? {
          message: err.message,
          code: err.code
        } : {
          message: "Nie udało się zapisać fiszki.",
          code: "SAVE_ERROR"
        };
        errors.push({
          index: originalIndex,
          proposal,
          error: apiError
        });
        setSaveProgress((prev) => ({
          ...prev,
          current: prev.current + 1,
          errors: [...prev.errors, ...errors]
        }));
      }
    });
    await Promise.all(savePromises);
    setSaveProgress((prev) => ({
      ...prev,
      isSaving: false
    }));
    if (errors.length === 0) {
      alert(`Zapisano ${acceptedProposals.length} fiszek.`);
    } else {
      alert(
        `Zapisano ${acceptedProposals.length - errors.length} z ${acceptedProposals.length} fiszek. ${errors.length} fiszki nie zostały zapisane.`
      );
    }
  }, [proposals, generationId, saveFlashcardMutation]);
  const handleRetry = reactExports.useCallback(() => {
    setError(null);
    refetchGeneration();
  }, [refetchGeneration]);
  if (isLoadingGeneration) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center py-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-8 animate-spin text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 text-muted-foreground", children: "Ładowanie szczegółów generacji..." })
    ] });
  }
  if (error && !generation) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorAlert, { error, onRetry: handleRetry }) });
  }
  if (!generation) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      ErrorAlert,
      {
        error: {
          message: "Nie udało się pobrać szczegółów generacji.",
          code: "LOAD_ERROR"
        },
        onRetry: handleRetry
      }
    ) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(GenerationHeader, { generation }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ProposalsCounter, { total: proposals.length, accepted: acceptedCount }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SaveAllButton, { acceptedCount, isSaving: saveProgress.isSaving, onSave: handleSaveAll })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      SaveProgressIndicator,
      {
        current: saveProgress.current,
        total: saveProgress.total,
        isVisible: saveProgress.isSaving
      }
    ),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorAlert, { error, onRetry: handleRetry }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ProposalsList,
      {
        proposals,
        expandedBacks,
        onToggleBack: handleToggleBack,
        onProposalStatusChange: (index, status) => {
          if (status === "accepted") {
            handleAccept(index);
          } else if (status === "rejected") {
            handleReject(index);
          }
        },
        onProposalEdit: handleEdit
      }
    ),
    editingProposalIndex !== null && proposals[editingProposalIndex] && /* @__PURE__ */ jsxRuntimeExports.jsx(
      EditProposalDialog,
      {
        open: editingProposalIndex !== null,
        onOpenChange: (open) => {
          if (!open) {
            setEditingProposalIndex(null);
          }
        },
        proposal: proposals[editingProposalIndex],
        proposalIndex: editingProposalIndex,
        onSave: handleSaveEdit
      }
    )
  ] });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1e3,
      // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});
function GenerationReviewViewWithProvider({ generationId }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsx(GenerationReviewView, { generationId }) });
}

const $$Astro = createAstro();
const $$generationId = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$generationId;
  const { generationId } = Astro2.params;
  if (!generationId) {
    return Astro2.redirect("/");
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(generationId)) {
    return Astro2.redirect("/");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Przegl\u0105d propozycji fiszek - 10xCards" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-8 max-w-6xl"> ${renderComponent($$result2, "GenerationReviewViewWithProvider", GenerationReviewViewWithProvider, { "client:load": true, "generationId": generationId, "client:component-hydration": "load", "client:component-path": "C:/Users/mcalik/source/repos/10x-cards/src/components/generation/GenerationReviewViewWithProvider", "client:component-export": "GenerationReviewViewWithProvider" })} </main> ` })}`;
}, "C:/Users/mcalik/source/repos/10x-cards/src/pages/generations/[generationId].astro", void 0);

const $$file = "C:/Users/mcalik/source/repos/10x-cards/src/pages/generations/[generationId].astro";
const $$url = "/generations/[generationId]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$generationId,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
