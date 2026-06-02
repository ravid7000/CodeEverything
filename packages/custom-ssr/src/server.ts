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
    configFile: path.resolve(__dirname, '../vite.config.ts'),
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);

  // CSR-only route: send shell with spinner, no data fetch on server.
  app.get('/dashboard', async (req, res) => {
    const template = await vite.transformIndexHtml(req.url,
      fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8'));
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

  // Streaming SSR for everything else (/{*splat} matches / too; bare * is invalid in Express 5).
  app.get('/{*splat}', async (req, res) => {
    const initialData = req.path === '/' ? await fetchHomeData() : {};
    return streamSSR(req, res, vite, initialData);
  });

  app.listen(3000, () => console.log('http://localhost:3000'));
}

async function streamSSR(req: express.Request, res: express.Response, vite: any, initialData: any) {
  try {
    let template = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
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