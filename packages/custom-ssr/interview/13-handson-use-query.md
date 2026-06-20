# 13 – Hands-on: Mini React Query (in `packages/use-query`)

> **Abbreviations:** [Glossary (00)](./00-glossary.md) — LOC (Lines of Code), GC (Garbage Collection), SWR (Stale-While-Revalidate).

Target time: **90 min**. Goal: prove you understand caching, dedupe, stale-while-revalidate, and optimistic updates by implementing them in ~200 LOC.

---

## Step 1 – set up

```bash
cd packages/use-query
# Check what's there
ls src/
```

If empty, create the files below. If something exists, treat it as a starting point.

---

## Step 2 – `src/queryClient.ts`

```ts
type QueryKey = readonly unknown[];

interface QueryState<T> {
  data?: T;
  error?: unknown;
  status: 'idle' | 'pending' | 'success' | 'error';
  updatedAt: number;
  promise?: Promise<T>;
  subscribers: Set<() => void>;
}

export interface QueryOptions<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  staleTime?: number;        // ms – fresh window
  gcTime?: number;           // ms – evict after no subscribers
}

export class QueryClient {
  private cache = new Map<string, QueryState<any>>();
  private gcTimers = new Map<string, ReturnType<typeof setTimeout>>();

  hash(key: QueryKey): string { return JSON.stringify(key); }

  getQueryData<T>(key: QueryKey): T | undefined {
    return this.cache.get(this.hash(key))?.data;
  }

  setQueryData<T>(key: QueryKey, updater: T | ((prev: T | undefined) => T)) {
    const state = this.ensure<T>(key);
    state.data = typeof updater === 'function'
      ? (updater as Function)(state.data)
      : updater;
    state.status = 'success';
    state.updatedAt = Date.now();
    state.subscribers.forEach(fn => fn());
  }

  invalidateQueries({ queryKey }: { queryKey: QueryKey }) {
    const prefix = JSON.stringify(queryKey).slice(0, -1); // remove trailing ']'
    for (const [hash, state] of this.cache) {
      if (hash.startsWith(prefix)) {
        state.updatedAt = 0;
        state.subscribers.forEach(fn => fn());
        if (state.subscribers.size > 0) {
          // trigger refetch via subscribers re-reading
        }
      }
    }
  }

  cancelQueries({ queryKey }: { queryKey: QueryKey }) {
    const state = this.cache.get(this.hash(queryKey));
    if (state) state.promise = undefined;
  }

  ensure<T>(key: QueryKey): QueryState<T> {
    const h = this.hash(key);
    let state = this.cache.get(h);
    if (!state) {
      state = { status: 'idle', updatedAt: 0, subscribers: new Set() };
      this.cache.set(h, state);
    }
    return state;
  }

  subscribe(key: QueryKey, cb: () => void, gcTime = 5 * 60_000) {
    const h = this.hash(key);
    const state = this.ensure(key);
    state.subscribers.add(cb);
    const existing = this.gcTimers.get(h);
    if (existing) { clearTimeout(existing); this.gcTimers.delete(h); }
    return () => {
      state.subscribers.delete(cb);
      if (state.subscribers.size === 0) {
        this.gcTimers.set(h, setTimeout(() => this.cache.delete(h), gcTime));
      }
    };
  }

  async fetchQuery<T>({ queryKey, queryFn, staleTime = 0 }: QueryOptions<T>): Promise<T> {
    const state = this.ensure<T>(queryKey);
    const fresh = state.data !== undefined && Date.now() - state.updatedAt < staleTime;
    if (fresh) return state.data as T;
    if (state.promise) return state.promise;                          // dedupe

    state.status = 'pending';
    state.subscribers.forEach(fn => fn());
    state.promise = queryFn()
      .then(data => {
        state.data = data;
        state.error = undefined;
        state.status = 'success';
        state.updatedAt = Date.now();
        return data;
      })
      .catch(err => {
        state.error = err;
        state.status = 'error';
        throw err;
      })
      .finally(() => {
        state.promise = undefined;
        state.subscribers.forEach(fn => fn());
      });
    return state.promise;
  }
}
```

---

## Step 3 – `src/QueryClientProvider.tsx`

```tsx
import React from 'react';
import type { QueryClient } from './queryClient';

const Ctx = React.createContext<QueryClient | null>(null);

export function QueryClientProvider({ client, children }: { client: QueryClient; children: React.ReactNode }) {
  return <Ctx.Provider value={client}>{children}</Ctx.Provider>;
}

export function useQueryClient(): QueryClient {
  const client = React.useContext(Ctx);
  if (!client) throw new Error('useQueryClient must be used inside QueryClientProvider');
  return client;
}
```

---

## Step 4 – `src/useQuery.ts`

```tsx
import React from 'react';
import { useQueryClient } from './QueryClientProvider';
import type { QueryOptions } from './queryClient';

export function useQuery<T>(opts: QueryOptions<T>) {
  const client = useQueryClient();
  const keyHash = client.hash(opts.queryKey);

  const subscribe = React.useCallback(
    (cb: () => void) => client.subscribe(opts.queryKey, cb),
    [client, keyHash]
  );

  const getSnapshot = React.useCallback(() => {
    const state = client.ensure<T>(opts.queryKey);
    return state;
  }, [client, keyHash]);

  const state = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  React.useEffect(() => {
    client.fetchQuery(opts).catch(() => {}); // errors surface via state
  }, [client, keyHash]);

  return {
    data: state.data as T | undefined,
    error: state.error,
    status: state.status,
    isLoading: state.status === 'pending' && state.data === undefined,
    isFetching: state.status === 'pending',
    refetch: () => client.fetchQuery(opts),
  };
}
```

---

## Step 5 – `src/useMutation.ts`

```tsx
import React from 'react';
import { useQueryClient } from './QueryClientProvider';

interface MutationOptions<TVars, TData, TCtx> {
  mutationFn: (vars: TVars) => Promise<TData>;
  onMutate?: (vars: TVars) => Promise<TCtx> | TCtx;
  onError?: (err: unknown, vars: TVars, ctx: TCtx | undefined) => void;
  onSuccess?: (data: TData, vars: TVars, ctx: TCtx | undefined) => void;
  onSettled?: (data: TData | undefined, err: unknown, vars: TVars, ctx: TCtx | undefined) => void;
}

export function useMutation<TVars, TData, TCtx = unknown>(opts: MutationOptions<TVars, TData, TCtx>) {
  const [state, setState] = React.useState<{ status: 'idle'|'pending'|'success'|'error'; data?: TData; error?: unknown }>({ status: 'idle' });

  const mutate = React.useCallback(async (vars: TVars) => {
    setState({ status: 'pending' });
    let ctx: TCtx | undefined;
    try {
      ctx = await opts.onMutate?.(vars);
      const data = await opts.mutationFn(vars);
      setState({ status: 'success', data });
      opts.onSuccess?.(data, vars, ctx);
      opts.onSettled?.(data, undefined, vars, ctx);
      return data;
    } catch (err) {
      setState({ status: 'error', error: err });
      opts.onError?.(err, vars, ctx);
      opts.onSettled?.(undefined, err, vars, ctx);
      throw err;
    }
  }, [opts]);

  return { ...state, mutate };
}
```

---

## Step 6 – `src/index.ts`

```ts
export { QueryClient } from './queryClient';
export { QueryClientProvider, useQueryClient } from './QueryClientProvider';
export { useQuery } from './useQuery';
export { useMutation } from './useMutation';
```

---

## Step 7 – demo it (paste into a sample app)

```tsx
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@code-everything/use-query';

const client = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={client}>
      <UserCard id="42" />
      <UserCard id="42" />  {/* second render dedup-hits cache, no extra fetch */}
    </QueryClientProvider>
  );
}

function UserCard({ id }: { id: string }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetch(`/api/users/${id}`).then(r => r.json()),
    staleTime: 30_000,
  });

  const rename = useMutation({
    mutationFn: (name: string) => fetch(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }).then(r => r.json()),
    onMutate: async (name) => {
      const prev = client.getQueryData(['user', id]);
      client.setQueryData(['user', id], (old: any) => ({ ...old, name })); // optimistic
      return { prev };
    },
    onError: (_e, _v, ctx: any) => client.setQueryData(['user', id], ctx.prev),
    onSettled: () => client.invalidateQueries({ queryKey: ['user', id] }),
  });

  if (isLoading) return <p>Loading...</p>;
  return (
    <div>
      <p>{data.name}</p>
      <button onClick={() => rename.mutate('Chahana')}>Rename</button>
      <button onClick={() => refetch()}>Refetch</button>
    </div>
  );
}
```

---

## Talk-track for this demo (rehearse aloud)

1. **Dedupe**: two `<UserCard id="42">` mount → both call `fetchQuery` → second one returns existing `state.promise` → only one network call.
2. **Staleness**: within `staleTime`, returns cached data without refetch; after, the next call refetches.
3. **GC**: when last subscriber unmounts, schedule eviction after `gcTime`.
4. **Optimistic update**: `onMutate` snapshots prev + applies new; `onError` rolls back; `onSettled` invalidates to reconcile with server.
5. **`useSyncExternalStore`**: the right primitive for external state — concurrent-safe, no tearing.

---

## What you'd add to make it "real"

- Window focus refetch (`window.addEventListener('focus', ...)`).
- Network reconnect refetch (`navigator.onLine`).
- Retry with exponential backoff.
- `select` option (selector for re-render perf).
- Infinite queries (cursor-based).
- SSR `dehydrate` / `hydrate` for streaming initial cache.
- Devtools panel.

Mention these in the interview – shows you know the gap between your toy and React Query.

---

## Common follow-up questions

**Q: Why `useSyncExternalStore` over `useEffect` + `useState`?**
- Concurrent React safe (no tearing across renders).
- Built-in batching.
- Server-side snapshot for SSR.

**Q: How does deduplication actually work?**
- A per-key `promise` field on cache entry; if present, return it; cleared in `finally`.

**Q: How would you persist the cache?**
- Serialize `cache` to localStorage/IndexedDB on `pagehide`.
- Hydrate on init; mark all entries as stale so they refetch.

**Q: When would you NOT use this pattern?**
- WebSocket-driven data (use subscriptions, push into cache via `setQueryData`).
- Highly mutating writes where stale reads are unacceptable (rare on the FE).
