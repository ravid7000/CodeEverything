# 02 – Hydration, Streaming, Partial Rendering, Islands, RSC

## 60-second talk-track

> "Hydration is the client replaying the server-rendered tree to attach event listeners and recreate component state. It's expensive because the browser still parses/executes the whole bundle. Modern frameworks attack this from three angles: **streaming** the HTML so the browser paints earlier, **selective hydration** so interactive parts boot first, and **islands / RSC** so we ship less JS in the first place. The end state is React Server Components: server-only by default, `'use client'` is the opt-in."

---

## The vocabulary (don't mix these up)

| Term | Meaning |
|---|---|
| **Hydration** | Client React mounts onto server HTML, attaches handlers. |
| **Progressive hydration** | Hydrate components as they enter viewport / on idle. |
| **Selective hydration** (React 18) | React picks which `<Suspense>` boundary to hydrate first based on user interaction. |
| **Partial hydration** | Only some components hydrate; others stay static HTML. |
| **Islands** (Astro) | Page is static HTML with self-contained interactive islands. Each island has its own runtime. |
| **Resumability** (Qwik) | Skip hydration entirely; serialize listener state into HTML, resume on click. |
| **RSC** | Components run on server only, return a serialized tree; `'use client'` components ship JS. |
| **Streaming SSR** | `renderToPipeableStream`/`renderToReadableStream` flushes HTML in chunks; `<Suspense>` boundaries unblock the rest. |

---

## React 18 streaming SSR mental model

```
Server starts rendering
  │
  ├── Shell ready (no Suspense pending) ──▶ flush <html><head>...<body><app-shell>
  │
  ├── Slow data resolves under <Suspense fallback={<Spinner/>}>
  │       └── flush <template id="S:1">...real content...</template>
  │           + tiny script that swaps fallback → real content
  │
  └── Done ──▶ flush </body></html>
```

Client gets paint **before** server is done. JS still needs to download to hydrate.

**Selective hydration**: if user clicks a button inside a not-yet-hydrated boundary, React prioritizes hydrating that boundary first.

---

## Islands architecture (Astro mental model)

```html
<!-- Server output -->
<html>
  <body>
    <header>static HTML</header>           <!-- 0 JS -->
    <Counter client:visible />             <!-- ships ~3kb counter island -->
    <article>static markdown HTML</article><!-- 0 JS -->
    <Cart client:load />                   <!-- ships ~8kb cart island -->
  </body>
</html>
```

Each island is an **independent React/Vue/Svelte root**. They don't share React tree → cheaper hydration, more code if islands need to talk (use signals / window events / shared store).

---

## React Server Components in one diagram

```
   Server                            Network                    Client
┌────────────┐                                              ┌────────────┐
│ <Page/>    │ runs on server                               │            │
│   ↓ awaits │                                              │            │
│ db.query() │                                              │            │
│   ↓        │  serialized JSX tree (RSC payload)           │            │
│ <Article/> │ ───────────────────────────────────────────▶ │ React      │
│   ↓        │  ("text", {props}, [children])               │ stitches   │
│ 'use client'│                                              │ client     │
│ <Like/>    │ ──── this one ships JS bundle ────────────▶  │ components │
└────────────┘                                              └────────────┘
```

**Key insight**: zero JS for server components. `'use client'` is a *boundary* – everything inside is client, but it can still receive serialized server-rendered children.

---

## Common interview questions

**Q: What causes hydration mismatch errors?**
- Server and client render different output (Date.now, Math.random, `typeof window`).
- Browser extensions modifying HTML before hydration.
- CSS-in-JS not configured for SSR.
- Fix: render the same thing both sides, or use `useEffect` to render client-only diffs, or `suppressHydrationWarning` (escape hatch).

**Q: How does streaming improve TTI?**
- TTI = JS downloaded + parsed + hydrated. Streaming doesn't help TTI directly.
- It improves **FCP** and **LCP** because paint happens before all data is ready.
- Selective hydration improves perceived TTI for the interactive part the user touches first.

**Q: Why is RSC a big deal?**
- Default is server → ship 0 JS for most of the tree.
- Direct DB / filesystem access in components (no API layer for own data).
- Smaller bundles, faster TTI.
- Cost: mental model shift, can't use hooks/state in RSCs, serialization boundary.

**Q: When are islands better than RSC?**
- Mostly-static sites (blogs, docs, marketing).
- Multi-framework: one island React, one Vue.
- RSC wins when you have a rich app with many interactive parts but want zero-JS for layout/data shell.

---

## Hands-on (Day 2 build inside `custom-ssr`)

1. Add `<Suspense>` boundary in `entry-server.tsx`.
2. Use `renderToPipeableStream` with `onShellReady` (flush) and `onAllReady` (for crawlers).
3. Add an "island" demo: server emits `<div data-island="Counter" data-props='{"start":0}'>` and client scans + hydrates only those.

See `12-handson-ssr.md` for the streaming snippet.
