export interface RateLimiterOptions {
  maxConcurrent: number;
  maxPerWindow: number;
  windowMs: number;
}

export class RateLimiter {
  private concurrent = 0;
  private queue: Array<() => void> = [];
  private windowRequests: number[] = [];
  private options: RateLimiterOptions;

  constructor(options: RateLimiterOptions) {
    this.options = options;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquireSlot();
    this.windowRequests.push(Date.now());
    try {
      return await fn();
    } finally {
      this.concurrent--;
      this.releaseNext();
    }
  }

  private acquireSlot(): Promise<void> {
    // Clean up expired window requests
    const now = Date.now();
    this.windowRequests = this.windowRequests.filter(
      (t) => now - t < this.options.windowMs
    );

    // Check window limit
    if (this.windowRequests.length >= this.options.maxPerWindow) {
      const oldest = this.windowRequests[0];
      const waitMs = oldest + this.options.windowMs - Date.now();
      if (waitMs > 0) {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            this.acquireSlot().then(resolve);
          }, waitMs);
        });
      }
    }

    // Check concurrency limit - increment synchronously to prevent races
    if (this.concurrent < this.options.maxConcurrent) {
      this.concurrent++;
      return Promise.resolve();
    }

    // Queue the request and wait for a slot to open
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.concurrent++;
        resolve();
      });
    });
  }

  private releaseNext(): void {
    const next = this.queue.shift();
    if (next) next();
  }

  static calculateBackoff(
    attempt: number,
    maxDelayMs: number = 30000
  ): number {
    const baseDelay = 1000;
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * baseDelay;
    return Math.min(exponentialDelay + jitter, maxDelayMs);
  }
}
