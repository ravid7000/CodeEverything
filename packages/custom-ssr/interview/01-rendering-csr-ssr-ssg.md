# 01 – Rendering: CSR vs SSR vs SSG vs ISR

> **Abbreviations:** [Glossary (00)](./00-glossary.md) — CSR (Client-Side Rendering), SSR (Server-Side Rendering), SSG (Static Site Generation), ISR (Incremental Static Regeneration), FCP (First Contentful Paint), TTFB (Time to First Byte), TTI (Time to Interactive), SEO (Search Engine Optimization), PDP (Product Detail Page).

## 60-second talk-track

> "Rendering strategy is a per-route decision driven by **content freshness**, **SEO needs**, and **time-to-interactive budget**. CSR is cheapest to operate but worst for SEO and slow first paint. SSR gives fast FCP and SEO at the cost of TTFB and server load. SSG is the fastest possible but breaks when content is personalised. ISR/on-demand revalidation lets SSG handle slowly-changing content. In a real app I'd mix all four: SSG for marketing, ISR for catalog, SSR for PDP, CSR for authed dashboards."

---

## The Trade-off Table (MEMORIZE)

Column/row keys: **CSR** (Client-Side Rendering), **SSR** (Server-Side Rendering), **SSG** (Static Site Generation), **ISR** (Incremental Static Regeneration). Metrics: **TTFB** (Time to First Byte), **FCP** (First Contentful Paint), **TTI** (Time to Interactive), **SEO** (Search Engine Optimization).

|                 | CSR                        | SSR                  | SSG                | ISR              |
| --------------- | -------------------------- | -------------------- | ------------------ | ---------------- |
| TTFB            | fast                       | slow (render on req) | fastest            | fast (cached)    |
| FCP             | slow                       | fast                 | fastest            | fastest          |
| TTI             | slow                       | slow (hydration)     | slow (hydration)   | slow (hydration) |
| SEO             | bad (unless prerender)     | great                | great              | great            |
| Server cost     | $                          | $$$                  | $                  | $$               |
| Personalization | great                      | great                | none               | none (or split)  |
| Build time      | fast                       | fast                 | slow (large sites) | fast             |
| Cache strategy  | client only                | hard                 | CDN edge           | CDN + revalidate |
| Use case        | dashboards, internal tools | PDP, search results  | docs, marketing    | blog, catalog    |

---

## Lifecycle diagrams

**CSR**
```
GET / → 200 (empty HTML + JS) → JS parses → fetch data → render → paint
```

**SSR**
```
GET / → server fetches data → renderToString → 200 (full HTML) → paint → hydrate
```

**SSG**
```
build: render N pages to HTML files
GET / → CDN serves HTML → paint → hydrate
```

**ISR**
```
build: render N pages
GET / → CDN serves stale HTML → background revalidate → new HTML cached
```

---

## What changes in Next.js terms

| Strategy | Next.js (App Router) |
|---|---|
| CSR | `"use client"` + no `await` in server component |
| SSR | server component fetches without `cache` (default in Next 14+ is no-cache for `fetch`) |
| SSG | server component with `fetch(url, { cache: 'force-cache' })` |
| ISR | `fetch(url, { next: { revalidate: 60 } })` or `export const revalidate = 60` |
| On-demand ISR | `revalidatePath()` / `revalidateTag()` in server action |

---

## Common interview questions

**Q: How would you SEO a CSR app?**
- Pre-rendering via Puppeteer/Prerender.io.
- Move to SSR/SSG (real fix).
- Dynamic rendering: serve SSR to bots only (Google says "fine" but discouraged).

**Q: Why is hydration slow even though HTML is already there?**
- Browser still downloads, parses, and executes the JS bundle.
- React walks the entire tree to attach listeners.
- Fix: code-split, defer non-critical, use selective hydration / RSC.

**Q: SSR doubles your server cost. When is it worth it?**
- SEO is a revenue driver (e-commerce, news).
- LCP matters more than infra cost (consumer apps).
- You can edge-render to reduce origin load.

**Q: When would you NOT use SSG?**
- Per-user content.
- > 100k pages where build time becomes painful.
- Content updates faster than build cadence.

---

## Hands-on starter (Day 1 build)

You're going to make `packages/custom-ssr` actually do streaming SSR. See `12-handson-ssr.md` for the scaffold.

Three routes to ship:
- `/` – SSR streamed.
- `/about` – SSG (pre-rendered at build time).
- `/dashboard` – CSR-only (server sends shell + spinner).

---

## If they ask about edge SSR

- **Origin SSR**: Node server in one region. Simple, cold-start free, but latency for far users.
- **Edge SSR**: Cloudflare Workers / Vercel Edge. Low latency, but no Node APIs, limited CPU, data must be globally replicated.
- Hybrid: edge does shell + auth, origin does heavy data fetch.
