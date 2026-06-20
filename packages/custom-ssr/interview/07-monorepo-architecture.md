# 07 – Architecture: Monolith vs MFE, Monorepo vs Multi-repo

> **Abbreviations:** [Glossary (00)](./00-glossary.md) — MFE (Micro-Frontend), SSR (Server-Side Rendering), SEO (Search Engine Optimization), E2E (End-to-End testing), OSS (Open Source Software).

## 60-second talk-track

> "Architecture decisions are **org decisions wearing a tech hat**. A frontend monolith is the right default until team coordination becomes the bottleneck – usually around 4–5 teams. Micro-frontends solve independent deploys at the cost of runtime complexity and UX consistency. Orthogonally, monorepo vs multi-repo is about how you store code, not how you deploy it: monorepos give you atomic cross-cutting changes and a single source of truth, multi-repos give you isolation at the cost of coordination. The combinations that work in practice: monolith-in-monorepo (most companies), or MFEs-in-monorepo (Vercel, Shopify), or MFEs-in-multi-repo (only if teams are fully independent)."

---

## The 2x2

```
                  Monolith          Micro-frontends
              ┌─────────────────┬─────────────────┐
  Monorepo    │ Most startups   │ Vercel, Shopify │
              │ Pinterest early │ Atlassian       │
              ├─────────────────┼─────────────────┤
  Multi-repo  │ Legacy / small  │ Spotify         │
              │ team            │ Microsoft       │
              └─────────────────┴─────────────────┘
```

---

## Monolith vs MFE – the trade-off table

| | Monolith | MFE |
|---|---|---|
| Deploy unit | one | many |
| Team autonomy | low | high |
| UX consistency | easy | needs design system |
| Initial perf | best | worse (multiple runtimes) |
| Routing | client router | host router + nested |
| Shared state | trivial | hard (events / shared module) |
| Versioning | atomic | contract per MFE |
| Onboarding | simple | complex |
| Failure isolation | global | per MFE |
| Right when | <4 teams, <100 devs | many teams, independent products |

**Migration strategy** (strangler fig):
1. Extract a design system to a shared npm pkg.
2. Build a thin shell app with routing.
3. Move one route at a time into a remote MFE.
4. Decommission monolith route.
5. Repeat until empty.

---

## Monorepo vs Multi-repo

| | Monorepo | Multi-repo |
|---|---|---|
| Cross-cutting changes | one PR | N PRs, ordered |
| Code sharing | direct workspace deps | publish to registry |
| CI cost | needs caching (turbo/nx) | naturally isolated |
| Discovery | one place | scattered |
| Permissions | path-based (CODEOWNERS) | repo-level |
| Tool fragmentation | enforced | drifts |
| Blast radius | bigger | smaller |
| Best for | one company, many packages | OSS, isolated teams |

**Monorepo stack of choice (2026):**
- `pnpm` workspaces (cheap, strict).
- `Turborepo` or `Nx` for task graph + remote cache.
- `Changesets` for versioning published packages.
- `syncpack` to keep dep versions aligned.
- `CODEOWNERS` for review boundaries.
- Path-based CI filters (`turbo run build --filter=...[origin/main]`).

---

## Workspace layout that works

```
repo/
├── apps/                  # deployables
│   ├── web/
│   ├── admin/
│   └── mobile/
├── packages/              # internal libs
│   ├── ui/                # design system
│   ├── hooks/
│   ├── api-client/
│   └── config/            # eslint, tsconfig, prettier presets
├── tooling/               # scripts, codemods
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

Rules:
- `apps/*` never imports from another `apps/*`.
- `packages/*` never imports from `apps/*`.
- Cyclic deps fail CI (`madge --circular`).

---

## When MFE is overkill (memorize this push-back)

If the interviewer pushes you to "use MFEs", be ready to say:

> "Before I'd reach for MFEs I'd ask: do we have multiple teams shipping independently? Do they own distinct product surfaces? If not, MFEs add runtime complexity, hurt LCP, and fragment UX without solving a real problem. A modular monolith in a monorepo gets us 90% of the benefit at 10% of the cost."

That single line signals seniority.

---

## Common interview questions

**Q: How do you handle a shared design system across MFEs?**
- One npm package consumed by all (build-time, not runtime, to avoid duplicate React tree).
- Versioned with Changesets, breaking changes require coordination.
- Visual regression via Chromatic.
- Token-based theming (CSS variables) so MFEs can re-skin without rebuild.

**Q: How do you keep monorepo CI fast?**
- Turbo/Nx remote cache (hit rate >80% is normal).
- Affected-only (`turbo run test --filter=...[origin/main]`).
- Cache pnpm store across runs.
- Parallel matrix for app builds.
- Separate "fast" lane (lint + types) vs "slow" lane (e2e).

**Q: Atomic refactor across 30 packages – how?**
- Monorepo: one PR, codemod via jscodeshift / ts-morph, CI on all packages.
- Multi-repo: deprecate old API → release → consumers migrate → remove. Months instead of days.

**Q: How do you decide app boundaries?**
- One deploy lifecycle = one app.
- One audience = one app (admin vs public).
- Don't split for "future scale" – split when pain appears (build time >2 min, deploy coupling, team contention).

**Q: What's "modular monolith"?**
- One deployable, but internal package boundaries enforced like microservices.
- `packages/checkout`, `packages/catalog` – can't import each other directly, communicate via a contract module.
- Easy to extract to MFE later if needed. Best default for most teams.

---

## Diagram to draw on the whiteboard

```
                ┌─────────────────────────┐
                │  Shell app (host)       │
                │  routing + auth + nav   │
                └──────┬───────────┬──────┘
                       │           │
            ┌──────────▼──┐   ┌────▼─────────┐
            │ Catalog MFE │   │ Checkout MFE │
            │ team A      │   │ team B       │
            └─────────────┘   └──────────────┘
                       │           │
                       └─────┬─────┘
                             ▼
                  ┌────────────────────┐
                  │ Design system (npm)│
                  │ Auth (npm singleton)│
                  └────────────────────┘
```

Then mark deploy units, version contracts, shared singletons.
