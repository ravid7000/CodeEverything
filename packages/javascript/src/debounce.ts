// TODO: Implement debounce according to the tests in ../src/__tests__/debounce.test.ts
// Expected API (TypeScript):
// export function debounce<T extends (...args: any[]) => any>(
//   fn: T,
//   wait: number,
//   options?: { leading?: boolean; trailing?: boolean; maxWait?: number }
// ): ((...args: Parameters<T>) => ReturnType<T> & { cancel: () => void; flush: () => ReturnType<T> | undefined });

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options?: { leading?: boolean; trailing?: boolean; maxWait?: number }
) {
  let timer, lastThis, lastArgs, calledOnLeading = false
  const { leading, trailing } = options ?? {}

  if (typeof fn !== 'function') {
    throw new TypeError('fn is not typeof function')
  }

  function flush() {
    return fn.apply(lastThis, lastArgs)
  }

  function cancel() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function innerFn(...args: any[]) {
    lastThis = this
    lastArgs = args

    cancel()

    if (leading && !calledOnLeading) {
      flush()
      calledOnLeading = true
    }

    timer = setTimeout(() => {
      timer = null
      calledOnLeading = false
      if (leading && !trailing) {
        return
      }

      flush()
    }, wait)
  }

  innerFn.cancel = cancel
  innerFn.flush = flush

  return innerFn
}
