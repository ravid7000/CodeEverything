import { ReactNode } from "react";

type TabTriggerProps = {
  title: ReactNode
  id: string
  panelId: string
  isActive: boolean
  tabIndex: number
  setRef: (node: HTMLButtonElement | null) => void
  onSelect: () => void
  onFocus: () => void
}

export function TabTrigger({
  title,
  id,
  panelId,
  isActive,
  tabIndex,
  setRef,
  onSelect,
  onFocus,
}: TabTriggerProps) {
  return (
    <button
      ref={setRef}
      id={id}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={panelId}
      tabIndex={tabIndex}
      onClick={onSelect}
      onFocus={onFocus}
    >
      {title}
    </button>
  )
}