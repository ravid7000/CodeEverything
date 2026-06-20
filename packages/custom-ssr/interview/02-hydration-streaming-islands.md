# 02 – Hydration, Streaming, Partial Rendering, Islands, RSC

> **Abbreviations:** [Glossary (00)](./00-glossary.md) — RSC (React Server Components), SSR (Server-Side Rendering), FCP (First Contentful Paint), LCP (Largest Contentful Paint), TTI (Time to Interactive), SPA (Single Page Application), CSS-in-JS (CSS-in-JavaScript), MDX (Markdown + JSX).

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
| **RSC** (React Server Components) | Components run on server only, return a serialized tree; `'use client'` components ship JS. |
| **Streaming SSR** (Server-Side Rendering) | `renderToPipeableStream`/`renderToReadableStream` flushes HTML in chunks; `<Suspense>` boundaries unblock the rest. |

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

## Hands-on practice (45–60 min)

Work through each exercise **before** opening the answer key. These are paper/whiteboard friendly – you don't need a running server. For the build exercise, see `12-handson-ssr.md`.

---

### Exercise 1 – Hydration: spot the mismatch

**Broken code** – this throws `Hydration failed because the initial UI does not match...` in the console. Find every cause.

```tsx
// Server + client both render this component
function WelcomeBanner({ name }: { name: string }) {
  const [mounted, setMounted] = useState(false);
  const greeting = `Hello, ${name}! Today is ${new Date().toDateString()}`;

  useEffect(() => setMounted(true), []);

  return (
    <div>
      <h1>{greeting}</h1>
      {typeof window !== 'undefined' && (
        <p>Viewport: {window.innerWidth}px</p>
      )}
      {!mounted && <span className="badge">New</span>}
      <style jsx>{`
        h1 { color: ${Math.random() > 0.5 ? 'blue' : 'green'}; }
      `}</style>
    </div>
  );
}
```

**Your tasks:**
1. List each line/pattern that can produce different server vs client HTML.
2. Rewrite the component so SSR and hydration succeed without suppressing warnings everywhere.
3. When is `suppressHydrationWarning` actually appropriate?

<details>
<summary>Answer key</summary>

Causes:
1. **`new Date().toDateString()`** – server timezone/clock ≠ client.
2. **`typeof window !== 'undefined'`** – server skips `<p>`, client renders it.
3. **`!mounted && <span>`** – server shows badge, client hides it after effect (inverted logic).
4. **`Math.random()` in styles** – different color each render side.
5. **CSS-in-JS without SSR extraction** – class names/order can diverge.

Fix sketch:

```tsx
function WelcomeBanner({ name, serverDate }: { name: string; serverDate: string }) {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    setWidth(window.innerWidth);
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div>
      <h1>Hello, {name}! Today is {serverDate}</h1>
      {width !== null && <p>Viewport: {width}px</p>}
      <span className="badge">New</span>
    </div>
  );
}
```

`suppressHydrationWarning`: only for **known-benign** text diffs (e.g. `<time suppressHydrationWarning>{new Date()}</time>` in a footer timestamp) – not for structural branches.

</details>

---

### Exercise 2 – Streaming SSR: order the flush

**Scenario** – a product page with this React tree:

```tsx
function ProductPage() {
  return (
    <html>
      <head><title>Shop</title></head>
      <body>
        <Header />                          {/* sync – instant */}
        <Suspense fallback={<HeroSkeleton />}>
          <Hero productId="abc" />        {/* awaits fetchProduct – 800ms */}
        </Suspense>
        <Suspense fallback={<ReviewsSkeleton />}>
          <Reviews productId="abc" />       {/* awaits fetchReviews – 2s */}
        </Suspense>
        <Footer />                          {/* sync – instant */}
      </body>
    </html>
  );
}
```

**Your tasks:**
1. Draw the **order of HTML chunks** the browser receives with `renderToPipeableStream`.
2. What paints first: Hero or Reviews? What does the user see at T+500ms?
3. Does streaming reduce **TTI**? What metric does it improve?
4. Should crawlers wait for `onAllReady` or is `onShellReady` enough?

<details>
<summary>Answer key</summary>

Flush order:
1. `<html><head>...<body><Header/>` + `<HeroSkeleton/>` (shell + fallbacks for pending Suspense).
2. ~800ms later: Hero boundary resolves → stream replaces skeleton with real Hero HTML + inline swap script.
3. ~2s later: Reviews boundary resolves → stream Reviews content.
4. `</body></html>` when all boundaries done (`onAllReady`).

At T+500ms: user sees Header + Hero skeleton + Reviews skeleton + Footer – **not** real Hero yet.

Streaming improves **FCP/LCP/perceived load**, not TTI directly (JS still must download + hydrate). Crawlers that don't execute JS need **`onAllReady`** (or SSG) so fallbacks aren't indexed as final content.

</details>

---

### Exercise 3 – Selective hydration: prioritize the click

**Scenario** – same page as Exercise 2. User lands on mobile 3G. JS bundle is still downloading. At T+1s they tap **"Add to cart"** inside `<Hero>` (inside the first Suspense boundary, not yet hydrated).

**Your tasks:**
1. In React 18 selective hydration, what gets prioritized?
2. What stays blocked while Hero hydrates?
3. Sketch the event timeline from tap → button works.

<details>
<summary>Answer key</summary>

React 18 **prioritizes hydrating the Suspense boundary containing the clicked element** (Hero) over lower-priority boundaries (Reviews, Footer interactivity).

While Hero hydrates: other boundaries may remain dehydrated (static HTML visible, clicks in Reviews don't work yet).

Timeline:
1. T+1s – pointer event on dehydrated button; React schedules **priority hydration** for Hero subtree.
2. JS chunk for Hero client components parses/executes.
3. React hydrates Hero boundary, replays/rebinds the click (or attaches listener before replay depending on timing).
4. Cart handler runs; user sees feedback.

Key interview point: selective hydration improves **perceived TTI for the touched surface**, not global TTI.

</details>

---

### Exercise 4 – Islands: decide what ships JS

**Page** – marketing blog post with: site header, article body (MDX), inline code blocks (syntax highlight), comments thread, newsletter signup, related-posts carousel.

**Broken approach** – entire page is one React SPA entry:

```html
<div id="root"></div>
<script type="module" src="/assets/app.js"></script>  <!-- 280kb -->
```

**Your tasks:**
1. Mark each section **static HTML (0 JS)** vs **island (ships JS)** vs **facade (load on interaction)**.
2. Write pseudo HTML showing Astro-style `client:*` directives for each island.
3. What's the tradeoff if Comments and Carousel both need the same user session state?

<details>
<summary>Answer key</summary>

| Section | Strategy | Why |
|---|---|---|
| Header / article MDX | Static HTML | SEO, instant paint |
| Code blocks | Static + CSS, or island only if copy-button | Highlight at build time (Shiki) |
| Newsletter form | Island `client:visible` | Small, below fold |
| Related carousel | Island `client:visible` or `client:idle` | Heavy, not LCP |
| Comments | Island `client:load` if above fold, else `client:visible` | Needs interactivity |

```html
<header>...</header>
<article><!-- static MDX --></article>
<NewsletterForm client:visible />
<RelatedPosts client:idle />
<Comments client:visible />
```

Tradeoff: islands are **separate roots** – shared session state needs a lightweight global store, custom events, or a thin shared shell. Duplicated React runtimes if you're not careful with vendor splitting.

</details>

---

### Exercise 5 – RSC: draw the boundary

**Broken code** – which lines are illegal or force unnecessary JS to the client?

```tsx
// app/products/[id]/page.tsx  (Server Component by default)
import { db } from '@/lib/db';
import { LikeButton } from './LikeButton';      // 'use client'
import { Chart } from '@/components/Chart';       // uses useState, no directive

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await db.product.find(params.id);
  const [qty, setQty] = useState(1);              // line A

  return (
    <main>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <LikeButton productId={product.id} />
      <Chart data={product.sales} />              // line B
      <AddToCart quantity={qty} />                // line C – server component
    </main>
  );
}

// LikeButton.tsx
'use client';
export function LikeButton({ productId }: { productId: string }) {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>{liked ? '♥' : '♡'}</button>;
}
```

**Your tasks:**
1. Flag lines A, B, C – what's wrong?
2. Redraw the component tree: server vs client, and what crosses the network.
3. Can `<LikeButton>` accept `{product.description}` as children from the server? Why is that useful?

<details>
<summary>Answer key</summary>

- **Line A** – `useState` in Server Component → **illegal** (hooks are client-only).
- **Line B** – `Chart` uses state but lacks `'use client'` → must become client boundary or be replaced with server-safe output (static SVG).
- **Line C** – `AddToCart` with interactive quantity can't stay server-only if it has handlers; either move qty state into a client child or make `AddToCart` a client component.

Tree:
```
ProductPage (server) ──serializes──▶ HTML/RSC payload
  ├─ h1, p (server, 0 JS)
  ├─ LikeButton (client bundle)
  └─ Chart (client bundle once marked 'use client')
```

**Yes** – server components can pass **serialized JSX children** through client boundaries:

```tsx
<LikeButton productId={id}>
  <p>{product.description}</p>   {/* rendered on server, 0 JS for this subtree */}
</LikeButton>
```

Client receives already-rendered HTML for children; only LikeButton's interactivity ships JS.

</details>

---

### Exercise 6 – Partial hydration vs full hydration

**Two architectures for a docs site with a search modal:**

**Option A – Full SSR + hydrate entire app**
```tsx
hydrateRoot(document.getElementById('root'), <App />);
```

**Option B – Partial / progressive**
```html
<body>
  <div id="docs-content"><!-- 200kb of static HTML --></div>
  <div data-island="Search" data-props='{"indexUrl":"/search.json"}'></div>
  <script type="module" src="/islands/search.js"></script>  <!-- 12kb -->
</body>
```

**Your tasks:**
1. Compare TTI, interactivity coverage, and complexity for A vs B.
2. When would you pick progressive hydration (hydrate on `requestIdleCallback` / IntersectionObserver)?
3. One failure mode for partial hydration in a React app.

<details>
<summary>Answer key</summary>

| | Full hydrate (A) | Partial / islands (B) |
|---|---|---|
| TTI | Waits for big `app.js` | Search interactive sooner |
| Coverage | Everything works once hydrated | Only islands interactive; rest is static |
| Complexity | Single React tree | Island loader, prop serialization, maybe duplicate providers |

Progressive hydration: good when **most of the page is read-only** and interactivity is below-the-fold or idle-time (comments, analytics widgets, "copy link" buttons).

Failure mode: **event handlers on non-hydrated HTML** – user clicks a link styled as a button before hydration; or React expects to own DOM nodes that a partial strategy left static → mismatch if you mix strategies sloppily.

</details>

---

### Exercise 7 – Resumability (Qwik) vs classic hydration

**Classic React SSR output (simplified):**
```html
<button id="b1">0</button>
<script>/* 40kb React + app */ hydrate(document.getElementById('b1'), ...)</script>
```

**Resumable output (conceptual):**
```html
<button on:click="chunk.js#increment" data-count="0">0</button>
<!-- no full-tree hydrate; loader fetches chunk.js only when clicked -->
```

**Your tasks:**
1. In one sentence each: what work does the browser skip with resumability?
2. What do you pay instead (tradeoffs)?
3. For a Notion-like editor, would you default to RSC, islands, or resumability? Why?

<details>
<summary>Answer key</summary>

Resumability skips **eagerly downloading/parsing/executing** the full component tree up front; listener wiring is deserialized from HTML and code loads **on demand** (interaction-driven).

Costs: framework-specific serialization, harder mental model, tooling lock-in (Qwik), fine-grained chunk graph complexity, debugging indirection.

Notion-like editor: **RSC or modular client app**, not pure resumability-first – rich always-on client state (selection, CRDT, keyboard shortcuts) needs a persistent client runtime. Resumability/islands help for **marketing shell** around the editor, not the editor core.

</details>

---

### Exercise 8 – Vocabulary speed round

Match each scenario to the **best term** (one primary answer):

1. User clicks a button before its Suspense boundary has hydrated → React hydrates that subtree first.
2. Blog page: nav and article are HTML; only search box runs React.
3. Server component fetches SQL and renders `<table>`; zero JS for that table.
4. HTML arrives in chunks; spinner replaced by reviews when fetch completes.
5. Only the hero carousel hydrates on idle; footer links are plain `<a>` tags.

**Terms:** `Streaming SSR` · `Selective hydration` · `Islands` · `RSC` · `Partial hydration` · `Progressive hydration`

<details>
<summary>Answer key</summary>

1. **Selective hydration**
2. **Islands**
3. **RSC**
4. **Streaming SSR** (with Suspense)
5. **Partial hydration** (progressive/on-idle is a *strategy* within partial – either term acceptable if you explain idle scheduling)

</details>

---

### Exercise 9 – Architecture pick (mock interview, 10 min)

**Prompt:** "Design the rendering strategy for a public docs site (1000 pages, great SEO) with an authenticated **playground** panel embedded on some pages (live code editor, runs npm packages)."

**Your tasks (talk out loud):**
1. CSR vs SSR vs SSG vs islands vs RSC – what for docs vs playground?
2. Where do `<Suspense>` boundaries go?
3. How do you avoid shipping the Monaco editor bundle on every docs page?

<details>
<summary>Answer key</summary>

Docs pages: **SSG/ISR** – static HTML, zero or minimal JS, best SEO and TTFB.

Playground: **client island** loaded with `dynamic import()` only when the playground tab is visible or clicked (facade pattern). Monaco (~2MB+) must never be in the global bundle.

Suspense: on docs, optional streaming for **slow sidebar** (related links from CMS); playground async boundary for "loading editor".

Sketch:
```
/docs/[slug]     → SSG markdown + optional RSC for versioned nav data
/docs/[slug]/play → static shell + <Playground client:visible /> lazy-imports monaco
```

Hydration: docs body **not hydrated at all**; only playground island hydrates.

</details>

---

### Build exercise – wire it in the repo

When you're ready to implement (not just discuss), follow **`12-handson-ssr.md`**:

1. Add `<Suspense>` in `entry-server.tsx`.
2. Use `renderToPipeableStream` with `onShellReady` / `onAllReady`.
3. Add an island demo: server emits `<div data-island="Counter" data-props='{"start":0}'>` and client scans + hydrates only those nodes.

Target: demo on `localhost:3000` with `/` (SSR stream), `/about` (SSG), `/dashboard` (CSR).

---

### Self-check before the interview

- [ ] I can explain hydration in one sentence without saying "it's like water."
- [ ] I know streaming helps FCP/LCP but **not** TTI by itself.
- [ ] I can draw server vs client on an RSC tree and mark what ships JS.
- [ ] I can list three real causes of hydration mismatch.
- [ ] I can argue islands vs RSC for a mostly-static vs app-heavy product.
