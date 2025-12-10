globalThis.process ??= {}; globalThis.process.env ??= {};
import { z as decodeKey } from './chunks/astro/server_BEHOjCPm.mjs';
import './chunks/astro-designed-error-pages_D3PPft0k.mjs';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/noop-middleware_LDRF5fQG.mjs';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///C:/Users/mcalik/source/repos/10x-cards/","cacheDir":"file:///C:/Users/mcalik/source/repos/10x-cards/node_modules/.astro/","outDir":"file:///C:/Users/mcalik/source/repos/10x-cards/dist/","srcDir":"file:///C:/Users/mcalik/source/repos/10x-cards/src/","publicDir":"file:///C:/Users/mcalik/source/repos/10x-cards/public/","buildClientDir":"file:///C:/Users/mcalik/source/repos/10x-cards/dist/","buildServerDir":"file:///C:/Users/mcalik/source/repos/10x-cards/dist/_worker.js/","adapterName":"@astrojs/cloudflare","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/auth/session","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/auth\\/session\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"auth","dynamic":false,"spread":false}],[{"content":"session","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/auth/session.ts","pathname":"/api/auth/session","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/flashcards/[flashcardid]/review","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/flashcards\\/([^/]+?)\\/review\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"flashcards","dynamic":false,"spread":false}],[{"content":"flashcardId","dynamic":true,"spread":false}],[{"content":"review","dynamic":false,"spread":false}]],"params":["flashcardId"],"component":"src/pages/api/flashcards/[flashcardId]/review.ts","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/flashcards/[flashcardid]","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/flashcards\\/([^/]+?)\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"flashcards","dynamic":false,"spread":false}],[{"content":"flashcardId","dynamic":true,"spread":false}]],"params":["flashcardId"],"component":"src/pages/api/flashcards/[flashcardId]/index.ts","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/flashcards","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/flashcards\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"flashcards","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/flashcards/index.ts","pathname":"/api/flashcards","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/generations/[generationid]","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/generations\\/([^/]+?)\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"generations","dynamic":false,"spread":false}],[{"content":"generationId","dynamic":true,"spread":false}]],"params":["generationId"],"component":"src/pages/api/generations/[generationId]/index.ts","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/generations","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/generations\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"generations","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/generations/index.ts","pathname":"/api/generations","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/study-session","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/study-session\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"study-session","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/study-session/index.ts","pathname":"/api/study-session","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/flashcards.zvL0KcIT.css"}],"routeData":{"route":"/flashcards","isIndex":false,"type":"page","pattern":"^\\/flashcards\\/?$","segments":[[{"content":"flashcards","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/flashcards.astro","pathname":"/flashcards","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/flashcards.zvL0KcIT.css"}],"routeData":{"route":"/generate","isIndex":false,"type":"page","pattern":"^\\/generate\\/?$","segments":[[{"content":"generate","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/generate.astro","pathname":"/generate","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/flashcards.zvL0KcIT.css"}],"routeData":{"route":"/generations/[generationid]","isIndex":false,"type":"page","pattern":"^\\/generations\\/([^/]+?)\\/?$","segments":[[{"content":"generations","dynamic":false,"spread":false}],[{"content":"generationId","dynamic":true,"spread":false}]],"params":["generationId"],"component":"src/pages/generations/[generationId].astro","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/ping","isIndex":false,"type":"page","pattern":"^\\/ping\\/?$","segments":[[{"content":"ping","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/ping.astro","pathname":"/ping","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/flashcards.zvL0KcIT.css"}],"routeData":{"route":"/study","isIndex":false,"type":"page","pattern":"^\\/study\\/?$","segments":[[{"content":"study","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/study.astro","pathname":"/study","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/test","isIndex":false,"type":"page","pattern":"^\\/test\\/?$","segments":[[{"content":"test","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/test.astro","pathname":"/test","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/flashcards.zvL0KcIT.css"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["C:/Users/mcalik/source/repos/10x-cards/src/pages/ping.astro",{"propagation":"none","containsHead":true}],["C:/Users/mcalik/source/repos/10x-cards/src/pages/test.astro",{"propagation":"none","containsHead":true}],["C:/Users/mcalik/source/repos/10x-cards/src/pages/flashcards.astro",{"propagation":"none","containsHead":true}],["C:/Users/mcalik/source/repos/10x-cards/src/pages/generate.astro",{"propagation":"none","containsHead":true}],["C:/Users/mcalik/source/repos/10x-cards/src/pages/generations/[generationId].astro",{"propagation":"none","containsHead":true}],["C:/Users/mcalik/source/repos/10x-cards/src/pages/index.astro",{"propagation":"none","containsHead":true}],["C:/Users/mcalik/source/repos/10x-cards/src/pages/study.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000astro-internal:middleware":"_astro-internal_middleware.mjs","\u0000noop-actions":"_noop-actions.mjs","\u0000@astro-page:src/pages/api/auth/session@_@ts":"pages/api/auth/session.astro.mjs","\u0000@astro-page:src/pages/api/flashcards/[flashcardId]/review@_@ts":"pages/api/flashcards/_flashcardid_/review.astro.mjs","\u0000@astro-page:src/pages/api/flashcards/[flashcardId]/index@_@ts":"pages/api/flashcards/_flashcardid_.astro.mjs","\u0000@astro-page:src/pages/api/flashcards/index@_@ts":"pages/api/flashcards.astro.mjs","\u0000@astro-page:src/pages/api/generations/[generationId]/index@_@ts":"pages/api/generations/_generationid_.astro.mjs","\u0000@astro-page:src/pages/api/generations/index@_@ts":"pages/api/generations.astro.mjs","\u0000@astro-page:src/pages/api/study-session/index@_@ts":"pages/api/study-session.astro.mjs","\u0000@astro-page:src/pages/flashcards@_@astro":"pages/flashcards.astro.mjs","\u0000@astro-page:src/pages/generate@_@astro":"pages/generate.astro.mjs","\u0000@astro-page:src/pages/generations/[generationId]@_@astro":"pages/generations/_generationid_.astro.mjs","\u0000@astro-page:src/pages/ping@_@astro":"pages/ping.astro.mjs","\u0000@astro-page:src/pages/study@_@astro":"pages/study.astro.mjs","\u0000@astro-page:src/pages/test@_@astro":"pages/test.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"index.js","\u0000@astro-page:node_modules/@astrojs/cloudflare/dist/entrypoints/image-endpoint@_@js":"pages/_image.astro.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_BZnWA1GP.mjs","C:/Users/mcalik/source/repos/10x-cards/src/db/supabase.client.ts":"chunks/supabase.client_B0qiGyd_.mjs","C:/Users/mcalik/source/repos/10x-cards/node_modules/astro/node_modules/unstorage/drivers/cloudflare-kv-binding.mjs":"chunks/cloudflare-kv-binding_DMly_2Gl.mjs","C:/Users/mcalik/source/repos/10x-cards/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_BAVQdsUP.mjs","C:/Users/mcalik/source/repos/10x-cards/src/components/flashcards/FlashcardsListWithProvider":"_astro/FlashcardsListWithProvider.NHOLgdrs.js","C:/Users/mcalik/source/repos/10x-cards/src/components/generation/GenerationForm":"_astro/GenerationForm.BdBBlkJ6.js","C:/Users/mcalik/source/repos/10x-cards/src/components/generation/GenerationReviewViewWithProvider":"_astro/GenerationReviewViewWithProvider.CnCPfbwM.js","C:/Users/mcalik/source/repos/10x-cards/src/components/study/StudySessionWithProvider":"_astro/StudySessionWithProvider.C9AKgWN-.js","C:/Users/mcalik/source/repos/10x-cards/src/components/dashboard/DashboardWithProvider":"_astro/DashboardWithProvider.B0EBi-Sw.js","@astrojs/react/client.js":"_astro/client.3bM_UWZ3.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/flashcards.zvL0KcIT.css","/favicon.png","/_astro/card.CW1LdekS.js","/_astro/client.3bM_UWZ3.js","/_astro/client.CwerTQo5.js","/_astro/DashboardWithProvider.B0EBi-Sw.js","/_astro/flashcards.AkKwnFtd.js","/_astro/FlashcardsListWithProvider.NHOLgdrs.js","/_astro/GenerationForm.BdBBlkJ6.js","/_astro/GenerationReviewViewWithProvider.CnCPfbwM.js","/_astro/generations.CmU9ctGo.js","/_astro/index.0yr9KlQE.js","/_astro/index.BtyIGo88.js","/_astro/index.ViApDAiE.js","/_astro/progress.HT1PaUqg.js","/_astro/QueryClientProvider.CKI-lHBV.js","/_astro/refresh-cw.CEPG_sx6.js","/_astro/StudySessionWithProvider.C9AKgWN-.js","/_astro/types.CV3K42eO.js","/_worker.js/index.js","/_worker.js/renderers.mjs","/_worker.js/_@astrojs-ssr-adapter.mjs","/_worker.js/_astro-internal_middleware.mjs","/_worker.js/_noop-actions.mjs","/_worker.js/chunks/astro-designed-error-pages_D3PPft0k.mjs","/_worker.js/chunks/astro_Di6nZVAE.mjs","/_worker.js/chunks/auth.utils_D1pWbdx5.mjs","/_worker.js/chunks/card_TkRUOyCG.mjs","/_worker.js/chunks/CharacterCounter_BlHqu2lW.mjs","/_worker.js/chunks/client_DXxObFE8.mjs","/_worker.js/chunks/cloudflare-kv-binding_DMly_2Gl.mjs","/_worker.js/chunks/flashcard.service_Cyu9Xsk_.mjs","/_worker.js/chunks/flashcards_Dvdk7nev.mjs","/_worker.js/chunks/generation.service_rl8g26CR.mjs","/_worker.js/chunks/generations_C3HokjSN.mjs","/_worker.js/chunks/image-endpoint__jgpzmWV.mjs","/_worker.js/chunks/index_8PQ-Up8j.mjs","/_worker.js/chunks/index_O94rUJhX.mjs","/_worker.js/chunks/noop-middleware_LDRF5fQG.mjs","/_worker.js/chunks/path_lFLZ0pUM.mjs","/_worker.js/chunks/progress_BEXoAnCm.mjs","/_worker.js/chunks/QueryClientProvider_Bwd_EYNw.mjs","/_worker.js/chunks/refresh-cw_9n-T0FOG.mjs","/_worker.js/chunks/sharp_BAVQdsUP.mjs","/_worker.js/chunks/study.service_CY3kkesv.mjs","/_worker.js/chunks/supabase.client_B0qiGyd_.mjs","/_worker.js/chunks/_@astro-renderers_D9WLdofW.mjs","/_worker.js/chunks/_@astrojs-ssr-adapter_YHVoWkgA.mjs","/_worker.js/pages/flashcards.astro.mjs","/_worker.js/pages/generate.astro.mjs","/_worker.js/pages/index.astro.mjs","/_worker.js/pages/ping.astro.mjs","/_worker.js/pages/study.astro.mjs","/_worker.js/pages/test.astro.mjs","/_worker.js/pages/_image.astro.mjs","/_worker.js/_astro/flashcards.zvL0KcIT.css","/_worker.js/chunks/astro/server_BEHOjCPm.mjs","/_worker.js/pages/api/flashcards.astro.mjs","/_worker.js/pages/api/generations.astro.mjs","/_worker.js/pages/api/study-session.astro.mjs","/_worker.js/pages/generations/_generationid_.astro.mjs","/_worker.js/pages/api/auth/session.astro.mjs","/_worker.js/pages/api/flashcards/_flashcardid_.astro.mjs","/_worker.js/pages/api/generations/_generationid_.astro.mjs","/_worker.js/pages/api/flashcards/_flashcardid_/review.astro.mjs"],"buildFormat":"directory","checkOrigin":true,"serverIslandNameMap":[],"key":"NJuK7f7fJzuf+dxNlsMrk1w62wK7RQrf4NRF4GARYew=","sessionConfig":{"driver":"cloudflare-kv-binding","options":{"binding":"SESSION"}}});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = () => import('./chunks/cloudflare-kv-binding_DMly_2Gl.mjs');

export { manifest };
