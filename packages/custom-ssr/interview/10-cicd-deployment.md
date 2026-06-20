# 10 – CI/CD & Deployment Strategies for Frontend

> **Abbreviations:** [Glossary (00)](./00-glossary.md) — CI/CD (Continuous Integration/Deployment), CDN (Content Delivery Network), TTL (Time To Live), E2E (End-to-End testing), LHCI (Lighthouse CI), SBOM (Software Bill of Materials), CycloneDX (SBOM standard), SHA (Secure Hash Algorithm), KV (Key-Value store), S3 (Amazon Simple Storage Service).

## 60-second talk-track

> "Frontend CI/CD has three goals: **fast feedback** on PRs, **safe rollouts** to prod, and **easy rollback** when things break. I separate the pipeline into fast-lane (lint, types, unit, build) and slow-lane (e2e, visual regression, Lighthouse), gate merges on fast-lane, and run slow-lane in parallel with a soft fail. Deploys are immutable hashed artifacts to a CDN with short-TTL HTML and long-TTL assets. Risky changes go behind feature flags so deploy and release are decoupled. Rollback is `git revert` + redeploy, or for static assets just point traffic at the previous build."

---

## Pipeline stages (memorize this order)

```
PR opened
  │
  ├── 1. Install (cache pnpm store)         ~30s
  ├── 2. Lint + Typecheck (parallel)         ~60s
  ├── 3. Unit tests (sharded)                ~90s
  ├── 4. Build (turbo cached)                ~60s  ◀── gate merge here
  ├── 5. Preview deploy (Vercel/Netlify)     ~30s
  ├── 6. E2E (Playwright on preview URL)     ~3-5m
  ├── 7. Visual regression (Chromatic)       ~1m
  ├── 8. Lighthouse CI (on preview URL)      ~2m
  └── 9. Bundle size diff (size-limit)       ~10s
```

Lanes 6–9 run in parallel, gate merge depending on org maturity.

---

## GitHub Actions snippet you can paste

```yaml
name: CI
on: [pull_request, push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - uses: actions/cache@v4
        with:
          path: .turbo
          key: turbo-${{ github.sha }}
          restore-keys: turbo-
      - run: pnpm turbo run lint typecheck test build
      - uses: actions/upload-artifact@v4
        with: { name: dist, path: apps/web/dist }

  preview:
    needs: build
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with: { name: dist, path: dist }
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          working-directory: dist
```

Add Turbo Remote Cache (`TURBO_TOKEN`/`TURBO_TEAM`) → hit rate >80%.

---

## Versioning published packages (Changesets)

```
pnpm changeset           # write a changeset describing changes
pnpm changeset version   # bumps versions + CHANGELOG
pnpm changeset publish   # publishes to npm (in release workflow)
```

Release workflow on `main`:
```yaml
- uses: changesets/action@v1
  with:
    publish: pnpm changeset publish
    version: pnpm changeset version
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Result: PRs to bump versions auto-created; merge to publish.

---

## Deployment patterns

| Pattern | What | When |
|---|---|---|
| **Blue / Green** | two identical envs, switch traffic | predictable cutover, easy rollback |
| **Canary** | 1% → 10% → 50% → 100% | risk-averse, has telemetry |
| **Rolling** | instance by instance | container deploys, gradual |
| **Feature flag** | deploy off, release later | decouples deploy from release |
| **Dark launch** | running but not user-visible | perf/load test in prod |
| **Atomic deploy** | all assets swap together | static sites (Vercel default) |

For static FE: blue/green by pointing CDN alias at new build; rollback = re-alias previous.

---

## Caching strategy on deploy

```
/index.html        Cache-Control: no-cache, must-revalidate
/assets/*.js       Cache-Control: public, max-age=31536000, immutable
/assets/*.css      Cache-Control: public, max-age=31536000, immutable
/assets/*.woff2    Cache-Control: public, max-age=31536000, immutable
/api/*             Cache-Control: private, no-store
```

Why:
- Hashed filenames → infinite cache safe.
- `index.html` must reflect latest deploy → no-cache.
- API responses depend on user → no shared cache.

---

## Feature flags – the pattern

```tsx
const flags = useFlags();
{flags.newCheckout ? <CheckoutV2/> : <CheckoutV1/>}
```

Provider sources:
- LaunchDarkly / Statsig / Unleash (vendor).
- Self-hosted (PostHog, ConfigCat).
- Homegrown (env var + KV store).

Rules:
- Flag = code debt → schedule removal.
- Default value safe.
- Targeting rules in vendor UI, not in code.
- Server-side eval for SSR (don't ship all user flags).

---

## Rollback playbook

For static frontend (Vercel/Netlify/S3+CloudFront):
1. Identify last-known-good deployment.
2. Promote previous build to alias (`vercel rollback <url>`).
3. Verify with smoke tests.
4. Communicate in incident channel.
5. Post-mortem.

For SSR (containers):
1. Re-deploy previous image tag.
2. Or scale up old version + drain new.

Time-to-rollback should be < 5 min. If it isn't, fix the pipeline.

---

## Environment promotion

```
PR preview  ──▶  staging (main branch)  ──▶  canary 1%  ──▶  prod 100%
   auto              auto                       manual gate       auto on telemetry green
```

Each env has its own:
- Backend URL.
- Feature flag environment.
- Sentry release env.
- Lower CDN TTL (faster iteration).

---

## Common interview questions

**Q: How long is your PR-to-prod cycle?**
- Fast lane: ~3 min for merge gate.
- Auto-deploy to staging: +2 min.
- Canary in prod: +5 min observation.
- Full rollout: +30 min.
- Target: same day, multiple times.

**Q: How do you handle DB / API contract changes alongside FE?**
- Backward-compatible BE deploys first.
- FE shipped behind flag.
- Flag flipped on after BE verified.
- Remove old BE path after FE 100% on new.
- (Expand → migrate → contract.)

**Q: Monorepo CI takes 20 min. How do you cut it?**
- Turbo remote cache.
- Affected-only (`--filter=...[origin/main]`).
- Shard tests across machines.
- Pre-built CI image with deps cached.
- Drop unnecessary jobs (e.g. full e2e on every push → only on main).

**Q: Atomic deploy across MFEs – how?**
- Hardest part of MFE. Options:
  - Coordinated release window.
  - Backward-compat contract (additive only).
  - Version negotiation in host shell (`if (remote.version >= 2) ...`).
  - Or: each MFE is a separate app, no atomic guarantee, design for staggered rollout.

**Q: How do you secure the supply chain?**
- Lockfile committed; `--frozen-lockfile` in CI.
- Renovate/Dependabot for auto PRs.
- `pnpm audit` in CI, fail on high.
- `npm provenance` on publish.
- SBOM (CycloneDX) generation in release.
- Pinned actions by SHA in GitHub Actions.
