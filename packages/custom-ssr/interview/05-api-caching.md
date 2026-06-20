# 05 – API Integration & Caching

> **Abbreviations:** [Glossary (00)](./00-glossary.md) — REST (Representational State Transfer), GraphQL (Graph Query Language), tRPC (TypeScript Remote Procedure Call), SW (Service Worker), TTL (Time To Live), ETag (Entity Tag), JWT (JSON Web Token), SDL (Schema Definition Language), BFF (Backend for Frontend), MSW (Mock Service Worker), OCC (Optimistic Concurrency Control), SWR (Stale-While-Revalidate).

## 60-second talk-track

> "API integration has four layers of caching: browser HTTP cache, CDN, service worker, and app-level cache (React Query). Each has different invalidation primitives. For REST I default to React Query because it gives me dedupe, stale-while-revalidate, and optimistic updates for free. For GraphQL I'd reach for Apollo or urql – the cache normalizes by entity ID so updates propagate across queries. The hardest part isn't fetching, it's invalidation: TTL works for read-mostly, tag/entity invalidation works when mutations cross resources."

---

## Cache layers (draw this)

```
Browser memory   ──▶ React Query / Apollo (app cache, TTL + invalidation)
                                  │ miss
Service Worker   ──▶ offline cache (Cache API, runtime strategies)
                                  │ miss
HTTP cache       ──▶ disk cache (Cache-Control, ETag, 304)
                                  │ miss
CDN edge         ──▶ shared cache (s-maxage, stale-while-revalidate)
                                  │ miss
Origin           ──▶ DB / Redis / upstream
```

Each layer has different invalidation:
- HTTP: `Cache-Control`, ETag/If-None-Match, `Clear-Site-Data`.
- CDN: purge API, surrogate keys, `s-maxage`.
- SW: `caches.delete(key)`, version bump in install.
- App: `queryClient.invalidateQueries(key)`.

---

## REST vs GraphQL vs tRPC (the table)

| | REST (Representational State Transfer) | GraphQL (Graph Query Language) | tRPC (TypeScript Remote Procedure Call) |
|---|---|---|---|
| Schema | OpenAPI (optional) | SDL (Schema Definition Language, required) | TypeScript types |
| Over-fetching | yes | no (query what you need) | no |
| Caching | HTTP cache works | client-side (normalized) | depends |
| BE freedom | high | high | tied to TS server |
| Tooling | huge | great (codegen) | great if monorepo |
| Files / streaming | native | awkward (multipart) | tRPC has subscriptions |
| Pick when | public API, many clients | many clients, complex data graph | full-stack TS, internal |

---

## React Query mental model

```
queryKey: ['user', 42]
  ├── status: idle | loading | error | success
  ├── data
  ├── dataUpdatedAt
  ├── staleTime: 0 (default)   → above this age, refetch on mount/focus
  └── gcTime: 5min              → below this, evict from memory
```

Lifecycle:
1. Component mounts → look up key in cache.
2. If miss or stale → fetch (dedup if in-flight).
3. Return `data` immediately if present (stale-while-revalidate).
4. On success → update cache → all subscribers re-render.

---

## Mini React Query (Day 4 build – ~200 LOC)

Core API:
```tsx
const client = new QueryClient();

<QueryClientProvider client={client}>
  <App/>
</QueryClientProvider>

const { data, isLoading, error } = useQuery({
  queryKey: ['user', id],
  queryFn: () => fetch(`/api/users/${id}`).then(r => r.json()),
  staleTime: 60_000,
});

const mutation = useMutation({
  mutationFn: (newName) => fetch(...),
  onMutate: async (newName) => {
    await client.cancelQueries({ queryKey: ['user', id] });
    const prev = client.getQueryData(['user', id]);
    client.setQueryData(['user', id], (old) => ({ ...old, name: newName }));
    return { prev };
  },
  onError: (_, __, ctx) => client.setQueryData(['user', id], ctx.prev),
  onSettled: () => client.invalidateQueries({ queryKey: ['user', id] }),
});
```

Minimal implementation sketch:

```ts
type Entry<T> = { data?: T; error?: Error; updatedAt: number; promise?: Promise<T>; subs: Set<() => void> };

class QueryClient {
  private cache = new Map<string, Entry<any>>();
  private hash(key: any[]) { return JSON.stringify(key); }

  getQueryData(key: any[]) { return this.cache.get(this.hash(key))?.data; }
  setQueryData(key: any[], updater: any) {
    const e = this.ensure(key);
    e.data = typeof updater === 'function' ? updater(e.data) : updater;
    e.updatedAt = Date.now();
    e.subs.forEach(fn => fn());
  }
  invalidateQueries({ queryKey }: { queryKey: any[] }) {
    const prefix = this.hash(queryKey).slice(0, -1); // crude prefix match
    for (const [k, e] of this.cache) {
      if (k.startsWith(prefix)) { e.updatedAt = 0; e.subs.forEach(fn => fn()); }
    }
  }
  private ensure(key: any[]): Entry<any> {
    const h = this.hash(key);
    if (!this.cache.has(h)) this.cache.set(h, { updatedAt: 0, subs: new Set() });
    return this.cache.get(h)!;
  }

  fetchQuery<T>({ queryKey, queryFn, staleTime = 0 }: { queryKey: any[]; queryFn: () => Promise<T>; staleTime?: number }) {
    const e = this.ensure(queryKey);
    const fresh = e.data !== undefined && Date.now() - e.updatedAt < staleTime;
    if (fresh) return Promise.resolve(e.data as T);
    if (e.promise) return e.promise;                  // dedupe
    e.promise = queryFn()
      .then(d => { e.data = d; e.updatedAt = Date.now(); e.subs.forEach(f => f()); return d; })
      .catch(err => { e.error = err; e.subs.forEach(f => f()); throw err; })
      .finally(() => { e.promise = undefined; });
    return e.promise;
  }
}

function useQuery<T>({ queryKey, queryFn, staleTime }: any) {
  const client = React.useContext(QueryClientCtx);
  const subscribe = React.useCallback((cb: () => void) => {
    const e = (client as any).ensure(queryKey); e.subs.add(cb);
    return () => e.subs.delete(cb);
  }, [JSON.stringify(queryKey)]);
  const getSnap = () => client.getQueryData(queryKey);
  const data = React.useSyncExternalStore(subscribe, getSnap, getSnap);
  React.useEffect(() => { client.fetchQuery({ queryKey, queryFn, staleTime }); }, [JSON.stringify(queryKey)]);
  return { data, isLoading: data === undefined };
}
```

This is your "I built it from scratch" answer.

---

## GraphQL essentials

- **Schema-first**: SDL defines types, queries, mutations, subscriptions.
- **Single endpoint** (`POST /graphql`), client picks fields.
- **Cache normalization**: every entity has a stable ID → cache stores `User:42` once, queries reference it. Update once, all UI refreshes.
- **Fragments**: reusable field sets, also the unit of code-gen.
- **N+1 risk on server** → DataLoader (batch + cache per request).
- **Persisted queries**: client sends hash, server resolves → smaller payload, allow-list for security.

When to NOT pick GraphQL:
- Single client + simple resources.
- File uploads / streaming downloads.
- Team isn't ready to own schema governance.

---

## Caching strategies you should name

| Strategy | When |
|---|---|
| Cache-first | static assets, code-split chunks |
| Network-first | HTML, dynamic data |
| Stale-while-revalidate | feed, dashboards |
| Cache-then-network | mobile offline-first |
| Network-only | auth, payments |
| Cache-only | offline mode fallback |

---

## Request waterfalls (very common interview question)

Bad:
```tsx
const user = useQuery(['user'])
const posts = useQuery(['posts', user.data?.id], { enabled: !!user.data })
const comments = useQuery(['comments', posts.data?.[0]?.id], { enabled: !!posts.data })
// 3 sequential round-trips
```

Fixes:
- Parallelize with `Promise.all` if data is independent.
- Server pre-fetch and pass as initialData / SSR payload.
- GraphQL single query.
- RSC: fetch on server, no waterfall reaches the client.
- BFF endpoint that does the join.

---

## Common interview questions

**Q: How do you handle auth tokens?**
- Short-lived JWT in memory, refresh token in httpOnly cookie.
- Axios/fetch interceptor refreshes on 401 + retries.
- For SSR: forward cookies to upstream.

**Q: Pagination – offset vs cursor?**
- Offset: easy, breaks with inserts/deletes, slow on large tables.
- Cursor: stable under writes, can't jump to page N, requires sortable column.
- Use cursor for feeds; offset for admin tables.

**Q: How do you prevent race conditions in mutations?**
- Cancel in-flight on new request (`AbortController`).
- Optimistic + rollback.
- Versioning (`If-Match: ETag`) for true OCC.

**Q: How do you test data layer?**
- MSW (Mock Service Worker) intercepts fetch at network level → same tests work in jsdom, browser, e2e.
- Don't mock React Query itself; mock the network.
