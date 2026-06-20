# 09 – Observability & Monitoring

> **Abbreviations:** [Glossary (00)](./00-glossary.md) — RUM (Real User Monitoring), FE (Frontend), OTel (OpenTelemetry), PII (Personally Identifiable Information), DSN (Data Source Name), StatsD (Statistics Daemon), LCP (Largest Contentful Paint), INP (Interaction to Next Paint), CLS (Cumulative Layout Shift), TTFB (Time to First Byte), FCP (First Contentful Paint), SHA (Secure Hash Algorithm), NEL (Network Error Logging).

## 60-second talk-track

> "Frontend observability is the **three pillars** applied to the browser: logs (what happened), metrics (how often / how slow), traces (the causal chain across services). On the FE that means structured logs to a sink, RUM for Web Vitals, error tracking with source maps and release tagging, and distributed traces propagated via `traceparent` headers so a slow API call is one click away from the user session. The pitfalls are PII leakage, sampling correctly so you don't drown in data, and making sure your alerts page someone."

---

## What to instrument (the checklist)

| Category | What | Tool example |
|---|---|---|
| JS errors | `window.onerror`, `unhandledrejection`, React `ErrorBoundary` | Sentry, Datadog, Bugsnag |
| Web Vitals | LCP (Largest Contentful Paint) / INP (Interaction to Next Paint) / CLS (Cumulative Layout Shift) / TTFB (Time to First Byte) / FCP (First Contentful Paint) | `web-vitals` lib + RUM (Real User Monitoring) |
| Network | failures, latency, status codes | fetch wrapper, Sentry, OTel |
| User actions | clicks, route changes, form submits | Segment, RudderStack, PostHog |
| Custom metrics | feature usage, business events | StatsD, OTel, vendor |
| Traces | `traceparent` propagation | OTel browser SDK |
| Console | structured logs | pino-browser, custom |
| Replay | session replay (with masking) | Sentry Replay, LogRocket, FullStory |

---

## Error tracking essentials

```ts
// init
import * as Sentry from '@sentry/react';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: process.env.GIT_SHA,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    scrubPII(event);
    return event;
  },
});

// React boundary
<Sentry.ErrorBoundary fallback={<ErrorFallback/>}>
  <App/>
</Sentry.ErrorBoundary>
```

Must-haves:
- **Source maps uploaded** to vendor, served as separate `.map` files NOT shipped to browser.
- **Release tagging** so you can diff regressions per deploy.
- **User context** (id only, never email) for impact triage.
- **PII scrubbing** in `beforeSend` (emails, tokens, query params).
- **Sampling** – 100% for errors, lower for traces/replays.

---

## DIY tiny observability module (Day 6 build)

```ts
// packages/observability/src/index.ts
type Level = 'debug' | 'info' | 'warn' | 'error';

interface LogEvent {
  ts: number;
  level: Level;
  msg: string;
  ctx?: Record<string, unknown>;
  release?: string;
  userId?: string;
}

const queue: LogEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const ENDPOINT = '/api/logs';

function enqueue(e: LogEvent) {
  queue.push(e);
  if (!flushTimer) flushTimer = setTimeout(flush, 2000);
  if (queue.length > 50) flush();
}

function flush() {
  if (!queue.length) return;
  const batch = queue.splice(0);
  flushTimer = null;
  const blob = new Blob([JSON.stringify(batch)], { type: 'application/json' });
  navigator.sendBeacon(ENDPOINT, blob);
}

window.addEventListener('pagehide', flush);
window.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

export const logger = {
  debug: (msg: string, ctx?: object) => enqueue({ ts: Date.now(), level: 'debug', msg, ctx }),
  info:  (msg: string, ctx?: object) => enqueue({ ts: Date.now(), level: 'info',  msg, ctx }),
  warn:  (msg: string, ctx?: object) => enqueue({ ts: Date.now(), level: 'warn',  msg, ctx }),
  error: (msg: string, ctx?: object) => enqueue({ ts: Date.now(), level: 'error', msg, ctx }),
};

export function initErrorTracking() {
  window.addEventListener('error', (e) => {
    logger.error(e.message, { stack: e.error?.stack, url: e.filename, line: e.lineno });
  });
  window.addEventListener('unhandledrejection', (e) => {
    logger.error('unhandledrejection', { reason: String(e.reason), stack: (e.reason as any)?.stack });
  });
}

export function initWebVitals() {
  import('web-vitals').then(({ onLCP, onINP, onCLS, onTTFB }) => {
    const send = (m: any) => logger.info(`vital.${m.name}`, { value: m.value, id: m.id });
    onLCP(send); onINP(send); onCLS(send); onTTFB(send);
  });
}

export const metrics = {
  increment: (name: string, tags?: object) => logger.info(`metric.inc.${name}`, tags),
  timing:    (name: string, ms: number, tags?: object) => logger.info(`metric.time.${name}`, { ms, ...tags }),
};
```

If asked about overhead: `sendBeacon` doesn't block page unload, batching reduces requests, sampling caps cost.

---

## React ErrorBoundary (have memorized)

```tsx
class ErrorBoundary extends React.Component<{children: React.ReactNode; fallback: React.ReactNode}, {hasError: boolean}> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error(error.message, { stack: error.stack, componentStack: info.componentStack });
  }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}
```

Place boundaries per **route** + per **risky widget** (chart, third-party embed). Don't wrap the whole app – you lose granularity.

---

## Distributed tracing on the FE

- Use OpenTelemetry browser SDK (`@opentelemetry/sdk-trace-web` + `instrumentation-fetch`).
- Auto-instrument `fetch` → adds `traceparent: 00-<traceId>-<spanId>-01` header.
- Backend continues the trace → one flame graph from `Cmd+K` to DB query.
- Sample rate: usually 1–10% to control cost; 100% on errors.

---

## Logging best practices

- **Structured** (JSON), not strings. `logger.info('paid', { amountCents: 1234 })` not `console.log('User paid 12.34')`.
- **Levels** with sane defaults (info+ in prod).
- **No PII** in messages.
- **Correlation IDs**: `traceId` + `sessionId` + `userId` on every event.
- **Sampling** for debug-level in prod.
- **Don't `console.log` in production code** – goes to user's devtools, leaks info, costs perf.

---

## RUM vs synthetic

| | RUM | Synthetic |
|---|---|---|
| Source | real users | lab |
| Variability | high (devices, network) | controlled |
| Coverage | only routes users visit | scheduled |
| Use for | trends, regressions in field | catch regressions pre-deploy |

Use both.

---

## Common interview questions

**Q: Your error rate spiked. Walk me through triage.**
1. Look at Sentry release diff – did this start at deploy X?
2. Group by error message + url + browser.
3. Source-mapped stack → identify component.
4. Reproduce locally with feature flag matching impacted users.
5. Rollback or hotfix.
6. Add regression test + alert threshold.

**Q: How do you handle 3rd-party script errors that aren't yours?**
- Filter by `event.exception.values[0].stacktrace.frames[0].filename` not matching your domain.
- Tag as `external` and de-prioritize.
- Use `Report-To` / `NEL` browser features for network errors.

**Q: How do you prevent observability from leaking PII?**
- `beforeSend` scrubber: regex strip emails, tokens, credit-card patterns.
- Mask form fields in session replay (data-private attrs).
- Don't log full URLs with query (auth tokens in query).
- Periodic audit of logged payloads.

**Q: How do you budget alerts?**
- Page-able alerts only for: revenue impact, auth broken, error rate > 2x baseline.
- Slack alerts for trend regressions.
- Weekly digest for everything else.
- Every alert has a runbook URL.
