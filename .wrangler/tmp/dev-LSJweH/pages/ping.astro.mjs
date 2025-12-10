globalThis.process ??= {}; globalThis.process.env ??= {};
import { e as createComponent, v as renderHead, r as renderTemplate } from '../chunks/astro/server_BEHOjCPm.mjs';
export { r as renderers } from '../chunks/_@astro-renderers_D9WLdofW.mjs';

const prerender = false;
const $$Ping = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<html> <head><title>Ping</title>${renderHead()}</head> <body> <h1>Pong!</h1> <p>Server is working.</p> </body></html>`;
}, "C:/Users/mcalik/source/repos/10x-cards/src/pages/ping.astro", void 0);

const $$file = "C:/Users/mcalik/source/repos/10x-cards/src/pages/ping.astro";
const $$url = "/ping";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Ping,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
