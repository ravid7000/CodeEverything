# 08 – Performance at Scale

## 60-second talk-track

> "Performance work is **measure → fix → measure**, gated on a budget tied to a business metric. I track the three Core Web Vitals – LCP, INP, CLS – plus bundle size and TTI. Common wins in order of ROI: kill render-blocking JS/CSS, lazy-load below the fold, code-split routes, optimize the LCP image (proper size + `priority`), defer third-party scripts. At scale the harder fixes are: ship less framework (RSC/islands), move heavy work off the main thread (web workers), avoid hydration cost, and own your perf budget in CI so regressions can't merge."

---

## Core Web Vitals (2026 set – memorize)

| Metric | What | Good | Common fix |
|---|---|---|---|
| **LCP** | Largest Contentful Paint | < 2.5s | preload hero image, SSR/SSG, faster TTFB, smaller image |
| **INP** | Interaction to Next Paint (replaced FID in 2024) | < 200ms | break long tasks, debounce, move work to worker |
| **CLS** | Cumulative Layout Shift | < 0.1 | size attrs on images, reserve space for ads/fonts |

Also track: **TTFB** (< 800ms), **FCP** (< 1.8s), **TBT** (lab proxy for INP).

---

## The fix playbook (in priority order)

1. **TTFB** – CDN, edge, cache, faster backend.
2. **Render-blocking** – defer JS (`async`/`defer`), inline critical CSS, preconnect to origins.
3. **LCP image** – `<img loading="eager" fetchpriority="high" srcset>`, AVIF/WebP, correct dimensions.
4. **JS size** – route-based code split, dynamic imports, tree-shake, replace heavy deps (moment→date-fns, lodash→lodash-es with subpath).
5. **Hydration cost** – RSC, islands, defer hydration of below-the-fold.
6. **Third-party** – facade pattern (load YouTube embed on click), self-host fonts, GTM hygiene.
7. **CLS** – reserve dimensions, `font-display: optional`, transform animations (not layout).
8. **INP** – `requestIdleCallback`, `scheduler.yield()`, web workers (Comlink), virtualize lists.
9. **Cache** – immutable hashed assets + long TTL, short TTL on HTML.

---

## Code-splitting checklist

- Route-level split (Next does this automatically).
- Component-level for heavy editors/charts: `const Chart = lazy(() => import('./Chart'))`.
- Vendor split: pin large deps (`@vis.gl/react-google-maps`) to their own chunk.
- Granular chunks: Vite/Webpack `splitChunks` to share between routes.
- **Don't over-split**: each chunk is an HTTP request. Aim for chunks ~30–150kb gzipped.
- Preload likely next route on hover (`<link rel="prefetch">` or router prefetch).

---

## Bundle analysis workflow

```bash
# Vite
pnpm add -D rollup-plugin-visualizer
# vite.config.ts
plugins: [react(), visualizer({ open: true, gzipSize: true, brotliSize: true })]

# Webpack
pnpm add -D webpack-bundle-analyzer
```

Look for:
- Duplicate React (two versions hoisted twice).
- Locale data (moment, full ICU).
- `lodash` imported as default (not tree-shaken).
- Polyfills shipped to modern browsers (use `<script type="module">` + `nomodule`).
- Source maps in production (security AND size).

---

## Web Vitals in code

```ts
import { onLCP, onINP, onCLS, onTTFB } from 'web-vitals';

function send(metric) {
  navigator.sendBeacon('/rum', JSON.stringify(metric));
}
onLCP(send); onINP(send); onCLS(send); onTTFB(send);
```

Real RUM gives you p75 by route/device. Synthetic (Lighthouse CI) gives you regression alerts on PRs.

---

## Perf budget in CI (talk-track gold)

```yaml
# lighthouse-budget.json
[{
  "path": "/*",
  "resourceSizes": [
    { "resourceType": "script",    "budget": 250 },
    { "resourceType": "image",     "budget": 300 },
    { "resourceType": "stylesheet","budget": 50 }
  ],
  "timings": [
    { "metric": "interactive",     "budget": 3000 },
    { "metric": "largest-contentful-paint", "budget": 2500 }
  ]
}]
```

Wire into PR via `lhci autorun --upload.target=temporary-public-storage`. Fail PR if budget breaks.

Also use `size-limit` for raw bundle size assertion:
```json
"size-limit": [{ "path": "dist/assets/index-*.js", "limit": "180 KB" }]
```

---

## Long tasks & INP

- Anything > 50ms on main thread blocks input.
- Tools: Performance panel → Long Tasks lane, `PerformanceObserver({ type: 'longtask' })`.
- Fixes:
  - Break work with `await scheduler.yield()` (or `setTimeout(0)`).
  - Use `React.startTransition` for non-urgent state updates.
  - Move CPU work to web worker (Comlink makes RPC easy).
  - Virtualize long lists (`@tanstack/virtual`, `react-window`).
  - Memoize expensive selectors.

---

## Images & fonts (the cheap wins)

Images:
- AVIF > WebP > JPEG.
- Responsive: `srcset` + `sizes`.
- Lazy below the fold (`loading="lazy"`).
- Use Next `<Image>` / Cloudinary / Imgix – they do the work.
- Set explicit `width` and `height` (CLS).

Fonts:
- Self-host (`/fonts/Inter.woff2`).
- `preload` the one variable font you need.
- `font-display: swap` (or `optional` for stricter CLS).
- Subset to characters you use.

---

## Server-side perf

- Cache GET responses (Redis / CDN).
- Stream HTML (`renderToPipeableStream`).
- Use HTTP/2 or HTTP/3.
- Brotli compression for text assets.
- Edge SSR for global audience.
- Reduce origin work with `stale-while-revalidate` headers.

---

## Common interview questions

**Q: Your LCP is 4s. Where do you look first?**
1. Lighthouse → identify LCP element.
2. Network waterfall → is it the HTML, the CSS blocking, or the image?
3. If image: preload, resize, use AVIF.
4. If TTFB high: cache HTML at CDN, move to SSG/ISR.
5. If JS blocking: defer non-critical, code-split.

**Q: Bundle is 1.2MB gzipped. How do you cut it in half?**
- Visualize first.
- Remove duplicate React.
- Replace moment with date-fns, lodash with `lodash-es` subpath imports.
- Dynamic-import editors/charts/maps.
- Drop polyfills for evergreen browsers (`browserslist` config).
- Audit `@*/icons` – usually 100s of kb of unused SVG.

**Q: INP regressed after a feature launch. Process?**
- RUM diff between releases (per route).
- Reproduce in DevTools → find Long Tasks.
- Likely culprits: synchronous loop in a render path, large list re-render, third-party script.
- Fix with `useDeferredValue`, virtualization, or worker offload.

**Q: How do you prevent perf regressions?**
- Lighthouse CI on PR with budgets.
- `size-limit` checks.
- RUM dashboard with alerts on p75 regression.
- Perf review for any new dep > 30kb.
- Synthetic tests on a fixed-throttling profile (mid-tier Android).
