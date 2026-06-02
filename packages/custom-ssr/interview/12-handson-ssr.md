# 12 – Hands-on: Custom SSR with Streaming + SSG + CSR (in this package)

This package (`packages/custom-ssr`) is currently a vanilla CSR Vite app. You'll turn it into a 3-route demo:
- `/`         – **SSR** (streamed) with hydration
- `/about`    – **SSG** (pre-rendered HTML at build, hydrated on load)
- `/dashboard`– **CSR-only** (server sends shell with spinner, client mounts)

**Goal**: have something running on `localhost:3000` you can demo + screenshot. Target time: 2 hrs.

---

## Step 1 – install deps

```bash
cd packages/custom-ssr
pnpm add express react-router-dom
pnpm add -D @types/express tsx
```

---

## Step 2 – replace `vite.config.ts`

Add SSR support:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5181, middlewareMode: false },
  ssr: { noExternal: ['react-router-dom'] },
});
```

---

## Step 3 – update `index.html` to include SSR injection placeholders

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Custom SSR Demo</title>
  </head>
  <body>
    <div id="app"><!--ssr-outlet--></div>
    <script>window.__INITIAL_DATA__ = '<!--ssr-data-->';</script>
    <script type="module" src="/src/entry-client.tsx"></script>
  </body>
</html>
```

---

## Step 4 – `src/App.tsx` with routes

```tsx
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';

export function App({ initialData }: { initialData?: any }) {
  return (
    <div style={{ fontFamily: 'system-ui', padding: 24 }}>
      <nav style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Link to="/">Home (SSR)</Link>
        <Link to="/about">About (SSG)</Link>
        <Link to="/dashboard">Dashboard (CSR)</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home data={initialData?.home} />} />
        <Route path="/about" element={<About />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
}

function Home({ data }: { data?: { posts: string[] } }) {
  return (
    <section>
      <h1>Home – streamed SSR</h1>
      <p>Server fetched these posts before flushing HTML:</p>
      <ul>{data?.posts?.map(p => <li key={p}>{p}</li>) ?? <li>(no data)</li>}</ul>
      <React.Suspense fallback={<p>Loading slow widget...</p>}>
        <SlowWidget />
      </React.Suspense>
    </section>
  );
}

function SlowWidget() {
  // Pretend this is a slow async server component (use a resource pattern in real code).
  return <p style={{ color: 'green' }}>Slow widget rendered (streamed in)</p>;
}

function About() {
  return (
    <section>
      <h1>About – SSG</h1>
      <p>This page is pre-rendered at build time to <code>dist/static/about.html</code>.</p>
    </section>
  );
}

function Dashboard() {
  const [data, setData] = React.useState<string | null>(null);
  React.useEffect(() => {
    const t = setTimeout(() => setData('Loaded on the client only.'), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <section>
      <h1>Dashboard – CSR only</h1>
      {data ? <p>{data}</p> : <p>Loading on client...</p>}
    </section>
  );
}
```

---

## Step 5 – `src/entry-server.tsx`

```tsx
import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './App';

export function render(url: string, initialData: unknown, callbacks: {
  onShellReady: () => void;
  onAllReady: () => void;
  onError: (e: unknown) => void;
}) {
  return renderToPipeableStream(
    <StaticRouter location={url}>
      <App initialData={initialData} />
    </StaticRouter>,
    {
      bootstrapModules: ['/src/entry-client.tsx'],
      onShellReady: callbacks.onShellReady,
      onAllReady: callbacks.onAllReady,
      onError: callbacks.onError,
    },
  );
}
```

---

## Step 6 – `src/entry-client.tsx`

```tsx
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';

const initialData = (() => {
  try { return JSON.parse(window.__INITIAL_DATA__ || '{}'); } catch { return {}; }
})();

hydrateRoot(
  document.getElementById('app')!,
  <BrowserRouter>
    <App initialData={initialData} />
  </BrowserRouter>,
);

declare global { interface Window { __INITIAL_DATA__: string } }
```

---

## Step 7 – `server.ts` (the Express SSR server)

```ts
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

async function fetchHomeData() {
  await new Promise(r => setTimeout(r, 50));
  return { home: { posts: ['Hello SSR', 'Streaming rocks', 'Hydration is fun'] } };
}

async function main() {
  const app = express();
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);

  // CSR-only route: send shell with spinner, no data fetch on server.
  app.get('/dashboard', async (req, res) => {
    const template = await vite.transformIndexHtml(req.url,
      fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8'));
    res.status(200).set({ 'Content-Type': 'text/html' }).end(
      template.replace('<!--ssr-outlet-->', '<div>Loading dashboard...</div>')
              .replace('<!--ssr-data-->', '{}')
    );
  });

  // SSG-served route in prod: read pre-built file. In dev: just SSR it.
  app.get('/about', async (req, res) => {
    if (isProd) {
      const html = fs.readFileSync(path.resolve(__dirname, 'dist/static/about.html'), 'utf-8');
      return res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    }
    return streamSSR(req, res, vite, {});
  });

  // Streaming SSR for everything else.
  app.get('*', async (req, res) => {
    const initialData = req.path === '/' ? await fetchHomeData() : {};
    return streamSSR(req, res, vite, initialData);
  });

  app.listen(3000, () => console.log('http://localhost:3000'));
}

async function streamSSR(req: express.Request, res: express.Response, vite: any, initialData: any) {
  try {
    let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
    template = await vite.transformIndexHtml(req.url, template);
    const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');

    const [head, tail] = template
      .replace('<!--ssr-data-->', JSON.stringify(initialData).replace(/</g, '\\u003c'))
      .split('<!--ssr-outlet-->');

    let didError = false;
    const { pipe } = render(req.url, initialData, {
      onShellReady() {
        res.status(didError ? 500 : 200).setHeader('Content-Type', 'text/html');
        res.write(head);
        pipe(res);
        res.write(tail);
      },
      onAllReady() { /* used by crawlers / static export */ },
      onError(err) { didError = true; console.error(err); },
    });

    setTimeout(() => res.end(), 10_000); // safety timeout
  } catch (e: any) {
    vite.ssrFixStacktrace(e);
    console.error(e);
    res.status(500).end(e.message);
  }
}

main();
```

---

## Step 8 – update `package.json` scripts

```json
{
  "scripts": {
    "dev:csr": "vite",
    "dev": "tsx server.ts",
    "build": "vite build && vite build --ssr src/entry-server.tsx && tsx scripts/ssg.ts",
    "preview": "NODE_ENV=production tsx server.ts"
  }
}
```

---

## Step 9 – `scripts/ssg.ts` (pre-render `/about` at build time)

```ts
import fs from 'node:fs';
import path from 'node:path';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { StaticRouter } from 'react-router-dom/server';
import { App } from '../src/App';

const html = renderToString(
  React.createElement(StaticRouter, { location: '/about' }, React.createElement(App))
);
const template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
const out = template
  .replace('<!--ssr-outlet-->', html)
  .replace('<!--ssr-data-->', '{}');

fs.mkdirSync('dist/static', { recursive: true });
fs.writeFileSync('dist/static/about.html', out);
console.log('SSG: wrote dist/static/about.html');
```

---

## Step 10 – run + verify

```bash
pnpm dev
# open http://localhost:3000

# Verify SSR: View source on / → you'll see <h1>Home – streamed SSR</h1> in the HTML.
# Verify CSR: View source on /dashboard → only "Loading dashboard..."
# Build: pnpm build && pnpm preview
# Verify SSG: cat dist/static/about.html
```

---

## What to be ready to explain

- **Why `renderToPipeableStream` over `renderToString`** → starts flushing before all data ready; works with `<Suspense>`.
- **`onShellReady` vs `onAllReady`** → first for browsers (stream as ready), second for crawlers/bots (full HTML).
- **How data flows server→client** → injected via `window.__INITIAL_DATA__`, read in `entry-client.tsx`, passed as prop. Real apps use React Query's `hydrate()` or Next's `serverComponentsManifest`.
- **Hydration mismatch risks** → server fetched data must match what client expects to render initially.
- **Why /dashboard sends a shell** → no SEO need, faster server response, expensive auth check happens client-side.
- **Why /about is SSG** → static content, fastest TTFB, can sit on CDN forever.

---

## Stretch (only if you finish early)

Add a `<Counter>` "island": server emits `<div data-island="counter" data-props='{"start":5}'></div>` instead of rendering it, and client `entry-client.tsx` finds those nodes and `createRoot`s only them. This is the **partial hydration / islands** story for Doc 02.
