import { describe, it, expect } from "vitest";
import { formatToolResponse, formatListResponse } from "../../../src/utils/formatting.js";

describe("formatToolResponse", () => {
  it("should format a single entity as readable text", () => {
    const entity = { id: "abc-123", displayName: "Contoso", city: "Oslo", balanceDue: 5000 };
    const result = formatToolResponse(entity, "customer");
    expect(result).toContain("Contoso");
    expect(result).toContain("Oslo");
    expect(result).toContain("customer");
  });

  it("should skip null/undefined/empty values", () => {
    const entity = { id: "1", displayName: "Test", empty: "", nullVal: null, undef: undefined };
    const result = formatToolResponse(entity, "item");
    expect(result).not.toContain("empty:");
    expect(result).not.toContain("nullVal:");
    expect(result).not.toContain("undef:");
  });
});

describe("formatListResponse", () => {
  it("should format list response with metadata", () => {
    const result = formatListResponse(
      [{ id: "1", displayName: "A" }, { id: "2", displayName: "B" }],
      { mode: "paginated", totalCount: 100, returnedCount: 2, hasMore: true }
    );
    expect(result).toContain("Showing 2 of 100");
  });

  it("should return 'No records found' for empty list", () => {
    const result = formatListResponse([]);
    expect(result).toBe("No records found.");
  });
});
