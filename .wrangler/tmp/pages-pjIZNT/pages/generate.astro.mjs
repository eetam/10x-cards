globalThis.process ??= {}; globalThis.process.env ??= {};
import { o as objectType, k as stringType, e as createComponent, q as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_BEHOjCPm.mjs';
import { j as jsxRuntimeExports, B as Button, A as ApiClientError, $ as $$Layout } from '../chunks/client_DXxObFE8.mjs';
import { a as reactExports } from '../chunks/_@astro-renderers_D9WLdofW.mjs';
export { r as renderers } from '../chunks/_@astro-renderers_D9WLdofW.mjs';
import { u as useForm, a, g as useWatch, F as Form, b as FormField, c as FormItem, d as FormLabel, e as FormControl, T as Textarea, C as CharacterCounter, f as FormMessage } from '../chunks/CharacterCounter_BlHqu2lW.mjs';
import { g as generateFlashcards } from '../chunks/generations_C3HokjSN.mjs';
import { A as Alert, C as CircleAlert, b as AlertDescription, L as LoaderCircle } from '../chunks/index_O94rUJhX.mjs';
import { P as Progress } from '../chunks/progress_BEXoAnCm.mjs';

const MIN_TEXT_LENGTH = 1e3;
const MAX_TEXT_LENGTH = 1e4;
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const GenerationFormSchema = objectType({
  sourceText: stringType().trim().min(MIN_TEXT_LENGTH, `Tekst musi zawierać co najmniej ${MIN_TEXT_LENGTH} znaków`).max(MAX_TEXT_LENGTH, `Tekst nie może przekraczać ${MAX_TEXT_LENGTH} znaków`)
});

function getErrorMessage(error) {
  const errorMessages = {
    VALIDATION_ERROR: "Nieprawidłowe dane. Sprawdź formularz.",
    RATE_LIMIT_EXCEEDED: "Zbyt wiele requestów. Spróbuj za chwilę.",
    CONCURRENT_LIMIT_EXCEEDED: "Zbyt wiele równoczesnych generacji. Poczekaj na zakończenie poprzednich.",
    NETWORK_ERROR: "Brak połączenia z internetem. Sprawdź połączenie.",
    UNKNOWN_ERROR: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie."
  };
  return errorMessages[error.code || ""] || error.message || "Wystąpił błąd. Spróbuj ponownie.";
}
function GenerationForm() {
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [showLongOperationMessage, setShowLongOperationMessage] = reactExports.useState(false);
  const form = useForm({
    resolver: a(GenerationFormSchema),
    defaultValues: {
      sourceText: ""
    },
    mode: "onChange"
  });
  const sourceText = useWatch({
    control: form.control,
    name: "sourceText",
    defaultValue: ""
  });
  const sourceTextLength = sourceText?.length || 0;
  const isFormValid = form.formState.isValid && sourceTextLength >= MIN_TEXT_LENGTH && sourceTextLength <= MAX_TEXT_LENGTH;
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);
    setShowLongOperationMessage(false);
    const longOperationTimer = setTimeout(() => {
      setShowLongOperationMessage(true);
    }, 5e3);
    try {
      const trimmedData = {
        sourceText: data.sourceText.trim()
      };
      const response = await generateFlashcards(trimmedData);
      clearTimeout(longOperationTimer);
      if (response.proposals && response.proposals.length > 0) {
        try {
          sessionStorage.setItem(`generation-${response.generationId}-proposals`, JSON.stringify(response.proposals));
        } catch {
        }
      }
      window.location.href = `/generations/${response.generationId}`;
    } catch (err) {
      clearTimeout(longOperationTimer);
      if (err instanceof ApiClientError) {
        const apiError = {
          message: err.message,
          code: err.code
        };
        setError(apiError);
        if (err.status === 401) {
          window.location.href = `/login?redirect=/generate`;
          return;
        }
      } else {
        setError({
          message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
          code: "UNKNOWN_ERROR"
        });
      }
    } finally {
      setIsSubmitting(false);
      setShowLongOperationMessage(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Form, { ...form, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FormField,
      {
        control: form.control,
        name: "sourceText",
        render: ({ field, fieldState }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(FormItem, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FormLabel, { htmlFor: "sourceText", children: "Tekst źródłowy" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(FormControl, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "sourceText",
              placeholder: "Wklej tekst (1000-10000 znaków)...",
              disabled: isSubmitting,
              className: "min-h-[200px] resize-y",
              "aria-invalid": fieldState.invalid,
              "aria-describedby": fieldState.invalid ? "sourceText-error" : "sourceText-counter",
              ...field
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CharacterCounter, { current: sourceTextLength, min: MIN_TEXT_LENGTH, max: MAX_TEXT_LENGTH }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { id: "sourceText-counter", className: "sr-only", children: [
              sourceTextLength,
              " znaków z zakresu ",
              MIN_TEXT_LENGTH,
              "-",
              MAX_TEXT_LENGTH
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(FormMessage, { id: "sourceText-error" })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-muted-foreground", children: [
      "Używany model AI: ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: DEFAULT_MODEL })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { variant: "destructive", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDescription, { children: getErrorMessage(error) })
    ] }),
    showLongOperationMessage && /* @__PURE__ */ jsxRuntimeExports.jsxs(Alert, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDescription, { children: "To może zająć do 30 sekund. Proszę czekać..." })
    ] }),
    isSubmitting && /* @__PURE__ */ jsxRuntimeExports.jsx(Progress, { value: void 0, className: "h-2" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: isSubmitting || !isFormValid, className: "w-full", "aria-busy": isSubmitting, children: isSubmitting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
      "Generowanie..."
    ] }) : "Generuj" })
  ] }) });
}

const $$Generate = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Generuj fiszki - 10xCards" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-8 max-w-4xl"> <h1 class="text-3xl font-bold mb-6">Generuj fiszki</h1> <p class="text-muted-foreground mb-8">
Wklej tekst źródłowy (1000-10000 znaków), a system wygeneruje propozycje fiszek przy użyciu AI.
</p> ${renderComponent($$result2, "GenerationForm", GenerationForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/mcalik/source/repos/10x-cards/src/components/generation/GenerationForm", "client:component-export": "GenerationForm" })} </main> ` })}`;
}, "C:/Users/mcalik/source/repos/10x-cards/src/pages/generate.astro", void 0);

const $$file = "C:/Users/mcalik/source/repos/10x-cards/src/pages/generate.astro";
const $$url = "/generate";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Generate,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
