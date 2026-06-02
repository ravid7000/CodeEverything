# Frontend LLD – 1-Day Crash Plan (Interview Tomorrow)

You have ~12 productive hours. **Goal: confident talk-track on every topic + 2 things you actually built.**

> Rule: don't try to build everything. Interviewers care that you can **reason about trade-offs** and **show one or two things deeply**, not that you reimplemented React.

---

## Time Budget

| Block | Hours | Activity |
|---|---|---|
| Morning 1 | 2.0 | Read `01–05` docs. After each, close the doc and re-explain it out loud in 2 min. |
| Morning 2 | 2.0 | Read `06–10` docs. Same re-explain ritual. |
| Afternoon 1 | 2.5 | **Hands-on Build A**: finish `custom-ssr` (Day-1 doc). This is your "I've actually done SSR" story. |
| Afternoon 2 | 2.0 | **Hands-on Build B**: mini React Query in `packages/use-query` (Day-4 doc). This is your "I understand caching" story. |
| Evening 1 | 1.5 | Read `11-mock-prompts.md`. Do **one** end-to-end whiteboard design out loud. Record it on phone. Listen back at 1.5x. |
| Evening 2 | 1.0 | Re-read the **Trade-offs tables** in every doc. These are the lines you'll quote in the room. |
| Buffer | 1.0 | Sleep / weak-spot re-read. |

---

## Topic Docs

| # | File | What it gives you |
|---|---|---|
| 01 | [`01-rendering-csr-ssr-ssg.md`](./interview/01-rendering-csr-ssr-ssg.md) | CSR/SSR/SSG/ISR – when, why, trade-off table |
| 02 | [`02-hydration-streaming-islands.md`](./interview/02-hydration-streaming-islands.md) | Hydration, streaming SSR, partial/selective, islands, RSC |
| 03 | [`03-component-design.md`](./interview/03-component-design.md) | Compound components, headless UI, composability patterns |
| 04 | [`04-state-management.md`](./interview/04-state-management.md) | Redux/Zustand/Context/server-state separation |
| 05 | [`05-api-caching.md`](./interview/05-api-caching.md) | REST/GraphQL, cache layers, dedupe, optimistic updates |
| 06 | [`06-mfe-vs-npm.md`](./interview/06-mfe-vs-npm.md) | Module Federation vs npm packages, integration styles |
| 07 | [`07-monorepo-architecture.md`](./interview/07-monorepo-architecture.md) | Monolith vs MFE, monorepo vs multi-repo |
| 08 | [`08-performance.md`](./interview/08-performance.md) | Code splitting, bundle analysis, Core Web Vitals |
| 09 | [`09-observability.md`](./interview/09-observability.md) | Logs/metrics/traces, error tracking, RUM, web-vitals |
| 10 | [`10-cicd-deployment.md`](./interview/10-cicd-deployment.md) | CI pipeline, preview envs, rollout strategies |
| 11 | [`11-mock-prompts.md`](./interview/11-mock-prompts.md) | End-to-end design prompts + scoring rubric |
| 12 | [`12-handson-ssr.md`](./interview/12-handson-ssr.md) | **Build A**: finish this `custom-ssr` package (streaming + SSG + CSR routes) |
| 13 | [`13-handson-use-query.md`](./interview/13-handson-use-query.md) | **Build B**: mini React Query in `packages/use-query` |

---

## The 5 Things You Must Be Able to Say Without Thinking

1. **"SSR vs CSR vs SSG is a trade-off between TTFB, TTI, and server cost. I pick per-route, not per-app."**
2. **"Hydration is replaying the server-rendered tree on the client to attach event listeners. Streaming + selective hydration unblocks TTI."**
3. **"Server state and client state are different problems. React Query handles the first; Zustand/Redux the second. Mixing them is the #1 anti-pattern I see."**
4. **"Micro-frontends solve an org problem, not a tech problem. If your teams aren't independent, MFE adds cost without benefit."**
5. **"Monorepo with pnpm + Turborepo gives you atomic changes and a single version of truth. Multi-repo gives you isolation at the cost of coordination."**

If a question maps to one of these, **lead with the headline**, then justify.

---

## Anti-Patterns (mention these – they signal seniority)

- Putting server data in Redux.
- One global Context for everything (re-render storm).
- "We use MFEs" with one team and one product.
- 100% SSR everywhere "because SEO".
- Code-splitting at the file level without measuring (more requests > smaller bundles up to a point).
- Treating tests / observability / CI as "phase 2".

---

## What to Bring to the Whiteboard

A mental template you draw for **every** system design question:

```
┌──────────┐   ┌──────────┐   ┌──────────┐
│  Client  │──▶│   Edge   │──▶│  Origin  │
│ (browser)│   │ (CDN/    │   │ (SSR/API)│
│          │   │  worker) │   │          │
└──────────┘   └──────────┘   └──────────┘
     │              │               │
   cache         cache            cache
  (RQ/SW)       (HTTP)           (DB/Redis)
```

Then annotate each box with: rendering choice, caching TTL, observability hook, deploy unit.
This single diagram answers 80% of LLD prompts.

---

## If You Only Have 30 Minutes Left

Re-read in this order:
1. `01` trade-offs table (rendering)
2. `04` "server state vs client state" section
3. `06` Module Federation cheat-sheet
4. `11` one mock prompt
