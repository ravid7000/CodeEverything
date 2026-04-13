import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Tests assume a debounce implementation at '../debounce'
// API expected (full):
// function debounce<T extends (...args:any[])=>any>(fn: T, wait: number, options?: { leading?: boolean; trailing?: boolean; maxWait?: number })
// returns a debounced function with methods: cancel(): void; flush(): ReturnType<T> | undefined

import { debounce } from '../debounce'; // TODO: implement

describe('debounce (full API) — tests only', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call function once after wait when called repeatedly (trailing)', () => {
    const fn = vi.fn();
    const deb = debounce(fn, 100);

    deb('a');
    deb('b');
    deb('c');

    // not called synchronously
    expect(fn).not.toHaveBeenCalled();

    // advance time less than wait
    vi.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();

    // reach wait -> should call once with last args
    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c');
  });

  it('should call immediately when leading=true and not call again on trailing by default', () => {
    const fn = vi.fn();
    const deb = debounce(fn, 100, { leading: true, trailing: false });

    deb(1);
    expect(fn).toHaveBeenCalledTimes(1);

    deb(2);
    deb(3);
    vi.advanceTimersByTime(100);
    // trailing false -> no further calls
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should call on both leading and trailing when both true (common lodash behavior)', () => {
    const fn = vi.fn();
    const deb = debounce(fn, 50, { leading: true, trailing: true });

    deb('x'); // leading call
    expect(fn).toHaveBeenCalledTimes(1);

    deb('y');
    // advance and ensure trailing runs once more after silence
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('y');
  });

  it('cancel() should prevent pending invocation', () => {
    const fn = vi.fn();
    const deb = debounce(fn, 100);

    deb('a');
    deb.cancel();

    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });

  it('flush() should immediately invoke pending invocation and return its result', () => {
    const fn = vi.fn((x: number) => x * 2);
    const deb = debounce(fn, 100);

    deb(5);
    const res = deb.flush();
    expect(res).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should forward "this" and arguments to the wrapped function', () => {
    const ctx = { v: 2 };
    const fn = vi.fn(function (this: any, a: number) { return this.v * a; });
    const deb = debounce(fn as any, 50);

    const bound = deb.bind(ctx);
    bound(3);
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalled();
    // last call context is the bound context
    expect((fn.mock.instances[0] as any).v).toBe(2);
  });

  it('should handle zero wait as synchronous passthrough', () => {
    const fn = vi.fn();
    const deb = debounce(fn, 0);

    deb('now');
    // with zero wait, implementation may choose to call immediately
    // expect at least one call
    vi.advanceTimersByTime(0);
    expect(fn).toHaveBeenCalled();
  });

  it('should throw on invalid fn argument', () => {
    expect(() => (debounce as any)(null, 100)).toThrow();
  });

  // Performance-ish: ensure rapid repeated calls don't schedule unbounded timers
  it('should not schedule more than one pending timer for trailing debounce', () => {
    const fn = vi.fn();
    const deb = debounce(fn, 100);

    deb(); deb(); deb(); deb();
    // depending on implementation, there should be only one scheduled timer
    // This is a soft assertion: function should not be called until wait elapses
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
