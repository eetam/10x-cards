globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, v as renderHead, r as renderTemplate } from '../chunks/astro/server_BEHOjCPm.mjs';
export { r as renderers } from '../chunks/_@astro-renderers_D9WLdofW.mjs';

const $$Test = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>Test Page</title>${renderHead()}</head> <body> <h1>Test Page</h1> <p>If you can see this, basic rendering works.</p> <p>SUPABASE_URL: ${"http://127.0.0.1:54321"}</p> <p>PUBLIC_SUPABASE_URL: ${"NOT SET"}</p> </body></html>`;
}, "C:/Users/mcalik/source/repos/10x-cards/src/pages/test.astro", void 0);
const $$file = "C:/Users/mcalik/source/repos/10x-cards/src/pages/test.astro";
const $$url = "/test";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Test,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
