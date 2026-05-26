import { ReactNode, useEffect, useId, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import { TabTrigger } from "./TabTrigger"

type TabItem = {
  title: ReactNode
  content: ReactNode
}

type TabListProps = {
  items: TabItem[]
}

export function Tabs({ items }: TabListProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [focusedTab, setFocusedTab] = useState(0)
  const reactId = useId()
  const baseId = `tabs-${reactId.replace(/:/g, "")}`
  const tabButtonRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    if (items.length === 0) {
      setActiveTab(0)
      setFocusedTab(0)
      return
    }

    if (activeTab >= items.length) {
      setActiveTab(0)
    }
    if (focusedTab >= items.length) {
      setFocusedTab(0)
    }
  }, [activeTab, focusedTab, items.length])

  const getTabId = (index: number) => `${baseId}-tab-${index}`
  const getPanelId = (index: number) => `${baseId}-panel-${index}`

  function focusTab(index: number) {
    tabButtonRefs.current[index]?.focus()
  }

  function handleSelectTab(index: number) {
    setActiveTab(index)
    setFocusedTab(index)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (items.length === 0) return

    let nextIndex = focusedTab
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault()
        nextIndex = (focusedTab + 1) % items.length
        break
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault()
        nextIndex = (focusedTab - 1 + items.length) % items.length
        break
      case "Home":
        event.preventDefault()
        nextIndex = 0
        break
      case "End":
        event.preventDefault()
        nextIndex = items.length - 1
        break
      default:
        return
    }

    handleSelectTab(nextIndex)
    focusTab(nextIndex)
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div>
      <div
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
      >
        {items.map((item, index) => {
          const isActive = index === activeTab
          const tabId = getTabId(index)
          const panelId = getPanelId(index)

          return (
            <TabTrigger
              key={index}
              title={item.title}
              id={tabId}
              panelId={panelId}
              isActive={isActive}
              tabIndex={isActive ? 0 : -1}
              setRef={(node) => {
                tabButtonRefs.current[index] = node
              }}
              onSelect={() => handleSelectTab(index)}
              onFocus={() => setFocusedTab(index)}
            />
          )
        })}
      </div>

      <div
        role="tabpanel"
        id={getPanelId(activeTab)}
        aria-labelledby={getTabId(activeTab)}
      >
        {items[activeTab]?.content}
      </div>
    </div>
  )
}