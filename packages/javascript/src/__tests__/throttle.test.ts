import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Tests assume implementation at '../throttle'
// API: throttle(fn, wait, options?) with { leading?: boolean; trailing?: boolean }
// Defaults: leading true, trailing true (lodash-style)

import { throttle } from '../throttle';

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should invoke on the leading edge immediately, then at most once on the trailing edge after wait', () => {
    const fn = vi.fn();
    const th = throttle(fn, 100);

    th('a');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith('a');

    th('b');
    th('c');
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('c');
  });

  it('should only invoke on trailing edge when leading is false', () => {
    const fn = vi.fn();
    const th = throttle(fn, 80, { leading: false, trailing: true });

    th(1);
    th(2);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(80);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(2);
  });

  it('should not invoke trailing when trailing is false (leading only during a burst)', () => {
    const fn = vi.fn();
    const th = throttle(fn, 100, { leading: true, trailing: false });

    th('x');
    expect(fn).toHaveBeenCalledTimes(1);

    th('y');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancel() should drop a pending trailing invocation', () => {
    const fn = vi.fn();
    const th = throttle(fn, 50);

    th('first');
    th('pending');
    th.cancel();

    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('first');
  });

  it('should allow a fresh leading call after the wait window has elapsed', () => {
    const fn = vi.fn();
    const th = throttle(fn, 100, { leading: true, trailing: false });

    th(1);
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    th(2);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(2);
  });

  it('should treat wait === 0 as no throttle (every call runs fn)', () => {
    const fn = vi.fn();
    const th = throttle(fn, 0);

    th('a');
    th('b');
    th('c');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn.mock.calls).toEqual([['a'], ['b'], ['c']]);
  });

  it('should forward this and the latest arguments to the wrapped function', () => {
    const ctx = { label: 'ctx' };
    const fn = vi.fn(function (this: { label: string }, n: number) {
      return `${this.label}:${n}`;
    });
    const th = throttle(fn as (n: number) => string, 40, {
      leading: false,
      trailing: true,
    });

    const bound = th.bind(ctx);
    bound(10);
    bound(20);

    vi.advanceTimersByTime(40);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenLastCalledWith(20);
    expect((fn.mock.instances[0] as { label: string }).label).toBe('ctx');
  });

  it('should throw when fn is not a function', () => {
    expect(() => (throttle as any)(null, 10)).toThrow();
  });
});
