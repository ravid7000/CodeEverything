# 03 – Component Design

> **Abbreviations:** [Glossary (00)](./00-glossary.md) — UI (User Interface), ARIA (Accessible Rich Internet Applications), WAI-ARIA (Web Accessibility Initiative – ARIA).

## 60-second talk-track

> "I design components on three axes: **API surface** (props vs composition vs render-prop), **state ownership** (controlled vs uncontrolled), and **styling control** (opinionated vs headless). Reusability and composability often trade off – the more props you add, the less composable it becomes. My default is **compound components** with a headless core, controlled+uncontrolled support, and a slot-based styling escape hatch. That pattern scales from a small button to a full data-table."

---

## The four levels of a component API

| Level | Pattern | Example |
|---|---|---|
| 1 | Monolithic props | `<Modal title="..." body="..." onClose={...} />` |
| 2 | Children | `<Modal><Header/><Body/><Footer/></Modal>` |
| 3 | Compound + Context | `<Tabs><Tabs.List><Tabs.Tab/></Tabs.List><Tabs.Panel/></Tabs>` |
| 4 | Headless + render-props / hooks | `useCombobox()` → you bring the JSX |

Move up the levels as **flexibility need** grows. Don't start at 4 for a button.

---

## Compound components – the pattern

```tsx
const TabsContext = React.createContext<Ctx | null>(null);

export function Tabs({ defaultValue, value, onChange, children }: Props) {
  const [internal, setInternal] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;
  const setCurrent = (v: string) => {
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ current, setCurrent }}>
      {children}
    </TabsContext.Provider>
  );
}

Tabs.List  = ({ children }) => <div role="tablist">{children}</div>;
Tabs.Tab   = ({ value, children }) => {
  const { current, setCurrent } = useTabs();
  return (
    <button role="tab" aria-selected={current === value} onClick={() => setCurrent(value)}>
      {children}
    </button>
  );
};
Tabs.Panel = ({ value, children }) => {
  const { current } = useTabs();
  return current === value ? <div role="tabpanel">{children}</div> : null;
};
```

**Why this is good:**
- Order of `Tab` / `Panel` is consumer's choice.
- Add a new tab → no prop changes.
- Works in both controlled (`value`) and uncontrolled (`defaultValue`) mode.
- Styling is the consumer's problem.

---

## Headless pattern (the Radix / Headless UI way)

Split logic from view:

```tsx
function useToggle(initial = false) {
  const [on, setOn] = React.useState(initial);
  return {
    on,
    getButtonProps: () => ({
      'aria-pressed': on,
      onClick: () => setOn(o => !o),
    }),
  };
}

const { on, getButtonProps } = useToggle();
return <button className={myClass} {...getButtonProps()}>{on ? 'On' : 'Off'}</button>;
```

Ship the **hook**, the consumer ships the JSX. Used by `downshift`, `react-aria`, `@tanstack/table`.

---

## Controlled vs uncontrolled (memorize)

| | Controlled | Uncontrolled |
|---|---|---|
| State lives in | parent | component |
| API | `value` + `onChange` | `defaultValue` + `ref` |
| Use when | parent needs to react to every change | parent only cares at submit/blur |
| Anti-pattern | controlling state you never read |

**Always support both** for inputs. `value === undefined ? internal : value`.

---

## Composition over configuration (the prop-explosion fix)

Bad:
```tsx
<Card title="..." titleSize="lg" icon="x" iconColor="red" headerActions={...} />
```

Good:
```tsx
<Card>
  <Card.Header>
    <Card.Icon><X color="red"/></Card.Icon>
    <Card.Title size="lg">...</Card.Title>
    <Card.Actions>...</Card.Actions>
  </Card.Header>
</Card>
```

The first one keeps adding props forever. The second one absorbs change for free.

---

## `asChild` / slot pattern (Radix)

Lets consumer swap the rendered element while keeping behavior:

```tsx
<Tooltip.Trigger asChild>
  <MyCustomButton />
</Tooltip.Trigger>
```

Implemented with `React.cloneElement(child, { ...mergedProps, ref: mergedRef })`. Pattern shows up everywhere – know it.

---

## Common interview questions

**Q: How do you decide when to split a component?**
- More than ~150 lines.
- Two distinct responsibilities (data + view, list + item).
- Re-use in 2+ places.
- Independent state.

**Q: Reusability vs composability – difference?**
- Reusable = drop-in for same use case (`<Button>`).
- Composable = combine to make new things (`<Form>` + `<Field>` + `<Validation>`).

**Q: How do you avoid Context re-render storms?**
- Split contexts by update frequency (theme rarely vs cursor every move).
- `useSyncExternalStore` with selectors.
- Move to external store (Zustand) when consumers exceed ~5.

**Q: Render-props vs hooks?**
- Hooks won. Render-props left for: cross-framework portability, conditional consumer (sometimes I want logic, sometimes not).

---

## What to design on the whiteboard

A practical prompt you should be able to whiteboard in 10 min: **"Design a `<Select>` component."**

Cover:
- Compound API: `Select` / `Select.Trigger` / `Select.Options` / `Select.Option`.
- Controlled + uncontrolled.
- Keyboard nav (arrow keys, type-ahead, Esc).
- ARIA (`role=combobox`, `aria-expanded`, `aria-activedescendant`).
- Portal for the dropdown (z-index escape).
- Virtualized list for 10k options.
- Async load options (`loadOptions`).
- Multi-select variant.

Mention WAI-ARIA Authoring Practices as your reference. That alone marks you as senior.
