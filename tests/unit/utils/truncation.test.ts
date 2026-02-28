import { describe, it, expect } from "vitest";
import { smartTruncate } from "../../../src/utils/truncation.js";

describe("smartTruncate", () => {
  it("should return all rows when count <= threshold", () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ id: `${i}`, name: `Item ${i}` }));
    const result = smartTruncate(rows, { totalCount: 10, pageSize: 50, threshold: 50 });
    expect(result.mode).toBe("full");
    expect(result.rows).toHaveLength(10);
  });

  it("should paginate when count is between threshold and largeThreshold", () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({ id: `${i}`, name: `Item ${i}` }));
    const result = smartTruncate(rows, { totalCount: 200, pageSize: 50, threshold: 50, largeThreshold: 500 });
    expect(result.mode).toBe("paginated");
    expect(result.rows.length).toBeLessThanOrEqual(50);
    expect(result.metadata?.totalCount).toBe(200);
    expect(result.metadata?.hasMore).toBe(true);
  });

  it("should summarize when count > largeThreshold", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      id: `${i}`, name: `Item ${i}`, city: i % 2 === 0 ? "Oslo" : "Bergen"
    }));
    const result = smartTruncate(rows, { totalCount: 5000, pageSize: 50, threshold: 50, largeThreshold: 500 });
    expect(result.mode).toBe("summarized");
    expect(result.rows.length).toBeLessThanOrEqual(20);
    expect(result.metadata?.totalCount).toBe(5000);
    expect(result.summary).toBeDefined();
  });

  it("should truncate long string values", () => {
    const rows = [{ id: "1", description: "A".repeat(500) }];
    const result = smartTruncate(rows, { totalCount: 1, pageSize: 50, threshold: 50, maxStringLength: 200 });
    expect(result.rows[0].description.length).toBeLessThanOrEqual(203);
  });
});
