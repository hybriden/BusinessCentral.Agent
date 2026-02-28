import { describe, it, expect, vi, beforeEach } from "vitest";
import { BcClient } from "../../../src/client/bc-client.js";
import type { BcConfig } from "../../../src/config.js";

const mockConfig: BcConfig = {
  tenantId: "test",
  environment: "sandbox",
  clientId: "test",
  redirectPort: 3847,
  apiVersion: "v2.0",
  baseUrl: "https://api.businesscentral.dynamics.com/v2.0/test/sandbox/api/v2.0",
  authUrl: "",
  tokenUrl: "",
  maxPageSize: 50,
  maxRetries: 3,
  requestTimeoutMs: 480000,
  scopes: [],
};

function createMockAuth() {
  return {
    getAccessToken: vi.fn().mockResolvedValue("test-token"),
    authenticate: vi.fn(),
  };
}

describe("BcClient", () => {
  let client: BcClient;
  let mockAuth: ReturnType<typeof createMockAuth>;

  beforeEach(() => {
    mockAuth = createMockAuth();
    client = new BcClient(mockConfig, mockAuth as any);
    vi.restoreAllMocks();
  });

  it("should construct correct URL for entity list", () => {
    const url = client.buildUrl("companies(abc-123)/customers");
    expect(url).toBe(
      "https://api.businesscentral.dynamics.com/v2.0/test/sandbox/api/v2.0/companies(abc-123)/customers"
    );
  });

  it("should include authorization header in requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ value: [] }), { status: 200 })
    );
    await client.list("companies(abc-123)/customers");
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );
  });

  it("should handle paginated responses with @odata.nextLink", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          value: [{ id: "1", displayName: "Customer 1" }],
          "@odata.nextLink": "https://api.businesscentral.dynamics.com/next-page",
          "@odata.count": 100,
        }),
        { status: 200 }
      )
    );
    const result = await client.list("companies(abc-123)/customers");
    expect(result.value).toHaveLength(1);
    expect(result.nextLink).toBe("https://api.businesscentral.dynamics.com/next-page");
    expect(result.count).toBe(100);
  });

  it("should retry on 429 with backoff", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: "TooManyRequests", message: "Rate limited" } }), {
          status: 429,
          headers: { "Retry-After": "1" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ value: [{ id: "1" }] }), { status: 200 })
      );
    const result = await client.list("companies(abc-123)/customers");
    expect(result.value).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("should throw BcError on non-retryable errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: "NotFound", message: "Not found" } }), { status: 404 })
    );
    await expect(client.get("companies(abc)/customers(bad-id)")).rejects.toThrow();
  });

  it("should create an entity", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "new-id", displayName: "Test" }), { status: 201 })
    );
    const result = await client.create("companies(abc)/customers", { displayName: "Test" });
    expect(result.id).toBe("new-id");
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("should update an entity with PATCH", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "123", displayName: "Updated" }), { status: 200 })
    );
    const result = await client.update("companies(abc)/customers(123)", { displayName: "Updated" });
    expect(result.displayName).toBe("Updated");
  });

  it("should delete an entity", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 204 })
    );
    await expect(client.delete("companies(abc)/customers(123)")).resolves.toBeUndefined();
  });

  it("should list companies", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({
        value: [{ id: "c1", name: "CRONUS", displayName: "CRONUS International" }]
      }), { status: 200 })
    );
    const companies = await client.listCompanies();
    expect(companies).toHaveLength(1);
    expect(companies[0].name).toBe("CRONUS");
  });

  it("should set and use company ID", () => {
    client.setCompany("abc-123");
    expect(client.getCompanyPath()).toBe("companies(abc-123)");
  });

  it("should throw when no company selected", () => {
    expect(() => client.getCompanyPath()).toThrow("Please select a company");
  });
});
