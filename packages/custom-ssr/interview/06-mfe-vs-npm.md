# 06 – Module Federation vs NPM Package Distribution

> **Abbreviations:** [Glossary (00)](./00-glossary.md) — MF (Module Federation), MFE (Micro-Frontend), SSI (Server Side Includes), ESI (Edge Side Includes), ESM (ECMAScript Modules), CJS (CommonJS), SEO (Search Engine Optimization).

## 60-second talk-track

> "There are three ways to share code across apps: **build-time** via npm packages, **server-side composition** (SSI / fragments), and **runtime** via Module Federation or Web Components. NPM is the default – versioned, type-safe, tree-shakable, but every consumer must rebuild and redeploy when you ship. Module Federation lets the host load remote chunks over HTTP at runtime, so teams ship independently – at the cost of runtime risk, shared-dependency hell, and harder type-safety. I use npm for design systems and pure libs, MF only when the org genuinely needs independent deploys per team."

---

## Cheat-sheet table (MEMORIZE)

| | NPM package | Module Federation (MF) | Web Components | iframe |
|---|---|---|---|---|
| Integration time | build | runtime | runtime | runtime |
| Independent deploy | no | yes | yes | yes |
| Shared dependencies | hoisted by pkg mgr | runtime `shared` config | duplicate runtimes | duplicate runtimes |
| Type-safety | great | hard (need codegen) | weak | none |
| Failure mode | build fails | runtime fetch fails (need fallback) | DOM error | iframe blank |
| Best for | design system, utils, hooks | MFE (Micro-Frontend) shell with team-owned panels | embed in foreign tech | totally untrusted code, legacy |
| SEO (Search Engine Optimization) | inherits host | inherits host | inherits host | bad |
| Bundle dedup | yes | yes (if shared correctly) | no | no |

---

## NPM-style package – what "good" looks like

`package.json`:
```json
{
  "name": "@org/ui",
  "version": "1.4.2",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".":        { "types": "./dist/index.d.ts", "import": "./dist/index.js", "require": "./dist/index.cjs" },
    "./button": { "types": "./dist/button.d.ts", "import": "./dist/button.js" }
  },
  "sideEffects": ["**/*.css"],
  "peerDependencies": { "react": ">=18", "react-dom": ">=18" }
}
```

Key things to mention:
- `exports` map (subpath exports + dual ESM/CJS).
- `sideEffects: false` (or array of CSS files) for tree-shaking.
- `peerDependencies` for React – never bundle React in a lib.
- Build with `tsup` / `vite lib mode` / `rollup`.
- Version with **Changesets** (`@changesets/cli`) → automated CHANGELOG + version bump.
- Publish via CI on tag push.

---

## Module Federation – mental model

```
HOST (app-shell.com)                      REMOTE (checkout.example.com)
┌────────────────────┐                    ┌────────────────────┐
│ Webpack/Vite       │                    │ Webpack/Vite       │
│ container          │                    │ exposes:           │
│  remotes: {        │ ───── fetches ───▶ │   ./Cart           │
│    checkout: 'url' │  remoteEntry.js    │   ./Payment        │
│  }                 │ ◀──── shares ───── │ shares:            │
│  shared: { react } │                    │  { react: ... }    │
└────────────────────┘                    └────────────────────┘
       │
       ▼
React.lazy(() => import('checkout/Cart'))
```

Vite config (`@originjs/vite-plugin-federation`):

```ts
// host
federation({
  name: 'host',
  remotes: { checkout: 'https://checkout.example.com/assets/remoteEntry.js' },
  shared: ['react', 'react-dom'],
});

// remote
federation({
  name: 'checkout',
  filename: 'remoteEntry.js',
  exposes: { './Cart': './src/Cart.tsx' },
  shared: ['react', 'react-dom'],
});
```

Consumer:
```tsx
const Cart = React.lazy(() => import('checkout/Cart'));
<Suspense fallback={<Spinner/>}><ErrorBoundary fallback={<Fallback/>}><Cart/></ErrorBoundary></Suspense>
```

---

## Things that go wrong with MF (talk-track gold)

1. **Shared dep version drift** – two Reacts loaded → hooks break. Fix: `singleton: true, requiredVersion: '^18'`.
2. **Network failure** – remote down = blank screen. Fix: ErrorBoundary + cached last-known-good in CDN.
3. **Type-safety** – remote types not available at host build. Fix: publish `.d.ts` separately to npm or use `@module-federation/typescript`.
4. **CSS conflicts** – global selectors leak across MFEs. Fix: CSS Modules, Shadow DOM, prefixing convention.
5. **State sharing** – two MFEs need same user. Fix: shared context via host-injected provider, or events on `window`, or a shared singleton module (`shared: ['@org/auth']`).
6. **Versioning contract** – breaking change in remote breaks host silently. Fix: contract tests, semver discipline on exposed surface.
7. **Hydration boundary** – streaming SSR + MF is hard; usually MFEs are CSR-mounted lazily.

---

## When MFE is the right call

- ≥3 teams, ≥3 deploy cadences.
- Truly independent product surfaces (e.g. Spotify: search, library, podcasts).
- Acquisitions (different tech stacks).
- Plugin ecosystems (Backstage).

## When MFE is the wrong call

- One team, one product → just split into npm packages.
- Highly coupled UX (consistent design / data flow) → MFE seams will leak.
- SEO-critical pages → SSR + MF integration is brittle.

---

## Other runtime integration styles (mention these for completeness)

- **iframes** – maximum isolation, terrible UX (focus, modals, deeplinks).
- **Web Components** – framework-agnostic, hard for complex state, no SSR story.
- **Server-side composition** – Nginx SSI, ESI, Podium, Tailor – assemble HTML at edge. Great for SEO, harder for interactive.
- **Single-spa** – older MFE framework, route-level orchestration.

---

## Common interview questions

**Q: Module Federation vs npm – when?**
- Headline: "npm by default, MF only when deploy independence is the actual constraint."

**Q: How do you version a shared design system?**
- Semver + Changesets.
- Major bump = breaking → migration guide.
- Codemod (jscodeshift) for big renames.
- Visual regression tests (Chromatic) before publish.

**Q: How do you keep shared deps consistent across MFEs?**
- `shared` config with `singleton: true, strictVersion: true`.
- Renovate PRs to bump in lockstep.
- CI check: fail build if `react` version differs across MFEs.

**Q: How do you do auth across MFEs?**
- Host owns auth, exposes `useAuth` via a shared singleton module.
- Or: each MFE reads same httpOnly cookie via shared API client.

**Q: SSR + MF – possible?**
- Server-side MF exists (`@module-federation/node`), still niche.
- More common: MFEs hydrate after CSR shell, accept worse LCP.

---

## Hands-on (skip if short on time)

If you have 45 min, scaffold a host + remote with `@originjs/vite-plugin-federation` and run both on different ports. Even loading a remote `<Button>` over HTTP gives you a story to tell.
