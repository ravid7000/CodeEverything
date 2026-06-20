# 14 – Full Deep-Dive Playbook (Decisions, Trade-offs, Performance, Failure Modes)

> **Abbreviations:** [Glossary (00)](./00-glossary.md) — full list of ~75 terms used across all interview docs.

Use this as your final revision doc before the interview. Every section follows the same structure:
- Decision model (how to choose)
- Trade-offs (what you gain/lose)
- Performance impact (what metric changes and why)
- Failure modes (how systems break)
- Interview answer template (how to speak like a senior)

---

## 0) Universal Decision Framework (use this for any architecture question)

When interviewer asks "what would you choose?", answer in this exact order:

1. **Context**
   - Users (public vs internal), SEO need, geography, traffic shape, release velocity.
2. **Constraint**
   - Latency target, team structure, budget, compliance, legacy constraints.
3. **Decision**
   - "I would choose X for Y surfaces, and Z for others."
4. **Trade-off**
   - "We gain A and B, we accept C."
5. **Risk Mitigation**
   - "To reduce C, I would add D."
6. **Validation**
   - "We verify using metric M and threshold T."

This avoids "it depends" answers that sound indecisive.

---

## 1) Component Design (reusability, composability, state ownership)

### Decision model

Pick component pattern by flexibility need:
- Low variability: simple prop API.
- Medium variability: children composition.
- High variability: compound components + context.
- Design-system primitive: headless hook + slots.

Also decide state ownership first:
- **Local state** if behavior is isolated.
- **Lifted state** if parent coordinates siblings.
- **Global state** only if many distant consumers need same source.

### Trade-offs

- **Monolithic props API**
  - Pros: easy onboarding, quick implementation.
  - Cons: prop explosion, hard to extend, conditional complexity.
- **Compound components**
  - Pros: composable structure, cleaner extension model.
  - Cons: requires context discipline, slightly steeper learning curve.
- **Headless**
  - Pros: maximum flexibility, accessibility centralized.
  - Cons: consumer effort increases, inconsistent UI risk.

### Performance impact

- A single broad context causes wide re-renders.
- Splitting context by update frequency reduces unnecessary render work.
- External store + selector model (e.g. `useSyncExternalStore`) scales better for high-frequency updates.
- Controlled components can be slower if parent re-renders are expensive.

### Failure modes

- "Everything controlled from parent" leads to laggy input.
- Accessibility regressions when custom keyboard/focus logic is ad-hoc.
- Inline callback recreation + unstable object props defeat memoization.
- Component API ambiguity (`value` + `defaultValue` both passed) causes undefined behavior.

### Interview answer template

"I would build this as compound components with controlled/uncontrolled support. That gives composability without prop explosion. Main risk is context-driven over-rendering, so I split context and expose selector-based hooks. I validate with React Profiler commit duration and interaction latency."

---

## 2) CSR vs SSR vs SSG vs ISR (especially Next/Nuxt)

### Decision model (per-route, never per-app)

For each route, classify by:
- SEO critical? (yes/no)
- Personalization required at first paint? (yes/no)
- Content freshness tolerance? (seconds/minutes/hours)
- Traffic predictability? (spiky/stable)

Map:
- SEO + static content -> SSG.
- SEO + periodic updates -> ISR.
- SEO + per-request personalization -> SSR.
- Non-SEO/authed interactive area -> CSR.

### Trade-offs

- **CSR**
  - Gains: cheap infra, simple hosting, client autonomy.
  - Losses: weak initial paint, poor SEO out-of-box.
- **SSR**
  - Gains: strong FCP/LCP, SEO, dynamic first paint.
  - Losses: server load, TTFB sensitivity, infra complexity.
- **SSG**
  - Gains: best cacheability, cheapest runtime, fastest edge delivery.
  - Losses: stale content risk, long builds at scale, no per-user personalization.
- **ISR**
  - Gains: SSG speed with controlled freshness.
  - Losses: stale window, invalidation complexity.

### Performance impact

- SSR improves LCP when TTFB remains healthy.
- Overloaded SSR origin can worsen LCP despite server rendering.
- SSG/ISR maximize CDN hit rate and minimize origin variance.
- CSR can be acceptable with tiny JS, edge API, and non-SEO surfaces.

### Failure modes

- SSR without caching becomes cost and latency bottleneck.
- SSG with frequent updates creates stale UX unless revalidation is robust.
- Hydration mismatch from non-deterministic server/client rendering.
- Wrong global decision ("all SSR") creates unnecessary complexity.

### Interview answer template

"I choose rendering per route. Marketing/docs: SSG, catalog-like pages: ISR, personalized SEO pages: SSR, authenticated dashboard: CSR. This optimizes LCP and infra cost simultaneously. Risk is complexity across modes, mitigated via route-level conventions and monitoring TTFB/LCP per route."

---

## 3) Rendering patterns (hydration, streaming, partial rendering, islands, RSC)

### Decision model

- Need fastest first paint with server data? -> streaming SSR.
- Need less JS shipped? -> RSC/islands.
- Need interactive priority under heavy page? -> selective hydration boundaries.
- Mostly static page with sparse interactivity? -> islands.

### Trade-offs

- **Streaming SSR**
  - Pros: early paint, reduced blank screen time.
  - Cons: more complex error handling and shell fallback logic.
- **Selective/partial hydration**
  - Pros: interactive parts become usable sooner.
  - Cons: boundary planning complexity.
- **Islands**
  - Pros: minimal JS for static regions.
  - Cons: cross-island coordination can get awkward.
- **RSC**
  - Pros: large JS reduction, server-side data access.
  - Cons: mental model shift, serialization boundaries, ecosystem constraints.

### Performance impact

- Streaming improves FCP/LCP more than TTI directly.
- Hydration cost still impacts INP and main-thread blocking.
- RSC reduces JS parse/execute cost significantly on content-heavy surfaces.
- Too many islands can increase orchestration overhead and duplicated runtime.

### Failure modes

- Hydration mismatches from random/time/browser-only values during render.
- Error in shell stream can blank page if fallback strategy is weak.
- Too-granular boundaries create maintenance burden.
- Incorrect client/server component boundary in RSC causes runtime errors.

### Interview answer template

"I'd stream the shell first, use suspense boundaries around slow regions, and keep non-interactive regions server-only where possible. That improves LCP and reduces JS cost. Risk is hydration mismatch and boundary complexity, so I'd enforce deterministic render rules and add boundary-level error fallbacks."

---

## 4) Module Federation vs NPM package distribution

### Decision model

Ask org-first questions:
- Do teams deploy independently?
- Do teams own distinct user surfaces and roadmap?
- Is runtime integration acceptable operationally?

If answer is mostly "no", choose npm package distribution.
If "yes" across teams and autonomy is a bottleneck, consider Module Federation.

### Trade-offs

- **NPM package distribution**
  - Pros: deterministic builds, type-safe, easier CI, simpler runtime.
  - Cons: consumers must rebuild/redeploy to receive updates.
- **Module Federation**
  - Pros: runtime independent deploys, organizational decoupling.
  - Cons: runtime failure risk, dependency version negotiation, observability complexity.

### Performance impact

- NPM composition usually yields better startup determinism.
- Federation can increase startup/network variance (remote fetch, fallback paths).
- Incorrect shared dependency setup can duplicate frameworks and hurt bundle/INP.

### Failure modes

- Remote unavailable -> blank feature without robust fallback.
- Shared singleton mismatch (React dup) -> hook/runtime failures.
- Contract drift between host and remote -> runtime breakage.
- CSS leakage across boundaries.

### Interview answer template

"I default to npm package sharing. I'd use Module Federation only when independent deploy cadence across teams is a hard requirement. It solves autonomy, but adds runtime risk. I'd mitigate with explicit contracts, singleton dependency governance, and graceful remote fallback."

---

## 5) State management (Redux, Zustand, Vuex/Pinia, context)

### Decision model

Classify state first:
- Server state -> React Query/SWR/Apollo.
- URL/navigation state -> router.
- Local UI state -> component state.
- Cross-cutting client domain state -> Zustand/Redux/Pinia.

Choose store by team and problem:
- Existing enterprise conventions/middleware/time travel -> Redux Toolkit.
- Lightweight modern app with selector patterns -> Zustand/Pinia/Jotai.
- Small scope and low update frequency -> Context.

### Trade-offs

- **Redux Toolkit**
  - Pros: structure, tooling, middleware ecosystem.
  - Cons: more ceremony than lightweight stores.
- **Zustand/Pinia**
  - Pros: low boilerplate, easy selectors.
  - Cons: less strict architecture by default.
- **Context**
  - Pros: zero dependency.
  - Cons: broad updates if not carefully segmented.

### Performance impact

- Selector-driven stores reduce re-renders.
- Global context with rich object values drives expensive subtree renders.
- Putting server state in Redux duplicates caching logic and causes stale data bugs.

### Failure modes

- One mega-store for every state type.
- Duplicate state copies (query cache + Redux mirror) causing inconsistency.
- Optimistic update rollback not handled -> user sees phantom state.

### Interview answer template

"I separate server state from client state first. Server state lives in query cache; client domain state in Zustand/Redux based on team conventions. This prevents stale duplication and reduces boilerplate. I measure with render counts and mutation consistency under failure."

---

## 6) API integration patterns (REST, GraphQL, caching layers)

### Decision model

Choose protocol by product surface:
- Public/simple resource model -> REST.
- Complex graph + many client variants -> GraphQL.
- Full-stack TS internal platform -> tRPC can be efficient.

Then define cache layers explicitly:
- Browser HTTP cache
- CDN cache
- App cache (query client/apollo)
- Optional SW offline cache

### Trade-offs

- **REST**
  - Pros: HTTP-native caching, simple debugging.
  - Cons: over/under-fetching for complex joins.
- **GraphQL**
  - Pros: flexible fetching, schema contracts, normalized cache.
  - Cons: operational complexity, resolver performance pitfalls.

### Performance impact

- Poor fetch orchestration creates client waterfalls.
- Query dedupe and parallelization directly improve TTFB->TTI path.
- Overly aggressive re-fetch policies can hurt INP and battery.
- Cache invalidation strategy determines perceived freshness vs bandwidth.

### Failure modes

- Missing idempotency assumptions for retries.
- No cancellation for stale requests -> race conditions.
- Cache keys too broad (stale data bleed) or too narrow (cache misses).
- GraphQL resolver N+1 issues causing backend latency spikes.

### Interview answer template

"I'd keep protocol choice aligned with domain complexity, then design cache and invalidation as first-class. For this app I'd use React Query with deterministic keys, dedupe, stale-time, optimistic mutations, and rollback. Success metric is reduced repeated requests and stable p75 latency."

---

## 7) Observability and monitoring (logs, metrics, error tracking)

### Decision model

Start with minimum production baseline:
- Error tracking (source maps + release tags)
- RUM web vitals
- API latency/failure metrics
- Correlation IDs across frontend/backend

Then scale with:
- Session replay (sampled, privacy-safe)
- Distributed tracing
- Alerting with runbooks

### Trade-offs

- More telemetry increases debuggability but adds cost and privacy risk.
- High sampling quality improves incident response but can affect payload volume.
- Session replay is powerful but must be carefully masked.

### Performance impact

- Telemetry SDK size can hurt startup if loaded eagerly.
- Frequent unbatched logging can affect network and battery.
- Batching + `sendBeacon` + deferred init reduces user impact.

### Failure modes

- No source map upload -> unreadable production stacks.
- Over-logging sensitive data (PII/compliance incident).
- Alert fatigue from noisy thresholds.
- Missing release tagging makes regression attribution slow.

### Interview answer template

"I instrument errors, vitals, and API health as baseline. I batch logs, sample traces, and enforce PII scrubbing. That balances signal quality with user overhead. I validate by MTTR reduction and alert precision."

---

## 8) Architecture patterns (Monolith vs Micro-frontends, Monorepo vs Multi-repo)

### Decision model

Separate these axes:
- Runtime composition: monolith vs MFE.
- Codebase topology: monorepo vs multi-repo.

Decide runtime architecture by team autonomy and surface boundaries.
Decide repo topology by dependency sharing, refactor frequency, and governance maturity.

### Trade-offs

- **Monolith**
  - Pros: consistent UX, simpler runtime.
  - Cons: coupled release process.
- **MFE**
  - Pros: team autonomy, independent deploy.
  - Cons: runtime integration and consistency cost.
- **Monorepo**
  - Pros: atomic changes, shared tooling.
  - Cons: CI complexity without caching.
- **Multi-repo**
  - Pros: strict isolation.
  - Cons: cross-repo coordination overhead.

### Performance impact

- MFE may increase startup and route-transition complexity.
- Monorepo can be very fast with correct build graph caching.
- Poorly bounded modules increase bundle size and duplicate dependencies.

### Failure modes

- Premature MFE adoption with small team.
- Weak dependency boundaries in monorepo leading to hidden coupling.
- CI bottlenecks from full-repo builds on every change.

### Interview answer template

"I would start as modular monolith in a monorepo, enforce package boundaries, and migrate to MFE only when independent deploy velocity becomes a measurable bottleneck. This minimizes runtime complexity while preserving a growth path."

---

## 9) Performance optimization at scale (code splitting, bundle analysis)

### Decision model

Use metric-led prioritization:
1. Identify bottleneck metric (LCP/INP/CLS/TTFB).
2. Trace likely root causes (network/main thread/layout).
3. Apply highest ROI fix.
4. Re-measure at p75 real-user level.

### Trade-offs

- More splitting reduces initial JS but increases request overhead.
- Aggressive preloading helps LCP but can compete for bandwidth.
- Compression and caching help transfer size but not execution cost.

### Performance impact details

- **LCP** depends on TTFB + resource discovery + rendering.
- **INP** depends on main thread contention and event handler cost.
- **CLS** depends on layout stability from first render onward.
- Parse/execute time often dominates on mid-tier mobile, not network alone.

### Failure modes

- Optimizing for Lighthouse lab while real users remain slow.
- Ignoring CPU cost of JS and focusing only on bytes.
- Regressions after dependency upgrades without budget gates.

### Interview answer template

"I treat performance as a budgeted product requirement. For this app I'd set LCP <2.5s, INP <200ms p75, enforce bundle budgets in CI, and track route-level RUM. Fixes are prioritized by measured bottleneck, not intuition."

---

## 10) CI/CD and deployment strategy for frontend

### Decision model

Pipeline goals:
- Fast PR feedback
- Safe rollout
- Fast rollback

Release model:
- Deploy immutable artifacts
- Decouple deploy from release with feature flags
- Progressive exposure (canary/blue-green)

### Trade-offs

- Strict gates increase reliability but slow lead time.
- Looser gates increase velocity but raise incident risk.
- Canary adds operational complexity but lowers blast radius.

### Performance and reliability impact

- Preview environments reduce integration surprises.
- Caching in CI dramatically lowers cycle time.
- Smaller deploy units can speed recovery but increase coordination.

### Failure modes

- No rollback practice until incident.
- Missing artifact immutability causes cache poisoning issues.
- Build once/deploy many not respected across environments.
- Secrets mismanagement in CI.

### Interview answer template

"I run a fast-lane CI gate for quality and a progressive rollout strategy for safety. Deploys are immutable with short-lived HTML cache and immutable hashed assets. Feature flags decouple code shipping from user exposure, so rollback is minutes, not hours."

---

## 11) Cross-topic trade-off map (the one table to remember)

| Decision | Helps | Hurts | Watch metric |
|---|---|---|---|
| SSR more routes | SEO/LCP | TTFB/server cost | TTFB, origin CPU, LCP |
| More code splitting | initial JS | request overhead | LCP, INP, request count |
| Move to MFE | team autonomy | runtime complexity | startup errors, bundle duplication |
| Centralize state in one store | discoverability | coupling/re-renders | interaction latency, stale bugs |
| Aggressive telemetry | debuggability | payload/cost/privacy | bundle size, egress, legal risk |
| Strict CI gates | reliability | throughput | lead time, change failure rate |

---

## 12) How to sound senior under pressure

Use these patterns in answers:

- "I would choose X **for this route/surface**, not globally."
- "The main trade-off is A vs B; for this context I optimize A."
- "I’d validate this with metric M at p75, not just local benchmarks."
- "Risk here is R; mitigation is K; fallback is F."
- "If org constraints change (more teams/global traffic), this design evolves by..."

Avoid:
- "It depends" with no decision.
- Tool-first answers ("I'd use Redux/GraphQL/MFE") before clarifying constraints.
- Performance claims without metrics.

---

## 13) Final night checklist (60 minutes)

1. Rehearse one 5-minute answer for each of the 10 topics above.
2. For each answer include:
   - one concrete decision
   - one rejected alternative
   - one risk
   - one metric to validate
3. Do one full mock prompt from `11-mock-prompts.md`.
4. End with a 2-minute "architecture summary" pitch.

If you can do this clearly, you are interview-ready.
