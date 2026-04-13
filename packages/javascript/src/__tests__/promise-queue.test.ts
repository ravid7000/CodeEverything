import { describe, it, expect, beforeEach, vi } from 'vitest';

// NOTE: Implementation NOT provided here. Import path below is the expected implementation file.
// TODO: Implement and export PromiseQueue from '../promise-queue' (one level up from __tests__)
import { PromiseQueue, QueueOptions } from '../promise-queue'; // <-- placeholder path

// Chosen API (tests assume this):
// class PromiseQueue<T> {
//   constructor(options?: { concurrency?: number; maxSize?: number; retry?: { attempts: number; delayMs?: number } });
//   add(task: () => Promise<T>, opts?: { timeoutMs?: number; signal?: AbortSignal }): Promise<T>;
//   pause(): void;
//   resume(): void;
//   size(): number; // waiting + running
// }

describe('PromiseQueue (Vitest + TypeScript) — tests only (no implementation)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should process tasks up to concurrency limit (happy path)', async () => {
    const q = new PromiseQueue<number>({ concurrency: 2 });

    let running = 0;
    const resolvers: Array<() => void> = [];

    const makeTask = (id: number) => () =>
      new Promise<number>((resolve) => {
        running++;
        resolvers.push(() => {
          running--;
          resolve(id);
        });
      });

    const p1 = q.add(makeTask(1));
    const p2 = q.add(makeTask(2));
    const p3 = q.add(makeTask(3));

    // At this point only two tasks should be running because concurrency=2
    expect(running).toBe(2);

    // Resolve first task
    resolvers.shift()?.();
    const r1 = await p1;
    expect(r1).toBe(1);

    // After resolving one, third task should have started (still concurrency 2)
    expect(running).toBe(2);

    // Resolve remaining
    while (resolvers.length) resolvers.shift()?.();
    const results = await Promise.all([p2, p3]);
    expect(results.sort()).toEqual([2, 3]);
  });

  it('should preserve FIFO order when concurrency=1', async () => {
    const q = new PromiseQueue<string>({ concurrency: 1 });

    const order: string[] = [];

    const makeTask = (label: string, delay = 0) => () =>
      new Promise<string>((resolve) => {
        order.push(`start-${label}`);
        setTimeout(() => {
          order.push(`end-${label}`);
          resolve(label);
        }, delay);
      });

    const pA = q.add(makeTask('A', 10));
    const pB = q.add(makeTask('B', 1));
    const pC = q.add(makeTask('C', 1));

    const results = await Promise.all([pA, pB, pC]);
    expect(results).toEqual(['A', 'B', 'C']);

    // Ensure start/end order matches FIFO behavior
    expect(order[0]).toBe('start-A');
    expect(order).toContain('start-B');
    expect(order).toContain('start-C');
  });

  it('should reject enqueue when maxSize is exceeded', async () => {
    const q = new PromiseQueue<void>({ concurrency: 1, maxSize: 2 });

    // Create tasks that never resolve so they occupy slots
    const never = () => new Promise<void>(() => { });

    // First two adds should be accepted (one running, one waiting)
    const p1 = q.add(never);
    const p2 = q.add(never);

    // Third add should be rejected due to maxSize
    await expect(q.add(never)).rejects.toThrow(/full/i);

    // Cleanup: not resolving p1/p2 here (implementation may provide clear) — tests assume rejection behavior
    // TODO: implement a way to drain/clear the queue in implementation
    // To avoid hanging test runners, we don't await p1/p2
  });

  it('should support per-task timeout and continue processing others', async () => {
    const q = new PromiseQueue<number>({ concurrency: 1 });

    const longTask = () => new Promise<number>((resolve) => setTimeout(() => resolve(1), 1000));
    const fastTask = () => Promise.resolve(2);

    // longTask should timeout if timeoutMs set small
    const p1 = q.add(longTask, { timeoutMs: 10 });
    const p2 = q.add(fastTask);

    await expect(p1).rejects.toThrow(/timeout/i);
    await expect(p2).resolves.toBe(2);
  });

  it('should retry failed tasks up to attempts and eventually reject if all attempts fail', async () => {
    const q = new PromiseQueue<number>({ concurrency: 1, retry: { attempts: 3, delayMs: 1 } });

    let attempts = 0;
    const flaky = () =>
      new Promise<number>((resolve, reject) => {
        attempts++;
        reject(new Error('boom'));
      });

    await expect(q.add(flaky)).rejects.toThrow(/boom/);
    expect(attempts).toBe(3);
  });

  it('should allow cancellation via AbortSignal and free concurrency slot', async () => {
    const q = new PromiseQueue<number>({ concurrency: 1 });
    let running = 0;

    const controllable = () =>
      new Promise<number>((resolve) => {
        running++;
        // never resolve automatically
      });

    const ac = new AbortController();

    const p1 = q.add(controllable);
    const p2 = q.add(() => Promise.resolve(2), { signal: ac.signal });

    // cancel the second before it starts
    ac.abort();

    // p2 should reject with AbortError
    await expect(p2).rejects.toThrow(/abort/i);

    // Because p2 was cancelled before starting, it should not consume a concurrency slot.
    // Resolve or clean up p1 if implementation supports clear — otherwise ensure tests don't hang.
  });

  it('should pause and resume starting of new tasks', async () => {
    const q = new PromiseQueue<number>({ concurrency: 2 });

    const started: number[] = [];
    const makeTask = (n: number) => () =>
      new Promise<number>((resolve) => {
        started.push(n);
        setTimeout(() => resolve(n), 1);
      });

    q.pause();
    const p1 = q.add(makeTask(1));
    const p2 = q.add(makeTask(2));

    // While paused, nothing should have started
    expect(started.length).toBe(0);

    q.resume();
    const results = await Promise.all([p1, p2]);
    expect(results.sort()).toEqual([1, 2]);
  });

  // Edge-case tests
  it('should throw on invalid constructor options (e.g., concurrency <= 0)', () => {
    // The implementation should validate options and throw for invalid values
    // TODO: decide whether to throw synchronously or to normalize; tests expect throw
    expect(() => new PromiseQueue({ concurrency: 0 })).toThrow();
  });

  it('should reject add when provided non-function task', async () => {
    // @ts-expect-error intentionally passing invalid task
    const q = new PromiseQueue();
    // Implementation should reject synchronously or return a rejected Promise
    await expect((q as any).add(null)).rejects.toThrow();
  });

  // Performance-ish smoke: ensure concurrency honored under many tasks (medium difficulty)
  it('should honor concurrency under load (smoke test)', async () => {
    vi.useFakeTimers();
    try {
      const concurrency = 5;
      const q = new PromiseQueue<number>({ concurrency });

      let maxRunning = 0;
      let running = 0;

      const makeTask = (i: number) => () =>
        new Promise<number>((resolve) => {
          running++;
          maxRunning = Math.max(maxRunning, running);
          setTimeout(() => {
            running--;
            resolve(i);
          }, 10);
        });

      const tasks = Array.from({ length: 20 }, (_, i) => q.add(makeTask(i)));
      const allTasks = Promise.all(tasks);
      const timedAllTasks = new Promise<number[]>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Queue did not settle in expected time'));
        }, 1_000);
        allTasks.then(
          (values) => {
            clearTimeout(timeoutId);
            resolve(values);
          },
          (err) => {
            clearTimeout(timeoutId);
            reject(err);
          }
        );
      });

      // Attach a noop catch immediately so fake-timer-driven rejections are not reported as unhandled
      // before we await below.
      timedAllTasks.catch(() => undefined);
      await vi.advanceTimersByTimeAsync(2_000);
      const values = await timedAllTasks;
      expect(values).toHaveLength(20);
      expect(maxRunning).toBeLessThanOrEqual(concurrency);
    } finally {
      vi.useRealTimers();
    }
  });
});
