import { describe, it, expect, vi, beforeEach } from "vitest";
import { RateLimiter } from "../../../src/client/rate-limiter.js";

describe("RateLimiter", () => {
  it("should allow requests within limits", async () => {
    const limiter = new RateLimiter({ maxConcurrent: 5, maxPerWindow: 100, windowMs: 60000 });
    const result = await limiter.execute(() => Promise.resolve("ok"));
    expect(result).toBe("ok");
  });

  it("should track concurrent requests", async () => {
    const limiter = new RateLimiter({ maxConcurrent: 2, maxPerWindow: 100, windowMs: 60000 });
    let running = 0;
    let maxRunning = 0;
    const task = async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((r) => setTimeout(r, 50));
      running--;
      return "done";
    };
    const results = await Promise.all([
      limiter.execute(task),
      limiter.execute(task),
      limiter.execute(task),
    ]);
    expect(results).toEqual(["done", "done", "done"]);
    expect(maxRunning).toBeLessThanOrEqual(2);
  });

  it("should calculate exponential backoff with jitter", () => {
    const delay = RateLimiter.calculateBackoff(0);
    expect(delay).toBeGreaterThanOrEqual(1000);
    expect(delay).toBeLessThanOrEqual(2000);
    const delay2 = RateLimiter.calculateBackoff(3);
    expect(delay2).toBeGreaterThanOrEqual(8000);
    expect(delay2).toBeLessThanOrEqual(16000);
  });

  it("should cap backoff at max delay", () => {
    const delay = RateLimiter.calculateBackoff(10, 30000);
    expect(delay).toBeLessThanOrEqual(30000);
  });
});
