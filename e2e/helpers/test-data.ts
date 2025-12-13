/**
 * Test data for E2E tests
 * Provides sample texts for flashcard generation
 */

/**
 * Sample text about JavaScript (1000+ characters for valid generation)
 */
export const SAMPLE_TEXT_JAVASCRIPT = `
JavaScript to dynamiczny język programowania, szeroko stosowany do tworzenia interaktywnych stron internetowych. Został stworzony przez Brendana Eicha w 1995 roku i od tego czasu stał się jednym z najpopularniejszych języków na świecie.

JavaScript działa po stronie klienta w przeglądarkach internetowych, umożliwiając manipulację elementami DOM (Document Object Model). Dzięki temu programiści mogą tworzyć responsywne interfejsy użytkownika, które reagują na działania użytkowników bez konieczności przeładowywania strony.

Nowoczesny JavaScript obsługuje programowanie obiektowe, funkcyjne oraz asynchroniczne. ES6 (ECMAScript 2015) wprowadził wiele istotnych ulepszeń, takich jak klasy, moduły, funkcje strzałkowe, destructuring i promises.

JavaScript jest również używany po stronie serwera dzięki Node.js - środowisku uruchomieniowemu zbudowanemu na silniku V8 Chrome. Node.js umożliwia tworzenie skalowalnych aplikacji serwerowych używając jednego języka programowania zarówno na frontendzie jak i backendzie.

Ekosystem JavaScript jest niezwykle bogaty - zawiera tysiące bibliotek i frameworków dostępnych przez npm (Node Package Manager). Najpopularniejsze to React, Vue.js, Angular do frontendu oraz Express, Nest.js do backendu.
`.trim();

/**
 * Sample text about Python (1000+ characters for valid generation)
 */
export const SAMPLE_TEXT_PYTHON = `
Python to wysokopoziomowy język programowania ogólnego przeznaczenia, znany ze swojej czytelności i prostoty składni. Został stworzony przez Guido van Rossuma i po raz pierwszy wydany w 1991 roku.

Python jest interpretowanym językiem z dynamicznym typowaniem, co oznacza że typy zmiennych są określane w czasie wykonywania programu. Język kładzie duży nacisk na czytelność kodu poprzez stosowanie wcięć zamiast nawiasów klamrowych do definiowania bloków kodu.

Python znajduje szerokie zastosowanie w wielu dziedzinach: web development (Django, Flask), data science (pandas, NumPy), machine learning (TensorFlow, PyTorch), automatyzacja zadań, testowanie oprogramowania i wiele innych.

Biblioteka standardowa Pythona jest bardzo obszerna i zawiera moduły do pracy z plikami, sieciami, bazami danych, protokołami internetowymi i wieloma innymi zadaniami. Dodatkowo, Python Package Index (PyPI) oferuje tysiące dodatkowych bibliotek utworzonych przez społeczność.

Python 3 jest aktualną wersją języka, która wprowadziła wiele ulepszeń w stosunku do Python 2, włączając lepszą obsługę Unicode, ulepszone mechanizmy obsługi wyjątków oraz większą spójność składni.
`.trim();

/**
 * Short text (too short for generation - less than 1000 characters)
 */
export const SAMPLE_TEXT_TOO_SHORT = "JavaScript to język programowania.";

/**
 * Get character count for a text
 */
export function getCharacterCount(text: string): number {
  return text.length;
}

/**
 * Verify text meets minimum requirements
 */
export function isTextValidForGeneration(text: string): boolean {
  const MIN_LENGTH = 1000;
  const MAX_LENGTH = 10000;
  const length = text.length;
  return length >= MIN_LENGTH && length <= MAX_LENGTH;
}
