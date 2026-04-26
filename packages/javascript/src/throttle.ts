// TODO: Implement throttle according to tests in ./__tests__/throttle.test.ts
//
// Expected API:
// export function throttle<T extends (...args: any[]) => any>(
//   fn: T,
//   wait: number,
//   options?: { leading?: boolean; trailing?: boolean }
// ): ((...args: Parameters<T>) => void) & { cancel: () => void }
//
// Semantics (lodash-style defaults):
// - leading defaults to true; trailing defaults to true.
// - If both leading and trailing are false, throw or treat as invalid (tests may only cover valid options).
// - cancel(): clears any pending trailing invocation and resets state so the next call can use the leading edge again.
// - wait === 0: invoke fn on every call (no effective throttle), still forward this/args.

export function throttle<T extends (...args: any[]) => any>(
  _fn: T,
  _wait: number,
  _options?: { leading?: boolean; trailing?: boolean }
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  if (typeof _fn !== 'function') {
    throw new TypeError('Expected a function');
  }

  const stub = function (..._args: Parameters<T>) {
    throw new Error('TODO: implement throttle — see __tests__/throttle.test.ts');
  };
  stub.cancel = () => {
    throw new Error('TODO: implement throttle.cancel');
  };
  return stub as ReturnType<typeof throttle>;
}
