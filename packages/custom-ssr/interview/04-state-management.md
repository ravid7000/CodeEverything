# 04 – State Management

> **Abbreviations:** [Glossary (00)](./00-glossary.md) — SWR (Stale-While-Revalidate), RTK (Redux Toolkit), GC (Garbage Collection).

## 60-second talk-track

> "I separate state into four buckets: **server state** (data from API), **URL state** (filters, pagination), **client UI state** (modals, hover), and **client domain state** (cart, draft). Server state goes in React Query / SWR – never Redux. URL state goes in the router. UI state stays local (`useState`). Domain state goes in a global store – Zustand for new code, Redux Toolkit if the team already uses it. The #1 anti-pattern I see is one Redux store with server data – you reimplement caching, dedupe, and revalidation badly."

---

## The four buckets (this is the answer to half the state questions)

| Bucket | Lives in | Examples | Tool |
|---|---|---|---|
| Server state | cache | user, products, posts | React Query, SWR, RTK Query, Apollo |
| URL state | URL | tab, filters, sort, page | router (Next, TanStack) |
| Local UI state | component | open/close, hover, focus | `useState` |
| Global client state | store | cart, theme, auth user, draft | Zustand, Redux, Jotai, Context |

---

## Tool comparison

| | Redux Toolkit | Zustand | Jotai | Context | React Query |
|---|---|---|---|---|---|
| Boilerplate | medium | tiny | tiny | none | medium |
| Devtools | great | yes | yes | none | great |
| Selectors | reselect | built-in | atom-level | manual | n/a |
| Async | thunks/saga/RTK Query | inside actions | atoms | manual | first-class |
| Re-render control | great | great | atomic | poor | great |
| Server state | RTK Query yes | no | no | no | yes (purpose-built) |
| Bundle size | ~13kb | ~1kb | ~3kb | 0 | ~13kb |
| When to pick | large team, conventions | new app, small store | atom mental model fits | tiny scope, prop drill | always for server data |

---

## Why server state is different

Server state is **inherently stale**. You need:
- Caching (per query key)
- Background refetch
- Request deduplication
- Stale-while-revalidate
- Optimistic updates with rollback
- Pagination/infinite
- Garbage collection of unused entries

Redux solves none of these out of the box. You'd reimplement React Query. Don't.

---

## Zustand from scratch (50-line version – good to know)

```ts
type Listener<T> = (state: T, prev: T) => void;

export function createStore<T>(init: (set: (p: Partial<T>) => void, get: () => T) => T) {
  let state: T;
  const listeners = new Set<Listener<T>>();
  const set = (partial: Partial<T>) => {
    const next = { ...state, ...partial };
    const prev = state;
    state = next;
    listeners.forEach(l => l(next, prev));
  };
  const get = () => state;
  state = init(set, get);

  const subscribe = (l: Listener<T>) => { listeners.add(l); return () => listeners.delete(l); };

  function useStore<U>(selector: (s: T) => U, equality = Object.is): U {
    return React.useSyncExternalStore(
      subscribe,
      () => selector(state),
      () => selector(state),
    );
  }
  useStore.getState = get;
  useStore.setState = set;
  return useStore;
}

// usage
const useCart = createStore<CartState>((set) => ({
  items: [],
  add: (item) => set({ items: [...useCart.getState().items, item] }),
}));

const count = useCart(s => s.items.length); // only re-renders if length changes
```

If asked "how does Zustand avoid re-renders" – this is the answer: `useSyncExternalStore` + selector + equality check.

---

## Context done right

Two contexts, one for state one for setters:

```tsx
const StateCtx = createContext<State>(null!);
const ApiCtx   = createContext<Api>(null!);

export function Provider({ children }) {
  const [state, setState] = useReducer(reducer, initial);
  const api = useMemo(() => ({
    add:    (x) => setState({ type: 'add', x }),
    remove: (id) => setState({ type: 'remove', id }),
  }), []);
  return (
    <ApiCtx.Provider value={api}>
      <StateCtx.Provider value={state}>{children}</StateCtx.Provider>
    </ApiCtx.Provider>
  );
}
```

Setters never change reference → consumers using only `useApi()` never re-render. Splitting alone gets you 80% of the perf of Zustand.

---

## Redux Toolkit cheat-sheet

```ts
const cart = createSlice({
  name: 'cart',
  initialState: { items: [] as Item[] },
  reducers: {
    add: (s, a: PayloadAction<Item>) => { s.items.push(a.payload); }, // immer
    remove: (s, a: PayloadAction<string>) => { s.items = s.items.filter(i => i.id !== a.payload); },
  },
});

const store = configureStore({ reducer: { cart: cart.reducer } });

// in component
const items = useSelector((s: RootState) => s.cart.items);
const dispatch = useDispatch();
dispatch(cart.actions.add(item));
```

Mention: `createAsyncThunk` for async, `RTK Query` for data fetching (Redux's React Query competitor), middleware (`logger`, `persist`).

---

## Vuex → Pinia (if asked)

- Vuex: mutations (sync) + actions (async) + getters. Verbose.
- Pinia: just `defineStore({ state, actions, getters })`. No mutations. Composition API native. Vue's recommended.
- Mental model maps 1:1 to Zustand.

---

## Common interview questions

**Q: When do you reach for global state?**
- Needed in ≥2 distant components.
- Survives navigation.
- Prop drilling > 3 levels.

**Q: Why is Redux losing share?**
- Boilerplate (pre-Toolkit was awful).
- Server state belongs in React Query.
- Smaller alternatives (Zustand/Jotai) cover the rest with 5% of the code.

**Q: How do you persist state?**
- `localStorage` middleware (zustand/persist, redux-persist).
- Watch for SSR – hydration mismatch if you read storage on first render.
- IndexedDB for >5MB.

**Q: Optimistic updates – how?**
- Apply change to cache immediately.
- Fire mutation.
- On error: roll back to snapshot.
- On success: optionally reconcile with server response.

**Q: How do you avoid the "everything in Redux" problem?**
- Define ownership rules: "server data → React Query, URL → router, ephemeral UI → useState".
- Code review checklist.
- Lint rule against importing fetch in slice files.

---

## Hands-on (if you have spare time)

Inside `packages/use-query`, build the mini React Query (Day 4 doc).

A faster exercise: write a 50-line Zustand clone (see snippet above) and prove it doesn't re-render unrelated subscribers.
