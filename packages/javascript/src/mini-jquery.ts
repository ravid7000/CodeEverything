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
}
export function $(elementOrString: HTMLElement | string) {
  return new Wrapper(elementOrString)
}
