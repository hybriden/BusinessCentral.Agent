import { describe, it, expect } from "vitest";
import {
  buildBatchRequest,
  parseBatchResponse,
  type BatchOperation,
  type BatchResult,
} from "../../../src/client/batch.js";

describe("buildBatchRequest", () => {
  it("should build a valid batch request body", () => {
    const operations: BatchOperation[] = [
      {
        method: "PATCH",
        url: "items(abc-123)",
        headers: { "If-Match": "*" },
        body: { displayName: "Updated Item" },
      },
      {
        method: "POST",
        url: "customers",
        body: { displayName: "New Customer" },
      },
    ];

    const result = buildBatchRequest(operations);
    expect(result.requests).toHaveLength(2);
    expect(result.requests[0].method).toBe("PATCH");
    expect(result.requests[0].url).toBe("items(abc-123)");
    expect(result.requests[0].body).toEqual({ displayName: "Updated Item" });
    expect(result.requests[1].method).toBe("POST");
  });

  it("should add Content-Type header to requests with body", () => {
    const operations: BatchOperation[] = [
      { method: "POST", url: "customers", body: { displayName: "Test" } },
    ];
    const result = buildBatchRequest(operations);
    expect(result.requests[0].headers["Content-Type"]).toBe("application/json");
  });

  it("should throw if more than 100 operations", () => {
    const operations = Array.from({ length: 101 }, (_, i) => ({
      method: "GET" as const,
      url: `items(${i})`,
    }));
    expect(() => buildBatchRequest(operations)).toThrow("100");
  });

  it("should handle DELETE operations without body", () => {
    const operations: BatchOperation[] = [
      { method: "DELETE", url: "customers(abc-123)", headers: { "If-Match": "*" } },
    ];
    const result = buildBatchRequest(operations);
    expect(result.requests[0].method).toBe("DELETE");
    expect(result.requests[0].body).toBeUndefined();
  });
});

describe("parseBatchResponse", () => {
  it("should parse successful responses", () => {
    const response = {
      responses: [
        { id: "0", status: 200, headers: {}, body: { displayName: "Updated" } },
        { id: "1", status: 201, headers: {}, body: { id: "new-id" } },
      ],
    };

    const results = parseBatchResponse(response);
    expect(results).toHaveLength(2);
    expect(results[0].success).toBe(true);
    expect(results[0].status).toBe(200);
    expect(results[0].body).toEqual({ displayName: "Updated" });
    expect(results[1].success).toBe(true);
    expect(results[1].status).toBe(201);
  });

  it("should parse mixed success/failure responses", () => {
    const response = {
      responses: [
        { id: "0", status: 200, headers: {}, body: { displayName: "OK" } },
        { id: "1", status: 400, headers: {}, body: { error: { code: "BadRequest", message: "Invalid" } } },
      ],
    };

    const results = parseBatchResponse(response);
    expect(results[0].success).toBe(true);
    expect(results[1].success).toBe(false);
    expect(results[1].status).toBe(400);
    expect(results[1].error).toBeDefined();
  });

  it("should handle 204 No Content responses", () => {
    const response = {
      responses: [
        { id: "0", status: 204, headers: {} },
      ],
    };

    const results = parseBatchResponse(response);
    expect(results[0].success).toBe(true);
    expect(results[0].status).toBe(204);
    expect(results[0].body).toBeUndefined();
  });
});
