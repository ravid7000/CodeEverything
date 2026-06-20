# 08 – Performance at Scale

> **Abbreviations:** [Glossary (00)](./00-glossary.md) — LCP (Largest Contentful Paint), INP (Interaction to Next Paint), CLS (Cumulative Layout Shift), FCP (First Contentful Paint), TTFB (Time to First Byte), TBT (Total Blocking Time), TTI (Time to Interactive), FID (First Input Delay), RUM (Real User Monitoring), RSC (React Server Components), SSR (Server-Side Rendering), SSG (Static Site Generation), ISR (Incremental Static Regeneration), CDN (Content Delivery Network), GTM (Google Tag Manager), CI/CD (Continuous Integration/Deployment), FPS (Frames Per Second), GPU (Graphics Processing Unit), CPU (Central Processing Unit), CRDT (Conflict-free Replicated Data Type), FOIT (Flash of Invisible Text).

## 60-second talk-track

> "Performance work is **measure → fix → measure**, gated on a budget tied to a business metric. I track the three Core Web Vitals – LCP, INP, CLS – plus bundle size and TTI. Common wins in order of ROI: kill render-blocking JS/CSS, lazy-load below the fold, code-split routes, optimize the LCP image (proper size + `priority`), defer third-party scripts. At scale the harder fixes are: ship less framework (RSC/islands), move heavy work off the main thread (web workers), avoid hydration cost, and own your perf budget in CI so regressions can't merge."

---

## Core Web Vitals (2026 set – memorize)

| Metric  | What                                             | Good    | Common fix                                              |
| ------- | ------------------------------------------------ | ------- | ------------------------------------------------------- |
| **LCP** | Largest Contentful Paint                         | < 2.5s  | preload hero image, SSR/SSG, faster TTFB, smaller image |
| **INP** | Interaction to Next Paint (replaced FID in 2024) | < 200ms | break long tasks, debounce, move work to worker         |
| **CLS** | Cumulative Layout Shift                          | < 0.1   | size attrs on images, reserve space for ads/fonts       |

Also track: **TTFB** (Time to First Byte, < 800ms), **FCP** (First Contentful Paint, < 1.8s), **TBT** (Total Blocking Time, lab proxy for INP).

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

## Runtime perf (client-heavy apps – Figma, Notion, dashboards)

Lighthouse and Core Web Vitals optimize **first load** on document-centric pages. A canvas editor, spreadsheet, or 200-widget dashboard spends 99% of its life **after** load. Different metrics, different tools.

### Load-time vs runtime – what still applies

| Concern | Marketing / e-commerce | Figma-like client app |
|---|---|---|
| Primary UX signal | LCP, TTFB, bundle on first visit | **Frame time**, input latency, memory over hours |
| Lighthouse score | Useful gate on PR | Weak signal – often CSR shell + empty canvas |
| INP | Clicks on DOM buttons/links | Still matters for chrome (menus, dialogs); **canvas pointer path is custom** |
| CLS | Critical | Less critical once shell is stable; watch dynamic panels/toolbars |
| Bundle size | Blocks first paint | Blocks **time-to-interactive editor** – still ship a budget |
| Long tasks | Hurts INP | Hurts **every frame** during pan/zoom/export |

**Interview line:** "I split perf into **cold start** (Lighthouse, bundle, TTI-to-first-edit) and **warm runtime** (FPS, heap, sync latency). Same measure → fix → measure loop, different dashboards."

---

### Runtime metrics to track

| Metric                         | What it means                                       | Target (rule of thumb)                           | How to measure                                       |
| ------------------------------ | --------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------- |
| **Frame time (p95)**           | ms per rAF tick: input → sim → draw                 | < **16.7ms** @ 60Hz, < **8.3ms** @ 120Hz         | Custom rAF loop, DevTools **Performance → Frames**   |
| **Dropped frames / jank**      | % of frames that missed the vsync deadline          | < **1%** during pan/zoom                         | `PerformanceObserver` + rAF delta                    |
| **Input-to-paint latency**     | pointer down → first visible pixel change on canvas | < **50ms** (stricter than INP for drawing tools) | `performance.mark` around event handler + first draw |
| **Long tasks (session)**       | main-thread blocks > 50ms while app is open         | near zero during interaction                     | `PerformanceObserver({ type: 'longtask' })`          |
| **JS heap (session)**          | `usedJSHeapSize` trend over 30–60 min               | flat (no sawtooth growth)                        | `performance.memory`, heap snapshots                 |
| **DOM node count**             | leaked nodes from off-screen UI                     | stable during navigation                         | DevTools **Performance monitor**                     |
| **GPU / draw calls**           | texture uploads, overdraw, batch count              | app-specific budget                              | WebGL/WebGPU debug extensions, Spector.js            |
| **Sync latency** (multiplayer) | local edit → ack / peer visible                     | p95 < **100–200ms**                              | timestamp CRDT ops + server echo                     |
| **Worker queue depth**         | backlog of geometry/layout jobs                     | bounded, drains each frame                       | custom counter on worker RPC                         |

For dashboards: add **time-to-first-widget-render** and **visible-widget frame time** (only chart what's on screen).

---

### How to measure (tooling stack)

**1. Chrome DevTools – Performance panel (primary debugger)**
- Record while reproducing: pan canvas, paste 500 nodes, open plugin, multiplayer cursors.
- Read the **Main** thread flame chart: Scripting vs Rendering vs Painting vs GPU.
- Enable **Screenshots** and **Frames** lane – red bars = jank.
- Compare **before/after** on the same scripted scenario (don't trust one-off traces).

**2. Performance Monitor (live HUD)**
- `Cmd+Shift+P` → "Show Performance monitor".
- Watch CPU %, JS heap, DOM nodes, layouts/sec **while** you interact.
- Layouts/sec spiking during pan = you're touching the DOM when you should be on canvas.

**3. Memory panel (session leaks)**
- Heap snapshot at T+0, T+30min, after open/close document 10×.
- Look for detached DOM trees, retained `ArrayBuffer`s, event listeners on `window`.
- Canvas apps: leaked **OffscreenCanvas**, texture caches, undo-stack clones.

**4. Custom RUM – you own the metrics**

Lighthouse won't score your WebGL loop. Instrument the app:

```ts
// fpsMonitor.ts – lightweight runtime RUM
type FrameSample = { fps: number; longFrameMs: number };

export function startFpsMonitor(onSample: (s: FrameSample) => void) {
  let last = performance.now();
  let frames = 0;
  let worst = 0;

  function tick(now: number) {
    const delta = now - last;
    frames += 1;
    if (delta > worst) worst = delta;

    if (delta >= 1000) {
      onSample({ fps: (frames * 1000) / delta, longFrameMs: worst });
      frames = 0;
      worst = 0;
      last = now;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Report p75 fps + worst frame per 30s window
startFpsMonitor(({ fps, longFrameMs }) => {
  navigator.sendBeacon('/rum/runtime', JSON.stringify({
    fps,
    longFrameMs,
    docNodes: document.getElementsByTagName('*').length,
    heap: (performance as any).memory?.usedJSHeapSize,
    sceneNodeCount: getSceneGraphSize(), // your metric
  }));
});
```

```ts
// inputLatency.ts – time from pointer to draw
canvas.addEventListener('pointerdown', (e) => {
  performance.mark('input-start');
});

function onFrameRendered() {
  if (performance.getEntriesByName('input-start').length) {
    performance.measure('input-to-paint', 'input-start');
    const [m] = performance.getEntriesByName('input-to-paint');
    report({ inputToPaintMs: m.duration });
    performance.clearMarks('input-start');
    performance.clearMeasures('input-to-paint');
  }
}
```

```ts
// longTaskObserver.ts – session-long, not just page load
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    report({
      type: 'longtask',
      duration: entry.duration,
      startTime: entry.startTime,
      attribution: (entry as any).attribution?.[0]?.name,
    });
  }
}).observe({ type: 'longtask', buffered: true });
```

**5. Synthetic benchmarks (CI for hot paths)**
- **Micro**: Vitest/Benchmark.js on pure functions (hit-test, layout, diff).
- **Macro**: Playwright script – load app, run `window.__perf.runScenario('pan-zoom')`, assert `window.__perf.lastFps > 55`.
- Store **baseline JSON** in repo; fail PR if p95 frame time regresses > 10%.
- Canvas/WebGL macros are flaky in headless – run on a **dedicated GPU runner**, not default CI.

**6. Collaboration-specific**
- Tag each local op with `clientSeq` + `performance.now()`.
- Measure **op → server ack** and **op → remote cursor update** separately.
- Alert on p95 sync latency, not mean (tail latency kills "multiplayer feels broken").

---

### Figma-style fix playbook (runtime)

1. **Render on canvas/WebGL, not DOM** – 10k shapes as DOM nodes will never hit 60fps.
2. **Spatial index** for hit-testing (R-tree, quadtree) – O(log n) not O(n) per move.
3. **Dirty rects / tile cache** – redraw only changed regions.
4. **Throttle + coalesce** pointer moves to one update per frame (`rAF`).
5. **Web workers** for export, boolean ops, layout – never block the rAF thread.
6. **Object pooling** – avoid GC pauses mid-gesture (reuse typed arrays, command objects).
7. **Virtualize** off-screen layers and UI lists (layers panel, component picker).
8. **Cap undo history** by memory budget, not unbounded command stacks.
9. **Batch network** – cursor positions at 30Hz, not every `mousemove`.
10. **Degrade gracefully** – drop peer cursors before dropping local frame rate.

---

### Runtime perf budget (example – paste into interview)

```json
{
  "coldStart": {
    "timeToFirstEditMs": 3000,
    "mainBundleGzipKb": 400
  },
  "warmRuntime": {
    "fpsP75": 58,
    "frameTimeP95Ms": 18,
    "inputToPaintP95Ms": 50,
    "longTasksPerMinute": 0,
    "heapGrowthMbPerHour": 5,
    "syncLatencyP95Ms": 150
  }
}
```

Wire macro scenarios into CI; stream runtime samples to the same RUM backend as Web Vitals, tagged `metricType: 'runtime'`.

---

### Common interview questions (runtime)

**Q: Lighthouse is 95 but users say Figma feels laggy. Why?**
- Lighthouse measures first load on an idle tab, not sustained pan/zoom with 50k objects.
- Look at **frame time distribution**, not mean FPS (one 200ms frame feels awful).
- Check main-thread contention: React re-renders in the chrome, heavy sync work on pointer move.
- Profile GPU: texture size, too many draw calls, readback from GPU to CPU.

**Q: How do you measure perf for a canvas app in production?**
- Custom RUM: fps, longFrameMs, input-to-paint, scene complexity counters, device tier.
- Sample 1–5% of sessions; always capture when fps drops below threshold (triggered reporting).
- Correlate with `hardwareConcurrency`, `deviceMemory`, WebGL renderer string.
- Session replay is less useful for canvas – rely on **structured perf beacons + scenario tags**.

**Q: Memory grows over a long session. Process?**
- Reproduce with Performance Monitor open for 30+ min.
- Heap snapshot diff: detached nodes vs retained scene graph vs texture cache.
- Common fixes: dispose WebGL resources on delete, weak refs for caches, cap undo, unregister listeners on route change.

**Q: What's different about perf testing in CI for this app class?**
- Split **unit micro-benchmarks** (deterministic, every PR) from **GPU macro scenarios** (nightly, real machine).
- Don't gate on Lighthouse alone; gate on bundle size + microbench + optional macro baseline.
- Use the same scripted user flows in DevTools and in Playwright so local and CI match.

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

---

## Hands-on practice (45–60 min)

Work through each snippet **before** reading the answers. For each one: name the metric it hurts, estimate severity, then rewrite the fix. Time yourself – in interviews you get credit for a prioritized list, not a perfect refactor.

---

### Exercise 1 – LCP: hero image on a landing page

**Broken code** – what is wrong, and in what order would you fix it?

```tsx
// ProductHero.tsx
export function ProductHero({ slug }: { slug: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetch(`/api/products/${slug}/reviews?limit=50`)
      .then(r => r.json())
      .then(setReviews);
  }, [slug]);

  return (
    <section>
      <img src={`/images/${slug}-hero.jpg`} alt="Product hero" />
      <h1>{slug}</h1>
      <ReviewSummary reviews={reviews} />
    </section>
  );
}
```

```html
<!-- index.html -->
<head>
  <link rel="stylesheet" href="/styles/main.css" />
  <script src="/analytics.js"></script>
  <script src="/app.js"></script>
</head>
```

**Your tasks:**
1. List every issue that pushes LCP past 2.5s.
2. Rewrite `ProductHero` and the `<head>` tags for a fast LCP.
3. What would you preload in `<head>` for this route?

<details>
<summary>Answer key</summary>

Issues (priority order):
1. **Render-blocking** – sync CSS + sync analytics JS in `<head>` delay first paint and LCP.
2. **Hero image** – full-size JPEG, no `srcset`, no dimensions → slow download + CLS risk.
3. **Waterfall** – reviews fetch in `useEffect` is unrelated to LCP but competes for bandwidth on slow networks.
4. **No SSR/SSG** – if this is CSR-only, TTFB + JS boot delay LCP.

Fix sketch:

```tsx
export function ProductHero({ slug, title }: { slug: string; title: string }) {
  return (
    <section>
      <img
        src={`/images/${slug}-hero-800.avif`}
        srcSet={`
          /images/${slug}-hero-400.avif 400w,
          /images/${slug}-hero-800.avif 800w,
          /images/${slug}-hero-1200.avif 1200w
        `}
        sizes="(max-width: 768px) 100vw, 800px"
        width={800}
        height={600}
        alt=""
        fetchPriority="high"
        loading="eager"
      />
      <h1>{title}</h1>
      {/* lazy-load reviews below the fold */}
      <Suspense fallback={<ReviewSkeleton />}>
        <ReviewSummary slug={slug} />
      </Suspense>
    </section>
  );
}
```

```html
<head>
  <link rel="preconnect" href="https://cdn.example.com" />
  <link rel="preload" as="image" href="/images/acme-hero-800.avif" fetchpriority="high" />
  <link rel="stylesheet" href="/styles/main.css" />
  <script defer src="/app.js"></script>
  <script async src="/analytics.js"></script>
</head>
```

</details>

---

### Exercise 2 – Bundle size: spot the bloat

**Broken code** – paste this into a bundle analyzer mental model. Which lines cost the most?

```ts
// utils/dates.ts
import moment from 'moment';
import 'moment/locale/en-gb';
import 'moment/locale/fr';
import 'moment/locale/de';

export const formatDate = (d: Date) => moment(d).format('LL');

// utils/helpers.ts
import _ from 'lodash';
export const uniqById = (items: Item[]) => _.uniqBy(items, 'id');

// pages/Dashboard.tsx
import { Chart } from '../components/Chart';           // 180kb – only used on /analytics tab
import { Editor } from '../components/RichEditor';     // 220kb – only used on /settings
import { allIcons } from '@acme/icons';                // 400kb of SVG paths

export function Dashboard({ tab }: { tab: string }) {
  return (
    <div>
      {tab === 'overview' && <OverviewCards />}
      {tab === 'analytics' && <Chart data={[]} />}
      {tab === 'settings' && <Editor />}
      <Icon name={allIcons.settings} />
    </div>
  );
}
```

**Your tasks:**
1. Estimate how many kb you can recover without changing UX.
2. Rewrite imports so tree-shaking and code-splitting work.
3. Name the CI tool you'd use to prevent this from merging again.

<details>
<summary>Answer key</summary>

Biggest wins:
- `@acme/icons` barrel → import one icon: `import SettingsIcon from '@acme/icons/Settings'`.
- `lodash` default → `import uniqBy from 'lodash-es/uniqBy'`.
- `moment` + locales → `date-fns/format` (~2kb vs ~70kb+).
- `Chart` / `Editor` → dynamic import per tab.

```ts
import { format } from 'date-fns';
export const formatDate = (d: Date) => format(d, 'PP');

import uniqBy from 'lodash-es/uniqBy';

const Chart = lazy(() => import('../components/Chart'));
const Editor = lazy(() => import('../components/RichEditor'));
import SettingsIcon from '@acme/icons/Settings';
```

CI: `rollup-plugin-visualizer` on build + `size-limit` in PR + Lighthouse budget for `script` resource type.

</details>

---

### Exercise 3 – INP: search filter feels laggy

**Broken code** – user types in a search box; INP regressed to 400ms after shipping this.

```tsx
function ProductSearch({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'price' | 'name'>('price');

  const filtered = products
    .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sort === 'price' ? a.price - b.price : a.name.localeCompare(b.name));

  const stats = filtered.reduce((acc, p) => {
    acc.total += p.price;
    acc.count += 1;
    return acc;
  }, { total: 0, count: 0 });

  return (
    <div>
      <input
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          trackSearch(e.target.value);           // sync analytics call
        }}
      />
      <select value={sort} onChange={e => setSort(e.target.value as any)}>
        <option value="price">Price</option>
        <option value="name">Name</option>
      </select>
      <p>Avg price: {stats.total / stats.count || 0}</p>
      <ul>
        {filtered.map(p => (
          <ProductRow key={p.id} product={p} onCompare={() => heavyCompare(p, products)} />
        ))}
      </ul>
    </div>
  );
}

function heavyCompare(target: Product, all: Product[]) {
  // O(n²) – runs synchronously on every row click
  return all.filter(a => all.every(b => score(a, b, target) > 0.5));
}
```

**Your tasks:**
1. Find the long tasks (>50ms). Which DevTools panel proves it?
2. Rewrite so typing stays under 200ms INP on a 10k-item list.
3. Where would `useDeferredValue`, `startTransition`, memoization, or virtualization each help?

<details>
<summary>Answer key</summary>

Culprits:
- Filter + sort + reduce on **every keystroke** over 10k items (main-thread long task).
- Sync `trackSearch` in `onChange` blocks input.
- Rendering 10k `<ProductRow>` without virtualization.
- `heavyCompare` O(n²) on click.

Fix sketch:

```tsx
const ProductSearch = ({ products }: { products: Product[] }) => {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [sort, setSort] = useState<'price' | 'name'>('price');

  const filtered = useMemo(() => {
    const q = deferredQuery.toLowerCase();
    return products
      .filter(p => p.name.toLowerCase().includes(q))
      .sort((a, b) => sort === 'price' ? a.price - b.price : a.name.localeCompare(b.name));
  }, [products, deferredQuery, sort]);

  const rowVirtualizer = useVirtualizer({ count: filtered.length, /* ... */ });

  return (
    <div>
      <input
        value={query}
        onChange={e => {
          startTransition(() => setQuery(e.target.value));
          queueMicrotask(() => trackSearch(e.target.value));
        }}
      />
      {/* virtualized list – only ~20 DOM nodes */}
    </div>
  );
};

// heavyCompare → web worker via Comlink, or run inside startTransition + abortable
```

DevTools: **Performance** panel → Long Tasks lane; `PerformanceObserver({ entryTypes: ['longtask'] })`.

</details>

---

### Exercise 4 – CLS: ad slot and web font

**Broken code** – Lighthouse CLS is 0.35.

```tsx
function ArticlePage() {
  return (
    <article>
      <h1>Release notes</h1>
      <AdSlot id="top-banner" />   {/* injects 250px iframe after load */}
      <p>Body copy…</p>
      <img src="/screenshot.png" alt="Screenshot" />
    </article>
  );
}
```

```css
@font-face {
  font-family: 'Display';
  src: url('/fonts/Display-Regular.woff2') format('woff2');
  font-display: block;
}
h1 { font-family: 'Display', serif; font-size: 2.5rem; }
img { max-width: 100%; height: auto; }
```

**Your tasks:**
1. List every layout shift source.
2. Fix CSS and JSX so CLS < 0.1 without removing the ad.

<details>
<summary>Answer key</summary>

Sources:
- Ad iframe injected with no reserved height.
- `font-display: block` → FOIT then swap shifts heading.
- Image has no `width`/`height` (only CSS `height: auto`).

Fix:

```tsx
<div style={{ minHeight: 250 }} aria-hidden={!adLoaded}>
  <AdSlot id="top-banner" />
</div>
<img src="/screenshot.png" alt="Screenshot" width={1200} height={675} loading="lazy" />
```

```css
@font-face {
  font-family: 'Display';
  src: url('/fonts/Display-Regular.woff2') format('woff2');
  font-display: optional; /* or swap + size-adjust fallback */
}
h1 { font-family: 'Display', system-ui, serif; }
```

Prefer `transform`/`opacity` for animations – never animate `height`, `margin`, or `top`.

</details>

---

### Exercise 5 – Wire RUM + set a budget

**Starter code** – finish the implementation and explain what you'd alert on.

```ts
// rum.ts – TODO: complete
import { onLCP, onINP, onCLS, onTTFB, type Metric } from 'web-vitals';

const ENDPOINT = '/api/rum';

function send(metric: Metric) {
  // TODO: include route, device class, release version
  // TODO: use sendBeacon with fallback
}

// TODO: register all four handlers
```

```json
// lighthouse-budget.json – TODO: set realistic numbers for a marketing site
[
  {
    "path": "/",
    "resourceSizes": [
      { "resourceType": "script", "budget": "???" },
      { "resourceType": "total", "budget": "???" }
    ],
    "timings": [
      { "metric": "largest-contentful-paint", "budget": "???" },
      { "metric": "cumulative-layout-shift", "budget": "???" }
    ]
  }
]
```

**Your tasks:**
1. Complete `rum.ts` (include `metric.name`, `metric.value`, `metric.rating`, current pathname, `navigator.userAgent` device hint).
2. Fill in budget numbers for a content/marketing homepage (not a dashboard app).
3. Write one sentence on when you'd page someone vs just open a ticket.

<details>
<summary>Answer key</summary>

```ts
function send(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    path: location.pathname,
    release: import.meta.env.VITE_RELEASE,
    ua: navigator.userAgent,
  });
  if (navigator.sendBeacon?.(ENDPOINT, body)) return;
  fetch(ENDPOINT, { method: 'POST', body, keepalive: true });
}

onLCP(send); onINP(send); onCLS(send); onTTFB(send);
```

Example marketing-site budgets: script **250kb**, total **800kb**, LCP **2500ms**, CLS **0.1**.

Alert: page on **p75 LCP or INP regression > 10% week-over-week** on top traffic routes; ticket for single-route synthetic Lighthouse failures on PR.

</details>

---

### Exercise 6 – Full audit (mock interview, 15 min)

You're given this waterfall summary for `/pricing`:

| Resource | Size (gzip) | Start | Duration |
|---|---|---|---|
| HTML (SSR) | 12kb | 0ms | 180ms TTFB |
| `app.js` | 420kb | 180ms | blocks parse |
| `main.css` | 85kb | 180ms | render-blocking |
| `hero.webp` | 340kb | 900ms | LCP element |
| GTM | 95kb | 200ms | long task @ 1.2s |

**Your tasks (talk out loud):**
1. What is LCP likely waiting on? Target element?
2. Top 3 fixes with expected impact.
3. One thing you'd **not** do first (and why).

<details>
<summary>Answer key</summary>

LCP waits on: JS parse/exec before hero is discoverable (if CSR hero) **or** oversized hero download starting late (900ms). Element: hero image.

Top 3:
1. **Shrink + prioritize hero** – responsive AVIF, `fetchpriority="high"`, preload, correct `srcset` → direct LCP win.
2. **Code-split `app.js`** – route-level + defer third-party; drop 420kb from critical path → faster TTI and less main-thread work before paint.
3. **Inline critical CSS / defer rest** – unblock first render.

Don't do first: "Move everything to a web worker" – won't fix LCP if the bottleneck is image bytes and render-blocking assets. Workers help INP/CPU, not a 340kb LCP image.

</details>

---

### Self-check before the interview

- [ ] I can read a Lighthouse trace and point to the LCP element in under 30s.
- [ ] I can explain why `import _ from 'lodash'` is worse than a subpath import.
- [ ] I know the difference between `defer`, `async`, and render-blocking scripts.
- [ ] I can describe one real fix I shipped using measure → fix → measure.
- [ ] I have a perf budget number memorized (e.g. **250kb JS**, **LCP 2.5s**, **INP 200ms**, **CLS 0.1**).
