# 11 – Mock Prompts (Run At Least One Tonight)

Pick **one** prompt. Time yourself: **45 min design + 15 min Q&A**. Whiteboard or paper. Record yourself. Listen back at 1.5x while making dinner.

---

## Universal Design Template (use for every prompt)

Walk in this order – interviewers know the structure and will follow you:

1. **Clarify** (3 min) – ask 5 questions to define scope. Write them down.
   - Audience, scale (DAU, regions), key metrics, must-have vs nice-to-have, constraints (auth, offline, SEO).
2. **High-level diagram** (5 min) – client / edge / origin / data, with deploy units.
3. **Rendering strategy** (5 min) – per-route CSR/SSR/SSG, justify.
4. **Component architecture** (5 min) – key components, headless vs opinionated, state ownership.
5. **State + data** (8 min) – server vs client state, cache layers, mutation patterns, optimistic updates.
6. **Cross-cutting** (10 min) – auth, i18n, theming, accessibility, error handling.
7. **Architecture decisions** (5 min) – monorepo vs multi, monolith vs MFE, deploy units.
8. **Perf budget** (3 min) – Web Vitals targets, code splitting, bundle limits.
9. **Observability** (3 min) – errors, RUM, traces, alerts.
10. **CI/CD + rollout** (3 min) – preview envs, canary, feature flags, rollback.

If you cover steps 1–7 well, you've passed. 8–10 is what gets you to "strong hire."

---

## Prompt 1: Design Figma's multiplayer canvas frontend

Highlights to hit:
- **Rendering**: CSR (canvas/webgl heavy, no SEO).
- **Architecture**: shell + plugin system (Figma has plugins → think MFE-lite).
- **Data**: CRDT or OT for conflict resolution; local-first writes; sync over WebSocket.
- **State**: scene graph as a custom data structure (not Redux), reactive subscriptions per node.
- **Perf**: rendering on canvas not DOM, virtualize off-screen, throttle cursor broadcasts, web workers for heavy ops.
- **Offline**: IndexedDB queue, sync on reconnect.
- **Observability**: latency to peers, FPS, sync conflicts.

---

## Prompt 2: Design Notion-style block editor (offline-first + collaborative)

Highlights:
- **Rendering**: CSR core; SSR for public-share pages (SEO).
- **Data model**: tree of typed blocks, content-editable rich text (ProseMirror/Lexical).
- **Sync**: CRDT (Yjs / Automerge), local persistence (IndexedDB), WebSocket transport.
- **State**: editor state (CRDT doc) + UI state (selection, menu) – different stores.
- **Components**: block plugins as a registry, compound `Editor.Block.Heading` etc.
- **Perf**: virtualize page if long; lazy load embeds; defer mention search.
- **Auth**: per-block permissions; share links with capability tokens.
- **Observability**: edit conflict rate, sync latency, autosave failures.

---

## Prompt 3: Design Amazon's product detail page at scale (50+ teams)

Highlights:
- **Rendering**: SSR + edge cache (`stale-while-revalidate`) + per-locale variants.
- **Architecture**: **Module Federation** – cart team, recs team, reviews team own panels independently.
- **Shell**: thin host owns routing, auth, layout, header/footer.
- **Shared infra**: design system as npm singleton, auth client as MF shared module, analytics SDK shared.
- **Data**: BFF per surface to avoid client-side waterfalls; GraphQL federation across services.
- **Experiments**: A/B framework as a wrapper around feature flags; server-side variant assignment.
- **Perf**: LCP image preloaded; below-fold MFEs lazy-loaded; bundle budget per MFE enforced in CI.
- **Observability**: per-MFE error boundary + per-MFE RUM tag; trace propagation across MFEs.
- **CI/CD**: each MFE deploys independently; contract tests on host's expected interface.
- **Pitfalls to call out**: shared dep version skew, CSS leaks, atomic deploy is impossible → design for staggered rollout.

---

## Prompt 4: Design a real-time analytics dashboard with 200+ widgets per page

Highlights:
- **Rendering**: CSR (authed, no SEO).
- **Layout engine**: virtualized grid (react-grid-layout or custom), only render visible widgets.
- **Data fetching**: per-widget query with shared cache; coalesce queries that hit same endpoint (BFF batches).
- **Streaming**: WebSocket or SSE for live updates; widgets subscribe to topics.
- **Charts**: heavy lib (echarts/visx) lazy-loaded; one chart instance per visible widget.
- **State**: dashboard config in URL/store; widget data in React Query.
- **Perf**: virtualization, web workers for aggregation, debounce window resize, GPU-accelerated charts.
- **UX**: skeleton per widget, error per widget (don't take down dashboard).
- **Observability**: per-widget render time, WS reconnect rate.

---

## Prompt 5: Design a multi-brand checkout (one codebase, 12 brands)

Highlights:
- **Architecture**: monorepo, one app, brand selected at build or runtime.
- **Theming**: design tokens (CSS variables) per brand; brand-specific assets behind dynamic import.
- **Routing**: brand-aware (`/in/checkout`, `/uk/checkout`) or subdomain.
- **i18n**: ICU messages, lazy-loaded per locale.
- **Compliance**: PCI – never touch card data, iframe to payment processor (Stripe Elements).
- **Experiments**: per-brand flags; some brands opt out.
- **MFE?**: usually overkill here – modular monolith is better.
- **Rollout**: canary one brand at a time.
- **Observability**: dashboards per brand, alerts per brand SLA.

---

## Self-scoring rubric (be honest)

After your mock, score yourself /5 on each:

- [ ] Clarified scope before designing
- [ ] Justified rendering choice per route
- [ ] Named at least one trade-off you rejected
- [ ] Drew a clean architecture diagram
- [ ] Server vs client state separation
- [ ] Cache layers + invalidation strategy
- [ ] Mentioned a perf budget with numbers
- [ ] Mentioned observability + alerting
- [ ] CI/CD with rollback story
- [ ] Pushed back on "use MFE" when not needed

If you score < 30/50, do another prompt.

---

## Last-mile: 10 sentences that buy you respect

Quote any of these verbatim when relevant – they read as senior:

1. "Before designing, I'd want to know our DAU, regions, and what we measure success by."
2. "Rendering choice is per-route, not per-app."
3. "Hydration mismatch usually means the server and client rendered different output – Date, Math.random, or browser-only APIs."
4. "Server state and client state are different problems; mixing them is the most common anti-pattern I see."
5. "I'd reach for compound components and headless logic before piling on props."
6. "Cache invalidation strategy is the hardest part – I'd start with TTL + tag-based invalidation."
7. "Module Federation solves an org problem. If you don't have 4+ independent teams, you're paying complexity for no benefit."
8. "I'd ship a perf budget in CI so regressions can't merge silently."
9. "Decouple deploy from release with feature flags – it shrinks rollback to a config flip."
10. "Every alert needs a runbook URL; otherwise it'll be ignored."
