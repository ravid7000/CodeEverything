type EventListenerFn = (ev: Event) => void;

class Wrapper {
  private elements: HTMLElement[] = []
  private listenerMap = new WeakMap<HTMLElement, Map<string, EventListenerFn[]>>()

  constructor(elementOrString: HTMLElement | string) {
    if (typeof elementOrString === 'string') {
      this.elements = Array.from(
        document.querySelectorAll<HTMLElement>(elementOrString)
      )
    } else {
      this.elements = [elementOrString]
    }
  }

  text(): string
  text(value: string): Wrapper
  text(value?: string): string | Wrapper {
    if (value === undefined) {
      return this.elements[0]?.textContent ?? ""
    }

    this.elements.forEach((el) => el.textContent = value)
    return this
  }

  addClass(className: string): Wrapper {
    if (typeof className !== 'string') {
      throw new TypeError('className must be a string')
    }

    this.elements.forEach((el) => el.classList.add(className))

    return this
  }

  removeClass(className: string): Wrapper {
    if (typeof className !== 'string') {
      throw new TypeError('className must be a string')
    }

    this.elements.forEach((el) => el.classList.remove(className))

    return this
  }

  on(event: string, handler: EventListenerFn): Wrapper {
    this.elements.forEach((el) => {
      el.addEventListener(event, handler)

      let byEvent = this.listenerMap.get(el)

      if (!byEvent) {
        byEvent = new Map()
        this.listenerMap.set(el, byEvent)
      }

      const list = byEvent.get(event) ?? []
      list.push(handler)
      byEvent.set(event, list)
    })

    return this
  }

  off(event: string, handler?: EventListenerFn): Wrapper {
    this.elements.forEach((el) => {
      const byEvent = this.listenerMap.get(el)
      const list = byEvent?.get(event)

      if (!list?.length) {
        return
      }

      if (handler) {
        const idx = list.indexOf(handler)

        if (idx !== -1) {
          el.removeEventListener(event, handler)
          list.splice(idx, 1)
        }
      } else {
        list.forEach((hdlr) => {
          el.removeEventListener(event, hdlr)
        })

        byEvent.set(event, [])
      }
    })

    return this
  }

  css(prop: string): string
  css(prop: string, value: string): Wrapper
  css(props: Record<string, string>): Wrapper
  css(
    propOrProps: string | Record<string, string>,
    value?: string
  ): string | Wrapper {
    if (
      typeof propOrProps === "object" &&
      propOrProps !== null &&
      !Array.isArray(propOrProps)
    ) {
      for (const key of Object.keys(propOrProps)) {
        const v = propOrProps[key]
        if (v === undefined) {
          continue
        }
        for (const el of this.elements) {
          Wrapper.setInlineStyle(el, key, v)
        }
      }
      return this
    }

    const prop = propOrProps as string
    if (value === undefined) {
      return Wrapper.getInlineStyle(this.elements[0], prop)
    }

    for (const el of this.elements) {
      Wrapper.setInlineStyle(el, prop, value)
    }
    return this
  }

  /** Inline styles only (not computed), camelCase keys like `paddingLeft`. */
  private static getInlineStyle(el: HTMLElement | undefined, prop: string): string {
    if (!el) {
      return ""
    }
    const style = el.style as unknown as Record<string, string>
    return style[prop] ?? ""
  }

  private static setInlineStyle(el: HTMLElement, prop: string, val: string): void {
    const style = el.style as unknown as Record<string, string>
    style[prop] = val
  }
}
export function $(elementOrString: HTMLElement | string) {
  return new Wrapper(elementOrString)
}
