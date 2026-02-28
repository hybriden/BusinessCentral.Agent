import { describe, it, expect } from "vitest";
import { BcError, parseBcError } from "../../../src/client/error-handler.js";

describe("parseBcError", () => {
  it("should parse BC validation error", () => {
    const errorBody = {
      error: {
        code: "BadRequest_InvalidFieldValue",
        message: "'Invalid Type' is not an option. The existing options are: Inventory,Service,Non-Inventory",
      },
    };
    const err = parseBcError(400, errorBody);
    expect(err).toBeInstanceOf(BcError);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("BadRequest_InvalidFieldValue");
    expect(err.message).toContain("Invalid Type");
    expect(err.isRetryable).toBe(false);
  });

  it("should identify 429 as retryable", () => {
    const errorBody = { error: { code: "TooManyRequests", message: "Rate limited" } };
    const err = parseBcError(429, errorBody);
    expect(err.isRetryable).toBe(true);
  });

  it("should identify 503 as retryable", () => {
    const errorBody = { error: { code: "ServiceUnavailable", message: "Try later" } };
    const err = parseBcError(503, errorBody);
    expect(err.isRetryable).toBe(true);
  });

  it("should identify 404 as not retryable", () => {
    const errorBody = { error: { code: "NotFound", message: "Entity not found" } };
    const err = parseBcError(404, errorBody);
    expect(err.isRetryable).toBe(false);
    expect(err.userMessage).toContain("not found");
  });

  it("should handle 409 concurrency conflict", () => {
    const errorBody = { error: { code: "Conflict", message: "Record modified by another user" } };
    const err = parseBcError(409, errorBody);
    expect(err.isRetryable).toBe(false);
    expect(err.userMessage).toContain("modified");
  });

  it("should handle non-standard error format", () => {
    const errorBody = "Something went wrong";
    const err = parseBcError(500, errorBody);
    expect(err).toBeInstanceOf(BcError);
    expect(err.statusCode).toBe(500);
  });
});
