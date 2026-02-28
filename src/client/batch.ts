// src/client/batch.ts

export interface BatchOperation {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

export interface BatchRequestBody {
  requests: Array<{
    id: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: Record<string, unknown>;
  }>;
}

export interface BatchResult {
  success: boolean;
  status: number;
  body?: unknown;
  error?: string;
}

const MAX_BATCH_OPERATIONS = 100;

export function buildBatchRequest(operations: BatchOperation[]): BatchRequestBody {
  if (operations.length > MAX_BATCH_OPERATIONS) {
    throw new Error(
      `Batch request exceeds maximum of ${MAX_BATCH_OPERATIONS} operations. Got ${operations.length}.`
    );
  }

  return {
    requests: operations.map((op, index) => {
      const headers: Record<string, string> = { ...op.headers };
      if (op.body) {
        headers["Content-Type"] = "application/json";
      }
      return {
        id: String(index),
        method: op.method,
        url: op.url,
        headers,
        ...(op.body ? { body: op.body } : {}),
      };
    }),
  };
}

export function parseBatchResponse(response: {
  responses: Array<{
    id: string | null;
    status: number;
    headers: Record<string, string>;
    body?: unknown;
  }>;
}): BatchResult[] {
  return response.responses.map((r) => {
    const success = r.status >= 200 && r.status < 300;
    return {
      success,
      status: r.status,
      body: r.body,
      error: !success
        ? ((r.body as any)?.error?.message || `HTTP ${r.status}`)
        : undefined,
    };
  });
}
