export type QueueOptions = {
  concurrency: number;
  maxSize?: number;
  retry?: {
    attempts: number;
    delayMs?: number
  }
}

type AddTaskOptions = {
  timeoutMs?: number,
  signal?: AbortSignal
}

type PendingEntry<Type> = {
  task: () => Promise<Type>;
  opt?: AddTaskOptions;
  aborted: boolean;
  cleanupAbortListener?: () => void;
  retry: {
    attempts: number;
    delayMs?: number
  }
  resolvers: {
    resolve: (value: Type | PromiseLike<Type>) => void;
    reject: (reason?: unknown) => void;
  };
};

export class PromiseQueue<Type> {
  options: QueueOptions = {
    concurrency: 2,
    maxSize: Infinity,
  };

  pending: Array<PendingEntry<Type>> = [];
  runningQueue: Array<PendingEntry<Type>> = [];
  // result: Array<Awaited<Type>> = [];
  // error: Array<Awaited<Type>> = [];
  runningIndex = 0;
  /** When false, `pause()` has stopped scheduling; default true so the queue runs without an explicit `resume()`. */
  isRunning = true;

  constructor(options: QueueOptions) {
    this.options = {
      ...this.options,
      ...options,
    }
    if (!Number.isFinite(this.options.concurrency) || this.options.concurrency <= 0) {
      throw new Error('concurrency must be a positive number');
    }
  }

  add(task: () => Promise<Type>, opt?: AddTaskOptions) {
    // create a new promise and store its resolvers along with the task function in the
    // pending queue
    const taskPromise = new Promise<Type>((resolve, reject) => {
      if (typeof task !== 'function') {
        return reject(new TypeError('task must be a function'));
      }
      // base condition, if there are no space left in the pending + running, compare with maxSize
      // then throw error
      if (this.pending.length + this.runningIndex >= this.options.maxSize) {
        return reject(new Error('Queue is full'));
      }
      const entry = this.createPendingItem(task, opt, resolve, reject);
      this.pending.push(entry);
      this.bindAbortSignal(entry);
    });

    // start executing the tasks
    this.executeQueue();

    return taskPromise;
  }

  pause() {
    this.isRunning = false;
  }

  resume() {
    this.isRunning = true;
    this.executeQueue();
  }

  private createPendingItem(task: () => Promise<Type>, opt: AddTaskOptions | undefined, resolve: (value: Type | PromiseLike<Type>) => void, reject: (reason?: any) => void): PendingEntry<Type> {
    const configuredAttempts = this.options.retry?.attempts ?? 0;
    return {
      task, opt,
      aborted: false,
      retry: {
        // `attempts` in options is total allowed executions.
        // Store remaining retries so attempts=3 => initial + 2 retries.
        attempts: Math.max(configuredAttempts - 1, 0),
        delayMs: this.options.retry?.delayMs ?? 0
      },
      resolvers: { resolve, reject }
    };
  }

  private executeQueue() {
    // base condition, if the running tasks are at concurrency or no pending tasks, then don't proceed
    if (!this.isRunning || this.runningIndex >= this.options.concurrency || this.pending.length === 0) {
      return;
    }

    // Loop to start concurrent tasks while capacity exists
    while (this.runningIndex < this.options.concurrency && this.pending.length) {
      const entry = this.pending.shift()!;
      if (entry.aborted) {
        continue;
      }
      entry.cleanupAbortListener?.();
      this.runningIndex += 1;

      this.runTaskWithRetry(entry);
    }
  }

  private runTaskWithRetry(entry: PendingEntry<Type>) {
    const { task, resolvers, opt } = entry;
    const retryDelayMs = this.options.retry?.delayMs ?? 0
    const { timeoutMs } = opt ?? {}

    const timeoutPromise = timeoutMs ? PromiseQueue.createTimeoutPromise<Type>(timeoutMs) : null
    const taskPromise = new Promise<Type>((resolve) => {
      try {
        resolve(task())
      } catch (err) {
        this.runningIndex -= 1;
        this.executeQueue();
        resolvers.reject(err);
      }
    })

    const runnerQueue = [taskPromise]

    if (timeoutPromise) {
      runnerQueue.push(timeoutPromise)
    }

    // Execute the task and call its resolvers
    Promise.race(runnerQueue)
      .then((res) => {
        this.runningIndex -= 1;
        this.executeQueue();
        resolvers.resolve(res);
      })
      .catch((err) => {
        const errMessage = err instanceof Error ? err.message : '';
        const isTimeoutFailure = /timeout/i.test(errMessage)

        if (!isTimeoutFailure && entry.retry.attempts > 0) {
          entry.retry.attempts -= 1


          setTimeout(() => {
            this.runTaskWithRetry(entry)
          }, retryDelayMs);

          return;
        }

        this.runningIndex -= 1;
        this.executeQueue();
        resolvers.reject(err);
      });
  }

  static createTimeoutPromise<T>(timeoutMs = 0) {
    return new Promise<T>((_resolve, reject) => {
      setTimeout(reject, timeoutMs ?? 0, "Promise timeout")
    })
  }

  private bindAbortSignal(entry: PendingEntry<Type>) {
    const signal = entry.opt?.signal;
    if (!signal) {
      return;
    }

    if (signal.aborted) {
      entry.aborted = true;
      entry.resolvers.reject(PromiseQueue.createAbortError());
      return;
    }

    const onAbort = () => {
      entry.aborted = true;
      const pendingIndex = this.pending.indexOf(entry);
      if (pendingIndex === -1) {
        return;
      }
      this.pending.splice(pendingIndex, 1);
      entry.resolvers.reject(PromiseQueue.createAbortError());
      this.executeQueue();
    };

    signal.addEventListener("abort", onAbort, { once: true });
    entry.cleanupAbortListener = () => signal.removeEventListener("abort", onAbort);
  }

  private static createAbortError() {
    return new Error("AbortError: task aborted");
  }
}
